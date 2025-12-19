import { NextRequest, NextResponse } from 'next/server';
import { createDebateSession, getSymbolByCode } from '@/lib/supabase';
import { findETFByTicker, ALL_ETFS } from '@/lib/data/etf-list';
import { getCachedETFPrice } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';

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

    // 1. etf-list에서 ETF 정보 조회
    let symbolInfo: { name: string; sector: string | null; price?: number } | null = null;
    const etfInfo = findETFByTicker(symbol);
    
    if (etfInfo) {
      symbolInfo = { 
        name: etfInfo.nameKo || etfInfo.name, 
        sector: etfInfo.category 
      };
      
      // 2. 실시간 가격 조회
      try {
        if (etfInfo.region === 'US') {
          const quote = await getCachedETFPrice(symbol);
          if (quote) {
            symbolInfo.price = quote.price;
          }
        } else if (etfInfo.region === 'KR') {
          const naverData = await fetchNaverETFDetail(symbol);
          if (naverData) {
            symbolInfo.price = naverData.price;
          }
        }
      } catch (e) {
        console.log('Price fetch failed, continuing without price');
      }
    }

    // 3. Supabase에서 조회 시도 (DB에 있으면)
    if (!symbolInfo) {
      try {
        const dbSymbol = await getSymbolByCode(symbol);
        if (dbSymbol) {
          symbolInfo = { name: dbSymbol.name, sector: dbSymbol.sector };
        }
      } catch (e) {
        console.log('Supabase lookup failed:', e);
      }
    }

    if (!symbolInfo) {
      return NextResponse.json(
        { success: false, error: 'Unknown ETF symbol' },
        { status: 404 }
      );
    }

    // 4. Supabase에 세션 생성 시도
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
      currentPrice: symbolInfo.price,
      date: new Date().toISOString().split('T')[0],
      status: 'running',
      round: 0,
      messages: [
        {
          id: `${sessionId}-system-0`,
          role: 'SYSTEM',
          content: `${symbolInfo.name}(${symbol})에 대한 AI 전문가 토론을 시작합니다.${symbolInfo.price ? ` 현재가: $${symbolInfo.price.toFixed(2)}` : ''}`,
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
