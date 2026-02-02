'use client';

import { useEffect, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    AreaChart,
    Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, Target, Calendar, Clock } from 'lucide-react';
import { getTradeHistory, calculateAccountStats, getPositions } from '@/lib/actions/trade.actions';

interface DashboardProps {
    userId: string;
}

interface Position {
    symbol: string;
    name: string;
    volume: number;
    avgCost: number;
    marketValue: number;
    profit: number;
    percentGain: number;
}

interface TradeStats {
    totalEquity: number;
    cashBalance: number;
    marketValue: number;
    totalProfit: number;
    totalReturn: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgProfit: number;
    profitFactor: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Dashboard({ userId }: DashboardProps) {
    const [stats, setStats] = useState<TradeStats | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [equityHistory, setEquityHistory] = useState<{date: string; equity: number}[]>([]);
    const [dailyProfits, setDailyProfits] = useState<{date: string; profit: number}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [userId]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Get trade history for calculations
            const tradeResult = await getTradeHistory(userId, { limit: 1000 });
            const trades = tradeResult.trades as any[];

            // Calculate stats from actual trade data
            const closedTrades = trades.filter((t: any) => t.status === 'closed');
            const openTrades = trades.filter((t: any) => t.status === 'open');

            // Calculate total profit/loss
            const totalProfit = closedTrades.reduce((sum: number, t: any) => sum + (t.netProfit || 0), 0);
            
            // Count wins/losses
            const winningTrades = closedTrades.filter((t: any) => (t.netProfit || 0) > 0).length;
            const losingTrades = closedTrades.filter((t: any) => (t.netProfit || 0) <= 0).length;
            const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

            // Calculate profit factor
            const totalGain = closedTrades
                .filter((t: any) => (t.netProfit || 0) > 0)
                .reduce((sum: number, t: any) => sum + (t.netProfit || 0), 0);
            const totalLoss = Math.abs(closedTrades
                .filter((t: any) => (t.netProfit || 0) < 0)
                .reduce((sum: number, t: any) => sum + (t.netProfit || 0), 0));
            const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? 999 : 0;

            // Calculate average profit
            const avgProfit = closedTrades.length > 0 ? totalProfit / closedTrades.length : 0;

            // Build positions from open trades
            const positionMap = new Map<string, Position>();
            openTrades.forEach((trade: any) => {
                const existing = positionMap.get(trade.symbol);
                if (existing) {
                    const totalVolume = existing.volume + trade.openVolume;
                    const totalCost = (existing.avgCost * existing.volume) + (trade.openPrice * trade.openVolume);
                    existing.volume = totalVolume;
                    existing.avgCost = totalCost / totalVolume;
                    existing.marketValue = trade.openAmount;
                } else {
                    positionMap.set(trade.symbol, {
                        symbol: trade.symbol,
                        name: trade.name,
                        volume: trade.openVolume,
                        avgCost: trade.openPrice,
                        marketValue: trade.openAmount,
                        profit: 0,
                        percentGain: 0,
                    });
                }
            });

            const positionList = Array.from(positionMap.values());
            const totalMarketValue = positionList.reduce((sum, p) => sum + p.marketValue, 0);

            // Estimate cash balance from the latest trade
            const latestTrade = trades.length > 0 ? trades[0] : null;
            const cashBalance = latestTrade?.balance || 0;
            const totalEquity = cashBalance + totalMarketValue;

            // Calculate total return (if we have starting balance)
            const startingBalance = trades.length > 0 
                ? trades[trades.length - 1]?.balance || totalEquity 
                : totalEquity;
            const totalReturn = startingBalance > 0 ? ((totalEquity - startingBalance) / startingBalance) * 100 : 0;

            setStats({
                totalEquity,
                cashBalance,
                marketValue: totalMarketValue,
                totalProfit,
                totalReturn,
                winRate,
                totalTrades: closedTrades.length,
                winningTrades,
                losingTrades,
                avgProfit,
                profitFactor,
            });

            setPositions(positionList);

            // Build equity curve from trades
            const equityData: {date: string; equity: number}[] = [];
            let runningEquity = startingBalance;
            
            // Sort trades by date
            const sortedTrades = [...trades].sort((a: any, b: any) => 
                new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
            );

            sortedTrades.forEach((trade: any) => {
                if (trade.status === 'closed' && trade.netProfit) {
                    runningEquity += trade.netProfit;
                    equityData.push({
                        date: formatDate(trade.closeDate),
                        equity: runningEquity,
                    });
                }
            });

            // Add current equity
            if (equityData.length === 0 || equityData[equityData.length - 1].equity !== totalEquity) {
                equityData.push({
                    date: formatDate(new Date().toISOString()),
                    equity: totalEquity,
                });
            }

            setEquityHistory(equityData);

            // Build daily profit data
            const dailyMap = new Map<string, number>();
            closedTrades.forEach((trade: any) => {
                if (trade.closeDate) {
                    const date = formatDate(trade.closeDate);
                    const current = dailyMap.get(date) || 0;
                    dailyMap.set(date, current + (trade.netProfit || 0));
                }
            });

            const dailyData = Array.from(dailyMap.entries())
                .map(([date, profit]) => ({ date, profit }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setDailyProfits(dailyData);

        } catch (error) {
            console.error('Load dashboard data error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // Calculate position distribution data
    const positionData = positions.map((pos) => ({
        name: pos.name || pos.symbol,
        value: pos.marketValue,
        symbol: pos.symbol,
    }));

    return (
        <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Equity"
                    value={`¥${stats.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={`${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}%`}
                    isPositive={stats.totalReturn >= 0}
                    icon={<DollarSign className="w-4 h-4" />}
                />
                <StatCard
                    title="Total P&L"
                    value={`${stats.totalProfit >= 0 ? '+' : ''}¥${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={`${stats.totalTrades} trades`}
                    isPositive={stats.totalProfit >= 0}
                    icon={<Activity className="w-4 h-4" />}
                />
                <StatCard
                    title="Win Rate"
                    value={`${stats.winRate.toFixed(1)}%`}
                    change={`${stats.winningTrades} wins / ${stats.losingTrades} losses`}
                    isPositive={stats.winRate >= 50}
                    icon={<Target className="w-4 h-4" />}
                />
                <StatCard
                    title="Cash Balance"
                    value={`¥${stats.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={`Market Value: ¥${stats.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    isPositive={true}
                    icon={<Percent className="w-4 h-4" />}
                />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equity Curve */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Equity Curve
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equityHistory}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#9ca3af"
                                    />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                        }}
                                        formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, 'Equity']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="equity"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorEquity)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Position Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Position Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {positionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={positionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {positionData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '6px',
                                            }}
                                            formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, 'Value']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No open positions
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily P&L */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Daily P&L
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {dailyProfits.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyProfits}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="date" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '6px',
                                            }}
                                            formatter={(value) => [
                                                `${Number(value || 0) >= 0 ? '+' : ''}¥${Number(value || 0).toFixed(2)}`,
                                                'P&L',
                                            ]}
                                        />
                                        <Bar
                                            dataKey="profit"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        >
                                            {dailyProfits.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No closed trades
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailStatCard
                    title="Profit Factor"
                    value={stats.profitFactor > 900 ? '∞' : stats.profitFactor.toFixed(2)}
                    description="Gross Profit / Gross Loss"
                />
                <DetailStatCard
                    title="Avg P&L per Trade"
                    value={`${stats.avgProfit >= 0 ? '+' : ''}¥${stats.avgProfit.toFixed(2)}`}
                    description="Average profit per trade"
                    isPositive={stats.avgProfit >= 0}
                />
                <DetailStatCard
                    title="Open Positions"
                    value={String(positions.length)}
                    description="Current holding count"
                    isPositive={true}
                />
            </div>

            {/* Current Positions */}
            <Card>
                <CardHeader>
                    <CardTitle>Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    {positions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Symbol</th>
                                        <th className="text-right py-3 px-4">Volume</th>
                                        <th className="text-right py-3 px-4">Avg Cost</th>
                                        <th className="text-right py-3 px-4">Market Value</th>
                                        <th className="text-right py-3 px-4">P&L</th>
                                        <th className="text-right py-3 px-4">Return %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((pos) => (
                                        <tr key={pos.symbol} className="border-b last:border-0">
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{pos.symbol}</div>
                                                <div className="text-sm text-muted-foreground">{pos.name}</div>
                                            </td>
                                            <td className="text-right py-3 px-4 font-mono">{pos.volume}</td>
                                            <td className="text-right py-3 px-4 font-mono">{pos.avgCost.toFixed(3)}</td>
                                            <td className="text-right py-3 px-4 font-mono">
                                                ¥{pos.marketValue.toLocaleString()}
                                            </td>
                                            <td className="text-right py-3 px-4">
                                                <span className={pos.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                    {pos.profit >= 0 ? '+' : ''}¥{pos.profit.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="text-right py-3 px-4">
                                                <Badge variant={pos.percentGain >= 0 ? 'default' : 'destructive'}>
                                                    {pos.percentGain >= 0 ? '+' : ''}{pos.percentGain.toFixed(2)}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No open positions
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
}

function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-2">
                        {icon}
                        {title}
                    </div>
                    {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {change}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface DetailStatCardProps {
    title: string;
    value: string;
    description: string;
    isPositive?: boolean;
}

function DetailStatCard({ title, value, description, isPositive }: DetailStatCardProps) {
    return (
        <Card className="bg-muted/50">
            <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{title}</div>
                <div className={`text-xl font-bold mt-1 ${
                    isPositive === undefined ? '' : isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                    {value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </CardContent>
        </Card>
    );
}
