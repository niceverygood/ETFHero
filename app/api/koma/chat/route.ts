import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = 'anthropic/claude-3-haiku'; // 빠른 응답을 위해 Haiku 사용

// 코마(KOMA) 캐릭터 시스템 프롬프트
const KOMA_SYSTEM_PROMPT = `당신은 "코마(KOMA)"입니다. KODEX Master의 약자로, 삼성자산운용의 ETF 전문가 AI 캐릭터입니다.

## 캐릭터 설정
- 이름: 코마 (KOMA - KODEX Master)
- 소속: 삼성자산운용 ETF 전문가
- 성격: 친근하고 전문적이며, 쉬운 설명을 좋아함
- 말투: 존댓말, 친근하면서도 신뢰감 있는 톤
- 이모지를 적절히 사용하여 친근한 분위기 연출

## 전문 분야
1. **KODEX ETF 시리즈**: 삼성자산운용의 대표 ETF 브랜드
   - KODEX 200 (069500): 국내 대표 지수 ETF
   - KODEX 코스닥150 (229200): 코스닥 시장 투자
   - KODEX 반도체 (091160): 반도체 섹터 집중 투자
   - KODEX 2차전지산업 (305720): 2차전지 테마
   - KODEX 배당성장 (211900): 배당 성장주 투자
   - KODEX 미국S&P500TR (379810): 미국 시장 원화 투자
   - KODEX 골드선물(H) (132030): 금 투자
   - KODEX 국고채10년 (148070): 채권 투자

2. **ETF 기초 지식**: 운용 방식, 비용 구조, 추적 오차, 괴리율 등
3. **투자 전략**: 자산 배분, 리밸런싱, 적립식 투자, 분산 투자
4. **시장 분석**: 국내외 주식시장, 채권시장, 원자재 시장

## 응답 가이드라인
1. 항상 친근하고 이해하기 쉽게 설명합니다
2. KODEX ETF를 우선적으로 추천하되, 객관적인 정보도 제공합니다
3. 투자는 개인의 판단이라는 점을 명시합니다
4. 복잡한 개념은 비유나 예시로 설명합니다
5. 답변은 간결하게 유지합니다 (300자 이내 권장)

## 주의사항
- 특정 종목의 매수/매도를 강력히 권유하지 않습니다
- "투자 권유가 아님"을 적절히 언급합니다
- 모르는 내용은 솔직히 모른다고 합니다

## 인사말 예시
"안녕하세요! 저는 삼성자산운용의 ETF 전문가 코마(KOMA)입니다! 🏦✨ KODEX ETF에 대해 궁금한 점이 있으시면 편하게 물어봐 주세요~"`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      // API 키가 없을 경우 폴백 응답
      return NextResponse.json({
        success: true,
        data: {
          message: generateFallbackResponse(message),
          isAI: false,
        },
      });
    }

    // OpenRouter API 호출
    const messages = [
      { role: 'system', content: KOMA_SYSTEM_PROMPT },
      ...history.slice(-10).map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://etfhero.vercel.app',
        'X-Title': 'ETFHero KOMA Chatbot',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json({
        success: true,
        data: {
          message: generateFallbackResponse(message),
          isAI: false,
        },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || generateFallbackResponse(message);

    return NextResponse.json({
      success: true,
      data: {
        message: aiMessage,
        isAI: true,
      },
    });
  } catch (error) {
    console.error('KOMA chat error:', error);
    return NextResponse.json(
      { success: false, error: '채팅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('안녕') || lowerMessage.includes('hello')) {
    return '안녕하세요! 저는 삼성자산운용의 ETF 전문가 코마(KOMA)입니다! 🏦✨ KODEX ETF에 대해 궁금한 점이 있으시면 편하게 물어봐 주세요~';
  }
  
  if (lowerMessage.includes('kodex 200') || lowerMessage.includes('069500')) {
    return 'KODEX 200(069500)은 국내 대표 지수 ETF입니다! 📊 KOSPI 200 지수를 추종하며, 삼성전자, SK하이닉스 등 국내 대형주에 분산 투자할 수 있어요. 총보수는 0.15%로 매우 저렴합니다. 장기 적립식 투자에 적합해요! 💡';
  }
  
  if (lowerMessage.includes('반도체') || lowerMessage.includes('091160')) {
    return 'KODEX 반도체(091160)는 국내 반도체 산업에 집중 투자하는 ETF입니다! 💻 삼성전자, SK하이닉스 등 반도체 핵심 기업들로 구성되어 있어요. 반도체 슈퍼사이클에 투자하고 싶다면 좋은 선택이 될 수 있습니다!';
  }
  
  if (lowerMessage.includes('배당') || lowerMessage.includes('211900')) {
    return 'KODEX 배당성장(211900)은 배당 성장이 기대되는 기업들에 투자하는 ETF입니다! 💰 안정적인 배당 수익과 함께 자본 성장도 기대할 수 있어요. 은퇴 준비나 인컴 투자를 원하시는 분들께 추천드립니다!';
  }
  
  if (lowerMessage.includes('추천') || lowerMessage.includes('뭐가 좋')) {
    return '투자 추천은 개인의 상황에 따라 다르지만, 초보자라면 KODEX 200(069500)부터 시작해보시는 걸 추천드려요! 📈 국내 대형주에 분산 투자할 수 있고, 비용도 저렴합니다. 투자 목적과 기간을 알려주시면 더 자세히 안내해 드릴게요! (투자 권유가 아닌 참고 정보입니다)';
  }
  
  return '좋은 질문이에요! 🤔 저는 KODEX ETF 전문가 코마입니다. KODEX 200, 반도체, 2차전지, 배당 ETF 등에 대해 궁금한 점이 있으시면 물어봐 주세요! 제가 친절하게 설명해 드릴게요~ ✨';
}

