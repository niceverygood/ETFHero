export type CharacterRole = 'CLAUDE' | 'GEMINI' | 'GPT' | 'SYSTEM';

// Re-export CharacterType from llm/types for convenience
export type { CharacterType } from './llm/types';

export interface DebateMessage {
  id: string;
  role: CharacterRole;
  content: string;
  sources: string[];
  score?: number;
  risks?: string;
  createdAt: Date;
}

export interface ETFInfo {
  id: string;
  ticker: string;
  name: string;
  nameKo?: string;
  issuer?: string;
  category?: string;
  assetClass: string;
  region: string;
  expenseRatio?: number;
  aum?: number;
  description?: string;
  dividendYield?: number;
  peRatio?: number;
}

export interface Top5Item {
  rank: number;
  etfId: string;
  ticker: string;
  name: string;
  nameKo?: string;
  category?: string;
  avgScore: number;
  rationale: string;
  targetReturn?: number;
  timeHorizon?: string;
}

export interface VerdictData {
  id: string;
  date: string;
  top5: Top5Item[];
  rationale?: string;
  marketTheme?: string;
  createdAt: Date;
}

export interface PredictionWithOutcome {
  id: string;
  date: string;
  etf: ETFInfo;
  timeHorizon: string;
  predictedDirection: 'up' | 'down' | 'neutral';
  confidence: number;
  outcome?: {
    realizedReturn: number;
    isHit: boolean;
  };
}

export interface ArchiveMetrics {
  totalPredictions: number;
  hits: number;
  hitRate: number;
  avgConfidence: number;
  byDirection: {
    up: { total: number; hits: number };
    down: { total: number; hits: number };
    neutral: { total: number; hits: number };
  };
  byCategory?: Record<string, { total: number; hits: number }>;
}

export interface LLMResponse {
  content: string;
  risks: string;
  sources: string[];
  score: number;
}

export interface LLMAdapter {
  generateStructured(prompt: string, context: Record<string, unknown>): Promise<LLMResponse>;
}

// ETF-specific types
export interface ETFCategory {
  id: string;
  name: string;
  nameKo?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface ETFTheme {
  id: string;
  name: string;
  nameKo?: string;
  description?: string;
  relatedETFs?: string[];
  isTrending: boolean;
}

export interface ETFHolding {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
}

export interface ETFAnalysis {
  etfId: string;
  ticker: string;
  name: string;
  claudeAnalysis?: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  geminiAnalysis?: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  gptAnalysis?: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  consensusScore: number;
  consensusSummary: string;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

export interface PortfolioAllocation {
  etfTicker: string;
  etfName: string;
  weight: number;
  rationale: string;
}

export interface PortfolioRecommendation {
  name: string;
  description: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  expectedReturn: string;
  allocations: PortfolioAllocation[];
  totalExpenseRatio: number;
}
