/**
 * Yahoo Finance에서 미국 ETF/주식 실시간 데이터 가져오기
 * 
 * 무료 API 엔드포인트 사용
 */

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  trailingPE?: number;
  dividendYield?: number;
  currency: string;
  exchange: string;
}

export interface ETFQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  currency: string;
  exchange: string;
  lastUpdated: string;
}

/**
 * Yahoo Finance에서 단일 종목 시세 조회
 */
export async function fetchYahooQuote(symbol: string): Promise<ETFQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API failed for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      console.error(`No data for ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // 최신 가격 데이터
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || symbol,
      price,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: meta.regularMarketVolume || 0,
      previousClose,
      open: quote?.open?.[0] || price,
      dayHigh: meta.regularMarketDayHigh || price,
      dayLow: meta.regularMarketDayLow || price,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || 'UNKNOWN',
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`Failed to fetch Yahoo quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Yahoo Finance에서 여러 종목 시세 일괄 조회
 */
export async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, ETFQuote>> {
  const results = new Map<string, ETFQuote>();
  
  // 병렬로 조회 (최대 10개씩 배치)
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => fetchYahooQuote(symbol));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((quote, idx) => {
      if (quote) {
        results.set(batch[idx].toUpperCase(), quote);
      }
    });
  }

  return results;
}

/**
 * 인기 미국 ETF 실시간 시세 조회
 */
export async function fetchPopularUSETFs(): Promise<ETFQuote[]> {
  const popularSymbols = [
    'SPY', 'VOO', 'IVV', 'VTI', 'QQQ',
    'VUG', 'VTV', 'IWM', 'VB',
    'VGT', 'XLK', 'SOXX', 'SMH',
    'ARKK', 'ARKG', 'BOTZ', 'ICLN', 'LIT',
    'VYM', 'SCHD', 'DVY', 'VIG', 'NOBL',
    'BND', 'AGG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG',
    'VEA', 'EFA', 'VWO', 'EEM', 'IEMG',
    'XLF', 'XLV', 'XLE', 'XLI', 'XLU',
    'VNQ', 'IYR', 'XLRE',
    'GLD', 'IAU', 'SLV', 'USO',
    'TQQQ', 'SQQQ', 'UPRO',
  ];

  const quotesMap = await fetchYahooQuotes(popularSymbols);
  return Array.from(quotesMap.values());
}

/**
 * ETF 상세 정보 조회 (추가 메타데이터 포함)
 */
export async function fetchETFDetails(symbol: string): Promise<{
  quote: ETFQuote | null;
  profile?: {
    sector?: string;
    industry?: string;
    website?: string;
    description?: string;
  };
}> {
  const quote = await fetchYahooQuote(symbol);
  
  if (!quote) {
    return { quote: null };
  }

  // 프로필 정보는 별도 API 호출 필요 (선택적)
  try {
    const profileUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile`;
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const profile = data.quoteSummary?.result?.[0]?.assetProfile;
      
      if (profile) {
        return {
          quote,
          profile: {
            sector: profile.sector,
            industry: profile.industry,
            website: profile.website,
            description: profile.longBusinessSummary,
          },
        };
      }
    }
  } catch (e) {
    // 프로필 조회 실패해도 quote는 반환
    console.log(`Profile fetch failed for ${symbol}, returning quote only`);
  }

  return { quote };
}

/**
 * 캐시된 ETF 가격 조회 (성능 최적화)
 */
const priceCache = new Map<string, { quote: ETFQuote; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1분

export async function getCachedETFPrice(symbol: string): Promise<ETFQuote | null> {
  const cached = priceCache.get(symbol.toUpperCase());
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.quote;
  }

  const quote = await fetchYahooQuote(symbol);
  
  if (quote) {
    priceCache.set(symbol.toUpperCase(), {
      quote,
      timestamp: Date.now(),
    });
  }

  return quote;
}

/**
 * 여러 종목 캐시된 가격 조회
 */
export async function getCachedETFPrices(symbols: string[]): Promise<Map<string, ETFQuote>> {
  const results = new Map<string, ETFQuote>();
  const needsFetch: string[] = [];

  // 캐시 확인
  for (const symbol of symbols) {
    const cached = priceCache.get(symbol.toUpperCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(symbol.toUpperCase(), cached.quote);
    } else {
      needsFetch.push(symbol);
    }
  }

  // 캐시 미스된 것들 조회
  if (needsFetch.length > 0) {
    const fetched = await fetchYahooQuotes(needsFetch);
    fetched.forEach((quote, symbol) => {
      results.set(symbol, quote);
      priceCache.set(symbol, {
        quote,
        timestamp: Date.now(),
      });
    });
  }

  return results;
}

/**
 * ETF 수익률 데이터 (실시간)
 */
export interface ETFPerformance {
  ticker: string;
  return1m: number;   // 1개월 수익률 (%)
  return3m: number;   // 3개월 수익률 (%)
  return6m: number;   // 6개월 수익률 (%)
  return1y: number;   // 1년 수익률 (%)
  returnYTD: number;  // YTD 수익률 (%)
  dividendYield: number; // 배당수익률 (%)
  lastUpdated: string;
}

/**
 * Yahoo Finance에서 ETF 과거 가격 조회하여 수익률 계산
 */
export async function fetchETFPerformance(symbol: string): Promise<ETFPerformance | null> {
  try {
    // 1년 데이터 조회
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!response.ok) {
      console.error(`Yahoo Finance performance API failed for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return null;
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    
    if (closes.length === 0) {
      return null;
    }

    // 현재 가격
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
    
    // 날짜별 인덱스 찾기
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();

    // 가장 가까운 과거 가격 찾기
    const findPriceAtDate = (targetTime: number): number | null => {
      for (let i = timestamps.length - 1; i >= 0; i--) {
        if (timestamps[i] * 1000 <= targetTime) {
          return closes[i];
        }
      }
      return closes[0]; // 가장 오래된 데이터
    };

    const price1m = findPriceAtDate(oneMonthAgo);
    const price3m = findPriceAtDate(threeMonthsAgo);
    const price6m = findPriceAtDate(sixMonthsAgo);
    const price1y = findPriceAtDate(oneYearAgo);
    const priceYTD = findPriceAtDate(startOfYear);

    // 수익률 계산
    const calcReturn = (pastPrice: number | null): number => {
      if (!pastPrice || pastPrice === 0) return 0;
      return Number((((currentPrice - pastPrice) / pastPrice) * 100).toFixed(2));
    };

    // 배당수익률 조회
    let dividendYield = 0;
    try {
      const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail`;
      const summaryRes = await fetch(summaryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        const detail = summaryData.quoteSummary?.result?.[0]?.summaryDetail;
        if (detail?.dividendYield?.raw) {
          dividendYield = Number((detail.dividendYield.raw * 100).toFixed(2));
        } else if (detail?.yield?.raw) {
          dividendYield = Number((detail.yield.raw * 100).toFixed(2));
        }
      }
    } catch (e) {
      // 배당 조회 실패 시 0으로
    }

    return {
      ticker: symbol.toUpperCase(),
      return1m: calcReturn(price1m),
      return3m: calcReturn(price3m),
      return6m: calcReturn(price6m),
      return1y: calcReturn(price1y),
      returnYTD: calcReturn(priceYTD),
      dividendYield,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`Failed to fetch ETF performance for ${symbol}:`, error);
    return null;
  }
}

// 수익률 캐시
const performanceCache = new Map<string, { data: ETFPerformance; timestamp: number }>();
const PERFORMANCE_CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * 캐시된 ETF 수익률 조회
 */
export async function getCachedETFPerformance(symbol: string): Promise<ETFPerformance | null> {
  const cached = performanceCache.get(symbol.toUpperCase());
  
  if (cached && Date.now() - cached.timestamp < PERFORMANCE_CACHE_TTL) {
    return cached.data;
  }

  const performance = await fetchETFPerformance(symbol);
  
  if (performance) {
    performanceCache.set(symbol.toUpperCase(), {
      data: performance,
      timestamp: Date.now(),
    });
  }

  return performance;
}

/**
 * 여러 ETF 수익률 일괄 조회
 */
export async function fetchMultipleETFPerformance(symbols: string[]): Promise<Map<string, ETFPerformance>> {
  const results = new Map<string, ETFPerformance>();
  const needsFetch: string[] = [];

  // 캐시 확인
  for (const symbol of symbols) {
    const cached = performanceCache.get(symbol.toUpperCase());
    if (cached && Date.now() - cached.timestamp < PERFORMANCE_CACHE_TTL) {
      results.set(symbol.toUpperCase(), cached.data);
    } else {
      needsFetch.push(symbol);
    }
  }

  // 병렬로 조회 (최대 5개씩 배치 - rate limit 방지)
  const batchSize = 5;
  for (let i = 0; i < needsFetch.length; i += batchSize) {
    const batch = needsFetch.slice(i, i + batchSize);
    const promises = batch.map(symbol => fetchETFPerformance(symbol));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((perf, idx) => {
      if (perf) {
        results.set(batch[idx].toUpperCase(), perf);
        performanceCache.set(batch[idx].toUpperCase(), {
          data: perf,
          timestamp: Date.now(),
        });
      }
    });

    // Rate limit 방지를 위한 짧은 대기
    if (i + batchSize < needsFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

