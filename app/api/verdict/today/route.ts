import { NextResponse } from 'next/server';

// Today's verdict는 메인 verdict API를 사용하도록 리다이렉트
// 이 엔드포인트는 하위 호환성을 위해 유지

export async function GET() {
  try {
    // 메인 verdict API 호출
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/verdict`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch verdict');
    }

    const data = await response.json();
    
    // 기존 응답 형식에 맞게 변환
    return NextResponse.json({
      success: true,
      data: {
        id: `verdict-${data.targetDate}`,
        date: data.targetDate,
        top5: data.top5.map((item: {
          rank: number;
          symbolId: string;
          symbol: string;
          name: string;
          avgScore: number;
          rationale: string;
          unanimous: boolean;
          category: string;
        }) => ({
          rank: item.rank,
          symbolId: item.symbolId,
          symbol: item.symbol,
          name: item.name,
          avgScore: item.avgScore,
          rationale: item.rationale,
          hasUnanimous: item.unanimous,
          riskFlags: getRiskFlags(item.category),
        })),
        rationale: data.rationale,
        totalCandidates: data.totalETFs,
        unanimousCount: data.unanimousCount,
        createdAt: new Date().toISOString(),
        isAIAnalysis: data.isAIAnalysis,
      },
    });
  } catch (error) {
    console.error('Today verdict error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch today verdict' },
      { status: 500 }
    );
  }
}

// 카테고리별 리스크 플래그
function getRiskFlags(category: string): string[] {
  const riskMap: Record<string, string[]> = {
    '시장지수': ['시장 전반 하락', '환율 변동'],
    '해외주식': ['환율 변동', '글로벌 경기'],
    '배당': ['배당컷 위험', '금리 변동'],
    '섹터': ['업황 변동', '섹터 집중'],
    '테마': ['테마 쏠림', '변동성 확대'],
    '채권': ['금리 상승', '신용 리스크'],
    '원자재': ['원자재 가격', '수급 변동'],
    '기타': ['시장 변동성'],
  };
  
  return riskMap[category] || riskMap['기타'];
}
