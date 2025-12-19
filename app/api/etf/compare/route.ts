import { NextRequest, NextResponse } from 'next/server';
import { findETFByTicker, ALL_ETFS, POPULAR_ETFS } from '@/lib/data/etf-list';
import { getETFHoldings } from '@/lib/data/etf-holdings';
import { fetchYahooETFPrice } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';

// 성과 데이터 (실제로는 API에서 가져와야 하지만, 데모용 Mock)
const MOCK_PERFORMANCE: Record<string, { return1m: number; return3m: number; return1y: number; return3y: number; dividendYield: number }> = {
  'SPY': { return1m: 2.5, return3m: 8.2, return1y: 28.5, return3y: 42.1, dividendYield: 1.2 },
  'VOO': { return1m: 2.5, return3m: 8.3, return1y: 28.6, return3y: 42.3, dividendYield: 1.3 },
  'IVV': { return1m: 2.5, return3m: 8.2, return1y: 28.5, return3y: 42.2, dividendYield: 1.3 },
  'QQQ': { return1m: 3.2, return3m: 10.5, return1y: 35.2, return3y: 48.5, dividendYield: 0.5 },
  'VTI': { return1m: 2.4, return3m: 7.9, return1y: 27.8, return3y: 40.2, dividendYield: 1.3 },
  'SCHD': { return1m: 1.8, return3m: 5.5, return1y: 18.2, return3y: 28.5, dividendYield: 3.5 },
  'VYM': { return1m: 1.5, return3m: 4.8, return1y: 15.5, return3y: 25.2, dividendYield: 2.9 },
  'ARKK': { return1m: 5.2, return3m: 15.8, return1y: 45.5, return3y: -15.2, dividendYield: 0.0 },
  'SOXX': { return1m: 4.5, return3m: 12.5, return1y: 55.2, return3y: 85.5, dividendYield: 0.6 },
  'SMH': { return1m: 4.8, return3m: 13.2, return1y: 58.5, return3y: 92.1, dividendYield: 0.5 },
  'VGT': { return1m: 3.5, return3m: 11.2, return1y: 38.5, return3y: 55.2, dividendYield: 0.6 },
  'XLK': { return1m: 3.4, return3m: 10.8, return1y: 36.2, return3y: 52.8, dividendYield: 0.7 },
  'BND': { return1m: 0.5, return3m: -1.2, return1y: 2.5, return3y: -8.5, dividendYield: 3.8 },
  'TLT': { return1m: 1.2, return3m: -3.5, return1y: -5.2, return3y: -25.5, dividendYield: 3.5 },
  'GLD': { return1m: 2.8, return3m: 8.5, return1y: 28.5, return3y: 35.2, dividendYield: 0.0 },
  'VNQ': { return1m: 1.5, return3m: 3.2, return1y: 12.5, return3y: 5.8, dividendYield: 3.8 },
  'VEA': { return1m: 0.8, return3m: 2.5, return1y: 8.5, return3y: 12.2, dividendYield: 2.8 },
  'VWO': { return1m: 1.2, return3m: 5.5, return1y: 12.2, return3y: 8.5, dividendYield: 2.5 },
  'XLF': { return1m: 2.2, return3m: 8.5, return1y: 25.5, return3y: 22.8, dividendYield: 1.8 },
  'XLV': { return1m: 1.5, return3m: 4.2, return1y: 8.5, return3y: 18.2, dividendYield: 1.5 },
  'XLE': { return1m: -2.5, return3m: -5.8, return1y: 5.2, return3y: 45.5, dividendYield: 3.5 },
};

// 기본 성과 데이터
function getPerformanceData(ticker: string) {
  return MOCK_PERFORMANCE[ticker] || {
    return1m: (Math.random() - 0.3) * 10,
    return3m: (Math.random() - 0.2) * 15,
    return1y: (Math.random() - 0.1) * 30,
    return3y: (Math.random() - 0.1) * 50,
    dividendYield: Math.random() * 4,
  };
}

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
  // Performance
  return1m: number;
  return3m: number;
  return1y: number;
  return3y: number;
  dividendYield: number;
  // Current price (실시간)
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  // Holdings
  topHoldings?: { ticker: string; name: string; weight: number }[];
}

/**
 * GET /api/etf/compare?tickers=SPY,VOO,QQQ
 * GET /api/etf/compare?popular=true
 * 
 * ETF 비교 데이터 API
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

    // ETF 데이터 수집
    const compareData: ETFCompareData[] = [];

    for (const ticker of tickers) {
      const etf = findETFByTicker(ticker);
      if (!etf) {
        continue; // 없는 ETF는 건너뜀
      }

      const performance = getPerformanceData(ticker);
      const holdings = getETFHoldings(ticker);

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
        return1m: Number(performance.return1m.toFixed(2)),
        return3m: Number(performance.return3m.toFixed(2)),
        return1y: Number(performance.return1y.toFixed(2)),
        return3y: Number(performance.return3y.toFixed(2)),
        dividendYield: Number(performance.dividendYield.toFixed(2)),
        topHoldings: holdings?.holdings.slice(0, 5).map(h => ({
          ticker: h.ticker,
          name: h.nameKo,
          weight: h.weight,
        })),
      };

      // 실시간 가격 조회 (선택)
      if (withPrice) {
        try {
          if (etf.region === 'US') {
            const yahooData = await fetchYahooETFPrice(ticker);
            if (yahooData) {
              data.price = yahooData.price;
              data.change = yahooData.change;
              data.changePercent = yahooData.changePercent;
              data.currency = yahooData.currency;
            }
          } else if (etf.region === 'KR') {
            const naverData = await fetchNaverETFDetail(ticker);
            if (naverData) {
              data.price = naverData.price;
              data.change = naverData.change;
              data.changePercent = naverData.changePercent;
              data.currency = 'KRW';
            }
          }
        } catch (e) {
          // 가격 조회 실패해도 계속 진행
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

