import { NextRequest, NextResponse } from 'next/server';
import { DebateOrchestrator } from '@/lib/llm';
import { selectTop5, generateRationale, type SymbolEvaluation } from '@/lib/scoring';

// ETF 목록 for evaluation
const CANDIDATE_ETFS = [
  { id: '1', symbol: '069500', name: 'KODEX 200', sector: '시장지수' },
  { id: '2', symbol: '102110', name: 'TIGER 200', sector: '시장지수' },
  { id: '3', symbol: '360750', name: 'TIGER 미국S&P500', sector: '해외지수' },
  { id: '4', symbol: '133690', name: 'TIGER 미국나스닥100', sector: '해외지수' },
  { id: '5', symbol: '091160', name: 'KODEX 반도체', sector: '테마/섹터' },
  { id: '6', symbol: '305720', name: 'KODEX 2차전지산업', sector: '테마/섹터' },
  { id: '7', symbol: '379800', name: 'KODEX 미국S&P500TR', sector: '해외지수' },
  { id: '8', symbol: '161510', name: 'ARIRANG 고배당주', sector: '배당/가치' },
  { id: '9', symbol: '148070', name: 'KOSEF 국고채10년', sector: '채권' },
  { id: '10', symbol: '364980', name: 'TIGER AI반도체핵심공정', sector: '테마/섹터' },
  { id: '11', symbol: '371460', name: 'TIGER 차이나전기차SOLACTIVE', sector: '해외테마' },
  { id: '12', symbol: '143850', name: 'TIGER 200IT', sector: '테마/섹터' },
  { id: '13', symbol: '266160', name: 'KODEX 배당가치', sector: '배당/가치' },
  { id: '14', symbol: '329200', name: 'TIGER CD금리투자KIS', sector: '채권' },
  { id: '15', symbol: '381170', name: 'TIGER 미국테크TOP10', sector: '해외테마' },
  { id: '16', symbol: '453810', name: 'TIGER 미국AI빅테크10', sector: '해외테마' },
  { id: '17', symbol: '411060', name: 'ACE 미국빅테크TOP7 Plus', sector: '해외테마' },
  { id: '18', symbol: '395170', name: 'KBSTAR 미국S&P500', sector: '해외지수' },
  { id: '19', symbol: '292150', name: 'TIGER TOP10', sector: '시장지수' },
  { id: '20', symbol: '157450', name: 'TIGER 모멘텀', sector: '전략/스마트베타' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Evaluate all candidates
    const evaluations: SymbolEvaluation[] = [];

    for (const candidate of CANDIDATE_ETFS) {
      const orchestrator = new DebateOrchestrator();
      orchestrator.setCurrentPrice(50000); // Default price

      try {
        const messages = await orchestrator.generateRound(candidate.symbol, candidate.name, 1);
        
        const scores = {
          claude: 3,
          gemini: 3,
          gpt: 3,
        };
        
        const riskFlags: string[] = [];
        
        messages.forEach((msg) => {
          const charType = msg.character.toLowerCase() as 'claude' | 'gemini' | 'gpt';
          if (charType in scores) {
            scores[charType] = msg.score;
          }
          if (msg.risks) {
            riskFlags.push(...msg.risks);
          }
        });
        
        const avgScore = (scores.claude + scores.gemini + scores.gpt) / 3;
        const hasUnanimous = scores.claude >= 4 && scores.gemini >= 4 && scores.gpt >= 4;

        const evaluation: SymbolEvaluation = {
          symbolId: candidate.id,
          symbol: candidate.symbol,
          name: candidate.name,
          sector: candidate.sector,
          scores,
          avgScore,
          riskFlags: Array.from(new Set(riskFlags)),
          hasUnanimous,
          rationale: '',
        };
        
        evaluation.rationale = generateRationale(evaluation);
        evaluations.push(evaluation);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error evaluating ${candidate.name}:`, error);
      }
    }

    // Select top 5 using consensus rules
    const top5Result = selectTop5(evaluations);

    // Format for storage
    const verdict = {
      id: `verdict-${targetDate}`,
      date: targetDate,
      top5: top5Result.top5.map((e, idx) => ({
        rank: idx + 1,
        symbolId: e.symbolId,
        symbol: e.symbol,
        name: e.name,
        avgScore: e.avgScore,
        rationale: e.rationale,
        hasUnanimous: e.hasUnanimous,
        riskFlags: e.riskFlags,
      })),
      rationale: top5Result.rationale,
      totalCandidates: top5Result.totalCandidates,
      unanimousCount: top5Result.unanimousCount,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: verdict,
    });
  } catch (error) {
    console.error('Verdict generate error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate verdict' },
      { status: 500 }
    );
  }
}


