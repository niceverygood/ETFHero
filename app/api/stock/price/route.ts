import { NextRequest, NextResponse } from 'next/server';
import { KISMarketDataProvider, fetchMultipleStockPrices } from '@/lib/market-data/kis';
import { MockMarketDataProvider } from '@/lib/market-data/mock';
import { getCachedETFPrice, getCachedETFPrices } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';
import { findETFByTicker } from '@/lib/data/etf-list';

// KIS API 사용 여부 확인
const useKISAPI = !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);

// 미국 ETF인지 확인 (영문 심볼)
function isUSSymbol(symbol: string): boolean {
  return /^[A-Za-z]+$/.test(symbol);
}

// 한국 ETF인지 확인 (숫자 심볼)
function isKRSymbol(symbol: string): boolean {
  return /^\d{6}$/.test(symbol);
}

/**
 * GET /api/stock/price?symbol=SPY (미국 ETF)
 * GET /api/stock/price?symbol=069500 (한국 ETF)
 * GET /api/stock/price?symbols=SPY,QQQ,VOO
 * 
 * 실시간 ETF/주식 가격 조회 API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const symbolsParam = searchParams.get('symbols');
  
  try {
    // 단일 종목 조회
    if (symbol) {
      // 미국 ETF - Yahoo Finance 사용
      if (isUSSymbol(symbol)) {
        const quote = await getCachedETFPrice(symbol);
        
        if (quote) {
          const etfInfo = findETFByTicker(symbol);
          return NextResponse.json({
            success: true,
            source: 'yahoo',
            isRealTime: true,
            data: {
              symbol: quote.ticker,
              name: etfInfo?.nameKo || quote.name,
              nameEn: quote.name,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              high52Week: quote.fiftyTwoWeekHigh,
              low52Week: quote.fiftyTwoWeekLow,
              currency: quote.currency,
              exchange: quote.exchange,
              sector: etfInfo?.category || 'ETF',
              issuer: etfInfo?.issuer,
              expenseRatio: etfInfo?.expenseRatio,
              description: etfInfo?.description,
              updatedAt: quote.lastUpdated,
            },
          });
        }
        
        // Yahoo 실패 시 정적 데이터 사용
        const etfInfo = findETFByTicker(symbol);
        if (etfInfo) {
          return NextResponse.json({
            success: true,
            source: 'static',
            isRealTime: false,
            data: {
              symbol: etfInfo.ticker,
              name: etfInfo.nameKo,
              nameEn: etfInfo.name,
              price: 0, // 실시간 가격 없음
              change: 0,
              changePercent: 0,
              sector: etfInfo.category,
              issuer: etfInfo.issuer,
              expenseRatio: etfInfo.expenseRatio,
              description: etfInfo.description,
            },
          });
        }
      }
      
      // 한국 ETF - 네이버 금융 사용
      if (isKRSymbol(symbol)) {
        const naverData = await fetchNaverETFDetail(symbol);
        
        if (naverData) {
          return NextResponse.json({
            success: true,
            source: 'naver',
            isRealTime: true,
            data: {
              symbol: naverData.ticker,
              name: naverData.name,
              price: naverData.price,
              change: naverData.change,
              changePercent: naverData.changePercent,
              volume: naverData.volume,
              nav: naverData.nav,
              totalAssets: naverData.totalAssets,
              sector: naverData.benchmark,
              issuer: naverData.issuer,
              expenseRatio: naverData.expenseRatio,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }
      
      // 기존 KIS/Mock 로직 (주식용)
      if (useKISAPI) {
        const provider = new KISMarketDataProvider();
        const quote = await provider.getQuote(symbol);
        
        return NextResponse.json({
          success: true,
          source: 'kis',
          isRealTime: true,
          data: {
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            high52Week: quote.high52Week,
            low52Week: quote.low52Week,
            updatedAt: quote.updatedAt,
          },
        });
      } else {
        // Mock 데이터 사용
        const provider = new MockMarketDataProvider();
        const quote = await provider.getQuote(symbol);
        
        return NextResponse.json({
          success: true,
          source: 'mock',
          isRealTime: false,
          data: quote,
        });
      }
    }
    
    // 여러 종목 조회
    if (symbolsParam) {
      const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
      
      if (symbols.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No symbols provided' },
          { status: 400 }
        );
      }
      
      // 미국/한국 심볼 분리
      const usSymbols = symbols.filter(isUSSymbol);
      const krSymbols = symbols.filter(isKRSymbol);
      const otherSymbols = symbols.filter(s => !isUSSymbol(s) && !isKRSymbol(s));
      
      const data: Record<string, {
        price: number;
        change: number;
        changePercent: number;
        name: string;
        source?: string;
      }> = {};
      
      // 미국 ETF - Yahoo Finance
      if (usSymbols.length > 0) {
        const usQuotes = await getCachedETFPrices(usSymbols);
        usQuotes.forEach((quote, sym) => {
          const etfInfo = findETFByTicker(sym);
          data[sym] = {
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            name: etfInfo?.nameKo || quote.name,
            source: 'yahoo',
          };
        });
      }
      
      // 한국 ETF - 네이버
      for (const sym of krSymbols) {
        try {
          const naverData = await fetchNaverETFDetail(sym);
          if (naverData) {
            data[sym] = {
              price: naverData.price,
              change: naverData.change,
              changePercent: naverData.changePercent,
              name: naverData.name,
              source: 'naver',
            };
          }
        } catch {
          // 개별 종목 실패 시 스킵
        }
      }
      
      // 기타 (주식) - KIS/Mock
      if (otherSymbols.length > 0) {
        if (useKISAPI) {
          const results = await fetchMultipleStockPrices(otherSymbols);
          results.forEach((value, key) => {
            data[key] = { ...value, source: 'kis' };
          });
        } else {
          const provider = new MockMarketDataProvider();
          for (const sym of otherSymbols) {
            try {
              const quote = await provider.getQuote(sym);
              data[sym] = {
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                name: quote.name,
                source: 'mock',
              };
            } catch {
              // 개별 종목 실패 시 스킵
            }
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        source: 'mixed',
        data,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'symbol or symbols parameter required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Stock price API error:', error);
    
    // KIS API 실패 시 Mock으로 폴백
    if (useKISAPI && symbol) {
      try {
        const provider = new MockMarketDataProvider();
        const quote = await provider.getQuote(symbol);
        
        return NextResponse.json({
          success: true,
          source: 'mock_fallback',
          data: quote,
        });
      } catch {
        // Mock도 실패
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}


