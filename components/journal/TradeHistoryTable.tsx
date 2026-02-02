'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Star, TrendingUp, TrendingDown, Search, Filter, ExternalLink } from 'lucide-react';
import { TradeReviewPanel } from './TradeReviewPanel';

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
    openFee: number;
    profit?: number;
    netProfit?: number;
    percentGain?: number;
    holdDays: number;
    status: 'open' | 'closed' | 'partial';
    review?: {
        rating: number;
        mindset: string[];
        strategyTags: string[];
        mistakeTags: string[];
        customTags: string[];
    } | null;
}

interface TradeHistoryTableProps {
    trades: TradePair[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onRefresh: () => void;
}

export function TradeHistoryTable({
    trades,
    pagination,
    onPageChange,
    onRefresh,
}: TradeHistoryTableProps) {
    const [selectedTrade, setSelectedTrade] = useState<TradePair | null>(null);
    const [showReviewPanel, setShowReviewPanel] = useState(false);
    const [symbolFilter, setSymbolFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleTradeClick = (trade: TradePair) => {
        setSelectedTrade(trade);
        setShowReviewPanel(true);
    };

    const filteredTrades = trades.filter((trade) => {
        const matchesSymbol = !symbolFilter || 
            trade.symbol?.toLowerCase().includes(symbolFilter.toLowerCase()) ||
            trade.name?.toLowerCase().includes(symbolFilter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
        return matchesSymbol && matchesStatus;
    });

    return (
        <div className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索股票代码或名称..."
                        value={symbolFilter}
                        onChange={(e) => setSymbolFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="状态筛选" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部状态</SelectItem>
                            <SelectItem value="open">持仓中</SelectItem>
                            <SelectItem value="closed">已平仓</SelectItem>
                            <SelectItem value="partial">部分平仓</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 交易表格 */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[120px]">Symbol</TableHead>
                            <TableHead className="w-[80px]">类型</TableHead>
                            <TableHead>开仓价/平仓价</TableHead>
                            <TableHead>开仓/平仓时间</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                            <TableHead className="text-right">净利润</TableHead>
                            <TableHead className="text-right">收益率</TableHead>
                            <TableHead className="text-center">评分</TableHead>
                            <TableHead>标签</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTrades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    暂无交易记录，请先导入数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTrades.map((trade) => (
                                <TableRow
                                    key={trade._id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleTradeClick(trade)}
                                >
                                    <TableCell>
                                        <div className="font-medium">{trade.symbol}</div>
                                        <div className="text-xs text-muted-foreground">{trade.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(trade.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-sm">
                                            {trade.openPrice?.toFixed(3)}
                                        </div>
                                        {trade.closePrice && (
                                            <div className="font-mono text-sm text-muted-foreground">
                                                → {trade.closePrice.toFixed(3)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(trade.openDate), 'MM-dd HH:mm')}
                                        </div>
                                        {trade.closeDate && (
                                            <div className="text-sm text-muted-foreground">
                                                → {format(new Date(trade.closeDate), 'MM-dd HH:mm')}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {trade.openVolume}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {trade.profit !== undefined && (
                                            <span className={trade.profit >= 0 ? 'text-red-500' : 'text-green-500'}>
                                                {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {trade.netProfit !== undefined && (
                                            <span className={trade.netProfit >= 0 ? 'text-red-500' : 'text-green-500'}>
                                                {trade.netProfit >= 0 ? '+' : ''}{trade.netProfit.toFixed(2)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {trade.percentGain !== undefined && (
                                            <span className={trade.percentGain >= 0 ? 'text-red-500' : 'text-green-500'}>
                                                {trade.percentGain >= 0 ? '+' : ''}{trade.percentGain.toFixed(2)}%
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {trade.review?.rating ? (
                                            <div className="flex justify-center">
                                                {renderStars(trade.review.rating)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {trade.review?.mindset?.slice(0, 2).map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {trade.review?.strategyTags?.slice(0, 2).map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {trade.review && (
                                                countTags(trade.review) > 4 && (
                                                    <Badge variant="ghost" className="text-xs">
                                                        +{countTags(trade.review) - 4}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTradeClick(trade);
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                                className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => onPageChange(page)}
                                    isActive={page === pagination.page}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* 复盘详情面板 */}
            <TradeReviewPanel
                trade={selectedTrade}
                open={showReviewPanel}
                onOpenChange={setShowReviewPanel}
                onSave={onRefresh}
            />
        </div>
    );
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'open':
            return <Badge variant="default">持仓</Badge>;
        case 'closed':
            return <Badge variant="secondary">已平仓</Badge>;
        case 'partial':
            return <Badge variant="outline">部分</Badge>;
        default:
            return <Badge variant="ghost">未知</Badge>;
    }
}

function renderStars(rating: number) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3 h-3 ${
                        star <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground'
                    }`}
                />
            ))}
        </div>
    );
}

function countTags(review: TradeReviewTable['review']) {
    if (!review) return 0;
    return (
        (review.mindset?.length || 0) +
        (review.strategyTags?.length || 0) +
        (review.mistakeTags?.length || 0) +
        (review.customTags?.length || 0)
    );
}

type TradeReviewTable = {
    review?: {
        rating: number;
        mindset: string[];
        strategyTags: string[];
        mistakeTags: string[];
        customTags: string[];
    };
};
