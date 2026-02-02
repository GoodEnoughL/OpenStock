'use server';

import { connectToDatabase } from '@/database/mongoose';
import { RawTrade, TradePair, TradeReview, UserTags, AccountStats } from '@/database/models/trade.model';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// ========== 数据导入 ==========

export interface ParsedTradeRow {
    tradeDate: string;
    symbol?: string;
    name?: string;
    operation: string;
    balance: number;
    volume: number;
    price?: number;
    amount?: number;
    flowAmount: number;
    fee: number;
    tax: number;
    otherFee: number;
    totalAmount: number;
    contractNo?: string;
    tradeNo?: string;
    market?: string;
    currency: string;
    stockBalance: number;
    marketName?: string;
    tradeTime?: string;
    marketCode?: string;
    [key: string]: any;
}

// 解析日期格式 20260129 -> Date
function parseTradeDate(dateStr: string): Date {
    if (!dateStr || dateStr.length !== 8) return new Date();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`);
}

// 解析金额（处理空字符串和逗号）
function parseAmount(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    const str = String(val).replace(/,/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// 导入交易数据
export async function importTrades(userId: string, rows: ParsedTradeRow[]) {
    try {
        await connectToDatabase();
        
        const trades = rows.map(row => {
            const tradeDate = parseTradeDate(row.tradeDate);
            
            return {
                userId,
                tradeDate,
                symbol: row.symbol || undefined,
                name: row.name || undefined,
                operation: row.operation || '',
                balance: parseAmount(row.balance),
                volume: parseAmount(row.volume),
                price: row.price ? parseAmount(row.price) : undefined,
                amount: row.amount ? parseAmount(row.amount) : undefined,
                flowAmount: parseAmount(row.flowAmount),
                fee: parseAmount(row.fee),
                tax: parseAmount(row.tax),
                otherFee: parseAmount(row.otherFee),
                totalAmount: parseAmount(row.totalAmount),
                contractNo: row.contractNo,
                tradeNo: row.tradeNo,
                market: row.market,
                currency: row.currency || '人民币',
                stockBalance: parseAmount(row.stockBalance),
                marketName: row.marketName,
                tradeTime: row.tradeTime,
                marketCode: row.marketCode,
                rawData: row,
            };
        });
        
        // 批量插入
        const result = await RawTrade.insertMany(trades);
        
        // 触发交易配对
        await matchTrades(userId);
        
        // 更新账户统计
        await calculateAccountStats(userId);
        
        revalidatePath('/journal');
        
        return { success: true, count: result.length };
    } catch (error) {
        console.error('Import trades error:', error);
        throw error;
    }
}

// ========== 交易配对算法 ==========

// 将买入卖出配对
export async function matchTrades(userId: string) {
    try {
        await connectToDatabase();
        
        // 获取所有未配对的买入交易（按时间排序）
        const buyTrades = await RawTrade.find({
            userId,
            operation: { $in: ['证券买入', '基金申购', '上海LOF申购确认', '深圳LOF基金申购确认'] },
            volume: { $gt: 0 },
        }).sort({ tradeDate: 1, tradeTime: 1 });
        
        // 获取所有卖出交易
        const sellTrades = await RawTrade.find({
            userId,
            operation: { $in: ['证券卖出', '基金赎回'] },
            volume: { $gt: 0 },
        }).sort({ tradeDate: 1, tradeTime: 1 });
        
        // 按股票分组处理
        const groupedBuys = groupBy(buyTrades, 'symbol');
        const groupedSells = groupBy(sellTrades, 'symbol');
        
        const allSymbols = new Set([...Object.keys(groupedBuys), ...Object.keys(groupedSells)]);
        
        for (const symbol of allSymbols) {
            const buys = groupedBuys[symbol] || [];
            const sells = groupedSells[symbol] || [];
            
            await matchSymbolTrades(userId, symbol, buys, sells);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Match trades error:', error);
        throw error;
    }
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((acc, item) => {
        const val = String(item[key] || 'unknown');
        if (!acc[val]) acc[val] = [];
        acc[val].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

async function matchSymbolTrades(userId: string, symbol: string, buys: any[], sells: any[]) {
    // 删除旧的未平仓配对
    await TradePair.deleteMany({ userId, symbol, status: 'open' });
    
    // 使用FIFO算法配对
    const buyQueue = [...buys];
    const sellQueue = [...sells];
    
    const newPairs: any[] = [];
    
    while (sellQueue.length > 0) {
        const sell = sellQueue.shift();
        if (!sell) break;
        
        let remainingSellVolume = sell.volume;
        const openTradeIds: string[] = [];
        const closeTradeIds: string[] = [sell._id.toString()];
        
        let totalOpenAmount = 0;
        let totalOpenFee = 0;
        
        while (remainingSellVolume > 0 && buyQueue.length > 0) {
            const buy = buyQueue[0];
            const matchVolume = Math.min(buy.volume, remainingSellVolume);
            
            // 按比例计算成本
            const buyCostRatio = matchVolume / buy.volume;
            totalOpenAmount += (buy.amount || 0) * buyCostRatio;
            totalOpenFee += buy.fee * buyCostRatio;
            
            openTradeIds.push(buy._id.toString());
            remainingSellVolume -= matchVolume;
            
            if (matchVolume >= buy.volume) {
                buyQueue.shift(); // 完全匹配，移除
            } else {
                // 部分匹配，修改买入记录的数量
                buy.volume -= matchVolume;
                buy.amount = (buy.amount || 0) * (buy.volume / (buy.volume + matchVolume));
                buy.fee = buy.fee * (buy.volume / (buy.volume + matchVolume));
            }
        }
        
        if (openTradeIds.length > 0) {
            const closeAmount = sell.amount || 0;
            const closeFee = sell.fee;
            
            const profit = closeAmount - totalOpenAmount;
            const totalFee = totalOpenFee + closeFee;
            const netProfit = profit - totalFee;
            const percentGain = totalOpenAmount > 0 ? (netProfit / totalOpenAmount) * 100 : 0;
            
            const openDate = buys.find(b => b._id.toString() === openTradeIds[0])?.tradeDate;
            const closeDate = sell.tradeDate;
            const holdDays = openDate ? Math.ceil((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            newPairs.push({
                userId,
                symbol,
                name: sell.name || buys.find(b => b._id.toString() === openTradeIds[0])?.name || '',
                openDate,
                openPrice: totalOpenAmount / (sell.volume - remainingSellVolume),
                openVolume: sell.volume - remainingSellVolume,
                openAmount: totalOpenAmount,
                openFee: totalOpenFee,
                closeDate,
                closePrice: sell.price || 0,
                closeVolume: sell.volume - remainingSellVolume,
                closeAmount,
                closeFee,
                profit,
                netProfit,
                totalFee,
                percentGain,
                holdDays,
                status: 'closed' as const,
                openTradeIds,
                closeTradeIds,
            });
        }
    }
    
    // 处理剩余未平仓的买入
    for (const buy of buyQueue) {
        if (buy.volume > 0) {
            newPairs.push({
                userId,
                symbol,
                name: buy.name || '',
                openDate: buy.tradeDate,
                openPrice: buy.price || 0,
                openVolume: buy.volume,
                openAmount: buy.amount || 0,
                openFee: buy.fee,
                status: 'open' as const,
                openTradeIds: [buy._id.toString()],
                closeTradeIds: [],
            });
        }
    }
    
    if (newPairs.length > 0) {
        await TradePair.insertMany(newPairs);
    }
}

// ========== 查询功能 ==========

// 获取交易历史（支持分页和筛选）
export async function getTradeHistory(
    userId: string,
    options: {
        symbol?: string;
        status?: 'open' | 'closed' | 'partial';
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    } = {}
) {
    try {
        await connectToDatabase();
        
        const { symbol, status, startDate, endDate, page = 1, limit = 50 } = options;
        
        const query: any = { userId };
        if (symbol) query.symbol = symbol.toUpperCase();
        if (status) query.status = status;
        if (startDate || endDate) {
            query.openDate = {};
            if (startDate) query.openDate.$gte = startDate;
            if (endDate) query.openDate.$lte = endDate;
        }
        
        const skip = (page - 1) * limit;
        
        const [tradePairs, total] = await Promise.all([
            TradePair.find(query)
                .sort({ openDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            TradePair.countDocuments(query),
        ]);
        
        // 获取复盘信息
        const pairIds = tradePairs.map(p => p._id.toString());
        const reviews = await TradeReview.find({
            userId,
            tradePairId: { $in: pairIds },
        }).lean();
        
        const reviewMap = new Map(reviews.map(r => [r.tradePairId.toString(), r]));
        
        const enrichedTrades = tradePairs.map(pair => ({
            ...pair,
            review: reviewMap.get(pair._id.toString()) || null,
        }));
        
        return {
            trades: enrichedTrades,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('Get trade history error:', error);
        throw error;
    }
}

// 获取单个交易对详情
export async function getTradePairDetail(userId: string, tradePairId: string) {
    try {
        await connectToDatabase();
        
        const tradePair = await TradePair.findOne({
            _id: new mongoose.Types.ObjectId(tradePairId),
            userId,
        }).lean();
        
        if (!tradePair) throw new Error('Trade pair not found');
        
        // 获取复盘记录
        const review = await TradeReview.findOne({
            userId,
            tradePairId,
        }).lean();
        
        // 获取原始交易详情
        const [openTrades, closeTrades] = await Promise.all([
            RawTrade.find({ _id: { $in: tradePair.openTradeIds } }).lean(),
            RawTrade.find({ _id: { $in: tradePair.closeTradeIds } }).lean(),
        ]);
        
        return {
            tradePair,
            review,
            openTrades,
            closeTrades,
        };
    } catch (error) {
        console.error('Get trade pair detail error:', error);
        throw error;
    }
}

// ========== 复盘相关 ==========

// 更新复盘记录
export async function updateTradeReview(
    userId: string,
    tradePairId: string,
    data: {
        rating?: number;
        mindset?: string[];
        strategyTags?: string[];
        mistakeTags?: string[];
        customTags?: string[];
        notes?: string;
        takeProfit?: number;
        stopLoss?: number;
        tradePlan?: string;
        improvements?: string;
    }
) {
    try {
        await connectToDatabase();
        
        const review = await TradeReview.findOneAndUpdate(
            { userId, tradePairId },
            {
                ...data,
                userId,
                tradePairId,
            },
            { upsert: true, new: true }
        );
        
        revalidatePath('/journal');
        return { success: true, review };
    } catch (error) {
        console.error('Update trade review error:', error);
        throw error;
    }
}

// 获取用户的标签配置
export async function getUserTags(userId: string) {
    try {
        await connectToDatabase();
        
        let tags = await UserTags.findOne({ userId }).lean();
        
        if (!tags) {
            // 创建默认标签
            const newTags = await UserTags.create({ userId });
            return {
                userId,
                mindsetTags: newTags.mindsetTags,
                strategyTags: newTags.strategyTags,
                mistakeTags: newTags.mistakeTags,
                customTags: newTags.customTags,
            };
        }
        
        return tags;
    } catch (error) {
        console.error('Get user tags error:', error);
        throw error;
    }
}

// 更新用户标签
export async function updateUserTags(
    userId: string,
    data: {
        mindsetTags?: string[];
        strategyTags?: string[];
        mistakeTags?: string[];
        customTags?: string[];
    }
) {
    try {
        await connectToDatabase();
        
        const tags = await UserTags.findOneAndUpdate(
            { userId },
            { $set: data },
            { upsert: true, new: true }
        );
        
        return { success: true, tags };
    } catch (error) {
        console.error('Update user tags error:', error);
        throw error;
    }
}

// ========== 账户统计 ==========

// 计算账户统计
export async function calculateAccountStats(userId: string) {
    try {
        await connectToDatabase();
        
        // 获取所有已平仓交易
        const closedTrades = await TradePair.find({
            userId,
            status: 'closed',
        }).lean();
        
        // 获取未平仓持仓
        const openTrades = await TradePair.find({
            userId,
            status: 'open',
        }).lean();
        
        // 获取最新资金余额
        const latestTrade = await RawTrade.findOne({ userId })
            .sort({ tradeDate: -1 })
            .lean();
        
        const cashBalance = latestTrade?.balance || 0;
        
        // 计算持仓市值（需要实时价格，这里用成本价）
        const positions = openTrades.map(t => ({
            symbol: t.symbol,
            name: t.name,
            volume: t.openVolume,
            avgCost: t.openPrice,
            marketValue: t.openAmount,
            profit: 0,
            percentGain: 0,
        }));
        
        const marketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
        const totalEquity = cashBalance + marketValue;
        
        // 计算累计盈亏
        const totalProfit = closedTrades.reduce((sum, t) => sum + t.netProfit, 0);
        const winningTrades = closedTrades.filter(t => t.netProfit > 0).length;
        const losingTrades = closedTrades.filter(t => t.netProfit <= 0).length;
        const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
        
        // 保存统计
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await AccountStats.findOneAndUpdate(
            { userId, date: today },
            {
                totalEquity,
                cashBalance,
                marketValue,
                totalProfit,
                winningTrades,
                losingTrades,
                winRate,
                totalTrades: closedTrades.length,
                positions,
            },
            { upsert: true }
        );
        
        return {
            totalEquity,
            cashBalance,
            marketValue,
            totalProfit,
            winRate,
            positions,
        };
    } catch (error) {
        console.error('Calculate account stats error:', error);
        throw error;
    }
}

// 获取账户统计历史
export async function getAccountStats(userId: string, days: number = 30) {
    try {
        await connectToDatabase();
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const stats = await AccountStats.find({
            userId,
            date: { $gte: startDate },
        })
            .sort({ date: 1 })
            .lean();
        
        return stats;
    } catch (error) {
        console.error('Get account stats error:', error);
        throw error;
    }
}

// 获取持仓概览
export async function getPositions(userId: string) {
    try {
        await connectToDatabase();
        
        const openTrades = await TradePair.find({
            userId,
            status: 'open',
        }).lean();
        
        // 合并相同股票的持仓
        const positionMap = new Map();
        
        for (const trade of openTrades) {
            const existing = positionMap.get(trade.symbol);
            if (existing) {
                const totalVolume = existing.volume + trade.openVolume;
                const totalAmount = existing.avgCost * existing.volume + trade.openPrice * trade.openVolume;
                existing.volume = totalVolume;
                existing.avgCost = totalAmount / totalVolume;
                existing.marketValue = totalAmount;
            } else {
                positionMap.set(trade.symbol, {
                    symbol: trade.symbol,
                    name: trade.name,
                    volume: trade.openVolume,
                    avgCost: trade.openPrice,
                    marketValue: trade.openAmount,
                });
            }
        }
        
        return Array.from(positionMap.values());
    } catch (error) {
        console.error('Get positions error:', error);
        throw error;
    }
}

// 删除导入的数据（用于重新导入）
export async function clearUserTrades(userId: string) {
    try {
        await connectToDatabase();
        
        await Promise.all([
            RawTrade.deleteMany({ userId }),
            TradePair.deleteMany({ userId }),
            TradeReview.deleteMany({ userId }),
            AccountStats.deleteMany({ userId }),
        ]);
        
        revalidatePath('/journal');
        return { success: true };
    } catch (error) {
        console.error('Clear user trades error:', error);
        throw error;
    }
}
