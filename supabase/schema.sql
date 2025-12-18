-- =====================================================
-- ETFHero Complete Database Schema
-- Supabase SQL Editor에서 한 번에 실행하세요
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Core Tables (ETFs, Debates, Predictions)
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
-- 2. ETF Categories & Themes
-- =====================================================

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

-- ETF Themes (투자 테마)
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
-- 3. User Feature Tables
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
-- 4. Community Tables
-- =====================================================

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  website VARCHAR(255),
  twitter_handle VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  investment_experience VARCHAR(50),
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow Relationships
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Posts/Feeds
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(20) DEFAULT 'text',
  shared_portfolio_id UUID REFERENCES user_portfolios(id) ON DELETE SET NULL,
  shared_watchlist_items JSONB,
  shared_etf_ticker VARCHAR(20),
  shared_etf_name VARCHAR(200),
  image_urls JSONB DEFAULT '[]'::jsonb,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

-- Post Bookmarks
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  actor_id UUID,
  type VARCHAR(50) NOT NULL,
  reference_id UUID,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Indexes
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

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON user_portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_debate_history_user ON user_debate_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON user_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- 6. Row Level Security
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
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_debate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- Public read access for core tables
DROP POLICY IF EXISTS "public_read_etfs" ON etfs;
CREATE POLICY "public_read_etfs" ON etfs FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_etf_prices" ON etf_prices;
CREATE POLICY "public_read_etf_prices" ON etf_prices FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_etf_categories" ON etf_categories;
CREATE POLICY "public_read_etf_categories" ON etf_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_etf_themes" ON etf_themes;
CREATE POLICY "public_read_etf_themes" ON etf_themes FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_debate_sessions" ON debate_sessions;
CREATE POLICY "public_read_debate_sessions" ON debate_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_debate_messages" ON debate_messages;
CREATE POLICY "public_read_debate_messages" ON debate_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_verdicts" ON verdicts;
CREATE POLICY "public_read_verdicts" ON verdicts FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_predictions" ON predictions;
CREATE POLICY "public_read_predictions" ON predictions FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_outcomes" ON outcomes;
CREATE POLICY "public_read_outcomes" ON outcomes FOR SELECT USING (true);

-- User portfolios
DROP POLICY IF EXISTS "users_own_portfolios" ON user_portfolios;
CREATE POLICY "users_own_portfolios" ON user_portfolios FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_own_holdings" ON user_portfolio_holdings;
CREATE POLICY "users_own_holdings" ON user_portfolio_holdings FOR ALL USING (
  EXISTS (SELECT 1 FROM user_portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- User features
DROP POLICY IF EXISTS "users_own_debate_history" ON user_debate_history;
CREATE POLICY "users_own_debate_history" ON user_debate_history FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_own_consultations" ON user_consultations;
CREATE POLICY "users_own_consultations" ON user_consultations FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_own_consultation_messages" ON consultation_messages;
CREATE POLICY "users_own_consultation_messages" ON consultation_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM user_consultations WHERE id = consultation_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "users_own_watchlist" ON user_watchlist;
CREATE POLICY "users_own_watchlist" ON user_watchlist FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_own_preferences" ON user_preferences;
CREATE POLICY "users_own_preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_own_activity_stats" ON user_activity_stats;
CREATE POLICY "users_own_activity_stats" ON user_activity_stats FOR ALL USING (auth.uid() = user_id);

-- User profiles (public read, owner write)
DROP POLICY IF EXISTS "public_read_profiles" ON user_profiles;
CREATE POLICY "public_read_profiles" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
CREATE POLICY "users_update_own_profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
CREATE POLICY "users_insert_own_profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows (public read, authenticated write)
DROP POLICY IF EXISTS "public_read_follows" ON user_follows;
CREATE POLICY "public_read_follows" ON user_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_manage_follows" ON user_follows;
CREATE POLICY "users_manage_follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- Posts (public read if not hidden, owner manage)
DROP POLICY IF EXISTS "public_read_posts" ON posts;
CREATE POLICY "public_read_posts" ON posts FOR SELECT USING (NOT is_hidden);
DROP POLICY IF EXISTS "users_manage_own_posts" ON posts;
CREATE POLICY "users_manage_own_posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_update_own_posts" ON posts;
CREATE POLICY "users_update_own_posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_delete_own_posts" ON posts;
CREATE POLICY "users_delete_own_posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes (public read, auth manage own)
DROP POLICY IF EXISTS "public_read_likes" ON post_likes;
CREATE POLICY "public_read_likes" ON post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_manage_own_likes" ON post_likes;
CREATE POLICY "users_manage_own_likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

-- Comments (public read, auth manage own)
DROP POLICY IF EXISTS "public_read_comments" ON post_comments;
CREATE POLICY "public_read_comments" ON post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_manage_own_comments" ON post_comments;
CREATE POLICY "users_manage_own_comments" ON post_comments FOR ALL USING (auth.uid() = user_id);

-- Comment likes
DROP POLICY IF EXISTS "public_read_comment_likes" ON comment_likes;
CREATE POLICY "public_read_comment_likes" ON comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_manage_comment_likes" ON comment_likes;
CREATE POLICY "users_manage_comment_likes" ON comment_likes FOR ALL USING (auth.uid() = user_id);

-- Bookmarks (owner only)
DROP POLICY IF EXISTS "users_own_bookmarks" ON post_bookmarks;
CREATE POLICY "users_own_bookmarks" ON post_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Notifications (owner read, anyone insert)
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "anyone_create_notifications" ON notifications;
CREATE POLICY "anyone_create_notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 8. Functions & Triggers
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_etfs_updated_at ON etfs;
CREATE TRIGGER update_etfs_updated_at BEFORE UPDATE ON etfs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debate_sessions_updated_at ON debate_sessions;
CREATE TRIGGER update_debate_sessions_updated_at BEFORE UPDATE ON debate_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON user_portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON user_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_holdings_updated_at ON user_portfolio_holdings;
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON user_portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultations_updated_at ON user_consultations;
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON user_consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_stats_updated_at ON user_activity_stats;
CREATE TRIGGER update_activity_stats_updated_at BEFORE UPDATE ON user_activity_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON post_comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_themes_updated_at ON etf_themes;
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON etf_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Follower count function
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
    UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = OLD.following_id;
    UPDATE user_profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follower_counts ON user_follows;
CREATE TRIGGER trigger_update_follower_counts AFTER INSERT OR DELETE ON user_follows FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Post like count function
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_like_count ON post_likes;
CREATE TRIGGER trigger_update_post_like_count AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Post comment count function
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON post_comments;
CREATE TRIGGER trigger_update_post_comment_count AFTER INSERT OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- User post count function
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET post_count = post_count + 1 WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET post_count = GREATEST(0, post_count - 1) WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_post_count ON posts;
CREATE TRIGGER trigger_update_user_post_count AFTER INSERT OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION update_user_post_count();

-- =====================================================
-- 9. Sample ETF Data
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

-- =====================================================
-- 완료!
-- =====================================================
