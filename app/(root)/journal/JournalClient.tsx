'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExcelImporter } from '@/components/journal/ExcelImporter';
import { TradeHistoryTable } from '@/components/journal/TradeHistoryTable';
import { Dashboard } from '@/components/journal/Dashboard';
import { getTradeHistory, clearUserTrades } from '@/lib/actions/trade.actions';
import { toast } from 'sonner';
import { BookOpen, BarChart3, Upload, Trash2, RefreshCw } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface JournalClientProps {
    userId: string;
    userName: string;
}

export default function JournalClient({ userId, userName }: JournalClientProps) {
    const [trades, setTrades] = useState<TradePair[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('journal');

    const loadTrades = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            const result = await getTradeHistory(userId, {
                page,
                limit: pagination.limit,
            });
            setTrades(result.trades as unknown as TradePair[]);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Load trades error:', error);
            toast.error('加载交易记录失败');
        } finally {
            setIsLoading(false);
        }
    }, [userId, pagination.limit]);

    useEffect(() => {
        loadTrades(1);
    }, [loadTrades]);

    const handleClearData = async () => {
        try {
            await clearUserTrades(userId);
            toast.success('数据已清除');
            loadTrades(1);
        } catch (error) {
            toast.error('清除数据失败');
        }
    };

    const hasData = trades.length > 0;

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* 页面标题 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BookOpen className="w-8 h-8" />
                        交易日志
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        欢迎, {userName}！导入交易数据，记录复盘笔记，分析交易表现
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExcelImporter
                        userId={userId}
                        onImportSuccess={() => loadTrades(1)}
                    />
                    {hasData && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => loadTrades(pagination.page)}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>确认清除所有数据？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            此操作将删除所有导入的交易记录、复盘笔记和统计数据。此操作不可撤销。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearData} className="bg-destructive">
                                            确认清除
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

            {/* 主要内容 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="journal" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        交易历史
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        账户分析
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="journal" className="space-y-4">
                    {!hasData ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">暂无交易记录</h3>
                                <p className="text-muted-foreground text-center max-w-md mb-6">
                                    请导入您的证券交易记录 Excel 文件，系统将自动分析并生成交易日志。
                                    <br />
                                    支持券商导出的标准交割单格式。
                                </p>
                                <ExcelImporter
                                    userId={userId}
                                    onImportSuccess={() => loadTrades(1)}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <TradeHistoryTable
                            trades={trades}
                            pagination={pagination}
                            onPageChange={loadTrades}
                            onRefresh={() => loadTrades(pagination.page)}
                        />
                    )}
                </TabsContent>

                <TabsContent value="dashboard">
                    {hasData ? (
                        <Dashboard userId={userId} />
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">暂无数据</h3>
                                <p className="text-muted-foreground">
                                    请先导入交易数据以查看账户分析
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* 使用说明 */}
            <Card className="mt-8 bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">使用说明</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. 从您的证券账户导出交易明细 Excel 文件（包含成交日期、证券代码、操作、成交数量、价格等信息）</p>
                    <p>2. 点击"导入 Excel"按钮上传文件，系统将自动解析并匹配买入卖出记录</p>
                    <p>3. 在交易历史列表中点击任意交易，可以查看详细信息和添加复盘笔记</p>
                    <p>4. 切换至"账户分析"标签查看持仓分布、权益曲线等统计数据</p>
                    <p>5. 在复盘面板中，您可以添加评分、标签、交易笔记，并查看 TradingView 图表</p>
                </CardContent>
            </Card>
        </div>
    );
}
