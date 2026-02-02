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

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create TradingView widget
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
                    locale: 'en',
                    toolbar_bg: '#f1f3f6',
                    enable_publishing: false,
                    allow_symbol_change: false,
                    save_image: false,
                    hideideas: true,
                    studies: ['MASimple@tv-basicstudies'],
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    range: '1M',
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

    if (!symbol) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                    <p>Unable to load chart</p>
                    <p className="text-sm">Symbol not supported or incomplete data</p>
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
            {/* Buy/Sell markers overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center gap-2 bg-background/90 px-3 py-1.5 rounded-md text-xs">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Buy: {openPrice.toFixed(3)}</span>
                </div>
                {closePrice && (
                    <div className="flex items-center gap-2 bg-background/90 px-3 py-1.5 rounded-md text-xs">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>Sell: {closePrice.toFixed(3)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

declare global {
    interface Window {
        TradingView: any;
    }
}
