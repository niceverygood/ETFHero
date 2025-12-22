/**
 * ETF 구성종목 데이터
 * 주요 ETF의 상위 보유 종목 정보
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

// 주요 미국 ETF 구성종목 데이터
export const ETF_HOLDINGS_DATA: ETFHoldings[] = [
  {
    etfTicker: 'SPY',
    etfName: 'SPDR S&P 500 ETF',
    etfNameKo: 'SPDR S&P 500',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 7.1, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 6.8, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 6.2, sector: 'Technology' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 3.8, sector: 'Consumer' },
      { ticker: 'GOOGL', name: 'Alphabet Inc. Class A', nameKo: '구글 A', weight: 2.3, sector: 'Technology' },
      { ticker: 'META', name: 'Meta Platforms Inc.', nameKo: '메타', weight: 2.5, sector: 'Technology' },
      { ticker: 'GOOG', name: 'Alphabet Inc. Class C', nameKo: '구글 C', weight: 1.9, sector: 'Technology' },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway', nameKo: '버크셔 해서웨이', weight: 1.8, sector: 'Financial' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 1.9, sector: 'Consumer' },
      { ticker: 'UNH', name: 'UnitedHealth Group', nameKo: '유나이티드헬스', weight: 1.3, sector: 'Healthcare' },
      { ticker: 'XOM', name: 'Exxon Mobil Corp.', nameKo: '엑슨모빌', weight: 1.2, sector: 'Energy' },
      { ticker: 'JPM', name: 'JPMorgan Chase', nameKo: 'JP모건', weight: 1.3, sector: 'Financial' },
      { ticker: 'JNJ', name: 'Johnson & Johnson', nameKo: '존슨앤존슨', weight: 1.1, sector: 'Healthcare' },
      { ticker: 'V', name: 'Visa Inc.', nameKo: '비자', weight: 1.0, sector: 'Financial' },
      { ticker: 'PG', name: 'Procter & Gamble', nameKo: 'P&G', weight: 1.0, sector: 'Consumer' },
    ],
  },
  {
    etfTicker: 'QQQ',
    etfName: 'Invesco QQQ Trust',
    etfNameKo: 'Invesco QQQ',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 8.9, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 8.1, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 7.8, sector: 'Technology' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 5.3, sector: 'Consumer' },
      { ticker: 'META', name: 'Meta Platforms Inc.', nameKo: '메타', weight: 4.8, sector: 'Technology' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 4.5, sector: 'Technology' },
      { ticker: 'GOOGL', name: 'Alphabet Inc. Class A', nameKo: '구글 A', weight: 2.8, sector: 'Technology' },
      { ticker: 'GOOG', name: 'Alphabet Inc. Class C', nameKo: '구글 C', weight: 2.7, sector: 'Technology' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 2.8, sector: 'Consumer' },
      { ticker: 'COST', name: 'Costco Wholesale', nameKo: '코스트코', weight: 2.5, sector: 'Consumer' },
      { ticker: 'NFLX', name: 'Netflix Inc.', nameKo: '넷플릭스', weight: 1.8, sector: 'Technology' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD', weight: 1.6, sector: 'Technology' },
      { ticker: 'ADBE', name: 'Adobe Inc.', nameKo: '어도비', weight: 1.5, sector: 'Technology' },
      { ticker: 'LIN', name: 'Linde plc', nameKo: '린데', weight: 1.3, sector: 'Materials' },
      { ticker: 'QCOM', name: 'Qualcomm Inc.', nameKo: '퀄컴', weight: 1.2, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'VOO',
    etfName: 'Vanguard S&P 500 ETF',
    etfNameKo: '뱅가드 S&P 500',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 7.1, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 6.8, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 6.2, sector: 'Technology' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 3.8, sector: 'Consumer' },
      { ticker: 'META', name: 'Meta Platforms Inc.', nameKo: '메타', weight: 2.5, sector: 'Technology' },
      { ticker: 'GOOGL', name: 'Alphabet Inc. Class A', nameKo: '구글 A', weight: 2.3, sector: 'Technology' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 1.9, sector: 'Consumer' },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway', nameKo: '버크셔 해서웨이', weight: 1.8, sector: 'Financial' },
      { ticker: 'GOOG', name: 'Alphabet Inc. Class C', nameKo: '구글 C', weight: 1.9, sector: 'Technology' },
      { ticker: 'UNH', name: 'UnitedHealth Group', nameKo: '유나이티드헬스', weight: 1.3, sector: 'Healthcare' },
    ],
  },
  {
    etfTicker: 'VTI',
    etfName: 'Vanguard Total Stock Market ETF',
    etfNameKo: '뱅가드 토탈 스탁 마켓',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 6.5, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 6.2, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 5.6, sector: 'Technology' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존', weight: 3.5, sector: 'Consumer' },
      { ticker: 'META', name: 'Meta Platforms Inc.', nameKo: '메타', weight: 2.3, sector: 'Technology' },
      { ticker: 'GOOGL', name: 'Alphabet Inc. Class A', nameKo: '구글 A', weight: 2.1, sector: 'Technology' },
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 1.7, sector: 'Consumer' },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway', nameKo: '버크셔 해서웨이', weight: 1.6, sector: 'Financial' },
      { ticker: 'GOOG', name: 'Alphabet Inc. Class C', nameKo: '구글 C', weight: 1.8, sector: 'Technology' },
      { ticker: 'UNH', name: 'UnitedHealth Group', nameKo: '유나이티드헬스', weight: 1.2, sector: 'Healthcare' },
    ],
  },
  {
    etfTicker: 'ARKK',
    etfName: 'ARK Innovation ETF',
    etfNameKo: 'ARK 이노베이션',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라', weight: 11.5, sector: 'Consumer' },
      { ticker: 'COIN', name: 'Coinbase Global', nameKo: '코인베이스', weight: 8.2, sector: 'Financial' },
      { ticker: 'ROKU', name: 'Roku Inc.', nameKo: '로쿠', weight: 7.8, sector: 'Technology' },
      { ticker: 'RBLX', name: 'Roblox Corp.', nameKo: '로블록스', weight: 6.5, sector: 'Technology' },
      { ticker: 'SQ', name: 'Block Inc.', nameKo: '블록(스퀘어)', weight: 5.8, sector: 'Financial' },
      { ticker: 'SHOP', name: 'Shopify Inc.', nameKo: '쇼피파이', weight: 5.2, sector: 'Technology' },
      { ticker: 'PATH', name: 'UiPath Inc.', nameKo: '유아이패스', weight: 4.5, sector: 'Technology' },
      { ticker: 'CRSP', name: 'CRISPR Therapeutics', nameKo: '크리스퍼', weight: 4.2, sector: 'Healthcare' },
      { ticker: 'DKNG', name: 'DraftKings Inc.', nameKo: '드래프트킹스', weight: 3.8, sector: 'Consumer' },
      { ticker: 'TWLO', name: 'Twilio Inc.', nameKo: '트윌리오', weight: 3.5, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'SOXX',
    etfName: 'iShares Semiconductor ETF',
    etfNameKo: 'iShares 반도체',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 9.8, sector: 'Technology' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 8.5, sector: 'Technology' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD', weight: 7.2, sector: 'Technology' },
      { ticker: 'QCOM', name: 'Qualcomm Inc.', nameKo: '퀄컴', weight: 6.8, sector: 'Technology' },
      { ticker: 'TXN', name: 'Texas Instruments', nameKo: '텍사스 인스트루먼트', weight: 5.5, sector: 'Technology' },
      { ticker: 'INTC', name: 'Intel Corp.', nameKo: '인텔', weight: 4.8, sector: 'Technology' },
      { ticker: 'MU', name: 'Micron Technology', nameKo: '마이크론', weight: 4.5, sector: 'Technology' },
      { ticker: 'AMAT', name: 'Applied Materials', nameKo: '어플라이드 머티리얼즈', weight: 4.2, sector: 'Technology' },
      { ticker: 'LRCX', name: 'Lam Research', nameKo: '램 리서치', weight: 3.8, sector: 'Technology' },
      { ticker: 'KLAC', name: 'KLA Corp.', nameKo: 'KLA', weight: 3.5, sector: 'Technology' },
      { ticker: 'MRVL', name: 'Marvell Technology', nameKo: '마벨', weight: 3.2, sector: 'Technology' },
      { ticker: 'ASML', name: 'ASML Holding', nameKo: 'ASML', weight: 3.0, sector: 'Technology' },
      { ticker: 'TSM', name: 'Taiwan Semiconductor', nameKo: 'TSMC', weight: 2.8, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'SMH',
    etfName: 'VanEck Semiconductor ETF',
    etfNameKo: 'VanEck 반도체',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 20.5, sector: 'Technology' },
      { ticker: 'TSM', name: 'Taiwan Semiconductor', nameKo: 'TSMC', weight: 12.2, sector: 'Technology' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 8.8, sector: 'Technology' },
      { ticker: 'ASML', name: 'ASML Holding', nameKo: 'ASML', weight: 6.5, sector: 'Technology' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD', weight: 5.2, sector: 'Technology' },
      { ticker: 'QCOM', name: 'Qualcomm Inc.', nameKo: '퀄컴', weight: 4.8, sector: 'Technology' },
      { ticker: 'TXN', name: 'Texas Instruments', nameKo: '텍사스 인스트루먼트', weight: 4.2, sector: 'Technology' },
      { ticker: 'INTC', name: 'Intel Corp.', nameKo: '인텔', weight: 3.8, sector: 'Technology' },
      { ticker: 'MU', name: 'Micron Technology', nameKo: '마이크론', weight: 3.5, sector: 'Technology' },
      { ticker: 'AMAT', name: 'Applied Materials', nameKo: '어플라이드 머티리얼즈', weight: 3.2, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'XLK',
    etfName: 'Technology Select Sector SPDR',
    etfNameKo: 'SPDR 기술 섹터',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 22.5, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 21.8, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 18.2, sector: 'Technology' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 5.2, sector: 'Technology' },
      { ticker: 'ORCL', name: 'Oracle Corp.', nameKo: '오라클', weight: 3.5, sector: 'Technology' },
      { ticker: 'CRM', name: 'Salesforce Inc.', nameKo: '세일즈포스', weight: 3.2, sector: 'Technology' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD', weight: 2.8, sector: 'Technology' },
      { ticker: 'ADBE', name: 'Adobe Inc.', nameKo: '어도비', weight: 2.5, sector: 'Technology' },
      { ticker: 'ACN', name: 'Accenture plc', nameKo: '액센추어', weight: 2.2, sector: 'Technology' },
      { ticker: 'CSCO', name: 'Cisco Systems', nameKo: '시스코', weight: 1.8, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'SCHD',
    etfName: 'Schwab U.S. Dividend Equity ETF',
    etfNameKo: '슈왑 미국 배당',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'ABBV', name: 'AbbVie Inc.', nameKo: '애브비', weight: 4.5, sector: 'Healthcare' },
      { ticker: 'MRK', name: 'Merck & Co.', nameKo: '머크', weight: 4.2, sector: 'Healthcare' },
      { ticker: 'HD', name: 'Home Depot', nameKo: '홈디포', weight: 4.0, sector: 'Consumer' },
      { ticker: 'AMGN', name: 'Amgen Inc.', nameKo: '암젠', weight: 3.8, sector: 'Healthcare' },
      { ticker: 'TXN', name: 'Texas Instruments', nameKo: '텍사스 인스트루먼트', weight: 3.6, sector: 'Technology' },
      { ticker: 'CVX', name: 'Chevron Corp.', nameKo: '셰브론', weight: 3.5, sector: 'Energy' },
      { ticker: 'PEP', name: 'PepsiCo Inc.', nameKo: '펩시코', weight: 3.4, sector: 'Consumer' },
      { ticker: 'CSCO', name: 'Cisco Systems', nameKo: '시스코', weight: 3.2, sector: 'Technology' },
      { ticker: 'KO', name: 'Coca-Cola Co.', nameKo: '코카콜라', weight: 3.0, sector: 'Consumer' },
      { ticker: 'VZ', name: 'Verizon Communications', nameKo: '버라이즌', weight: 2.8, sector: 'Telecom' },
    ],
  },
  {
    etfTicker: 'VYM',
    etfName: 'Vanguard High Dividend Yield ETF',
    etfNameKo: '뱅가드 고배당',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'JPM', name: 'JPMorgan Chase', nameKo: 'JP모건', weight: 3.5, sector: 'Financial' },
      { ticker: 'ABBV', name: 'AbbVie Inc.', nameKo: '애브비', weight: 3.2, sector: 'Healthcare' },
      { ticker: 'HD', name: 'Home Depot', nameKo: '홈디포', weight: 2.8, sector: 'Consumer' },
      { ticker: 'XOM', name: 'Exxon Mobil Corp.', nameKo: '엑슨모빌', weight: 2.7, sector: 'Energy' },
      { ticker: 'PG', name: 'Procter & Gamble', nameKo: 'P&G', weight: 2.5, sector: 'Consumer' },
      { ticker: 'JNJ', name: 'Johnson & Johnson', nameKo: '존슨앤존슨', weight: 2.4, sector: 'Healthcare' },
      { ticker: 'MRK', name: 'Merck & Co.', nameKo: '머크', weight: 2.3, sector: 'Healthcare' },
      { ticker: 'CVX', name: 'Chevron Corp.', nameKo: '셰브론', weight: 2.2, sector: 'Energy' },
      { ticker: 'BAC', name: 'Bank of America', nameKo: '뱅크오브아메리카', weight: 2.1, sector: 'Financial' },
      { ticker: 'PFE', name: 'Pfizer Inc.', nameKo: '화이자', weight: 2.0, sector: 'Healthcare' },
    ],
  },
  {
    etfTicker: 'VGT',
    etfName: 'Vanguard Information Technology ETF',
    etfNameKo: '뱅가드 IT',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플', weight: 17.5, sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트', weight: 16.8, sector: 'Technology' },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아', weight: 14.2, sector: 'Technology' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴', weight: 4.5, sector: 'Technology' },
      { ticker: 'ORCL', name: 'Oracle Corp.', nameKo: '오라클', weight: 2.8, sector: 'Technology' },
      { ticker: 'CRM', name: 'Salesforce Inc.', nameKo: '세일즈포스', weight: 2.5, sector: 'Technology' },
      { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD', weight: 2.2, sector: 'Technology' },
      { ticker: 'ADBE', name: 'Adobe Inc.', nameKo: '어도비', weight: 2.0, sector: 'Technology' },
      { ticker: 'QCOM', name: 'Qualcomm Inc.', nameKo: '퀄컴', weight: 1.8, sector: 'Technology' },
      { ticker: 'TXN', name: 'Texas Instruments', nameKo: '텍사스 인스트루먼트', weight: 1.6, sector: 'Technology' },
    ],
  },
  {
    etfTicker: 'XLE',
    etfName: 'Energy Select Sector SPDR',
    etfNameKo: 'SPDR 에너지 섹터',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'XOM', name: 'Exxon Mobil Corp.', nameKo: '엑슨모빌', weight: 22.5, sector: 'Energy' },
      { ticker: 'CVX', name: 'Chevron Corp.', nameKo: '셰브론', weight: 17.8, sector: 'Energy' },
      { ticker: 'COP', name: 'ConocoPhillips', nameKo: '코노코필립스', weight: 7.5, sector: 'Energy' },
      { ticker: 'EOG', name: 'EOG Resources', nameKo: 'EOG 리소시스', weight: 5.2, sector: 'Energy' },
      { ticker: 'SLB', name: 'Schlumberger', nameKo: '슐룸버거', weight: 4.8, sector: 'Energy' },
      { ticker: 'MPC', name: 'Marathon Petroleum', nameKo: '마라톤 페트롤리엄', weight: 4.5, sector: 'Energy' },
      { ticker: 'PSX', name: 'Phillips 66', nameKo: '필립스 66', weight: 4.2, sector: 'Energy' },
      { ticker: 'VLO', name: 'Valero Energy', nameKo: '발레로 에너지', weight: 3.8, sector: 'Energy' },
      { ticker: 'OXY', name: 'Occidental Petroleum', nameKo: '옥시덴탈', weight: 3.5, sector: 'Energy' },
      { ticker: 'WMB', name: 'Williams Companies', nameKo: '윌리엄스', weight: 3.2, sector: 'Energy' },
    ],
  },
  {
    etfTicker: 'XLF',
    etfName: 'Financial Select Sector SPDR',
    etfNameKo: 'SPDR 금융 섹터',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'BRK.B', name: 'Berkshire Hathaway', nameKo: '버크셔 해서웨이', weight: 14.5, sector: 'Financial' },
      { ticker: 'JPM', name: 'JPMorgan Chase', nameKo: 'JP모건', weight: 10.2, sector: 'Financial' },
      { ticker: 'V', name: 'Visa Inc.', nameKo: '비자', weight: 8.5, sector: 'Financial' },
      { ticker: 'MA', name: 'Mastercard Inc.', nameKo: '마스터카드', weight: 7.2, sector: 'Financial' },
      { ticker: 'BAC', name: 'Bank of America', nameKo: '뱅크오브아메리카', weight: 4.8, sector: 'Financial' },
      { ticker: 'WFC', name: 'Wells Fargo', nameKo: '웰스파고', weight: 4.2, sector: 'Financial' },
      { ticker: 'GS', name: 'Goldman Sachs', nameKo: '골드만삭스', weight: 3.5, sector: 'Financial' },
      { ticker: 'MS', name: 'Morgan Stanley', nameKo: '모건스탠리', weight: 3.2, sector: 'Financial' },
      { ticker: 'AXP', name: 'American Express', nameKo: '아메리칸익스프레스', weight: 3.0, sector: 'Financial' },
      { ticker: 'SPGI', name: 'S&P Global', nameKo: 'S&P 글로벌', weight: 2.8, sector: 'Financial' },
    ],
  },
  {
    etfTicker: 'XLV',
    etfName: 'Health Care Select Sector SPDR',
    etfNameKo: 'SPDR 헬스케어 섹터',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'LLY', name: 'Eli Lilly', nameKo: '일라이 릴리', weight: 12.5, sector: 'Healthcare' },
      { ticker: 'UNH', name: 'UnitedHealth Group', nameKo: '유나이티드헬스', weight: 10.2, sector: 'Healthcare' },
      { ticker: 'JNJ', name: 'Johnson & Johnson', nameKo: '존슨앤존슨', weight: 8.5, sector: 'Healthcare' },
      { ticker: 'MRK', name: 'Merck & Co.', nameKo: '머크', weight: 6.8, sector: 'Healthcare' },
      { ticker: 'ABBV', name: 'AbbVie Inc.', nameKo: '애브비', weight: 6.2, sector: 'Healthcare' },
      { ticker: 'TMO', name: 'Thermo Fisher Scientific', nameKo: '써모피셔', weight: 5.5, sector: 'Healthcare' },
      { ticker: 'PFE', name: 'Pfizer Inc.', nameKo: '화이자', weight: 4.8, sector: 'Healthcare' },
      { ticker: 'ABT', name: 'Abbott Laboratories', nameKo: '애보트', weight: 4.2, sector: 'Healthcare' },
      { ticker: 'DHR', name: 'Danaher Corp.', nameKo: '다나허', weight: 3.8, sector: 'Healthcare' },
      { ticker: 'AMGN', name: 'Amgen Inc.', nameKo: '암젠', weight: 3.5, sector: 'Healthcare' },
    ],
  },
  {
    etfTicker: 'GLD',
    etfName: 'SPDR Gold Shares',
    etfNameKo: 'SPDR 금',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'GOLD', name: 'Gold Bullion', nameKo: '금 현물', weight: 100.0, sector: 'Commodity' },
    ],
  },
  {
    etfTicker: 'TLT',
    etfName: 'iShares 20+ Year Treasury Bond ETF',
    etfNameKo: 'iShares 장기국채',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'UST20Y', name: 'US Treasury 20+ Year Bonds', nameKo: '미국 20년 이상 국채', weight: 100.0, sector: 'Bond' },
    ],
  },
  {
    etfTicker: 'BND',
    etfName: 'Vanguard Total Bond Market ETF',
    etfNameKo: '뱅가드 토탈 본드',
    lastUpdated: '2024-12',
    holdings: [
      { ticker: 'USTBOND', name: 'US Treasury Bonds', nameKo: '미국 국채', weight: 45.0, sector: 'Bond' },
      { ticker: 'CORPBOND', name: 'Corporate Bonds', nameKo: '회사채', weight: 30.0, sector: 'Bond' },
      { ticker: 'MBS', name: 'Mortgage-Backed Securities', nameKo: '모기지 증권', weight: 25.0, sector: 'Bond' },
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
  return ETF_HOLDINGS_DATA.find(e => e.etfTicker.toUpperCase() === etfTicker.toUpperCase());
}

// 인기 종목 목록 (검색 자동완성용)
export const POPULAR_HOLDINGS = [
  { ticker: 'AAPL', name: 'Apple Inc.', nameKo: '애플' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', nameKo: '마이크로소프트' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', nameKo: '엔비디아' },
  { ticker: 'TSLA', name: 'Tesla Inc.', nameKo: '테슬라' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKo: '아마존' },
  { ticker: 'META', name: 'Meta Platforms Inc.', nameKo: '메타' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', nameKo: '구글' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', nameKo: 'AMD' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', nameKo: '브로드컴' },
  { ticker: 'JPM', name: 'JPMorgan Chase', nameKo: 'JP모건' },
];


