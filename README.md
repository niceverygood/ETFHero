# ETFHero

AI 3대장(Claude, Gemini, GPT)이 ETF를 분석하고 토론하며, 합의 기반 Top 5 ETF를 추천하고, 과거 적중률을 공개하는 금융 엔터테인먼트 웹앱입니다.

---

## 프로젝트 개요

- AI 캐릭터 3명이 ETF에 대해 각자의 관점에서 분석하고 토론
- 합의 규칙(만장일치 우선, 평균 점수 및 리스크 패널티 적용)에 따라 Top 5 ETF 도출
- 과거 예측의 적중률을 투명하게 공개
- 투자 자문이 아닌 엔터테인먼트 콘텐츠로 설계

---

## 기술 스택

- Frontend/Backend: Next.js 14 (App Router), TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- LLM: Claude, Gemini, GPT (실제 API 연동)
- Chart: Recharts

---

## 디렉터리 구조

```
/app
  /(public)
    page.tsx              # 랜딩 페이지
    battle/[ticker]/      # ETF 토론 관전 페이지
    verdict/              # 오늘의 Top 5 ETF
    archive/              # 적중률/히스토리
    consulting/           # AI 상담
  /api                    # API Route Handlers

/components               # UI 컴포넌트
  DisclaimerBar, MessageBubble, CharacterBadge,
  VerdictCard, AccuracyChart, AdSlot, PaywallModal 등

/lib
  /llm                    # LLM 어댑터 및 오케스트레이터
  /market-data            # 시장 데이터 프로바이더
  /scoring                # 합의 규칙, 랭킹, 백테스트
  /safety                 # 컴플라이언스 필터
  /supabase               # Supabase 클라이언트

/supabase
  schema.sql              # DB 스키마 (Supabase SQL Editor용)
  migrations/             # 마이그레이션 파일

/scripts
  cron-generate-daily.ts  # 일일 Verdict 생성 스크립트
```

---

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env.local`로 복사:

```bash
cp .env.example .env.local
```

`.env.local` 파일 내용:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LLM API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일 내용 실행
3. 프로젝트 Settings에서 API 키 복사하여 `.env.local`에 설정

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 - 서비스 소개 및 AI ETF 애널리스트 안내 |
| `/verdict` | 오늘의 Top 5 - AI 합의 기반 추천 ETF |
| `/battle/[ticker]` | 토론 관전 - 특정 ETF에 대한 AI 토론 |
| `/archive` | 적중률 및 아카이브 - 과거 예측 성과 |
| `/consulting` | AI 상담 - 개인 맞춤 ETF 추천 |

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/symbols` | ETF 목록 조회 |
| POST | `/api/debate/start` | 토론 세션 생성 |
| POST | `/api/debate/next` | 다음 라운드 메시지 생성 |
| POST | `/api/verdict/generate` | 오늘 Top 5 생성 |
| GET | `/api/verdict/today` | 오늘의 Verdict 조회 |
| GET | `/api/archive/metrics` | 적중률 통계 조회 |
| POST | `/api/consultation/chat` | AI 상담 메시지 |

---

## AI ETF 애널리스트

### Claude Lee (ETF 밸류에이션 분석가)
- 스타일: 침착, 디테일, 비용 효율성 중시
- 분석 초점: 비용 분석, 추적 오차, 포트폴리오 구성, 운용 효율성

### Gemi Nine (테마 ETF 전략가)
- 스타일: 빠른 판단, 트렌드 포착, 성장 잠재력 중시
- 분석 초점: 테마 투자, 신흥 섹터, 글로벌 트렌드

### G.P. Taylor (자산배분 리스크 총괄)
- 스타일: 중후, 신중, 종합 정리
- 분석 초점: 자산 배분, 상관관계 분석, 리스크 관리

---

## ETF 카테고리

- 🇺🇸 미국 대형주 (SPY, VOO, VTI 등)
- 💻 기술/반도체 (QQQ, VGT, SOXX 등)
- 📈 성장주 (ARKK, VUG 등)
- 💰 배당 (VYM, SCHD, DVY 등)
- 📜 채권 (BND, AGG, TLT 등)
- 🌍 해외/신흥국 (VEA, VWO, EEM 등)
- 🏢 부동산 (VNQ, IYR 등)
- 🎯 테마 (클린에너지, AI, 반도체 등)

---

## 합의 규칙

1. 1차 선별: 3명 모두 4점 이상인 ETF 우선
2. 2차 보충: 평균 점수 상위 + 리스크 패널티 적용
3. 최종 Top 5는 합의 근거 요약과 함께 저장

리스크 패널티: 운용 비용, 유동성, 추적 오차 등 리스크 요인이 많을수록 감점

---

## 규제 리스크 대응

1. 모든 페이지 상/하단에 면책 문구 표시
2. "매수해라/팔아라" 등 직접 지시 표현 금지 (컴플라이언스 필터)
3. 모든 분석에 리스크 요인 명시
4. 데이터 출처 표기 구조 마련
5. 과거 적중률은 미래 수익 보장 아님을 명시

---

## 환경 변수 설명

| 변수 | 설명 | 필수 |
|------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | 예 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 | 예 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 롤 키 | 예 |
| OPENAI_API_KEY | OpenAI API 키 (GPT 호출용) | 예 |
| ANTHROPIC_API_KEY | Anthropic API 키 (Claude 호출용) | 예 |
| GOOGLE_AI_API_KEY | Google AI API 키 (Gemini 호출용) | 예 |
| NEXT_PUBLIC_APP_URL | 앱 URL | 아니오 |
| NODE_ENV | 환경 (development/production) | 아니오 |

---

## 배포

### Vercel 배포

```bash
vercel deploy
```

### 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정합니다.

### Cron Job

일일 Verdict 생성을 위해 Vercel Cron 또는 외부 스케줄러를 설정합니다.

---

## 면책 조항

본 서비스는 투자 자문이 아닌 엔터테인먼트 목적의 콘텐츠입니다. 제공되는 정보는 AI 모델의 분석 결과이며, 투자 판단의 책임은 전적으로 이용자 본인에게 있습니다. 실제 투자 결정 시에는 공인된 투자 자문사와 상담하시기 바랍니다. 과거 적중률은 미래 수익을 보장하지 않습니다.

---

## 라이선스

MIT License
