'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    closeFee?: number;
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
            toast.error('Failed to load trade records');
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
            toast.success('Data cleared successfully');
            loadTrades(1);
        } catch (error) {
            toast.error('Failed to clear data');
        }
    };

    const hasData = trades.length > 0;

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BookOpen className="w-8 h-8" />
                        Trading Journal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome, {userName}! Import trade data, record review notes, and analyze your performance.
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
                                        <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will delete all imported trade records, review notes and statistics. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearData} className="bg-destructive">
                                            Confirm Clear
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="journal" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Trade History
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="journal" className="space-y-4">
                    {!hasData ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Trade Records</h3>
                                <p className="text-muted-foreground text-center max-w-md mb-6">
                                    Please import your securities trading records Excel file. The system will automatically analyze and generate a trading journal.
                                    <br />
                                    Supports standard settlement statement format exported from brokers.
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
                                <h3 className="text-lg font-semibold mb-2">No Data</h3>
                                <p className="text-muted-foreground">
                                    Please import trade data first to view analytics
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Instructions */}
            <Card className="mt-8 bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Export trading details Excel file from your securities account (including trade date, symbol, operation, volume, price, etc.)</p>
                    <p>2. Click "Import Excel" button to upload the file. The system will automatically parse and match buy/sell records.</p>
                    <p>3. Click any trade in the history list to view details and add review notes.</p>
                    <p>4. Switch to "Analytics" tab to view position distribution, equity curve and other statistics.</p>
                    <p>5. In the review panel, you can add ratings, tags, trade notes, and view TradingView charts.</p>
                </CardContent>
            </Card>
        </div>
    );
}
