'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DisclaimerBar, Header } from '@/components';
import { POPULAR_HOLDINGS } from '@/lib/data/etf-holdings';

interface ETFResult {
  etfTicker: string;
  etfName: string;
  etfNameKo: string;
  holdingWeight: number;
  holdingRank: number;
  etfCategory: string;
  etfExpenseRatio?: number;
  etfIssuer?: string;
  etfDescription?: string;
}

interface HoldingInfo {
  ticker: string;
  name: string;
  nameKo: string;
}

export default function HoldingsSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ETFResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [popularHoldings, setPopularHoldings] = useState<HoldingInfo[]>(POPULAR_HOLDINGS);

  // 검색 실행
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchedQuery('');
      return;
    }

    setIsLoading(true);
    setSearchedQuery(searchQuery);

    try {
      const res = await fetch(`/api/etf/by-holding?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // 인기 종목 클릭
  const handlePopularClick = (ticker: string) => {
    setQuery(ticker);
    handleSearch(ticker);
  };

  // 비중에 따른 색상
  const getWeightColor = (weight: number): string => {
    if (weight >= 10) return 'text-emerald-400';
    if (weight >= 5) return 'text-brand-400';
    if (weight >= 2) return 'text-yellow-400';
    return 'text-dark-400';
  };

  // 비중에 따른 배경색
  const getWeightBg = (weight: number): string => {
    if (weight >= 10) return 'bg-emerald-500/20';
    if (weight >= 5) return 'bg-brand-500/20';
    if (weight >= 2) return 'bg-yellow-500/20';
    return 'bg-dark-700/50';
  };

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-24 pb-20">
        <div className="container-app">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-sm text-brand-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              New Feature
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-dark-50">종목으로 </span>
              <span className="gradient-text">ETF 찾기</span>
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              관심 종목을 검색하면 해당 종목이 포함된 ETF를 찾아드립니다.
              <br />
              각 ETF에서 해당 종목이 차지하는 비중도 확인하세요!
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="종목명 또는 티커 검색 (예: 테슬라, NVDA, 애플)"
                className="w-full px-6 py-4 pl-14 rounded-2xl bg-dark-800/50 border border-dark-700 text-dark-100 placeholder:text-dark-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-lg"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                onClick={() => handleSearch(query)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          {/* Popular Holdings */}
          {!searchedQuery && (
            <div className="max-w-2xl mx-auto mb-12">
              <p className="text-sm text-dark-500 mb-3 text-center">🔥 인기 검색 종목</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularHoldings.map((holding) => (
                  <button
                    key={holding.ticker}
                    onClick={() => handlePopularClick(holding.ticker)}
                    className="px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700 text-dark-300 hover:border-brand-500 hover:text-brand-400 transition-all text-sm"
                  >
                    <span className="font-mono text-brand-400">{holding.ticker}</span>
                    <span className="text-dark-500 mx-1">·</span>
                    <span>{holding.nameKo}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {searchedQuery && (
            <div className="max-w-4xl mx-auto">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-dark-100">
                    &quot;{searchedQuery}&quot; 검색 결과
                  </h2>
                  <p className="text-dark-500 text-sm mt-1">
                    {results.length}개의 ETF에서 해당 종목을 보유하고 있습니다
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuery('');
                    setSearchedQuery('');
                    setResults([]);
                  }}
                  className="px-4 py-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors text-sm"
                >
                  검색 초기화
                </button>
              </div>

              {/* Results Grid */}
              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-dark-700" />
                        <div className="flex-1">
                          <div className="h-5 bg-dark-700 rounded w-32 mb-2" />
                          <div className="h-4 bg-dark-700 rounded w-48" />
                        </div>
                        <div className="h-10 bg-dark-700 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid gap-4">
                  {results.map((result, index) => (
                    <Link
                      key={result.etfTicker}
                      href={`/battle/${result.etfTicker}`}
                      className="card card-interactive group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                          'bg-dark-700 text-dark-400'
                        }`}>
                          {index + 1}
                        </div>

                        {/* ETF Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark-100 group-hover:text-white transition-colors">
                              {result.etfNameKo}
                            </span>
                            <span className="text-sm text-dark-500 font-mono">
                              {result.etfTicker}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="px-2 py-0.5 rounded bg-dark-700 text-dark-400">
                              {result.etfCategory}
                            </span>
                            {result.etfExpenseRatio && (
                              <span className="text-dark-500">
                                보수 {result.etfExpenseRatio.toFixed(2)}%
                              </span>
                            )}
                            {result.etfIssuer && (
                              <span className="text-dark-500 hidden sm:inline">
                                · {result.etfIssuer}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Weight Badge */}
                        <div className="text-right">
                          <div className={`px-4 py-2 rounded-xl ${getWeightBg(result.holdingWeight)}`}>
                            <div className={`text-lg font-bold ${getWeightColor(result.holdingWeight)}`}>
                              {result.holdingWeight.toFixed(1)}%
                            </div>
                            <div className="text-xs text-dark-500">
                              #{result.holdingRank} 보유
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg
                          className="w-5 h-5 text-dark-600 group-hover:text-brand-400 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-dark-300 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-dark-500">
                    다른 종목명이나 티커로 검색해보세요
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          {!searchedQuery && (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="card border border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent">
                <h3 className="font-semibold text-dark-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  이렇게 활용하세요
                </h3>
                <ul className="space-y-2 text-dark-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">•</span>
                    <span>특정 기업에 투자하고 싶지만 개별 주식 구매가 부담될 때, 해당 종목 비중이 높은 ETF를 찾아보세요.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">•</span>
                    <span>이미 보유한 ETF에 관심 종목이 포함되어 있는지 확인할 수 있습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">•</span>
                    <span>비중이 높을수록 해당 종목의 성과가 ETF 수익률에 더 큰 영향을 미칩니다.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
      <DisclaimerBar variant="bottom" compact />
    </>
  );
}

