'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { findETFByTicker, US_ETFS } from '@/lib/data/etf-list';

interface PortfolioAsset {
  ticker: string;
  weight: number;
  name?: string;
}

interface DailyValue {
  date: string;
  value: number;
  totalReturn: number;
}

interface BacktestResult {
  portfolio: PortfolioAsset[];
  startDate: string;
  endDate: string;
  initialAmount: number;
  finalAmount: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  volatility: number;
  sharpeRatio: number;
  benchmarkReturn?: number;
  alpha?: number;
  dailyValues: DailyValue[];
  yearlyReturns: { year: number; return: number }[];
}

interface Preset {
  id: string;
  name: string;
  description: string;
  portfolio: PortfolioAsset[];
}

export default function BacktestPage() {
  // 포트폴리오 입력 상태
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([
    { ticker: 'SPY', weight: 60, name: 'S&P 500' },
    { ticker: 'QQQ', weight: 40, name: '나스닥 100' },
  ]);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialAmount, setInitialAmount] = useState(10000000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'none' | 'monthly' | 'quarterly' | 'yearly'>('quarterly');
  
  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof US_ETFS>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // 결과 상태
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 프리셋
  const [presets, setPresets] = useState<Preset[]>([]);

  // 프리셋 로드
  useEffect(() => {
    fetch('/api/backtest')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPresets(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // ETF 검색
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      const filtered = US_ETFS.filter(
        etf =>
          etf.ticker.toLowerCase().includes(lowerQuery) ||
          etf.name.toLowerCase().includes(lowerQuery) ||
          etf.nameKo.toLowerCase().includes(lowerQuery)
      ).slice(0, 8);
      setSearchResults(filtered);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  // ETF 추가
  const addETF = (ticker: string, name: string) => {
    if (portfolio.length >= 10) {
      setError('최대 10개 ETF까지 추가할 수 있습니다.');
      return;
    }
    if (portfolio.some(p => p.ticker === ticker)) {
      setError('이미 추가된 ETF입니다.');
      return;
    }
    
    setPortfolio([...portfolio, { ticker, weight: 0, name }]);
    setSearchTerm('');
    setShowSearch(false);
    setError(null);
  };

  // ETF 제거
  const removeETF = (ticker: string) => {
    setPortfolio(portfolio.filter(p => p.ticker !== ticker));
  };

  // 비중 변경
  const updateWeight = (ticker: string, weight: number) => {
    setPortfolio(portfolio.map(p => 
      p.ticker === ticker ? { ...p, weight: Math.max(0, Math.min(100, weight)) } : p
    ));
  };

  // 비중 균등 분배
  const equalizeWeights = () => {
    const equalWeight = Math.floor(100 / portfolio.length);
    const remainder = 100 - equalWeight * portfolio.length;
    
    setPortfolio(portfolio.map((p, i) => ({
      ...p,
      weight: equalWeight + (i === 0 ? remainder : 0),
    })));
  };

  // 프리셋 적용
  const applyPreset = (preset: Preset) => {
    setPortfolio(preset.portfolio);
  };

  // 백테스트 실행
  const runBacktest = async () => {
    const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);
    if (Math.abs(totalWeight - 100) > 1) {
      setError(`비중 합계가 100%여야 합니다. (현재: ${totalWeight}%)`);
      return;
    }

    if (portfolio.length === 0) {
      setError('최소 1개 ETF를 추가해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio,
          startDate,
          endDate,
          initialAmount,
          rebalanceFrequency,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '백테스트 실행에 실패했습니다.');
      }
    } catch (e) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비중 합계
  const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);

  // 금액 포맷
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-900/20 to-dark-950 py-12">
        <div className="container-app">
          <div className="flex items-center gap-2 text-brand-400 mb-4">
            <Link href="/" className="hover:text-brand-300">홈</Link>
            <span>/</span>
            <span className="text-dark-300">포트폴리오 백테스트</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            📊 포트폴리오 백테스트
          </h1>
          <p className="text-dark-300 text-lg">
            과거 데이터로 내 포트폴리오의 수익률을 시뮬레이션해보세요
          </p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 입력 패널 */}
          <div className="space-y-6">
            {/* 프리셋 */}
            <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
              <h3 className="text-lg font-semibold mb-4">🎯 추천 포트폴리오</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-brand-500 transition-all text-left"
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-dark-400 mt-1 line-clamp-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 포트폴리오 구성 */}
            <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">💼 포트폴리오 구성</h3>
                <div className={`text-sm font-medium ${Math.abs(totalWeight - 100) > 1 ? 'text-red-400' : 'text-green-400'}`}>
                  합계: {totalWeight}%
                </div>
              </div>

              {/* ETF 목록 */}
              <div className="space-y-3 mb-4">
                {portfolio.map(asset => (
                  <div key={asset.ticker} className="flex items-center gap-3 bg-dark-800 rounded-xl p-3">
                    <div className="flex-1">
                      <div className="font-medium">{asset.ticker}</div>
                      <div className="text-sm text-dark-400">{asset.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={asset.weight}
                        onChange={e => updateWeight(asset.ticker, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 rounded bg-dark-700 border border-dark-600 text-center text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-dark-400">%</span>
                      <button
                        onClick={() => removeETF(asset.ticker)}
                        className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ETF 검색 */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="ETF 티커 검색 (예: VOO, SCHD)"
                  className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 focus:border-brand-500 focus:outline-none"
                />
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden">
                    {searchResults.map(etf => (
                      <button
                        key={etf.ticker}
                        onClick={() => addETF(etf.ticker, etf.nameKo)}
                        className="w-full px-4 py-3 text-left hover:bg-dark-700 flex items-center justify-between"
                      >
                        <span>
                          <span className="font-medium">{etf.ticker}</span>
                          <span className="text-dark-400 ml-2">{etf.nameKo}</span>
                        </span>
                        <span className="text-xs text-dark-500">{etf.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={equalizeWeights}
                className="text-sm text-brand-400 hover:text-brand-300"
              >
                ⚖️ 비중 균등 분배
              </button>
            </div>

            {/* 기간 & 설정 */}
            <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
              <h3 className="text-lg font-semibold mb-4">⚙️ 백테스트 설정</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    min="2010-01-01"
                    max={endDate}
                    className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-dark-400 mb-2">초기 투자금</label>
                <div className="relative">
                  <input
                    type="number"
                    value={initialAmount}
                    onChange={e => setInitialAmount(parseInt(e.target.value) || 10000000)}
                    min="100000"
                    max="10000000000"
                    className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 focus:border-brand-500 focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">원</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1000000, 5000000, 10000000, 50000000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setInitialAmount(amount)}
                      className={`px-2 py-1 text-xs rounded ${initialAmount === amount ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'}`}
                    >
                      {amount >= 100000000 ? `${amount / 100000000}억` : `${amount / 10000}만`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">리밸런싱 주기</label>
                <div className="flex gap-2">
                  {[
                    { value: 'none', label: '없음' },
                    { value: 'monthly', label: '월간' },
                    { value: 'quarterly', label: '분기' },
                    { value: 'yearly', label: '연간' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setRebalanceFrequency(option.value as any)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        rebalanceFrequency === option.value
                          ? 'bg-brand-500 text-white'
                          : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300">
                {error}
              </div>
            )}

            {/* 실행 버튼 */}
            <button
              onClick={runBacktest}
              disabled={loading || portfolio.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                loading || portfolio.length === 0
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-500 to-purple-500 text-white hover:opacity-90'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  백테스트 실행 중...
                </span>
              ) : (
                '🚀 백테스트 실행'
              )}
            </button>
          </div>

          {/* 오른쪽: 결과 패널 */}
          <div>
            {result ? (
              <div className="space-y-6">
                {/* 핵심 지표 */}
                <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl p-6 border border-dark-700">
                  <h3 className="text-lg font-semibold mb-4">📈 백테스트 결과</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-dark-800/50 rounded-xl p-4">
                      <div className="text-sm text-dark-400 mb-1">최종 자산</div>
                      <div className="text-2xl font-bold text-white">{formatCurrency(result.finalAmount)}</div>
                      <div className={`text-sm ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
                      </div>
                    </div>
                    <div className="bg-dark-800/50 rounded-xl p-4">
                      <div className="text-sm text-dark-400 mb-1">연평균 수익률 (CAGR)</div>
                      <div className={`text-2xl font-bold ${result.annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.annualizedReturn >= 0 ? '+' : ''}{result.annualizedReturn}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-dark-400 mb-1">최대 낙폭 (MDD)</div>
                      <div className="text-lg font-semibold text-red-400">-{result.maxDrawdown}%</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-dark-400 mb-1">변동성</div>
                      <div className="text-lg font-semibold text-yellow-400">{result.volatility}%</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-dark-400 mb-1">샤프 비율</div>
                      <div className={`text-lg font-semibold ${result.sharpeRatio >= 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {result.sharpeRatio}
                      </div>
                    </div>
                  </div>

                  {result.benchmarkReturn !== undefined && (
                    <div className="mt-4 pt-4 border-t border-dark-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">vs S&P 500 (SPY)</span>
                        <span className={result.alpha && result.alpha >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {result.alpha && result.alpha >= 0 ? '+' : ''}{result.alpha}% (α)
                        </span>
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        벤치마크 수익률: {result.benchmarkReturn}%
                      </div>
                    </div>
                  )}
                </div>

                {/* 수익률 차트 */}
                <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                  <h3 className="text-lg font-semibold mb-4">📊 누적 수익률</h3>
                  <div className="h-64 relative">
                    <SimpleChart data={result.dailyValues} />
                  </div>
                  <div className="flex justify-between text-xs text-dark-500 mt-2">
                    <span>{formatDate(result.startDate)}</span>
                    <span>{formatDate(result.endDate)}</span>
                  </div>
                </div>

                {/* 연도별 수익률 */}
                <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                  <h3 className="text-lg font-semibold mb-4">📅 연도별 수익률</h3>
                  <div className="space-y-2">
                    {result.yearlyReturns.map(yr => (
                      <div key={yr.year} className="flex items-center gap-3">
                        <span className="w-12 text-sm text-dark-400">{yr.year}</span>
                        <div className="flex-1 h-6 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${yr.return >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{
                              width: `${Math.min(Math.abs(yr.return), 100)}%`,
                              marginLeft: yr.return < 0 ? 'auto' : 0,
                            }}
                          />
                        </div>
                        <span className={`w-16 text-sm text-right ${yr.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {yr.return >= 0 ? '+' : ''}{yr.return}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 포트폴리오 요약 */}
                <div className="bg-dark-900 rounded-2xl p-6 border border-dark-800">
                  <h3 className="text-lg font-semibold mb-4">💼 포트폴리오 구성</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.portfolio.map(asset => (
                      <div
                        key={asset.ticker}
                        className="px-3 py-2 bg-dark-800 rounded-lg text-sm"
                      >
                        <span className="font-medium">{asset.ticker}</span>
                        <span className="text-dark-400 ml-2">{asset.weight}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-dark-500 mt-4">
                    기간: {formatDate(result.startDate)} ~ {formatDate(result.endDate)} | 
                    초기 투자금: {formatCurrency(result.initialAmount)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-dark-900 rounded-2xl p-12 border border-dark-800 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">백테스트 결과가 여기에 표시됩니다</h3>
                <p className="text-dark-400">
                  포트폴리오를 구성하고 백테스트를 실행해보세요.
                  <br />
                  과거 데이터를 기반으로 수익률을 시뮬레이션합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 간단한 라인 차트 컴포넌트
function SimpleChart({ data }: { data: DailyValue[] }) {
  if (data.length === 0) return null;

  const values = data.map(d => d.totalReturn);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  // SVG path 생성
  const width = 100;
  const height = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.totalReturn - minValue) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  const isPositive = data[data.length - 1].totalReturn >= 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      {/* 그라데이션 정의 */}
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* 0% 기준선 */}
      <line
        x1="0"
        y1={height - ((0 - minValue) / range) * height}
        x2={width}
        y2={height - ((0 - minValue) / range) * height}
        stroke="#374151"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      
      {/* 영역 */}
      <path d={areaD} fill="url(#chartGradient)" />
      
      {/* 라인 */}
      <path
        d={pathD}
        fill="none"
        stroke={isPositive ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

