import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSignal, 
  scanForSignals, 
  getSignalHistory,
  calculatePerformance,
} from '@/lib/signals/generator';
import { SIGNAL_LABELS } from '@/lib/signals/types';
import { POPULAR_ETFS } from '@/lib/data/etf-list';

// 주요 모니터링 ETF 목록 (국내상장 ETF 중심)
const WATCHLIST_ETFS = [
  '069500', '102110', '229200',  // 지수: KODEX200, TIGER200, 코스닥150
  '360750', '133690', '379800',  // 미국: S&P500, 나스닥100, S&P500TR
  '441800', '446720', '161510',  // 배당: 미국배당다우존스, 배당프리미엄, 고배당주
  '381170', '091160', '409820',  // 반도체: 필라반도체, KODEX반도체, 미국반도체MV
  '305720', '381180', '473460',  // 2차전지: 2차전지산업, 테마, TOP10
  '148070', '305080', '453080',  // 채권: 국고채10년, 미국채10년, 미국30년채
  '132030', '319640', '329750',  // 대체: 골드선물, TIGER골드, 미국리츠
];

/**
 * GET /api/signals
 * 
 * 활성 시그널 목록 조회
 * 
 * Query Parameters:
 * - type: 시그널 타입 필터 (STRONG_BUY, BUY, etc.)
 * - unanimous: 만장일치만 (true/false)
 * - minStrength: 최소 강도 (0-100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unanimousOnly = searchParams.get('unanimous') === 'true';
    const minStrength = parseInt(searchParams.get('minStrength') || '0');

    // 시그널 히스토리 조회
    let signals = getSignalHistory();

    // 필터링
    if (type) {
      signals = signals.filter(s => s.signalType === type);
    }
    if (unanimousOnly) {
      signals = signals.filter(s => s.isUnanimous);
    }
    if (minStrength > 0) {
      signals = signals.filter(s => s.strength >= minStrength);
    }

    // 활성 시그널만
    const activeSignals = signals.filter(s => s.status === 'active');
    const completedSignals = signals.filter(s => s.outcome);

    // 성과 통계
    const performance = calculatePerformance();

    return NextResponse.json({
      success: true,
      data: {
        activeSignals,
        recentCompleted: completedSignals.slice(0, 10),
        performance,
        signalLabels: SIGNAL_LABELS,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Signals API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch signals',
    }, { status: 500 });
  }
}

/**
 * POST /api/signals
 * 
 * 새 시그널 생성 또는 스캔
 * 
 * Request Body:
 * - action: 'generate' (단일) | 'scan' (다중 스캔)
 * - ticker: ETF 티커 (generate용)
 * - tickers: ETF 티커 배열 (scan용, 없으면 기본 워치리스트)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ticker, tickers } = body;

    if (action === 'generate' && ticker) {
      // 단일 ETF 시그널 생성
      const signal = await generateSignal(ticker);
      
      if (!signal) {
        return NextResponse.json({
          success: false,
          error: 'Failed to generate signal for this ETF',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: signal,
      });
    }

    if (action === 'scan') {
      // 다중 ETF 스캔
      const targetTickers = tickers?.length > 0 ? tickers : WATCHLIST_ETFS;
      const signals = await scanForSignals(targetTickers);

      // 스캔 결과 요약 (히스토리에 이미 저장됨)
      const allHistory = getSignalHistory();
      const activeSignals = allHistory.filter(s => s.status === 'active');

      return NextResponse.json({
        success: true,
        data: {
          signals,
          activeSignals, // 바로 반환
          scannedCount: targetTickers.length,
          signalCount: signals.length,
          strongSignals: signals.filter(s => s.strength >= 80).length,
          unanimousSignals: signals.filter(s => s.isUnanimous).length,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "generate" or "scan"',
    }, { status: 400 });

  } catch (error) {
    console.error('Signals API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process signal request',
    }, { status: 500 });
  }
}

