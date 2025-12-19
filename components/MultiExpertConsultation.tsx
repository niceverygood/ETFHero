'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '@/lib/characters';
import type { CharacterType } from '@/lib/llm/types';

interface Message {
  id: string;
  type: 'user' | 'expert';
  content: string;
  characterType?: CharacterType;
  timestamp: Date;
}

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface MultiExpertConsultationProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol?: string;
  stockName?: string;
  stockData?: StockData;
}

const SUGGESTED_QUESTIONS = [
  '투자 매력도는?',
  '지금 매수해도 괜찮을까요?',
  '장기 투자 관점은?',
  '주요 리스크는?',
];

// 순서대로 처리할 전문가 목록
const EXPERT_ORDER: CharacterType[] = ['claude', 'gemini', 'gpt'];

export function MultiExpertConsultation({ 
  isOpen, 
  onClose, 
  stockSymbol, 
  stockName,
  stockData,
}: MultiExpertConsultationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentExpertIndex, setCurrentExpertIndex] = useState(-1);
  const [displayText, setDisplayText] = useState('');
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 현재 응답 중인 전문가
  const currentExpert = currentExpertIndex >= 0 ? EXPERT_ORDER[currentExpertIndex] : null;
  
  // 완료된 전문가 목록
  const completedExperts = EXPERT_ORDER.slice(0, Math.max(0, currentExpertIndex));

  // 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayText]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && stockData && stockName) {
      setMessages([]);
      setInput('');
      setIsProcessing(false);
      setCurrentExpertIndex(-1);
      setDisplayText('');
      setIsTypingAnimation(false);
      
      // 초기 분석 시작
      requestExpertAnalysis(true);
    }
    
    return () => {
      // 모달 닫힐 때 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, stockData, stockName]);

  // 타이핑 애니메이션
  const typeText = useCallback(async (text: string): Promise<void> => {
    setIsTypingAnimation(true);
    setDisplayText('');
    
    const chunkSize = 3;
    for (let i = 0; i <= text.length; i += chunkSize) {
      setDisplayText(text.substring(0, i));
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    setDisplayText(text);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsTypingAnimation(false);
  }, []);

  // 전문가 응답 요청
  const fetchExpertResponse = async (
    expert: CharacterType, 
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[],
    isInitial: boolean
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/consultation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterType: expert,
          messages: [...conversationHistory, { role: 'user', content: userMessage }],
          stockData,
          isInitialAnalysis: isInitial,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.content) {
        return data.data.content;
      }
      return null;
    } catch (error) {
      console.error(`${expert} response error:`, error);
      return null;
    }
  };

  // 순차적으로 전문가 분석 요청
  const requestExpertAnalysis = async (isInitial: boolean, userQuestion?: string) => {
    if (!stockData || !stockName) return;

    setIsProcessing(true);
    
    // 대화 히스토리 구성
    const conversationHistory = messages
      .filter(m => m.type === 'user' || m.characterType)
      .map(m => ({
        role: m.type === 'user' ? 'user' as const : 'assistant' as const,
        content: m.type === 'user' ? m.content : `[${CHARACTERS[m.characterType!].name}] ${m.content}`,
      }));

    const question = isInitial
      ? `${stockName}(${stockSymbol})에 대한 당신의 투자 관점과 핵심 의견을 간단히 말해주세요. 현재가 ${stockData.currentPrice?.toLocaleString() || '정보없음'}원입니다.`
      : userQuestion!;

    // 각 전문가를 순서대로 처리
    for (let i = 0; i < EXPERT_ORDER.length; i++) {
      const expert = EXPERT_ORDER[i];
      
      // 현재 전문가 설정
      setCurrentExpertIndex(i);
      setDisplayText('');
      
      // 잠시 대기 (로딩 표시)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // API 호출
      const response = await fetchExpertResponse(expert, question, conversationHistory, isInitial);
      
      if (response) {
        // 타이핑 애니메이션
        await typeText(response);
        
        // 메시지 추가
        const messageId = `${expert}-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'expert',
          content: response,
          characterType: expert,
          timestamp: new Date(),
        }]);
        
        // 히스토리에 추가
        conversationHistory.push({
          role: 'assistant',
          content: `[${CHARACTERS[expert].name}] ${response}`,
        });
      } else {
        // 에러 메시지 추가
        setMessages(prev => [...prev, {
          id: `${expert}-error-${Date.now()}`,
          type: 'expert',
          content: '응답을 받지 못했습니다.',
          characterType: expert,
          timestamp: new Date(),
        }]);
      }
      
      // 타이핑 상태 초기화
      setDisplayText('');
      
      // 다음 전문가 전 대기
      if (i < EXPERT_ORDER.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // 완료
    setCurrentExpertIndex(-1);
    setIsProcessing(false);
    inputRef.current?.focus();
  };

  // 질문 제출
  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = input.trim();
    setInput('');

    await requestExpertAnalysis(false, question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-900 rounded-2xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col border border-dark-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 bg-gradient-to-r from-claude-500/10 via-gemini-500/10 to-gpt-500/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {EXPERT_ORDER.map((char) => (
                  <div key={char} className="ring-2 ring-dark-900 rounded-full">
                    <CharacterAvatar character={char} size="sm" />
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">3인 전문가 상담</h2>
                {stockName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-400">{stockName}</span>
                    <span className="text-xs text-dark-500 font-mono">{stockSymbol}</span>
                    {stockData && stockData.currentPrice > 0 && (
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
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 초기 로딩 (메시지 없고 처리 중일 때) */}
          {messages.length === 0 && isProcessing && currentExpertIndex === 0 && !displayText && (
            <div className="text-center py-8">
              {/* 스피너 */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 border-r-purple-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-500 border-l-amber-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 animate-pulse" />
              </div>
              
              <div className="flex justify-center gap-4 mb-4">
                {EXPERT_ORDER.map((char, idx) => (
                  <div 
                    key={char} 
                    className={`relative transition-all duration-500 ${idx === 0 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}
                  >
                    <CharacterAvatar character={char} size="lg" />
                    {idx === 0 && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-dark-300 text-sm font-medium mb-2">
                {stockName}에 대한 전문가 의견을 수집하고 있습니다
              </p>
              
              {/* 진행 상태 */}
              <div className="flex items-center justify-center gap-2 text-xs text-dark-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Claude Lee
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-dark-600" />
                  제미나인
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-dark-600" />
                  G.P. Taylor
                </span>
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((message) => {
            if (message.type === 'user') {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[80%] p-3 rounded-2xl rounded-br-sm bg-brand-500 text-white">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs text-brand-200 mt-1">
                      {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            } else {
              const char = CHARACTERS[message.characterType!];
              return (
                <div key={message.id} className="flex gap-3">
                  <CharacterAvatar character={message.characterType!} size="md" />
                  <div className={`max-w-[85%] p-3 rounded-2xl rounded-bl-sm ${char.bgColor}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${char.color}`}>{char.name}</span>
                      <span className="text-[10px] text-dark-500">{char.role}</span>
                    </div>
                    <p className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="text-xs text-dark-500 mt-1">
                      {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            }
          })}

          {/* 현재 타이핑 중인 메시지 */}
          {currentExpert && displayText && (
            <div className="flex gap-3">
              <CharacterAvatar character={currentExpert} size="md" />
              <div className={`max-w-[85%] p-3 rounded-2xl rounded-bl-sm ${CHARACTERS[currentExpert].bgColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${CHARACTERS[currentExpert].color}`}>
                    {CHARACTERS[currentExpert].name}
                  </span>
                </div>
                <p className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed">
                  {displayText}
                  {isTypingAnimation && (
                    <span className="inline-block w-0.5 h-4 bg-dark-300 ml-0.5 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 다음 전문가 로딩 표시 (타이핑 중이 아닐 때) */}
          {isProcessing && currentExpert && !displayText && (
            <div className="flex gap-3">
              <CharacterAvatar character={currentExpert} size="md" />
              <div className={`p-3 rounded-2xl rounded-bl-sm ${CHARACTERS[currentExpert].bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${CHARACTERS[currentExpert].color}`}>
                    {CHARACTERS[currentExpert].name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* 진행 상태 표시 (처리 중일 때) */}
          {isProcessing && messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-dark-500 py-2">
              {EXPERT_ORDER.map((expert, idx) => {
                const isCompleted = messages.some(m => m.characterType === expert);
                const isCurrent = expert === currentExpert;
                const isPending = !isCompleted && !isCurrent;
                
                return (
                  <span key={expert} className="inline-flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-500' : 
                      isCurrent ? `${expert === 'claude' ? 'bg-blue-500' : expert === 'gemini' ? 'bg-purple-500' : 'bg-amber-500'} animate-pulse` : 
                      'bg-dark-600'
                    }`} />
                    <span className={isCompleted ? 'text-green-500' : isCurrent ? 'text-white' : 'text-dark-600'}>
                      {CHARACTERS[expert].name}
                    </span>
                    {idx < EXPERT_ORDER.length - 1 && <span className="mx-1">→</span>}
                  </span>
                );
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length > 0 && !isProcessing && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
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

        {/* Input */}
        <div className="p-4 border-t border-dark-800 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isProcessing ? '전문가들이 응답 중...' : '3명의 전문가에게 질문하세요...'}
              disabled={isProcessing}
              rows={1}
              className={`flex-1 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-brand-500 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className={`px-4 rounded-xl font-medium transition-colors ${
                input.trim() && !isProcessing
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:opacity-90'
                  : 'bg-dark-800 text-dark-600 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-dark-600 mt-2 text-center">
            3명의 전문가가 순차적으로 답변합니다. 각 의견은 참고용입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
