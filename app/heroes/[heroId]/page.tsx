'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CharacterAvatar } from '@/components/CharacterAvatar';
import { } from '@/components';

// AI 의견 메시지 인터페이스
interface AIOpinionMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// 각 ETF별 AI 의견 상태
interface ETFOpinionState {
  isOpen: boolean;
  messages: AIOpinionMessage[];
  isLoading: boolean;
  hasMore: boolean;
  turn: number;
}

// 히어로 메타 데이터 (ETF용)
const HERO_META = {
  claude: {
    name: 'Claude Lee',
    nameKo: '클로드 리',
    title: 'ETF 밸류에이션 분석가',
    subtitle: 'Cost & Tracking Expert',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    tagline: '낮은 비용이 장기 수익의 핵심입니다',
    description: '비용 효율성 및 추적 오차 중심 ETF',
  },
  gemini: {
    name: 'Gemi Nine',
    nameKo: '제미나인',
    title: '테마 ETF 전략가',
    subtitle: 'Theme & Growth Strategist',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    tagline: '미래를 사는 거예요. 테마가 곧 수익입니다.',
    description: '성장 테마 및 혁신 섹터 ETF',
  },
  gpt: {
    name: 'G.P. Taylor',
    nameKo: 'G.P. 테일러',
    title: '자산배분 리스크 총괄',
    subtitle: 'Asset Allocation & Risk Officer',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    tagline: '분산투자가 유일한 공짜 점심입니다',
    description: '분산투자 및 리스크 관리 ETF',
  },
};

interface ETFItem {
  rank: number;
  symbol: string;
  name: string;
  category?: string;
  currentPrice: number;
  targetPrice: number;
  change: number;
  changePercent: number;
  score: number;
  reason: string;
  metrics: Record<string, number | string>;
  risks: string[];
}

interface HeroData {
  hero: {
    id: string;
    name: string;
    nameKo: string;
    title: string;
    criteria: string;
    methodology: string;
  };
  date: string;
  time?: string;
  isRealTime?: boolean;
  stocks: ETFItem[];
}

export default function HeroDetailPage() {
  const params = useParams();
  const router = useRouter();
  const heroId = params.heroId as string;
  
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStock, setExpandedStock] = useState<number | null>(null);
  const [stockOpinions, setStockOpinions] = useState<Record<string, StockOpinionState>>({});
  const [typingText, setTypingText] = useState<Record<string, string>>({});
  const opinionEndRef = useRef<HTMLDivElement>(null);
  
  const meta = HERO_META[heroId as keyof typeof HERO_META];

  // AI 의견 가져오기
  const fetchAIOpinion = async (stock: ETFItem, isMore: boolean = false) => {
    const stockKey = stock.symbol;
    const currentState = stockOpinions[stockKey];
    const currentTurn = isMore ? (currentState?.turn || 0) + 1 : 1;
    const analysisTypes = ['initial', 'detailed', 'strategy', 'risk', 'conclusion'] as const;

    // 상태 초기화 또는 로딩 상태 설정
    setStockOpinions(prev => ({
      ...prev,
      [stockKey]: {
        isOpen: true,
        messages: isMore ? (prev[stockKey]?.messages || []) : [],
        isLoading: true,
        hasMore: true,
        turn: currentTurn,
      }
    }));

    try {
      const response = await fetch('/api/consultation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterType: heroId,
          messages: [{ role: 'user', content: `${stock.name}에 대해 분석해주세요.` }],
          stockData: {
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice,
            change: stock.change,
            changePercent: stock.changePercent,
          },
          isInitialAnalysis: true,
          analysisType: analysisTypes[currentTurn - 1],
          turn: currentTurn,
        }),
      });

      const result = await response.json();
      const messageId = `${stockKey}-${currentTurn}`;
      const messageContent = result.data?.content || result.message || '응답을 가져올 수 없습니다.';
      const newMessage: AIOpinionMessage = {
        id: messageId,
        content: messageContent,
        timestamp: new Date(),
      };

      // 타이핑 애니메이션
      setTypingText(prev => ({ ...prev, [messageId]: '' }));
      const fullText = messageContent;
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          setTypingText(prev => ({
            ...prev,
            [messageId]: fullText.slice(0, charIndex + 1)
          }));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTypingText(prev => {
            const newState = { ...prev };
            delete newState[messageId];
            return newState;
          });
        }
      }, 15);

      setStockOpinions(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          messages: [...(prev[stockKey]?.messages || []), newMessage],
          isLoading: false,
          hasMore: currentTurn < 5,
          turn: currentTurn,
        }
      }));

    } catch (error) {
      console.error('AI opinion fetch error:', error);
      setStockOpinions(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          isLoading: false,
        }
      }));
    }
  };

  // 의견 접기/펼치기
  const toggleOpinion = (stock: ETFItem) => {
    const stockKey = stock.symbol;
    const currentState = stockOpinions[stockKey];

    if (currentState?.isOpen) {
      setStockOpinions(prev => ({
        ...prev,
        [stockKey]: { ...prev[stockKey], isOpen: false }
      }));
    } else if (currentState?.messages?.length > 0) {
      setStockOpinions(prev => ({
        ...prev,
        [stockKey]: { ...prev[stockKey], isOpen: true }
      }));
    } else {
      fetchAIOpinion(stock);
    }
  };

  // 더보기 버튼 텍스트 (5단계)
  const getMoreButtonText = (turn: number) => {
    switch (turn) {
      case 1: return '📊 상세 분석 보기';
      case 2: return '📈 투자 전략 보기';
      case 3: return '⚠️ 리스크 분석 보기';
      case 4: return '🎯 최종 결론 보기';
      default: return '더보기';
    }
  };
  
  useEffect(() => {
    if (!meta) {
      router.push('/heroes');
      return;
    }
    
    async function fetchData() {
      try {
        const res = await fetch(`/api/heroes/${heroId}/top5`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch hero data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [heroId, meta, router]);
  
  if (!meta) return null;
  
  return (
    <>
      <main className="min-h-screen bg-dark-950 pt-24 sm:pt-28 lg:pt-32 pb-20">
        <div className="container-app">
        {/* Back Button */}
        <Link
          href="/heroes"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ETF Heros로 돌아가기
        </Link>
        
        {/* Hero Header */}
        <div className={`glass ${meta.borderColor} border-2 rounded-2xl lg:rounded-3xl p-6 sm:p-8 mb-8`}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br ${meta.color} p-1 shrink-0`}>
              <div className="w-full h-full rounded-2xl bg-dark-900 flex items-center justify-center overflow-hidden">
                <CharacterAvatar character={heroId as 'claude' | 'gemini' | 'gpt'} size="lg" />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{meta.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${meta.bgColor} ${meta.textColor}`}>
                  {meta.title}
                </span>
              </div>
              <p className="text-dark-400 mb-4">{meta.subtitle}</p>
              
              <div className={`${meta.bgColor} rounded-xl p-4 inline-block`}>
                <p className={`text-lg sm:text-xl font-bold ${meta.textColor}`}>
                  &quot;{meta.tagline}&quot;
                </p>
              </div>
            </div>
          </div>
          
          {/* Methodology */}
          {data && (
            <div className="mt-6 pt-6 border-t border-dark-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider mb-1">추천 기준</p>
                  <p className="text-dark-200">{data.hero.criteria}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider mb-1">분석 방법론</p>
                  <p className="text-dark-200">{data.hero.methodology}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Top 5 Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {meta.nameKo}의 Top 5
            </h2>
            {data && (
              <div className="flex items-center gap-2">
                {data.isRealTime && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    실시간
                  </span>
                )}
                <span className="text-sm text-dark-400">
                  {data.date} {data.time}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-dark-700 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-dark-700 rounded w-1/4 mb-2" />
                    <div className="h-4 bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Stock List */}
        {data && (
          <div className="space-y-4">
            {data.stocks.map((stock, idx) => (
              <div
                key={stock.symbol}
                className={`glass ${meta.borderColor} border rounded-xl overflow-hidden transition-all ${
                  expandedStock === idx ? 'ring-2 ring-offset-2 ring-offset-dark-950' : ''
                }`}
                style={{
                  // @ts-ignore
                  '--tw-ring-color': meta.textColor.includes('blue') ? 'rgb(96 165 250)' : 
                                     meta.textColor.includes('purple') ? 'rgb(192 132 252)' : 
                                     'rgb(251 191 36)',
                }}
              >
                {/* Main Row */}
                <button
                  className="w-full p-4 sm:p-6 flex items-center gap-4 text-left hover:bg-dark-800/30 transition-colors"
                  onClick={() => setExpandedStock(expandedStock === idx ? null : idx)}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-bold text-lg sm:text-xl">{stock.rank}</span>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{stock.name}</h3>
                      <span className="text-xs text-dark-500">{stock.symbol}</span>
                    </div>
                    <p className="text-sm text-dark-400 truncate">{stock.reason.substring(0, 50)}...</p>
                  </div>
                  
                  {/* Price & Score */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-lg font-bold text-white">{stock.currentPrice.toLocaleString()}원</p>
                      {stock.change !== 0 && (
                        <span className={`text-sm ${stock.change > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {stock.change > 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {/* 목표가는 대화 완료 후 표시 */}
                    {stockOpinions[stock.symbol]?.messages?.length >= 5 ? (
                      <p className={`text-sm ${meta.textColor}`}>
                        목표 {stock.targetPrice.toLocaleString()}원
                        {stock.currentPrice > 0 && (
                          <span className="text-green-400 ml-2">
                            (+{Math.round((stock.targetPrice - stock.currentPrice) / stock.currentPrice * 100)}%)
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-400/80 animate-pulse">
                        🔒 5번 의견보기 후 공개
                      </p>
                    )}
                  </div>
                  
                  {/* Score Badge */}
                  <div className={`${meta.bgColor} px-3 py-2 rounded-lg shrink-0`}>
                    <p className={`text-xl font-bold ${meta.textColor}`}>{stock.score}</p>
                    <p className="text-xs text-dark-400">점수</p>
                  </div>
                  
                  {/* Expand Icon */}
                  <svg
                    className={`w-5 h-5 text-dark-400 transition-transform ${expandedStock === idx ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Expanded Content */}
                {expandedStock === idx && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-dark-700/50">
                    {/* Mobile Price */}
                    <div className="sm:hidden py-4 border-b border-dark-700/50 mb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white">{stock.currentPrice.toLocaleString()}원</p>
                        {stock.change !== 0 && (
                          <span className={`text-sm ${stock.change > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {stock.change > 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                          </span>
                        )}
                      </div>
                      {/* 목표가는 대화 완료 후 표시 */}
                      {stockOpinions[stock.symbol]?.messages?.length >= 5 ? (
                        <p className={`text-sm ${meta.textColor}`}>
                          목표 {stock.targetPrice.toLocaleString()}원
                          {stock.currentPrice > 0 && (
                            <span className="text-green-400 ml-2">
                              (+{Math.round((stock.targetPrice - stock.currentPrice) / stock.currentPrice * 100)}%)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-400/80 animate-pulse">
                          🔒 5번 의견보기 후 공개
                        </p>
                      )}
                    </div>
                    
                    {/* Reason */}
                    <div className="mb-4">
                      <p className="text-xs text-dark-500 uppercase tracking-wider mb-2">추천 이유</p>
                      <p className="text-dark-200">{stock.reason}</p>
                    </div>
                    
                    {/* Metrics */}
                    <div className="mb-4">
                      <p className="text-xs text-dark-500 uppercase tracking-wider mb-2">핵심 지표</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stock.metrics).map(([key, value]) => (
                          <span
                            key={key}
                            className={`${meta.bgColor} px-3 py-1.5 rounded-lg text-sm`}
                          >
                            <span className="text-dark-400">{key}: </span>
                            <span className={meta.textColor}>{value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Risks */}
                    <div className="mb-4">
                      <p className="text-xs text-dark-500 uppercase tracking-wider mb-2">유의 사항</p>
                      <div className="flex flex-wrap gap-2">
                        {stock.risks.map((risk, i) => (
                          <span
                            key={i}
                            className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-sm"
                          >
                            ⚠️ {risk}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Opinion Button */}
                    <div className="pt-4 border-t border-dark-700/50">
                      <button
                        onClick={() => toggleOpinion(stock)}
                        className={`w-full py-3 rounded-xl font-medium text-center bg-gradient-to-r ${meta.color} text-white hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                      >
                        <CharacterAvatar character={heroId as 'claude' | 'gemini' | 'gpt'} size="xs" />
                        {meta.nameKo} 의견보기
                        <svg 
                          className={`w-4 h-4 transition-transform ${stockOpinions[stock.symbol]?.isOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* AI Opinion Chat Area */}
                      {stockOpinions[stock.symbol]?.isOpen && (
                        <div className="mt-4 space-y-4">
                          {/* Messages */}
                          {stockOpinions[stock.symbol]?.messages.map((msg, msgIdx) => {
                            const isTyping = typingText[msg.id] !== undefined;
                            const displayText = isTyping ? typingText[msg.id] : msg.content;
                            
                            return (
                              <div key={msg.id} className="relative">
                                {/* Turn indicator */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs ${meta.textColor} font-medium`}>
                                    {msgIdx === 0 ? '💡 초기 분석' : 
                                     msgIdx === 1 ? '📊 상세 분석' : 
                                     msgIdx === 2 ? '📈 투자 전략' : 
                                     msgIdx === 3 ? '⚠️ 리스크 분석' : '🎯 최종 결론'}
                                  </span>
                                  <span className="text-[10px] text-dark-500">({msgIdx + 1}/5)</span>
                                </div>
                                
                                {/* Message bubble */}
                                <div className={`p-4 rounded-xl ${meta.bgColor} border ${meta.borderColor}`}>
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <CharacterAvatar character={heroId as 'claude' | 'gemini' | 'gpt'} size="sm" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-dark-500 mb-1">{meta.name}</p>
                                      <p className="text-dark-200 text-sm whitespace-pre-wrap leading-relaxed">
                                        {displayText}
                                        {isTyping && <span className="animate-pulse">▌</span>}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Loading indicator */}
                          {stockOpinions[stock.symbol]?.isLoading && (
                            <div className={`p-4 rounded-xl ${meta.bgColor} border ${meta.borderColor}`}>
                              <div className="flex items-center gap-3">
                                <CharacterAvatar character={heroId as 'claude' | 'gemini' | 'gpt'} size="sm" />
                                <div className="flex gap-1">
                                  <span className={`w-2 h-2 ${meta.bgColor.replace('/10', '')} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                                  <span className={`w-2 h-2 ${meta.bgColor.replace('/10', '')} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                                  <span className={`w-2 h-2 ${meta.bgColor.replace('/10', '')} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* More button with teaser */}
                          {stockOpinions[stock.symbol]?.hasMore && 
                           !stockOpinions[stock.symbol]?.isLoading && 
                           stockOpinions[stock.symbol]?.messages.length > 0 && (
                            <div className="space-y-3">
                              <button
                                onClick={() => fetchAIOpinion(stock, true)}
                                className={`w-full py-3 rounded-xl font-medium text-center border-2 border-dashed ${meta.borderColor} ${meta.textColor} hover:bg-dark-800/50 transition-all flex items-center justify-center gap-2`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {getMoreButtonText(stockOpinions[stock.symbol]?.turn || 1)}
                              </button>
                              
                              {/* Teaser text */}
                              <div className="text-center animate-pulse">
                                <p className="text-sm font-medium text-yellow-400">
                                  🔓 {5 - (stockOpinions[stock.symbol]?.turn || 1)}번 더 보면 <span className="text-yellow-300 font-bold">목표가 & 목표날짜</span> 공개!
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div 
                                      key={i}
                                      className={`w-3 h-3 rounded-full transition-all ${
                                        i <= (stockOpinions[stock.symbol]?.turn || 0) 
                                          ? `bg-gradient-to-r ${meta.color}` 
                                          : 'bg-dark-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-dark-500 mt-1">
                                  진행률 {stockOpinions[stock.symbol]?.turn || 0}/5
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Completion message with Target Price */}
                          {!stockOpinions[stock.symbol]?.hasMore && 
                           stockOpinions[stock.symbol]?.messages.length >= 5 && (
                            <div className="mt-4 space-y-4">
                              {/* Target Price Card */}
                              <div className={`p-5 rounded-xl bg-gradient-to-r ${meta.color} text-white`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm opacity-90">🎯 {meta.nameKo}의 목표가</span>
                                  <span className="text-xs opacity-75">분석 완료</span>
                                </div>
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-3xl font-bold">₩{stock.targetPrice.toLocaleString()}</p>
                                    <p className="text-sm opacity-90 mt-1">
                                      현재가 {stock.currentPrice.toLocaleString()}원 대비{' '}
                                      <span className="font-bold">
                                        (+{Math.round((stock.targetPrice - stock.currentPrice) / stock.currentPrice * 100)}%)
                                      </span>
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs opacity-75">예상 수익</p>
                                    <p className="text-xl font-bold text-green-300">
                                      +₩{(stock.targetPrice - stock.currentPrice).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Completion Text */}
                              <div className="text-center py-2">
                                <p className="text-xs text-dark-500">✨ {meta.nameKo}의 전체 분석이 완료되었습니다</p>
                                <Link 
                                  href={`/battle/${stock.symbol}`}
                                  className={`inline-block mt-2 text-sm ${meta.textColor} hover:underline`}
                                >
                                  다른 전문가 의견도 확인하기 →
                                </Link>
                              </div>
                            </div>
                          )}

                          <div ref={opinionEndRef} />
                        </div>
                      )}
                      
                      {/* Initial teaser before first click */}
                      {!stockOpinions[stock.symbol]?.isOpen && !stockOpinions[stock.symbol]?.messages?.length && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                          <p className="text-center text-sm text-yellow-400 font-medium">
                            🔒 5번의 의견 보기 이후 <span className="text-yellow-300 font-bold">목표가</span>와 <span className="text-yellow-300 font-bold">목표날짜</span>가 공개됩니다!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-dark-800/50 text-center">
          <p className="text-xs text-dark-500">
            ⚠️ 본 추천은 AI의 분석에 기반하며, 투자의 최종 결정은 투자자 본인의 판단에 따라야 합니다.
            과거의 성과가 미래의 수익을 보장하지 않습니다.
          </p>
        </div>
        
        {/* Other Heroes */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-white mb-4">다른 분석가의 추천도 확인해보세요</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(HERO_META)
              .filter(([id]) => id !== heroId)
              .map(([id, otherMeta]) => (
                <Link
                  key={id}
                  href={`/heroes/${id}`}
                  className={`glass ${otherMeta.borderColor} border rounded-xl p-4 hover:bg-dark-800/30 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${otherMeta.color} p-0.5`}>
                      <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center">
                        <CharacterAvatar character={id as 'claude' | 'gemini' | 'gpt'} size="sm" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-white">{otherMeta.name}</p>
                      <p className="text-sm text-dark-400">{otherMeta.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
