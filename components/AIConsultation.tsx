'use client';

import { useState, useRef, useEffect } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '@/lib/characters';
import { AI_PERSONAS } from '@/lib/ai-personas';
import type { CharacterType } from '@/lib/llm/types';

// 캐릭터별 맞춤 추천 질문
function getSuggestedQuestions(characterType: CharacterType): string[] {
  const questions: Record<CharacterType, string[]> = {
    claude: [
      'KODEX 200과 TIGER 200 중에서 어떤 게 더 좋을까요? 운용보수 비교해주세요.',
      '시장지수 ETF를 기본으로 깔고, 테마 ETF 비중은 어느 정도가 적당할까요?',
      '배당 ETF 투자를 고려 중인데, ARIRANG 고배당주와 KODEX 배당가치 중 뭐가 좋을까요?',
      'ETF 자동 리밸런싱 주기는 보통 어느 정도로 하나요?',
    ],
    gemini: [
      '요즘 AI 관련 ETF 중에서 가장 유망한 것이 뭐라고 생각하세요?',
      'TIGER 미국테크TOP10과 TIGER AI반도체핵심공정 중에 어떤 게 더 좋을까요?',
      '2차전지 ETF 전망이 어떤가요? KODEX 2차전지산업 아직 유효할까요?',
      '테마 ETF 분산 투자 vs 집중 투자, 어떤 전략이 더 좋을까요?',
    ],
    gpt: [
      '채권 ETF와 주식 ETF 비중을 어떻게 조절해야 할까요?',
      '포트폴리오에서 현금 비중을 얼마나 유지해야 할까요?',
      '미국 경기침체 가능성, 어떻게 보시나요? ETF 포트폴리오 대비 전략이 궁금해요.',
      '달러 환율이 계속 오르는데, 해외 ETF 환헤지 상품을 써야 할까요?',
    ],
  };
  return questions[characterType] || questions.claude;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Holding {
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface ETFData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface AIConsultationProps {
  characterType: CharacterType;
  holdings?: Holding[];
  stockData?: ETFData;  // 실시간 ETF 데이터
  onClose?: () => void;
  onViewDebate?: () => void;
  showDebateButton?: boolean;
}

export function AIConsultation({ characterType, holdings = [], stockData, onClose, onViewDebate, showDebateButton = true }: AIConsultationProps) {
  const char = CHARACTERS[characterType];
  const persona = AI_PERSONAS[characterType];
  
  // 종목 데이터가 있으면 해당 종목에 대한 인사, 없으면 기본 인사
  const getInitialGreeting = () => {
    if (stockData && stockData.name) {
      return `안녕하세요! ${stockData.name}(${stockData.symbol})에 대해 상담하러 오셨군요.\n\n잠시만요, ${stockData.name}에 대한 제 분석을 정리해서 말씀드릴게요...`;
    }
    return persona.greeting;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: getInitialGreeting(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingGreeting, setIsTypingGreeting] = useState(true);
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 종목 데이터가 있으면 초기 분석 요청
  useEffect(() => {
    if (stockData && stockData.name && !hasInitialAnalysis) {
      // 인사 메시지 타이핑이 끝나면 자동으로 초기 분석 요청
      const timer = setTimeout(() => {
        requestInitialAnalysis();
      }, 2500); // 인사 메시지 후 잠시 대기
      
      return () => clearTimeout(timer);
    }
  }, [stockData, hasInitialAnalysis]);

  // 초기 종목 분석 요청
  const requestInitialAnalysis = async () => {
    if (!stockData || hasInitialAnalysis) return;
    
    setHasInitialAnalysis(true);
    setIsLoading(true);

    try {
      const response = await fetch('/api/consultation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterType,
          messages: [{
            role: 'user',
            content: `${stockData.name}(${stockData.symbol})에 대한 당신의 투자 관점과 분석을 말해주세요. 현재가 ${stockData.currentPrice?.toLocaleString() || '정보없음'}원입니다.`,
          }],
          holdings,
          stockData,
          isInitialAnalysis: true, // 초기 분석 플래그
        }),
      });

      const data = await response.json();

      if (data.success) {
        const analysisMessage: Message = {
          id: `analysis-${Date.now()}`,
          role: 'assistant',
          content: data.data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, analysisMessage]);
      }
    } catch (error) {
      console.error('Initial analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 첫 인사 메시지 타이핑 효과
  useEffect(() => {
    const greeting = getInitialGreeting();
    let currentIndex = 0;
    
    setDisplayedGreeting('');
    setIsTypingGreeting(true);
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < greeting.length) {
        setDisplayedGreeting(greeting.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setIsTypingGreeting(false);
      }
    }, 25); // 25ms per character
    
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedGreeting]);

  useEffect(() => {
    if (!isTypingGreeting) {
      inputRef.current?.focus();
    }
  }, [isTypingGreeting]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/consultation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterType,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          holdings,
          stockData,  // 실시간 종목 데이터 전달
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Consultation error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className={`flex items-center gap-4 p-4 border-b border-dark-800 ${char.bgColor}`}>
        <CharacterAvatar character={characterType} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-dark-100">{char.name}</h3>
            <span className="text-xs text-dark-500">|</span>
            <span className="text-xs text-dark-400">{char.role}</span>
          </div>
          {stockData && stockData.name ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-brand-400">{stockData.name}</span>
              <span className="text-xs text-dark-500 font-mono">{stockData.symbol}</span>
              {stockData.currentPrice > 0 && (
                <>
                  <span className="text-xs text-dark-600">|</span>
                  <span className="text-xs text-dark-300">{stockData.currentPrice.toLocaleString()}원</span>
                  {stockData.changePercent !== 0 && (
                    <span className={`text-xs ${stockData.changePercent > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {stockData.changePercent > 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-dark-400">1:1 상담</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-800/50 transition-colors shrink-0"
          >
            <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Holdings Info */}
      {holdings.length > 0 && (
        <div className="p-3 bg-dark-900/50 border-b border-dark-800">
          <div className="text-xs text-dark-500 mb-2">연동된 보유 ETF</div>
          <div className="flex flex-wrap gap-2">
            {holdings.map((h, i) => {
              const profitPercent = ((h.currentPrice - h.avgPrice) / h.avgPrice * 100);
              return (
                <div
                  key={i}
                  className="px-2 py-1 rounded-lg bg-dark-800/50 text-xs"
                >
                  <span className="text-dark-300">{h.name}</span>
                  <span className={`ml-1 ${profitPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isGreeting = message.id === 'greeting';
          const displayContent = isGreeting ? displayedGreeting : message.content;
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'assistant' && (
                <CharacterAvatar character={characterType} size="md" />
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : `${char.bgColor} text-dark-200 rounded-bl-sm`
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                  {isGreeting && isTypingGreeting && (
                    <span className="inline-block w-0.5 h-4 bg-dark-300 ml-0.5 animate-pulse" />
                  )}
                </p>
                {(!isGreeting || !isTypingGreeting) && (
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-brand-200' : 'text-dark-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex gap-3">
            <CharacterAvatar character={characterType} size="md" />
            <div className={`p-3 rounded-2xl rounded-bl-sm ${char.bgColor}`}>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions - Character specific */}
      {messages.length === 1 && !isTypingGreeting && (
        <div className="px-4 pb-2">
          <div className="text-xs text-dark-500 mb-2">추천 질문</div>
          <div className="flex flex-wrap gap-2">
            {getSuggestedQuestions(characterType).map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="px-3 py-1.5 rounded-full bg-dark-800/50 text-xs text-dark-400 hover:bg-dark-800 hover:text-dark-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Debate Button - 대화가 진행된 후 표시 */}
      {showDebateButton && messages.length >= 3 && !isLoading && (
        <div className="px-4 pb-2">
          <button
            onClick={onViewDebate}
            className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${char.gradient} text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            AI 3인 토론 보러가기
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTypingGreeting ? '잠시만 기다려주세요...' : `${char.name}에게 질문하세요...`}
            rows={1}
            disabled={isTypingGreeting}
            className={`flex-1 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-brand-500 transition-colors ${isTypingGreeting ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isTypingGreeting}
            className={`px-4 rounded-xl font-medium transition-colors ${
              input.trim() && !isLoading && !isTypingGreeting
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-dark-800 text-dark-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-dark-600 mt-2 text-center">
          본 상담은 투자 권유가 아닙니다. 최종 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
        </p>
      </div>
    </div>
  );
}

// Modal wrapper for the consultation
interface AIConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterType: CharacterType;
  holdings?: Holding[];
  stockData?: ETFData;  // 실시간 ETF 데이터
  onViewDebate?: () => void;
  showDebateButton?: boolean;
}

export function AIConsultationModal({ isOpen, onClose, characterType, holdings, stockData, onViewDebate, showDebateButton = true }: AIConsultationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl h-[80vh] bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden shadow-2xl">
        <AIConsultation
          characterType={characterType}
          holdings={holdings}
          stockData={stockData}
          onClose={onClose}
          onViewDebate={onViewDebate}
          showDebateButton={showDebateButton}
        />
      </div>
    </div>
  );
}

