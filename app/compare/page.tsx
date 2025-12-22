'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { } from '@/components';
import { ALL_ETFS, POPULAR_ETFS, type ETFProduct } from '@/lib/data/etf-list';

interface CompareData {
  ticker: string;
  name: string;
  nameKo: string;
  issuer: string;
  category: string;
  assetClass: string;
  region: string;
  expenseRatio: number;
  aum?: number;
  description: string;
  return1m: number;
  return3m: number;
  return1y: number;
  return3y: number;
  dividendYield: number;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  topHoldings?: { ticker: string; name: string; weight: number }[];
}

interface Analysis {
  lowestExpense: { ticker: string; nameKo: string; value: number; label: string };
  highestReturn1y: { ticker: string; nameKo: string; value: number; label: string };
  highestDividend: { ticker: string; nameKo: string; value: number; label: string };
  largestAum: { ticker: string; nameKo: string; value: number; label: string };
}

// 비교 항목 정의
interface CompareField {
  key: string;
  label: string;
  format: (v: any) => string;
  highlight?: 'lowest' | 'highest';
}

const COMPARE_FIELDS: CompareField[] = [
  { key: 'issuer', label: '운용사', format: (v) => v || '-' },
  { key: 'category', label: '카테고리', format: (v) => v || '-' },
  { key: 'expenseRatio', label: '총보수', format: (v) => v != null ? `${v.toFixed(2)}%` : '-', highlight: 'lowest' },
  { key: 'aum', label: '운용자산(AUM)', format: (v) => v ? `$${v}B` : '-', highlight: 'highest' },
  { key: 'dividendYield', label: '배당률', format: (v) => v != null ? `${v.toFixed(2)}%` : '-', highlight: 'highest' },
  { key: 'return1m', label: '1개월 수익률', format: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '-', highlight: 'highest' },
  { key: 'return3m', label: '3개월 수익률', format: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '-', highlight: 'highest' },
  { key: 'return1y', label: '1년 수익률', format: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '-', highlight: 'highest' },
  { key: 'return3y', label: '3년 수익률', format: (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '-', highlight: 'highest' },
];

export default function ComparePage() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['SPY', 'VOO', 'QQQ']);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // ETF 검색 결과
  const searchResults = searchQuery.length > 0
    ? ALL_ETFS.filter(e =>
        e.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nameKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  // 비교 데이터 가져오기
  const fetchCompareData = useCallback(async () => {
    if (selectedTickers.length < 2) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/etf/compare?tickers=${selectedTickers.join(',')}&withPrice=true`);
      const data = await res.json();

      if (data.success) {
        setCompareData(data.data);
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Compare fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTickers]);

  useEffect(() => {
    fetchCompareData();
  }, [fetchCompareData]);

  // ETF 추가
  const addETF = (ticker: string) => {
    if (selectedTickers.length >= 5) {
      alert('최대 5개 ETF까지 비교할 수 있습니다.');
      return;
    }
    if (selectedTickers.includes(ticker)) {
      return;
    }
    setSelectedTickers([...selectedTickers, ticker]);
    setSearchQuery('');
    setShowSearch(false);
  };

  // ETF 제거
  const removeETF = (ticker: string) => {
    if (selectedTickers.length <= 2) {
      alert('최소 2개 ETF가 필요합니다.');
      return;
    }
    setSelectedTickers(selectedTickers.filter(t => t !== ticker));
  };

  // 최고/최저 값 찾기
  const findBestValue = (key: string, type: 'highest' | 'lowest') => {
    if (compareData.length === 0) return null;
    const values = compareData.map(d => (d as any)[key] as number).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return null;
    return type === 'highest' ? Math.max(...values) : Math.min(...values);
  };

  // 값이 최고/최저인지 확인
  const isBestValue = (value: number, key: string, type: 'highest' | 'lowest') => {
    const best = findBestValue(key, type);
    return best !== null && value === best;
  };

  // 수익률 색상
  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-dark-400';
  };

  return (
    <>
      <main className="min-h-screen bg-dark-950 pt-24 pb-20">
        <div className="container-app">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Compare Tool
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-dark-50">ETF </span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">비교 도구</span>
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              최대 5개 ETF를 나란히 비교하세요. 보수율, 수익률, 배당률, 구성종목까지 한눈에!
            </p>
          </div>

          {/* Selected ETFs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {selectedTickers.map((ticker) => (
              <div
                key={ticker}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-dark-700"
              >
                <span className="font-mono text-brand-400">{ticker}</span>
                <button
                  onClick={() => removeETF(ticker)}
                  className="w-5 h-5 rounded-full bg-dark-700 hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {selectedTickers.length < 5 && (
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-dark-600 text-dark-400 hover:border-brand-500 hover:text-brand-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  ETF 추가
                </button>

                {/* Search Dropdown */}
                {showSearch && (
                  <div className="absolute top-full mt-2 left-0 w-72 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ETF 검색..."
                      className="w-full px-4 py-3 bg-transparent border-b border-dark-700 text-dark-100 placeholder:text-dark-500 focus:outline-none"
                      autoFocus
                    />
                    <div className="max-h-60 overflow-y-auto">
                      {searchQuery.length === 0 ? (
                        <div className="p-2">
                          <p className="text-xs text-dark-500 px-2 py-1">인기 ETF</p>
                          {POPULAR_ETFS.filter(t => !selectedTickers.includes(t)).slice(0, 5).map(ticker => {
                            const etf = ALL_ETFS.find(e => e.ticker === ticker);
                            return etf ? (
                              <button
                                key={ticker}
                                onClick={() => addETF(ticker)}
                                className="w-full px-3 py-2 text-left hover:bg-dark-700 rounded-lg transition-colors"
                              >
                                <span className="font-mono text-brand-400">{etf.ticker}</span>
                                <span className="text-dark-400 ml-2 text-sm">{etf.nameKo}</span>
                              </button>
                            ) : null;
                          })}
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="p-2">
                          {searchResults.filter(e => !selectedTickers.includes(e.ticker)).map(etf => (
                            <button
                              key={etf.ticker}
                              onClick={() => addETF(etf.ticker)}
                              className="w-full px-3 py-2 text-left hover:bg-dark-700 rounded-lg transition-colors"
                            >
                              <span className="font-mono text-brand-400">{etf.ticker}</span>
                              <span className="text-dark-400 ml-2 text-sm">{etf.nameKo}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-dark-500 text-center py-4">검색 결과 없음</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="w-full px-4 py-2 text-sm text-dark-500 hover:text-dark-300 border-t border-dark-700"
                    >
                      닫기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analysis Summary */}
          {analysis && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { ...analysis.lowestExpense, icon: '💰', color: 'from-emerald-500 to-teal-500' },
                { ...analysis.highestReturn1y, icon: '📈', color: 'from-blue-500 to-indigo-500' },
                { ...analysis.highestDividend, icon: '💵', color: 'from-amber-500 to-orange-500' },
                { ...analysis.largestAum, icon: '🏦', color: 'from-purple-500 to-pink-500' },
              ].map((item, i) => (
                <div key={i} className="card bg-gradient-to-br from-dark-800/50 to-dark-900/50">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs text-dark-500 mb-1">{item.label}</p>
                  <p className={`font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.nameKo}
                  </p>
                  <p className="text-sm text-dark-400">
                    {item.label.includes('보수') ? `${item.value}%` : 
                     item.label.includes('수익') ? `+${item.value}%` :
                     item.label.includes('배당') ? `${item.value}%` :
                     item.value ? `$${item.value}B` : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Comparison Table */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-dark-400">비교 데이터 로딩 중...</p>
              </div>
            ) : compareData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left p-4 text-dark-500 font-medium">항목</th>
                      {compareData.map((etf) => (
                        <th key={etf.ticker} className="p-4 text-center">
                          <Link href={`/battle/${etf.ticker}`} className="group">
                            <div className="font-mono text-lg text-brand-400 group-hover:text-brand-300 transition-colors">
                              {etf.ticker}
                            </div>
                            <div className="text-sm text-dark-400 group-hover:text-dark-300">
                              {etf.nameKo}
                            </div>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 현재가 */}
                    <tr className="border-b border-dark-800">
                      <td className="p-4 text-dark-400">현재가</td>
                      {compareData.map((etf) => (
                        <td key={etf.ticker} className="p-4 text-center">
                          {etf.price ? (
                            <div>
                              <div className="font-semibold text-dark-100">
                                {etf.currency === 'KRW' ? `₩${etf.price.toLocaleString()}` : `$${etf.price.toFixed(2)}`}
                              </div>
                              {etf.changePercent !== undefined && (
                                <div className={`text-sm ${getReturnColor(etf.changePercent)}`}>
                                  {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-dark-600">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 비교 항목들 */}
                    {COMPARE_FIELDS.map((field) => (
                      <tr key={field.key} className="border-b border-dark-800 hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 text-dark-400">{field.label}</td>
                        {compareData.map((etf) => {
                          const value = (etf as any)[field.key];
                          const isBest = field.highlight && typeof value === 'number' && isBestValue(value, field.key, field.highlight);
                          const isReturn = field.key.includes('return');
                          
                          return (
                            <td key={etf.ticker} className="p-4 text-center">
                              <span className={`
                                ${isBest ? 'font-bold text-emerald-400' : 'text-dark-200'}
                                ${isReturn && typeof value === 'number' ? getReturnColor(value) : ''}
                              `}>
                                {field.format(value)}
                                {isBest && <span className="ml-1">✓</span>}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* 상위 보유 종목 */}
                    <tr>
                      <td className="p-4 text-dark-400 align-top">상위 5 종목</td>
                      {compareData.map((etf) => (
                        <td key={etf.ticker} className="p-4">
                          {etf.topHoldings && etf.topHoldings.length > 0 ? (
                            <div className="space-y-1">
                              {etf.topHoldings.map((h, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-dark-300 truncate max-w-[100px]">{h.name}</span>
                                  <span className="text-dark-500 ml-2">{h.weight.toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-dark-600 text-sm">데이터 없음</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-dark-500">
                비교할 ETF를 선택해주세요
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="mt-8">
            <p className="text-sm text-dark-500 mb-4 text-center">빠른 비교 세트</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'S&P 500 비교', tickers: ['SPY', 'VOO', 'IVV'] },
                { label: '배당 ETF 비교', tickers: ['SCHD', 'VYM', 'DVY', 'VIG'] },
                { label: '반도체 ETF 비교', tickers: ['SOXX', 'SMH', 'VGT'] },
                { label: '채권 ETF 비교', tickers: ['BND', 'TLT', 'AGG'] },
                { label: '신흥국 vs 선진국', tickers: ['VWO', 'VEA', 'EEM'] },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedTickers(preset.tickers)}
                  className="px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700 text-dark-400 hover:border-purple-500 hover:text-purple-400 transition-all text-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="card border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <h3 className="font-semibold text-dark-100 mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                비교 팁
              </h3>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>보수율</strong>: 장기 투자 시 낮을수록 유리합니다. 0.1% 차이도 10년이면 크게 벌어집니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>AUM</strong>: 운용자산이 클수록 유동성이 좋고 거래 비용이 낮습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>배당률</strong>: 인컴 투자자라면 중요하지만, 성장 투자자는 수익률에 집중하세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>상위 종목</strong>: 동일 지수를 추종해도 구성이 다를 수 있으니 확인하세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

