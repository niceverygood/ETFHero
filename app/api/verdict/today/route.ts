import { NextResponse } from 'next/server';

// Mock today's verdict (in production, fetch from DB)
function getMockVerdict() {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    id: `verdict-${today}`,
    date: today,
    top5: [
      {
        rank: 1,
        symbolId: '1',
        symbol: '069500',
        name: 'KODEX 200',
        avgScore: 4.7,
        rationale: '세 분석가 모두 KODEX 200에 대해 4점 이상의 긍정적 평가를 내렸습니다. 시장지수 ETF로서 안정성이 뛰어납니다.',
        hasUnanimous: true,
        riskFlags: ['시장 전반 하락', '환율 변동'],
      },
      {
        rank: 2,
        symbolId: '2',
        symbol: '360750',
        name: 'TIGER 미국S&P500',
        avgScore: 4.5,
        rationale: 'Gemi Nine가 5점으로 가장 높게 평가했습니다. 미국 시장 성장에 따른 수혜가 예상됩니다.',
        hasUnanimous: true,
        riskFlags: ['환율 변동', '미국 금리 정책'],
      },
      {
        rank: 3,
        symbolId: '3',
        symbol: '091160',
        name: 'KODEX 반도체',
        avgScore: 4.3,
        rationale: '반도체 섹터 ETF로 AI/HBM 성장 수혜가 예상됩니다. 다만, 섹터 집중 리스크가 있습니다.',
        hasUnanimous: false,
        riskFlags: ['반도체 업황', '섹터 집중'],
      },
      {
        rank: 4,
        symbolId: '7',
        symbol: '133690',
        name: 'TIGER 미국나스닥100',
        avgScore: 4.2,
        rationale: '빅테크 중심 ETF로 기술주 성장에 베팅합니다. 높은 변동성이 있으나 성장 잠재력이 큽니다.',
        hasUnanimous: false,
        riskFlags: ['기술주 조정', '환율 리스크'],
      },
      {
        rank: 5,
        symbolId: '10',
        symbol: '161510',
        name: 'ARIRANG 고배당주',
        avgScore: 4.1,
        rationale: '배당 ETF로 안정적인 현금흐름을 제공합니다. 방어적 포트폴리오 구성에 적합합니다.',
        hasUnanimous: false,
        riskFlags: ['배당컷', '금리 변동'],
      },
    ],
    rationale: 'Top 5 중 2개 ETF가 만장일치 합의를 얻었습니다. 시장지수, 해외지수, 테마 ETF에 대한 선호가 두드러집니다.',
    totalCandidates: 20,
    unanimousCount: 2,
    createdAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const verdict = getMockVerdict();
    
    return NextResponse.json({
      success: true,
      data: verdict,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch today verdict' },
      { status: 500 }
    );
  }
}


