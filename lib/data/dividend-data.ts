/**
 * ETF 배당 데이터
 * 
 * 실제 서비스에서는 외부 API나 DB에서 실시간으로 가져와야 합니다.
 * 현재는 대표적인 배당 ETF의 예상 데이터를 사용합니다.
 */

export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface ETFDividendInfo {
  ticker: string;
  name: string;
  nameKo: string;
  dividendYield: number; // 연 배당수익률 (%)
  frequency: DividendFrequency;
  lastDividend: number; // 최근 배당금 (USD)
  exDividendMonths: number[]; // 배당락월 (1-12)
  paymentDelay: number; // 배당락일 후 지급까지 일수 (보통 2-5일)
  region: 'US' | 'KR';
  category: string;
}

// 주요 배당 ETF 데이터
export const DIVIDEND_ETFS: ETFDividendInfo[] = [
  // 미국 배당 ETF - 분기 배당
  {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity',
    nameKo: 'Schwab 미국 배당주',
    dividendYield: 3.5,
    frequency: 'quarterly',
    lastDividend: 0.75,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Dividend',
  },
  {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield',
    nameKo: '뱅가드 고배당',
    dividendYield: 2.9,
    frequency: 'quarterly',
    lastDividend: 0.85,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Dividend',
  },
  {
    ticker: 'VIG',
    name: 'Vanguard Dividend Appreciation',
    nameKo: '뱅가드 배당성장',
    dividendYield: 1.8,
    frequency: 'quarterly',
    lastDividend: 0.72,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Dividend Growth',
  },
  {
    ticker: 'HDV',
    name: 'iShares Core High Dividend',
    nameKo: 'iShares 고배당',
    dividendYield: 3.8,
    frequency: 'quarterly',
    lastDividend: 1.05,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Dividend',
  },
  {
    ticker: 'DGRO',
    name: 'iShares Core Dividend Growth',
    nameKo: 'iShares 배당성장',
    dividendYield: 2.3,
    frequency: 'quarterly',
    lastDividend: 0.58,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Dividend Growth',
  },
  // 월배당 ETF
  {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income',
    nameKo: 'JPM 프리미엄 인컴',
    dividendYield: 7.5,
    frequency: 'monthly',
    lastDividend: 0.38,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Covered Call',
  },
  {
    ticker: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium',
    nameKo: 'JPM 나스닥 프리미엄',
    dividendYield: 9.2,
    frequency: 'monthly',
    lastDividend: 0.45,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Covered Call',
  },
  {
    ticker: 'QYLD',
    name: 'Global X NASDAQ 100 Covered Call',
    nameKo: 'Global X 나스닥 커버드콜',
    dividendYield: 11.5,
    frequency: 'monthly',
    lastDividend: 0.18,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Covered Call',
  },
  {
    ticker: 'XYLD',
    name: 'Global X S&P 500 Covered Call',
    nameKo: 'Global X S&P500 커버드콜',
    dividendYield: 10.2,
    frequency: 'monthly',
    lastDividend: 0.35,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Covered Call',
  },
  // S&P 500 / 나스닥 (분기 배당)
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500',
    nameKo: 'SPDR S&P 500',
    dividendYield: 1.3,
    frequency: 'quarterly',
    lastDividend: 1.85,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Large Cap',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    nameKo: '뱅가드 S&P 500',
    dividendYield: 1.4,
    frequency: 'quarterly',
    lastDividend: 1.65,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Large Cap',
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ',
    nameKo: 'Invesco 나스닥 100',
    dividendYield: 0.5,
    frequency: 'quarterly',
    lastDividend: 0.62,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Tech',
  },
  // 채권 ETF
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market',
    nameKo: '뱅가드 총채권시장',
    dividendYield: 3.8,
    frequency: 'monthly',
    lastDividend: 0.22,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'Bond',
  },
  {
    ticker: 'TLT',
    name: 'iShares 20+ Year Treasury',
    nameKo: 'iShares 장기국채',
    dividendYield: 3.5,
    frequency: 'monthly',
    lastDividend: 0.28,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'US',
    category: 'Bond',
  },
  // 리츠
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate',
    nameKo: '뱅가드 리츠',
    dividendYield: 4.2,
    frequency: 'quarterly',
    lastDividend: 0.95,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'REIT',
  },
  {
    ticker: 'SCHH',
    name: 'Schwab U.S. REIT',
    nameKo: 'Schwab 미국 리츠',
    dividendYield: 3.8,
    frequency: 'quarterly',
    lastDividend: 0.42,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 3,
    region: 'US',
    category: 'REIT',
  },
];

// 배당 일정 생성
export interface DividendEvent {
  ticker: string;
  name: string;
  nameKo: string;
  exDividendDate: string; // YYYY-MM-DD
  paymentDate: string;
  dividendAmount: number;
  dividendYield: number;
  frequency: DividendFrequency;
  category: string;
}

/**
 * 특정 월의 배당 일정 생성
 */
export function generateDividendEvents(year: number, month: number): DividendEvent[] {
  const events: DividendEvent[] = [];
  
  for (const etf of DIVIDEND_ETFS) {
    // 해당 월에 배당락일이 있는지 확인
    if (etf.exDividendMonths.includes(month)) {
      // 배당락일: 해당 월의 세 번째 금요일 근처 (실제로는 더 복잡함)
      const exDivDay = getThirdFriday(year, month);
      const exDividendDate = new Date(year, month - 1, exDivDay);
      const paymentDate = new Date(exDividendDate);
      paymentDate.setDate(paymentDate.getDate() + etf.paymentDelay);
      
      events.push({
        ticker: etf.ticker,
        name: etf.name,
        nameKo: etf.nameKo,
        exDividendDate: formatDate(exDividendDate),
        paymentDate: formatDate(paymentDate),
        dividendAmount: etf.lastDividend,
        dividendYield: etf.dividendYield,
        frequency: etf.frequency,
        category: etf.category,
      });
    }
  }
  
  return events.sort((a, b) => a.exDividendDate.localeCompare(b.exDividendDate));
}

/**
 * 월의 세 번째 금요일 계산
 */
function getThirdFriday(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const firstFriday = (12 - firstDay.getDay()) % 7 + 1;
  return firstFriday + 14; // 세 번째 금요일
}

/**
 * 날짜 포맷팅
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 연간 배당금 계산
 */
export function calculateAnnualDividend(
  holdings: { ticker: string; shares: number }[]
): {
  totalAnnualDividend: number;
  monthlyBreakdown: { month: number; amount: number }[];
  byETF: { ticker: string; name: string; annualDividend: number; yield: number }[];
} {
  const monthlyBreakdown = Array(12).fill(0).map((_, i) => ({ month: i + 1, amount: 0 }));
  const byETF: { ticker: string; name: string; annualDividend: number; yield: number }[] = [];
  let totalAnnualDividend = 0;

  for (const holding of holdings) {
    const etfInfo = DIVIDEND_ETFS.find(e => e.ticker === holding.ticker);
    if (!etfInfo) continue;

    // 연간 배당금 계산
    let annualDividend = 0;
    const dividendPerPayment = etfInfo.lastDividend;
    const paymentsPerYear = etfInfo.frequency === 'monthly' ? 12 :
                           etfInfo.frequency === 'quarterly' ? 4 :
                           etfInfo.frequency === 'semi-annual' ? 2 : 1;
    
    annualDividend = dividendPerPayment * paymentsPerYear * holding.shares;
    totalAnnualDividend += annualDividend;

    // 월별 배분
    for (const month of etfInfo.exDividendMonths) {
      monthlyBreakdown[month - 1].amount += dividendPerPayment * holding.shares;
    }

    byETF.push({
      ticker: etfInfo.ticker,
      name: etfInfo.nameKo,
      annualDividend: Number(annualDividend.toFixed(2)),
      yield: etfInfo.dividendYield,
    });
  }

  return {
    totalAnnualDividend: Number(totalAnnualDividend.toFixed(2)),
    monthlyBreakdown: monthlyBreakdown.map(m => ({
      month: m.month,
      amount: Number(m.amount.toFixed(2)),
    })),
    byETF,
  };
}

/**
 * ETF 배당 정보 조회
 */
export function getDividendETFInfo(ticker: string): ETFDividendInfo | undefined {
  return DIVIDEND_ETFS.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
}

/**
 * 배당 ETF 검색
 */
export function searchDividendETFs(query: string): ETFDividendInfo[] {
  const lowerQuery = query.toLowerCase();
  return DIVIDEND_ETFS.filter(
    e =>
      e.ticker.toLowerCase().includes(lowerQuery) ||
      e.name.toLowerCase().includes(lowerQuery) ||
      e.nameKo.includes(query)
  );
}

/**
 * 카테고리별 배당 ETF 목록
 */
export function getDividendETFsByCategory(category: string): ETFDividendInfo[] {
  return DIVIDEND_ETFS.filter(e => e.category === category);
}

/**
 * 배당 주기별 ETF 목록
 */
export function getDividendETFsByFrequency(frequency: DividendFrequency): ETFDividendInfo[] {
  return DIVIDEND_ETFS.filter(e => e.frequency === frequency);
}


