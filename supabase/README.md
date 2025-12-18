# ETFHero Supabase 설정 가이드

## 시작하기

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 설정

### 2. 데이터베이스 스키마 설정

Supabase SQL Editor에서 다음 파일들을 순서대로 실행하세요:

1. `migrations/001_etf_initial_schema.sql` - ETF 기본 테이블 및 샘플 데이터
2. `migrations/002_user_features.sql` - 사용자 기능 테이블
3. `migrations/003_community.sql` - 커뮤니티 기능 테이블

또는 `schema.sql` 파일 전체를 한 번에 실행할 수 있습니다.

### 3. 환경 변수 설정

Supabase 대시보드에서 API 키를 복사하여 `.env.local`에 설정:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 테이블 구조

### Core Tables (ETF)
- `etfs` - ETF 상품 정보
- `etf_prices` - ETF 가격 히스토리
- `etf_categories` - ETF 카테고리
- `etf_themes` - 투자 테마

### Debate & Verdict
- `debate_sessions` - 토론 세션
- `debate_messages` - 토론 메시지
- `verdicts` - Top 5 ETF 결과
- `predictions` - 예측 기록
- `outcomes` - 실제 결과

### User Features
- `user_portfolios` - 사용자 포트폴리오
- `user_portfolio_holdings` - 포트폴리오 보유 ETF
- `user_debate_history` - 토론 시청 기록
- `user_consultations` - AI 상담 기록
- `consultation_messages` - 상담 메시지
- `user_watchlist` - 관심 ETF 목록
- `user_preferences` - 사용자 설정
- `user_activity_stats` - 활동 통계

### Community
- `user_profiles` - 사용자 프로필
- `user_follows` - 팔로우 관계
- `posts` - 게시글
- `post_likes` - 좋아요
- `post_comments` - 댓글
- `comment_likes` - 댓글 좋아요
- `post_bookmarks` - 북마크
- `notifications` - 알림

## Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있습니다:

- ETF 관련 테이블: 모두 읽기 가능
- 사용자 테이블: 본인 데이터만 접근 가능
- 프로필/게시글: 공개 읽기, 본인만 수정
- 알림: 본인만 읽기, 누구나 생성 가능

## 샘플 데이터

초기 마이그레이션에 포함된 샘플 데이터:

### ETF Categories (14개)
- US Large Cap, US Growth, US Value, US Small Cap
- International, Emerging Markets
- Technology, Healthcare, Financial, Energy
- Real Estate, Bond, Dividend, Thematic

### ETFs (20개)
- SPY, QQQ, VTI, VOO, IWM
- VGT, ARKK, VNQ, VYM, SCHD
- BND, AGG, VEA, VWO
- XLF, XLE, XLV, SOXX, TLT, GLD

### ETF Themes (8개)
- AI & Machine Learning, Clean Energy, Electric Vehicles
- Cybersecurity, Cloud Computing, Semiconductor
- Dividend Growth, Value Investing
