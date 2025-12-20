'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ETFItem {
  ticker: string;
  name: string;
  nameKo: string;
  issuer: string;
  category: string;
  assetClass: string;
  region: string;
  expenseRatio: number;
  aum: number;
  description: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

interface CategoryInfo {
  id: string;
  name: string;
  nameKo: string;
  description: string;
}

// 카테고리별 아이콘과 색상
const CATEGORY_STYLES: Record<string, { icon: string; gradient: string; bg: string }> = {
  'us-large-cap': { icon: '🇺🇸', gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-500/10' },
  'tech-semi': { icon: '💻', gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-500/10' },
  'growth': { icon: '📈', gradient: 'from-green-500 to-green-700', bg: 'bg-green-500/10' },
  'dividend': { icon: '💰', gradient: 'from-amber-500 to-amber-700', bg: 'bg-amber-500/10' },
  'bond': { icon: '📜', gradient: 'from-slate-500 to-slate-700', bg: 'bg-slate-500/10' },
  'international': { icon: '🌍', gradient: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-500/10' },
  'real-estate': { icon: '🏢', gradient: 'from-orange-500 to-orange-700', bg: 'bg-orange-500/10' },
  'thematic': { icon: '🎯', gradient: 'from-pink-500 to-pink-700', bg: 'bg-pink-500/10' },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [etfs, setEtfs] = useState<ETFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedETFs, setSelectedETFs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'expenseRatio' | 'aum' | 'changePercent'>('aum');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const style = CATEGORY_STYLES[categoryId] || CATEGORY_STYLES['us-large-cap'];

  const fetchCategoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/etf/category/${categoryId}?withPrice=true`);
      const data = await response.json();
      
      if (data.success) {
        setCategory(data.data.category);
        setEtfs(data.data.etfs);
      } else {
        setError(data.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  // 정렬된 ETF 목록
  const sortedETFs = [...etfs].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.nameKo || a.name).localeCompare(b.nameKo || b.name);
        break;
      case 'expenseRatio':
        comparison = (a.expenseRatio || 0) - (b.expenseRatio || 0);
        break;
      case 'aum':
        comparison = (a.aum || 0) - (b.aum || 0);
        break;
      case 'changePercent':
        comparison = (a.changePercent || 0) - (b.changePercent || 0);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // ETF 선택 토글
  const toggleETFSelection = (ticker: string) => {
    setSelectedETFs(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker)
        : prev.length < 5 ? [...prev, ticker] : prev
    );
  };

  // 선택된 ETF 비교
  const compareSelected = () => {
    if (selectedETFs.length >= 2) {
      router.push(`/compare?tickers=${selectedETFs.join(',')}`);
    }
  };

  // ETF 토론 페이지로 이동
  const viewDebate = (ticker: string) => {
    router.push(`/battle/${ticker}`);
  };

  const formatAUM = (aum: number) => {
    if (aum >= 1000000) return `$${(aum / 1000000).toFixed(1)}T`;
    if (aum >= 1000) return `$${(aum / 1000).toFixed(1)}B`;
    return `$${aum}M`;
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className={`bg-gradient-to-r ${style.gradient} py-12`}>
        <div className="container-app">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <Link href="/" className="hover:text-white">홈</Link>
            <span>/</span>
            <span className="text-white">{category?.nameKo || '카테고리'}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{style.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {category?.nameKo || '로딩 중...'}
              </h1>
              <p className="text-white/80 mt-2 max-w-2xl">
                {category?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <span className={`px-4 py-2 rounded-full ${style.bg} text-white font-medium`}>
              {etfs.length} ETFs
            </span>
            {selectedETFs.length > 0 && (
              <button
                onClick={compareSelected}
                disabled={selectedETFs.length < 2}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedETFs.length >= 2
                    ? 'bg-white text-dark-900 hover:bg-white/90'
                    : 'bg-white/30 text-white/60 cursor-not-allowed'
                }`}
              >
                선택한 {selectedETFs.length}개 비교하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app py-8">
        {/* Sort & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm"
            >
              <option value="aum">AUM (자산규모)</option>
              <option value="expenseRatio">보수율</option>
              <option value="name">이름</option>
              <option value="changePercent">등락률</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          <div className="text-sm text-dark-400">
            {selectedETFs.length > 0 && (
              <span>
                {selectedETFs.length}/5 선택됨
                <button
                  onClick={() => setSelectedETFs([])}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  초기화
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-900 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-dark-700 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-dark-700 rounded w-20 mb-2" />
                    <div className="h-3 bg-dark-700 rounded w-32" />
                  </div>
                </div>
                <div className="h-3 bg-dark-700 rounded w-full mb-2" />
                <div className="h-3 bg-dark-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-dark-900 rounded-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-dark-400 mb-4">{error}</p>
            <button
              onClick={fetchCategoryData}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* ETF Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedETFs.map((etf) => {
              const isSelected = selectedETFs.includes(etf.ticker);
              return (
                <div
                  key={etf.ticker}
                  className={`bg-dark-900 rounded-xl p-6 border-2 transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-500/5' 
                      : 'border-transparent hover:border-dark-700'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-xl font-bold`}>
                        {etf.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{etf.ticker}</div>
                        <div className="text-sm text-dark-400">{etf.issuer}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleETFSelection(etf.ticker)}
                      className={`p-2 rounded-lg transition ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-dark-800 text-dark-400 hover:text-white'
                      }`}
                      title={isSelected ? '선택 해제' : '비교 선택'}
                    >
                      {isSelected ? '✓' : '+'}
                    </button>
                  </div>

                  {/* Name */}
                  <h3 className="font-medium text-dark-200 mb-2 line-clamp-2">
                    {etf.nameKo || etf.name}
                  </h3>

                  {/* Price Info */}
                  {etf.price !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-bold">${etf.price.toFixed(2)}</span>
                      {etf.changePercent !== undefined && (
                        <span className={`text-sm font-medium ${
                          etf.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-dark-800/50 rounded-lg p-2">
                      <div className="text-xs text-dark-500">보수율</div>
                      <div className="font-medium">{etf.expenseRatio ? `${etf.expenseRatio}%` : '-'}</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-2">
                      <div className="text-xs text-dark-500">AUM</div>
                      <div className="font-medium">{etf.aum ? formatAUM(etf.aum) : '-'}</div>
                    </div>
                  </div>

                  {/* Description */}
                  {etf.description && (
                    <p className="text-sm text-dark-500 mb-4 line-clamp-2">
                      {etf.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewDebate(etf.ticker)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm bg-gradient-to-r ${style.gradient} text-white hover:opacity-90`}
                    >
                      🎭 AI 토론
                    </button>
                    <Link
                      href={`/compare?tickers=${etf.ticker}`}
                      className="py-2 px-4 bg-dark-800 text-dark-300 rounded-lg font-medium text-sm hover:bg-dark-700"
                    >
                      📊 상세
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && etfs.length === 0 && (
          <div className="text-center py-12 bg-dark-900 rounded-2xl">
            <div className="text-4xl mb-4">{style.icon}</div>
            <p className="text-dark-400 mb-4">
              이 카테고리에 해당하는 ETF가 없습니다.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600"
            >
              홈으로 돌아가기
            </Link>
          </div>
        )}
      </div>

      {/* Fixed Compare Bar */}
      {selectedETFs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur border-t border-dark-700 p-4 z-40">
          <div className="container-app flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-dark-400">비교할 ETF:</span>
              <div className="flex gap-2">
                {selectedETFs.map(ticker => (
                  <span
                    key={ticker}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1"
                  >
                    {ticker}
                    <button
                      onClick={() => toggleETFSelection(ticker)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={compareSelected}
              disabled={selectedETFs.length < 2}
              className={`px-6 py-2 rounded-xl font-medium transition ${
                selectedETFs.length >= 2
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-dark-700 text-dark-500 cursor-not-allowed'
              }`}
            >
              {selectedETFs.length >= 2 ? '비교하기' : '2개 이상 선택하세요'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

