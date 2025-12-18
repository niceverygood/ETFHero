import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CharacterType } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// 한국 ETF 목록과 현재가
const AVAILABLE_ETFS = [
  { code: '069500', name: 'KODEX 200', sector: '시장지수', price: 35000 },
  { code: '102110', name: 'TIGER 200', sector: '시장지수', price: 37500 },
  { code: '360750', name: 'TIGER 미국S&P500', sector: '해외지수', price: 18500 },
  { code: '133690', name: 'TIGER 미국나스닥100', sector: '해외지수', price: 96000 },
  { code: '091160', name: 'KODEX 반도체', sector: '테마/섹터', price: 42000 },
  { code: '305720', name: 'KODEX 2차전지산업', sector: '테마/섹터', price: 15800 },
  { code: '379800', name: 'KODEX 미국S&P500TR', sector: '해외지수', price: 15200 },
  { code: '161510', name: 'ARIRANG 고배당주', sector: '배당/가치', price: 14500 },
  { code: '148070', name: 'KOSEF 국고채10년', sector: '채권', price: 102000 },
  { code: '364980', name: 'TIGER AI반도체핵심공정', sector: '테마/섹터', price: 15300 },
  { code: '371460', name: 'TIGER 차이나전기차SOLACTIVE', sector: '해외테마', price: 8200 },
  { code: '143850', name: 'TIGER 200IT', sector: '테마/섹터', price: 25800 },
  { code: '266160', name: 'KODEX 배당가치', sector: '배당/가치', price: 12800 },
  { code: '329200', name: 'TIGER CD금리투자KIS', sector: '채권', price: 52500 },
  { code: '381170', name: 'TIGER 미국테크TOP10', sector: '해외테마', price: 16200 },
  { code: '453810', name: 'TIGER 미국AI빅테크10', sector: '해외테마', price: 12800 },
  { code: '411060', name: 'ACE 미국빅테크TOP7 Plus', sector: '해외테마', price: 18500 },
  { code: '395170', name: 'KBSTAR 미국S&P500', sector: '해외지수', price: 14200 },
  { code: '292150', name: 'TIGER TOP10', sector: '시장지수', price: 13200 },
  { code: '157450', name: 'TIGER 모멘텀', sector: '전략/스마트베타', price: 32500 },
];

interface PortfolioItem {
  code: string;
  name: string;
  sector: string;
  weight: number;
  amount: number;
  shares: number;
  price: number;
  rationale: string;
  weightReason: string;
  riskFactors: string;
  targetReturn: string;
}

interface AIPortfolio {
  character: CharacterType;
  characterName: string;
  cashWeight: number;
  cashAmount: number;
  cashReason: string;
  holdings: PortfolioItem[];
  totalInvested: number;
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
  strategy: string;
  strategyDetail: string;
}

const PORTFOLIO_PROMPT = (amount: number) => `당신은 전문 ETF 포트폴리오 매니저입니다. 
투자금 ${amount.toLocaleString()}원으로 한국 상장 ETF 포트폴리오를 구성해주세요.

사용 가능한 ETF 목록 (ETF명, 카테고리, 현재가):
${AVAILABLE_ETFS.map(s => `- ${s.name} (${s.sector}): ${s.price.toLocaleString()}원`).join('\n')}

다음 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력:
{
  "strategy": "전체 투자 전략과 시장 전망을 포함한 설명 (3-4문장으로 상세하게)",
  "strategyDetail": "ETF 포트폴리오 구성의 핵심 원칙과 자산배분 전략 (2-3문장)",
  "riskLevel": "conservative" 또는 "balanced" 또는 "aggressive",
  "cashWeight": 현금 비중 (0-30 사이 숫자),
  "cashReason": "현금 비중을 이렇게 설정한 이유 (1-2문장)",
  "holdings": [
    {
      "name": "ETF명",
      "weight": 비중 (숫자),
      "rationale": "이 ETF를 선정한 이유 - 추종지수, 수수료, 분산효과 등 구체적으로 (2-3문장)",
      "weightReason": "이 비중으로 설정한 이유 - 리스크, 기대수익률, 포트폴리오 내 역할 등 (1-2문장)",
      "riskFactors": "주요 리스크 요인 (1문장)",
      "targetReturn": "기대 수익률 (예: +15~20%)"
    }
  ]
}

주의사항:
1. 반드시 위 목록에 있는 ETF만 선택하세요
2. ETF는 4-6개 선택하세요
3. 비중 합계 + 현금비중 = 100이 되어야 합니다
4. 각 ETF의 선정 이유와 비중 결정 이유를 구체적이고 전문적으로 작성하세요
5. 실제 자산배분 전문가처럼 분산효과, 상관관계, 비용효율성을 분석해주세요`;

const CLAUDE_SYSTEM = `당신은 클로드 리(Claude Lee), 월가에서 15년간 활동한 베테랑 ETF 밸류에이션 애널리스트입니다.
- 시장지수 ETF와 배당/가치 ETF를 기반으로 안정적인 포트폴리오를 구성합니다
- 운용보수, 추적오차, 거래량을 중시합니다
- 균형 잡힌 포트폴리오를 선호합니다 (balanced)
- 현금 비중은 10-15% 정도 유지합니다
- 대형 인덱스 ETF 중심으로 장기 투자를 추구합니다`;

const GEMINI_SYSTEM = `당신은 제미나인(Gemi Nine), 실리콘밸리 출신의 테마 ETF 전문가입니다.
- 테마/섹터 ETF와 해외 성장 ETF에 집중 투자합니다
- AI, 반도체, 2차전지, 전기차 등 미래 산업 ETF에 관심이 많습니다
- 공격적인 포트폴리오를 선호합니다 (aggressive)
- 현금 비중은 5-10% 정도로 낮게 유지합니다
- 높은 성장 잠재력을 가진 테마 ETF를 과감하게 담습니다`;

const GPT_SYSTEM = `당신은 G.P. 테일러(G.P. Taylor), 40년 경력의 베테랑 자산배분 전략가입니다.
- 채권 ETF와 배당 ETF를 통한 리스크 관리를 최우선으로 생각합니다
- 보수적인 포트폴리오를 선호합니다 (conservative)
- 현금 비중은 20-30% 정도로 높게 유지합니다
- 고배당 ETF와 채권 ETF를 선호합니다
- 자산 간 상관관계를 고려한 분산투자를 중시합니다`;

async function generateClaudePortfolio(amount: number): Promise<AIPortfolio | null> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: CLAUDE_SYSTEM,
      messages: [{ role: 'user', content: PORTFOLIO_PROMPT(amount) }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return buildPortfolio(data, amount, 'claude', 'Claude Lee');
  } catch (error) {
    console.error('Claude portfolio error:', error);
    return null;
  }
}

async function generateGeminiPortfolio(amount: number): Promise<AIPortfolio | null> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: GEMINI_SYSTEM,
    });

    const result = await model.generateContent(PORTFOLIO_PROMPT(amount));
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return buildPortfolio(data, amount, 'gemini', 'Gemi Nine');
  } catch (error) {
    console.error('Gemini portfolio error:', error);
    return null;
  }
}

async function generateGPTPortfolio(amount: number): Promise<AIPortfolio | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: GPT_SYSTEM },
        { role: 'user', content: PORTFOLIO_PROMPT(amount) },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return buildPortfolio(data, amount, 'gpt', 'G.P. Taylor');
  } catch (error) {
    console.error('GPT portfolio error:', error);
    return null;
  }
}

function buildPortfolio(
  data: {
    strategy: string;
    strategyDetail?: string;
    riskLevel: 'conservative' | 'balanced' | 'aggressive';
    cashWeight: number;
    cashReason?: string;
    holdings: { 
      name: string; 
      weight: number; 
      rationale: string;
      weightReason?: string;
      riskFactors?: string;
      targetReturn?: string;
    }[];
  },
  amount: number,
  character: CharacterType,
  characterName: string
): AIPortfolio {
  const cashWeight = Math.min(Math.max(data.cashWeight, 0), 30);
  const cashAmount = Math.floor(amount * (cashWeight / 100));
  const investAmount = amount - cashAmount;

  // 비중 정규화
  const totalHoldingsWeight = data.holdings.reduce((sum, h) => sum + h.weight, 0);
  const normalizedHoldings = data.holdings.map(h => ({
    ...h,
    weight: (h.weight / totalHoldingsWeight) * (100 - cashWeight)
  }));

  const holdings: PortfolioItem[] = normalizedHoldings.map(holding => {
    const etf = AVAILABLE_ETFS.find(s => s.name === holding.name);
    if (!etf) {
      // ETF를 찾지 못한 경우 KODEX 200으로 대체
      const fallback = AVAILABLE_ETFS[0];
      const etfAmount = Math.floor(investAmount * (holding.weight / (100 - cashWeight)));
      const shares = Math.floor(etfAmount / fallback.price);
      return {
        code: fallback.code,
        name: fallback.name,
        sector: fallback.sector,
        weight: Number(holding.weight.toFixed(1)),
        amount: shares * fallback.price,
        shares,
        price: fallback.price,
        rationale: holding.rationale,
        weightReason: holding.weightReason || '포트폴리오 균형을 위한 적정 비중',
        riskFactors: holding.riskFactors || '시장 변동성에 따른 리스크',
        targetReturn: holding.targetReturn || '+10~15%',
      };
    }

    const etfAmount = Math.floor(investAmount * (holding.weight / (100 - cashWeight)));
    const shares = Math.floor(etfAmount / etf.price);
    
    return {
      code: etf.code,
      name: etf.name,
      sector: etf.sector,
      weight: Number(holding.weight.toFixed(1)),
      amount: shares * etf.price,
      shares,
      price: etf.price,
      rationale: holding.rationale,
      weightReason: holding.weightReason || '포트폴리오 균형을 위한 적정 비중',
      riskFactors: holding.riskFactors || '시장 변동성에 따른 리스크',
      targetReturn: holding.targetReturn || '+10~15%',
    };
  }).filter(h => h.shares > 0); // 좌수가 0인 경우 제외

  return {
    character,
    characterName,
    cashWeight: Number(cashWeight.toFixed(1)),
    cashAmount,
    cashReason: data.cashReason || '시장 변동성 대비 및 추가 매수 여력 확보',
    holdings,
    totalInvested: holdings.reduce((sum, h) => sum + h.amount, 0),
    riskLevel: data.riskLevel || 'balanced',
    strategy: data.strategy,
    strategyDetail: data.strategyDetail || '',
  };
}

// Fallback 포트폴리오 생성 (AI 실패 시)
function generateFallbackPortfolio(
  amount: number,
  character: CharacterType,
  characterName: string
): AIPortfolio {
  const configs = {
    claude: {
      cashWeight: 12,
      cashReason: '시장 조정 시 추가 매수 여력을 확보하고, 변동성에 대비한 적정 현금 비중입니다.',
      riskLevel: 'balanced' as const,
      etfs: ['KODEX 200', 'TIGER 미국S&P500', 'ARIRANG 고배당주', 'TIGER CD금리투자KIS', 'KODEX 배당가치'],
      strategy: 'ETF 기반의 균형 잡힌 자산배분 전략. 시장지수 ETF와 배당 ETF를 중심으로 안정적인 수익을 추구합니다.',
      strategyDetail: '운용보수가 낮은 인덱스 ETF를 중심으로 선별하며, 자산군 간 분산을 통해 리스크를 관리합니다.',
    },
    gemini: {
      cashWeight: 7,
      cashReason: '성장 기회를 최대한 활용하기 위해 현금 비중을 최소화했습니다. 테마 ETF로 수익 극대화를 추구합니다.',
      riskLevel: 'aggressive' as const,
      etfs: ['KODEX 반도체', 'TIGER AI반도체핵심공정', 'TIGER 미국나스닥100', 'TIGER 미국테크TOP10', 'KODEX 2차전지산업'],
      strategy: '테마 ETF 집중 투자 전략. AI, 반도체, 빅테크 등 메가트렌드 수혜 ETF에 과감하게 배팅합니다.',
      strategyDetail: '미래 산업을 추종하는 테마 ETF에 집중하며, 단기 변동성보다 장기 성장 잠재력에 주목합니다.',
    },
    gpt: {
      cashWeight: 22,
      cashReason: '현재 거시경제 불확실성이 높은 시점에서 충분한 현금을 확보하여 리스크를 관리합니다.',
      riskLevel: 'conservative' as const,
      etfs: ['KODEX 200', 'KOSEF 국고채10년', 'TIGER CD금리투자KIS', 'ARIRANG 고배당주', 'KODEX 배당가치'],
      strategy: '리스크 관리 중심의 보수적 전략. 채권 ETF와 배당 ETF로 시장 변동성에 대비합니다.',
      strategyDetail: '채권 ETF로 안정성을 확보하고, 배당 ETF로 꾸준한 현금흐름을 추구합니다.',
    },
  };

  const config = configs[character];
  const cashAmount = Math.floor(amount * (config.cashWeight / 100));
  const investAmount = amount - cashAmount;
  const weightPerETF = (100 - config.cashWeight) / config.etfs.length;

  const fallbackRationales: Record<string, { rationale: string; weightReason: string; riskFactors: string; targetReturn: string }> = {
    'KODEX 200': { 
      rationale: '국내 대표 지수인 KOSPI200을 추종하는 ETF. 운용보수 0.15%로 저렴하고 거래량이 풍부합니다.',
      weightReason: '포트폴리오 핵심 자산으로 시장 평균 수익률을 안정적으로 추구합니다.',
      riskFactors: '국내 증시 전반 하락 리스크',
      targetReturn: '+8~12%'
    },
    'TIGER 미국S&P500': {
      rationale: '미국 S&P500 지수를 추종. 글로벌 분산 투자와 달러 자산 확보 효과가 있습니다.',
      weightReason: '해외 자산 비중을 통해 국내 시장과의 상관관계를 낮춥니다.',
      riskFactors: '환율 변동, 미국 증시 조정',
      targetReturn: '+10~15%'
    },
    'ARIRANG 고배당주': {
      rationale: '국내 고배당주에 투자하는 ETF. 연 4%+ 배당수익률로 안정적인 현금흐름을 제공합니다.',
      weightReason: '배당 수익으로 포트폴리오 수익의 안정성을 높입니다.',
      riskFactors: '배당 컷, 저성장 리스크',
      targetReturn: '+6~10%'
    },
    'TIGER CD금리투자KIS': {
      rationale: 'CD금리에 연동되는 초단기 채권 ETF. 예금 대비 높은 수익과 안정성을 제공합니다.',
      weightReason: '포트폴리오의 안전 자산 역할로 변동성을 줄입니다.',
      riskFactors: '금리 하락 시 수익률 감소',
      targetReturn: '+3~4%'
    },
    'KODEX 배당가치': {
      rationale: '배당수익률과 가치지표가 우수한 종목에 투자. 가치+배당 전략으로 안정적 수익 추구.',
      weightReason: '방어적 성격으로 하락장에서 포트폴리오를 보호합니다.',
      riskFactors: '가치주 약세 지속',
      targetReturn: '+7~12%'
    },
    'KODEX 반도체': {
      rationale: '국내 반도체 섹터에 집중 투자. 삼성전자, SK하이닉스 등 핵심 종목 편입.',
      weightReason: 'AI/HBM 성장 수혜 섹터로 높은 수익을 기대합니다.',
      riskFactors: '반도체 업황 둔화, 섹터 집중 리스크',
      targetReturn: '+15~25%'
    },
    'TIGER AI반도체핵심공정': {
      rationale: 'AI 반도체 핵심 공정 기업에 투자. 글로벌 AI 인프라 확대 수혜.',
      weightReason: 'AI 테마의 핵심 수혜 ETF로 높은 성장 잠재력을 반영했습니다.',
      riskFactors: 'AI 투자 둔화, 변동성 확대',
      targetReturn: '+20~35%'
    },
    'TIGER 미국나스닥100': {
      rationale: '미국 나스닥100 지수 추종. 애플, 엔비디아 등 빅테크 기업에 투자.',
      weightReason: '글로벌 기술 성장에 참여하는 핵심 ETF입니다.',
      riskFactors: '기술주 조정, 환율 리스크',
      targetReturn: '+15~25%'
    },
    'TIGER 미국테크TOP10': {
      rationale: '미국 빅테크 Top 10 기업에 집중 투자. 엔비디아, 애플, 마이크로소프트 등.',
      weightReason: '빅테크 집중으로 기술 섹터 상승에 레버리지 효과.',
      riskFactors: '기술주 밸류에이션 부담',
      targetReturn: '+18~30%'
    },
    'KODEX 2차전지산업': {
      rationale: '2차전지 밸류체인 전반에 투자. LG에너지솔루션, 삼성SDI 등 핵심 종목.',
      weightReason: '전기차 성장 수혜 섹터에 대한 익스포저 확보.',
      riskFactors: '2차전지 수요 둔화',
      targetReturn: '+12~20%'
    },
    'KOSEF 국고채10년': {
      rationale: '한국 국고채 10년물에 투자. 금리 하락 시 자본차익 기대.',
      weightReason: '채권 ETF로 주식과 음의 상관관계를 제공합니다.',
      riskFactors: '금리 상승 시 가격 하락',
      targetReturn: '+3~6%'
    },
  };

  const holdings: PortfolioItem[] = config.etfs.map(name => {
    const etf = AVAILABLE_ETFS.find(s => s.name === name)!;
    const etfAmount = Math.floor(investAmount / config.etfs.length);
    const shares = Math.floor(etfAmount / etf.price);
    const details = fallbackRationales[name] || {
      rationale: `${etf.sector} 카테고리 대표 ETF로 선정했습니다.`,
      weightReason: '포트폴리오 균형을 위한 적정 비중입니다.',
      riskFactors: '시장 변동성 리스크',
      targetReturn: '+10~15%'
    };
    
    return {
      code: etf.code,
      name: etf.name,
      sector: etf.sector,
      weight: Number(weightPerETF.toFixed(1)),
      amount: shares * etf.price,
      shares,
      price: etf.price,
      rationale: details.rationale,
      weightReason: details.weightReason,
      riskFactors: details.riskFactors,
      targetReturn: details.targetReturn,
    };
  }).filter(h => h.shares > 0);

  return {
    character,
    characterName,
    cashWeight: config.cashWeight,
    cashAmount,
    cashReason: config.cashReason,
    holdings,
    totalInvested: holdings.reduce((sum, h) => sum + h.amount, 0),
    riskLevel: config.riskLevel,
    strategy: config.strategy,
    strategyDetail: config.strategyDetail,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    
    if (!amount || amount < 1000000) {
      return NextResponse.json(
        { success: false, error: 'Minimum investment is 1,000,000원' },
        { status: 400 }
      );
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 병렬로 3개 AI 호출
    const [claudeResult, geminiResult, gptResult] = await Promise.all([
      generateClaudePortfolio(amount),
      generateGeminiPortfolio(amount),
      generateGPTPortfolio(amount),
    ]);

    // AI 실패 시 fallback 사용
    const portfolios: AIPortfolio[] = [
      claudeResult || generateFallbackPortfolio(amount, 'claude', 'Claude Lee'),
      geminiResult || generateFallbackPortfolio(amount, 'gemini', 'Gemi Nine'),
      gptResult || generateFallbackPortfolio(amount, 'gpt', 'G.P. Taylor'),
    ];
    
    return NextResponse.json({
      success: true,
      data: {
        amount,
        generatedAt: today,
        portfolios,
      },
    });
  } catch (error) {
    console.error('Portfolio generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate portfolios' },
      { status: 500 }
    );
  }
}
