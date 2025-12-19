'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DIVIDEND_ETFS, type ETFDividendInfo, type DividendEvent } from '@/lib/data/dividend-data';

interface Holding {
  ticker: string;
  name: string;
  shares: number;
  dividendYield: number;
  frequency: string;
}

interface DividendSummary {
  totalAnnualDividend: number;
  monthlyAverage: number;
  holdingsCount: number;
}

interface MonthlyBreakdown {
  month: number;
  amount: number;
}

const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const FREQUENCY_KO: Record<string, string> = {
  monthly: '월배당',
  quarterly: '분기배당',
  'semi-annual': '반기배당',
  annual: '연배당',
};

export default function DividendCalendarPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ETFDividendInfo[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sharesInput, setSharesInput] = useState<Record<string, string>>({});
  
  // 계산 결과
  const [summary, setSummary] = useState<DividendSummary | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [upcomingDividends, setUpcomingDividends] = useState<DividendEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<{ month: number; events: DividendEvent[] }[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 현재 연도/월
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calendar'>('portfolio');

  // ETF 검색
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim().length >= 1) {
      const lowerQuery = query.toLowerCase();
      const filtered = DIVIDEND_ETFS.filter(
        etf =>
          etf.ticker.toLowerCase().includes(lowerQuery) ||
          etf.name.toLowerCase().includes(lowerQuery) ||
          etf.nameKo.includes(query)
      ).slice(0, 8);
      setSearchResults(filtered);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  // ETF 추가
  const addETF = (etf: ETFDividendInfo) => {
    if (holdings.some(h => h.ticker === etf.ticker)) {
      setSearchTerm('');
      setShowSearch(false);
      return;
    }
    
    setHoldings([...holdings, {
      ticker: etf.ticker,
      name: etf.nameKo,
      shares: 0,
      dividendYield: etf.dividendYield,
      frequency: etf.frequency,
    }]);
    setSearchTerm('');
    setShowSearch(false);
  };

  // ETF 제거
  const removeETF = (ticker: string) => {
    setHoldings(holdings.filter(h => h.ticker !== ticker));
    const newSharesInput = { ...sharesInput };
    delete newSharesInput[ticker];
    setSharesInput(newSharesInput);
  };

  // 주식 수 업데이트
  const updateShares = (ticker: string, value: string) => {
    setSharesInput({ ...sharesInput, [ticker]: value });
    const shares = parseInt(value) || 0;
    setHoldings(holdings.map(h => h.ticker === ticker ? { ...h, shares } : h));
  };

  // 배당금 계산
  const calculateDividends = useCallback(async () => {
    const validHoldings = holdings.filter(h => h.shares > 0);
    if (validHoldings.length === 0) {
      setSummary(null);
      setMonthlyBreakdown([]);
      setUpcomingDividends([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/dividend/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: validHoldings.map(h => ({ ticker: h.ticker, shares: h.shares })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSummary(data.data.summary);
        setMonthlyBreakdown(data.data.monthlyBreakdown);
        setUpcomingDividends(data.data.upcomingDividends);
      }
    } catch (error) {
      console.error('Failed to calculate dividends:', error);
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  // 캘린더 데이터 로드
  const loadCalendar = useCallback(async () => {
    try {
      const response = await fetch(`/api/dividend/calendar?year=${selectedYear}`);
      const data = await response.json();
      if (data.success) {
        setCalendarEvents(data.data.monthlyEvents);
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  }, [selectedYear]);

  useEffect(() => {
    calculateDividends();
  }, [calculateDividends]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendar();
    }
  }, [activeTab, loadCalendar]);

  // 프리셋 적용
  const applyPreset = (preset: 'income' | 'growth' | 'monthly') => {
    let newHoldings: Holding[] = [];
    let newSharesInput: Record<string, string> = {};
    
    if (preset === 'income') {
      // 고배당 포트폴리오
      const tickers = ['SCHD', 'VYM', 'HDV'];
      tickers.forEach(t => {
        const etf = DIVIDEND_ETFS.find(e => e.ticker === t);
        if (etf) {
          newHoldings.push({
            ticker: etf.ticker,
            name: etf.nameKo,
            shares: 100,
            dividendYield: etf.dividendYield,
            frequency: etf.frequency,
          });
          newSharesInput[t] = '100';
        }
      });
    } else if (preset === 'monthly') {
      // 월배당 포트폴리오
      const tickers = ['JEPI', 'JEPQ', 'QYLD'];
      tickers.forEach(t => {
        const etf = DIVIDEND_ETFS.find(e => e.ticker === t);
        if (etf) {
          newHoldings.push({
            ticker: etf.ticker,
            name: etf.nameKo,
            shares: 100,
            dividendYield: etf.dividendYield,
            frequency: etf.frequency,
          });
          newSharesInput[t] = '100';
        }
      });
    } else {
      // 배당 성장 포트폴리오
      const tickers = ['VIG', 'DGRO', 'VOO'];
      tickers.forEach(t => {
        const etf = DIVIDEND_ETFS.find(e => e.ticker === t);
        if (etf) {
          newHoldings.push({
            ticker: etf.ticker,
            name: etf.nameKo,
            shares: 100,
            dividendYield: etf.dividendYield,
            frequency: etf.frequency,
          });
          newSharesInput[t] = '100';
        }
      });
    }
    
    setHoldings(newHoldings);
    setSharesInput(newSharesInput);
  };

  // 월별 차트 최대값
  const maxMonthlyAmount = Math.max(...monthlyBreakdown.map(m => m.amount), 1);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-emerald-900/20 to-dark-950 py-12">
        <div className="container-app">
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <Link href="/" className="hover:text-emerald-300">홈</Link>
            <span>/</span>
            <span className="text-dark-300">배당 캘린더</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            💰 배당 캘린더
          </h1>
          <p className="text-dark-300 text-lg">
            보유 ETF의 배당 일정을 확인하고 예상 배당금을 계산하세요
          </p>
        </div>
      </div>

      <div className="container-app py-8">
        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'portfolio'
                ? 'bg-emerald-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            💼 내 포트폴리오
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'calendar'
                ? 'bg-emerald-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            📅 배당 캘린더
          </button>
        </div>

        {activeTab === 'portfolio' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 왼쪽: 포트폴리오 입력 */}
            <div className="space-y-6">
              {/* 프리셋 */}
              <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                <h3 className="text-lg font-semibold mb-4">🎯 추천 포트폴리오</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => applyPreset('income')}
                    className="p-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-emerald-500 transition-all text-center"
                  >
                    <div className="text-2xl mb-2">💵</div>
                    <div className="font-medium text-sm">고배당</div>
                    <div className="text-xs text-dark-400 mt-1">SCHD, VYM, HDV</div>
                  </button>
                  <button
                    onClick={() => applyPreset('monthly')}
                    className="p-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-emerald-500 transition-all text-center"
                  >
                    <div className="text-2xl mb-2">📆</div>
                    <div className="font-medium text-sm">월배당</div>
                    <div className="text-xs text-dark-400 mt-1">JEPI, JEPQ, QYLD</div>
                  </button>
                  <button
                    onClick={() => applyPreset('growth')}
                    className="p-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-emerald-500 transition-all text-center"
                  >
                    <div className="text-2xl mb-2">📈</div>
                    <div className="font-medium text-sm">배당 성장</div>
                    <div className="text-xs text-dark-400 mt-1">VIG, DGRO, VOO</div>
                  </button>
                </div>
              </div>

              {/* ETF 보유 목록 */}
              <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                <h3 className="text-lg font-semibold mb-4">💼 보유 ETF</h3>
                
                {/* ETF 검색 */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="배당 ETF 검색 (예: SCHD, JEPI)"
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 focus:border-emerald-500 focus:outline-none"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden">
                      {searchResults.map(etf => (
                        <button
                          key={etf.ticker}
                          onClick={() => addETF(etf)}
                          className="w-full px-4 py-3 text-left hover:bg-dark-700 flex items-center justify-between"
                        >
                          <span>
                            <span className="font-medium">{etf.ticker}</span>
                            <span className="text-dark-400 ml-2">{etf.nameKo}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 text-sm">{etf.dividendYield}%</span>
                            <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded">
                              {FREQUENCY_KO[etf.frequency]}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 보유 목록 */}
                {holdings.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p>보유 ETF를 추가해주세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holdings.map(holding => (
                      <div key={holding.ticker} className="flex items-center gap-3 bg-dark-800 rounded-xl p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{holding.ticker}</span>
                            <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded">
                              {FREQUENCY_KO[holding.frequency]}
                            </span>
                          </div>
                          <div className="text-sm text-dark-400">{holding.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-medium">{holding.dividendYield}%</span>
                          <input
                            type="number"
                            value={sharesInput[holding.ticker] || ''}
                            onChange={e => updateShares(holding.ticker, e.target.value)}
                            placeholder="주"
                            className="w-20 px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-center text-sm"
                            min="0"
                          />
                          <button
                            onClick={() => removeETF(holding.ticker)}
                            className="p-2 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 배당 요약 */}
            <div className="space-y-6">
              {/* 연간 배당 요약 */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-dark-900 rounded-2xl p-6 border border-emerald-800/30">
                <h3 className="text-lg font-semibold mb-4">📊 예상 배당금</h3>
                
                {summary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="text-sm text-dark-400 mb-1">연간 예상 배당</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${summary.totalAnnualDividend.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="text-sm text-dark-400 mb-1">월평균 배당</div>
                        <div className="text-2xl font-bold text-white">
                          ${summary.monthlyAverage.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-dark-400 text-center">
                      {summary.holdingsCount}개 배당 ETF 보유 중
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <p>보유 ETF와 주식 수를 입력하면</p>
                    <p>예상 배당금이 계산됩니다</p>
                  </div>
                )}
              </div>

              {/* 월별 배당 차트 */}
              {monthlyBreakdown.length > 0 && (
                <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                  <h3 className="text-lg font-semibold mb-4">📆 월별 배당금</h3>
                  <div className="space-y-2">
                    {monthlyBreakdown.map((m, idx) => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="w-10 text-sm text-dark-400">{MONTHS_KO[idx]}</span>
                        <div className="flex-1 h-6 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${(m.amount / maxMonthlyAmount) * 100}%` }}
                          />
                        </div>
                        <span className={`w-16 text-sm text-right ${m.amount > 0 ? 'text-emerald-400' : 'text-dark-500'}`}>
                          ${m.amount.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 다가오는 배당 */}
              {upcomingDividends.length > 0 && (
                <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                  <h3 className="text-lg font-semibold mb-4">⏰ 다가오는 배당</h3>
                  <div className="space-y-3">
                    {upcomingDividends.slice(0, 5).map((event, idx) => (
                      <div key={`${event.ticker}-${idx}`} className="flex items-center justify-between bg-dark-800 rounded-xl p-3">
                        <div>
                          <div className="font-medium">{event.ticker}</div>
                          <div className="text-xs text-dark-400">배당락: {event.exDividendDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-medium">${event.dividendAmount}</div>
                          <div className="text-xs text-dark-400">지급: {event.paymentDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 캘린더 뷰 */
          <div className="space-y-6">
            {/* 연도 선택 */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xl font-bold">{selectedYear}년</span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 월별 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {calendarEvents.map(({ month, events }) => (
                <div
                  key={month}
                  className={`bg-dark-900 rounded-2xl p-4 border transition cursor-pointer hover:border-emerald-500 ${
                    selectedMonth === month ? 'border-emerald-500' : 'border-dark-800'
                  }`}
                  onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">{MONTHS_KO[month - 1]}</span>
                    <span className="text-xs bg-dark-800 px-2 py-1 rounded-full">
                      {events.length}개 ETF
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {events.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-dark-300">{event.ticker}</span>
                        <span className="text-emerald-400">${event.dividendAmount}</span>
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-dark-500 text-center">
                        +{events.length - 3}개 더보기
                      </div>
                    )}
                    {events.length === 0 && (
                      <div className="text-xs text-dark-500 text-center py-2">
                        배당 없음
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 선택된 월 상세 */}
            {selectedMonth && (
              <div className="bg-dark-900 rounded-2xl p-6 border border-emerald-800/50">
                <h3 className="text-lg font-semibold mb-4">
                  📅 {selectedYear}년 {MONTHS_KO[selectedMonth - 1]} 배당 일정
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendarEvents
                    .find(c => c.month === selectedMonth)
                    ?.events.map((event, idx) => (
                      <div key={idx} className="bg-dark-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">{event.ticker}</span>
                          <span className="text-xs bg-dark-700 px-2 py-0.5 rounded">
                            {event.category}
                          </span>
                        </div>
                        <div className="text-sm text-dark-400 mb-2">{event.nameKo}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-dark-500">배당락일</span>
                            <div className="text-dark-200">{event.exDividendDate}</div>
                          </div>
                          <div>
                            <span className="text-dark-500">지급일</span>
                            <div className="text-dark-200">{event.paymentDate}</div>
                          </div>
                          <div>
                            <span className="text-dark-500">배당금</span>
                            <div className="text-emerald-400 font-medium">${event.dividendAmount}</div>
                          </div>
                          <div>
                            <span className="text-dark-500">연 수익률</span>
                            <div className="text-emerald-400">{event.dividendYield}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 주요 배당 ETF 목록 */}
            <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
              <h3 className="text-lg font-semibold mb-4">💎 주요 배당 ETF</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DIVIDEND_ETFS.slice(0, 8).map(etf => (
                  <div key={etf.ticker} className="bg-dark-800 rounded-xl p-4 hover:bg-dark-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{etf.ticker}</span>
                      <span className="text-emerald-400 font-medium">{etf.dividendYield}%</span>
                    </div>
                    <div className="text-sm text-dark-400 mb-2 line-clamp-1">{etf.nameKo}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-500">{FREQUENCY_KO[etf.frequency]}</span>
                      <span className="text-dark-400">${etf.lastDividend}/주</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

