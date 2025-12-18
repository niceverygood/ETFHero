import type { MarketDataProvider, StockQuote, StockFinancials, StockNews } from './types';

// Seeded random for reproducibility
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

const MOCK_ETFS: Record<string, { name: string; sector: string; basePrice: number }> = {
  '069500': { name: 'KODEX 200', sector: '시장지수', basePrice: 35000 },
  '102110': { name: 'TIGER 200', sector: '시장지수', basePrice: 37500 },
  '360750': { name: 'TIGER 미국S&P500', sector: '해외지수', basePrice: 18500 },
  '133690': { name: 'TIGER 미국나스닥100', sector: '해외지수', basePrice: 96000 },
  '091160': { name: 'KODEX 반도체', sector: '테마/섹터', basePrice: 42000 },
  '305720': { name: 'KODEX 2차전지산업', sector: '테마/섹터', basePrice: 15800 },
  '379800': { name: 'KODEX 미국S&P500TR', sector: '해외지수', basePrice: 15200 },
  '161510': { name: 'ARIRANG 고배당주', sector: '배당/가치', basePrice: 14500 },
  '148070': { name: 'KOSEF 국고채10년', sector: '채권', basePrice: 102000 },
  '364980': { name: 'TIGER AI반도체핵심공정', sector: '테마/섹터', basePrice: 15300 },
  '381170': { name: 'TIGER 미국테크TOP10', sector: '해외테마', basePrice: 16200 },
  '453810': { name: 'TIGER 미국AI빅테크10', sector: '해외테마', basePrice: 12800 },
  '266160': { name: 'KODEX 배당가치', sector: '배당/가치', basePrice: 12800 },
  '329200': { name: 'TIGER CD금리투자KIS', sector: '채권', basePrice: 52500 },
  '371460': { name: 'TIGER 차이나전기차SOLACTIVE', sector: '해외테마', basePrice: 8200 },
  '143850': { name: 'TIGER 200IT', sector: '테마/섹터', basePrice: 25800 },
  '157450': { name: 'TIGER 모멘텀', sector: '전략/스마트베타', basePrice: 32500 },
  '395170': { name: 'KBSTAR 미국S&P500', sector: '해외지수', basePrice: 14200 },
  '292150': { name: 'TIGER TOP10', sector: '시장지수', basePrice: 13200 },
  '411060': { name: 'ACE 미국빅테크TOP7 Plus', sector: '해외테마', basePrice: 18500 },
};

const NEWS_TEMPLATES = [
  { title: '{name}, 순자산 증가세 지속... 투자자 관심 고조', sentiment: 'positive' as const },
  { title: '{name}, 추종 지수 상승에 수익률 개선', sentiment: 'positive' as const },
  { title: '{name}, 거래량 급증... 자금 유입 확대', sentiment: 'positive' as const },
  { title: '{name}, 외국인 순매수 지속', sentiment: 'positive' as const },
  { title: '{name}, 시장 변동성에 괴리율 확대', sentiment: 'neutral' as const },
  { title: '{name}, 업계 전반 조정 국면 진입', sentiment: 'neutral' as const },
  { title: '{name}, 추종 지수 하락에 따른 조정', sentiment: 'negative' as const },
  { title: '{name}, 유동성 감소로 거래량 부진', sentiment: 'negative' as const },
];

export class MockMarketDataProvider implements MarketDataProvider {
  private dateKey: string;

  constructor() {
    this.dateKey = new Date().toISOString().split('T')[0];
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const etf = MOCK_ETFS[symbol];
    if (!etf) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const random = seededRandom(`${symbol}-${this.dateKey}`);
    const changePercent = (random() - 0.5) * 6; // -3% to +3%
    const change = Math.round(etf.basePrice * changePercent / 100);
    const price = etf.basePrice + change;

    return {
      symbol,
      name: etf.name,
      price,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.round(random() * 10000000) + 1000000,
      marketCap: price * (Math.round(random() * 100000000) + 50000000),
      high52Week: Math.round(etf.basePrice * 1.3),
      low52Week: Math.round(etf.basePrice * 0.7),
      updatedAt: new Date(),
    };
  }

  async getFinancials(symbol: string): Promise<StockFinancials> {
    const etf = MOCK_ETFS[symbol];
    if (!etf) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const random = seededRandom(`${symbol}-financials`);

    return {
      symbol,
      revenue: Math.round(random() * 100000) + 50000, // 억원 (순자산)
      revenueGrowth: (random() - 0.3) * 30, // -9% to +21%
      operatingIncome: Math.round(random() * 20000) + 5000,
      operatingMargin: random() * 20 + 5, // 5% to 25%
      netIncome: Math.round(random() * 15000) + 3000,
      eps: Math.round(random() * 10000) + 2000,
      per: random() * 20 + 8, // 8x to 28x
      pbr: random() * 2 + 0.5, // 0.5x to 2.5x
      roe: random() * 15 + 5, // 5% to 20%
      debtRatio: random() * 100 + 20, // 20% to 120%
      dividendYield: random() * 3 + 0.5, // 0.5% to 3.5%
      fiscalYear: '2024Q3',
    };
  }

  async getNews(symbol: string, limit = 5): Promise<StockNews[]> {
    const etf = MOCK_ETFS[symbol];
    if (!etf) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const random = seededRandom(`${symbol}-news-${this.dateKey}`);
    const sources = ['경제뉴스', '증권일보', '한국경제', '매일경제', 'ETF뉴스'];
    const news: StockNews[] = [];

    for (let i = 0; i < limit; i++) {
      const template = NEWS_TEMPLATES[Math.floor(random() * NEWS_TEMPLATES.length)];
      const hoursAgo = Math.floor(random() * 48);

      news.push({
        id: `${symbol}-news-${i}`,
        symbol,
        title: template.title.replace('{name}', etf.name),
        summary: `${etf.name}(${symbol})에 대한 시장 동향 및 분석 기사입니다.`,
        source: sources[Math.floor(random() * sources.length)],
        publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        sentiment: template.sentiment,
      });
    }

    return news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async getCandidateSymbols(count = 20): Promise<string[]> {
    const symbols = Object.keys(MOCK_ETFS);
    const random = seededRandom(this.dateKey);
    
    // Shuffle and take count
    const shuffled = [...symbols].sort(() => random() - 0.5);
    return shuffled.slice(0, Math.min(count, symbols.length));
  }
}

// Factory function
export function createMarketDataProvider(): MarketDataProvider {
  return new MockMarketDataProvider();
}


