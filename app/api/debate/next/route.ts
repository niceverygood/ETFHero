import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/llm';
import { createDebateMessage, updateDebateSession } from '@/lib/supabase';

// Mock current prices for ETFs
const ETF_PRICES: Record<string, number> = {
  '069500': 35000, // KODEX 200
  '102110': 37500, // TIGER 200
  '360750': 18500, // TIGER 미국S&P500
  '133690': 96000, // TIGER 미국나스닥100
  '091160': 42000, // KODEX 반도체
  '305720': 15800, // KODEX 2차전지산업
  '379800': 15200, // KODEX 미국S&P500TR
  '161510': 14500, // ARIRANG 고배당주
  '148070': 102000, // KOSEF 국고채10년
  '364980': 15300, // TIGER AI반도체핵심공정
  '381170': 16200, // TIGER 미국테크TOP10
  '453810': 12800, // TIGER 미국AI빅테크10
  '266160': 12800, // KODEX 배당가치
  '329200': 52500, // TIGER CD금리투자KIS
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Debate next request body:', body);
    
    const { sessionId, round, symbol, symbolName, currentPrice } = body;

    if (!sessionId) {
      console.error('Missing sessionId in request');
      return NextResponse.json(
        { success: false, error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    if (!round) {
      console.error('Missing round in request');
      return NextResponse.json(
        { success: false, error: 'Missing round' },
        { status: 400 }
      );
    }

    const finalSymbol = symbol || '069500';
    const finalSymbolName = symbolName || 'KODEX 200';
    const finalCurrentPrice = currentPrice || ETF_PRICES[finalSymbol] || 35000;

    console.log(`Generating round ${round} for ${finalSymbol} (${finalSymbolName}) at price ${finalCurrentPrice}`);

    const orchestrator = getOrCreateSession(sessionId);
    orchestrator.setCurrentPrice(finalCurrentPrice);
    const messages = await orchestrator.generateRound(finalSymbol, finalSymbolName, round);

    console.log(`Generated ${messages.length} messages`);

    // Try to save messages to Supabase
    const savedMessages = [];
    for (const msg of messages) {
      try {
        const saved = await createDebateMessage(
          sessionId,
          msg.character,
          msg.content,
          msg.score,
          msg.risks,
          msg.sources,
          round
        );
        savedMessages.push({
          id: saved.id,
          character: msg.character,
          content: msg.content,
          score: msg.score,
          risks: msg.risks,
          sources: msg.sources,
          targetPrice: msg.targetPrice,
          targetDate: msg.targetDate,
          priceRationale: msg.priceRationale,
          dateRationale: msg.dateRationale,
          methodology: msg.methodology,
          createdAt: saved.created_at,
        });
      } catch (e) {
        console.log('Failed to save message to Supabase:', e);
        // Use local message if Supabase fails
        savedMessages.push({
          id: `${sessionId}-${msg.character}-${round}-${messages.indexOf(msg)}`,
          character: msg.character,
          content: msg.content,
          score: msg.score,
          risks: msg.risks,
          sources: msg.sources,
          targetPrice: msg.targetPrice,
          targetDate: msg.targetDate,
          priceRationale: msg.priceRationale,
          dateRationale: msg.dateRationale,
          methodology: msg.methodology,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Try to update session round
    try {
      await updateDebateSession(sessionId, { current_round: round });
    } catch (e) {
      console.log('Failed to update session round:', e);
    }

    // Get current targets summary and consensus
    const targets = orchestrator.getTargets();
    const consensus = orchestrator.getConsensus();

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        round,
        currentPrice: finalCurrentPrice,
        messages: savedMessages,
        targets,
        consensus,  // 합의 도출 결과 (3명 모두 목표가 제시 시)
      },
    });
  } catch (error) {
    console.error('Debate next error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate next round' },
      { status: 500 }
    );
  }
}
