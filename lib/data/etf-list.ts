/**
 * ETF 상품 데이터
 * 미국 및 한국 주요 ETF 목록
 * 
 * 데이터 업데이트: 2024년 12월
 */

export interface ETFProduct {
  ticker: string;       // ETF 티커
  name: string;         // 영문명
  nameKo: string;       // 한글명
  issuer: string;       // 운용사
  category: string;     // 카테고리
  assetClass: string;   // 자산군
  region: string;       // 지역
  expenseRatio: number; // 총보수 (%)
  aum?: number;         // 운용자산 (억 달러)
  description: string;  // 설명
}

// 미국 ETF 목록
export const US_ETFS: ETFProduct[] = [
  // 대형주/지수 추종
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', nameKo: 'SPDR S&P 500', issuer: 'State Street', category: 'US Large Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.0945, aum: 5000, description: 'S&P 500 지수를 추적하는 세계 최대 ETF' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', nameKo: '뱅가드 S&P 500', issuer: 'Vanguard', category: 'US Large Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.03, aum: 4000, description: '저비용 S&P 500 추적 ETF' },
  { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', nameKo: 'iShares S&P 500', issuer: 'iShares', category: 'US Large Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.03, aum: 3500, description: 'S&P 500 추적 저비용 ETF' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', nameKo: '뱅가드 토탈 스탁 마켓', issuer: 'Vanguard', category: 'US Large Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.03, aum: 3800, description: '미국 전체 주식 시장 투자' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', nameKo: 'Invesco QQQ', issuer: 'Invesco', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.20, aum: 2500, description: '나스닥 100 지수 추적 ETF' },
  
  // 성장주/가치주
  { ticker: 'VUG', name: 'Vanguard Growth ETF', nameKo: '뱅가드 성장주', issuer: 'Vanguard', category: 'US Growth', assetClass: 'Equity', region: 'US', expenseRatio: 0.04, aum: 900, description: '미국 대형 성장주 투자' },
  { ticker: 'IWF', name: 'iShares Russell 1000 Growth ETF', nameKo: 'iShares 러셀 성장', issuer: 'iShares', category: 'US Growth', assetClass: 'Equity', region: 'US', expenseRatio: 0.19, aum: 800, description: '러셀 1000 성장주 지수 추적' },
  { ticker: 'VTV', name: 'Vanguard Value ETF', nameKo: '뱅가드 가치주', issuer: 'Vanguard', category: 'US Value', assetClass: 'Equity', region: 'US', expenseRatio: 0.04, aum: 700, description: '미국 대형 가치주 투자' },
  { ticker: 'IWD', name: 'iShares Russell 1000 Value ETF', nameKo: 'iShares 러셀 가치', issuer: 'iShares', category: 'US Value', assetClass: 'Equity', region: 'US', expenseRatio: 0.19, aum: 600, description: '러셀 1000 가치주 지수 추적' },
  
  // 소형주
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', nameKo: 'iShares 러셀 2000', issuer: 'iShares', category: 'US Small Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.19, aum: 700, description: '미국 소형주 지수 추적' },
  { ticker: 'VB', name: 'Vanguard Small-Cap ETF', nameKo: '뱅가드 소형주', issuer: 'Vanguard', category: 'US Small Cap', assetClass: 'Equity', region: 'US', expenseRatio: 0.05, aum: 500, description: '미국 소형주 투자' },
  
  // 기술/반도체
  { ticker: 'VGT', name: 'Vanguard Information Technology ETF', nameKo: '뱅가드 IT', issuer: 'Vanguard', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.10, aum: 700, description: '미국 IT 섹터 투자' },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund', nameKo: 'SPDR 기술 섹터', issuer: 'State Street', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 600, description: 'S&P 500 기술 섹터 추적' },
  { ticker: 'SOXX', name: 'iShares Semiconductor ETF', nameKo: 'iShares 반도체', issuer: 'iShares', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.35, aum: 120, description: '반도체 기업 집중 투자' },
  { ticker: 'SMH', name: 'VanEck Semiconductor ETF', nameKo: 'VanEck 반도체', issuer: 'VanEck', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.35, aum: 150, description: '반도체 기업 투자 ETF' },
  
  // 혁신/테마
  { ticker: 'ARKK', name: 'ARK Innovation ETF', nameKo: 'ARK 이노베이션', issuer: 'ARK Invest', category: 'Thematic', assetClass: 'Equity', region: 'US', expenseRatio: 0.75, aum: 80, description: '혁신 기업 액티브 ETF' },
  { ticker: 'ARKG', name: 'ARK Genomic Revolution ETF', nameKo: 'ARK 유전체 혁명', issuer: 'ARK Invest', category: 'Thematic', assetClass: 'Equity', region: 'US', expenseRatio: 0.75, aum: 30, description: '유전체 혁명 관련 기업' },
  { ticker: 'BOTZ', name: 'Global X Robotics & AI ETF', nameKo: 'Global X 로봇/AI', issuer: 'Global X', category: 'Thematic', assetClass: 'Equity', region: 'Global', expenseRatio: 0.68, aum: 25, description: '로봇/AI 기업 투자' },
  { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', nameKo: 'iShares 클린에너지', issuer: 'iShares', category: 'Thematic', assetClass: 'Equity', region: 'Global', expenseRatio: 0.40, aum: 40, description: '글로벌 클린에너지 기업' },
  { ticker: 'LIT', name: 'Global X Lithium & Battery Tech ETF', nameKo: 'Global X 리튬/배터리', issuer: 'Global X', category: 'Thematic', assetClass: 'Equity', region: 'Global', expenseRatio: 0.75, aum: 35, description: '리튬/배터리 기술 기업' },
  
  // 배당
  { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', nameKo: '뱅가드 고배당', issuer: 'Vanguard', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.06, aum: 600, description: '고배당 주식 투자' },
  { ticker: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', nameKo: '슈왑 미국 배당', issuer: 'Charles Schwab', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.06, aum: 550, description: '배당 성장주 투자' },
  { ticker: 'DVY', name: 'iShares Select Dividend ETF', nameKo: 'iShares 배당', issuer: 'iShares', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.38, aum: 200, description: '고배당 주식 선별 투자' },
  { ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', nameKo: '뱅가드 배당 성장', issuer: 'Vanguard', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.06, aum: 800, description: '배당 증가 기업 투자' },
  { ticker: 'NOBL', name: 'ProShares S&P 500 Dividend Aristocrats ETF', nameKo: '배당 귀족', issuer: 'ProShares', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.35, aum: 100, description: '25년 이상 배당 증가 기업' },
  
  // 채권
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', nameKo: '뱅가드 토탈 본드', issuer: 'Vanguard', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.03, aum: 1000, description: '미국 전체 채권 시장' },
  { ticker: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', nameKo: 'iShares 미국 종합채권', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.03, aum: 900, description: '미국 투자등급 채권' },
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', nameKo: 'iShares 장기국채', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.15, aum: 400, description: '미국 20년+ 장기 국채' },
  { ticker: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', nameKo: 'iShares 중기국채', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.15, aum: 300, description: '미국 7-10년 중기 국채' },
  { ticker: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', nameKo: 'iShares 단기국채', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.15, aum: 250, description: '미국 1-3년 단기 국채' },
  { ticker: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF', nameKo: 'iShares 투자등급 회사채', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.14, aum: 350, description: '투자등급 회사채' },
  { ticker: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF', nameKo: 'iShares 하이일드', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.48, aum: 200, description: '고수익 회사채' },
  { ticker: 'TIPS', name: 'iShares TIPS Bond ETF', nameKo: 'iShares TIPS', issuer: 'iShares', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.19, aum: 300, description: '물가연동 국채' },
  
  // 해외/신흥국
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', nameKo: '뱅가드 선진국', issuer: 'Vanguard', category: 'International', assetClass: 'Equity', region: 'Global', expenseRatio: 0.05, aum: 1100, description: '미국 외 선진국 투자' },
  { ticker: 'EFA', name: 'iShares MSCI EAFE ETF', nameKo: 'iShares EAFE', issuer: 'iShares', category: 'International', assetClass: 'Equity', region: 'Global', expenseRatio: 0.32, aum: 600, description: '유럽/호주/극동 선진국' },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', nameKo: '뱅가드 신흥국', issuer: 'Vanguard', category: 'Emerging Markets', assetClass: 'Equity', region: 'Global', expenseRatio: 0.08, aum: 800, description: '신흥국 시장 투자' },
  { ticker: 'EEM', name: 'iShares MSCI Emerging Markets ETF', nameKo: 'iShares 신흥국', issuer: 'iShares', category: 'Emerging Markets', assetClass: 'Equity', region: 'Global', expenseRatio: 0.68, aum: 300, description: 'MSCI 신흥국 지수 추적' },
  { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', nameKo: 'iShares Core 신흥국', issuer: 'iShares', category: 'Emerging Markets', assetClass: 'Equity', region: 'Global', expenseRatio: 0.09, aum: 700, description: '저비용 신흥국 투자' },
  
  // 섹터별
  { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund', nameKo: 'SPDR 금융 섹터', issuer: 'State Street', category: 'Financial', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 400, description: '미국 금융 섹터' },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR Fund', nameKo: 'SPDR 헬스케어 섹터', issuer: 'State Street', category: 'Healthcare', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 350, description: '미국 헬스케어 섹터' },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR Fund', nameKo: 'SPDR 에너지 섹터', issuer: 'State Street', category: 'Energy', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 300, description: '미국 에너지 섹터' },
  { ticker: 'XLI', name: 'Industrial Select Sector SPDR Fund', nameKo: 'SPDR 산업재 섹터', issuer: 'State Street', category: 'Industrials', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 200, description: '미국 산업재 섹터' },
  { ticker: 'XLU', name: 'Utilities Select Sector SPDR Fund', nameKo: 'SPDR 유틸리티 섹터', issuer: 'State Street', category: 'Utilities', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 150, description: '미국 유틸리티 섹터' },
  { ticker: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund', nameKo: 'SPDR 필수소비재', issuer: 'State Street', category: 'Consumer Staples', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 180, description: '미국 필수소비재 섹터' },
  { ticker: 'XLY', name: 'Consumer Discretionary Select Sector SPDR Fund', nameKo: 'SPDR 임의소비재', issuer: 'State Street', category: 'Consumer Discretionary', assetClass: 'Equity', region: 'US', expenseRatio: 0.09, aum: 200, description: '미국 임의소비재 섹터' },
  { ticker: 'XLRE', name: 'Real Estate Select Sector SPDR Fund', nameKo: 'SPDR 부동산 섹터', issuer: 'State Street', category: 'Real Estate', assetClass: 'Real Estate', region: 'US', expenseRatio: 0.09, aum: 80, description: '미국 부동산 섹터' },
  
  // 부동산 (REITs)
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', nameKo: '뱅가드 부동산', issuer: 'Vanguard', category: 'Real Estate', assetClass: 'Real Estate', region: 'US', expenseRatio: 0.12, aum: 400, description: '미국 리츠 투자' },
  { ticker: 'IYR', name: 'iShares U.S. Real Estate ETF', nameKo: 'iShares 미국 부동산', issuer: 'iShares', category: 'Real Estate', assetClass: 'Real Estate', region: 'US', expenseRatio: 0.39, aum: 50, description: '미국 부동산 투자' },
  
  // 원자재/금
  { ticker: 'GLD', name: 'SPDR Gold Shares', nameKo: 'SPDR 금', issuer: 'State Street', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.40, aum: 600, description: '금 현물 투자' },
  { ticker: 'IAU', name: 'iShares Gold Trust', nameKo: 'iShares 금', issuer: 'iShares', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.25, aum: 300, description: '저비용 금 투자' },
  { ticker: 'SLV', name: 'iShares Silver Trust', nameKo: 'iShares 은', issuer: 'iShares', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.50, aum: 100, description: '은 현물 투자' },
  { ticker: 'USO', name: 'United States Oil Fund', nameKo: 'US 오일 펀드', issuer: 'USCF', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.79, aum: 30, description: 'WTI 원유 선물 투자' },
  
  // 레버리지/인버스
  { ticker: 'TQQQ', name: 'ProShares UltraPro QQQ', nameKo: 'TQQQ 3배 레버리지', issuer: 'ProShares', category: 'Leveraged', assetClass: 'Equity', region: 'US', expenseRatio: 0.86, aum: 200, description: '나스닥 100 3배 레버리지' },
  { ticker: 'SQQQ', name: 'ProShares UltraPro Short QQQ', nameKo: 'SQQQ 3배 인버스', issuer: 'ProShares', category: 'Inverse', assetClass: 'Equity', region: 'US', expenseRatio: 0.86, aum: 50, description: '나스닥 100 3배 인버스' },
  { ticker: 'UPRO', name: 'ProShares UltraPro S&P 500', nameKo: 'UPRO 3배 레버리지', issuer: 'ProShares', category: 'Leveraged', assetClass: 'Equity', region: 'US', expenseRatio: 0.91, aum: 30, description: 'S&P 500 3배 레버리지' },
];

// 한국 ETF 목록 (확장판)
export const KR_ETFS: ETFProduct[] = [
  // ========== 국내 지수 ==========
  { ticker: '069500', name: 'KODEX 200', nameKo: 'KODEX 200', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.15, aum: 80, description: 'KOSPI 200 지수 추적' },
  { ticker: '102110', name: 'TIGER 200', nameKo: 'TIGER 200', issuer: '미래에셋자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.05, aum: 60, description: 'KOSPI 200 저비용 추적' },
  { ticker: '229200', name: 'KODEX 코스닥150', nameKo: 'KODEX 코스닥150', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.25, aum: 15, description: '코스닥 150 지수 추적' },
  { ticker: '252670', name: 'KODEX 200선물인버스2X', nameKo: 'KODEX 200선물인버스2X', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.64, aum: 40, description: 'KOSPI 200 2배 인버스' },
  { ticker: '122630', name: 'KODEX 레버리지', nameKo: 'KODEX 레버리지', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.64, aum: 35, description: 'KOSPI 200 2배 레버리지' },
  { ticker: '114800', name: 'KODEX 인버스', nameKo: 'KODEX 인버스', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.64, aum: 20, description: 'KOSPI 200 인버스' },
  { ticker: '278530', name: 'KODEX 코스닥150레버리지', nameKo: 'KODEX 코스닥150레버리지', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.64, aum: 10, description: '코스닥150 2배 레버리지' },
  
  // ========== 미국 지수 추종 (국내상장) ==========
  { ticker: '360750', name: 'TIGER 미국S&P500', nameKo: 'TIGER 미국S&P500', issuer: '미래에셋자산운용', category: 'US Index', assetClass: 'Equity', region: 'US', expenseRatio: 0.07, aum: 100, description: 'S&P 500 원화 투자' },
  { ticker: '379800', name: 'KODEX 미국S&P500TR', nameKo: 'KODEX 미국S&P500TR', issuer: '삼성자산운용', category: 'US Index', assetClass: 'Equity', region: 'US', expenseRatio: 0.07, aum: 80, description: 'S&P 500 토탈리턴' },
  { ticker: '133690', name: 'TIGER 미국나스닥100', nameKo: 'TIGER 미국나스닥100', issuer: '미래에셋자산운용', category: 'US Index', assetClass: 'Equity', region: 'US', expenseRatio: 0.07, aum: 90, description: '나스닥 100 원화 투자' },
  { ticker: '379810', name: 'KODEX 미국나스닥100TR', nameKo: 'KODEX 미국나스닥100TR', issuer: '삼성자산운용', category: 'US Index', assetClass: 'Equity', region: 'US', expenseRatio: 0.07, aum: 70, description: '나스닥 100 토탈리턴' },
  { ticker: '381170', name: 'TIGER 미국필라델피아반도체나스닥', nameKo: 'TIGER 미국필라델피아반도체', issuer: '미래에셋자산운용', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.49, aum: 50, description: '미국 반도체 지수' },
  { ticker: '409820', name: 'KODEX 미국반도체MV', nameKo: 'KODEX 미국반도체MV', issuer: '삼성자산운용', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.45, aum: 30, description: '미국 반도체 MV 지수' },
  { ticker: '453850', name: 'TIGER 미국테크TOP10INDXX', nameKo: 'TIGER 미국테크TOP10', issuer: '미래에셋자산운용', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.49, aum: 25, description: '미국 빅테크 10종목' },
  
  // ========== 반도체 ==========
  { ticker: '091160', name: 'KODEX 반도체', nameKo: 'KODEX 반도체', issuer: '삼성자산운용', category: 'Technology', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 20, description: '국내 반도체 기업' },
  { ticker: '091180', name: 'KODEX 자동차', nameKo: 'KODEX 자동차', issuer: '삼성자산운용', category: 'Industrials', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 8, description: '국내 자동차 기업' },
  { ticker: '140710', name: 'KODEX 운송', nameKo: 'KODEX 운송', issuer: '삼성자산운용', category: 'Industrials', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 3, description: '국내 운송 기업' },
  
  // ========== 2차전지/배터리 ==========
  { ticker: '305720', name: 'KODEX 2차전지산업', nameKo: 'KODEX 2차전지산업', issuer: '삼성자산운용', category: 'Thematic', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 30, description: '2차전지 밸류체인 전체' },
  { ticker: '381180', name: 'TIGER 2차전지테마', nameKo: 'TIGER 2차전지테마', issuer: '미래에셋자산운용', category: 'Thematic', assetClass: 'Equity', region: 'KR', expenseRatio: 0.50, aum: 15, description: '2차전지 관련 종목' },
  { ticker: '455850', name: 'KODEX K-배터리액티브', nameKo: 'KODEX K-배터리액티브', issuer: '삼성자산운용', category: 'Thematic', assetClass: 'Equity', region: 'KR', expenseRatio: 0.60, aum: 10, description: 'K-배터리 액티브 운용' },
  { ticker: '473460', name: 'TIGER 2차전지TOP10', nameKo: 'TIGER 2차전지TOP10', issuer: '미래에셋자산운용', category: 'Thematic', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 8, description: '2차전지 상위 10종목' },
  
  // ========== 배당/인컴 ==========
  { ticker: '161510', name: 'ARIRANG 고배당주', nameKo: 'ARIRANG 고배당주', issuer: '한화자산운용', category: 'Dividend', assetClass: 'Equity', region: 'KR', expenseRatio: 0.23, aum: 10, description: '국내 고배당주' },
  { ticker: '211900', name: 'KODEX 배당성장', nameKo: 'KODEX 배당성장', issuer: '삼성자산운용', category: 'Dividend', assetClass: 'Equity', region: 'KR', expenseRatio: 0.30, aum: 8, description: '배당 성장 기업' },
  { ticker: '441800', name: 'TIGER 미국배당다우존스', nameKo: 'TIGER 미국배당다우존스', issuer: '미래에셋자산운용', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.15, aum: 30, description: '미국 배당 다우존스(SCHD형)' },
  { ticker: '458730', name: 'KODEX 미국배당프리미엄액티브', nameKo: 'KODEX 미국배당프리미엄액티브', issuer: '삼성자산운용', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.45, aum: 20, description: '미국 배당+커버드콜' },
  { ticker: '446720', name: 'TIGER 미국배당+7%프리미엄다우존스', nameKo: 'TIGER 미국배당+7%프리미엄', issuer: '미래에셋자산운용', category: 'Dividend', assetClass: 'Equity', region: 'US', expenseRatio: 0.39, aum: 25, description: '미국 배당+월배당' },
  { ticker: '329750', name: 'TIGER 미국MSCI리츠(합성 H)', nameKo: 'TIGER 미국MSCI리츠', issuer: '미래에셋자산운용', category: 'Real Estate', assetClass: 'Real Estate', region: 'US', expenseRatio: 0.24, aum: 15, description: '미국 리츠(환헤지)' },
  
  // ========== 채권 ==========
  { ticker: '148070', name: 'KOSEF 국고채10년', nameKo: 'KOSEF 국고채10년', issuer: '키움투자자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'KR', expenseRatio: 0.07, aum: 5, description: '국고채 10년' },
  { ticker: '152380', name: 'KODEX 국채선물10년', nameKo: 'KODEX 국채선물10년', issuer: '삼성자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'KR', expenseRatio: 0.07, aum: 8, description: '국채 10년 선물' },
  { ticker: '305080', name: 'TIGER 미국채10년선물', nameKo: 'TIGER 미국채10년선물', issuer: '미래에셋자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.30, aum: 10, description: '미국 10년 국채 선물' },
  { ticker: '453080', name: 'KODEX 미국30년국채+12%프리미엄', nameKo: 'KODEX 미국30년국채+12%프리미엄', issuer: '삼성자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.45, aum: 20, description: '미국 장기채+커버드콜' },
  { ticker: '451530', name: 'TIGER 미국채30년스트립액티브', nameKo: 'TIGER 미국채30년스트립액티브', issuer: '미래에셋자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'US', expenseRatio: 0.39, aum: 15, description: '미국 초장기 국채' },
  { ticker: '182490', name: 'TIGER 단기채권액티브', nameKo: 'TIGER 단기채권액티브', issuer: '미래에셋자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'KR', expenseRatio: 0.05, aum: 30, description: '단기채권(현금 대용)' },
  { ticker: '459590', name: 'KODEX CD금리액티브', nameKo: 'KODEX CD금리액티브', issuer: '삼성자산운용', category: 'Bond', assetClass: 'Fixed Income', region: 'KR', expenseRatio: 0.03, aum: 50, description: 'CD금리 추종(예금 대용)' },
  
  // ========== 금/원자재 ==========
  { ticker: '132030', name: 'KODEX 골드선물(H)', nameKo: 'KODEX 골드선물(H)', issuer: '삼성자산운용', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.68, aum: 8, description: '금 선물 (환헤지)' },
  { ticker: '319640', name: 'TIGER 골드선물(H)', nameKo: 'TIGER 골드선물(H)', issuer: '미래에셋자산운용', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.39, aum: 5, description: '금 선물 저비용' },
  { ticker: '411060', name: 'KODEX 은선물(H)', nameKo: 'KODEX 은선물(H)', issuer: '삼성자산운용', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.68, aum: 3, description: '은 선물 (환헤지)' },
  { ticker: '261220', name: 'KODEX WTI원유선물(H)', nameKo: 'KODEX WTI원유선물(H)', issuer: '삼성자산운용', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.68, aum: 5, description: '원유 선물' },
  
  // ========== AI/빅테크 테마 ==========
  { ticker: '418660', name: 'KODEX 미국빅테크10(H)', nameKo: 'KODEX 미국빅테크10', issuer: '삼성자산운용', category: 'Technology', assetClass: 'Equity', region: 'US', expenseRatio: 0.45, aum: 20, description: '미국 빅테크 10종목(환헤지)' },
  { ticker: '465330', name: 'KODEX 미국AI전력핵심인프라', nameKo: 'KODEX 미국AI전력인프라', issuer: '삼성자산운용', category: 'Thematic', assetClass: 'Equity', region: 'US', expenseRatio: 0.45, aum: 15, description: 'AI 전력 인프라' },
  { ticker: '466920', name: 'TIGER AI반도체핵심공정', nameKo: 'TIGER AI반도체핵심공정', issuer: '미래에셋자산운용', category: 'Technology', assetClass: 'Equity', region: 'Global', expenseRatio: 0.49, aum: 12, description: 'AI 반도체 핵심 공정' },
  { ticker: '489250', name: 'KODEX AI전력핵심인프라밸류체인', nameKo: 'KODEX AI전력밸류체인', issuer: '삼성자산운용', category: 'Thematic', assetClass: 'Equity', region: 'Global', expenseRatio: 0.45, aum: 10, description: 'AI 전력 밸류체인' },
  
  // ========== 헬스케어/바이오 ==========
  { ticker: '143860', name: 'KODEX 헬스케어', nameKo: 'KODEX 헬스케어', issuer: '삼성자산운용', category: 'Healthcare', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 5, description: '국내 헬스케어' },
  { ticker: '227540', name: 'TIGER 헬스케어', nameKo: 'TIGER 헬스케어', issuer: '미래에셋자산운용', category: 'Healthcare', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 4, description: '국내 헬스케어' },
  { ticker: '244580', name: 'KODEX 바이오', nameKo: 'KODEX 바이오', issuer: '삼성자산운용', category: 'Healthcare', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 3, description: '국내 바이오 기업' },
  
  // ========== 친환경/ESG ==========
  { ticker: '277630', name: 'TIGER 친환경에너지테크', nameKo: 'TIGER 친환경에너지테크', issuer: '미래에셋자산운용', category: 'Thematic', assetClass: 'Equity', region: 'KR', expenseRatio: 0.50, aum: 5, description: '친환경 에너지 기술' },
  { ticker: '289040', name: 'KODEX MSCI Korea ESG리더스', nameKo: 'KODEX ESG리더스', issuer: '삼성자산운용', category: 'ESG', assetClass: 'Equity', region: 'KR', expenseRatio: 0.30, aum: 3, description: 'ESG 우수 기업' },
  { ticker: '401470', name: 'KODEX 탄소배출권선물ICE', nameKo: 'KODEX 탄소배출권', issuer: '삼성자산운용', category: 'Commodity', assetClass: 'Commodity', region: 'Global', expenseRatio: 0.55, aum: 2, description: '탄소배출권 선물' },
  
  // ========== 금융/은행 ==========
  { ticker: '091220', name: 'KODEX 은행', nameKo: 'KODEX 은행', issuer: '삼성자산운용', category: 'Financial', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 5, description: '국내 은행주' },
  { ticker: '140700', name: 'KODEX 보험', nameKo: 'KODEX 보험', issuer: '삼성자산운용', category: 'Financial', assetClass: 'Equity', region: 'KR', expenseRatio: 0.45, aum: 2, description: '국내 보험주' },
  { ticker: '102780', name: 'KODEX 삼성그룹', nameKo: 'KODEX 삼성그룹', issuer: '삼성자산운용', category: 'KR Index', assetClass: 'Equity', region: 'KR', expenseRatio: 0.25, aum: 15, description: '삼성그룹주' },
  
  // ========== 글로벌/신흥국 ==========
  { ticker: '195930', name: 'TIGER 유로스탁스50(합성 H)', nameKo: 'TIGER 유로스탁스50', issuer: '미래에셋자산운용', category: 'International', assetClass: 'Equity', region: 'EU', expenseRatio: 0.24, aum: 8, description: '유럽 대형주 50' },
  { ticker: '192090', name: 'TIGER 차이나CSI300', nameKo: 'TIGER 차이나CSI300', issuer: '미래에셋자산운용', category: 'Emerging Markets', assetClass: 'Equity', region: 'CN', expenseRatio: 0.70, aum: 10, description: '중국 CSI300 지수' },
  { ticker: '371460', name: 'TIGER 차이나전기차SOLACTIVE', nameKo: 'TIGER 차이나전기차', issuer: '미래에셋자산운용', category: 'Thematic', assetClass: 'Equity', region: 'CN', expenseRatio: 0.70, aum: 5, description: '중국 전기차' },
  { ticker: '236350', name: 'TIGER 인도레버리지(합성)', nameKo: 'TIGER 인도레버리지', issuer: '미래에셋자산운용', category: 'Emerging Markets', assetClass: 'Equity', region: 'IN', expenseRatio: 0.70, aum: 15, description: '인도 Nifty50 2배' },
  { ticker: '453850', name: 'TIGER 인도빌리언컨슈머', nameKo: 'TIGER 인도빌리언컨슈머', issuer: '미래에셋자산운용', category: 'Emerging Markets', assetClass: 'Equity', region: 'IN', expenseRatio: 0.70, aum: 8, description: '인도 소비재' },
  { ticker: '200250', name: 'KODEX 베트남VN30(합성)', nameKo: 'KODEX 베트남VN30', issuer: '삼성자산운용', category: 'Emerging Markets', assetClass: 'Equity', region: 'VN', expenseRatio: 0.70, aum: 10, description: '베트남 VN30 지수' },
  { ticker: '261110', name: 'KODEX 일본(합성 H)', nameKo: 'KODEX 일본', issuer: '삼성자산운용', category: 'International', assetClass: 'Equity', region: 'JP', expenseRatio: 0.24, aum: 6, description: '일본 니케이225' },
];

// 전체 ETF 목록
export const ALL_ETFS: ETFProduct[] = [...US_ETFS, ...KR_ETFS];

// 카테고리 목록
export const ETF_CATEGORIES = Array.from(new Set(ALL_ETFS.map(e => e.category))).sort();

// 운용사 목록
export const ETF_ISSUERS = Array.from(new Set(ALL_ETFS.map(e => e.issuer))).sort();

// 티커로 검색
export function findETFByTicker(ticker: string): ETFProduct | undefined {
  return ALL_ETFS.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
}

// 이름으로 검색 (부분 일치)
export function searchETFsByName(query: string): ETFProduct[] {
  const lowerQuery = query.toLowerCase();
  return ALL_ETFS.filter(e => 
    e.name.toLowerCase().includes(lowerQuery) ||
    e.nameKo.toLowerCase().includes(lowerQuery) ||
    e.ticker.toLowerCase().includes(lowerQuery)
  );
}

// 카테고리별 ETF 조회
export function getETFsByCategory(category: string): ETFProduct[] {
  return ALL_ETFS.filter(e => e.category === category);
}

// 지역별 ETF 조회
export function getETFsByRegion(region: string): ETFProduct[] {
  return ALL_ETFS.filter(e => e.region === region);
}

// 비용 기준 정렬
export function getETFsSortedByExpenseRatio(ascending: boolean = true): ETFProduct[] {
  return [...ALL_ETFS].sort((a, b) => 
    ascending ? a.expenseRatio - b.expenseRatio : b.expenseRatio - a.expenseRatio
  );
}

// 인기 ETF 목록 (국내상장 ETF 중심)
export const POPULAR_ETFS = [
  '069500', '102110', '360750', '133690', '305720',  // KODEX200, TIGER200, S&P500, 나스닥100, 2차전지
  '441800', '381170', '091160', '132030', '148070',  // 미국배당, 반도체, 골드, 국채
  '229200', '453850', '446720', '305080', '418660',  // 코스닥150, 테크TOP10, 배당프리미엄, 미국채, 빅테크
];

// 초보자 추천 ETF (국내상장)
export const BEGINNER_ETFS = [
  '069500',  // KODEX 200
  '360750',  // TIGER 미국S&P500
  '441800',  // TIGER 미국배당다우존스
  '148070',  // KOSEF 국고채10년
  '459590',  // KODEX CD금리액티브
];

// 고배당 ETF (국내상장)
export const HIGH_DIVIDEND_ETFS = [
  '441800',  // TIGER 미국배당다우존스
  '446720',  // TIGER 미국배당+7%프리미엄
  '458730',  // KODEX 미국배당프리미엄액티브
  '161510',  // ARIRANG 고배당주
  '211900',  // KODEX 배당성장
];

// 성장형 ETF (국내상장)
export const GROWTH_ETFS = [
  '133690',  // TIGER 미국나스닥100
  '381170',  // TIGER 미국필라델피아반도체
  '453850',  // TIGER 미국테크TOP10
  '305720',  // KODEX 2차전지산업
  '418660',  // KODEX 미국빅테크10
];

// 안정형 ETF (국내상장)
export const CONSERVATIVE_ETFS = [
  '459590',  // KODEX CD금리액티브
  '182490',  // TIGER 단기채권액티브
  '148070',  // KOSEF 국고채10년
  '305080',  // TIGER 미국채10년선물
  '132030',  // KODEX 골드선물
];


