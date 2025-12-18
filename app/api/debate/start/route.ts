import { NextRequest, NextResponse } from 'next/server';
import { createDebateSession, getSymbolByCode } from '@/lib/supabase';

// Fallback ETF lookup
const MOCK_ETFS: Record<string, { name: string; sector: string }> = {
  '069500': { name: 'KODEX 200', sector: '시장지수' },
  '102110': { name: 'TIGER 200', sector: '시장지수' },
  '360750': { name: 'TIGER 미국S&P500', sector: '해외지수' },
  '133690': { name: 'TIGER 미국나스닥100', sector: '해외지수' },
  '091160': { name: 'KODEX 반도체', sector: '테마/섹터' },
  '305720': { name: 'KODEX 2차전지산업', sector: '테마/섹터' },
  '161510': { name: 'ARIRANG 고배당주', sector: '배당/가치' },
  '364980': { name: 'TIGER AI반도체핵심공정', sector: '테마/섹터' },
  'SPY': { name: 'SPDR S&P 500 ETF', sector: 'US Market' },
  'QQQ': { name: 'Invesco QQQ Trust', sector: 'US Tech' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Try to get symbol from Supabase first
    let symbolInfo: { name: string; sector: string | null } | null = null;
    
    try {
      const dbSymbol = await getSymbolByCode(symbol);
      if (dbSymbol) {
        symbolInfo = { name: dbSymbol.name, sector: dbSymbol.sector };
      }
    } catch (e) {
      console.log('Supabase lookup failed, using fallback:', e);
    }
    
    // Fallback to mock data
    if (!symbolInfo) {
      symbolInfo = MOCK_ETFS[symbol];
    }

    if (!symbolInfo) {
      return NextResponse.json(
        { success: false, error: 'Unknown symbol' },
        { status: 404 }
      );
    }

    // Try to create session in Supabase
    let sessionId: string;
    try {
      const session = await createDebateSession(symbol, symbolInfo.name);
      sessionId = session.id;
    } catch (e) {
      console.log('Supabase session creation failed, using local ID:', e);
      const today = new Date().toISOString().split('T')[0];
      sessionId = `session-${symbol}-${today}-${Date.now()}`;
    }

    const response = {
      id: sessionId,
      sessionId: sessionId,
      symbol,
      symbolName: symbolInfo.name,
      sector: symbolInfo.sector,
      date: new Date().toISOString().split('T')[0],
      status: 'running',
      round: 0,
      messages: [
        {
          id: `${sessionId}-system-0`,
          role: 'SYSTEM',
          content: `${symbolInfo.name}(${symbol})에 대한 토론을 시작합니다.`,
          sources: [],
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Failed to start debate session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start debate session' },
      { status: 500 }
    );
  }
}
