-- =====================================================
-- ETFHero User Features Migration
-- =====================================================

-- =====================================================
-- 1. User Tables
-- =====================================================

-- User Portfolios
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100) DEFAULT '내 ETF 포트폴리오',
  total_value DECIMAL(15, 2) DEFAULT 0,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  total_profit DECIMAL(15, 2) DEFAULT 0,
  profit_rate DECIMAL(8, 4) DEFAULT 0,
  risk_score DECIMAL(3,1),
  diversification_score DECIMAL(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Portfolio Holdings (ETF)
CREATE TABLE IF NOT EXISTS user_portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES user_portfolios(id) ON DELETE CASCADE,
  etf_ticker VARCHAR(20) NOT NULL,
  etf_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(15, 6) NOT NULL DEFAULT 0,
  avg_price DECIMAL(15, 4) DEFAULT 0,
  current_price DECIMAL(15, 4) DEFAULT 0,
  total_value DECIMAL(15, 2) DEFAULT 0,
  profit DECIMAL(15, 2) DEFAULT 0,
  profit_rate DECIMAL(8, 4) DEFAULT 0,
  weight DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Debate History
CREATE TABLE IF NOT EXISTS user_debate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES debate_sessions(id) ON DELETE CASCADE,
  etf_ticker VARCHAR(20) NOT NULL,
  etf_name VARCHAR(200) NOT NULL,
  watched_rounds INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 4,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Consultations
CREATE TABLE IF NOT EXISTS user_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  character_type VARCHAR(20) NOT NULL,
  topic VARCHAR(200),
  consultation_type VARCHAR(50) DEFAULT 'general',
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation Messages
CREATE TABLE IF NOT EXISTS consultation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES user_consultations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Watchlist (ETF)
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  etf_ticker VARCHAR(20) NOT NULL,
  etf_name VARCHAR(200) NOT NULL,
  memo TEXT,
  alert_enabled BOOLEAN DEFAULT FALSE,
  target_price DECIMAL(15, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, etf_ticker)
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  preferred_analyst VARCHAR(20) DEFAULT 'claude',
  investment_style VARCHAR(50) DEFAULT 'balanced',
  risk_tolerance VARCHAR(20) DEFAULT 'moderate',
  preferred_asset_classes JSONB DEFAULT '["Equity"]'::jsonb,
  preferred_regions JSONB DEFAULT '["US", "KR"]'::jsonb,
  notification_enabled BOOLEAN DEFAULT TRUE,
  email_digest BOOLEAN DEFAULT FALSE,
  dark_mode BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Activity Stats
CREATE TABLE IF NOT EXISTS user_activity_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  total_debates_watched INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  total_watchlist_items INTEGER DEFAULT 0,
  favorite_category VARCHAR(50),
  most_discussed_etf VARCHAR(100),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON user_portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_debate_history_user ON user_debate_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON user_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id);

-- =====================================================
-- 3. Row Level Security
-- =====================================================

ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_debate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "users_own_portfolios" ON user_portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_holdings" ON user_portfolio_holdings FOR ALL USING (
  EXISTS (SELECT 1 FROM user_portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "users_own_debate_history" ON user_debate_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_consultations" ON user_consultations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_consultation_messages" ON consultation_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM user_consultations WHERE id = consultation_id AND user_id = auth.uid())
);
CREATE POLICY "users_own_watchlist" ON user_watchlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_activity_stats" ON user_activity_stats FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 4. Triggers
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON user_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON user_portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON user_consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_stats_updated_at BEFORE UPDATE ON user_activity_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

