export interface LLMResponse {
  content: string;
  risks: string[];
  sources: string[];
  score: number;
  targetReturn?: number;
  timeHorizon?: string;
  returnRationale?: string;
  horizonRationale?: string;
  methodology?: string;
}

export interface PreviousTarget {
  character: string;
  targetReturn: number;
  timeHorizon: string;
}

export interface LLMContext {
  ticker: string;
  etfName: string;
  category?: string;
  assetClass?: string;
  round: number;
  currentPrice?: number;
  currency?: 'USD' | 'KRW';  // 통화 정보 추가
  previousMessages: Array<{
    character: string;
    content: string;
    targetReturn?: number;
    timeHorizon?: string;
  }>;
  previousTargets?: PreviousTarget[];
  marketData?: {
    price?: number;
    changePercent?: number;
    volume?: number;
    ytdReturn?: number;
  };
  etfMetrics?: {
    expenseRatio?: number;
    dividendYield?: number;
    peRatio?: number;
    aum?: number;
    holdingsCount?: number;
  };
}

export interface LLMAdapter {
  characterType: CharacterType;
  generateStructured(context: LLMContext): Promise<LLMResponse>;
}

export type CharacterType = 'claude' | 'gemini' | 'gpt';

export interface CharacterPersona {
  name: string;
  title: string;
  style: string;
  focus: string[];
  riskBias: 'conservative' | 'balanced' | 'aggressive';
}

export const CHARACTER_PERSONAS: Record<CharacterType, CharacterPersona> = {
  claude: {
    name: 'Claude Lee',
    title: 'ETF 밸류에이션 분석가',
    style: '침착하고 디테일한 분석, 비용 효율성과 추적 오차 중시',
    focus: ['비용 분석', '추적 오차', '포트폴리오 구성', '리스크 대비 수익률'],
    riskBias: 'balanced',
  },
  gemini: {
    name: 'Gemi Nine',
    title: '테마 ETF 전략가',
    style: '빠른 판단과 트렌드 포착, 성장 테마 중시',
    focus: ['테마 투자', '신흥 섹터', '성장 잠재력', '글로벌 트렌드'],
    riskBias: 'aggressive',
  },
  gpt: {
    name: 'G.P. Taylor',
    title: '자산배분 리스크 총괄',
    style: '중후하고 신중한 분석, 분산 투자와 리스크 관리 중시',
    focus: ['자산 배분', '상관관계 분석', '거시경제', '장기 투자 전략'],
    riskBias: 'conservative',
  },
};
