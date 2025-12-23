/**
 * 국내 ETF 구성종목 데이터
 * 주요 국내 상장 ETF의 상위 보유 종목 정보
 */

export interface HoldingInfo {
  ticker: string;      // 종목 티커
  name: string;        // 종목명 (영문)
  nameKo: string;      // 종목명 (한글)
  weight: number;      // 비중 (%)
  sector?: string;     // 섹터
}

export interface ETFHoldings {
  etfTicker: string;
  etfName: string;
  etfNameKo: string;
  holdings: HoldingInfo[];
  lastUpdated: string;
}

// 국내 상장 ETF 구성종목 데이터
export const ETF_HOLDINGS_DATA: ETFHoldings[] = [
  {
    etfTicker: '069500',
    etfName: 'KODEX 200',
    etfNameKo: 'KODEX 200',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자', weight: 28.5, sector: '반도체' },
      { ticker: '000660', name: 'SK Hynix', nameKo: 'SK하이닉스', weight: 8.2, sector: '반도체' },
      { ticker: '373220', name: 'LG Energy Solution', nameKo: 'LG에너지솔루션', weight: 4.5, sector: '2차전지' },
      { ticker: '005380', name: 'Hyundai Motor', nameKo: '현대차', weight: 3.8, sector: '자동차' },
      { ticker: '000270', name: 'Kia', nameKo: '기아', weight: 2.9, sector: '자동차' },
      { ticker: '035420', name: 'NAVER', nameKo: '네이버', weight: 2.8, sector: 'IT' },
      { ticker: '051910', name: 'LG Chem', nameKo: 'LG화학', weight: 2.5, sector: '화학' },
      { ticker: '006400', name: 'Samsung SDI', nameKo: '삼성SDI', weight: 2.3, sector: '2차전지' },
      { ticker: '035720', name: 'Kakao', nameKo: '카카오', weight: 1.8, sector: 'IT' },
      { ticker: '105560', name: 'KB Financial', nameKo: 'KB금융', weight: 1.7, sector: '금융' },
    ],
  },
  {
    etfTicker: '102110',
    etfName: 'TIGER 200',
    etfNameKo: 'TIGER 200',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자', weight: 28.3, sector: '반도체' },
      { ticker: '000660', name: 'SK Hynix', nameKo: 'SK하이닉스', weight: 8.0, sector: '반도체' },
      { ticker: '373220', name: 'LG Energy Solution', nameKo: 'LG에너지솔루션', weight: 4.4, sector: '2차전지' },
      { ticker: '005380', name: 'Hyundai Motor', nameKo: '현대차', weight: 3.7, sector: '자동차' },
      { ticker: '000270', name: 'Kia', nameKo: '기아', weight: 2.8, sector: '자동차' },
      { ticker: '035420', name: 'NAVER', nameKo: '네이버', weight: 2.7, sector: 'IT' },
      { ticker: '051910', name: 'LG Chem', nameKo: 'LG화학', weight: 2.4, sector: '화학' },
      { ticker: '006400', name: 'Samsung SDI', nameKo: '삼성SDI', weight: 2.2, sector: '2차전지' },
      { ticker: '035720', name: 'Kakao', nameKo: '카카오', weight: 1.7, sector: 'IT' },
      { ticker: '055550', name: 'Shinhan Financial', nameKo: '신한지주', weight: 1.6, sector: '금융' },
    ],
  },
  {
    etfTicker: '091160',
    etfName: 'KODEX 반도체',
    etfNameKo: 'KODEX 반도체',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자', weight: 32.5, sector: '반도체' },
      { ticker: '000660', name: 'SK Hynix', nameKo: 'SK하이닉스', weight: 28.2, sector: '반도체' },
      { ticker: '402340', name: 'SK Square', nameKo: 'SK스퀘어', weight: 8.5, sector: '지주' },
      { ticker: '000990', name: 'DB HiTek', nameKo: 'DB하이텍', weight: 5.8, sector: '반도체' },
      { ticker: '336370', name: 'Solbrain', nameKo: '솔브레인', weight: 4.2, sector: '반도체소재' },
      { ticker: '058470', name: 'Leeno Industrial', nameKo: '리노공업', weight: 3.8, sector: '반도체장비' },
      { ticker: '240810', name: 'Wonik IPS', nameKo: '원익IPS', weight: 3.5, sector: '반도체장비' },
      { ticker: '322310', name: 'Opto Tech', nameKo: '오로스테크놀로지', weight: 3.2, sector: '반도체' },
      { ticker: '357780', name: 'Solbrain Holdings', nameKo: '솔브레인홀딩스', weight: 2.8, sector: '반도체소재' },
      { ticker: '039030', name: 'ISC', nameKo: '이오테크닉스', weight: 2.5, sector: '반도체장비' },
    ],
  },
  {
    etfTicker: '305720',
    etfName: 'KODEX 2차전지산업',
    etfNameKo: 'KODEX 2차전지산업',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '373220', name: 'LG Energy Solution', nameKo: 'LG에너지솔루션', weight: 25.5, sector: '2차전지' },
      { ticker: '006400', name: 'Samsung SDI', nameKo: '삼성SDI', weight: 18.2, sector: '2차전지' },
      { ticker: '051910', name: 'LG Chem', nameKo: 'LG화학', weight: 12.5, sector: '화학' },
      { ticker: '086520', name: 'Ecopro', nameKo: '에코프로', weight: 8.8, sector: '2차전지' },
      { ticker: '247540', name: 'Ecopro BM', nameKo: '에코프로비엠', weight: 7.5, sector: '2차전지' },
      { ticker: '003670', name: 'Posco Future M', nameKo: '포스코퓨처엠', weight: 6.8, sector: '2차전지' },
      { ticker: '112610', name: 'CS Wind', nameKo: '씨에스윈드', weight: 5.2, sector: '풍력' },
      { ticker: '005387', name: 'Hyundai Motor 2PB', nameKo: '현대차2우B', weight: 4.5, sector: '자동차' },
      { ticker: '299660', name: 'Shin Heung Precision', nameKo: '신흥에스이씨', weight: 3.8, sector: '2차전지' },
      { ticker: '178920', name: 'PI Advanced Materials', nameKo: 'PI첨단소재', weight: 3.2, sector: '소재' },
    ],
  },
  {
    etfTicker: '360750',
    etfName: 'TIGER 미국S&P500',
    etfNameKo: 'TIGER 미국S&P500',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 7.1, sector: '기술' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 6.8, sector: '기술' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 6.2, sector: '반도체' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 3.8, sector: '소비재' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', nameKo: '구글', weight: 4.2, sector: '기술' },
      { ticker: 'META', name: 'Meta Platforms', nameKo: '메타', weight: 2.5, sector: '기술' },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway', nameKo: '버크셔 해서웨이', weight: 1.8, sector: '금융' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 1.9, sector: '자동차' },
      { ticker: 'UNH', name: 'UnitedHealth', nameKo: '유나이티드헬스', weight: 1.3, sector: '헬스케어' },
      { ticker: 'JPM', name: 'JPMorgan Chase', nameKo: 'JP모건', weight: 1.3, sector: '금융' },
    ],
  },
  {
    etfTicker: '133690',
    etfName: 'TIGER 미국나스닥100',
    etfNameKo: 'TIGER 미국나스닥100',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 8.9, sector: '기술' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 8.1, sector: '기술' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 7.8, sector: '반도체' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 5.3, sector: '소비재' },
      { ticker: 'META', name: 'Meta Platforms', nameKo: '메타', weight: 4.8, sector: '기술' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 4.5, sector: '반도체' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', nameKo: '구글', weight: 5.5, sector: '기술' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 2.8, sector: '자동차' },
      { ticker: 'COST', name: 'Costco', nameKo: '코스트코', weight: 2.5, sector: '소비재' },
      { ticker: 'NFLX', name: 'Netflix Inc.', nameKo: '넷플릭스', weight: 1.8, sector: '기술' },
    ],
  },
  {
    etfTicker: '161510',
    etfName: 'ARIRANG 고배당주',
    etfNameKo: 'ARIRANG 고배당주',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자', weight: 15.2, sector: '반도체' },
      { ticker: '105560', name: 'KB Financial', nameKo: 'KB금융', weight: 8.5, sector: '금융' },
      { ticker: '055550', name: 'Shinhan Financial', nameKo: '신한지주', weight: 7.8, sector: '금융' },
      { ticker: '000810', name: 'Samsung Fire', nameKo: '삼성화재', weight: 6.5, sector: '보험' },
      { ticker: '086790', name: 'Hana Financial', nameKo: '하나금융지주', weight: 6.2, sector: '금융' },
      { ticker: '017670', name: 'SK Telecom', nameKo: 'SK텔레콤', weight: 5.8, sector: '통신' },
      { ticker: '030200', name: 'KT', nameKo: 'KT', weight: 5.2, sector: '통신' },
      { ticker: '032830', name: 'Samsung Life', nameKo: '삼성생명', weight: 4.8, sector: '보험' },
      { ticker: '003550', name: 'LG', nameKo: 'LG', weight: 4.5, sector: '지주' },
      { ticker: '096770', name: 'SK Innovation', nameKo: 'SK이노베이션', weight: 4.2, sector: '에너지' },
    ],
  },
  {
    etfTicker: '211900',
    etfName: 'KODEX 배당성장',
    etfNameKo: 'KODEX 배당성장',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자', weight: 18.5, sector: '반도체' },
      { ticker: '105560', name: 'KB Financial', nameKo: 'KB금융', weight: 7.2, sector: '금융' },
      { ticker: '055550', name: 'Shinhan Financial', nameKo: '신한지주', weight: 6.5, sector: '금융' },
      { ticker: '086790', name: 'Hana Financial', nameKo: '하나금융지주', weight: 5.8, sector: '금융' },
      { ticker: '017670', name: 'SK Telecom', nameKo: 'SK텔레콤', weight: 5.2, sector: '통신' },
      { ticker: '000810', name: 'Samsung Fire', nameKo: '삼성화재', weight: 4.8, sector: '보험' },
      { ticker: '030200', name: 'KT', nameKo: 'KT', weight: 4.5, sector: '통신' },
      { ticker: '032830', name: 'Samsung Life', nameKo: '삼성생명', weight: 4.2, sector: '보험' },
      { ticker: '003550', name: 'LG', nameKo: 'LG', weight: 3.8, sector: '지주' },
      { ticker: '051900', name: 'LG H&H', nameKo: 'LG생활건강', weight: 3.5, sector: '소비재' },
    ],
  },
  {
    etfTicker: '148070',
    etfName: 'KOSEF 국고채10년',
    etfNameKo: 'KOSEF 국고채10년',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'KRBOND10Y', name: 'Korea Treasury 10Y', nameKo: '국고채 10년물', weight: 100.0, sector: '채권' },
    ],
  },
  {
    etfTicker: '132030',
    etfName: 'KODEX 골드선물(H)',
    etfNameKo: 'KODEX 골드선물(H)',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'GOLD', name: 'Gold Futures', nameKo: '금 선물', weight: 100.0, sector: '원자재' },
    ],
  },
  {
    etfTicker: '441800',
    etfName: 'TIGER 미국배당다우존스',
    etfNameKo: 'TIGER 미국배당다우존스',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'ABBV', name: 'AbbVie Inc.', nameKo: '애브비', weight: 4.5, sector: '헬스케어' },
      { ticker: 'MRK', name: 'Merck & Co.', nameKo: '머크', weight: 4.2, sector: '헬스케어' },
      { ticker: 'HD', name: 'Home Depot', nameKo: '홈디포', weight: 4.0, sector: '소비재' },
      { ticker: 'AMGN', name: 'Amgen Inc.', nameKo: '암젠', weight: 3.8, sector: '헬스케어' },
      { ticker: 'TXN', name: 'Texas Instruments', nameKo: '텍사스 인스트루먼트', weight: 3.6, sector: '반도체' },
      { ticker: 'CVX', name: 'Chevron Corp.', nameKo: '셰브론', weight: 3.5, sector: '에너지' },
      { ticker: 'PEP', name: 'PepsiCo Inc.', nameKo: '펩시코', weight: 3.4, sector: '소비재' },
      { ticker: 'CSCO', name: 'Cisco Systems', nameKo: '시스코', weight: 3.2, sector: '기술' },
      { ticker: 'KO', name: 'Coca-Cola Co.', nameKo: '코카콜라', weight: 3.0, sector: '소비재' },
      { ticker: 'VZ', name: 'Verizon', nameKo: '버라이즌', weight: 2.8, sector: '통신' },
    ],
  },
];

// 모든 고유 종목 목록 추출
export function getAllUniqueHoldings(): HoldingInfo[] {
  const holdingsMap = new Map<string, HoldingInfo>();
  
  for (const etf of ETF_HOLDINGS_DATA) {
    for (const holding of etf.holdings) {
      if (!holdingsMap.has(holding.ticker)) {
        holdingsMap.set(holding.ticker, holding);
      }
    }
  }
  
  return Array.from(holdingsMap.values()).sort((a, b) => a.nameKo.localeCompare(b.nameKo));
}

// 종목으로 ETF 검색 (역검색)
export interface ETFByHoldingResult {
  etfTicker: string;
  etfName: string;
  etfNameKo: string;
  holdingWeight: number;
  holdingRank: number;
}

export function searchETFsByHolding(query: string): ETFByHoldingResult[] {
  const results: ETFByHoldingResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const etf of ETF_HOLDINGS_DATA) {
    for (let i = 0; i < etf.holdings.length; i++) {
      const holding = etf.holdings[i];
      const matches = 
        holding.ticker.toLowerCase().includes(lowerQuery) ||
        holding.name.toLowerCase().includes(lowerQuery) ||
        holding.nameKo.includes(query);
      
      if (matches) {
        results.push({
          etfTicker: etf.etfTicker,
          etfName: etf.etfName,
          etfNameKo: etf.etfNameKo,
          holdingWeight: holding.weight,
          holdingRank: i + 1,
        });
      }
    }
  }
  
  // 비중 높은 순으로 정렬
  return results.sort((a, b) => b.holdingWeight - a.holdingWeight);
}

// ETF의 구성종목 조회
export function getETFHoldings(etfTicker: string): ETFHoldings | undefined {
  return ETF_HOLDINGS_DATA.find(e => e.etfTicker === etfTicker);
}

// 인기 종목 목록 (검색 자동완성용)
export const POPULAR_HOLDINGS = [
  { ticker: '005930', name: 'Samsung Electronics', nameKo: '삼성전자' },
  { ticker: '000660', name: 'SK Hynix', nameKo: 'SK하이닉스' },
  { ticker: '373220', name: 'LG Energy Solution', nameKo: 'LG에너지솔루션' },
  { ticker: '005380', name: 'Hyundai Motor', nameKo: '현대차' },
  { ticker: '035420', name: 'NAVER', nameKo: '네이버' },
  { ticker: '035720', name: 'Kakao', nameKo: '카카오' },
  { ticker: '006400', name: 'Samsung SDI', nameKo: '삼성SDI' },
  { ticker: '051910', name: 'LG Chem', nameKo: 'LG화학' },
  { ticker: '247540', name: 'Ecopro BM', nameKo: '에코프로비엠' },
  { ticker: '000270', name: 'Kia', nameKo: '기아' },
];
