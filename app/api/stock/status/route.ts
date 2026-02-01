import { NextRequest, NextResponse } from 'next/server';
import { checkDataSourceStatus, getDataSourceInfo, getSupportedMarkets } from '@/lib/actions/stock.actions';

export async function GET(request: NextRequest) {
  try {
    const [status, info, markets] = await Promise.all([
      checkDataSourceStatus(),
      getDataSourceInfo(),
      getSupportedMarkets()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        status,
        info,
        markets,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}