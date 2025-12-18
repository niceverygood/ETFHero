import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchMultipleStockPrices } from '@/lib/market-data/kis';

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// 분석 대상 ETF 목록
const ANALYSIS_ETFS = [
  { symbol: '069500', name: 'KODEX 200', sector: '시장지수', expenseRatio: 0.15, aum: 50000, yield: 1.8, growth: 8.5 },
  { symbol: '102110', name: 'TIGER 200', sector: '시장지수', expenseRatio: 0.05, aum: 40000, yield: 1.9, growth: 8.7 },
  { symbol: '360750', name: 'TIGER 미국S&P500', sector: '해외지수', expenseRatio: 0.07, aum: 35000, yield: 1.2, growth: 15.0 },
  { symbol: '133690', name: 'TIGER 미국나스닥100', sector: '해외지수', expenseRatio: 0.07, aum: 30000, yield: 0.5, growth: 25.0 },
  { symbol: '091160', name: 'KODEX 반도체', sector: '테마/섹터', expenseRatio: 0.25, aum: 15000, yield: 0.8, growth: 35.0 },
  { symbol: '305720', name: 'KODEX 2차전지산업', sector: '테마/섹터', expenseRatio: 0.30, aum: 10000, yield: 0.3, growth: 20.0 },
  { symbol: '379800', name: 'KODEX 미국S&P500TR', sector: '해외지수', expenseRatio: 0.05, aum: 25000, yield: 0.0, growth: 16.0 },
  { symbol: '161510', name: 'ARIRANG 고배당주', sector: '배당/가치', expenseRatio: 0.23, aum: 8000, yield: 4.2, growth: 5.0 },
  { symbol: '148070', name: 'KOSEF 국고채10년', sector: '채권', expenseRatio: 0.10, aum: 12000, yield: 3.5, growth: 3.0 },
  { symbol: '364980', name: 'TIGER AI반도체핵심공정', sector: '테마/섹터', expenseRatio: 0.40, aum: 5000, yield: 0.2, growth: 45.0 },
  { symbol: '381170', name: 'TIGER 미국테크TOP10', sector: '해외테마', expenseRatio: 0.30, aum: 8000, yield: 0.3, growth: 30.0 },
  { symbol: '453810', name: 'TIGER 미국AI빅테크10', sector: '해외테마', expenseRatio: 0.35, aum: 4000, yield: 0.2, growth: 40.0 },
  { symbol: '266160', name: 'KODEX 배당가치', sector: '배당/가치', expenseRatio: 0.25, aum: 6000, yield: 3.8, growth: 6.0 },
  { symbol: '329200', name: 'TIGER CD금리투자KIS', sector: '채권', expenseRatio: 0.05, aum: 20000, yield: 3.8, growth: 4.0 },
  { symbol: '371460', name: 'TIGER 차이나전기차SOLACTIVE', sector: '해외테마', expenseRatio: 0.45, aum: 3000, yield: 0.1, growth: 18.0 },
  { symbol: '143850', name: 'TIGER 200IT', sector: '테마/섹터', expenseRatio: 0.30, aum: 5000, yield: 0.5, growth: 22.0 },
  { symbol: '157450', name: 'TIGER 모멘텀', sector: '전략/스마트베타', expenseRatio: 0.35, aum: 2000, yield: 1.0, growth: 12.0 },
  { symbol: '395170', name: 'KBSTAR 미국S&P500', sector: '해외지수', expenseRatio: 0.04, aum: 15000, yield: 1.3, growth: 14.0 },
  { symbol: '292150', name: 'TIGER TOP10', sector: '시장지수', expenseRatio: 0.15, aum: 4000, yield: 1.5, growth: 10.0 },
  { symbol: '411060', name: 'ACE 미국빅테크TOP7 Plus', sector: '해외테마', expenseRatio: 0.30, aum: 3500, yield: 0.2, growth: 35.0 },
];

// Claude 분석 (ETF 밸류에이션 관점)
async function analyzeWithClaude(etfs: typeof ANALYSIS_ETFS, realPrices: Map<string, any>): Promise<any[]> {
  const etfList = etfs.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, 운용보수 ${s.expenseRatio}%, 순자산 ${s.aum}억, 배당수익률 ${s.yield}%`;
  }).join('\n');

  const prompt = `당신은 ETF 밸류에이션 전문가입니다. 아래 ETF들 중 운용보수 대비 효율성이 높고 안정적인 Top 5를 선정하세요.
  
ETF 목록:
${etfList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"ETF명","score":4.5,"reason":"분석이유"}]}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content.find(b => b.type === 'text');
    const jsonMatch = (text as any)?.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('Claude error:', error);
  }
  return [];
}

// Gemini 분석 (테마/성장 ETF 관점)
async function analyzeWithGemini(etfs: typeof ANALYSIS_ETFS, realPrices: Map<string, any>): Promise<any[]> {
  const etfList = etfs.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, 성장률 ${s.growth}%, 카테고리: ${s.sector}`;
  }).join('\n');

  const prompt = `당신은 테마 ETF 전문가입니다. 아래 ETF들 중 성장 잠재력이 높은 Top 5를 선정하세요.

ETF 목록:
${etfList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"ETF명","score":4.8,"reason":"분석이유"}]}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('Gemini error:', error);
  }
  return [];
}

// GPT 분석 (자산배분/리스크 관리 관점)
async function analyzeWithGPT(etfs: typeof ANALYSIS_ETFS, realPrices: Map<string, any>): Promise<any[]> {
  const etfList = etfs.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, 배당수익률 ${s.yield}%, 카테고리: ${s.sector}`;
  }).join('\n');

  const prompt = `당신은 자산배분 전문가입니다. 아래 ETF들 중 리스크 대비 안정성이 높은 Top 5를 선정하세요.

ETF 목록:
${etfList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"ETF명","score":4.2,"reason":"분석이유"}]}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    });
    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('GPT error:', error);
  }
  return [];
}

// 점수 합산 및 Top 5 선정
interface StockScore {
  symbol: string;
  name: string;
  claudeScore: number;
  geminiScore: number;
  gptScore: number;
  reasons: string[];
}

function aggregateTop5(claudeTop5: any[], geminiTop5: any[], gptTop5: any[], realPrices: Map<string, any>): any[] {
  const scoreMap = new Map<string, StockScore>();

  // Claude 점수 집계
  claudeTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.claudeScore = item.score || (5 - idx * 0.5);
    existing.reasons.push(`클로드: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // Gemini 점수 집계
  geminiTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.geminiScore = item.score || (5 - idx * 0.5);
    if (item.name) existing.name = item.name;
    existing.reasons.push(`제미나인: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // GPT 점수 집계
  gptTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.gptScore = item.score || (5 - idx * 0.5);
    if (item.name) existing.name = item.name;
    existing.reasons.push(`쥐피테일러: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // 총점 계산 및 정렬
  const aggregated = Array.from(scoreMap.values())
    .map(item => {
      const realPrice = realPrices.get(item.symbol);
      const totalScore = item.claudeScore + item.geminiScore + item.gptScore;
      const avgScore = totalScore / 3;
      const votedBy = [
        item.claudeScore > 0 ? 'claude' : null,
        item.geminiScore > 0 ? 'gemini' : null,
        item.gptScore > 0 ? 'gpt' : null,
      ].filter(Boolean);

      return {
        symbol: item.symbol,
        name: item.name || ANALYSIS_ETFS.find(s => s.symbol === item.symbol)?.name || item.symbol,
        totalScore,
        avgScore: Math.round(avgScore * 10) / 10,
        claudeScore: item.claudeScore,
        geminiScore: item.geminiScore,
        gptScore: item.gptScore,
        votedBy,
        isUnanimous: votedBy.length === 3,
        currentPrice: realPrice?.price || 0,
        change: realPrice?.change || 0,
        changePercent: realPrice?.changePercent || 0,
        reasons: item.reasons,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return aggregated;
}

export async function GET(request: NextRequest) {
  // Verify cron secret (for security in production)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without auth
  if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 한국 시간 기준 오늘 날짜
  const now = new Date();
  const kstOffset = 9 * 60; // UTC+9
  const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60 * 1000);
  const today = kstTime.toISOString().split('T')[0];
  console.log(`[${today}] Starting daily verdict generation...`);

  try {
    // 1. 오늘 이미 생성된 verdict가 있는지 확인
    const { data: existingVerdict } = await supabase
      .from('verdicts')
      .select('*')
      .eq('date', today)
      .single();

    if (existingVerdict) {
      console.log(`[${today}] Verdict already exists for today`);
      return NextResponse.json({ 
        success: true, 
        message: 'Verdict already exists for today',
        verdict: existingVerdict 
      });
    }

    // 2. 실시간 가격 조회
    const symbols = ANALYSIS_ETFS.map(s => s.symbol);
    let realPrices: Map<string, any> = new Map();
    
    try {
      realPrices = await fetchMultipleStockPrices(symbols);
      console.log(`[${today}] Fetched real-time prices for ${realPrices.size} stocks`);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    // 3. 각 AI 분석 수행 (병렬)
    console.log(`[${today}] Running AI analysis...`);
    const [claudeTop5, geminiTop5, gptTop5] = await Promise.all([
      analyzeWithClaude(ANALYSIS_ETFS, realPrices),
      analyzeWithGemini(ANALYSIS_ETFS, realPrices),
      analyzeWithGPT(ANALYSIS_ETFS, realPrices),
    ]);

    console.log(`[${today}] Claude: ${claudeTop5.length}, Gemini: ${geminiTop5.length}, GPT: ${gptTop5.length}`);

    // 4. 점수 합산 및 Top 5 선정
    const top5 = aggregateTop5(claudeTop5, geminiTop5, gptTop5, realPrices);

    if (top5.length === 0) {
      throw new Error('Failed to generate Top 5');
    }

    // 5. Verdict 저장
    const consensusSummary = `오늘 ${top5.filter(t => t.isUnanimous).length}개 ETF가 3명의 AI 분석가 만장일치 추천을 받았습니다. 1위 ${top5[0]?.name}(${top5[0]?.symbol})은 평균 ${top5[0]?.avgScore}점을 기록했습니다.`;

    const { data: verdict, error } = await supabase
      .from('verdicts')
      .insert({
        date: today,
        top5: top5,
        consensus_summary: consensusSummary,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[${today}] Verdict saved successfully!`);
    console.log('Top 5:', top5.map(t => `${t.rank}. ${t.name}`).join(', '));

    // 6. Predictions 저장
    for (const stock of top5) {
      await supabase.from('predictions').insert({
        verdict_id: verdict.id,
        symbol_code: stock.symbol,
        symbol_name: stock.name,
        predicted_direction: stock.avgScore >= 4 ? 'up' : stock.avgScore >= 3 ? 'hold' : 'down',
        avg_score: stock.avgScore,
        date: today,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily verdict generated and saved',
      date: today,
      verdict: {
        id: verdict.id,
        top5: top5.map(t => ({
          rank: t.rank,
          symbol: t.symbol,
          name: t.name,
          avgScore: t.avgScore,
          isUnanimous: t.isUnanimous,
        })),
        consensusSummary,
      },
    });

  } catch (error: any) {
    console.error(`[${today}] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate verdict' },
      { status: 500 }
    );
  }
}

