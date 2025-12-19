import { NextRequest, NextResponse } from 'next/server';
import { 
  searchETFsByHolding, 
  getETFHoldings,
  getAllUniqueHoldings,
  POPULAR_HOLDINGS 
} from '@/lib/data/etf-holdings';
import { findETFByTicker } from '@/lib/data/etf-list';

/**
 * GET /api/etf/by-holding?q=NVDA
 * GET /api/etf/by-holding?q=테슬라
 * GET /api/etf/by-holding?popular=true (인기 종목 목록)
 * GET /api/etf/by-holding?etf=SPY (ETF의 구성종목 조회)
 * 
 * 구성종목으로 ETF 역검색 API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const popular = searchParams.get('popular');
  const etfTicker = searchParams.get('etf');
  
  try {
    // 인기 종목 목록 반환
    if (popular === 'true') {
      return NextResponse.json({
        success: true,
        data: POPULAR_HOLDINGS,
      });
    }
    
    // 특정 ETF의 구성종목 조회
    if (etfTicker) {
      const holdings = getETFHoldings(etfTicker);
      const etfInfo = findETFByTicker(etfTicker);
      
      if (!holdings) {
        return NextResponse.json({
          success: false,
          error: 'ETF not found or no holdings data',
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...holdings,
          etfInfo: etfInfo || null,
        },
      });
    }
    
    // 종목으로 ETF 검색
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter "q" is required (minimum 1 character)',
      }, { status: 400 });
    }
    
    const results = searchETFsByHolding(query);
    
    // ETF 추가 정보 병합
    const enrichedResults = results.map(result => {
      const etfInfo = findETFByTicker(result.etfTicker);
      return {
        ...result,
        etfCategory: etfInfo?.category || 'Unknown',
        etfExpenseRatio: etfInfo?.expenseRatio,
        etfIssuer: etfInfo?.issuer,
        etfDescription: etfInfo?.description,
      };
    });
    
    return NextResponse.json({
      success: true,
      query,
      totalResults: enrichedResults.length,
      data: enrichedResults,
    });
    
  } catch (error) {
    console.error('ETF by holding API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search ETFs by holding',
    }, { status: 500 });
  }
}

/**
 * POST /api/etf/by-holding
 * body: { holdings: ['AAPL', 'NVDA'] }
 * 
 * 여러 종목이 포함된 ETF 검색
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdings } = body;
    
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Holdings array is required',
      }, { status: 400 });
    }
    
    // 각 종목별로 ETF 검색
    const resultsByHolding: Record<string, ReturnType<typeof searchETFsByHolding>> = {};
    for (const holding of holdings) {
      resultsByHolding[holding] = searchETFsByHolding(holding);
    }
    
    // 모든 종목을 포함하는 ETF 찾기
    const allETFs = new Set<string>();
    const etfCounts: Record<string, number> = {};
    
    for (const holding in resultsByHolding) {
      for (const result of resultsByHolding[holding]) {
        allETFs.add(result.etfTicker);
        etfCounts[result.etfTicker] = (etfCounts[result.etfTicker] || 0) + 1;
      }
    }
    
    // 모든 종목을 포함하는 ETF만 필터링
    const matchingETFs = Array.from(allETFs)
      .filter(etf => etfCounts[etf] === holdings.length)
      .map(etfTicker => {
        const etfInfo = findETFByTicker(etfTicker);
        
        // 각 종목별 비중 합계
        let totalWeight = 0;
        const holdingDetails: { ticker: string; weight: number }[] = [];
        
        for (const holding of holdings) {
          const result = resultsByHolding[holding].find(r => r.etfTicker === etfTicker);
          if (result) {
            totalWeight += result.holdingWeight;
            holdingDetails.push({
              ticker: holding,
              weight: result.holdingWeight,
            });
          }
        }
        
        return {
          etfTicker,
          etfName: etfInfo?.name || etfTicker,
          etfNameKo: etfInfo?.nameKo || etfTicker,
          etfCategory: etfInfo?.category || 'Unknown',
          etfExpenseRatio: etfInfo?.expenseRatio,
          totalWeight,
          holdingDetails,
        };
      })
      .sort((a, b) => b.totalWeight - a.totalWeight);
    
    return NextResponse.json({
      success: true,
      holdings,
      totalResults: matchingETFs.length,
      data: matchingETFs,
    });
    
  } catch (error) {
    console.error('ETF by multiple holdings API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search ETFs by multiple holdings',
    }, { status: 500 });
  }
}

