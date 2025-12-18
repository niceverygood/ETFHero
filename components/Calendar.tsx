'use client';

import { useState, useEffect } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '@/lib/characters';
import type { CharacterType } from '@/lib/types';

interface Top5Item {
  rank: number;
  etfTicker: string;
  etfName: string;
  category: string;
  avgScore: number;
  claudeScore?: number;
  geminiScore?: number;
  gptScore?: number;
  targetReturn?: number;
  timeHorizon?: string;
  expenseRatio?: number;
}

interface DailyVerdict {
  date: string;
  top5: Top5Item[];
  isGenerated: boolean;
}

interface DebateMessage {
  id: string;
  character: CharacterType;
  content: string;
  score: number;
  targetReturn?: number;
  timeHorizon?: string;
  risks: string[];
  round: number;
}

interface CalendarProps {
  onDateSelect?: (date: string, verdict: DailyVerdict | null) => void;
}

// ETF Categories
const CATEGORIES = [
  { id: 'all', name: '전체', icon: '📊' },
  { id: 'US Large Cap', name: '미국 대형', icon: '🇺🇸' },
  { id: 'Technology', name: '기술', icon: '💻' },
  { id: 'Dividend', name: '배당', icon: '💰' },
  { id: 'Bond', name: '채권', icon: '📜' },
  { id: 'International', name: '해외', icon: '🌍' },
  { id: 'Thematic', name: '테마', icon: '🎯' },
];

export function Calendar({ onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [verdicts, setVerdicts] = useState<Record<string, DailyVerdict>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchMonthVerdicts();
  }, [currentMonth]);

  async function fetchMonthVerdicts() {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    try {
      const res = await fetch(`/api/calendar/verdicts?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success) {
        const verdictMap: Record<string, DailyVerdict> = {};
        data.data.forEach((v: DailyVerdict) => {
          verdictMap[v.date] = v;
        });
        setVerdicts(verdictMap);
      }
    } catch (error) {
      console.error('Failed to fetch verdicts:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  }

  function formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function handleDateClick(dateStr: string) {
    setSelectedDate(dateStr);
    const verdict = verdicts[dateStr] || null;
    onDateSelect?.(dateStr, verdict);
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[80px] md:min-h-[96px]" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const verdict = verdicts[dateStr];
    const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = dateStr === selectedDate;
    const isPast = new Date(dateStr) < today;
    const isWeekend = (startingDay + day - 1) % 7 === 0 || (startingDay + day - 1) % 7 === 6;

    days.push(
      <div
        key={day}
        onClick={() => handleDateClick(dateStr)}
        className={`
          min-h-[60px] sm:min-h-[80px] md:min-h-[96px] p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border
          ${isSelected ? 'border-brand-500 bg-brand-500/10' : 'border-dark-800/50 hover:border-dark-700'}
          ${isToday ? 'ring-2 ring-brand-500/50' : ''}
          ${isPast ? 'opacity-70' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <span className={`
            text-xs sm:text-sm font-medium
            ${isToday ? 'text-brand-400' : isWeekend ? 'text-dark-500' : 'text-dark-300'}
          `}>
            {day}
          </span>
          {verdict && (
            <span className={`
              w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0
              ${verdict.isGenerated ? 'bg-emerald-500' : 'bg-amber-500'}
            `} />
          )}
        </div>
        
        {verdict && (
          <div className="space-y-0 sm:space-y-0.5 overflow-hidden">
            {verdict.top5.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-0.5 sm:gap-1 text-2xs sm:text-xs">
                <span className="text-dark-600 shrink-0">{i + 1}</span>
                <span className="text-dark-400 truncate font-mono">{item.etfTicker}</span>
              </div>
            ))}
            {verdict.top5.length > 3 && (
              <div className="text-2xs sm:text-xs text-dark-600 truncate">+{verdict.top5.length - 3} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-dark-100">
          AI ETF Pick Calendar
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm sm:text-base md:text-lg font-semibold text-dark-200 min-w-[90px] sm:min-w-[120px] text-center">
            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-2xs sm:text-xs">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-dark-500">AI Generated</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-dark-500">Historical</span>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-2">
        {dayNames.map((name, i) => (
          <div
            key={name}
            className={`text-center text-xs sm:text-sm font-medium py-1 sm:py-2 ${
              i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-dark-500'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[60px] sm:min-h-[80px] md:min-h-[96px] rounded-lg sm:rounded-xl bg-dark-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
          {days}
        </div>
      )}
    </div>
  );
}

interface VerdictDetailProps {
  date: string;
  verdict: DailyVerdict | null;
  onGenerateClick?: () => void;
  isGenerating?: boolean;
}

export function VerdictDetail({ date, verdict, onGenerateClick, isGenerating }: VerdictDetailProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedETF, setSelectedETF] = useState<Top5Item | null>(null);
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [loadingDebate, setLoadingDebate] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  const isToday = selectedDate.getTime() === today.getTime();
  const isFuture = selectedDate > today;

  // Filter ETFs by category
  const filteredETFs = verdict?.top5.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  }) || [];

  // Fetch debate history when an ETF is selected
  async function fetchDebateHistory(ticker: string) {
    setLoadingDebate(true);
    try {
      const res = await fetch(`/api/debate/history?symbol=${ticker}&date=${date}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDebateMessages(data.data.messages || []);
      } else {
        setDebateMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch debate history:', error);
      setDebateMessages([]);
    } finally {
      setLoadingDebate(false);
    }
  }

  function handleETFClick(etf: Top5Item) {
    setSelectedETF(etf);
    fetchDebateHistory(etf.etfTicker);
  }

  function handleBackToList() {
    setSelectedETF(null);
    setDebateMessages([]);
  }

  if (isFuture) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-dark-200 mb-2">Coming Soon</h3>
        <p className="text-dark-500">이 날짜의 AI 분석은 아직 준비되지 않았습니다.</p>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold text-dark-200 mb-2">
          {isToday ? "오늘의 Top 5 ETF 생성하기" : "데이터 없음"}
        </h3>
        <p className="text-dark-500 mb-6">
          {isToday 
            ? "AI 3대장이 오늘의 추천 ETF를 선정합니다."
            : "이 날짜의 추천 데이터가 없습니다."
          }
        </p>
        {isToday && (
          <button
            onClick={onGenerateClick}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? 'AI 분석 중...' : 'Top 5 ETF 생성하기'}
          </button>
        )}
      </div>
    );
  }

  // Show ETF detail with debate history
  if (selectedETF) {
    return (
      <div className="card">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-dark-400 hover:text-dark-200 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>목록으로 돌아가기</span>
        </button>

        {/* ETF Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center text-lg font-bold text-brand-400 font-mono">
              {selectedETF.etfTicker.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark-100 font-mono">{selectedETF.etfTicker}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-400">{selectedETF.etfName}</span>
                <span className="text-dark-600">|</span>
                <span className="text-dark-500">{selectedETF.category}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">{selectedETF.avgScore.toFixed(1)}</div>
            <div className="text-xs text-dark-500">Average Score</div>
          </div>
        </div>

        {/* AI Scores */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['claude', 'gemini', 'gpt'] as const).map((charId) => {
            const char = CHARACTERS[charId];
            const score = charId === 'claude' ? selectedETF.claudeScore :
                         charId === 'gemini' ? selectedETF.geminiScore :
                         selectedETF.gptScore;
            return (
              <div key={charId} className={`p-3 rounded-xl ${char.bgColor} border border-current/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <CharacterAvatar character={charId} size="sm" />
                  <span className="text-xs text-dark-400">{char.name}</span>
                </div>
                <div className={`text-lg font-bold ${char.color}`}>
                  {score?.toFixed(1) || '-'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Target Return Summary */}
        <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-dark-500 mb-1">예상 수익률</div>
              <div className="text-xl font-bold text-emerald-400">
                +{selectedETF.targetReturn?.toFixed(1) || '-'}%
              </div>
            </div>
            {selectedETF.timeHorizon && (
              <div className="text-right">
                <div className="text-xs text-dark-500 mb-1">투자 기간</div>
                <div className="text-sm font-medium text-dark-200">{selectedETF.timeHorizon}</div>
              </div>
            )}
            {selectedETF.expenseRatio && (
              <div className="text-right">
                <div className="text-xs text-dark-500 mb-1">총보수</div>
                <div className="text-sm font-medium text-dark-200">{(selectedETF.expenseRatio * 100).toFixed(2)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Debate History */}
        <div>
          <h4 className="font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            토론 내용 복기
          </h4>

          {loadingDebate ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-dark-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-dark-800 rounded w-1/4" />
                    <div className="h-20 bg-dark-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : debateMessages.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {debateMessages.map((msg, i) => {
                const char = CHARACTERS[msg.character];
                return (
                  <div key={msg.id || i} className="flex gap-3">
                    <CharacterAvatar character={msg.character} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-dark-200 text-sm">{char.name}</span>
                        <span className={`text-xs ${char.color}`}>{char.roleKo}</span>
                        <span className="text-xs text-dark-600">Round {msg.round}</span>
                      </div>
                      <div className={`p-3 rounded-xl rounded-tl-sm ${char.bgColor} border border-current/10`}>
                        <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        {msg.targetReturn && (
                          <div className="mt-2 pt-2 border-t border-dark-700/50 flex items-center gap-4">
                            <div>
                              <span className="text-xs text-dark-500">예상 수익률: </span>
                              <span className={`text-sm font-semibold ${char.color}`}>
                                +{msg.targetReturn.toFixed(1)}%
                              </span>
                            </div>
                            {msg.timeHorizon && (
                              <div>
                                <span className="text-xs text-dark-500">투자 기간: </span>
                                <span className="text-sm text-dark-300">{msg.timeHorizon}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-dark-500">저장된 토론 내용이 없습니다.</p>
              <p className="text-sm text-dark-600 mt-1">
                새 토론을 시작하려면 Battle 페이지를 방문하세요.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show category tabs and ETF list
  return (
    <div className="card p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-100 truncate">
            {new Date(date).toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`
              px-2 py-0.5 rounded text-2xs sm:text-xs font-medium shrink-0
              ${verdict.isGenerated 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-amber-500/10 text-amber-400'
              }
            `}>
              {verdict.isGenerated ? 'AI Generated' : 'Historical'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs - Horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 mb-4 sm:mb-6">
        <div className="flex gap-1.5 sm:gap-2 min-w-max pb-1">
          {CATEGORIES.map((cat) => {
            const count = verdict.top5.filter(item => {
              if (cat.id === 'all') return true;
              return item.category === cat.id;
            }).length;
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                  ${selectedCategory === cat.id
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-dark-800/50 text-dark-400 border border-dark-700/50 hover:bg-dark-800'
                  }
                  ${count === 0 ? 'opacity-50' : ''}
                `}
                disabled={count === 0}
              >
                <span className="mr-1">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
                {count > 0 && (
                  <span className="ml-1 sm:ml-1.5 px-1 sm:px-1.5 py-0.5 rounded bg-dark-700/50 text-2xs sm:text-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ETF List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredETFs.length > 0 ? (
          filteredETFs.map((item, i) => (
            <button
              key={item.etfTicker}
              onClick={() => handleETFClick(item)}
              className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors group text-left"
            >
              {/* Rank Badge */}
              <div className={`
                w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm
                ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 
                  i === 1 ? 'bg-gray-400/20 text-gray-400' : 
                  i === 2 ? 'bg-amber-700/20 text-amber-600' : 
                  'bg-dark-700 text-dark-400'}
              `}>
                {item.rank}
              </div>
              
              {/* ETF Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs sm:text-sm md:text-base text-dark-200 group-hover:text-dark-100 transition-colors truncate font-mono">
                  {item.etfTicker}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-2xs sm:text-xs text-dark-500 mt-0.5">
                  <span className="truncate">{item.etfName}</span>
                  <span className="hidden sm:inline text-dark-600 shrink-0">|</span>
                  <span className="hidden sm:inline shrink-0">{item.category}</span>
                </div>
              </div>
              
              {/* AI Scores Preview - hide on small screens */}
              <div className="hidden lg:flex items-center gap-1 shrink-0">
                {(['claude', 'gemini', 'gpt'] as const).map((charId) => {
                  const score = charId === 'claude' ? item.claudeScore :
                               charId === 'gemini' ? item.geminiScore :
                               item.gptScore;
                  const char = CHARACTERS[charId];
                  return score ? (
                    <div key={charId} className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-2xs md:text-xs font-bold ${char.bgColor} ${char.color}`}>
                      {score.toFixed(0)}
                    </div>
                  ) : null;
                })}
              </div>
              
              {/* Score & Return */}
              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-semibold text-brand-400 whitespace-nowrap">{item.avgScore.toFixed(1)}</div>
                {item.targetReturn && (
                  <div className="text-2xs sm:text-xs text-emerald-400">+{item.targetReturn.toFixed(1)}%</div>
                )}
              </div>
              
              {/* Arrow */}
              <svg className="w-4 h-4 shrink-0 text-dark-600 group-hover:text-dark-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📭</div>
            <p className="text-xs sm:text-sm text-dark-500">선택한 카테고리에 해당하는 ETF가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="mt-4 sm:mt-6 p-2.5 sm:p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
        <div className="flex items-start gap-1.5 sm:gap-2">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-2xs sm:text-xs text-dark-400">
            ETF를 클릭하면 AI 3대장의 토론 내용을 복기할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
