import { NextRequest, NextResponse } from 'next/server';
import { getCachedETFPrice, getCachedETFPrices } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail, fetchNaverETFList } from '@/lib/external/naver-etf';
import { findETFByTicker } from '@/lib/data/etf-list';

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
      
      // 알 수 없는 심볼 형식
      return NextResponse.json({
        success: false,
        error: `Unknown symbol format: ${symbol}. Use US ETF ticker (e.g., SPY) or Korean ETF code (e.g., 069500)`,
      }, { status: 400 });
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
      
      // 기타 심볼은 지원하지 않음 (US/KR ETF만 지원)
      // otherSymbols는 무시됨
      
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
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ETF price. Please try again.' },
      { status: 500 }
    );
  }
}


