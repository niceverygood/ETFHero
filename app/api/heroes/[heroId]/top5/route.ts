import { NextRequest, NextResponse } from 'next/server';
import { fetchNaverETFList, type NaverETFItem } from '@/lib/external/naver-etf';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI 클라이언트 초기화
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// ETF 카테고리 분류
function getETFCategory(name: string): string {
  if (name.includes('200') || name.includes('KOSPI') || name.includes('코스피')) return '시장지수';
  if (name.includes('미국') || name.includes('S&P') || name.includes('나스닥') || name.includes('NASDAQ')) return '해외주식';
  if (name.includes('배당') || name.includes('고배당')) return '배당';
  if (name.includes('반도체') || name.includes('2차전지') || name.includes('바이오')) return '섹터';
  if (name.includes('AI') || name.includes('메타버스') || name.includes('로봇')) return '테마';
  if (name.includes('채권') || name.includes('국채') || name.includes('금리')) return '채권';
  if (name.includes('금') || name.includes('원유')) return '원자재';
  return '기타';
}

// 캐릭터별 세계관 및 분석 기준 (ETF용으로 수정)
const CHARACTER_PROFILES = {
  claude: {
    name: 'Claude Lee',
    nameKo: '클로드 리',
    title: 'ETF 밸류에이션 분석가',
    criteria: '비용 효율성 및 추적 오차 중심',
    methodology: '총보수, NAV 괴리, 거래량, 추적오차 분석',
    systemPrompt: `당신은 "클로드 리"입니다. ETF의 비용 효율성과 추적 정확도를 분석하는 전문가입니다.

## 당신의 투자 철학
- "낮은 비용이 장기 수익의 핵심입니다"
- 총보수(TER)와 추적오차 중시
- NAV 괴리율 최소화된 ETF 선호
- 충분한 거래량과 유동성 확보

## 분석 기준 (우선순위)
1. 총보수가 낮은 ETF (비용 효율성)
2. 추적오차가 작은 ETF (지수 추종 정확도)
3. 순자산총액이 큰 ETF (안정성)
4. 거래량이 충분한 ETF (유동성)
5. NAV 괴리율이 낮은 ETF

## 응답 스타일
- 냉철하고 논리적
- 구체적인 비용 수치 제시
- "비용 관점에서...", "추적오차를 보시면" 등 시그니처 표현 사용`,
  },
  gemini: {
    name: 'Gemi Nine',
    nameKo: '제미나인',
    title: '테마 ETF 전략가',
    criteria: '성장 테마 및 혁신 섹터 중심',
    methodology: '테마 성장성, 글로벌 트렌드, 섹터 모멘텀 분석',
    systemPrompt: `당신은 "제미나인"입니다. 실리콘밸리 출신의 테마 ETF 전문가입니다.

## 당신의 투자 철학
- "미래를 사는 거예요. 테마가 곧 수익입니다."
- 혁신 테마(AI, 반도체, 2차전지) 집중
- 글로벌 성장 트렌드 추종
- 높은 성장성 섹터 ETF 선호

## 분석 기준 (우선순위)
1. 성장 테마 ETF (반도체, AI, 2차전지, 클린에너지)
2. 해외 지수 추종 ETF (미국 S&P500, 나스닥100)
3. 섹터별 모멘텀이 강한 ETF
4. 글로벌 트렌드 수혜 ETF
5. 신규 상장 혁신 테마 ETF

## 응답 스타일
- 에너지 넘치고 자신감 있음
- 영어 표현 섞어 사용 ("This theme is HOT", "Future is NOW")
- "Boring ETF는 패스~", "Growth or nothing" 등 도발적 표현`,
  },
  gpt: {
    name: 'G.P. Taylor',
    nameKo: 'G.P. 테일러',
    title: '자산배분 리스크 총괄',
    criteria: '분산투자 및 리스크 관리 중심',
    methodology: '자산배분, 변동성 분석, 배당 안정성 평가',
    systemPrompt: `당신은 "G.P. 테일러"입니다. 40년 경력의 자산배분 전문가입니다.

## 당신의 투자 철학
- "분산투자가 유일한 공짜 점심입니다"
- 리스크 관리 최우선
- 배당형 ETF와 채권 ETF 선호
- 변동성이 낮은 방어적 ETF 중시

## 분석 기준 (우선순위)
1. 시장 대표 지수 ETF (KOSPI200, S&P500)
2. 배당형 ETF (고배당, 월배당)
3. 채권 ETF (국채, 우량 회사채)
4. 낮은 변동성 ETF
5. 대형 순자산 ETF (안정성)

## 응답 스타일
- 노련하고 차분함
- "40년간 봐온 바로는...", "젊은 친구들이 잊는 것이..." 등 경험 강조
- 위기 사례 언급하며 방어적 ETF 권유`,
  },
};

// Claude API 호출 (ETF용)
async function analyzeWithClaude(etfs: NaverETFItem[]): Promise<any[]> {
  const profile = CHARACTER_PROFILES.claude;
  
  const etfList = etfs.map(e => {
    const category = getETFCategory(e.name);
    return `- ${e.name}(${e.ticker}): 현재가 ${e.price?.toLocaleString()}원, 등락 ${e.changePercent?.toFixed(2)}%, 순자산 ${((e.totalAssets || 0) / 10000).toFixed(1)}조원, 카테고리: ${category}`;
  }).join('\n');

  const prompt = `아래 ETF들을 당신의 비용 효율성 관점에서 평가하고, Top 5를 선정해주세요.

## 분석 대상 ETF
${etfList}

## 응답 형식 (JSON)
{
  "top5": [
    {
      "rank": 1,
      "ticker": "ETF코드",
      "name": "ETF명",
      "score": 4.5,
      "targetReturn": 12.5,
      "reason": "선정 이유 (당신의 분석 스타일로, 비용/추적오차 강조, 2-3문장)",
      "risks": ["리스크1", "리스크2"]
    }
  ]
}

오직 JSON만 응답하세요.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: profile.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find(b => b.type === 'text');
    const jsonMatch = (text as any)?.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).top5;
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
  }
  return [];
}

// Gemini API 호출 (ETF용)
async function analyzeWithGemini(etfs: NaverETFItem[]): Promise<any[]> {
  const profile = CHARACTER_PROFILES.gemini;
  
  const etfList = etfs.map(e => {
    const category = getETFCategory(e.name);
    return `- ${e.name}(${e.ticker}): 현재가 ${e.price?.toLocaleString()}원, 등락 ${e.changePercent?.toFixed(2)}%, 순자산 ${((e.totalAssets || 0) / 10000).toFixed(1)}조원, 카테고리: ${category}`;
  }).join('\n');

  const prompt = `${profile.systemPrompt}

아래 ETF들을 당신의 테마 성장 관점에서 평가하고, Top 5를 선정해주세요.

## 분석 대상 ETF
${etfList}

## 응답 형식 (JSON)
{
  "top5": [
    {
      "rank": 1,
      "ticker": "ETF코드",
      "name": "ETF명",
      "score": 5.0,
      "targetReturn": 25.0,
      "reason": "선정 이유 (당신의 스타일로, 테마 성장성 강조, 영어 표현 섞어서, 2-3문장)",
      "risks": ["리스크1", "리스크2"]
    }
  ]
}

오직 JSON만 응답하세요.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).top5;
    }
  } catch (error: any) {
    console.error('[Gemini] Analysis error:', error?.message || error);
  }
  return [];
}

// GPT API 호출 (ETF용)
async function analyzeWithGPT(etfs: NaverETFItem[]): Promise<any[]> {
  const profile = CHARACTER_PROFILES.gpt;
  
  const etfList = etfs.map(e => {
    const category = getETFCategory(e.name);
    return `- ${e.name}(${e.ticker}): 현재가 ${e.price?.toLocaleString()}원, 등락 ${e.changePercent?.toFixed(2)}%, 순자산 ${((e.totalAssets || 0) / 10000).toFixed(1)}조원, 카테고리: ${category}`;
  }).join('\n');

  const prompt = `아래 ETF들을 당신의 자산배분 및 리스크 관리 관점에서 평가하고, Top 5를 선정해주세요.

## 분석 대상 ETF
${etfList}

## 응답 형식 (JSON)
{
  "top5": [
    {
      "rank": 1,
      "ticker": "ETF코드",
      "name": "ETF명",
      "score": 4.2,
      "targetReturn": 8.0,
      "reason": "선정 이유 (당신의 스타일로, 안정성과 분산투자 강조, 경험 언급, 2-3문장)",
      "risks": ["리스크1", "리스크2"]
    }
  ]
}

오직 JSON만 응답하세요.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: profile.systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).top5;
    }
  } catch (error) {
    console.error('GPT analysis error:', error);
  }
  return [];
}

// 폴백 ETF 데이터 (AI 실패 시)
function getFallbackETFRecommendations(heroId: string): any[] {
  const fallbacks: Record<string, any[]> = {
    claude: [
      { rank: 1, ticker: '069500', name: 'KODEX 200', score: 4.5, targetReturn: 10, reason: '가장 낮은 총보수(0.015%)와 높은 유동성. 추적오차 최소화. 국내 시장 대표 ETF.', risks: ['시장 전체 하락', '환율 영향'] },
      { rank: 2, ticker: '102110', name: 'TIGER 200', score: 4.3, targetReturn: 10, reason: '낮은 비용으로 KOSPI200 추종. 거래량 풍부. 장기투자에 적합.', risks: ['시장 변동성', '배당 수익률 낮음'] },
      { rank: 3, ticker: '360750', name: 'TIGER 미국S&P500', score: 4.2, targetReturn: 12, reason: '미국 시장 노출에 효율적. 환헤지 없는 버전으로 장기 수익 극대화.', risks: ['환율 변동', '미국 경기 둔화'] },
      { rank: 4, ticker: '379800', name: 'KODEX 미국S&P500TR', score: 4.1, targetReturn: 12, reason: '총수익(TR) 지수 추종으로 배당 재투자 효과. 낮은 비용.', risks: ['환율 리스크', '세금 이슈'] },
      { rank: 5, ticker: '148070', name: 'KOSEF 국고채10년', score: 4.0, targetReturn: 4, reason: '채권 ETF 중 낮은 비용. 안정적 이자 수익. 포트폴리오 분산.', risks: ['금리 상승', '인플레이션'] },
    ],
    gemini: [
      { rank: 1, ticker: '091160', name: 'KODEX 반도체', score: 5.0, targetReturn: 30, reason: 'AI 시대 핵심 테마! 삼성전자, SK하이닉스 집중. This is THE semiconductor play! 🚀', risks: ['사이클 변동', '경쟁 심화'] },
      { rank: 2, ticker: '133690', name: 'TIGER 미국나스닥100', score: 4.8, targetReturn: 25, reason: '빅테크 + AI 성장의 핵심! 애플, 엔비디아, 마이크로소프트 한번에. Future is NOW!', risks: ['밸류에이션', '금리 민감'] },
      { rank: 3, ticker: '305720', name: 'KODEX 2차전지산업', score: 4.5, targetReturn: 28, reason: 'EV 전환은 Secular trend! 배터리 셀, 소재 모두 담았다. Huge TAM!', risks: ['경쟁 심화', '원자재 가격'] },
      { rank: 4, ticker: '364980', name: 'TIGER AI반도체핵심공정', score: 4.4, targetReturn: 35, reason: 'AI 반도체 순수 플레이! HBM, 파운드리 핵심 기업만. Growth or nothing!', risks: ['집중 리스크', '변동성'] },
      { rank: 5, ticker: '360750', name: 'TIGER 미국S&P500', score: 4.2, targetReturn: 15, reason: '미국 시장 전체 성장에 베팅. 장기적으로 우상향. Simple but powerful.', risks: ['환율', '미국 경기'] },
    ],
    gpt: [
      { rank: 1, ticker: '069500', name: 'KODEX 200', score: 4.2, targetReturn: 8, reason: '40년간 봐온 바로는, 시장 대표 ETF가 결국 살아남습니다. 분산투자의 정석.', risks: ['시장 하락', '저성장'] },
      { rank: 2, ticker: '161510', name: 'ARIRANG 고배당주', score: 4.1, targetReturn: 6, reason: '배당은 확실한 현금흐름. 젊은 친구들이 놓치는 안정성의 가치.', risks: ['배당 삭감', '금리 변동'] },
      { rank: 3, ticker: '148070', name: 'KOSEF 국고채10년', score: 4.0, targetReturn: 4, reason: '채권은 포트폴리오의 안전판. 위기 때 빛나는 자산군입니다.', risks: ['금리 상승', '인플레이션'] },
      { rank: 4, ticker: '360750', name: 'TIGER 미국S&P500', score: 3.9, targetReturn: 10, reason: '미국 시장 분산투자. 달러 자산 확보. 장기적 안정성.', risks: ['환율', '지정학 리스크'] },
      { rank: 5, ticker: '102110', name: 'TIGER 200', score: 3.8, targetReturn: 8, reason: '국내 대형주 분산. KODEX 200과 함께 양대 산맥. 살아남는 자가 이깁니다.', risks: ['국내 경기', '인구 감소'] },
    ],
  };
  return fallbacks[heroId] || fallbacks.claude;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  const { heroId } = await params;
  
  const profile = CHARACTER_PROFILES[heroId as keyof typeof CHARACTER_PROFILES];
  
  if (!profile) {
    return NextResponse.json({ error: 'Hero not found' }, { status: 404 });
  }
  
  // 1. 네이버에서 ETF 데이터 가져오기
  let allETFs: NaverETFItem[] = [];
  let isRealTime = false;

  try {
    allETFs = await fetchNaverETFList();
    isRealTime = allETFs.length > 0;
    console.log(`[${heroId}] Fetched ${allETFs.length} ETFs from Naver`);
  } catch (error) {
    console.error('Failed to fetch ETFs from Naver:', error);
  }

  // 상위 30개 ETF만 분석 대상으로 (순자산 기준)
  const analysisETFs = allETFs
    .filter(e => e.totalAssets && e.totalAssets > 1000)
    .sort((a, b) => (b.totalAssets || 0) - (a.totalAssets || 0))
    .slice(0, 30);
  
  // 2. AI 분석 수행
  let top5: any[] = [];
  
  try {
    switch (heroId) {
      case 'claude':
        top5 = await analyzeWithClaude(analysisETFs);
        break;
      case 'gemini':
        top5 = await analyzeWithGemini(analysisETFs);
        break;
      case 'gpt':
        top5 = await analyzeWithGPT(analysisETFs);
        break;
    }
  } catch (error) {
    console.error(`AI analysis failed for ${heroId}:`, error);
  }
  
  // 3. AI 분석 실패 시 폴백 사용
  const usedFallback = !top5 || top5.length === 0;
  if (usedFallback) {
    console.log(`[${heroId}] Using fallback ETF recommendations`);
    top5 = getFallbackETFRecommendations(heroId);
  } else {
    console.log(`[${heroId}] AI analysis successful, got ${top5.length} ETFs`);
  }
  
  // 4. 실시간 가격 병합
  const etfsWithPrices = top5.map((etf, idx) => {
    const realETF = allETFs.find(e => e.ticker === etf.ticker);
    const currentPrice = realETF?.price || 0;
    const category = realETF ? getETFCategory(realETF.name) : '기타';
    
    return {
      rank: etf.rank || idx + 1,
      symbol: etf.ticker,
      name: realETF?.name || etf.name,
      category,
      currentPrice,
      targetPrice: Math.round(currentPrice * (1 + (etf.targetReturn || 10) / 100)),
      change: realETF?.change || 0,
      changePercent: realETF?.changePercent || 0,
      score: etf.score,
      reason: etf.reason,
      risks: etf.risks || [],
      metrics: {
        '순자산': `${((realETF?.totalAssets || 0) / 10000).toFixed(1)}조원`,
        '거래량': `${((realETF?.volume || 0) / 10000).toFixed(0)}만주`,
        '예상수익률': `${etf.targetReturn || 10}%`,
        '카테고리': category,
      },
    };
  });
  
  // 5. 응답
  const now = new Date();
  return NextResponse.json({
    hero: {
      id: heroId,
      name: profile.name,
      nameKo: profile.nameKo,
      title: profile.title,
      criteria: profile.criteria,
      methodology: profile.methodology,
    },
    date: now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    isRealTime,
    isAIGenerated: !usedFallback,
    stocks: etfsWithPrices, // 기존 인터페이스 호환을 위해 stocks로 유지
  });
}
