import { NextRequest, NextResponse } from 'next/server';
import { findETFByTicker, ALL_ETFS, POPULAR_ETFS } from '@/lib/data/etf-list';
import { getETFHoldings } from '@/lib/data/etf-holdings';
import { 
  getCachedETFPrice, 
  getCachedETFPerformance,
  fetchMultipleETFPerformance,
  type ETFPerformance 
} from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';

export interface ETFCompareData {
  ticker: string;
  name: string;
  nameKo: string;
  issuer: string;
  category: string;
  assetClass: string;
  region: string;
  expenseRatio: number;
  aum?: number;
  description: string;
  // Performance (실시간)
  return1m: number;
  return3m: number;
  return1y: number;
  returnYTD: number;
  dividendYield: number;
  // Current price (실시간)
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  // Holdings
  topHoldings?: { ticker: string; name: string; weight: number }[];
  // 데이터 출처
  dataSource?: string;
}

/**
 * GET /api/etf/compare?tickers=SPY,VOO,QQQ
 * GET /api/etf/compare?popular=true
 * 
 * ETF 비교 데이터 API - 실시간 데이터 사용
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers');
  const popular = searchParams.get('popular');
  const withPrice = searchParams.get('withPrice') !== 'false'; // 기본 true

  try {
    // 인기 ETF 목록 반환
    if (popular === 'true') {
      const popularEtfs = POPULAR_ETFS.map(ticker => {
        const etf = findETFByTicker(ticker);
        return etf ? { ticker: etf.ticker, name: etf.name, nameKo: etf.nameKo } : null;
      }).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: popularEtfs,
      });
    }

    if (!tickersParam) {
      return NextResponse.json({
        success: false,
        error: 'tickers parameter required (comma-separated)',
      }, { status: 400 });
    }

    const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    
    if (tickers.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'At least 2 tickers required for comparison',
      }, { status: 400 });
    }

    if (tickers.length > 5) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 5 ETFs can be compared at once',
      }, { status: 400 });
    }

    // US ETF만 필터링 (수익률 데이터 조회 가능한 것들)
    const usETFs = tickers.filter(t => {
      const etf = findETFByTicker(t);
      return etf && etf.region === 'US';
    });

    // 수익률 데이터 일괄 조회 (실시간)
    const performanceMap = usETFs.length > 0 
      ? await fetchMultipleETFPerformance(usETFs)
      : new Map<string, ETFPerformance>();

    // ETF 데이터 수집
    const compareData: ETFCompareData[] = [];

    for (const ticker of tickers) {
      const etf = findETFByTicker(ticker);
      if (!etf) {
        continue; // 없는 ETF는 건너뜀
      }

      const holdings = getETFHoldings(ticker);
      
      // 기본 데이터
      const data: ETFCompareData = {
        ticker: etf.ticker,
        name: etf.name,
        nameKo: etf.nameKo,
        issuer: etf.issuer,
        category: etf.category,
        assetClass: etf.assetClass,
        region: etf.region,
        expenseRatio: etf.expenseRatio,
        aum: etf.aum,
        description: etf.description,
        return1m: 0,
        return3m: 0,
        return1y: 0,
        returnYTD: 0,
        dividendYield: 0,
        topHoldings: holdings?.holdings.slice(0, 5).map(h => ({
          ticker: h.ticker,
          name: h.nameKo,
          weight: h.weight,
        })),
        dataSource: 'static',
      };

      // 실시간 수익률 데이터 적용
      const performance = performanceMap.get(ticker);
      if (performance) {
        data.return1m = performance.return1m;
        data.return3m = performance.return3m;
        data.return1y = performance.return1y;
        data.returnYTD = performance.returnYTD;
        data.dividendYield = performance.dividendYield;
        data.dataSource = 'yahoo';
      }

      // 실시간 가격 조회
      if (withPrice) {
        try {
          if (etf.region === 'US') {
            const quote = await getCachedETFPrice(ticker);
            if (quote) {
              data.price = quote.price;
              data.change = quote.change;
              data.changePercent = quote.changePercent;
              data.currency = quote.currency;
              data.dataSource = 'yahoo';
            }
          } else if (etf.region === 'KR') {
            const naverData = await fetchNaverETFDetail(ticker);
            if (naverData) {
              data.price = naverData.price;
              data.change = naverData.change;
              data.changePercent = naverData.changePercent;
              data.currency = 'KRW';
              data.dataSource = 'naver';
            }
          }
        } catch (e) {
          console.error(`Price fetch failed for ${ticker}:`, e);
        }
      }

      compareData.push(data);
    }

    if (compareData.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Could not find enough valid ETFs to compare',
      }, { status: 400 });
    }

    // 비교 분석 생성
    const analysis = generateComparisonAnalysis(compareData);

    return NextResponse.json({
      success: true,
      isRealTime: compareData.some(d => d.dataSource === 'yahoo' || d.dataSource === 'naver'),
      data: compareData,
      analysis,
    });

  } catch (error) {
    console.error('ETF compare API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to compare ETFs',
    }, { status: 500 });
  }
}

// 비교 분석 생성
function generateComparisonAnalysis(etfs: ETFCompareData[]) {
  // 최저 보수
  const lowestExpense = etfs.reduce((min, e) => e.expenseRatio < min.expenseRatio ? e : min);
  // 최고 1년 수익률
  const highestReturn1y = etfs.reduce((max, e) => e.return1y > max.return1y ? e : max);
  // 최고 배당률
  const highestDividend = etfs.reduce((max, e) => e.dividendYield > max.dividendYield ? e : max);
  // 최대 AUM
  const largestAum = etfs.reduce((max, e) => (e.aum || 0) > (max.aum || 0) ? e : max);

  return {
    lowestExpense: {
      ticker: lowestExpense.ticker,
      nameKo: lowestExpense.nameKo,
      value: lowestExpense.expenseRatio,
      label: '가장 낮은 보수',
    },
    highestReturn1y: {
      ticker: highestReturn1y.ticker,
      nameKo: highestReturn1y.nameKo,
      value: highestReturn1y.return1y,
      label: '1년 최고 수익률',
    },
    highestDividend: {
      ticker: highestDividend.ticker,
      nameKo: highestDividend.nameKo,
      value: highestDividend.dividendYield,
      label: '가장 높은 배당률',
    },
    largestAum: {
      ticker: largestAum.ticker,
      nameKo: largestAum.nameKo,
      value: largestAum.aum,
      label: '가장 큰 운용자산',
    },
  };
}
