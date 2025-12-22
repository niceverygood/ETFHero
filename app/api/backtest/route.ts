import { NextRequest, NextResponse } from 'next/server';
import { runBacktest, type BacktestParams, type PortfolioAsset } from '@/lib/backtest/calculator';
import { findETFByTicker } from '@/lib/data/etf-list';

/**
 * POST /api/backtest
 * 
 * 포트폴리오 백테스트 실행 API
 * 
 * Request Body:
 * {
 *   portfolio: [{ ticker: "SPY", weight: 60 }, { ticker: "QQQ", weight: 40 }],
 *   startDate: "2020-01-01",
 *   endDate: "2024-12-01",
 *   initialAmount: 10000000,
 *   rebalanceFrequency: "quarterly" // optional: none, monthly, quarterly, yearly
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolio, startDate, endDate, initialAmount, rebalanceFrequency } = body;

    // 유효성 검사
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json({
        success: false,
        error: '포트폴리오를 입력해주세요. (최소 1개 ETF)',
      }, { status: 400 });
    }

    if (portfolio.length > 10) {
      return NextResponse.json({
        success: false,
        error: '최대 10개 ETF까지 백테스트할 수 있습니다.',
      }, { status: 400 });
    }

    // 비중 합계 검사
    const totalWeight = portfolio.reduce((sum: number, p: PortfolioAsset) => sum + (p.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 1) {
      return NextResponse.json({
        success: false,
        error: `비중 합계가 100%여야 합니다. (현재: ${totalWeight}%)`,
      }, { status: 400 });
    }

    // 날짜 검사
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minDate = new Date('2010-01-01');
    const maxDate = new Date();

    if (start < minDate) {
      return NextResponse.json({
        success: false,
        error: '시작일은 2010년 이후여야 합니다.',
      }, { status: 400 });
    }

    if (end > maxDate) {
      return NextResponse.json({
        success: false,
        error: '종료일은 오늘 이전이어야 합니다.',
      }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({
        success: false,
        error: '시작일은 종료일보다 이전이어야 합니다.',
      }, { status: 400 });
    }

    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 30) {
      return NextResponse.json({
        success: false,
        error: '최소 30일 이상의 기간이 필요합니다.',
      }, { status: 400 });
    }

    // 초기 투자금 검사
    const amount = Number(initialAmount) || 10000000;
    if (amount < 100000 || amount > 10000000000) {
      return NextResponse.json({
        success: false,
        error: '초기 투자금은 10만원 ~ 100억원 사이여야 합니다.',
      }, { status: 400 });
    }

    // ETF 이름 추가
    const portfolioWithNames: PortfolioAsset[] = portfolio.map((p: PortfolioAsset) => {
      const etfInfo = findETFByTicker(p.ticker);
      return {
        ticker: p.ticker.toUpperCase(),
        weight: p.weight,
        name: etfInfo?.nameKo || etfInfo?.name || p.ticker,
      };
    });

    // 백테스트 실행
    const params: BacktestParams = {
      portfolio: portfolioWithNames,
      startDate,
      endDate,
      initialAmount: amount,
      rebalanceFrequency: rebalanceFrequency || 'none',
    };

    const result = await runBacktest(params);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Backtest API error:', error);
    
    // 특정 에러 메시지 처리
    if (error.message?.includes('Failed to fetch')) {
      return NextResponse.json({
        success: false,
        error: '일부 ETF의 과거 데이터를 가져올 수 없습니다. 티커를 확인해주세요.',
      }, { status: 400 });
    }

    if (error.message?.includes('Insufficient data')) {
      return NextResponse.json({
        success: false,
        error: '해당 기간에 충분한 데이터가 없습니다. 기간을 조정해주세요.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '백테스트 실행 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
}

/**
 * GET /api/backtest/presets
 * 
 * 추천 포트폴리오 프리셋 목록
 */
export async function GET() {
  const presets = [
    {
      id: 'balanced',
      name: '균형 포트폴리오',
      description: '주식과 채권의 균형 잡힌 배분',
      portfolio: [
        { ticker: 'SPY', weight: 40, name: 'S&P 500' },
        { ticker: 'QQQ', weight: 20, name: '나스닥 100' },
        { ticker: 'BND', weight: 30, name: '미국 채권' },
        { ticker: 'GLD', weight: 10, name: '금' },
      ],
    },
    {
      id: 'aggressive',
      name: '공격적 성장',
      description: '높은 성장을 추구하는 기술주 중심',
      portfolio: [
        { ticker: 'QQQ', weight: 40, name: '나스닥 100' },
        { ticker: 'SMH', weight: 25, name: '반도체' },
        { ticker: 'ARKK', weight: 20, name: '혁신 기술' },
        { ticker: 'SPY', weight: 15, name: 'S&P 500' },
      ],
    },
    {
      id: 'dividend',
      name: '배당 수익',
      description: '안정적인 배당 수익 추구',
      portfolio: [
        { ticker: 'SCHD', weight: 35, name: '미국 배당' },
        { ticker: 'VYM', weight: 25, name: '뱅가드 고배당' },
        { ticker: 'VIG', weight: 25, name: '배당 성장' },
        { ticker: 'BND', weight: 15, name: '미국 채권' },
      ],
    },
    {
      id: 'allweather',
      name: '올웨더',
      description: '레이 달리오의 올웨더 전략',
      portfolio: [
        { ticker: 'SPY', weight: 30, name: 'S&P 500' },
        { ticker: 'TLT', weight: 40, name: '장기 국채' },
        { ticker: 'IEF', weight: 15, name: '중기 국채' },
        { ticker: 'GLD', weight: 7.5, name: '금' },
        { ticker: 'DBC', weight: 7.5, name: '원자재' },
      ],
    },
    {
      id: 'sp500only',
      name: 'S&P 500 단일',
      description: '미국 대형주 시장 추종',
      portfolio: [
        { ticker: 'SPY', weight: 100, name: 'S&P 500' },
      ],
    },
    {
      id: 'tech',
      name: '테크 집중',
      description: 'AI/반도체 중심 기술주',
      portfolio: [
        { ticker: 'QQQ', weight: 35, name: '나스닥 100' },
        { ticker: 'SMH', weight: 30, name: '반도체' },
        { ticker: 'XLK', weight: 20, name: '기술 섹터' },
        { ticker: 'ARKK', weight: 15, name: '혁신 기술' },
      ],
    },
  ];

  return NextResponse.json({
    success: true,
    data: presets,
  });
}


