/**
 * 네이버 금융에서 ETF 데이터 스크래핑
 * 
 * 국내 ETF: https://finance.naver.com/sise/etf.naver
 * 개별 ETF: https://finance.naver.com/item/main.naver?code=069500
 */

export interface NaverETFItem {
  ticker: string;        // 종목코드
  name: string;          // ETF 이름
  price: number;         // 현재가
  change: number;        // 전일대비
  changePercent: number; // 등락률
  volume: number;        // 거래량
  nav: number;           // 순자산가치 (NAV)
  trackingError?: number; // 추적오차
  totalAssets?: number;  // 순자산총액 (억원)
}

export interface ETFDetailInfo {
  ticker: string;
  name: string;
  issuer: string;        // 운용사
  benchmark: string;     // 기초지수
  expenseRatio: number;  // 총보수
  listingDate: string;   // 상장일
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  nav: number;
  totalAssets: number;
  dividendYield?: number;
}

/**
 * 네이버 금융에서 국내 ETF 목록 스크래핑
 */
export async function fetchNaverETFList(): Promise<NaverETFItem[]> {
  try {
    const url = 'https://finance.naver.com/api/sise/etfItemList.nhn?etfType=0&targetColumn=market_sum&sortOrder=desc';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Charset': 'utf-8',
        'Referer': 'https://finance.naver.com/sise/etf.naver',
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!response.ok) {
      throw new Error(`Naver API failed: ${response.status}`);
    }

    // EUC-KR 인코딩 처리
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const text = decoder.decode(buffer);
    const data = JSON.parse(text);
    
    if (!data.result?.etfItemList) {
      console.error('Invalid Naver ETF response:', data);
      return [];
    }

    return data.result.etfItemList.map((item: any) => ({
      ticker: item.itemcode,
      name: item.itemname,
      price: item.nowVal || 0,
      change: item.changeVal || 0,
      changePercent: item.changeRate || 0,
      volume: item.quant || 0,
      nav: item.nav || 0,
      trackingError: item.threeMonthErnrt || 0,
      totalAssets: item.marketSum || 0,
    }));

  } catch (error) {
    console.error('Failed to fetch Naver ETF list:', error);
    return [];
  }
}

/**
 * 네이버 금융에서 특정 ETF 상세 정보 스크래핑
 */
export async function fetchNaverETFDetail(ticker: string): Promise<ETFDetailInfo | null> {
  try {
    // 기본 시세 정보
    const priceUrl = `https://api.finance.naver.com/siseJson.naver?symbol=${ticker}&requestType=1&count=1`;
    
    const response = await fetch(priceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    // 간단한 가격 정보만 반환 (상세 정보는 HTML 파싱 필요)
    // 여기서는 ETF 목록에서 가져온 데이터 활용
    const etfList = await fetchNaverETFList();
    const etf = etfList.find(e => e.ticker === ticker);
    
    if (!etf) {
      return null;
    }

    return {
      ticker: etf.ticker,
      name: etf.name,
      issuer: getIssuerFromName(etf.name),
      benchmark: getBenchmarkFromName(etf.name),
      expenseRatio: 0.15, // 기본값 (상세 페이지 파싱 필요)
      listingDate: '',
      price: etf.price,
      change: etf.change,
      changePercent: etf.changePercent,
      volume: etf.volume,
      nav: etf.nav,
      totalAssets: etf.totalAssets || 0,
    };

  } catch (error) {
    console.error(`Failed to fetch ETF detail for ${ticker}:`, error);
    return null;
  }
}

/**
 * ETF 이름에서 운용사 추출
 */
function getIssuerFromName(name: string): string {
  const issuers: [string, string][] = [
    ['KODEX', '삼성자산운용'],
    ['TIGER', '미래에셋자산운용'],
    ['KBSTAR', 'KB자산운용'],
    ['KOSEF', '한국투자신탁운용'],
    ['HANARO', 'NH-Amundi자산운용'],
    ['ARIRANG', '한화자산운용'],
    ['SOL', '신한자산운용'],
    ['KINDEX', '한국투자신탁운용'],
    ['ACE', '한국투자신탁운용'],
    ['TIMEFOLIO', '타임폴리오자산운용'],
  ];

  for (const [prefix, issuer] of issuers) {
    if (name.includes(prefix)) {
      return issuer;
    }
  }
  return '기타';
}

/**
 * ETF 이름에서 기초지수 추출
 */
function getBenchmarkFromName(name: string): string {
  if (name.includes('200')) return 'KOSPI 200';
  if (name.includes('코스닥150')) return 'KOSDAQ 150';
  if (name.includes('S&P500') || name.includes('미국S&P')) return 'S&P 500';
  if (name.includes('나스닥') || name.includes('NASDAQ')) return 'NASDAQ 100';
  if (name.includes('배당')) return '고배당 지수';
  if (name.includes('2차전지')) return '2차전지 테마';
  if (name.includes('반도체')) return '반도체 테마';
  if (name.includes('AI')) return 'AI 테마';
  return '기타';
}

/**
 * 인기 국내 ETF 목록 (거래량 기준 상위)
 */
export async function fetchTopKoreanETFs(limit: number = 20): Promise<NaverETFItem[]> {
  const allETFs = await fetchNaverETFList();
  
  // 거래량 기준 정렬
  return allETFs
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

/**
 * 순자산 기준 상위 ETF
 */
export async function fetchTopETFsByAssets(limit: number = 20): Promise<NaverETFItem[]> {
  const allETFs = await fetchNaverETFList();
  
  // 순자산총액 기준 정렬
  return allETFs
    .sort((a, b) => (b.totalAssets || 0) - (a.totalAssets || 0))
    .slice(0, limit);
}

/**
 * 카테고리별 대표 ETF 매핑
 */
export const KOREAN_ETF_CATEGORIES: Record<string, string[]> = {
  '시장지수': ['069500', '102110', '229200', '252670'], // KODEX 200, TIGER 200 등
  '해외주식': ['360750', '379800', '379810', '133690'], // TIGER 미국S&P500, 나스닥100 등
  '배당': ['161510', '211560', '266160', '292340'], // 고배당 ETF들
  '섹터': ['091160', '091170', '117700', '139260'], // 반도체, 2차전지 등
  '채권': ['148070', '152380', '153130', '114260'], // 채권 ETF들
  '원자재': ['132030', '319640', '130680'], // 금, 원유 등
};

/**
 * 카테고리 이름에서 ETF 필터링
 */
export function filterETFsByCategory(etfs: NaverETFItem[], category: string): NaverETFItem[] {
  const categoryKeywords: Record<string, string[]> = {
    '시장지수': ['200', 'KOSPI', '코스피', 'KOSDAQ', '코스닥'],
    '해외주식': ['미국', 'S&P', '나스닥', 'NASDAQ', '선진국', '신흥국', '중국', '일본'],
    '배당': ['배당', '고배당', 'dividend'],
    '섹터': ['반도체', '2차전지', '바이오', 'IT', '자동차', '은행', '금융'],
    '테마': ['AI', '메타버스', '클라우드', '로봇', '친환경', 'ESG'],
    '채권': ['국채', '채권', '회사채', '국고채'],
    '원자재': ['금', '은', '원유', '구리', '천연가스'],
  };

  const keywords = categoryKeywords[category] || [];
  if (keywords.length === 0) return etfs;

  return etfs.filter(etf => 
    keywords.some(kw => etf.name.includes(kw))
  );
}

