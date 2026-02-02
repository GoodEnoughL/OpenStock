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
    Legend,
    BarChart,
    Bar,
    AreaChart,
    Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, Target, Calendar, Clock } from 'lucide-react';

interface DashboardProps {
    userId: string;
}

interface StatsData {
    totalEquity: number;
    cashBalance: number;
    marketValue: number;
    totalProfit: number;
    totalReturn: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    positions: {
        symbol: string;
        name: string;
        volume: number;
        avgCost: number;
        marketValue: number;
        profit: number;
        percentGain: number;
    }[];
}

// 模拟数据 - 实际应从 API 获取
const mockStats: StatsData = {
    totalEquity: 214747.1,
    cashBalance: 120000,
    marketValue: 94747.1,
    totalProfit: 3250.5,
    totalReturn: 1.54,
    winRate: 62.5,
    totalTrades: 8,
    winningTrades: 5,
    losingTrades: 3,
    positions: [
        { symbol: '518880', name: '黄金ETF', volume: 18300, avgCost: 11.2, marketValue: 216579, profit: 1189, percentGain: 5.5 },
        { symbol: '160416', name: '石油基金', volume: 54, avgCost: 1.832, marketValue: 98.93, profit: -5.2, percentGain: -5.0 },
        { symbol: '501018', name: '南方原油', volume: 85, avgCost: 1.162, marketValue: 98.77, profit: 0.03, percentGain: 0.03 },
    ],
};

// 模拟权益曲线数据
const equityCurveData = [
    { date: '2025-12-26', equity: 100000, profit: 0 },
    { date: '2026-01-12', equity: 200000, profit: 0 },
    { date: '2026-01-26', equity: 335803.9, profit: 0 },
    { date: '2026-01-28', equity: 335802.87, profit: -1.03 },
    { date: '2026-01-29', equity: 335831.81, profit: 28.94 },
    { date: '2026-01-30', equity: 347385.8, profit: 11582.93 },
];

// 模拟每日盈亏数据
const dailyProfitData = [
    { date: '01-28', profit: -1.03 },
    { date: '01-29', profit: 28.94 },
    { date: '01-30', profit: 11582.93 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard({ userId }: DashboardProps) {
    const [stats, setStats] = useState<StatsData>(mockStats);

    // 计算持仓分布数据
    const positionData = stats.positions.map((pos) => ({
        name: pos.name,
        value: pos.marketValue,
        symbol: pos.symbol,
    }));

    // 计算交易统计
    const avgProfit = stats.totalProfit / stats.totalTrades;
    const profitFactor = stats.winningTrades / Math.max(stats.losingTrades, 1);

    return (
        <div className="space-y-6">
            {/* 顶部统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="总权益"
                    value={`¥${stats.totalEquity.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
                    change={`${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}%`}
                    isPositive={stats.totalReturn >= 0}
                    icon={<DollarSign className="w-4 h-4" />}
                />
                <StatCard
                    title="累计盈亏"
                    value={`${stats.totalProfit >= 0 ? '+' : ''}¥${stats.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
                    change={`${stats.totalTrades} 笔交易`}
                    isPositive={stats.totalProfit >= 0}
                    icon={<Activity className="w-4 h-4" />}
                />
                <StatCard
                    title="胜率"
                    value={`${stats.winRate.toFixed(1)}%`}
                    change={`${stats.winningTrades} 胜 / ${stats.losingTrades} 负`}
                    isPositive={stats.winRate >= 50}
                    icon={<Target className="w-4 h-4" />}
                />
                <StatCard
                    title="现金余额"
                    value={`¥${stats.cashBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
                    change={`持仓市值 ¥${stats.marketValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
                    isPositive={true}
                    icon={<Percent className="w-4 h-4" />}
                />
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 权益曲线 */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            权益曲线
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equityCurveData}>
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
                                        tickFormatter={(value) => value.slice(5)}
                                    />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                        }}
                                        formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, '权益']}
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

                {/* 持仓分布 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            持仓分布
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
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
                                        formatter={(value) => [`¥${Number(value || 0).toLocaleString()}`, '市值']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 每日盈亏 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            每日盈亏
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyProfitData}>
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
                                            '盈亏',
                                        ]}
                                    />
                                    <Bar
                                        dataKey="profit"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {dailyProfitData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.profit >= 0 ? '#ef4444' : '#22c55e'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailStatCard
                    title="利润因子"
                    value={profitFactor.toFixed(2)}
                    description="盈利交易 / 亏损交易"
                />
                <DetailStatCard
                    title="平均盈亏"
                    value={`${avgProfit >= 0 ? '+' : ''}¥${avgProfit.toFixed(2)}`}
                    description="每笔交易平均收益"
                    isPositive={avgProfit >= 0}
                />
                <DetailStatCard
                    title="最大回撤"
                    value="-2.5%"
                    description="历史最大资金回撤"
                    isPositive={false}
                />
            </div>

            {/* 当前持仓 */}
            <Card>
                <CardHeader>
                    <CardTitle>当前持仓</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">股票</th>
                                    <th className="text-right py-3 px-4">持仓数量</th>
                                    <th className="text-right py-3 px-4">成本价</th>
                                    <th className="text-right py-3 px-4">市值</th>
                                    <th className="text-right py-3 px-4">盈亏</th>
                                    <th className="text-right py-3 px-4">收益率</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.positions.map((pos) => (
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
                                            <span className={pos.profit >= 0 ? 'text-red-500' : 'text-green-500'}>
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
                </CardContent>
            </Card>
        </div>
    );
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
                        <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className={`text-sm ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
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
                    isPositive === undefined ? '' : isPositive ? 'text-red-500' : 'text-green-500'
                }`}>
                    {value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </CardContent>
        </Card>
    );
}
