import { NextRequest, NextResponse } from 'next/server';
import { findETFByTicker } from '@/lib/data/etf-list';
import { getCachedETFPrice, getCachedETFPerformance } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';
import { getSupabaseClient } from '@/lib/supabase-client';

// AI 캐릭터 정보
const CHARACTERS = {
  claude: { name: 'Claude Lee', color: 'blue' },
  gemini: { name: '제미나인', color: 'purple' },
  gpt: { name: 'G.P. Taylor', color: 'amber' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const date = searchParams.get('date');

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Symbol is required' },
      { status: 400 }
    );
  }

  try {
    // 1. ETF 기본 정보 조회
    const etfInfo = findETFByTicker(symbol);
    if (!etfInfo) {
      return NextResponse.json(
        { success: false, error: 'ETF not found' },
        { status: 404 }
      );
    }

    // 2. DB에서 토론 히스토리 조회 시도
    let dbHistory = null;
    try {
      const { data, error } = await getSupabaseClient()
        .from('debate_sessions')
        .select('*')
        .eq('symbol', symbol)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        dbHistory = data;
      }
    } catch (e) {
      console.log('No DB history found for symbol:', symbol);
    }

    // 3. 실시간 가격 및 수익률 데이터 조회
    let currentPrice = 0;
    let changePercent = 0;
    let performance = null;

    try {
      if (etfInfo.region === 'US') {
        const quote = await getCachedETFPrice(symbol);
        if (quote) {
          currentPrice = quote.price;
          changePercent = quote.changePercent;
        }
        performance = await getCachedETFPerformance(symbol);
      } else if (etfInfo.region === 'KR') {
        const naverData = await fetchNaverETFDetail(symbol);
        if (naverData) {
          currentPrice = naverData.price;
          changePercent = naverData.changePercent;
        }
      }
    } catch (e) {
      console.log('Price fetch failed');
    }

    // 4. DB에 히스토리가 있으면 반환
    if (dbHistory && dbHistory.messages) {
      return NextResponse.json({
        success: true,
        isFromDB: true,
        data: {
          sessionId: dbHistory.id,
          symbol,
          symbolName: etfInfo.nameKo || etfInfo.name,
          date: dbHistory.created_at?.split('T')[0] || date,
          messages: dbHistory.messages,
          consensusTarget: dbHistory.consensus_target,
          currentPrice,
          changePercent,
          performance,
        },
      });
    }

    // 5. DB에 없으면 실시간 데이터 기반 기본 응답 반환
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // 실시간 데이터 기반 목표가 계산
    const basePrice = currentPrice || 100;
    const return1y = performance?.return1y || 0;
    
    // 목표가는 현재가 + 예상 상승률 (보수적/공격적/중립)
    const claudeTarget = Math.round(basePrice * (1 + (return1y > 0 ? 0.1 : 0.05)) * 100) / 100;
    const geminiTarget = Math.round(basePrice * (1 + (return1y > 0 ? 0.2 : 0.1)) * 100) / 100;
    const gptTarget = Math.round(basePrice * (1 + (return1y > 0 ? 0.05 : 0.02)) * 100) / 100;

    // 새 토론 세션 생성 (아직 진행되지 않음을 나타냄)
    return NextResponse.json({
      success: true,
      isFromDB: false,
      needsNewDebate: true,
      data: {
        sessionId: `pending-${symbol}-${targetDate}`,
        symbol,
        symbolName: etfInfo.nameKo || etfInfo.name,
        date: targetDate,
        messages: [],
        suggestedTargets: {
          claude: claudeTarget,
          gemini: geminiTarget,
          gpt: gptTarget,
        },
        currentPrice,
        changePercent,
        performance: performance ? {
          return1m: performance.return1m,
          return3m: performance.return3m,
          return1y: performance.return1y,
          dividendYield: performance.dividendYield,
        } : null,
        etfInfo: {
          category: etfInfo.category,
          issuer: etfInfo.issuer,
          expenseRatio: etfInfo.expenseRatio,
          description: etfInfo.description,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch debate history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debate history' },
      { status: 500 }
    );
  }
}
