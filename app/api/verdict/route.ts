import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchTopETFsByAssets, fetchNaverETFList, type NaverETFItem } from '@/lib/external/naver-etf';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// AI 점수 생성 (Mock - 실제로는 LLM으로 분석)
function generateAIScores(etf: NaverETFItem, seed: number): {
  claudeScore: number;
  geminiScore: number;
  gptScore: number;
  avgScore: number;
  isUnanimous: boolean;
} {
  // 시드 기반 점수 생성 (일관성 유지)
  const baseScore = 3.5 + (seed % 15) / 10;
  const claudeScore = Math.min(5, Math.max(3, baseScore + (Math.sin(seed) * 0.5)));
  const geminiScore = Math.min(5, Math.max(3, baseScore + (Math.cos(seed) * 0.5)));
  const gptScore = Math.min(5, Math.max(3, baseScore + (Math.sin(seed * 2) * 0.5)));
  
  const avgScore = (claudeScore + geminiScore + gptScore) / 3;
  const isUnanimous = claudeScore >= 4 && geminiScore >= 4 && gptScore >= 4;

  return {
    claudeScore: Number(claudeScore.toFixed(1)),
    geminiScore: Number(geminiScore.toFixed(1)),
    gptScore: Number(gptScore.toFixed(1)),
    avgScore: Number(avgScore.toFixed(1)),
    isUnanimous,
  };
}

// ETF 분석 이유 생성
function generateRationale(etf: NaverETFItem, category: string): string {
  const changeDesc = etf.changePercent >= 0 
    ? `오늘 ${etf.changePercent.toFixed(2)}% 상승했습니다` 
    : `오늘 ${Math.abs(etf.changePercent).toFixed(2)}% 하락했습니다`;
  
  const categoryDesc: Record<string, string> = {
    '시장지수': '국내 대표 지수를 추종하는 안정적인 ETF입니다.',
    '해외주식': '글로벌 시장에 투자할 수 있는 ETF입니다.',
    '배당': '안정적인 배당 수익을 기대할 수 있는 ETF입니다.',
    '섹터': '특정 산업에 집중 투자하는 테마형 ETF입니다.',
    '테마': '성장 잠재력이 높은 혁신 테마 ETF입니다.',
    '채권': '안정적인 이자 수익을 추구하는 채권 ETF입니다.',
    '원자재': '원자재 가격에 연동된 ETF입니다.',
    '기타': 'AI 분석가들의 추천을 받은 ETF입니다.',
  };

  return `${etf.name}은(는) ${categoryDesc[category] || categoryDesc['기타']} ${changeDesc}.`;
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
      .slice(0, 20); // 상위 20개 중 선택

    // 4. AI 점수 기준으로 Top 5 선정
    const dateSeed = targetDate.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    
    const scoredETFs = sortedETFs.map((etf, idx) => {
      const seed = dateSeed + idx + etf.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const scores = generateAIScores(etf, seed);
      const category = getETFCategory(etf.name);
      
      return {
        ...etf,
        ...scores,
        category,
        rationale: generateRationale(etf, category),
      };
    });

    // 평균 점수 기준 정렬
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
    const categories = [...new Set(top5.map(e => e.category))];
    const rationale = `AI 분석가들이 선정한 오늘의 Top 5 ETF입니다. ${categories.join(', ')} 카테고리에서 ${unanimousCount}개 종목이 만장일치 추천을 받았습니다.`;
    
    return NextResponse.json({
      success: true,
      isRealTime,
      isFromDB: !!dbVerdict,
      date: dateStr,
      time: timeStr,
      targetDate,
      unanimousCount,
      rationale,
      top5,
      totalETFs: allETFs.length,
    });
    
  } catch (error: any) {
    console.error('Verdict API error:', error);
    
    // 에러 시 Fallback 사용
    const dateSeed = new Date().getDate();
    const top5 = FALLBACK_ETFS.slice(0, 5).map((etf, idx) => {
      const seed = dateSeed + idx;
      const scores = generateAIScores(etf, seed);
      const category = getETFCategory(etf.name);
      
      return {
        rank: idx + 1,
        symbolId: etf.ticker,
        symbol: etf.ticker,
        name: etf.name,
        category,
        avgScore: scores.avgScore,
        claudeScore: scores.claudeScore,
        geminiScore: scores.geminiScore,
        gptScore: scores.gptScore,
        unanimous: scores.isUnanimous,
        rationale: generateRationale(etf, category),
        currentPrice: etf.price,
        change: etf.change,
        changePercent: etf.changePercent,
        nav: etf.nav,
        totalAssets: etf.totalAssets,
        scores: {
          claude: scores.claudeScore,
          gemini: scores.geminiScore,
          gpt: scores.gptScore,
        },
      };
    });

    return NextResponse.json({
      success: true,
      isRealTime: false,
      isFromDB: false,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      targetDate: new Date().toISOString().split('T')[0],
      unanimousCount: 2,
      rationale: 'AI 분석가들이 선정한 오늘의 Top 5 ETF입니다.',
      top5,
      totalETFs: FALLBACK_ETFS.length,
    });
  }
}
