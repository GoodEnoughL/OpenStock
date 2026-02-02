'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { importTrades, ParsedTradeRow } from '@/lib/actions/trade.actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExcelImporterProps {
    userId: string;
    onImportSuccess?: () => void;
}

export function ExcelImporter({ userId, onImportSuccess }: ExcelImporterProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<ParsedTradeRow[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 读取第一个工作表
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
                
                if (jsonData.length < 2) {
                    toast.error('Excel 文件为空或格式不正确');
                    setIsUploading(false);
                    return;
                }

                // 解析表头
                const headers = jsonData[0] as string[];
                
                // 映射字段
                const fieldMapping: Record<string, string> = {
                    '成交日期': 'tradeDate',
                    '证券代码': 'symbol',
                    '证券名称': 'name',
                    '操作': 'operation',
                    '资金余额': 'balance',
                    '成交数量': 'volume',
                    '成交均价': 'price',
                    '成交金额': 'amount',
                    '发生金额': 'flowAmount',
                    '手续费': 'fee',
                    '印花税': 'tax',
                    '其他杂费': 'otherFee',
                    '本次金额': 'totalAmount',
                    '合同编号': 'contractNo',
                    '成交编号': 'tradeNo',
                    '交易市场': 'market',
                    '币种': 'currency',
                    '股票余额': 'stockBalance',
                    '市场名称': 'marketName',
                    '成交时间': 'tradeTime',
                    '市场代码': 'marketCode',
                };

                // 解析数据行
                const parsedRows: ParsedTradeRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;
                    
                    const parsedRow: any = {};
                    headers.forEach((header, index) => {
                        const fieldName = fieldMapping[header];
                        if (fieldName) {
                            parsedRow[fieldName] = row[index];
                        }
                    });

                    // 验证必要字段
                    if (parsedRow.tradeDate && parsedRow.operation) {
                        parsedRows.push(parsedRow as ParsedTradeRow);
                    }
                }

                if (parsedRows.length === 0) {
                    toast.error('未找到有效的交易数据，请检查文件格式');
                    setIsUploading(false);
                    return;
                }

                setPreviewData(parsedRows);
                setShowPreview(true);
                toast.success(`成功解析 ${parsedRows.length} 条交易记录`);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('解析 Excel 文件失败，请检查文件格式');
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    }, []);

    const handleImport = async () => {
        if (previewData.length === 0) return;

        setIsUploading(true);
        try {
            const result = await importTrades(userId, previewData);
            toast.success(`成功导入 ${result.count} 条交易记录`);
            setShowPreview(false);
            setPreviewData([]);
            onImportSuccess?.();
        } catch (error) {
            console.error('Import error:', error);
            toast.error('导入失败，请重试');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <Button variant="outline" className="cursor-pointer" disabled={isUploading} asChild>
                        <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? '解析中...' : '导入 Excel'}
                        </span>
                    </Button>
                </label>
                {fileName && (
                    <span className="text-sm text-muted-foreground flex items-center">
                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                        {fileName}
                    </span>
                )}
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>数据预览</DialogTitle>
                        <DialogDescription>
                            共 {previewData.length} 条记录，请确认数据无误后导入
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            系统将自动匹配买入卖出记录并计算盈亏。导入后可以在交易日志中查看详细分析。
                        </AlertDescription>
                    </Alert>

                    <div className="flex-1 overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left">日期</th>
                                    <th className="px-3 py-2 text-left">代码</th>
                                    <th className="px-3 py-2 text-left">名称</th>
                                    <th className="px-3 py-2 text-left">操作</th>
                                    <th className="px-3 py-2 text-right">数量</th>
                                    <th className="px-3 py-2 text-right">价格</th>
                                    <th className="px-3 py-2 text-right">金额</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 20).map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-muted/50">
                                        <td className="px-3 py-2">{row.tradeDate}</td>
                                        <td className="px-3 py-2 font-mono">{row.symbol}</td>
                                        <td className="px-3 py-2">{row.name}</td>
                                        <td className="px-3 py-2">
                                            <span className={getOperationClass(row.operation)}>
                                                {row.operation}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">{row.volume}</td>
                                        <td className="px-3 py-2 text-right">{row.price}</td>
                                        <td className="px-3 py-2 text-right">{row.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 20 && (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                                还有 {previewData.length - 20} 条记录...
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            取消
                        </Button>
                        <Button onClick={handleImport} disabled={isUploading}>
                            {isUploading ? (
                                '导入中...'
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    确认导入
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function getOperationClass(operation: string): string {
    if (operation?.includes('买入') || operation?.includes('申购')) {
        return 'text-red-500 font-medium';
    }
    if (operation?.includes('卖出') || operation?.includes('赎回')) {
        return 'text-green-500 font-medium';
    }
    return 'text-muted-foreground';
}
