import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPromptWithHoldings, AI_PERSONAS } from '@/lib/ai-personas';
import type { CharacterType } from '@/lib/llm/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Holding {
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface ChatRequest {
  characterType: CharacterType;
  messages: ChatMessage[];
  holdings?: Holding[];
  stockData?: StockData;  // 실시간 종목 데이터
  isInitialAnalysis?: boolean; // 초기 종목 분석 요청 플래그
  analysisType?: 'initial' | 'detailed' | 'strategy' | 'risk' | 'conclusion'; // 분석 유형 (5단계)
  turn?: number; // 분석 턴 (1-5)
}

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// 턴별 분석 지침 생성
function getTurnGuidelines(
  characterType: CharacterType, 
  stockName: string, 
  analysisType: string, 
  turn: number
): string {
  const characterNames: Record<CharacterType, string> = {
    claude: 'Claude Lee',
    gemini: 'Gemi Nine',
    gpt: 'G.P. Taylor'
  };
  
  const charName = characterNames[characterType];
  
  // 턴별 분석 지침
  const turnPrompts: Record<string, Record<CharacterType, string>> = {
    initial: {
      claude: `
## 💡 초기 분석 (Turn 1/5)
${stockName}에 대한 첫 번째 분석입니다. 간결하게 핵심만 전달하세요.

**포함 내용:**
1. 투자 의견 (매수/중립/매도) - 한 문장으로 명확히
2. 핵심 논거 2가지 - 숫자 기반
3. 현재 밸류에이션 한 줄 평가

**분량:** 150-200자 내외
**톤:** ${charName}답게 차분하고 데이터 중심으로`,
      gemini: `
## 💡 초기 분석 (Turn 1/5)
${stockName}에 대한 첫 번째 분석입니다. 밝고 간결하게!

**포함 내용:**
1. 투자 의견 (매수/중립/매도) - 솔직하게
2. 왜 이 종목이 흥미로운지 한 문장
3. 성장 포인트 또는 주의점 하나

**분량:** 150-200자 내외
**톤:** ${charName}답게 긍정적이지만 균형잡힌 시각`,
      gpt: `
## 💡 초기 분석 (Turn 1/5)
${stockName}에 대한 첫 번째 분석입니다. 노련하게 핵심만.

**포함 내용:**
1. 투자 의견 (매수/중립/매도) - 경험에서 우러나온
2. 거시경제 관점 한 문장
3. 첫인상 리스크 한 가지

**분량:** 150-200자 내외
**톤:** ${charName}답게 노련하고 신중하게`
    },
    detailed: {
      claude: `
## 📊 상세 분석 (Turn 2/5)
${stockName}에 대한 심층 분석입니다.

**포함 내용:**
1. PER, PBR, ROE 등 주요 지표 분석
2. 동종업계 대비 비교
3. 재무 안정성 평가
4. 적정 주가 수준 언급

**분량:** 250-350자
**톤:** 전문 애널리스트처럼 상세하게`,
      gemini: `
## 📊 상세 분석 (Turn 2/5)
${stockName}의 성장 스토리를 파헤쳐봐요!

**포함 내용:**
1. TAM(Total Addressable Market) 분석
2. 경쟁사 대비 강점
3. 기술/제품 혁신성
4. 밸류에이션과 성장성의 균형

**분량:** 250-350자
**톤:** 열정적이지만 분석적으로`,
      gpt: `
## 📊 상세 분석 (Turn 2/5)
${stockName}의 펀더멘털을 깊이 살펴보지.

**포함 내용:**
1. 거시경제 영향 분석 (금리, 환율, 경기사이클)
2. 섹터 전망
3. 기업 고유 강점
4. 역사적 유사 사례 언급

**분량:** 250-350자
**톤:** 노련한 시각으로 심층 분석`
    },
    strategy: {
      claude: `
## 📈 투자 전략 (Turn 3/5)
${stockName} 투자 전략을 제시합니다.

**포함 내용:**
1. 매수 구간 / 손절 구간
2. 투자 기간 추천
3. 포트폴리오 비중 제안
4. 분할 매수 전략

**분량:** 200-300자
**톤:** 실전적이고 구체적으로`,
      gemini: `
## 📈 투자 전략 (Turn 3/5)
${stockName} 어떻게 접근하면 좋을까요?

**포함 내용:**
1. 진입 타이밍 조언
2. 분할 매수 전략 (몇 회, 어떤 조건에서)
3. 모니터링 포인트
4. 리밸런싱 시점

**분량:** 200-300자
**톤:** 실용적이면서 친근하게`,
      gpt: `
## 📈 투자 전략 (Turn 3/5)
${stockName} 포지션 전략을 말해주겠네.

**포함 내용:**
1. 적정 투자 비중 (총 자산 대비 %)
2. 현금 비중과 리스크 관리
3. 분할 매수/매도 전략
4. 진입 시점 조언

**분량:** 200-300자
**톤:** 보수적이고 실전적으로`
    },
    risk: {
      claude: `
## ⚠️ 리스크 분석 (Turn 4/5)
${stockName}의 투자 리스크를 점검합니다.

**포함 내용:**
1. 업황 리스크 (경기 민감도, 경쟁 심화)
2. 재무 리스크 (부채비율, 현금흐름)
3. 최악의 시나리오
4. 리스크 대응 방안

**분량:** 200-300자
**톤:** 냉정하고 객관적으로`,
      gemini: `
## ⚠️ 리스크 분석 (Turn 4/5)
${stockName} 주의해야 할 점을 짚어볼게요!

**포함 내용:**
1. 성장 스토리가 무너질 수 있는 경우
2. 밸류에이션 리스크
3. 경쟁사 위협
4. 손실 최소화 전략

**분량:** 200-300자
**톤:** 솔직하지만 건설적으로`,
      gpt: `
## ⚠️ 리스크 분석 (Turn 4/5)
${stockName}의 리스크를 40년 경험으로 짚어주지.

**포함 내용:**
1. 거시경제 리스크 (금리, 환율, 인플레이션)
2. 섹터 사이클 리스크
3. 블랙스완 시나리오
4. 포트폴리오 방어 전략

**분량:** 200-300자
**톤:** 경험에서 우러나온 경고`
    },
    conclusion: {
      claude: `
## 🎯 최종 결론 & 목표가 (Turn 5/5)
${stockName}에 대한 최종 정리입니다.

**반드시 포함:**
1. **최종 투자 의견**: 매수/중립/매도 명확히
2. **목표 주가**: 구체적인 숫자 제시 (현재가 대비 %)
3. **목표 달성 기간**: 몇 개월 내 달성 예상
4. 핵심 포인트 요약

**분량:** 150-200자
**톤:** 간결하고 명확하게 마무리`,
      gemini: `
## 🎯 최종 결론 & 목표가 (Turn 5/5)
${stockName} 정리해볼게요!

**반드시 포함:**
1. **최종 의견**: 매수/중립/매도
2. **목표 주가**: 구체적 숫자 (현재가 대비 상승률)
3. **목표 기간**: 언제까지 달성할 수 있을지
4. 한 줄 요약

**분량:** 150-200자
**톤:** 밝고 명쾌하게 마무리`,
      gpt: `
## 🎯 최종 결론 & 목표가 (Turn 5/5)
${stockName}에 대해 마지막으로 말해주겠네.

**반드시 포함:**
1. **40년 경험의 최종 의견**: 매수/중립/매도
2. **목표 주가**: 보수적으로 산정한 구체적 숫자
3. **목표 달성 기간**: 현실적인 기간 제시
4. 노련한 마무리 조언

**분량:** 150-200자
**톤:** 지혜롭고 노련하게 마무리`
    }
  };
  
  return turnPrompts[analysisType]?.[characterType] || '';
}

// 대화 품질 향상을 위한 메타 프롬프트
function buildConversationContext(messages: ChatMessage[]): string {
  if (messages.length <= 1) return '';
  
  // 최근 대화 요약 (마지막 메시지 제외)
  const recentMessages = messages.slice(0, -1);
  const topics: string[] = [];
  const stocksMentioned: string[] = [];
  
  recentMessages.forEach(m => {
    // 종목명 추출 (한글 주식명 패턴)
    const stockPattern = /([가-힣]+(?:전자|하이닉스|바이오|에너지|금융|지주|SDI|화학|차|카오|NAVER|네이버))/g;
    const matches = m.content.match(stockPattern);
    if (matches) {
      stocksMentioned.push(...matches.filter(s => !stocksMentioned.includes(s)));
    }
  });
  
  if (stocksMentioned.length > 0) {
    topics.push(`언급된 종목: ${stocksMentioned.join(', ')}`);
  }
  
  return topics.length > 0 
    ? `\n[이전 대화 맥락: ${topics.join(' | ')}]\n` 
    : '';
}

async function chatWithClaude(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048, // 더 긴 응답 허용
      system: systemPrompt + contextHint,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

async function chatWithGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash', // flash 모델 사용 (rate limit 더 높음)
      systemInstruction: systemPrompt + contextHint,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Build conversation history
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return mock response on API failure
    throw error;
  }
}

// AI 기반 추천 질문 생성
async function generateSuggestedQuestions(
  characterType: CharacterType,
  messages: ChatMessage[],
  stockData?: StockData
): Promise<string[]> {
  const characterNames: Record<CharacterType, string> = {
    claude: '클로드 리 (ETF 밸류에이션 분석가)',
    gemini: '제미나인 (테마 ETF 전략가)',
    gpt: 'G.P. 테일러 (자산배분 리스크 총괄)',
  };

  const characterFocus: Record<CharacterType, string> = {
    claude: '비용 분석, 추적 오차, 운용 효율성, 밸류에이션',
    gemini: '테마 ETF, 성장 섹터, 트렌드 분석, 신흥 기술',
    gpt: '자산 배분, 리스크 관리, 포트폴리오 전략, 거시경제',
  };

  // 최근 대화 내용 요약
  const recentContext = messages
    .slice(-4)
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content.slice(0, 100)}...`)
    .join('\n');

  const stockContext = stockData 
    ? `\n현재 상담 중인 ETF: ${stockData.name} (${stockData.symbol}), 현재가 ${stockData.currentPrice.toLocaleString()}원` 
    : '';

  const prompt = `당신은 ${characterNames[characterType]}입니다.
아래 대화 맥락을 바탕으로, 사용자가 다음에 물어볼 만한 후속 질문 4개를 생성해주세요.

## 당신의 전문 분야
${characterFocus[characterType]}

## 최근 대화 맥락
${recentContext}
${stockContext}

## 생성 규칙
1. 대화 흐름에 자연스럽게 이어지는 질문
2. 당신의 전문 분야와 관련된 깊이 있는 질문
3. ETF 투자에 실제로 도움이 되는 실용적인 질문
4. 각 질문은 30자 이내로 간결하게
5. 반드시 한국어로 작성

## 출력 형식
JSON 배열로만 응답하세요. 설명 없이 배열만:
["질문1", "질문2", "질문3", "질문4"]`;

  try {
    // 빠른 응답을 위해 GPT-4o-mini 사용
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // JSON 파싱 시도
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.slice(0, 4);
      }
    }
  } catch (error) {
    console.error('Failed to generate suggested questions:', error);
  }

  // 폴백: 캐릭터별 기본 질문
  const fallbackQuestions: Record<CharacterType, string[]> = {
    claude: [
      '이 ETF의 총 보수 비용은 어떤가요?',
      '추적 오차가 큰 편인가요?',
      '비슷한 ETF와 비교해주세요',
      '장기 투자에 적합할까요?',
    ],
    gemini: [
      '관련 테마 ETF 추천해주세요',
      '이 섹터의 성장 전망은?',
      '언제 진입하면 좋을까요?',
      '다른 테마 ETF와 비교하면?',
    ],
    gpt: [
      '포트폴리오 비중을 얼마나?',
      '리스크 관리는 어떻게?',
      '채권 ETF와 함께 보유하면?',
      '환헤지 상품을 써야 할까요?',
    ],
  };

  return fallbackQuestions[characterType];
}

async function chatWithGPT(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  try {
    const contextHint = buildConversationContext(messages);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 더 강력한 모델 사용
      messages: [
        { role: 'system', content: systemPrompt + contextHint },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 2048,
      temperature: 0.7,
      presence_penalty: 0.3, // 반복 방지
      frequency_penalty: 0.3, // 다양성 증가
    });

    return response.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('GPT API error:', error);
    // Fallback to gpt-4o-mini if gpt-4o fails
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });
      return fallbackResponse.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
    } catch (fallbackError) {
      console.error('GPT fallback also failed:', fallbackError);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { characterType, messages, holdings, stockData, isInitialAnalysis, analysisType, turn } = body;

    if (!characterType || !messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Get the system prompt with holdings info and current market context
    let systemPrompt = getSystemPromptWithHoldings(characterType, holdings);
    
    // 실시간 종목 데이터가 있으면 시스템 프롬프트에 추가
    if (stockData) {
      const priceDirection = stockData.change >= 0 ? '▲' : '▼';
      const priceColor = stockData.change >= 0 ? '상승' : '하락';
      
      systemPrompt += `

## 📊 실시간 분석 대상 종목 정보
- **종목명**: ${stockData.name} (${stockData.symbol})
- **현재가**: ${stockData.currentPrice.toLocaleString()}원
- **등락**: ${priceDirection} ${Math.abs(stockData.change).toLocaleString()}원 (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%) - ${priceColor}
${stockData.high ? `- **고가**: ${stockData.high.toLocaleString()}원` : ''}
${stockData.low ? `- **저가**: ${stockData.low.toLocaleString()}원` : ''}
${stockData.volume ? `- **거래량**: ${stockData.volume.toLocaleString()}주` : ''}

⚠️ 이 실시간 데이터를 기반으로 분석해주세요. 현재 시장 상황을 반영한 구체적인 의견을 제시하세요.
`;

      // 턴별 분석 지침 추가
      if (isInitialAnalysis && analysisType) {
        const turnGuidelines = getTurnGuidelines(characterType, stockData.name, analysisType, turn || 1);
        systemPrompt += turnGuidelines;
      }
      // 기존 초기 분석 요청 처리 (하위 호환성)
      else if (isInitialAnalysis) {
        const analysisGuidelines: Record<CharacterType, string> = {
          claude: `
## 🎯 초기 분석 지침 (Claude Lee)
사용자가 ${stockData.name}에 대한 상담을 시작했습니다. 첫 분석으로 다음 내용을 포함해주세요:

1. **현재 투자 의견**: 매수/중립/매도 중 하나를 명확히 제시 (예: "저는 현재 이 종목에 대해 [매수/중립/매도] 의견입니다")
2. **핵심 논거**: 펀더멘털 기반 2-3가지 핵심 이유
3. **밸류에이션 코멘트**: 현재 주가 수준에 대한 평가 (저평가/적정/고평가)
4. **주요 리스크**: 투자 시 유의해야 할 1-2가지 리스크
5. **결론**: 간단한 요약과 다음 질문 유도

톤: 차분하고 전문적으로, 숫자와 데이터 기반으로 말하세요.`,
          gemini: `
## 🎯 초기 분석 지침 (Gemi Nine)
사용자가 ${stockData.name}에 대한 상담을 시작했습니다. 첫 분석으로 다음 내용을 포함해주세요:

1. **현재 투자 의견**: 매수/중립/매도 중 하나를 제시하되, 근거와 함께 (예: "제가 보기엔 이 종목은 현재 [매수/중립/매도] 의견이에요. 그 이유는...")
2. **성장 스토리**: 이 기업의 성장 가능성과 TAM에 대한 의견
3. **기술/트렌드 분석**: 관련 산업 트렌드와 기업의 포지션
4. **밸류에이션 체크**: 현재 주가 수준이 성장성 대비 적정한지 평가
5. **리스크 언급**: 성장주 특성상 변동성이 크고, 기대 미스 시 하락 가능성
6. **투자 조언**: 분할 매수 권장, 포트폴리오 비중 20-30% 이내 유지 제안

톤: 긍정적이지만 균형잡힌 시각으로. "흥미로운 기회이지만, 몇 가지 주의할 점이 있어요" 같은 표현 사용.`,
          gpt: `
## 🎯 초기 분석 지침 (G.P. Taylor)
사용자가 ${stockData.name}에 대한 상담을 시작했습니다. 첫 분석으로 다음 내용을 포함해주세요:

1. **현재 투자 의견**: 매수/중립/매도 중 하나를 노련하게 제시 (예: "내 40년 경험에 비춰보면, 이 종목은 현재 [매수/중립/매도]...")
2. **매크로 관점**: 거시경제 환경이 이 종목에 미치는 영향
3. **리스크 분석**: 시장 리스크, 섹터 리스크, 개별 기업 리스크
4. **포지션 조언**: 적절한 투자 비중이나 분할 매수 전략 제안
5. **결론**: 지혜로운 조언과 추가 질문 유도

톤: 노련하고 차분하게, 경험에서 우러나온 조언. "내가 1987년에 겪은...", "시장은 예측 불가능해" 같은 표현 사용.`
        };
        
        systemPrompt += analysisGuidelines[characterType] || '';
      }
    }
    
    // 인사말 메시지는 제외하고 실제 대화만 전달
    const greeting = AI_PERSONAS[characterType].greeting;
    const conversationMessages = messages.filter(m => {
      // 인사말과 완전히 동일한 메시지만 제외
      if (m.role === 'assistant' && m.content === greeting) {
        return false;
      }
      return true;
    });

    // 대화 기록이 없으면 (첫 질문만 있으면) 그대로 진행
    if (conversationMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid messages to process' },
        { status: 400 }
      );
    }

    let responseContent: string;

    // AI API 호출 시 실패하면 폴백 응답 사용
    const getFallbackResponse = (char: CharacterType, question: string, stock?: StockData, isInitial?: boolean): string => {
      // 초기 분석인 경우 종목 특화 폴백 제공
      if (isInitial && stock) {
        const initialFallbacks: Record<CharacterType, string> = {
          claude: `${stock.name}(${stock.symbol})에 대해 분석해보겠습니다.

📊 **현재 투자 의견: 중립(HOLD)**

현재가 ${stock.currentPrice.toLocaleString()}원 기준으로 펀더멘털 분석을 해보면:

1. **밸류에이션 관점**: 현재 주가 수준은 동종업계 평균 대비 적정 수준으로 보입니다. PER, PBR 지표를 추가로 확인해보시길 권합니다.

2. **재무 안정성**: 재무제표 상 부채비율과 유동비율을 점검해볼 필요가 있습니다. 안정적인 현금흐름이 중요합니다.

3. **주요 리스크**: 업황 변동성과 경쟁 심화가 주요 리스크 요인입니다.

💡 구체적인 투자 결정 전에 최근 분기 실적과 컨센서스 대비 실적을 확인해보시겠어요?`,
          gemini: `${stock.name} 분석해볼게요 👋

솔직히 말해서 ${stock.name}은 흥미로운 종목이에요. 다만, 몇 가지 살펴볼 점이 있어요.

📊 **현재 투자 의견: 관심 종목(WATCH)**

현재가 ${stock.currentPrice.toLocaleString()}원인데요,

1. **성장 스토리**: 해당 섹터의 TAM(Total Addressable Market)은 확대 중이에요. 장기적으로 성장 여력이 있는 분야입니다.

2. **밸류에이션 체크**: 현재 주가 수준이 성장성 대비 적정한지 꼭 확인해보세요. 좋은 기업도 비싸게 사면 좋은 투자가 아니에요.

3. **리스크 인식**: 성장주는 기대치가 높아서 실적 미스 시 큰 폭락이 올 수 있어요. ${stock.change >= 0 ? '지금 상승세지만' : '현재 조정 구간인데'}, 단기 변동성은 항상 감안해야 해요.

4. **투자 조언**: 분할 매수를 추천드리고, 포트폴리오의 20-30% 이내로 성장주 비중을 유지하세요.

더 궁금한 부분이 있으시면 말씀해주세요!`,
          gpt: `${stock.name}에 대해 말해주겠네.

🛡️ **현재 투자 의견: 신중한 접근 권고**

40년간 시장을 봐온 경험에 비춰보면, 현재가 ${stock.currentPrice.toLocaleString()}원 수준에서는 이렇게 생각해.

1. **거시경제 환경**: 현재 금리와 환율 상황이 이 종목에 미치는 영향을 고려해야 해. 특히 섹터 전반의 흐름을 봐야 하지.

2. **리스크 관리**: 어떤 종목이든 포트폴리오의 적정 비중을 지키는 게 중요해. 전체 자산의 5-10% 이내로 관리하길 권해.

3. **분할 매수**: 한 번에 몰빵하지 말고, 3-4회 나눠서 진입하는 게 리스크를 줄이는 방법이야.

시장은 예측 불가능한 일들이 많아. 현금 비중은 항상 일정 부분 유지하고 있나?`,
        };
        return initialFallbacks[char];
      }

      const fallbacks: Record<CharacterType, string> = {
        claude: `좋은 질문입니다. 현재 시장 상황을 냉철하게 분석해보겠습니다.

"${question.slice(0, 50)}..."에 대해 말씀드리자면,

숫자는 거짓말하지 않습니다. 펀더멘털 관점에서 보면, 현재 주가는 적정 가치 대비 다소 변동성이 있는 구간에 있습니다. PER, PBR 등 밸류에이션 지표를 종합적으로 검토해보시길 권합니다.

다만, 투자 판단은 개인의 리스크 성향과 투자 기간에 따라 달라질 수 있으므로, 충분한 분석 후 결정하시기 바랍니다.`,
        gemini: `Hey! 정말 exciting한 질문이네요! 🚀

"${question.slice(0, 50)}..."에 대해서 말이죠,

This is where it gets interesting! 성장주 관점에서 보면, 미래 성장 잠재력이 핵심이에요. TAM(Total Addressable Market)이 계속 확대되고 있는 분야라면 장기적으로 유망하다고 봅니다.

물론 단기 변동성은 있을 수 있지만, 혁신적인 기업들은 결국 시장을 리드하게 되죠. Fight me if you disagree! 😎`,
        gpt: `자네의 질문에 대해 40년 경험을 바탕으로 말해주겠네.

"${question.slice(0, 50)}..."

시장에서는 항상 리스크를 먼저 고려해야 해. 현재 거시경제 환경을 보면, 금리와 환율 동향이 중요한 변수야. 

포트폴리오 관점에서는 분산투자가 핵심이고, 어떤 상황에서도 현금 비중을 일정 부분 유지하는 게 좋아. 시장은 예측 불가능한 것들이 많으니까.`,
      };
      return fallbacks[char];
    };

    try {
      switch (characterType) {
        case 'claude':
          responseContent = await chatWithClaude(systemPrompt, conversationMessages);
          break;
        case 'gemini':
          responseContent = await chatWithGemini(systemPrompt, conversationMessages);
          break;
        case 'gpt':
          responseContent = await chatWithGPT(systemPrompt, conversationMessages);
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Unknown character type' },
            { status: 400 }
          );
      }
    } catch (apiError) {
      console.error(`${characterType} API failed, using fallback response:`, apiError);
      const lastUserMessage = conversationMessages.filter(m => m.role === 'user').pop();
      responseContent = getFallbackResponse(characterType, lastUserMessage?.content || '', stockData, isInitialAnalysis);
    }

    // 추천 질문 생성 (대화 맥락 기반)
    const suggestedQuestions = await generateSuggestedQuestions(
      characterType, 
      conversationMessages, 
      stockData
    );

    return NextResponse.json({
      success: true,
      data: {
        content: responseContent,
        characterType,
        timestamp: new Date().toISOString(),
        suggestedQuestions,
      },
    });
  } catch (error) {
    console.error('Consultation chat error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
