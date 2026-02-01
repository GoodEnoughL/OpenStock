'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

// Aktools API 配置
const AKTOOLS_BASE_URL = process.env.AKTOOLS_BASE_URL || 'http://localhost:8080';

// 这个版本的Aktools使用不同的API结构
const AKTOOLS_API_PREFIX = '/api/public';

// 完整的API端点
const AKTOOLS_ENDPOINTS = {
  // A股相关
  stock_zh_a_spot_em: '/stock_zh_a_spot_em',
  stock_info_a_code_name: '/stock_info_a_code_name',
  stock_zh_index_spot: '/stock_zh_index_spot',
  stock_individual_info_em: '/stock_individual_info_em',
  stock_zh_a_hist: '/stock_zh_a_hist',
  
  // 港股相关
  stock_hk_spot_em: '/stock_hk_spot_em',
  stock_hk_spot: '/stock_hk_spot',
  stock_hk_hist: '/stock_hk_hist',
  stock_hk_spot_sina: '/stock_hk_spot_sina',
  
  // 美股相关
  stock_us_spot_em: '/stock_us_spot_em',
  stock_us_spot: '/stock_us_spot',
  stock_us_hist: '/stock_us_hist',
  stock_us_spot_sina: '/stock_us_spot_sina'
};

// 股票市场映射
const MARKET_MAP = {
  'SH': 'sh', // 上海证券交易所
  'SZ': 'sz', // 深圳证券交易所
  'BJ': 'bj', // 北京证券交易所
  'HK': 'hk', // 香港交易所
  'US': 'us', // 美国交易所
};

// 解析股票代码，返回市场前缀和代码
export async function parseSymbol(symbol: string): Promise<{ market: string; code: string }> {
  if (symbol.includes('.')) {
    const [market, code] = symbol.split('.');
    return { market: MARKET_MAP[market as keyof typeof MARKET_MAP] || market.toLowerCase(), code };
  }
  
  // 自动识别市场
  if (symbol.startsWith('6')) return { market: 'sh', code: symbol };
  if (symbol.startsWith('0') || symbol.startsWith('3')) return { market: 'sz', code: symbol };
  if (symbol.startsWith('8')) return { market: 'bj', code: symbol };
  if (symbol.startsWith('0') && symbol.length === 5) return { market: 'hk', code: symbol };
  
  return { market: 'us', code: symbol }; // 默认为美股
}

// 获取完整的股票代码（包含市场前缀）
async function getFullSymbol(symbol: string): Promise<string> {
  const { market, code } = await parseSymbol(symbol);
  return `${market}.${code}`;
}

async function fetchAktools<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  // 构建完整的API路径
  const apiPath = AKTOOLS_ENDPOINTS[endpoint as keyof typeof AKTOOLS_ENDPOINTS] || endpoint;
  const urlParams = new URLSearchParams(params);
  const url = `${AKTOOLS_BASE_URL}${AKTOOLS_API_PREFIX}${apiPath}${params ? `?${urlParams}` : ''}`;
  
  console.log(`🔍 Aktools API调用: ${url}`);
  
  const res = await fetch(url, {
    cache: 'no-store', // Aktools数据实时性要求高
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Aktools API failed ${res.status}: ${text}`);
  }
  
  return await res.json() as T;
}

// 获取股票实时报价
export async function getQuote(symbol: string) {
  try {
    const { market, code } = await parseSymbol(symbol);
    const data = await fetchAktools<any>(`/stock_zh_a_spot_em`, { symbol: code });
    
    if (!data || data.length === 0) return null;
    
    const stock = data[0];
    
    // 适配中英文字段名
    const getField = (chineseField: string, englishField?: string) => {
      return stock[chineseField] || stock[englishField || ''] || 0;
    };
    
    return {
      c: parseFloat(getField('最新价', 'current_price')) || 0, // 当前价格
      d: parseFloat(getField('涨跌额', 'change_amount')) || 0, // 涨跌额
      dp: parseFloat(getField('涨跌幅', 'change_percent')) || 0, // 涨跌幅
      h: parseFloat(getField('最高价', 'high_price')) || 0, // 最高价
      l: parseFloat(getField('最低价', 'low_price')) || 0, // 最低价
      o: parseFloat(getField('今开', 'open_price')) || 0, // 开盘价
      pc: parseFloat(getField('昨收', 'prev_close')) || 0, // 昨收价
      t: Date.now(), // 时间戳
      v: parseFloat(getField('成交量', 'volume')) || 0, // 成交量
    };
  } catch (e) {
    console.error('Error fetching quote for', symbol, e);
    return null;
  }
}

// 获取公司基本信息
export async function getCompanyProfile(symbol: string) {
  try {
    const { market, code } = await parseSymbol(symbol);
    
    // 对于非A股市场，返回基础信息（避免Aktools连接错误）
    if (market !== 'sh' && market !== 'sz' && market !== 'bj') {
      return {
        name: symbol,
        ticker: code,
        exchange: market.toUpperCase(),
        currency: market === 'us' ? 'USD' : 'CNY',
        marketCapitalization: 0,
        industry: '',
        website: '',
        phone: '',
        logo: '',
      };
    }
    
    // 获取股票基本信息（仅A股）
    const infoData = await fetchAktools<any>(`/stock_individual_info_em`, { symbol: code });
    
    if (!infoData) return null;
    
    // 适配中英文字段名
    const getField = (chineseField: string, englishField?: string) => {
      return infoData[chineseField] || infoData[englishField || ''] || '';
    };
    
    return {
      name: getField('股票简称', 'short_name') || symbol,
      ticker: code,
      exchange: market.toUpperCase(),
      currency: 'CNY',
      marketCapitalization: parseFloat(getField('总市值', 'total_market_cap')) || 0,
      industry: getField('所属行业', 'industry') || '',
      website: getField('公司网址', 'website') || '',
      phone: getField('联系电话', 'phone') || '',
      logo: `https://image.sinajs.cn/newchart/min/n/${market}${code}.gif`, // 新浪财经图表
    };
  } catch (e) {
    console.error('Error fetching profile for', symbol, e);
    // 返回基础信息而不是null
    const { market, code } = await parseSymbol(symbol);
    return {
      name: symbol,
      ticker: code,
      exchange: market.toUpperCase(),
      currency: market === 'us' ? 'USD' : 'CNY',
      marketCapitalization: 0,
      industry: '',
      website: '',
      phone: '',
      logo: '',
    };
  }
}

// 获取关注列表数据
export async function getWatchlistData(symbols: string[]) {
  if (!symbols || symbols.length === 0) return [];

  const promises = symbols.map(async (sym) => {
    const [quote, profile] = await Promise.all([
      getQuote(sym),
      getCompanyProfile(sym)
    ]);

    return {
      symbol: sym,
      price: quote?.c || 0,
      change: quote?.d || 0,
      changePercent: quote?.dp || 0,
      currency: profile?.currency || 'CNY',
      name: profile?.name || sym,
      logo: profile?.logo,
      marketCap: profile?.marketCapitalization,
      peRatio: 0, // Aktools需要单独获取PE比率
    };
  });

  return await Promise.all(promises);
}

// 获取新闻数据
export async function getNews(symbols?: string[]): Promise<any[]> {
  try {
    // Aktools新闻接口可能需要单独配置
    // 这里先返回空数组，后续可以集成东方财富等新闻源
    return [];
  } catch (err) {
    console.error('getNews error:', err);
    return [];
  }
}

// 股票搜索
export const searchStocks = cache(async (query?: string): Promise<any[]> => {
  try {
    const trimmed = typeof query === 'string' ? query.trim() : '';

    if (!trimmed) {
      // 返回热门股票（只返回A股，避免Aktools错误）
      const topAStocks = POPULAR_STOCK_SYMBOLS.filter(sym => 
        sym.startsWith('6') || sym.startsWith('0') || sym.startsWith('3')
      ).slice(0, 10);
      
      const profiles = await Promise.all(
        topAStocks.map(async (sym) => {
          try {
            const profile = await getCompanyProfile(sym);
            return {
              symbol: sym,
              description: profile?.name || sym,
              displaySymbol: sym,
              type: 'Common Stock',
              exchange: profile?.exchange || '',
            };
          } catch (e) {
            console.error('Error fetching profile for', sym, e);
            return null;
          }
        })
      );

      return profiles.filter(Boolean) as any[];
    }

    // 智能搜索：根据输入类型选择不同的搜索策略（支持大小写）
    const isAStock = /^[036]\d{5}$/.test(trimmed) || /^[\u4e00-\u9fa5]/.test(trimmed);
    const isHKStock = /^\d{4,5}$/.test(trimmed); // 港股代码：4-5位数字（不以0开头也可以）
    const isUSStock = /^[A-Za-z]{1,5}$/.test(trimmed); // 支持大小写

    console.log(`🔍 Aktools搜索分析: "${trimmed}" - A股:${isAStock} 港股:${isHKStock} 美股:${isUSStock}`);

    if (isAStock) {
      // A股搜索
      const searchData = await fetchAktools<any>(`/stock_info_a_code_name`);
      
      if (!searchData || !Array.isArray(searchData)) return [];

      const results = searchData
        .filter((stock: any) => {
          const code = stock.code || stock.代码 || '';
          const name = stock.name || stock.名称 || '';
          return code.includes(trimmed) || name.includes(trimmed);
        })
        .slice(0, 20)
        .map((stock: any) => {
          const code = stock.code || stock.代码 || '';
          const name = stock.name || stock.名称 || '';
          return {
            symbol: code,
            description: name,
            displaySymbol: code,
            type: 'Common Stock',
            exchange: code.startsWith('6') ? 'SH' : 'SZ',
          };
        });

      return results;
    } else if (isHKStock) {
      // 港股搜索：尝试使用Aktools搜索港股
      console.log(`🔍 Aktools港股搜索: ${trimmed}`);
      
      // 先尝试Aktools港股搜索接口
      try {
        const searchData = await fetchAktools<any>(`/stock_hk_spot_em`);
        
        if (searchData && Array.isArray(searchData)) {
          const results = searchData
            .filter((stock: any) => {
              const code = stock.code || stock.代码 || '';
              const name = stock.name || stock.名称 || '';
              return code.includes(trimmed) || name.includes(trimmed);
            })
            .slice(0, 10)
            .map((stock: any) => {
              const code = stock.code || stock.代码 || '';
              const name = stock.name || stock.名称 || '';
              return {
                symbol: `hk.${code}`,
                description: name,
                displaySymbol: code,
                type: 'Common Stock',
                exchange: 'HK',
              };
            });
          
          if (results.length > 0) {
            console.log(`🔍 Aktools港股搜索成功: ${trimmed}`);
            return results;
          }
        }
      } catch (error) {
        console.log(`🔍 Aktools港股搜索失败: ${trimmed}`, error);
      }
      
      // 如果Aktools搜索失败，返回基础信息
      return [{
        symbol: `hk.${trimmed}`,
        description: `港股 ${trimmed}`,
        displaySymbol: trimmed,
        type: 'Common Stock',
        exchange: 'HK',
      }];
    } else if (isUSStock) {
      // 美股搜索：返回基础信息（Aktools可能不支持美股搜索）
      console.log(`🔍 Aktools美股搜索: ${trimmed}`);
      return [{
        symbol: `us.${trimmed}`,
        description: `美股 ${trimmed}`,
        displaySymbol: trimmed,
        type: 'Common Stock',
        exchange: 'US',
      }];
    } else {
      // 其他搜索：尝试A股搜索
      const searchData = await fetchAktools<any>(`/stock_info_a_code_name`);
      
      if (!searchData || !Array.isArray(searchData)) return [];

      const results = searchData
        .filter((stock: any) => {
          const code = stock.code || stock.代码 || '';
          const name = stock.name || stock.名称 || '';
          return code.includes(trimmed) || name.includes(trimmed);
        })
        .slice(0, 20)
        .map((stock: any) => {
          const code = stock.code || stock.代码 || '';
          const name = stock.name || stock.名称 || '';
          return {
            symbol: code,
            description: name,
            displaySymbol: code,
            type: 'Common Stock',
            exchange: code.startsWith('6') ? 'SH' : 'SZ',
          };
        });

      return results;
    }
  } catch (e) {
    console.error('Error in stock search:', e);
    return [];
  }
});

// 获取K线数据
export async function getKLineData(symbol: string, period: string = 'daily') {
  try {
    const { market, code } = await parseSymbol(symbol);
    
    const periodMap = {
      'daily': '101',
      'weekly': '102',
      'monthly': '103',
    };
    
    const periodCode = periodMap[period as keyof typeof periodMap] || '101';
    
    const data = await fetchAktools<any>(`/stock_zh_a_hist`, {
      symbol: code,
      period: periodCode,
      start_date: '20200101',
      end_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    });
    
    return data || [];
  } catch (e) {
    console.error('Error fetching K-line data for', symbol, e);
    return [];
  }
}

// 获取市场指数
export async function getMarketIndices() {
  try {
    const indices = await fetchAktools<any>(`/stock_zh_index_spot`);
    
    const mainIndices = indices
      ?.filter((index: any) => ['000001', '399001', '399006'].includes(index.代码))
      .map((index: any) => ({
        symbol: index.代码,
        name: index.名称,
        price: parseFloat(index.最新价) || 0,
        change: parseFloat(index.涨跌额) || 0,
        changePercent: parseFloat(index.涨跌幅) || 0,
      })) || [];
    
    return mainIndices;
  } catch (e) {
    console.error('Error fetching market indices:', e);
    return [];
  }
}