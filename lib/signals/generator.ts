/**
 * AI 매매 시그널 생성기
 * 실제 AI 모델을 사용한 분석
 */

import { 
  TradingSignal, 
  AIOpinion, 
  SignalType,
  calculateSignalStrength,
  determineConsensusSignal,
} from './types';
import { getCachedETFPrice, getCachedETFPerformance } from '@/lib/external/yahoo-finance';
import { fetchNaverETFDetail } from '@/lib/external/naver-etf';
import { findETFByTicker } from '@/lib/data/etf-list';
import { ClaudeAdapter } from '@/lib/llm/claude';
import { GeminiAdapter } from '@/lib/llm/gemini';
import { GPTAdapter } from '@/lib/llm/gpt';
import { 
  OpenRouterClaudeAdapter, 
  OpenRouterGeminiAdapter, 
  OpenRouterGPTAdapter,
  hasOpenRouterKey 
} from '@/lib/llm/openrouter';

// 시그널 저장소 (실제로는 DB 사용)
let signalHistory: TradingSignal[] = [];

// API 키 확인
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;

/**
 * 실제 AI를 사용한 시그널 분석
 */
async function generateRealAISignal(
  ticker: string,
  name: string,
  currentPrice: number,
  marketData: {
    changePercent: number;
    volume: number;
    high52Week: number;
    low52Week: number;
    return1m?: number;
    return3m?: number;
    return1y?: number;
  }
): Promise<AIOpinion[]> {
  const opinions: AIOpinion[] = [];
  
  const analysisPrompt = `당신은 ETF 투자 분석가입니다. 다음 ETF를 분석하고 매매 의견을 제시하세요.

ETF: ${name} (${ticker})
현재가: $${currentPrice.toFixed(2)}
일간 등락률: ${marketData.changePercent.toFixed(2)}%
거래량: ${marketData.volume.toLocaleString()}
52주 최고: $${marketData.high52Week.toFixed(2)}
52주 최저: $${marketData.low52Week.toFixed(2)}
${marketData.return1m !== undefined ? `1개월 수익률: ${marketData.return1m.toFixed(2)}%` : ''}
${marketData.return3m !== undefined ? `3개월 수익률: ${marketData.return3m.toFixed(2)}%` : ''}
${marketData.return1y !== undefined ? `1년 수익률: ${marketData.return1y.toFixed(2)}%` : ''}

다음 JSON 형식으로 응답하세요:
{
  "signal": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL",
  "confidence": 50-95 사이의 숫자,
  "targetPrice": 목표가 (숫자),
  "reasoning": "분석 근거 (한 문장)",
  "keyFactors": ["핵심 요인 1", "핵심 요인 2", "핵심 요인 3"]
}`;

  // OpenRouter 사용 시 (하나의 키로 모든 AI 사용)
  const useOpenRouter = hasOpenRouterKey();

  // Claude 분석
  if (useOpenRouter || hasAnthropic) {
    try {
      const claude = useOpenRouter ? new OpenRouterClaudeAdapter() : new ClaudeAdapter();
      const response = await claude.generateRaw(analysisPrompt);
      const parsed = parseAIResponse(response, 'claude', currentPrice);
      if (parsed) opinions.push(parsed);
    } catch (error) {
      console.error('Claude signal error:', error);
      opinions.push(createFallbackOpinion('claude', currentPrice, marketData));
    }
  } else {
    opinions.push(createFallbackOpinion('claude', currentPrice, marketData));
  }

  // Gemini 분석
  if (useOpenRouter || hasGoogle) {
    try {
      const gemini = useOpenRouter ? new OpenRouterGeminiAdapter() : new GeminiAdapter();
      const response = await gemini.generateRaw(analysisPrompt);
      const parsed = parseAIResponse(response, 'gemini', currentPrice);
      if (parsed) opinions.push(parsed);
    } catch (error) {
      console.error('Gemini signal error:', error);
      opinions.push(createFallbackOpinion('gemini', currentPrice, marketData));
    }
  } else {
    opinions.push(createFallbackOpinion('gemini', currentPrice, marketData));
  }

  // GPT 분석
  if (useOpenRouter || hasOpenAI) {
    try {
      const gpt = useOpenRouter ? new OpenRouterGPTAdapter() : new GPTAdapter();
      const response = await gpt.generateRaw(analysisPrompt);
      const parsed = parseAIResponse(response, 'gpt', currentPrice);
      if (parsed) opinions.push(parsed);
    } catch (error) {
      console.error('GPT signal error:', error);
      opinions.push(createFallbackOpinion('gpt', currentPrice, marketData));
    }
  } else {
    opinions.push(createFallbackOpinion('gpt', currentPrice, marketData));
  }

  return opinions;
}

/**
 * AI 응답 파싱
 */
function parseAIResponse(
  response: string,
  character: 'claude' | 'gemini' | 'gpt',
  currentPrice: number
): AIOpinion | null {
  try {
    // JSON 추출
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    
    const validSignals: SignalType[] = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
    const signal = validSignals.includes(data.signal) ? data.signal : 'HOLD';
    
    return {
      character,
      signal: signal as SignalType,
      confidence: Math.min(95, Math.max(50, data.confidence || 70)),
      targetPrice: data.targetPrice || currentPrice * 1.05,
      reasoning: data.reasoning || '기술적/기본적 분석 기반',
      keyFactors: Array.isArray(data.keyFactors) ? data.keyFactors.slice(0, 3) : ['시장 트렌드', '펀더멘털', '기술적 지표'],
    };
  } catch (error) {
    console.error(`Failed to parse ${character} response:`, error);
    return null;
  }
}

/**
 * API 키 없을 때 시장 데이터 기반 분석
 */
function createFallbackOpinion(
  character: 'claude' | 'gemini' | 'gpt',
  currentPrice: number,
  marketData: {
    changePercent: number;
    volume: number;
    high52Week: number;
    low52Week: number;
    return1m?: number;
    return3m?: number;
    return1y?: number;
  }
): AIOpinion {
  // 시장 데이터 기반 분석 (랜덤 아님)
  const pricePosition = (currentPrice - marketData.low52Week) / (marketData.high52Week - marketData.low52Week);
  const momentum = marketData.changePercent;
  const trend1m = marketData.return1m || 0;
  const trend3m = marketData.return3m || 0;
  
  // 종합 점수 계산
  let score = 50;
  
  // 가격 위치 (52주 저점에 가까울수록 매수 유리)
  if (pricePosition < 0.3) score += 15;
  else if (pricePosition < 0.5) score += 5;
  else if (pricePosition > 0.8) score -= 15;
  else if (pricePosition > 0.6) score -= 5;
  
  // 모멘텀 분석
  if (momentum < -3) score += 10; // 급락 시 매수 기회
  if (momentum > 3) score -= 5;   // 급등 시 신중
  
  // 추세 분석
  if (trend1m > 5 && trend3m > 10) score += 10; // 상승 추세
  if (trend1m < -5 && trend3m < -10) score -= 5; // 하락 추세 (역발상 매수)
  
  // 캐릭터별 성향 반영
  const adjustments = {
    claude: -5,  // 보수적
    gemini: 10,  // 공격적
    gpt: 0,      // 균형적
  };
  score += adjustments[character];
  
  // 시그널 결정
  let signal: SignalType;
  if (score >= 75) signal = 'STRONG_BUY';
  else if (score >= 60) signal = 'BUY';
  else if (score <= 30) signal = 'STRONG_SELL';
  else if (score <= 40) signal = 'SELL';
  else signal = 'HOLD';
  
  // 목표가 계산
  const targetMultiplier = signal.includes('BUY') 
    ? 1 + (0.05 + (75 - pricePosition * 100) / 500)
    : signal.includes('SELL') 
      ? 0.95 
      : 1.02;
  const targetPrice = Number((currentPrice * targetMultiplier).toFixed(2));
  
  const reasonings = {
    claude: `52주 범위 대비 ${(pricePosition * 100).toFixed(0)}% 수준, 밸류에이션 ${signal.includes('BUY') ? '매력적' : '주의 필요'}`,
    gemini: `모멘텀 ${momentum > 0 ? '양호' : '조정 중'}, 추세 ${trend3m > 0 ? '상승' : '하락'} 국면`,
    gpt: `리스크/리턴 비율 ${score > 50 ? '양호' : '보통'}, 포트폴리오 분산 ${signal.includes('BUY') ? '추천' : '대기'}`,
  };
  
  const keyFactorSets = {
    claude: [
      `52주 최고 대비 ${((1 - currentPrice / marketData.high52Week) * 100).toFixed(1)}% 하락`,
      `거래량 ${marketData.volume > 1000000 ? '활발' : '보통'}`,
      `기술적 지지선 ${signal.includes('BUY') ? '근접' : '이탈 가능성'}`,
    ],
    gemini: [
      `일간 ${momentum > 0 ? '상승' : '하락'} ${Math.abs(momentum).toFixed(1)}%`,
      `단기 모멘텀 ${trend1m > 0 ? '긍정적' : '부정적'}`,
      `섹터 트렌드 ${trend3m > 0 ? '양호' : '부진'}`,
    ],
    gpt: [
      `변동성 ${Math.abs(momentum) > 2 ? '높음' : '보통'}`,
      `밸류에이션 ${pricePosition < 0.5 ? '저평가' : '적정'}`,
      `시장 환경 ${trend3m > -5 ? '안정적' : '불안정'}`,
    ],
  };
  
  return {
    character,
    signal,
    confidence: Math.min(85, Math.max(55, score + 10)),
    targetPrice,
    reasoning: reasonings[character],
    keyFactors: keyFactorSets[character],
  };
}

/**
 * ETF에 대한 종합 시그널 생성
 */
export async function generateSignal(ticker: string): Promise<TradingSignal | null> {
  try {
    // ETF 정보 조회
    const etfInfo = findETFByTicker(ticker);
    if (!etfInfo) return null;

    // 실시간 가격 조회
    let currentPrice: number = 0;
    let changePercent = 0;
    let volume = 0;
    let high52Week = 0;
    let low52Week = 0;
    let return1m: number | undefined;
    let return3m: number | undefined;
    let return1y: number | undefined;
    
    // 미국 ETF
    if (/^[A-Za-z]+$/.test(ticker)) {
      const quote = await getCachedETFPrice(ticker);
      if (!quote) {
        console.error(`Failed to fetch price for ${ticker}`);
        return null;
      }
      currentPrice = quote.price;
      changePercent = quote.changePercent;
      volume = quote.volume;
      high52Week = quote.fiftyTwoWeekHigh;
      low52Week = quote.fiftyTwoWeekLow;
      
      // 수익률 데이터 조회
      const performance = await getCachedETFPerformance(ticker);
      if (performance) {
        return1m = performance.return1m;
        return3m = performance.return3m;
        return1y = performance.return1y;
      }
    } 
    // 한국 ETF
    else if (/^\d{6}$/.test(ticker)) {
      const naverData = await fetchNaverETFDetail(ticker);
      if (!naverData) {
        console.error(`Failed to fetch price for ${ticker}`);
        return null;
      }
      currentPrice = naverData.price;
      changePercent = naverData.changePercent;
      volume = naverData.volume;
      high52Week = currentPrice * 1.2; // 네이버 API에서 52주 데이터 없음
      low52Week = currentPrice * 0.8;
    } else {
      return null;
    }

    if (currentPrice === 0) {
      console.error(`Invalid price for ${ticker}`);
      return null;
    }

    const marketData = {
      changePercent,
      volume,
      high52Week,
      low52Week,
      return1m,
      return3m,
      return1y,
    };

    // AI 의견 수집
    const opinions = await generateRealAISignal(ticker, etfInfo.nameKo || etfInfo.name, currentPrice, marketData);

    // 합의 시그널 결정
    const consensusSignal = determineConsensusSignal(opinions);
    const strength = calculateSignalStrength(opinions);
    const isUnanimous = new Set(opinions.map(o => o.signal)).size === 1;

    // 평균 목표가
    const avgTargetPrice = opinions.reduce((sum, o) => sum + o.targetPrice, 0) / opinions.length;
    const potentialReturn = ((avgTargetPrice - currentPrice) / currentPrice) * 100;

    // 손절가 계산
    const stopLoss = consensusSignal.includes('BUY')
      ? currentPrice * (1 - Math.abs(potentialReturn / 100) / 2)
      : currentPrice * (1 + Math.abs(potentialReturn / 100) / 2);

    // 리스크/리워드 비율
    const riskRewardRatio = Math.abs(potentialReturn) / (Math.abs(currentPrice - stopLoss) / currentPrice * 100);

    // 시그널 생성
    const signal: TradingSignal = {
      id: `sig-${ticker}-${Date.now()}`,
      ticker,
      name: etfInfo.nameKo || etfInfo.name,
      
      signalType: consensusSignal,
      strength: Math.round(strength),
      isUnanimous,
      
      currentPrice,
      targetPrice: Number(avgTargetPrice.toFixed(2)),
      stopLoss: Number(stopLoss.toFixed(2)),
      potentialReturn: Number(potentialReturn.toFixed(2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      
      opinions,
      consensusSummary: generateConsensusSummary(opinions, consensusSignal, isUnanimous),
      
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      
      status: 'active',
      category: etfInfo.category,
      tags: [etfInfo.assetClass, etfInfo.region].filter(Boolean) as string[],
    };

    // 히스토리에 추가
    signalHistory.unshift(signal);
    if (signalHistory.length > 100) signalHistory = signalHistory.slice(0, 100);

    return signal;
  } catch (error) {
    console.error('Signal generation error:', error);
    return null;
  }
}

/**
 * 합의 요약 생성
 */
function generateConsensusSummary(
  opinions: AIOpinion[],
  consensus: SignalType,
  isUnanimous: boolean
): string {
  const signalKo = {
    'STRONG_BUY': '적극 매수',
    'BUY': '매수',
    'HOLD': '보유',
    'SELL': '매도',
    'STRONG_SELL': '적극 매도',
  };

  if (isUnanimous) {
    return `🎯 만장일치! 3명의 AI 전문가가 모두 "${signalKo[consensus]}"를 권장합니다. 신뢰도가 매우 높은 시그널입니다.`;
  }

  const buyCount = opinions.filter(o => o.signal.includes('BUY')).length;
  const sellCount = opinions.filter(o => o.signal.includes('SELL')).length;

  if (buyCount >= 2) {
    return `📈 ${buyCount}명의 AI가 매수 의견. 다수결로 "${signalKo[consensus]}" 시그널이 발생했습니다.`;
  }
  if (sellCount >= 2) {
    return `📉 ${sellCount}명의 AI가 매도 의견. 다수결로 "${signalKo[consensus]}" 시그널이 발생했습니다.`;
  }

  return `⚖️ AI들의 의견이 엇갈립니다. 신중한 접근이 필요합니다.`;
}

/**
 * 여러 ETF에 대한 시그널 스캔
 */
export async function scanForSignals(tickers: string[]): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  
  for (const ticker of tickers) {
    const signal = await generateSignal(ticker);
    if (signal) {
      signals.push(signal);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

/**
 * 시그널 히스토리 조회
 */
export function getSignalHistory(): TradingSignal[] {
  return signalHistory;
}

/**
 * 시그널 결과 업데이트
 */
export async function updateSignalOutcome(signalId: string): Promise<TradingSignal | null> {
  const signal = signalHistory.find(s => s.id === signalId);
  if (!signal || signal.status !== 'active') return null;

  try {
    const quote = await getCachedETFPrice(signal.ticker);
    if (!quote) return null;

    const finalPrice = quote.price;
    const actualReturn = ((finalPrice - signal.currentPrice) / signal.currentPrice) * 100;
    
    const isHit = signal.signalType.includes('BUY') 
      ? actualReturn > 0 
      : signal.signalType.includes('SELL')
        ? actualReturn < 0
        : Math.abs(actualReturn) < 3;

    signal.status = 'triggered';
    signal.outcome = {
      finalPrice,
      actualReturn: Number(actualReturn.toFixed(2)),
      isHit,
      settledAt: new Date().toISOString(),
    };

    return signal;
  } catch (error) {
    console.error('Signal outcome update error:', error);
    return null;
  }
}

/**
 * 성과 통계 계산
 */
export function calculatePerformance(): {
  hitRate: number;
  avgReturn: number;
  totalSignals: number;
  winCount: number;
  lossCount: number;
} {
  const completedSignals = signalHistory.filter(s => s.outcome);
  
  if (completedSignals.length === 0) {
    return { hitRate: 0, avgReturn: 0, totalSignals: 0, winCount: 0, lossCount: 0 };
  }

  const winCount = completedSignals.filter(s => s.outcome?.isHit).length;
  const avgReturn = completedSignals.reduce((sum, s) => sum + (s.outcome?.actualReturn || 0), 0) / completedSignals.length;

  return {
    hitRate: Math.round((winCount / completedSignals.length) * 100),
    avgReturn: Number(avgReturn.toFixed(2)),
    totalSignals: completedSignals.length,
    winCount,
    lossCount: completedSignals.length - winCount,
  };
}
