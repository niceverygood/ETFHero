/**
 * AI 매매 시그널 타입 정의
 */

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
export type SignalStatus = 'active' | 'triggered' | 'expired' | 'cancelled';

export interface AIOpinion {
  character: 'claude' | 'gemini' | 'gpt';
  signal: SignalType;
  confidence: number; // 0-100
  targetPrice: number;
  reasoning: string;
  keyFactors: string[];
}

export interface TradingSignal {
  id: string;
  ticker: string;
  name: string;
  
  // 시그널 정보
  signalType: SignalType;
  strength: number; // 0-100 (AI 합의 강도)
  isUnanimous: boolean; // 만장일치 여부
  
  // 가격 정보
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  potentialReturn: number; // %
  riskRewardRatio: number;
  
  // AI 의견
  opinions: AIOpinion[];
  consensusSummary: string;
  
  // 시간 정보
  createdAt: string;
  expiresAt: string;
  triggeredAt?: string;
  
  // 상태 및 결과
  status: SignalStatus;
  outcome?: {
    finalPrice: number;
    actualReturn: number;
    isHit: boolean;
    settledAt: string;
  };
  
  // 메타
  category: string;
  tags: string[];
}

export interface SignalPerformance {
  totalSignals: number;
  activeSignals: number;
  completedSignals: number;
  
  // 적중률
  hitRate: number;
  avgReturn: number;
  winCount: number;
  lossCount: number;
  
  // 시그널 타입별 성과
  byType: {
    [key in SignalType]?: {
      count: number;
      hitRate: number;
      avgReturn: number;
    };
  };
  
  // 기간별 성과
  last7Days: { hitRate: number; avgReturn: number; count: number };
  last30Days: { hitRate: number; avgReturn: number; count: number };
  allTime: { hitRate: number; avgReturn: number; count: number };
}

export interface UserSignalPreferences {
  userId: string;
  enabledSignalTypes: SignalType[];
  minStrength: number; // 최소 시그널 강도
  unanimousOnly: boolean; // 만장일치만
  categories: string[]; // 관심 카테고리
  
  // 알림 설정
  notifications: {
    email: boolean;
    push: boolean;
    telegram?: string;
  };
}

// 시그널 강도 계산
export function calculateSignalStrength(opinions: AIOpinion[]): number {
  if (opinions.length === 0) return 0;
  
  const avgConfidence = opinions.reduce((sum, o) => sum + o.confidence, 0) / opinions.length;
  
  // 의견 일치도 보너스
  const signals = opinions.map(o => o.signal);
  const uniqueSignals = new Set(signals);
  const agreementBonus = uniqueSignals.size === 1 ? 20 : 
                         uniqueSignals.size === 2 ? 10 : 0;
  
  return Math.min(100, avgConfidence + agreementBonus);
}

// 합의 시그널 결정
export function determineConsensusSignal(opinions: AIOpinion[]): SignalType {
  const signalScores: Record<SignalType, number> = {
    'STRONG_BUY': 0,
    'BUY': 0,
    'HOLD': 0,
    'SELL': 0,
    'STRONG_SELL': 0,
  };
  
  const weights: Record<SignalType, number> = {
    'STRONG_BUY': 2,
    'BUY': 1,
    'HOLD': 0,
    'SELL': -1,
    'STRONG_SELL': -2,
  };
  
  for (const opinion of opinions) {
    signalScores[opinion.signal] += opinion.confidence;
  }
  
  // 가중 평균 계산
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const opinion of opinions) {
    weightedSum += weights[opinion.signal] * opinion.confidence;
    totalWeight += opinion.confidence;
  }
  
  const avgScore = weightedSum / totalWeight;
  
  if (avgScore >= 1.5) return 'STRONG_BUY';
  if (avgScore >= 0.5) return 'BUY';
  if (avgScore <= -1.5) return 'STRONG_SELL';
  if (avgScore <= -0.5) return 'SELL';
  return 'HOLD';
}

// 시그널 라벨
export const SIGNAL_LABELS: Record<SignalType, { label: string; labelKo: string; color: string; emoji: string }> = {
  'STRONG_BUY': { label: 'Strong Buy', labelKo: '적극 매수', color: 'text-emerald-400', emoji: '🚀' },
  'BUY': { label: 'Buy', labelKo: '매수', color: 'text-green-400', emoji: '📈' },
  'HOLD': { label: 'Hold', labelKo: '보유', color: 'text-yellow-400', emoji: '⏸️' },
  'SELL': { label: 'Sell', labelKo: '매도', color: 'text-orange-400', emoji: '📉' },
  'STRONG_SELL': { label: 'Strong Sell', labelKo: '적극 매도', color: 'text-red-400', emoji: '🔻' },
};

