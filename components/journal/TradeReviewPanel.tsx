'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
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
import { Star, X, Plus, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { updateTradeReview, getUserTags } from '@/lib/actions/trade.actions';
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

    useEffect(() => {
        if (open && trade) {
            loadUserTags();
            // Reset review when opening new trade
            setReview({
                rating: 3,
                mindset: [],
                strategyTags: [],
                mistakeTags: [],
                customTags: [],
                notes: '',
            });
        }
    }, [open, trade]);

    const loadUserTags = async () => {
        // Default tags - in production these would come from user settings
        setUserTags({
            mindsetTags: ['Greedy', 'Fearful', 'Impulsive', 'Hesitant', 'Calm', 'Confident', 'Anxious', 'Excited', 'Patient', 'Impatient'],
            strategyTags: ['Trend Following', 'Value Investing', 'Swing Trading', 'Day Trading', 'Breakout', 'Pullback', 'MA Strategy', 'DCA'],
            mistakeTags: ['Chasing', 'Late Stop Loss', 'Heavy Position', 'Over Trading', 'Against Trend', 'No Plan', 'Emotional', 'Early Take Profit'],
            customTags: [],
        });
    };

    const handleSave = async () => {
        if (!trade) return;
        setIsSaving(true);
        try {
            // Note: userId should come from context or props in real implementation
            await updateTradeReview('temp-user-id', trade._id, review);
            toast.success('Review saved successfully');
            onSave?.();
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to save review');
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
    const totalCommission = trade.openFee + (trade.closeFee || 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-4xl overflow-hidden flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-3">
                            <span className="text-xl font-bold">{trade.symbol}</span>
                            <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                                {trade.status === 'open' ? 'Open' : 'Closed'}
                            </Badge>
                        </SheetTitle>
                        <div className={`text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}{trade.netProfit?.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {trade.name} · Held for {trade.holdDays} days
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* Trade Overview */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Open Price</div>
                                <div className="text-lg font-mono">{trade.openPrice?.toFixed(3)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(trade.openDate), 'yyyy-MM-dd HH:mm')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Close Price</div>
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
                                <div className="text-sm text-muted-foreground mb-1">Volume</div>
                                <div className="text-lg font-mono">{trade.openVolume}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Return %</div>
                                <div className={`text-lg font-mono ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.percentGain !== undefined ? `${trade.percentGain >= 0 ? '+' : ''}${trade.percentGain.toFixed(2)}%` : '-'}
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="chart" className="w-full">
                            <TabsList className="w-full grid grid-cols-4">
                                <TabsTrigger value="chart">Chart</TabsTrigger>
                                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                                <TabsTrigger value="tags">Tags</TabsTrigger>
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                            </TabsList>

                            {/* Chart Tab */}
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
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>Buy (B)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span>Sell (S)</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Metrics Tab */}
                            <TabsContent value="metrics" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">Trade Info</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Order Type</span>
                                                <Badge variant="outline">{trade.status === 'open' ? 'Buy' : 'Sell'}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Symbol</span>
                                                <span className="font-mono">{trade.symbol}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Volume</span>
                                                <span className="font-mono">{trade.openVolume}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">Open Time</div>
                                        <div className="text-sm font-mono">
                                            {format(new Date(trade.openDate), 'MMM d, yyyy, h:mm a')}
                                        </div>
                                        {trade.closeDate && (
                                            <>
                                                <div className="text-sm text-muted-foreground mt-2 mb-1">Close Time</div>
                                                <div className="text-sm font-mono">
                                                    {format(new Date(trade.closeDate), 'MMM d, yyyy, h:mm a')}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">Price Summary</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Open Price</span>
                                                <span className="font-mono">{trade.openPrice?.toFixed(5)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Close Price</span>
                                                <span className="font-mono">{trade.closePrice?.toFixed(5) || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-2">Trading Costs</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Open Commission</span>
                                                <span className="font-mono text-red-500">-{trade.openFee?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Close Commission</span>
                                                <span className="font-mono text-red-500">-{trade.closeFee?.toFixed(2) || '-'}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 mt-1">
                                                <span>Total Commission</span>
                                                <span className="font-mono text-red-500">-{totalCommission.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Swap Fee</span>
                                                <span className="font-mono">-</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-2">Trade Result</div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Gross Profit</div>
                                            <div className={`text-lg font-mono ${(trade.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {trade.profit?.toFixed(2) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Net Profit</div>
                                            <div className={`text-lg font-mono ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                                {trade.netProfit?.toFixed(2) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Return %</div>
                                            <div className={`text-lg font-mono ${(trade.percentGain || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {trade.percentGain?.toFixed(2) || '-'}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Take Profit</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="Set take profit price"
                                            value={review.takeProfit || ''}
                                            onChange={(e) => setReview({ ...review, takeProfit: parseFloat(e.target.value) })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Stop Loss</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="Set stop loss price"
                                            value={review.stopLoss || ''}
                                            onChange={(e) => setReview({ ...review, stopLoss: parseFloat(e.target.value) })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tags Tab */}
                            <TabsContent value="tags" className="mt-4 space-y-6">
                                {/* Rating */}
                                <div>
                                    <Label className="mb-2 block">Trade Rating</Label>
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

                                {/* Mindset Tags */}
                                <TagSection
                                    title="Mindset"
                                    icon={<TrendingUp className="w-4 h-4" />}
                                    tags={userTags.mindsetTags}
                                    selectedTags={review.mindset || []}
                                    onToggle={(tag) => toggleTag('mindset', tag)}
                                    onAdd={(tag) => addCustomTag('mindset', tag)}
                                />

                                {/* Strategy Tags */}
                                <TagSection
                                    title="Strategy Tags"
                                    icon={<Tag className="w-4 h-4" />}
                                    tags={userTags.strategyTags}
                                    selectedTags={review.strategyTags || []}
                                    onToggle={(tag) => toggleTag('strategyTags', tag)}
                                    onAdd={(tag) => addCustomTag('strategyTags', tag)}
                                    variant="secondary"
                                />

                                {/* Mistake Tags */}
                                <TagSection
                                    title="Mistake Tags"
                                    icon={<TrendingDown className="w-4 h-4" />}
                                    tags={userTags.mistakeTags}
                                    selectedTags={review.mistakeTags || []}
                                    onToggle={(tag) => toggleTag('mistakeTags', tag)}
                                    onAdd={(tag) => addCustomTag('mistakeTags', tag)}
                                    variant="destructive"
                                />

                                {/* Custom Tags */}
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

                            {/* Notes Tab */}
                            <TabsContent value="notes" className="mt-4 space-y-4">
                                <div>
                                    <Label>Trade Comment</Label>
                                    <Textarea
                                        placeholder="Record your analysis, insights and lessons from this trade..."
                                        value={review.notes || ''}
                                        onChange={(e) => setReview({ ...review, notes: e.target.value })}
                                        className="mt-1 min-h-[150px]"
                                    />
                                </div>
                                <div>
                                    <Label>Trade Plan</Label>
                                    <Textarea
                                        placeholder="Record your entry and exit plan..."
                                        value={review.tradePlan || ''}
                                        onChange={(e) => setReview({ ...review, tradePlan: e.target.value })}
                                        className="mt-1 min-h-[100px]"
                                    />
                                </div>
                                <div>
                                    <Label>Improvements</Label>
                                    <Textarea
                                        placeholder="What can be improved next time..."
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
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Review'}
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
                            placeholder="Add tag"
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

// Convert A-share code to TradingView format
function convertToTradingViewSymbol(symbol?: string): string {
    if (!symbol) return '';
    
    // Shanghai stocks (6开头)
    if (symbol.startsWith('6')) {
        return `SSE:${symbol}`;
    }
    // Shenzhen stocks (0, 3开头)
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
