import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchNaverETFList, type NaverETFItem } from '@/lib/external/naver-etf';
import { 
  OpenRouterClaudeAdapter, 
  OpenRouterGeminiAdapter, 
  OpenRouterGPTAdapter,
  hasOpenRouterKey 
} from '@/lib/llm/openrouter';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 캐시 (같은 날짜에 중복 AI 호출 방지)
const scoreCache = new Map<string, {
  claudeScore: number;
  geminiScore: number;
  gptScore: number;
  avgScore: number;
  isUnanimous: boolean;
  rationale: string;
  timestamp: number;
}>();

// 캐시 TTL: 1시간
const CACHE_TTL = 60 * 60 * 1000;

// ETF 카테고리 매핑
function getETFCategory(name: string): string {
  if (name.includes('200') || name.includes('KOSPI') || name.includes('코스피')) return '시장지수';
  if (name.includes('미국') || name.includes('S&P') || name.includes('나스닥') || name.includes('NASDAQ')) return '해외주식';
  if (name.includes('배당') || name.includes('고배당')) return '배당';
  if (name.includes('반도체') || name.includes('2차전지') || name.includes('바이오')) return '섹터';
  if (name.includes('AI') || name.includes('메타버스') || name.includes('로봇')) return '테마';
  if (name.includes('채권') || name.includes('국채')) return '채권';
  if (name.includes('금') || name.includes('원유')) return '원자재';
  return '기타';
}

/**
 * 실제 AI를 사용한 ETF 점수 생성
 */
async function generateRealAIScores(etf: NaverETFItem, category: string): Promise<{
  claudeScore: number;
  geminiScore: number;
  gptScore: number;
  avgScore: number;
  isUnanimous: boolean;
  rationale: string;
}> {
  const cacheKey = `${etf.ticker}-${new Date().toISOString().split('T')[0]}`;
  
  // 캐시 확인
  const cached = scoreCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[AI Verdict] Using cached score for ${etf.ticker}`);
    return cached;
  }

  const analysisPrompt = `당신은 ETF 투자 전문가입니다. 다음 ETF를 분석하고 1-5점 사이의 투자 매력도 점수를 매겨주세요.

ETF 정보:
- 이름: ${etf.name}
- 티커: ${etf.ticker}
- 현재가: ${etf.price.toLocaleString()}원
- 일간 등락: ${etf.changePercent >= 0 ? '+' : ''}${etf.changePercent.toFixed(2)}%
- 거래량: ${etf.volume.toLocaleString()}
- 순자산: ${etf.totalAssets ? (etf.totalAssets / 10000).toFixed(1) + '조원' : '정보 없음'}
- 카테고리: ${category}

다음 JSON 형식으로만 응답하세요:
{
  "score": 1-5 사이의 숫자 (소수점 1자리),
  "reason": "점수 부여 이유 (20자 이내)"
}`;

  let claudeScore = 3.5;
  let geminiScore = 3.5;
  let gptScore = 3.5;
  let reasons: string[] = [];

  // OpenRouter로 실제 AI 호출
  if (hasOpenRouterKey()) {
    console.log(`[AI Verdict] Generating real AI scores for ${etf.ticker}`);
    
    // Claude 분석
    try {
      const claude = new OpenRouterClaudeAdapter();
      const response = await claude.generateRaw(analysisPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        claudeScore = Math.min(5, Math.max(1, Number(parsed.score) || 3.5));
        if (parsed.reason) reasons.push(`클로드: ${parsed.reason}`);
      }
    } catch (e) {
      console.error('[AI Verdict] Claude error:', e);
    }

    // Gemini 분석
    try {
      const gemini = new OpenRouterGeminiAdapter();
      const response = await gemini.generateRaw(analysisPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        geminiScore = Math.min(5, Math.max(1, Number(parsed.score) || 3.5));
        if (parsed.reason) reasons.push(`제미나인: ${parsed.reason}`);
      }
    } catch (e) {
      console.error('[AI Verdict] Gemini error:', e);
    }

    // GPT 분석
    try {
      const gpt = new OpenRouterGPTAdapter();
      const response = await gpt.generateRaw(analysisPrompt);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        gptScore = Math.min(5, Math.max(1, Number(parsed.score) || 3.5));
        if (parsed.reason) reasons.push(`테일러: ${parsed.reason}`);
      }
    } catch (e) {
      console.error('[AI Verdict] GPT error:', e);
    }
  } else {
    // API 키 없으면 시장 데이터 기반 분석
    console.log(`[AI Verdict] No OpenRouter key, using market-based scores for ${etf.ticker}`);
    const marketScore = calculateMarketBasedScore(etf);
    claudeScore = marketScore.claude;
    geminiScore = marketScore.gemini;
    gptScore = marketScore.gpt;
    reasons = [marketScore.reason];
  }

  const avgScore = Number(((claudeScore + geminiScore + gptScore) / 3).toFixed(1));
  const isUnanimous = claudeScore >= 4 && geminiScore >= 4 && gptScore >= 4;

  // 분석 이유 생성
  const changeDesc = etf.changePercent >= 0 
    ? `오늘 ${etf.changePercent.toFixed(2)}% 상승` 
    : `오늘 ${Math.abs(etf.changePercent).toFixed(2)}% 하락`;
  
  const rationale = reasons.length > 0 
    ? `${etf.name}: ${changeDesc}. ${reasons[0]}`
    : `${etf.name}은(는) ${category} ETF입니다. ${changeDesc}했습니다.`;

  const result = {
    claudeScore: Number(claudeScore.toFixed(1)),
    geminiScore: Number(geminiScore.toFixed(1)),
    gptScore: Number(gptScore.toFixed(1)),
    avgScore,
    isUnanimous,
    rationale,
    timestamp: Date.now(),
  };

  // 캐시 저장
  scoreCache.set(cacheKey, result);

  return result;
}

/**
 * 시장 데이터 기반 점수 계산 (AI 없을 때 fallback)
 */
function calculateMarketBasedScore(etf: NaverETFItem): {
  claude: number;
  gemini: number;
  gpt: number;
  reason: string;
} {
  let baseScore = 3.5;
  
  // 등락률 반영
  if (etf.changePercent > 2) baseScore += 0.5;
  else if (etf.changePercent > 0) baseScore += 0.3;
  else if (etf.changePercent < -2) baseScore -= 0.3;
  
  // 거래량 반영 (활발하면 가점)
  if (etf.volume > 1000000) baseScore += 0.3;
  
  // 순자산 반영 (대형 ETF 선호)
  if (etf.totalAssets && etf.totalAssets > 10000) baseScore += 0.2;

  // 캐릭터별 편차
  const claude = Math.min(5, Math.max(1, baseScore - 0.1));
  const gemini = Math.min(5, Math.max(1, baseScore + 0.3));
  const gpt = Math.min(5, Math.max(1, baseScore));

  const reason = etf.changePercent >= 0 
    ? '시장 모멘텀 긍정적' 
    : '변동성 주시 필요';

  return { claude, gemini, gpt, reason };
}

// Fallback ETF 목록 (네이버 API 실패 시)
const FALLBACK_ETFS: NaverETFItem[] = [
  { ticker: '069500', name: 'KODEX 200', price: 35000, change: 150, changePercent: 0.43, volume: 1500000, nav: 35050, totalAssets: 85000 },
  { ticker: '102110', name: 'TIGER 200', price: 35200, change: 120, changePercent: 0.34, volume: 800000, nav: 35250, totalAssets: 45000 },
  { ticker: '360750', name: 'TIGER 미국S&P500', price: 17500, change: 200, changePercent: 1.15, volume: 2000000, nav: 17520, totalAssets: 35000 },
  { ticker: '379800', name: 'KODEX 미국S&P500TR', price: 15800, change: 180, changePercent: 1.15, volume: 1200000, nav: 15820, totalAssets: 28000 },
  { ticker: '133690', name: 'TIGER 미국나스닥100', price: 95000, change: 1200, changePercent: 1.28, volume: 500000, nav: 95100, totalAssets: 25000 },
  { ticker: '161510', name: 'ARIRANG 고배당주', price: 12500, change: 50, changePercent: 0.40, volume: 300000, nav: 12520, totalAssets: 8000 },
  { ticker: '091160', name: 'KODEX 반도체', price: 42000, change: 800, changePercent: 1.94, volume: 900000, nav: 42050, totalAssets: 12000 },
  { ticker: '305720', name: 'KODEX 2차전지산업', price: 8500, change: -120, changePercent: -1.39, volume: 1500000, nav: 8480, totalAssets: 9000 },
  { ticker: '364980', name: 'TIGER AI반도체핵심공정', price: 15200, change: 320, changePercent: 2.15, volume: 800000, nav: 15250, totalAssets: 5000 },
  { ticker: '148070', name: 'KOSEF 국고채10년', price: 105000, change: -200, changePercent: -0.19, volume: 100000, nav: 105050, totalAssets: 15000 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  // 날짜 파라미터가 있으면 해당 날짜, 없으면 오늘
  const targetDate = dateParam || new Date().toISOString().split('T')[0];
  
  try {
    // 1. DB에서 해당 날짜의 verdict 조회
    let dbVerdict = null;
    try {
      const { data: verdict, error } = await supabase
        .from('verdicts')
        .select('*')
        .eq('date', targetDate)
        .single();
      
      if (!error && verdict) {
        dbVerdict = verdict;
      }
    } catch (e) {
      console.log('No DB verdict found, using real-time data');
    }

    // 2. 네이버에서 실시간 ETF 데이터 가져오기
    let allETFs: NaverETFItem[] = [];
    let isRealTime = false;

    try {
      allETFs = await fetchNaverETFList();
      isRealTime = allETFs.length > 0;
      console.log(`Fetched ${allETFs.length} ETFs from Naver`);
    } catch (e) {
      console.error('Failed to fetch from Naver:', e);
    }

    // 네이버 데이터 없으면 Fallback 사용
    if (allETFs.length === 0) {
      allETFs = FALLBACK_ETFS;
      isRealTime = false;
    }

    // 3. Top ETF 선정 (순자산 기준 정렬 후 상위 선택)
    const sortedETFs = allETFs
      .filter(etf => etf.totalAssets && etf.totalAssets > 1000) // 순자산 1000억 이상
      .sort((a, b) => (b.totalAssets || 0) - (a.totalAssets || 0))
      .slice(0, 10); // 상위 10개만 AI 분석 (비용 절감)

    // 4. AI 점수 생성 (병렬 처리)
    console.log(`[AI Verdict] Analyzing ${sortedETFs.length} ETFs with AI...`);
    
    const scoredETFs = await Promise.all(
      sortedETFs.map(async (etf) => {
        const category = getETFCategory(etf.name);
        const scores = await generateRealAIScores(etf, category);
        
        return {
          ...etf,
          ...scores,
          category,
        };
      })
    );

    // 평균 점수 기준 정렬 후 Top 5
    const top5 = scoredETFs
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5)
      .map((etf, idx) => ({
        rank: idx + 1,
        symbolId: etf.ticker,
        symbol: etf.ticker,
        name: etf.name,
        category: etf.category,
        avgScore: etf.avgScore,
        claudeScore: etf.claudeScore,
        geminiScore: etf.geminiScore,
        gptScore: etf.gptScore,
        unanimous: etf.isUnanimous,
        rationale: etf.rationale,
        currentPrice: etf.price,
        change: etf.change,
        changePercent: etf.changePercent,
        nav: etf.nav,
        totalAssets: etf.totalAssets,
        scores: {
          claude: etf.claudeScore,
          gemini: etf.geminiScore,
          gpt: etf.gptScore,
        },
      }));

    const targetDateObj = new Date(targetDate + 'T00:00:00');
    const dateStr = targetDateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 만장일치 개수
    const unanimousCount = top5.filter(item => item.unanimous).length;

    // 분석 요약 생성
    const categories = Array.from(new Set(top5.map(e => e.category)));
    const aiSource = hasOpenRouterKey() ? '실제 AI 분석' : '시장 데이터 기반 분석';
    const rationale = `${aiSource}으로 선정한 오늘의 Top 5 ETF입니다. ${categories.join(', ')} 카테고리에서 ${unanimousCount}개 종목이 만장일치 추천을 받았습니다.`;
    
    return NextResponse.json({
      success: true,
      isRealTime,
      isAIAnalysis: hasOpenRouterKey(),
      isFromDB: !!dbVerdict,
      date: dateStr,
      time: timeStr,
      targetDate,
      unanimousCount,
      rationale,
      top5,
      totalETFs: allETFs.length,
    });
    
  } catch (error: unknown) {
    console.error('Verdict API error:', error);
    
    // 에러 시 Fallback (시장 데이터 기반)
    const top5 = await Promise.all(
      FALLBACK_ETFS.slice(0, 5).map(async (etf, idx) => {
        const category = getETFCategory(etf.name);
        const marketScore = calculateMarketBasedScore(etf);
        const avgScore = Number(((marketScore.claude + marketScore.gemini + marketScore.gpt) / 3).toFixed(1));
        
        return {
          rank: idx + 1,
          symbolId: etf.ticker,
          symbol: etf.ticker,
          name: etf.name,
          category,
          avgScore,
          claudeScore: Number(marketScore.claude.toFixed(1)),
          geminiScore: Number(marketScore.gemini.toFixed(1)),
          gptScore: Number(marketScore.gpt.toFixed(1)),
          unanimous: marketScore.claude >= 4 && marketScore.gemini >= 4 && marketScore.gpt >= 4,
          rationale: `${etf.name}: ${marketScore.reason}`,
          currentPrice: etf.price,
          change: etf.change,
          changePercent: etf.changePercent,
          nav: etf.nav,
          totalAssets: etf.totalAssets,
          scores: {
            claude: Number(marketScore.claude.toFixed(1)),
            gemini: Number(marketScore.gemini.toFixed(1)),
            gpt: Number(marketScore.gpt.toFixed(1)),
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      isRealTime: false,
      isAIAnalysis: false,
      isFromDB: false,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      targetDate: new Date().toISOString().split('T')[0],
      unanimousCount: top5.filter(e => e.unanimous).length,
      rationale: '시장 데이터 기반으로 선정한 오늘의 Top 5 ETF입니다.',
      top5,
      totalETFs: FALLBACK_ETFS.length,
    });
  }
}
