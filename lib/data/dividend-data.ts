/**
 * 국내 ETF 배당 데이터
 * 
 * 실제 서비스에서는 외부 API나 DB에서 실시간으로 가져와야 합니다.
 * 현재는 대표적인 국내 배당 ETF의 예상 데이터를 사용합니다.
 */

export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface ETFDividendInfo {
  ticker: string;
  name: string;
  nameKo: string;
  dividendYield: number; // 연 배당수익률 (%)
  frequency: DividendFrequency;
  lastDividend: number; // 최근 배당금 (원)
  exDividendMonths: number[]; // 배당락월 (1-12)
  paymentDelay: number; // 배당락일 후 지급까지 일수
  region: 'KR';
  category: string;
}

// 주요 국내 배당 ETF 데이터
export const DIVIDEND_ETFS: ETFDividendInfo[] = [
  // 월배당 ETF
  {
    ticker: '441800',
    name: 'TIGER 미국배당다우존스',
    nameKo: 'TIGER 미국배당다우존스',
    dividendYield: 3.8,
    frequency: 'monthly',
    lastDividend: 35,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Monthly Dividend',
  },
  {
    ticker: '458730',
    name: 'KODEX 미국배당프리미엄액티브',
    nameKo: 'KODEX 미국배당프리미엄액티브',
    dividendYield: 8.5,
    frequency: 'monthly',
    lastDividend: 72,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Covered Call',
  },
  {
    ticker: '446720',
    name: 'SOL 미국배당다우존스',
    nameKo: 'SOL 미국배당다우존스',
    dividendYield: 3.9,
    frequency: 'monthly',
    lastDividend: 38,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Monthly Dividend',
  },
  // 분기 배당 ETF
  {
    ticker: '161510',
    name: 'ARIRANG 고배당주',
    nameKo: 'ARIRANG 고배당주',
    dividendYield: 5.2,
    frequency: 'quarterly',
    lastDividend: 280,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'High Dividend',
  },
  {
    ticker: '211900',
    name: 'KODEX 배당성장',
    nameKo: 'KODEX 배당성장',
    dividendYield: 2.8,
    frequency: 'quarterly',
    lastDividend: 150,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Dividend Growth',
  },
  {
    ticker: '278530',
    name: 'KODEX 200TR',
    nameKo: 'KODEX 200TR',
    dividendYield: 2.0,
    frequency: 'quarterly',
    lastDividend: 180,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Total Return',
  },
  // 국내 지수 ETF (분기 배당)
  {
    ticker: '069500',
    name: 'KODEX 200',
    nameKo: 'KODEX 200',
    dividendYield: 1.8,
    frequency: 'quarterly',
    lastDividend: 520,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Large Cap',
  },
  {
    ticker: '102110',
    name: 'TIGER 200',
    nameKo: 'TIGER 200',
    dividendYield: 1.7,
    frequency: 'quarterly',
    lastDividend: 480,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Large Cap',
  },
  // 미국 지수 추종 (원화)
  {
    ticker: '360750',
    name: 'TIGER 미국S&P500',
    nameKo: 'TIGER 미국S&P500',
    dividendYield: 1.2,
    frequency: 'quarterly',
    lastDividend: 45,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'US Index',
  },
  {
    ticker: '133690',
    name: 'TIGER 미국나스닥100',
    nameKo: 'TIGER 미국나스닥100',
    dividendYield: 0.5,
    frequency: 'quarterly',
    lastDividend: 35,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'US Tech',
  },
  // 채권 ETF (월배당)
  {
    ticker: '148070',
    name: 'KOSEF 국고채10년',
    nameKo: 'KOSEF 국고채10년',
    dividendYield: 3.5,
    frequency: 'monthly',
    lastDividend: 95,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 3,
    region: 'KR',
    category: 'Bond',
  },
  {
    ticker: '305080',
    name: 'TIGER 미국채10년선물',
    nameKo: 'TIGER 미국채10년선물',
    dividendYield: 3.2,
    frequency: 'quarterly',
    lastDividend: 85,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
    category: 'Bond',
  },
  {
    ticker: '153130',
    name: 'KODEX 단기채권',
    nameKo: 'KODEX 단기채권',
    dividendYield: 3.0,
    frequency: 'monthly',
    lastDividend: 28,
    exDividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    paymentDelay: 3,
    region: 'KR',
    category: 'Bond',
  },
  // 리츠 ETF
  {
    ticker: '329200',
    name: 'TIGER 리츠부동산인프라',
    nameKo: 'TIGER 리츠부동산인프라',
    dividendYield: 4.5,
    frequency: 'quarterly',
    lastDividend: 120,
    exDividendMonths: [3, 6, 9, 12],
    paymentDelay: 5,
    region: 'KR',
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
      annualDividend: Number(annualDividend.toFixed(0)),
      yield: etfInfo.dividendYield,
    });
  }

  return {
    totalAnnualDividend: Number(totalAnnualDividend.toFixed(0)),
    monthlyBreakdown: monthlyBreakdown.map(m => ({
      month: m.month,
      amount: Number(m.amount.toFixed(0)),
    })),
    byETF,
  };
}

/**
 * ETF 배당 정보 조회
 */
export function getDividendETFInfo(ticker: string): ETFDividendInfo | undefined {
  return DIVIDEND_ETFS.find(e => e.ticker === ticker);
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
