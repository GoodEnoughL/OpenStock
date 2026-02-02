import { Schema, model, models, type Document, type Model } from 'mongoose';

// 原始交易记录（从Excel导入）
export interface RawTrade extends Document {
    userId: string;
    tradeDate: Date;           // 成交日期
    symbol?: string;           // 证券代码
    name?: string;             // 证券名称
    operation: string;         // 操作 (证券买入/证券卖出/银行转证券/证券转银行等)
    balance: number;           // 资金余额
    volume: number;            // 成交数量
    price?: number;            // 成交均价
    amount?: number;           // 成交金额
    flowAmount: number;        // 发生金额
    fee: number;               // 手续费
    tax: number;               // 印花税
    otherFee: number;          // 其他杂费
    totalAmount: number;       // 本次金额
    contractNo?: string;       // 合同编号
    tradeNo?: string;          // 成交编号
    market?: string;           // 交易市场
    currency: string;          // 币种
    stockBalance: number;      // 股票余额
    marketName?: string;       // 市场名称
    tradeTime?: string;        // 成交时间
    marketCode?: string;       // 市场代码
    
    // 导入元数据
    importedAt: Date;
    rawData: Record<string, any>; // 原始行数据备份
}

const RawTradeSchema = new Schema<RawTrade>(
    {
        userId: { type: String, required: true, index: true },
        tradeDate: { type: Date, required: true },
        symbol: { type: String, uppercase: true, trim: true },
        name: { type: String, trim: true },
        operation: { type: String, required: true },
        balance: { type: Number, default: 0 },
        volume: { type: Number, default: 0 },
        price: { type: Number },
        amount: { type: Number },
        flowAmount: { type: Number, default: 0 },
        fee: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        otherFee: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        contractNo: { type: String },
        tradeNo: { type: String },
        market: { type: String },
        currency: { type: String, default: '人民币' },
        stockBalance: { type: Number, default: 0 },
        marketName: { type: String },
        tradeTime: { type: String },
        marketCode: { type: String },
        importedAt: { type: Date, default: Date.now },
        rawData: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

RawTradeSchema.index({ userId: 1, tradeDate: -1 });
RawTradeSchema.index({ userId: 1, symbol: 1, tradeDate: -1 });

export const RawTrade: Model<RawTrade> =
    (models?.RawTrade as Model<RawTrade>) || model<RawTrade>('RawTrade', RawTradeSchema);

// 交易对（买入卖出配对）
export interface TradePair extends Document {
    userId: string;
    symbol: string;
    name: string;
    
    // 开仓信息
    openDate: Date;
    openPrice: number;
    openVolume: number;
    openAmount: number;
    openFee: number;
    
    // 平仓信息
    closeDate?: Date;
    closePrice?: number;
    closeVolume?: number;
    closeAmount?: number;
    closeFee?: number;
    
    // 计算字段
    profit: number;           // 毛利润
    netProfit: number;        // 净利润（扣除费用）
    totalFee: number;         // 总费用
    percentGain: number;      // 收益率 %
    holdDays: number;         // 持仓天数
    
    // 状态
    status: 'open' | 'closed' | 'partial';
    
    // 关联的原始交易ID
    openTradeIds: string[];
    closeTradeIds: string[];
    
    createdAt: Date;
    updatedAt: Date;
}

const TradePairSchema = new Schema<TradePair>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true },
        name: { type: String },
        
        openDate: { type: Date, required: true },
        openPrice: { type: Number, required: true },
        openVolume: { type: Number, required: true },
        openAmount: { type: Number, required: true },
        openFee: { type: Number, default: 0 },
        
        closeDate: { type: Date },
        closePrice: { type: Number },
        closeVolume: { type: Number },
        closeAmount: { type: Number },
        closeFee: { type: Number, default: 0 },
        
        profit: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        totalFee: { type: Number, default: 0 },
        percentGain: { type: Number, default: 0 },
        holdDays: { type: Number, default: 0 },
        
        status: { type: String, enum: ['open', 'closed', 'partial'], default: 'open' },
        
        openTradeIds: [{ type: Schema.Types.ObjectId, ref: 'RawTrade' }],
        closeTradeIds: [{ type: Schema.Types.ObjectId, ref: 'RawTrade' }],
    },
    { timestamps: true }
);

TradePairSchema.index({ userId: 1, status: 1 });
TradePairSchema.index({ userId: 1, symbol: 1 });
TradePairSchema.index({ userId: 1, openDate: -1 });

export const TradePair: Model<TradePair> =
    (models?.TradePair as Model<TradePair>) || model<TradePair>('TradePair', TradePairSchema);

// 复盘记录
export interface TradeReview extends Document {
    userId: string;
    tradePairId: string;
    
    // 评分 1-5
    rating: number;
    
    // 心态标签
    mindset: string[];
    
    // 策略标签
    strategyTags: string[];
    
    // 错误标签
    mistakeTags: string[];
    
    // 自定义标签
    customTags: string[];
    
    // 交易笔记
    notes: string;
    
    // 截图/图片
    screenshots?: string[];
    
    // 止盈止损（手动记录）
    takeProfit?: number;
    stopLoss?: number;
    
    // 交易计划
    tradePlan?: string;
    
    // 改进建议
    improvements?: string;
    
    updatedAt: Date;
    createdAt: Date;
}

const TradeReviewSchema = new Schema<TradeReview>(
    {
        userId: { type: String, required: true, index: true },
        tradePairId: { type: String, required: true, unique: true },
        rating: { type: Number, min: 1, max: 5, default: 3 },
        mindset: [{ type: String }],
        strategyTags: [{ type: String }],
        mistakeTags: [{ type: String }],
        customTags: [{ type: String }],
        notes: { type: String, default: '' },
        screenshots: [{ type: String }],
        takeProfit: { type: Number },
        stopLoss: { type: Number },
        tradePlan: { type: String },
        improvements: { type: String },
    },
    { timestamps: true }
);

TradeReviewSchema.index({ userId: 1, rating: 1 });

export const TradeReview: Model<TradeReview> =
    (models?.TradeReview as Model<TradeReview>) || model<TradeReview>('TradeReview', TradeReviewSchema);

// 用户标签配置
export interface UserTags extends Document {
    userId: string;
    
    // 预定义的心态标签
    mindsetTags: string[];
    
    // 预定义的策略标签
    strategyTags: string[];
    
    // 预定义的错误标签
    mistakeTags: string[];
    
    // 预定义的自定义标签
    customTags: string[];
    
    updatedAt: Date;
}

const UserTagsSchema = new Schema<UserTags>(
    {
        userId: { type: String, required: true, unique: true },
        mindsetTags: { 
            type: [String], 
            default: ['贪婪', '恐惧', '冲动', '犹豫', '冷静', '自信', '焦虑', '兴奋'] 
        },
        strategyTags: { 
            type: [String], 
            default: ['趋势跟踪', '价值投资', '波段操作', '日内交易', '突破交易', '回调买入', '均线策略'] 
        },
        mistakeTags: { 
            type: [String], 
            default: ['追涨杀跌', '止损不及时', '仓位过重', '频繁交易', '逆势操作', '没有计划', '情绪化交易'] 
        },
        customTags: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const UserTags: Model<UserTags> =
    (models?.UserTags as Model<UserTags>) || model<UserTags>('UserTags', UserTagsSchema);

// 账户统计
export interface AccountStats extends Document {
    userId: string;
    date: Date;
    
    // 当日统计
    totalEquity: number;      // 总权益
    cashBalance: number;      // 现金余额
    marketValue: number;      // 市值
    
    // 当日盈亏
    dailyProfit: number;
    dailyReturn: number;
    
    // 累计统计
    totalProfit: number;      // 累计盈亏
    totalReturn: number;      // 累计收益率
    
    // 交易统计
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    
    // 持仓统计
    positions: {
        symbol: string;
        name: string;
        volume: number;
        avgCost: number;
        marketValue: number;
        profit: number;
        percentGain: number;
    }[];
    
    createdAt: Date;
}

const AccountStatsSchema = new Schema<AccountStats>(
    {
        userId: { type: String, required: true, index: true },
        date: { type: Date, required: true },
        totalEquity: { type: Number, default: 0 },
        cashBalance: { type: Number, default: 0 },
        marketValue: { type: Number, default: 0 },
        dailyProfit: { type: Number, default: 0 },
        dailyReturn: { type: Number, default: 0 },
        totalProfit: { type: Number, default: 0 },
        totalReturn: { type: Number, default: 0 },
        totalTrades: { type: Number, default: 0 },
        winningTrades: { type: Number, default: 0 },
        losingTrades: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        positions: [{
            symbol: String,
            name: String,
            volume: Number,
            avgCost: Number,
            marketValue: Number,
            profit: Number,
            percentGain: Number,
        }],
    },
    { timestamps: true }
);

AccountStatsSchema.index({ userId: 1, date: -1 }, { unique: true });

export const AccountStats: Model<AccountStats> =
    (models?.AccountStats as Model<AccountStats>) || model<AccountStats>('AccountStats', AccountStatsSchema);
