import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';
import { ALL_ETFS, POPULAR_ETFS, findETFByTicker } from '@/lib/data/etf-list';

// Popular ETFs for generating fallback verdicts
const MOCK_ETFS = ALL_ETFS.filter(e => POPULAR_ETFS.includes(e.ticker)).slice(0, 20);

// Seeded random function for consistent dummy data
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDummyVerdict(dateStr: string) {
  const dateSeed = dateStr.split('-').map(Number).reduce((a, b) => a * 100 + b, 0);
  
  // Shuffle ETFs based on date seed
  const shuffled = [...MOCK_ETFS].sort((a, b) => {
    const seedA = dateSeed + a.ticker.charCodeAt(0);
    const seedB = dateSeed + b.ticker.charCodeAt(0);
    return seededRandom(seedA) - seededRandom(seedB);
  });

  const top5 = shuffled.slice(0, 5).map((etf, i) => {
    const baseSeed = dateSeed + i + etf.ticker.charCodeAt(0);
    
    // Generate individual AI scores with some variation
    const claudeScore = Number((3.0 + seededRandom(baseSeed + 1) * 2.0).toFixed(1));
    const geminiScore = Number((3.0 + seededRandom(baseSeed + 2) * 2.0).toFixed(1));
    const gptScore = Number((3.0 + seededRandom(baseSeed + 3) * 2.0).toFixed(1));
    const avgScore = Number(((claudeScore + geminiScore + gptScore) / 3).toFixed(1));
    
    // Generate target return based on ETF characteristics
    const targetReturn = Number((5 + seededRandom(baseSeed + 4) * 15).toFixed(1));
    
    // Target horizon (1-6 months)
    const monthsAhead = 1 + Math.floor(seededRandom(baseSeed + 5) * 5);
    const timeHorizon = `${monthsAhead}개월`;

    return {
      rank: i + 1,
      etfTicker: etf.ticker,
      etfName: etf.nameKo || etf.name,
      category: etf.category,
      avgScore,
      claudeScore,
      geminiScore,
      gptScore,
      targetReturn,
      timeHorizon,
      expenseRatio: etf.expenseRatio,
    };
  });

  return {
    date: dateStr,
    top5,
    isGenerated: false, // Historical dummy data
  };
}

// Convert DB format to Calendar format
function convertDBVerdictToCalendarFormat(dbVerdict: any): any {
  const top5Items = dbVerdict.top5 || [];
  
  return {
    date: dbVerdict.date,
    top5: top5Items.map((item: any, idx: number) => {
      const etfInfo = findETFByTicker(item.ticker || item.etfTicker);
      return {
        rank: item.rank || idx + 1,
        etfTicker: item.ticker || item.etfTicker,
        etfName: etfInfo?.nameKo || etfInfo?.name || item.name || item.etfName,
        category: etfInfo?.category || item.category || '기타',
        avgScore: item.avgScore || 4.0,
        claudeScore: item.claudeScore || 0,
        geminiScore: item.geminiScore || 0,
        gptScore: item.gptScore || 0,
        targetReturn: item.targetReturn || 0,
        timeHorizon: item.timeHorizon || '3개월',
        expenseRatio: etfInfo?.expenseRatio || item.expenseRatio || 0,
      };
    }),
    isGenerated: true, // AI generated data
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 한국 시간 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60 * 1000);
    const todayStr = kstTime.toISOString().split('T')[0];
    const today = new Date(todayStr);

    // 1. DB에서 해당 월의 모든 verdict 조회
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    let dbVerdictMap: Record<string, any> = {};
    
    try {
      const { data: dbVerdicts, error } = await getSupabaseClient()
        .from('verdicts')
        .select('date, top5, consensus_summary, market_theme')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      // DB 데이터를 Map으로 변환
      if (dbVerdicts && !error) {
        for (const v of dbVerdicts) {
          dbVerdictMap[v.date] = convertDBVerdictToCalendarFormat(v);
        }
      }
    } catch (dbError) {
      console.log('DB fetch skipped, using mock data');
    }

    // 2. Generate verdicts for each day of the month
    const verdicts = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(dateStr);

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      // Skip future dates
      if (date > today) {
        continue;
      }

      // DB에 데이터가 있으면 그것을 사용 (오늘 포함)
      if (dbVerdictMap[dateStr]) {
        verdicts.push(dbVerdictMap[dateStr]);
        continue;
      }

      // 오늘인데 DB 데이터가 없으면 스킵 (아직 생성 안됨)
      if (dateStr === todayStr) {
        continue;
      }

      // 과거 날짜인데 DB 데이터가 없으면 Mock 데이터 생성
      const verdict = generateDummyVerdict(dateStr);
      verdicts.push(verdict);
    }

    return NextResponse.json({
      success: true,
      data: verdicts,
      dbCount: Object.keys(dbVerdictMap).length,
    });
  } catch (error) {
    console.error('Calendar verdicts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar verdicts' },
      { status: 500 }
    );
  }
}
