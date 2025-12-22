/**
 * OpenRouter API 통합
 * 하나의 API 키로 Claude, GPT, Gemini 등 다양한 AI 모델 사용
 * 
 * https://openrouter.ai/
 */

import type { LLMAdapter, LLMContext, LLMResponse, CharacterType } from './types';
import { CHARACTER_BACKSTORIES } from './character-worldview';
import { ANALYSIS_METHODOLOGIES, calculateTargetDate } from './analysis-framework';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// 캐릭터별 모델 매핑 (2025년 12월 최신 모델)
const CHARACTER_MODELS: Record<CharacterType, string> = {
  claude: 'anthropic/claude-opus-4.5', // Claude Opus 4.5 (최신 플래그십)
  gemini: 'google/gemini-3-flash-preview', // Gemini 3 Flash (최신!)
  gpt: 'openai/gpt-5.2', // GPT-5.2 (최신)
};

// 대체 모델 (비용 절감용)
const FALLBACK_MODELS: Record<CharacterType, string> = {
  claude: 'anthropic/claude-sonnet-4.5', // Claude Sonnet 4.5
  gemini: 'google/gemini-2.5-pro', // Gemini 2.5 Pro
  gpt: 'openai/gpt-5.1', // GPT-5.1
};

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter API 호출
 */
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1500
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://etfhero.vercel.app',
      'X-Title': 'ETFHero',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`OpenRouter API error (${model}):`, error);
    throw new Error(`OpenRouter API failed: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * 단순 프롬프트 호출 (시그널 분석용)
 */
async function callOpenRouterSimple(
  model: string,
  prompt: string,
  maxTokens: number = 1000
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://etfhero.vercel.app',
      'X-Title': 'ETFHero',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`OpenRouter API error (${model}):`, error);
    throw new Error(`OpenRouter API failed: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * 대사에서 목표가 파싱
 */
function parseTargetPriceFromContent(content: string): number | null {
  const patterns = [
    /목표가?\s*[:：]?\s*\$?([\d,]+(?:\.\d+)?)\s*(?:원|달러|불)?/i,
    /target\s*(?:price)?\s*[:：]?\s*\$?([\d,]+(?:\.\d+)?)/i,
    /\$?([\d,]+(?:\.\d+)?)\s*(?:원|달러)?\s*(?:을|를)?\s*목표/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }
  return null;
}

/**
 * 시스템 프롬프트 생성
 */
function getSystemPrompt(character: CharacterType): string {
  const backstory = CHARACTER_BACKSTORIES[character];
  const methodology = ANALYSIS_METHODOLOGIES[character];
  
  return `당신은 "${backstory.name} (${backstory.nameKo})"입니다.

## 🎭 당신의 정체성
- **별명**: ${backstory.nickname}
- **나이**: ${backstory.age}세
- **직함**: ${backstory.title}
- **핵심 성격**: ${backstory.personality.core}

## 🗣️ 말투 (반드시 따라야 함)
${backstory.speech.signature.map(s => `- "${s}"`).join('\n')}

## 📊 분석 방법론: ${methodology.name}
${methodology.description}

### 핵심 지표
${methodology.primaryMetrics.map(m => `- ${m}`).join('\n')}

### 목표가 산출
${methodology.targetPriceFormula}

## ⚠️ 중요
- AI가 아닌 실제 월가 애널리스트처럼 행동
- 당신의 성격과 말투를 일관되게 유지
- 목표가와 목표일은 논리적으로 도출

## 📊 응답 형식 (반드시 JSON으로)
{
  "content": "분석 내용 (2-3문단, 캐릭터 말투 반영)",
  "score": 1-5 점수,
  "risks": ["리스크1", "리스크2"],
  "sources": ["참고 자료"],
  "targetPrice": 목표가 숫자,
  "targetDate": "목표 달성 시점",
  "priceRationale": "목표가 산출 근거"
}

⚠️ 통화 중요: 종목이 미국 ETF면 반드시 달러($)로 표기하세요!`;
}

/**
 * 통화 포맷 헬퍼
 */
function formatCurrency(price: number, currency: 'USD' | 'KRW' = 'KRW'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString()}`;
  }
  return `${price.toLocaleString()}원`;
}

/**
 * 사용자 프롬프트 생성
 */
function buildUserPrompt(context: LLMContext, character: CharacterType): string {
  const currentPrice = context.currentPrice || 100;
  const currency = context.currency || 'KRW';
  const currencyUnit = currency === 'USD' ? '달러($)' : '원';
  const now = new Date();
  const dateCalc = calculateTargetDate(character, now);
  
  let previousContext = '';
  if (context.previousMessages && context.previousMessages.length > 0) {
    previousContext = `\n## 📝 이전 토론\n${context.previousMessages.map(m => {
      const name = CHARACTER_BACKSTORIES[m.character as CharacterType]?.nameKo || m.character;
      const price = m.targetReturn ? ` (목표가: ${formatCurrency(m.targetReturn, currency)})` : '';
      return `**${name}**${price}:\n"${m.content}"`;
    }).join('\n\n')}\n\n위 의견들에 반응하세요.`;
  }

  return `종목: ${context.ticker} (${context.etfName})
현재가: ${formatCurrency(currentPrice, currency)}
통화: ${currencyUnit}
라운드: ${context.round}/4
오늘 날짜: ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일
예상 목표 달성 시점: ${dateCalc.targetDate}
${previousContext}

당신의 분석을 제시하세요. 
⚠️ 목표가는 반드시 ${currency === 'USD' ? '달러($)로 표기 (예: $750)' : '원으로 표기 (예: 45,000원)'}하세요.
반드시 JSON으로만 응답하세요.`;
}

/**
 * OpenRouter 기반 Claude 어댑터
 */
export class OpenRouterClaudeAdapter implements LLMAdapter {
  characterType = 'claude' as const;

  async generateRaw(prompt: string): Promise<string> {
    return callOpenRouterSimple(CHARACTER_MODELS.claude, prompt);
  }

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt('claude');
    const userPrompt = buildUserPrompt(context, 'claude');

    try {
      const text = await callOpenRouter(CHARACTER_MODELS.claude, systemPrompt, userPrompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      const contentTargetPrice = parseTargetPriceFromContent(parsed.content || '');
      let targetPrice = contentTargetPrice || parsed.targetPrice;
      const currentPrice = context.currentPrice || 100;

      // 목표가 검증
      if (targetPrice && targetPrice < currentPrice * 0.5) {
        targetPrice = Math.round(currentPrice * 1.15 / 10) * 10;
      }

      return {
        content: parsed.content || '분석을 완료할 수 없습니다.',
        score: Math.min(5, Math.max(1, parsed.score || 3)),
        risks: parsed.risks || [],
        sources: parsed.sources || [],
        targetPrice: targetPrice || Math.round(currentPrice * 1.1),
        targetDate: parsed.targetDate,
        priceRationale: parsed.priceRationale,
      };
    } catch (error) {
      console.error('OpenRouter Claude error:', error);
      throw error;
    }
  }
}

/**
 * OpenRouter 기반 Gemini 어댑터
 */
export class OpenRouterGeminiAdapter implements LLMAdapter {
  characterType = 'gemini' as const;

  async generateRaw(prompt: string): Promise<string> {
    return callOpenRouterSimple(CHARACTER_MODELS.gemini, prompt);
  }

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt('gemini');
    const userPrompt = buildUserPrompt(context, 'gemini');

    try {
      const text = await callOpenRouter(CHARACTER_MODELS.gemini, systemPrompt, userPrompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      const contentTargetPrice = parseTargetPriceFromContent(parsed.content || '');
      let targetPrice = contentTargetPrice || parsed.targetPrice;
      const currentPrice = context.currentPrice || 100;

      if (targetPrice && targetPrice < currentPrice * 0.5) {
        targetPrice = Math.round(currentPrice * 1.30 / 10) * 10;
      }

      return {
        content: parsed.content || '분석을 완료할 수 없습니다.',
        score: Math.min(5, Math.max(1, parsed.score || 4)),
        risks: parsed.risks || [],
        sources: parsed.sources || [],
        targetPrice: targetPrice || Math.round(currentPrice * 1.25),
        targetDate: parsed.targetDate,
        priceRationale: parsed.priceRationale,
      };
    } catch (error) {
      console.error('OpenRouter Gemini error:', error);
      throw error;
    }
  }
}

/**
 * OpenRouter 기반 GPT 어댑터
 */
export class OpenRouterGPTAdapter implements LLMAdapter {
  characterType = 'gpt' as const;

  async generateRaw(prompt: string): Promise<string> {
    return callOpenRouterSimple(CHARACTER_MODELS.gpt, prompt);
  }

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt('gpt');
    const userPrompt = buildUserPrompt(context, 'gpt');

    try {
      const text = await callOpenRouter(CHARACTER_MODELS.gpt, systemPrompt, userPrompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      const contentTargetPrice = parseTargetPriceFromContent(parsed.content || '');
      let targetPrice = contentTargetPrice || parsed.targetPrice;
      const currentPrice = context.currentPrice || 100;

      if (targetPrice && targetPrice < currentPrice * 0.5) {
        targetPrice = Math.round(currentPrice * 1.08 / 10) * 10;
      }

      return {
        content: parsed.content || '분석을 완료할 수 없습니다.',
        score: Math.min(5, Math.max(1, parsed.score || 3)),
        risks: parsed.risks || [],
        sources: parsed.sources || [],
        targetPrice: targetPrice || Math.round(currentPrice * 1.05),
        targetDate: parsed.targetDate,
        priceRationale: parsed.priceRationale,
      };
    } catch (error) {
      console.error('OpenRouter GPT error:', error);
      throw error;
    }
  }
}

/**
 * OpenRouter API 키 존재 여부 확인
 */
export function hasOpenRouterKey(): boolean {
  return !!OPENROUTER_API_KEY;
}

/**
 * 사용 가능한 모델 목록 조회
 */
export async function getAvailableModels(): Promise<string[]> {
  if (!OPENROUTER_API_KEY) return [];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data?.map((m: { id: string }) => m.id) || [];
  } catch {
    return [];
  }
}

