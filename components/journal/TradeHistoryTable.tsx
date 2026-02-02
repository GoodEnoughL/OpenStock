'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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
    closeFee?: number;
    profit?: number;
    netProfit?: number;
    totalFee?: number;
    percentGain?: number;
    holdDays: number;
    status: 'open' | 'closed' | 'partial';
    operation?: string; // 交易操作类型
    review?: {
        rating: number;
        mindset: string[];
        strategyTags: string[];
        mistakeTags: string[];
        customTags: string[];
        takeProfit?: number;
        stopLoss?: number;
        notes?: string;
    } | null;
}

// 操作类型映射：中文 -> 英文
const operationMap: Record<string, string> = {
    '证券买入': 'buy',
    '证券卖出': 'sell',
    '银行转证券': 'top up',
    '证券转银行': 'withdraw',
    '深圳LOF基金申购确认': 'buy',
    '上海LOF申购确认': 'buy',
    '基金申购': 'buy'
};

// 获取操作类型的英文显示
function getOperationDisplay(operation: string | undefined): string {
    if (!operation) return 'unknown';
    return operationMap[operation] || operation;
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
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search symbol or name..."
                        value={symbolFilter}
                        onChange={(e) => setSymbolFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Trade Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[100px]">Symbol</TableHead>
                                <TableHead className="w-[80px]">Type</TableHead>
                                <TableHead>Open Price</TableHead>
                                <TableHead>Close Price</TableHead>
                                <TableHead>Open Time</TableHead>
                                <TableHead>Close Time</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead className="text-right">Swap Fee</TableHead>
                                <TableHead className="text-right">Net Profit</TableHead>
                                <TableHead className="text-right">% Gain</TableHead>
                                <TableHead className="text-center">Ticket</TableHead>
                                <TableHead className="text-right">Take Profit</TableHead>
                                <TableHead className="text-right">Stop Loss</TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead>Placed By</TableHead>
                                <TableHead>Magic #</TableHead>
                                <TableHead className="text-center">Rating</TableHead>
                                <TableHead className="text-right">Hold Time</TableHead>
                                <TableHead>Mindset</TableHead>
                                <TableHead>Strategy</TableHead>
                                <TableHead>Mistakes</TableHead>
                                <TableHead>Custom</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTrades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={25} className="text-center py-8 text-muted-foreground">
                                        No trade records found. Please import data first.
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
                                            {getOperationBadge(trade.operation)}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {trade.openPrice?.toFixed(3)}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {trade.closePrice?.toFixed(3) || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(trade.openDate), 'MM-dd HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {trade.closeDate ? format(new Date(trade.closeDate), 'MM-dd HH:mm') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.openVolume}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.profit !== undefined ? (
                                                <span className={trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-red-500">
                                            {trade.totalFee ? `-${trade.totalFee.toFixed(2)}` : `-${(trade.openFee + (trade.closeFee || 0)).toFixed(2)}`}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-red-500">
                                            {/* Swap fee - not applicable for A-shares */}
                                            -
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.netProfit !== undefined ? (
                                                <span className={trade.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.netProfit >= 0 ? '+' : ''}{trade.netProfit.toFixed(2)}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.percentGain !== undefined ? (
                                                <span className={trade.percentGain >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.percentGain >= 0 ? '+' : ''}{trade.percentGain.toFixed(2)}%
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs">
                                            {trade._id.slice(-8)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.review?.takeProfit || '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.review?.stopLoss || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[150px] truncate">
                                            {trade.review?.notes || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            Self
                                        </TableCell>
                                        <TableCell className="text-center">
                                            -
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
                                        <TableCell className="text-right">
                                            {trade.holdDays}d
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {trade.review?.mindset?.slice(0, 2).map((tag, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {trade.review?.strategyTags?.slice(0, 2).map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {trade.review?.mistakeTags?.slice(0, 2).map((tag, i) => (
                                                    <Badge key={i} variant="destructive" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {trade.review?.customTags?.slice(0, 2).map((tag, i) => (
                                                    <Badge key={i} variant="ghost" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
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
            </div>

            {/* Pagination */}
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

            {/* Trade Review Panel */}
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
            return <Badge variant="default">Open</Badge>;
        case 'closed':
            return <Badge variant="secondary">Closed</Badge>;
        case 'partial':
            return <Badge variant="outline">Partial</Badge>;
        default:
            return <Badge variant="ghost">Unknown</Badge>;
    }
}

function getOperationBadge(operation: string | undefined) {
    const opDisplay = getOperationDisplay(operation);
    
    switch (opDisplay) {
        case 'buy':
            return <Badge variant="default" className="bg-green-500">buy</Badge>;
        case 'sell':
            return <Badge variant="destructive">sell</Badge>;
        case 'top up':
            return <Badge variant="secondary" className="bg-blue-500">top up</Badge>;
        case 'withdraw':
            return <Badge variant="outline" className="border-red-500 text-red-500">withdraw</Badge>;
        default:
            return <Badge variant="ghost">{opDisplay}</Badge>;
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
