-- =====================================================
-- ETFHero Initial Schema Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Core ETF Tables
-- =====================================================

-- ETF Products table
CREATE TABLE IF NOT EXISTS etfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  name_ko VARCHAR(200),
  issuer VARCHAR(100),
  category VARCHAR(50),
  asset_class VARCHAR(50) DEFAULT 'Equity',
  region VARCHAR(50) DEFAULT 'US',
  expense_ratio DECIMAL(5,4),
  aum DECIMAL(20,2),
  inception_date DATE,
  benchmark VARCHAR(200),
  description TEXT,
  holdings_count INTEGER,
  top_holdings JSONB DEFAULT '[]'::jsonb,
  sector_weights JSONB DEFAULT '{}'::jsonb,
  dividend_yield DECIMAL(6,4),
  pe_ratio DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ETF Price History
CREATE TABLE IF NOT EXISTS etf_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etf_id UUID NOT NULL REFERENCES etfs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_price DECIMAL(15,4),
  high_price DECIMAL(15,4),
  low_price DECIMAL(15,4),
  close_price DECIMAL(15,4),
  adj_close DECIMAL(15,4),
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(etf_id, date)
);

-- ETF Categories
CREATE TABLE IF NOT EXISTS etf_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  name_ko VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ETF Themes
CREATE TABLE IF NOT EXISTS etf_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  name_ko VARCHAR(100),
  description TEXT,
  related_etfs JSONB DEFAULT '[]'::jsonb,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Debate & Verdict Tables
-- =====================================================

-- Debate sessions table
CREATE TABLE IF NOT EXISTS debate_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etf_ticker VARCHAR(20) NOT NULL,
  etf_name VARCHAR(200) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'running',
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debate messages table
CREATE TABLE IF NOT EXISTS debate_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES debate_sessions(id) ON DELETE CASCADE,
  character VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 3,
  risks JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verdicts table (daily Top 5 ETFs)
CREATE TABLE IF NOT EXISTS verdicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE UNIQUE,
  top5 JSONB NOT NULL,
  consensus_summary TEXT,
  market_theme VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verdict_id UUID NOT NULL REFERENCES verdicts(id) ON DELETE CASCADE,
  etf_ticker VARCHAR(20) NOT NULL,
  etf_name VARCHAR(200) NOT NULL,
  predicted_direction VARCHAR(10) NOT NULL,
  avg_score DECIMAL(3,2) DEFAULT 3.0,
  target_return DECIMAL(8,4),
  time_horizon VARCHAR(20) DEFAULT '1M',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outcomes table (actual results)
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  actual_direction VARCHAR(10) NOT NULL,
  actual_return DECIMAL(10,4) DEFAULT 0,
  is_hit BOOLEAN DEFAULT FALSE,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_etfs_ticker ON etfs(ticker);
CREATE INDEX IF NOT EXISTS idx_etfs_category ON etfs(category);
CREATE INDEX IF NOT EXISTS idx_etfs_asset_class ON etfs(asset_class);
CREATE INDEX IF NOT EXISTS idx_etf_prices_date ON etf_prices(date);
CREATE INDEX IF NOT EXISTS idx_etf_prices_etf ON etf_prices(etf_id);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_date ON debate_sessions(date);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_etf ON debate_sessions(etf_ticker);
CREATE INDEX IF NOT EXISTS idx_debate_messages_session ON debate_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(date);
CREATE INDEX IF NOT EXISTS idx_predictions_verdict ON predictions(verdict_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_prediction ON outcomes(prediction_id);

-- =====================================================
-- 4. Row Level Security
-- =====================================================

ALTER TABLE etfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_etfs" ON etfs FOR SELECT USING (true);
CREATE POLICY "public_read_etf_prices" ON etf_prices FOR SELECT USING (true);
CREATE POLICY "public_read_etf_categories" ON etf_categories FOR SELECT USING (true);
CREATE POLICY "public_read_etf_themes" ON etf_themes FOR SELECT USING (true);
CREATE POLICY "public_read_debate_sessions" ON debate_sessions FOR SELECT USING (true);
CREATE POLICY "public_read_debate_messages" ON debate_messages FOR SELECT USING (true);
CREATE POLICY "public_read_verdicts" ON verdicts FOR SELECT USING (true);
CREATE POLICY "public_read_predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "public_read_outcomes" ON outcomes FOR SELECT USING (true);

-- =====================================================
-- 5. Sample ETF Data
-- =====================================================

-- Insert ETF Categories
INSERT INTO etf_categories (name, name_ko, description, icon, color) VALUES
  ('US Large Cap', '미국 대형주', '미국 대형주에 투자하는 ETF', '🇺🇸', 'blue'),
  ('US Growth', '미국 성장주', '미국 성장주에 투자하는 ETF', '📈', 'green'),
  ('US Value', '미국 가치주', '미국 가치주에 투자하는 ETF', '💎', 'purple'),
  ('US Small Cap', '미국 소형주', '미국 소형주에 투자하는 ETF', '🔹', 'cyan'),
  ('International', '해외 선진국', '해외 선진국에 투자하는 ETF', '🌍', 'teal'),
  ('Emerging Markets', '신흥국', '신흥국에 투자하는 ETF', '🌏', 'orange'),
  ('Technology', '기술', '기술 섹터에 투자하는 ETF', '💻', 'indigo'),
  ('Healthcare', '헬스케어', '헬스케어 섹터에 투자하는 ETF', '🏥', 'pink'),
  ('Financial', '금융', '금융 섹터에 투자하는 ETF', '🏦', 'yellow'),
  ('Energy', '에너지', '에너지 섹터에 투자하는 ETF', '⚡', 'red'),
  ('Real Estate', '부동산', '부동산에 투자하는 ETF', '🏢', 'amber'),
  ('Bond', '채권', '채권에 투자하는 ETF', '📜', 'gray'),
  ('Dividend', '배당', '배당주에 투자하는 ETF', '💰', 'emerald'),
  ('Thematic', '테마', '특정 테마에 투자하는 ETF', '🎯', 'violet')
ON CONFLICT (name) DO NOTHING;

-- Insert sample ETFs
INSERT INTO etfs (ticker, name, name_ko, issuer, category, asset_class, region, expense_ratio, description) VALUES
  ('SPY', 'SPDR S&P 500 ETF Trust', 'SPDR S&P 500 ETF', 'State Street', 'US Large Cap', 'Equity', 'US', 0.0945, 'S&P 500 지수를 추적하는 대표적인 대형주 ETF'),
  ('QQQ', 'Invesco QQQ Trust', 'Invesco QQQ', 'Invesco', 'Technology', 'Equity', 'US', 0.20, '나스닥 100 지수를 추적하는 기술주 중심 ETF'),
  ('VTI', 'Vanguard Total Stock Market ETF', '뱅가드 토탈 스탁 마켓', 'Vanguard', 'US Large Cap', 'Equity', 'US', 0.03, '미국 전체 주식 시장에 투자하는 ETF'),
  ('VOO', 'Vanguard S&P 500 ETF', '뱅가드 S&P 500', 'Vanguard', 'US Large Cap', 'Equity', 'US', 0.03, '저비용 S&P 500 추적 ETF'),
  ('IWM', 'iShares Russell 2000 ETF', 'iShares 러셀 2000', 'iShares', 'US Small Cap', 'Equity', 'US', 0.19, '미국 소형주에 투자하는 ETF'),
  ('VGT', 'Vanguard Information Technology ETF', '뱅가드 IT', 'Vanguard', 'Technology', 'Equity', 'US', 0.10, '미국 IT 섹터에 투자하는 ETF'),
  ('ARKK', 'ARK Innovation ETF', 'ARK 이노베이션', 'ARK Invest', 'Thematic', 'Equity', 'US', 0.75, '혁신 기업에 집중 투자하는 액티브 ETF'),
  ('VNQ', 'Vanguard Real Estate ETF', '뱅가드 부동산', 'Vanguard', 'Real Estate', 'Real Estate', 'US', 0.12, '미국 부동산 리츠에 투자하는 ETF'),
  ('VYM', 'Vanguard High Dividend Yield ETF', '뱅가드 고배당', 'Vanguard', 'Dividend', 'Equity', 'US', 0.06, '고배당 주식에 투자하는 ETF'),
  ('SCHD', 'Schwab U.S. Dividend Equity ETF', '슈왑 미국 배당', 'Charles Schwab', 'Dividend', 'Equity', 'US', 0.06, '배당 성장주에 투자하는 인기 ETF'),
  ('BND', 'Vanguard Total Bond Market ETF', '뱅가드 토탈 본드', 'Vanguard', 'Bond', 'Fixed Income', 'US', 0.03, '미국 전체 채권 시장에 투자하는 ETF'),
  ('AGG', 'iShares Core U.S. Aggregate Bond ETF', 'iShares 미국 종합채권', 'iShares', 'Bond', 'Fixed Income', 'US', 0.03, '미국 투자등급 채권에 투자하는 ETF'),
  ('VEA', 'Vanguard FTSE Developed Markets ETF', '뱅가드 선진국', 'Vanguard', 'International', 'Equity', 'Global', 0.05, '미국 외 선진국에 투자하는 ETF'),
  ('VWO', 'Vanguard FTSE Emerging Markets ETF', '뱅가드 신흥국', 'Vanguard', 'Emerging Markets', 'Equity', 'Global', 0.08, '신흥국에 투자하는 ETF'),
  ('XLF', 'Financial Select Sector SPDR Fund', 'SPDR 금융 섹터', 'State Street', 'Financial', 'Equity', 'US', 0.09, '미국 금융 섹터에 투자하는 ETF'),
  ('XLE', 'Energy Select Sector SPDR Fund', 'SPDR 에너지 섹터', 'State Street', 'Energy', 'Equity', 'US', 0.09, '미국 에너지 섹터에 투자하는 ETF'),
  ('XLV', 'Health Care Select Sector SPDR Fund', 'SPDR 헬스케어 섹터', 'State Street', 'Healthcare', 'Equity', 'US', 0.09, '미국 헬스케어 섹터에 투자하는 ETF'),
  ('SOXX', 'iShares Semiconductor ETF', 'iShares 반도체', 'iShares', 'Technology', 'Equity', 'US', 0.35, '반도체 기업에 투자하는 ETF'),
  ('TLT', 'iShares 20+ Year Treasury Bond ETF', 'iShares 장기국채', 'iShares', 'Bond', 'Fixed Income', 'US', 0.15, '미국 장기 국채에 투자하는 ETF'),
  ('GLD', 'SPDR Gold Shares', 'SPDR 금', 'State Street', 'Thematic', 'Commodity', 'Global', 0.40, '금에 투자하는 대표적인 ETF')
ON CONFLICT (ticker) DO NOTHING;

-- Insert ETF Themes
INSERT INTO etf_themes (name, name_ko, description, is_trending) VALUES
  ('AI & Machine Learning', 'AI/머신러닝', 'AI 및 머신러닝 관련 기업에 투자', true),
  ('Clean Energy', '클린 에너지', '신재생 에너지 및 친환경 기업', true),
  ('Electric Vehicles', '전기차', '전기차 및 배터리 기업', true),
  ('Cybersecurity', '사이버보안', '보안 솔루션 기업', false),
  ('Cloud Computing', '클라우드', '클라우드 서비스 기업', false),
  ('Semiconductor', '반도체', '반도체 제조 및 설계 기업', true),
  ('Dividend Growth', '배당 성장', '지속적인 배당 성장 기업', false),
  ('Value Investing', '가치 투자', '저평가된 기업에 투자', false)
ON CONFLICT (name) DO NOTHING;


