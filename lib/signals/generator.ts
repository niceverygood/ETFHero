/**
 * AI 매매 시그널 생성기
 */

import { 
  TradingSignal, 
  AIOpinion, 
  SignalType,
  calculateSignalStrength,
  determineConsensusSignal,
} from './types';
import { getCachedETFPrice } from '@/lib/external/yahoo-finance';
import { findETFByTicker } from '@/lib/data/etf-list';

// 시그널 저장소 (실제로는 DB 사용)
let signalHistory: TradingSignal[] = [];

/**
 * AI 의견 생성 (실제로는 LLM API 호출)
 */
async function generateAIOpinion(
  character: 'claude' | 'gemini' | 'gpt',
  ticker: string,
  currentPrice: number,
  marketData: any
): Promise<AIOpinion> {
  // 각 AI의 성향에 따른 분석
  const personalities = {
    claude: {
      style: 'conservative',
      focusAreas: ['밸류에이션', '비용구조', '재무건전성'],
      riskTolerance: 0.7,
    },
    gemini: {
      style: 'growth',
      focusAreas: ['성장성', '테마', '모멘텀'],
      riskTolerance: 1.2,
    },
    gpt: {
      style: 'balanced',
      focusAreas: ['리스크/리턴', '자산배분', '거시경제'],
      riskTolerance: 1.0,
    },
  };

  const personality = personalities[character];
  
  // 시뮬레이션된 분석 결과 (실제로는 LLM 호출)
  const priceChange = marketData.changePercent || 0;
  const volatility = Math.abs(priceChange) * 2;
  
  // 기술적 분석 시뮬레이션
  const technicalScore = Math.random() * 100;
  const fundamentalScore = Math.random() * 100;
  
  // 각 AI 성향에 따른 시그널 결정
  let signalScore = (technicalScore + fundamentalScore) / 2;
  signalScore *= personality.riskTolerance;
  
  // 최근 하락 시 매수 기회로 해석
  if (priceChange < -2) signalScore += 15;
  if (priceChange < -5) signalScore += 10;
  
  // 최근 급등 시 신중
  if (priceChange > 3) signalScore -= 10;
  if (priceChange > 5) signalScore -= 15;

  let signal: SignalType;
  if (signalScore >= 80) signal = 'STRONG_BUY';
  else if (signalScore >= 60) signal = 'BUY';
  else if (signalScore <= 20) signal = 'STRONG_SELL';
  else if (signalScore <= 40) signal = 'SELL';
  else signal = 'HOLD';

  // 목표가 계산
  const targetMultiplier = signal.includes('BUY') ? 1.1 : signal.includes('SELL') ? 0.95 : 1.02;
  const targetPrice = Number((currentPrice * targetMultiplier).toFixed(2));

  // 신뢰도
  const confidence = Math.min(95, Math.max(50, signalScore + Math.random() * 20));

  // 근거 생성
  const reasons = {
    claude: [
      `PER ${(15 + Math.random() * 10).toFixed(1)}배로 ${signalScore > 50 ? '저평가' : '고평가'} 상태`,
      `운용보수 ${(0.03 + Math.random() * 0.1).toFixed(2)}%로 ${signalScore > 50 ? '합리적' : '다소 높음'}`,
      `추적오차 ${(0.1 + Math.random() * 0.3).toFixed(2)}%로 안정적`,
    ],
    gemini: [
      `${signalScore > 50 ? '상승' : '하락'} 모멘텀 포착`,
      `테마 관심도 ${signalScore > 50 ? '급상승' : '하락'} 중`,
      `글로벌 자금 ${signalScore > 50 ? '유입' : '유출'} 추세`,
    ],
    gpt: [
      `리스크/리턴 비율 ${(signalScore / 30).toFixed(1)}로 ${signalScore > 50 ? '양호' : '주의'}`,
      `포트폴리오 분산 효과 ${signalScore > 50 ? '우수' : '보통'}`,
      `거시경제 환경 ${signalScore > 50 ? '우호적' : '불확실'}`,
    ],
  };

  return {
    character,
    signal,
    confidence: Math.round(confidence),
    targetPrice,
    reasoning: `${personality.focusAreas.join(', ')} 기반 분석 결과, ${signal.includes('BUY') ? '매수' : signal.includes('SELL') ? '매도' : '관망'} 권장`,
    keyFactors: reasons[character],
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

    // 실시간 가격 조회 (실패시 mock 가격 사용)
    let currentPrice: number;
    let changePercent = 0;
    let quote = null;
    
    try {
      quote = await getCachedETFPrice(ticker);
      if (quote) {
        currentPrice = quote.price;
        changePercent = quote.changePercent || 0;
      } else {
        // Mock 가격 사용
        currentPrice = etfInfo.price || (100 + Math.random() * 400);
        changePercent = (Math.random() - 0.5) * 6;
      }
    } catch {
      currentPrice = etfInfo.price || (100 + Math.random() * 400);
      changePercent = (Math.random() - 0.5) * 6;
    }
    const marketData = {
      changePercent: changePercent,
      volume: quote?.volume || 1000000,
      high52Week: quote?.fiftyTwoWeekHigh || currentPrice * 1.2,
      low52Week: quote?.fiftyTwoWeekLow || currentPrice * 0.8,
    };

    // 3개 AI의 의견 수집
    const opinions = await Promise.all([
      generateAIOpinion('claude', ticker, currentPrice, marketData),
      generateAIOpinion('gemini', ticker, currentPrice, marketData),
      generateAIOpinion('gpt', ticker, currentPrice, marketData),
    ]);

    // 합의 시그널 결정
    const consensusSignal = determineConsensusSignal(opinions);
    const strength = calculateSignalStrength(opinions);
    const isUnanimous = new Set(opinions.map(o => o.signal)).size === 1;

    // 평균 목표가
    const avgTargetPrice = opinions.reduce((sum, o) => sum + o.targetPrice, 0) / opinions.length;
    const potentialReturn = ((avgTargetPrice - currentPrice) / currentPrice) * 100;

    // 손절가 계산 (목표가의 반대 방향으로 절반)
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
      
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
    if (signal) { // 모든 시그널 포함 (UI에서 필터링)
      signals.push(signal);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
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
 * 시그널 결과 업데이트 (적중 여부 확인)
 */
export async function updateSignalOutcome(signalId: string): Promise<TradingSignal | null> {
  const signal = signalHistory.find(s => s.id === signalId);
  if (!signal || signal.status !== 'active') return null;

  try {
    const quote = await getCachedETFPrice(signal.ticker);
    if (!quote) return null;

    const finalPrice = quote.price;
    const actualReturn = ((finalPrice - signal.currentPrice) / signal.currentPrice) * 100;
    
    // 적중 여부 판단
    const isHit = signal.signalType.includes('BUY') 
      ? actualReturn > 0 
      : signal.signalType.includes('SELL')
        ? actualReturn < 0
        : Math.abs(actualReturn) < 3; // HOLD는 ±3% 내 유지 시 적중

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

