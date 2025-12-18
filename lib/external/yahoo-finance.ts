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

