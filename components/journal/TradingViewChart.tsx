'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol: string;
    openDate: string;
    closeDate?: string;
    openPrice: number;
    closePrice?: number;
}

export function TradingViewChart({
    symbol,
    openDate,
    closeDate,
    openPrice,
    closePrice,
}: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!symbol || !containerRef.current) return;

        // 清除之前的内容
        containerRef.current.innerHTML = '';

        // 创建 TradingView widget
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).TradingView) {
                new (window as any).TradingView.widget({
                    container_id: containerRef.current?.id,
                    symbol: symbol,
                    interval: '15',
                    timezone: 'Asia/Shanghai',
                    theme: 'dark',
                    style: '1',
                    locale: 'zh_CN',
                    toolbar_bg: '#f1f3f6',
                    enable_publishing: false,
                    allow_symbol_change: false,
                    save_image: false,
                    hideideas: true,
                    studies: ['MASimple@tv-basicstudies'],
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    // 时间范围设置为开仓前到平仓后
                    range: '1M',
                    // 自定义按钮用于标记买卖点
                    drawings_access: {
                        type: 'black',
                        tools: [
                            { name: 'Regression Trend' },
                            { name: 'Trend Line' },
                            { name: 'Text' },
                        ],
                    },
                });
            }
        };

        document.head.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, openDate, closeDate]);

    // 如果 TradingView symbol 无法解析，显示占位符
    if (!symbol) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                    <p>无法加载图表</p>
                    <p className="text-sm">股票代码不支持或数据不完整</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div
                id={`tv_chart_${symbol.replace(/:/g, '_')}_${Date.now()}`}
                ref={containerRef}
                className="w-full h-full"
            />
            {/* 买卖点标记覆盖层 */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center gap-2 bg-background/90 px-3 py-1.5 rounded-md text-xs">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>买入: {openPrice.toFixed(3)}</span>
                </div>
                {closePrice && (
                    <div className="flex items-center gap-2 bg-background/90 px-3 py-1.5 rounded-md text-xs">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span>卖出: {closePrice.toFixed(3)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// 声明 TradingView 全局变量
declare global {
    interface Window {
        TradingView: any;
    }
}
