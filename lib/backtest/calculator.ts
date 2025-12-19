/**
 * 포트폴리오 백테스트 계산 로직
 */

export interface PortfolioAsset {
  ticker: string;
  weight: number; // 0-100 (%)
  name?: string;
}

export interface BacktestParams {
  portfolio: PortfolioAsset[];
  startDate: string; // YYYY-MM-DD
  endDate: string;
  initialAmount: number; // 초기 투자금
  rebalanceFrequency?: 'none' | 'monthly' | 'quarterly' | 'yearly';
}

export interface DailyValue {
  date: string;
  value: number;
  totalReturn: number; // %
}

export interface BacktestResult {
  // 기본 정보
  portfolio: PortfolioAsset[];
  startDate: string;
  endDate: string;
  initialAmount: number;
  finalAmount: number;
  
  // 수익률 지표
  totalReturn: number; // 총 수익률 (%)
  annualizedReturn: number; // 연평균 수익률 (CAGR, %)
  
  // 위험 지표
  maxDrawdown: number; // 최대 낙폭 (%)
  maxDrawdownDate: string; // MDD 발생일
  volatility: number; // 연간 변동성 (%)
  sharpeRatio: number; // 샤프 비율 (무위험 수익률 4% 가정)
  
  // 벤치마크 비교 (SPY)
  benchmarkReturn?: number;
  alpha?: number; // 초과 수익률
  
  // 일별 데이터 (차트용)
  dailyValues: DailyValue[];
  
  // 연도별 수익률
  yearlyReturns: { year: number; return: number }[];
  
  // 메타데이터
  dataSource: string;
  calculatedAt: string;
}

export interface HistoricalPrice {
  date: string;
  close: number;
  adjustedClose: number;
}

/**
 * Yahoo Finance에서 과거 가격 데이터 조회
 */
export async function fetchHistoricalPrices(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<HistoricalPrice[]> {
  try {
    // Unix timestamp 변환
    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const end = Math.floor(new Date(endDate).getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${end}&interval=1d&events=history`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${ticker}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error(`No data for ${ticker}`);
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close || [];
    
    const prices: HistoricalPrice[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close?.[i] && adjClose[i]) {
        prices.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: quotes.close[i],
          adjustedClose: adjClose[i],
        });
      }
    }

    return prices;
  } catch (error) {
    console.error(`Failed to fetch historical prices for ${ticker}:`, error);
    throw error;
  }
}

/**
 * 포트폴리오 백테스트 실행
 */
export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  const { portfolio, startDate, endDate, initialAmount, rebalanceFrequency = 'none' } = params;
  
  // 1. 모든 ETF의 과거 가격 데이터 가져오기
  const priceDataMap = new Map<string, Map<string, number>>();
  
  for (const asset of portfolio) {
    const prices = await fetchHistoricalPrices(asset.ticker, startDate, endDate);
    const priceMap = new Map<string, number>();
    
    for (const p of prices) {
      priceMap.set(p.date, p.adjustedClose);
    }
    
    priceDataMap.set(asset.ticker, priceMap);
  }

  // 2. 공통 날짜 찾기 (모든 ETF에 데이터가 있는 날짜)
  const allDates = new Set<string>();
  priceDataMap.forEach((priceMap) => {
    priceMap.forEach((_, date) => allDates.add(date));
  });
  
  const commonDates = Array.from(allDates)
    .filter(date => {
      return portfolio.every(asset => priceDataMap.get(asset.ticker)?.has(date));
    })
    .sort();

  if (commonDates.length < 2) {
    throw new Error('Insufficient data for backtest');
  }

  // 3. 일별 포트폴리오 가치 계산
  const dailyValues: DailyValue[] = [];
  let portfolioValue = initialAmount;
  
  // 초기 주식 수량 계산 (비중에 따라 분배)
  const holdings = new Map<string, number>();
  const firstDate = commonDates[0];
  
  for (const asset of portfolio) {
    const price = priceDataMap.get(asset.ticker)!.get(firstDate)!;
    const allocation = initialAmount * (asset.weight / 100);
    holdings.set(asset.ticker, allocation / price);
  }

  // 최고점 추적 (MDD 계산용)
  let peak = initialAmount;
  let maxDrawdown = 0;
  let maxDrawdownDate = firstDate;
  
  // 일별 수익률 (변동성 계산용)
  const dailyReturns: number[] = [];
  let prevValue = initialAmount;

  // 리밸런싱 날짜 추적
  let lastRebalanceMonth = new Date(firstDate).getMonth();
  let lastRebalanceQuarter = Math.floor(new Date(firstDate).getMonth() / 3);
  let lastRebalanceYear = new Date(firstDate).getFullYear();

  for (let i = 0; i < commonDates.length; i++) {
    const date = commonDates[i];
    const currentDate = new Date(date);
    
    // 포트폴리오 현재 가치 계산
    portfolioValue = 0;
    for (const asset of portfolio) {
      const price = priceDataMap.get(asset.ticker)!.get(date)!;
      const shares = holdings.get(asset.ticker)!;
      portfolioValue += shares * price;
    }

    // 리밸런싱 체크
    let shouldRebalance = false;
    if (rebalanceFrequency === 'monthly' && currentDate.getMonth() !== lastRebalanceMonth) {
      shouldRebalance = true;
      lastRebalanceMonth = currentDate.getMonth();
    } else if (rebalanceFrequency === 'quarterly' && Math.floor(currentDate.getMonth() / 3) !== lastRebalanceQuarter) {
      shouldRebalance = true;
      lastRebalanceQuarter = Math.floor(currentDate.getMonth() / 3);
    } else if (rebalanceFrequency === 'yearly' && currentDate.getFullYear() !== lastRebalanceYear) {
      shouldRebalance = true;
      lastRebalanceYear = currentDate.getFullYear();
    }

    // 리밸런싱 실행
    if (shouldRebalance && i > 0) {
      for (const asset of portfolio) {
        const price = priceDataMap.get(asset.ticker)!.get(date)!;
        const targetAllocation = portfolioValue * (asset.weight / 100);
        holdings.set(asset.ticker, targetAllocation / price);
      }
    }

    // MDD 계산
    if (portfolioValue > peak) {
      peak = portfolioValue;
    }
    const drawdown = ((peak - portfolioValue) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = date;
    }

    // 일별 수익률 계산
    if (i > 0) {
      const dailyReturn = (portfolioValue - prevValue) / prevValue;
      dailyReturns.push(dailyReturn);
    }
    prevValue = portfolioValue;

    // 저장
    const totalReturn = ((portfolioValue - initialAmount) / initialAmount) * 100;
    dailyValues.push({
      date,
      value: Math.round(portfolioValue),
      totalReturn: Number(totalReturn.toFixed(2)),
    });
  }

  // 4. 최종 지표 계산
  const finalAmount = portfolioValue;
  const totalReturn = ((finalAmount - initialAmount) / initialAmount) * 100;
  
  // 연평균 수익률 (CAGR)
  const years = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturn = (Math.pow(finalAmount / initialAmount, 1 / years) - 1) * 100;
  
  // 연간 변동성
  const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
  const dailyVolatility = Math.sqrt(variance);
  const annualVolatility = dailyVolatility * Math.sqrt(252) * 100;
  
  // 샤프 비율 (무위험 수익률 4% 가정)
  const riskFreeRate = 4;
  const sharpeRatio = annualVolatility > 0 ? (annualizedReturn - riskFreeRate) / annualVolatility : 0;

  // 5. 연도별 수익률 계산
  const yearlyReturns: { year: number; return: number }[] = [];
  const yearlyData = new Map<number, { start: number; end: number }>();
  
  for (const dv of dailyValues) {
    const year = new Date(dv.date).getFullYear();
    if (!yearlyData.has(year)) {
      yearlyData.set(year, { start: dv.value, end: dv.value });
    } else {
      yearlyData.get(year)!.end = dv.value;
    }
  }
  
  yearlyData.forEach((data, year) => {
    const yearReturn = ((data.end - data.start) / data.start) * 100;
    yearlyReturns.push({ year, return: Number(yearReturn.toFixed(2)) });
  });

  // 6. 벤치마크 비교 (SPY)
  let benchmarkReturn: number | undefined;
  let alpha: number | undefined;
  
  try {
    const spyPrices = await fetchHistoricalPrices('SPY', startDate, endDate);
    if (spyPrices.length >= 2) {
      const spyStart = spyPrices[0].adjustedClose;
      const spyEnd = spyPrices[spyPrices.length - 1].adjustedClose;
      benchmarkReturn = ((spyEnd - spyStart) / spyStart) * 100;
      alpha = totalReturn - benchmarkReturn;
    }
  } catch (e) {
    console.log('Failed to fetch benchmark data');
  }

  return {
    portfolio,
    startDate: commonDates[0],
    endDate: commonDates[commonDates.length - 1],
    initialAmount,
    finalAmount: Math.round(finalAmount),
    totalReturn: Number(totalReturn.toFixed(2)),
    annualizedReturn: Number(annualizedReturn.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownDate,
    volatility: Number(annualVolatility.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    benchmarkReturn: benchmarkReturn ? Number(benchmarkReturn.toFixed(2)) : undefined,
    alpha: alpha ? Number(alpha.toFixed(2)) : undefined,
    dailyValues,
    yearlyReturns,
    dataSource: 'yahoo',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 포트폴리오 최적화 (간단한 버전)
 */
export function suggestOptimalWeights(
  returns: Map<string, number[]>,
  tickers: string[]
): { ticker: string; suggestedWeight: number }[] {
  // 간단한 역 변동성 가중 방식
  const volatilities = new Map<string, number>();
  
  tickers.forEach(ticker => {
    const tickerReturns = returns.get(ticker) || [];
    if (tickerReturns.length > 0) {
      const avg = tickerReturns.reduce((a, b) => a + b, 0) / tickerReturns.length;
      const variance = tickerReturns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / tickerReturns.length;
      volatilities.set(ticker, Math.sqrt(variance));
    }
  });

  // 역 변동성 가중치 계산
  let totalInverseVol = 0;
  volatilities.forEach(vol => {
    if (vol > 0) totalInverseVol += 1 / vol;
  });

  return tickers.map(ticker => {
    const vol = volatilities.get(ticker) || 1;
    const weight = vol > 0 ? (1 / vol) / totalInverseVol * 100 : 100 / tickers.length;
    return {
      ticker,
      suggestedWeight: Math.round(weight),
    };
  });
}

