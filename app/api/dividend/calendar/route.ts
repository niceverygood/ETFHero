import { NextRequest, NextResponse } from 'next/server';
import {
  generateDividendEvents,
  calculateAnnualDividend,
  DIVIDEND_ETFS,
  getDividendETFInfo,
  type DividendEvent,
} from '@/lib/data/dividend-data';

/**
 * GET /api/dividend/calendar
 * 
 * 배당 캘린더 조회
 * 
 * Query Parameters:
 * - year: 연도 (기본값: 현재 연도)
 * - month: 월 (선택, 없으면 연간 전체)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const currentDate = new Date();
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear();

    if (monthParam) {
      // 특정 월의 배당 일정
      const month = parseInt(monthParam);
      if (month < 1 || month > 12) {
        return NextResponse.json({
          success: false,
          error: 'Invalid month (1-12)',
        }, { status: 400 });
      }

      const events = generateDividendEvents(year, month);
      
      return NextResponse.json({
        success: true,
        data: {
          year,
          month,
          events,
          totalEvents: events.length,
        },
      });
    }

    // 연간 전체 배당 일정
    const yearlyEvents: { month: number; events: DividendEvent[] }[] = [];
    let totalEvents = 0;

    for (let month = 1; month <= 12; month++) {
      const events = generateDividendEvents(year, month);
      yearlyEvents.push({ month, events });
      totalEvents += events.length;
    }

    // 월별 배당 금액 집계 (주요 ETF 기준)
    const monthlyTotals = yearlyEvents.map(({ month, events }) => ({
      month,
      eventCount: events.length,
      etfCount: new Set(events.map(e => e.ticker)).size,
    }));

    return NextResponse.json({
      success: true,
      data: {
        year,
        monthlyEvents: yearlyEvents,
        monthlyTotals,
        totalEvents,
        availableETFs: DIVIDEND_ETFS.length,
      },
    });
  } catch (error) {
    console.error('Dividend calendar error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dividend calendar',
    }, { status: 500 });
  }
}

/**
 * POST /api/dividend/calendar
 * 
 * 보유 ETF 기반 배당금 계산
 * 
 * Request Body:
 * {
 *   holdings: [{ ticker: "SCHD", shares: 100 }, { ticker: "JEPI", shares: 50 }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdings } = body;

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Holdings array is required',
      }, { status: 400 });
    }

    // 유효성 검사
    const validHoldings = holdings.filter((h: any) => {
      const info = getDividendETFInfo(h.ticker);
      return info && typeof h.shares === 'number' && h.shares > 0;
    });

    if (validHoldings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid dividend ETF holdings found',
      }, { status: 400 });
    }

    // 배당금 계산
    const dividendSummary = calculateAnnualDividend(validHoldings);

    // 상세 ETF 정보 추가
    const detailedHoldings = validHoldings.map((h: any) => {
      const info = getDividendETFInfo(h.ticker)!;
      const annualDividend = info.lastDividend * 
        (info.frequency === 'monthly' ? 12 : 
         info.frequency === 'quarterly' ? 4 :
         info.frequency === 'semi-annual' ? 2 : 1) * h.shares;

      return {
        ticker: h.ticker,
        name: info.nameKo,
        shares: h.shares,
        dividendYield: info.dividendYield,
        frequency: info.frequency,
        lastDividend: info.lastDividend,
        annualDividend: Number(annualDividend.toFixed(2)),
        exDividendMonths: info.exDividendMonths,
      };
    });

    // 다음 배당 일정
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const upcomingDividends: DividendEvent[] = [];
    
    // 현재 월부터 3개월간 배당 일정
    for (let i = 0; i < 3; i++) {
      let month = currentMonth + i;
      let year = currentYear;
      if (month > 12) {
        month -= 12;
        year++;
      }
      
      const events = generateDividendEvents(year, month);
      const relevantEvents = events.filter(e => 
        validHoldings.some((h: any) => h.ticker.toUpperCase() === e.ticker.toUpperCase())
      );
      upcomingDividends.push(...relevantEvents);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAnnualDividend: dividendSummary.totalAnnualDividend,
          monthlyAverage: Number((dividendSummary.totalAnnualDividend / 12).toFixed(2)),
          holdingsCount: validHoldings.length,
        },
        monthlyBreakdown: dividendSummary.monthlyBreakdown,
        holdings: detailedHoldings,
        upcomingDividends: upcomingDividends.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Dividend calculation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate dividends',
    }, { status: 500 });
  }
}


