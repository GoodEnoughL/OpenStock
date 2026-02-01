'use server';

// 统一股票数据服务层
// 支持多种数据源：Aktools (推荐) 和 Finnhub (备选)

import { getQuote as getFinnhubQuote, getCompanyProfile as getFinnhubProfile, getNews as getFinnhubNews, searchStocks as searchFinnhubStocks, getWatchlistData as getFinnhubWatchlistData } from './finnhub.actions';
import { getQuote as getAktoolsQuote, getCompanyProfile as getAktoolsProfile, getNews as getAktoolsNews, searchStocks as searchAktoolsStocks, getWatchlistData as getAktoolsWatchlistData, getKLineData as getAktoolsKLineData, getMarketIndices as getAktoolsMarketIndices, parseSymbol } from './aktools.actions';

// 数据源配置
const DATA_SOURCE = process.env.STOCK_DATA_SOURCE || 'aktools'; // 'aktools' 或 'finnhub'

// 根据配置选择数据源
function getDataSource() {
  return DATA_SOURCE === 'aktools' ? 'aktools' : 'finnhub';
}

// 统一API接口
// 智能获取股票报价 - 根据市场自动选择最佳数据源
export async function getQuote(symbol: string) {
  const source = getDataSource();
  
  if (source === 'aktools') {
    // 智能选择：A股使用Aktools，其他市场使用Finnhub
    const { market } = await parseSymbol(symbol);
    
    if (market === 'sh' || market === 'sz' || market === 'bj') {
      // A股市场：使用Aktools
      return await getAktoolsQuote(symbol);
    } else {
      // 非A股市场：使用Finnhub（如果配置了密钥）
      if (process.env.FINNHUB_API_KEY) {
        return await getFinnhubQuote(symbol);
      } else {
        console.warn(`非A股股票 ${symbol} 需要配置FINNHUB_API_KEY环境变量`);
        return null;
      }
    }
  } else {
    // 使用Finnhub数据源
    return await getFinnhubQuote(symbol);
  }
}

// 智能获取公司信息 - 根据市场自动选择最佳数据源
export async function getCompanyProfile(symbol: string) {
  const source = getDataSource();
  
  if (source === 'aktools') {
    // 智能选择：A股使用Aktools，其他市场使用Finnhub
    const { market } = await parseSymbol(symbol);
    
    if (market === 'sh' || market === 'sz' || market === 'bj') {
      // A股市场：使用Aktools
      return await getAktoolsProfile(symbol);
    } else {
      // 非A股市场：使用Finnhub（如果配置了密钥）
      if (process.env.FINNHUB_API_KEY) {
        return await getFinnhubProfile(symbol);
      } else {
        console.warn(`非A股股票 ${symbol} 需要配置FINNHUB_API_KEY环境变量`);
        // 返回基础信息
        return {
          name: symbol,
          ticker: symbol.replace(/^[a-z]+\./, ''),
          exchange: market.toUpperCase(),
          currency: market === 'us' ? 'USD' : market === 'hk' ? 'HKD' : 'CNY',
          marketCapitalization: 0,
          industry: '',
          website: '',
          phone: '',
          logo: '',
        };
      }
    }
  } else {
    // 使用Finnhub数据源
    return await getFinnhubProfile(symbol);
  }
}

export async function getNews(symbols?: string[]) {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return await getAktoolsNews(symbols);
  } else {
    return await getFinnhubNews(symbols);
  }
}

export const searchStocks = async (query?: string) => {
  const source = getDataSource();
  
  if (source === 'aktools') {
    // 智能搜索：优先使用Aktools搜索A股，其他市场使用Finnhub
    const trimmed = typeof query === 'string' ? query.trim() : '';
    
    if (!trimmed) {
      // 空搜索：只返回A股热门股票
      return await searchAktoolsStocks(query);
    }
    
    // 智能判断搜索类型（支持大小写）
    const isAStock = /^[036]\d{5}$/.test(trimmed) || /^[\u4e00-\u9fa5]/.test(trimmed);
    const isHKStock = /^\d{4,5}$/.test(trimmed); // 港股代码：4-5位数字（不以0开头也可以）
    const isUSStock = /^[A-Za-z]{1,5}$/.test(trimmed); // 美股代码通常是1-5个字母（支持大小写）
    
    console.log(`🔍 搜索分析: "${trimmed}" - A股:${isAStock} 港股:${isHKStock} 美股:${isUSStock}`);
    
    if (isAStock) {
      // A股搜索：使用Aktools
      return await searchAktoolsStocks(query);
    } else if (isHKStock || isUSStock) {
      // 港股/美股搜索：优先尝试Aktools，如果失败再使用Finnhub
      console.log(`🔍 尝试Aktools搜索港股/美股: ${trimmed}`);
      try {
        // 先尝试Aktools搜索
        const aktoolsResults = await searchAktoolsStocks(query);
        if (aktoolsResults.length > 0) {
          console.log(`🔍 Aktools搜索成功: ${trimmed}`);
          return aktoolsResults;
        }
      } catch (error) {
        console.log(`🔍 Aktools搜索失败: ${trimmed}`, error);
      }
      
      // Aktools没有结果或失败，尝试Finnhub
      if (process.env.FINNHUB_API_KEY) {
        console.log(`🔍 Aktools无结果，尝试Finnhub搜索: ${trimmed}`);
        return await searchFinnhubStocks(query);
      } else {
        console.warn(`搜索 "${trimmed}" 需要配置FINNHUB_API_KEY环境变量`);
        return [];
      }
    } else {
      // 其他情况：先尝试Aktools搜索，再尝试Finnhub
      console.log(`🔍 尝试Aktools搜索: ${trimmed}`);
      const aktoolsResults = await searchAktoolsStocks(query);
      
      if (aktoolsResults.length > 0) {
        return aktoolsResults;
      }
      
      // Aktools没有结果，尝试Finnhub
      if (process.env.FINNHUB_API_KEY) {
        console.log(`🔍 Aktools无结果，尝试Finnhub搜索: ${trimmed}`);
        return await searchFinnhubStocks(query);
      } else {
        console.warn(`搜索 "${trimmed}" 需要配置FINNHUB_API_KEY环境变量`);
        return [];
      }
    }
  } else {
    // 使用Finnhub数据源
    return await searchFinnhubStocks(query);
  }
};

export async function getWatchlistData(symbols: string[]) {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return await getAktoolsWatchlistData(symbols);
  } else {
    return await getFinnhubWatchlistData(symbols);
  }
}

// Aktools特有功能（仅在Aktools数据源下可用）
export async function getKLineData(symbol: string, period: string = 'daily') {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return await getAktoolsKLineData(symbol, period);
  } else {
    // Finnhub没有K线数据功能，返回空数组
    return [];
  }
}

export async function getMarketIndices() {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return await getAktoolsMarketIndices();
  } else {
    // Finnhub没有指数功能，返回空数组
    return [];
  }
}

// 数据源状态检查
export async function checkDataSourceStatus() {
  const source = getDataSource();
  
  try {
    if (source === 'aktools') {
      // 测试Aktools连接
      const testSymbol = '000001'; // 上证指数
      const quote = await getAktoolsQuote(testSymbol);
      return {
        source: 'aktools',
        status: quote ? 'connected' : 'error',
        message: quote ? 'Aktools数据源连接正常' : 'Aktools数据源连接失败'
      };
    } else {
      // 测试Finnhub连接
      const testSymbol = 'AAPL'; // 苹果股票
      const quote = await getFinnhubQuote(testSymbol);
      return {
        source: 'finnhub',
        status: quote ? 'connected' : 'error',
        message: quote ? 'Finnhub数据源连接正常' : 'Finnhub数据源连接失败，请检查API密钥'
      };
    }
  } catch (error) {
    return {
      source,
      status: 'error',
      message: `数据源连接错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 获取支持的市场列表
export async function getSupportedMarkets() {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return [
      { code: 'sh', name: '上海证券交易所', country: '中国' },
      { code: 'sz', name: '深圳证券交易所', country: '中国' },
      { code: 'bj', name: '北京证券交易所', country: '中国' },
      { code: 'hk', name: '香港交易所', country: '中国' },
      { code: 'us', name: '美国交易所', country: '美国' },
    ];
  } else {
    return [
      { code: 'us', name: '美国交易所', country: '美国' },
      { code: 'ca', name: '加拿大交易所', country: '加拿大' },
      { code: 'eu', name: '欧洲交易所', country: '欧洲' },
    ];
  }
}

// 数据源信息
export async function getDataSourceInfo() {
  const source = getDataSource();
  
  if (source === 'aktools') {
    return {
      name: 'Aktools',
      description: '基于AKShare的本地化股票数据服务',
      advantages: [
        '支持A股、港股、美股等全球市场',
        '数据实时性强',
        '无需API密钥',
        '支持K线数据和市场指数',
        '完全免费'
      ],
      requirements: [
        '需要部署Aktools服务 (Docker或本地)',
        '默认地址: http://localhost:8080'
      ]
    };
  } else {
    return {
      name: 'Finnhub',
      description: '专业的金融数据API服务',
      advantages: [
        '数据质量高',
        'API稳定可靠',
        '支持实时数据和历史数据',
        '全球市场覆盖'
      ],
      requirements: [
        '需要申请免费API密钥',
        '免费版有调用限制',
        '主要关注美股市场'
      ]
    };
  }
}