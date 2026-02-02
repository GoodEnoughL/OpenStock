'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Star, X, Plus, TrendingUp, TrendingDown, Clock, DollarSign, Percent, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { updateTradeReview, getUserTags, getTradePairDetail } from '@/lib/actions/trade.actions';
import { TradingViewChart } from './TradingViewChart';

interface TradePair {
    _id: string;
    symbol: string;
    name: string;
    openDate: string;
    closeDate?: string;
    openPrice: number;
    closePrice?: number;
    openVolume: number;
    closeVolume?: number;
    openAmount: number;
    closeAmount?: number;
    openFee: number;
    closeFee?: number;
    profit?: number;
    netProfit?: number;
    totalFee?: number;
    percentGain?: number;
    holdDays: number;
    status: 'open' | 'closed' | 'partial';
}

interface TradeReviewData {
    rating: number;
    mindset: string[];
    strategyTags: string[];
    mistakeTags: string[];
    customTags: string[];
    notes: string;
    takeProfit?: number;
    stopLoss?: number;
    tradePlan?: string;
    improvements?: string;
}

interface TradeReviewPanelProps {
    trade: TradePair | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave?: () => void;
}

export function TradeReviewPanel({ trade, open, onOpenChange, onSave }: TradeReviewPanelProps) {
    const [review, setReview] = useState<Partial<TradeReviewData>>({});
    const [userTags, setUserTags] = useState<{
        mindsetTags: string[];
        strategyTags: string[];
        mistakeTags: string[];
        customTags: string[];
    }>({
        mindsetTags: [],
        strategyTags: [],
        mistakeTags: [],
        customTags: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [tradeDetail, setTradeDetail] = useState<any>(null);

    useEffect(() => {
        if (open && trade) {
            loadUserTags();
            loadTradeDetail();
        }
    }, [open, trade]);

    const loadUserTags = async () => {
        try {
            // 这里需要从父组件传入 userId 或从 session 获取
            // 简化处理，使用默认标签
            setUserTags({
                mindsetTags: ['贪婪', '恐惧', '冲动', '犹豫', '冷静', '自信', '焦虑', '兴奋', '耐心', '急躁'],
                strategyTags: ['趋势跟踪', '价值投资', '波段操作', '日内交易', '突破交易', '回调买入', '均线策略', '定投'],
                mistakeTags: ['追涨杀跌', '止损不及时', '仓位过重', '频繁交易', '逆势操作', '没有计划', '情绪化交易', '过早止盈'],
                customTags: [],
            });
        } catch (error) {
            console.error('Load user tags error:', error);
        }
    };

    const loadTradeDetail = async () => {
        if (!trade) return;
        try {
            // 这里需要从父组件传入 userId
            // const detail = await getTradePairDetail(userId, trade._id);
            // setReview(detail.review || {});
            // setTradeDetail(detail);
        } catch (error) {
            console.error('Load trade detail error:', error);
        }
    };

    const handleSave = async () => {
        if (!trade) return;
        setIsSaving(true);
        try {
            // 这里需要传入 userId
            // await updateTradeReview(userId, trade._id, review);
            toast.success('复盘记录已保存');
            onSave?.();
            onOpenChange(false);
        } catch (error) {
            toast.error('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (category: keyof TradeReviewData, tag: string) => {
        const currentTags = (review[category] as string[]) || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter((t) => t !== tag)
            : [...currentTags, tag];
        setReview({ ...review, [category]: newTags });
    };

    const addCustomTag = (category: 'customTags' | 'mindset' | 'strategyTags' | 'mistakeTags', input: string) => {
        if (!input.trim()) return;
        const currentTags = (review[category] as string[]) || [];
        if (!currentTags.includes(input.trim())) {
            setReview({ ...review, [category]: [...currentTags, input.trim()] });
        }
    };

    if (!trade) return null;

    const isProfit = (trade.netProfit || 0) >= 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-3">
                            <span className="text-xl font-bold">{trade.symbol}</span>
                            <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                                {trade.status === 'open' ? '持仓中' : '已平仓'}
                            </Badge>
                        </SheetTitle>
                        <div className={`text-2xl font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                            {isProfit ? '+' : ''}{trade.netProfit?.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {trade.name} · 持仓 {trade.holdDays} 天
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* 交易概览 */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">开仓价格</div>
                                <div className="text-lg font-mono">{trade.openPrice?.toFixed(3)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(trade.openDate), 'yyyy-MM-dd HH:mm')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">平仓价格</div>
                                <div className="text-lg font-mono">
                                    {trade.closePrice?.toFixed(3) || '-'}
                                </div>
                                {trade.closeDate && (
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(trade.closeDate), 'yyyy-MM-dd HH:mm')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">成交数量</div>
                                <div className="text-lg font-mono">{trade.openVolume}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">收益率</div>
                                <div className={`text-lg font-mono ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                                    {trade.percentGain !== undefined ? `${trade.percentGain >= 0 ? '+' : ''}${trade.percentGain.toFixed(2)}%` : '-'}
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="chart" className="w-full">
                            <TabsList className="w-full grid grid-cols-4">
                                <TabsTrigger value="chart">图表</TabsTrigger>
                                <TabsTrigger value="metrics">交易指标</TabsTrigger>
                                <TabsTrigger value="tags">交易标签</TabsTrigger>
                                <TabsTrigger value="notes">日志</TabsTrigger>
                            </TabsList>

                            {/* 图表 Tab */}
                            <TabsContent value="chart" className="mt-4">
                                <div className="space-y-4">
                                    <div className="h-[400px] border rounded-lg overflow-hidden">
                                        <TradingViewChart
                                            symbol={convertToTradingViewSymbol(trade.symbol)}
                                            openDate={trade.openDate}
                                            closeDate={trade.closeDate}
                                            openPrice={trade.openPrice}
                                            closePrice={trade.closePrice}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span>买入点 (B)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>卖出点 (S)</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* 交易指标 Tab */}
                            <TabsContent value="metrics" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">交易信息</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>订单类型</span>
                                                <Badge variant="outline">{trade.status === 'open' ? 'Buy' : 'Sell'}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>符号</span>
                                                <span className="font-mono">{trade.symbol}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>手数</span>
                                                <span className="font-mono">{trade.openVolume}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">开放时间</div>
                                        <div className="text-sm font-mono">
                                            {format(new Date(trade.openDate), 'MMM d, yyyy, h:mm a')}
                                        </div>
                                        {trade.closeDate && (
                                            <>
                                                <div className="text-sm text-muted-foreground mt-2 mb-1">关闭时间</div>
                                                <div className="text-sm font-mono">
                                                    {format(new Date(trade.closeDate), 'MMM d, yyyy, h:mm a')}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">价格概要</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>开仓价</span>
                                                <span className="font-mono">{trade.openPrice?.toFixed(5)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>收盘价</span>
                                                <span className="font-mono">{trade.closePrice?.toFixed(5) || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">交易成本</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>开仓费用</span>
                                                <span className="font-mono text-red-500">-{trade.openFee?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>平仓费用</span>
                                                <span className="font-mono text-red-500">-{trade.closeFee?.toFixed(2) || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-2">交易结果</div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-muted-foreground">毛利润</div>
                                            <div className={`text-lg font-mono ${(trade.profit || 0) >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                {trade.profit?.toFixed(2) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">净利润</div>
                                            <div className={`text-lg font-mono ${isProfit ? 'text-blue-500' : 'text-red-500'}`}>
                                                {trade.netProfit?.toFixed(2) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">百分比收益</div>
                                            <div className={`text-lg font-mono ${(trade.percentGain || 0) >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                {trade.percentGain?.toFixed(2) || '-'}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>止盈价格</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="设置止盈价格"
                                            value={review.takeProfit || ''}
                                            onChange={(e) => setReview({ ...review, takeProfit: parseFloat(e.target.value) })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>止损价格</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="设置止损价格"
                                            value={review.stopLoss || ''}
                                            onChange={(e) => setReview({ ...review, stopLoss: parseFloat(e.target.value) })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* 标签 Tab */}
                            <TabsContent value="tags" className="mt-4 space-y-6">
                                {/* 评分 */}
                                <div>
                                    <Label className="mb-2 block">交易评分</Label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReview({ ...review, rating: star })}
                                                className="p-1 hover:scale-110 transition-transform"
                                            >
                                                <Star
                                                    className={`w-8 h-8 ${
                                                        star <= (review.rating || 0)
                                                            ? 'text-yellow-500 fill-yellow-500'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* 心态标签 */}
                                <TagSection
                                    title="Mindset"
                                    icon={<TrendingUp className="w-4 h-4" />}
                                    tags={userTags.mindsetTags}
                                    selectedTags={review.mindset || []}
                                    onToggle={(tag) => toggleTag('mindset', tag)}
                                    onAdd={(tag) => addCustomTag('mindset', tag)}
                                />

                                {/* 策略标签 */}
                                <TagSection
                                    title="Strategy Tags"
                                    icon={<Tag className="w-4 h-4" />}
                                    tags={userTags.strategyTags}
                                    selectedTags={review.strategyTags || []}
                                    onToggle={(tag) => toggleTag('strategyTags', tag)}
                                    onAdd={(tag) => addCustomTag('strategyTags', tag)}
                                    variant="secondary"
                                />

                                {/* 错误标签 */}
                                <TagSection
                                    title="Mistake Tags"
                                    icon={<TrendingDown className="w-4 h-4" />}
                                    tags={userTags.mistakeTags}
                                    selectedTags={review.mistakeTags || []}
                                    onToggle={(tag) => toggleTag('mistakeTags', tag)}
                                    onAdd={(tag) => addCustomTag('mistakeTags', tag)}
                                    variant="destructive"
                                />

                                {/* 自定义标签 */}
                                <TagSection
                                    title="Custom Tags"
                                    icon={<Plus className="w-4 h-4" />}
                                    tags={userTags.customTags}
                                    selectedTags={review.customTags || []}
                                    onToggle={(tag) => toggleTag('customTags', tag)}
                                    onAdd={(tag) => addCustomTag('customTags', tag)}
                                    variant="outline"
                                    allowCustom
                                />
                            </TabsContent>

                            {/* 日志 Tab */}
                            <TabsContent value="notes" className="mt-4 space-y-4">
                                <div>
                                    <Label>交易笔记</Label>
                                    <Textarea
                                        placeholder="记录这笔交易的分析、心得和教训..."
                                        value={review.notes || ''}
                                        onChange={(e) => setReview({ ...review, notes: e.target.value })}
                                        className="mt-1 min-h-[150px]"
                                    />
                                </div>
                                <div>
                                    <Label>交易计划</Label>
                                    <Textarea
                                        placeholder="记录入场和出场的计划..."
                                        value={review.tradePlan || ''}
                                        onChange={(e) => setReview({ ...review, tradePlan: e.target.value })}
                                        className="mt-1 min-h-[100px]"
                                    />
                                </div>
                                <div>
                                    <Label>改进建议</Label>
                                    <Textarea
                                        placeholder="记录下次可以改进的地方..."
                                        value={review.improvements || ''}
                                        onChange={(e) => setReview({ ...review, improvements: e.target.value })}
                                        className="mt-1 min-h-[100px]"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>

                <div className="px-6 py-4 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? '保存中...' : '保存复盘'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface TagSectionProps {
    title: string;
    icon: React.ReactNode;
    tags: string[];
    selectedTags: string[];
    onToggle: (tag: string) => void;
    onAdd: (tag: string) => void;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    allowCustom?: boolean;
}

function TagSection({ title, icon, tags, selectedTags, onToggle, onAdd, variant = 'default', allowCustom }: TagSectionProps) {
    const [newTag, setNewTag] = useState('');

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <Label>{title}</Label>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? variant : 'outline'}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => onToggle(tag)}
                    >
                        {tag}
                        {selectedTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                ))}
                {allowCustom && (
                    <div className="flex items-center gap-1">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="添加标签"
                            className="h-7 w-24 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onAdd(newTag);
                                    setNewTag('');
                                }
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => {
                                onAdd(newTag);
                                setNewTag('');
                            }}
                        >
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// A股代码转换为 TradingView 格式
function convertToTradingViewSymbol(symbol?: string): string {
    if (!symbol) return '';
    
    // 上海股票 (6开头)
    if (symbol.startsWith('6')) {
        return `SSE:${symbol}`;
    }
    // 深圳股票 (0, 3开头)
    if (symbol.startsWith('0') || symbol.startsWith('3')) {
        return `SZSE:${symbol}`;
    }
    // ETF
    if (symbol.startsWith('51') || symbol.startsWith('50')) {
        return `SSE:${symbol}`;
    }
    if (symbol.startsWith('15') || symbol.startsWith('16')) {
        return `SZSE:${symbol}`;
    }
    
    return symbol;
}
