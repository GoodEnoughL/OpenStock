'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Chinese to English column name mapping
const COLUMN_NAME_MAPPING: Record<string, string> = {
    '成交日期': 'Trade Date',
    '证券代码': 'Symbol',
    '证券名称': 'Name',
    '操作': 'Operation',
    '资金余额': 'Balance',
    '成交数量': 'Volume',
    '成交均价': 'Price',
    '成交金额': 'Amount',
    '发生金额': 'Flow Amount',
    '手续费': 'Fee',
    '印花税': 'Tax',
    '其他杂费': 'Other Fee',
    '本次金额': 'Total Amount',
    '合同编号': 'Contract No',
    '成交编号': 'Trade No',
    '交易市场': 'Market',
    '币种': 'Currency',
    '股票余额': 'Stock Balance',
    '市场名称': 'Market Name',
    '成交时间': 'Trade Time',
    '市场代码': 'Market Code',
};

export function ExcelImporter({ userId, onImportSuccess }: ExcelImporterProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<ParsedTradeRow[]>([]);
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<any[][]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [fileName, setFileName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsUploading(true);
        setCurrentPage(1);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Read first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
                
                if (jsonData.length < 2) {
                    toast.error('Excel file is empty or has incorrect format');
                    setIsUploading(false);
                    return;
                }

                // Parse headers
                const headers = jsonData[0] as string[];
                setRawHeaders(headers);
                setRawData(jsonData.slice(1));
                
                // Map fields for internal use
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

                // Parse data rows
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

                    // Validate required fields
                    if (parsedRow.tradeDate && parsedRow.operation) {
                        parsedRows.push(parsedRow as ParsedTradeRow);
                    }
                }

                if (parsedRows.length === 0) {
                    toast.error('No valid trade data found. Please check file format');
                    setIsUploading(false);
                    return;
                }

                setPreviewData(parsedRows);
                setShowPreview(true);
                toast.success(`Successfully parsed ${parsedRows.length} trade records`);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Failed to parse Excel file. Please check file format');
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
            toast.success(`Successfully imported ${result.count} trade records`);
            setShowPreview(false);
            setPreviewData([]);
            setRawHeaders([]);
            setRawData([]);
            setCurrentPage(1);
            onImportSuccess?.();
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import failed. Please try again');
        } finally {
            setIsUploading(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(rawData.length / itemsPerPage);
    const paginatedData = rawData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Convert Chinese header to English
    const getEnglishHeader = (header: string) => {
        return COLUMN_NAME_MAPPING[header] || header;
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
                            {isUploading ? 'Parsing...' : 'Import Excel'}
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
                <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Data Preview</DialogTitle>
                        <DialogDescription>
                            Total {previewData.length} records. Please verify data before importing.
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            The system will automatically match buy/sell records and calculate P&L. 
                            You can view detailed analysis in the trade journal after import.
                        </AlertDescription>
                    </Alert>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, rawData.length)} of {rawData.length} rows
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    {rawHeaders.map((header, idx) => (
                                        <th key={idx} className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                                            {getEnglishHeader(header)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="border-b hover:bg-muted/50">
                                        {row.map((cell, cellIdx) => (
                                            <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                                                {cell !== undefined && cell !== null ? String(cell) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={isUploading}>
                            {isUploading ? (
                                'Importing...'
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Import
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
