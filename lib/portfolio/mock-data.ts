import type { 
  PortfolioSnapshot, 
  PickPerformance, 
  AIPerformance, 
  PortfolioMetrics,
  HallOfFameEntry,
  TimeRange 
} from './types';

// Seeded random for consistent data
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generatePortfolioHistory(range: TimeRange): PortfolioSnapshot[] {
  const days = range === '1w' ? 7 : range === '1m' ? 30 : range === '3m' ? 90 : 180;
  const random = seededRandom(42);
  const snapshots: PortfolioSnapshot[] = [];
  
  let portfolioValue = 10000000; // 1000만원 시작
  let benchmarkValue = 10000000;
  
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Portfolio has slight edge over benchmark
    const portfolioChange = (random() - 0.48) * 0.025;
    const benchmarkChange = (random() - 0.5) * 0.02;
    
    portfolioValue *= (1 + portfolioChange);
    benchmarkValue *= (1 + benchmarkChange);
    
    snapshots.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(portfolioValue),
      returnPct: ((portfolioValue - 10000000) / 10000000) * 100,
      benchmarkValue: Math.round(benchmarkValue),
      benchmarkReturnPct: ((benchmarkValue - 10000000) / 10000000) * 100,
    });
  }
  
  return snapshots;
}

export function generatePickPerformances(range: TimeRange): PickPerformance[] {
  const random = seededRandom(123);
  // ETF 데이터로 변경
  const etfs = [
    { symbol: '069500', name: 'KODEX 200' },
    { symbol: '102110', name: 'TIGER 200' },
    { symbol: '360750', name: 'TIGER 미국S&P500' },
    { symbol: '133690', name: 'TIGER 미국나스닥100' },
    { symbol: '091160', name: 'KODEX 반도체' },
    { symbol: '305720', name: 'KODEX 2차전지산업' },
    { symbol: '379800', name: 'KODEX 미국S&P500TR' },
    { symbol: '161510', name: 'ARIRANG 고배당주' },
    { symbol: '148070', name: 'KOSEF 국고채10년' },
    { symbol: '364980', name: 'TIGER AI반도체핵심공정' },
    { symbol: '371460', name: 'TIGER 차이나전기차SOLACTIVE' },
    { symbol: '143850', name: 'TIGER 200IT' },
    { symbol: '117700', name: 'KODEX 건설' },
    { symbol: '266160', name: 'KODEX 배당가치' },
    { symbol: '329200', name: 'TIGER CD금리투자KIS' },
  ];
  
  const days = range === '1w' ? 7 : range === '1m' ? 30 : range === '3m' ? 90 : 180;
  const numPicks = Math.min(Math.floor(days / 2), etfs.length);
  
  const characters: ('claude' | 'gemini' | 'gpt')[] = ['claude', 'gemini', 'gpt'];
  
  return etfs.slice(0, numPicks).map((etf, i) => {
    const entryPrice = 10000 + random() * 150000;
    const returnPct = (random() - 0.4) * 30;
    const currentPrice = entryPrice * (1 + returnPct / 100);
    const holdingDays = Math.floor(random() * days) + 1;
    
    const pickedBy = characters.filter(() => random() > 0.3);
    if (pickedBy.length === 0) pickedBy.push('claude');
    
    const date = new Date();
    date.setDate(date.getDate() - holdingDays);
    
    return {
      symbol: etf.symbol,
      name: etf.name,
      entryDate: date.toISOString().split('T')[0],
      entryPrice: Math.round(entryPrice),
      currentPrice: Math.round(currentPrice),
      returnPct: Number(returnPct.toFixed(2)),
      holdingDays,
      pickedBy,
      isWinner: returnPct > 0,
    };
  }).sort((a, b) => b.returnPct - a.returnPct);
}

export function generateAIPerformances(): AIPerformance[] {
  return [
    {
      id: 'gemini',
      name: 'Gemi Nine',
      totalPicks: 47,
      winRate: 68.1,
      avgReturn: 4.2,
      totalReturn: 23.8,
      bestSector: '테마/성장 ETF',
      worstSector: '채권 ETF',
      streak: 5,
      rank: 1,
    },
    {
      id: 'claude',
      name: 'Claude Lee',
      totalPicks: 52,
      winRate: 63.5,
      avgReturn: 3.1,
      totalReturn: 18.2,
      bestSector: '시장지수 ETF',
      worstSector: '원자재 ETF',
      streak: 3,
      rank: 2,
    },
    {
      id: 'gpt',
      name: 'G.P. Taylor',
      totalPicks: 44,
      winRate: 59.1,
      avgReturn: 2.8,
      totalReturn: 15.6,
      bestSector: '배당 ETF',
      worstSector: '테마 ETF',
      streak: 2,
      rank: 3,
    },
  ];
}

export function generatePortfolioMetrics(range: TimeRange): PortfolioMetrics {
  const multiplier = range === '1w' ? 0.3 : range === '1m' ? 1 : range === '3m' ? 2.5 : 4;
  
  return {
    totalReturn: 12.4 * multiplier,
    benchmarkReturn: 4.2 * multiplier,
    alpha: 8.2 * multiplier,
    winRate: 64.3,
    avgWin: 8.7,
    avgLoss: -4.2,
    profitFactor: 2.07,
    maxDrawdown: -6.8,
    sharpeRatio: 1.82,
    totalTrades: Math.round(15 * multiplier),
    winningTrades: Math.round(10 * multiplier),
    losingTrades: Math.round(5 * multiplier),
  };
}

export function generateHallOfFame(): HallOfFameEntry[] {
  return [
    { rank: 1, symbol: '091160', name: 'KODEX 반도체', returnPct: 34.2, date: '2024-11-15', pickedBy: ['claude', 'gemini', 'gpt'] },
    { rank: 2, symbol: '305720', name: 'KODEX 2차전지산업', returnPct: 28.7, date: '2024-10-22', pickedBy: ['gemini', 'gpt'] },
    { rank: 3, symbol: '360750', name: 'TIGER 미국S&P500', returnPct: 24.1, date: '2024-12-01', pickedBy: ['claude', 'gemini'] },
    { rank: 4, symbol: '133690', name: 'TIGER 미국나스닥100', returnPct: 21.5, date: '2024-11-28', pickedBy: ['gemini'] },
    { rank: 5, symbol: '364980', name: 'TIGER AI반도체핵심공정', returnPct: 19.8, date: '2024-10-30', pickedBy: ['claude', 'gpt'] },
  ];
}

export function simulateInvestment(amount: number, range: TimeRange): {
  finalValue: number;
  profit: number;
  returnPct: number;
  benchmarkFinal: number;
  benchmarkProfit: number;
} {
  const metrics = generatePortfolioMetrics(range);
  const finalValue = amount * (1 + metrics.totalReturn / 100);
  const benchmarkFinal = amount * (1 + metrics.benchmarkReturn / 100);
  
  return {
    finalValue: Math.round(finalValue),
    profit: Math.round(finalValue - amount),
    returnPct: metrics.totalReturn,
    benchmarkFinal: Math.round(benchmarkFinal),
    benchmarkProfit: Math.round(benchmarkFinal - amount),
  };
}
