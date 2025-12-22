'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface InvestorProfile {
  investmentAmount: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  investmentGoal: 'growth' | 'income' | 'balanced' | 'preservation';
  preferredRegion: 'us' | 'kr' | 'global';
  excludeSectors: string[];
  includeSectors: string[];
  // 투자 성향 테스트 결과
  investorTypeCode?: string;
  investorTypeName?: string;
  investorAdvice?: string;
  compatibleETFs?: string[];
}

interface PortfolioHolding {
  ticker: string;
  name: string;
  nameKo: string;
  weight: number;
  amount: number;
  shares: number;
  currentPrice: number;
  currency: string;
  category: string;
  expenseRatio: number;
  rationale: string;
  expectedReturn: string;
  riskFactors: string[];
  source: string;
}

interface AIPortfolioResult {
  portfolioName: string;
  portfolioDescription: string;
  overallStrategy: string;
  riskLevel: string;
  expectedAnnualReturn: string;
  holdings: PortfolioHolding[];
  cashAllocation: {
    weight: number;
    amount: number;
    reason: string;
  };
  totalInvested: number;
  assetAllocation: {
    equity: number;
    bond: number;
    commodity: number;
    cash: number;
  };
  sectorAllocation: Record<string, number>;
  regionAllocation: Record<string, number>;
  rebalancingAdvice: string;
  warnings: string[];
  generatedAt: string;
  isRealTimeData: boolean;
}

// 금액 포맷
function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

// 프리셋 금액
const AMOUNT_PRESETS = [
  { value: 1000000, label: '100만원' },
  { value: 5000000, label: '500만원' },
  { value: 10000000, label: '1,000만원' },
  { value: 50000000, label: '5,000만원' },
  { value: 100000000, label: '1억원' },
];

// 투자자 유형 코드를 프로필 설정으로 변환
function mapInvestorTypeToProfile(code: string, scores: any): Partial<InvestorProfile> {
  const result: Partial<InvestorProfile> = {};
  
  // R/S: Risk-taker vs Safety-first
  if (code.includes('R')) {
    // 공격적 + 점수에 따라 조정
    result.riskTolerance = scores?.riskTolerance?.R > 4 ? 'aggressive' : 'moderate';
  } else {
    result.riskTolerance = scores?.riskTolerance?.S > 4 ? 'conservative' : 'moderate';
  }
  
  // L/S: Long-term vs Short-term (3rd character)
  const thirdChar = code[2];
  if (thirdChar === 'L') {
    result.investmentHorizon = 'long';
  } else {
    result.investmentHorizon = scores?.investmentHorizon?.S > 4 ? 'short' : 'medium';
  }
  
  // A/I: Analytical vs Intuitive (2nd character) - 투자 목표로 매핑
  const secondChar = code[1];
  // P/A: Passive vs Active (4th character)
  const fourthChar = code[3];
  
  // 투자 목표 결정 로직
  if (code.includes('S') && secondChar === 'A') {
    // 안전추구 + 분석형 → 인컴 또는 보전
    result.investmentGoal = scores?.riskTolerance?.S > 4 ? 'preservation' : 'income';
  } else if (code.includes('R') && fourthChar === 'A') {
    // 위험추구 + 액티브 → 성장
    result.investmentGoal = 'growth';
  } else {
    result.investmentGoal = 'balanced';
  }
  
  return result;
}

function PortfolioBuilderContent() {
  const searchParams = useSearchParams();
  const fromTest = searchParams.get('fromTest') === 'true';
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIPortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [investorTestData, setInvestorTestData] = useState<any>(null);
  
  // 투자자 프로필 상태
  const [profile, setProfile] = useState<InvestorProfile>({
    investmentAmount: 10000000,
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    investmentGoal: 'balanced',
    preferredRegion: 'global',
    excludeSectors: [],
    includeSectors: [],
  });

  // 투자 성향 테스트 결과 로드
  useEffect(() => {
    if (fromTest) {
      const storedData = sessionStorage.getItem('investorProfile');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setInvestorTestData(data);
          
          // 프로필 자동 설정
          const mappedProfile = mapInvestorTypeToProfile(data.code, data.scores);
          setProfile(prev => ({
            ...prev,
            ...mappedProfile,
            investorTypeCode: data.code,
            investorTypeName: data.name,
            investorAdvice: data.advice,
            compatibleETFs: data.compatibleETFs,
          }));
        } catch (e) {
          console.error('Failed to parse investor profile:', e);
        }
      }
    }
  }, [fromTest]);

  // AI 사용 가능 여부 확인
  useEffect(() => {
    fetch('/api/portfolio/build')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAiEnabled(data.data.aiEnabled);
        }
      })
      .catch(() => {});
  }, []);

  // 포트폴리오 생성
  const handleGeneratePortfolio = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/portfolio/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate portfolio');
      }
      
      setResult(data.data);
      setStep(4); // 결과 페이지로
    } catch (err: any) {
      setError(err.message || '포트폴리오 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 단계별 진행률
  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* 배경 효과 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            AI 포트폴리오 빌더
          </h1>
          <p className="text-gray-400">
            AI가 당신에게 맞는 최적의 ETF 포트폴리오를 구성해드립니다
          </p>
          {!aiEnabled && (
            <p className="text-yellow-500 text-sm mt-2">
              ⚠️ AI 서비스가 현재 사용 불가능합니다
            </p>
          )}
        </motion.div>

        {/* 투자 성향 테스트 결과 배너 */}
        {investorTestData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl">🧬</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold">투자 성향 테스트 결과 적용됨</span>
                  <span className="px-2 py-0.5 bg-purple-500/30 rounded text-purple-300 text-sm font-medium">
                    {investorTestData.code}
                  </span>
                  <span className="text-purple-300 font-medium">{investorTestData.name}</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  💡 {investorTestData.advice}
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('investorProfile');
                  setInvestorTestData(null);
                  setProfile({
                    investmentAmount: 10000000,
                    riskTolerance: 'moderate',
                    investmentHorizon: 'medium',
                    investmentGoal: 'balanced',
                    preferredRegion: 'global',
                    excludeSectors: [],
                    includeSectors: [],
                  });
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕ 초기화
              </button>
            </div>
            
            {/* 추천 ETF 미리보기 */}
            {investorTestData.compatibleETFs && investorTestData.compatibleETFs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-gray-400 text-sm">추천 ETF: </span>
                <div className="inline-flex flex-wrap gap-1 ml-1">
                  {investorTestData.compatibleETFs.map((etf: string) => (
                    <span key={etf} className="px-2 py-0.5 bg-blue-500/20 rounded text-blue-300 text-xs">
                      {etf}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 진행 바 */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step {step} / 3</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: 투자금액 */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-dark-700"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">1</span>
                투자금액을 입력하세요
              </h2>
              
              <div className="space-y-6">
                {/* 금액 입력 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">투자 금액</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={profile.investmentAmount}
                      onChange={(e) => setProfile({ ...profile, investmentAmount: Number(e.target.value) })}
                      className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                      min={100000}
                      step={100000}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">원</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    = {formatKRW(profile.investmentAmount)}
                  </p>
                </div>

                {/* 프리셋 버튼 */}
                <div className="flex flex-wrap gap-2">
                  {AMOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setProfile({ ...profile, investmentAmount: preset.value })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        profile.investmentAmount === preset.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={profile.investmentAmount < 100000}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 단계 →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: 투자 성향 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-dark-700"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">2</span>
                투자 성향을 알려주세요
              </h2>
              
              <div className="space-y-6">
                {/* 위험 성향 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-3">위험 성향</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'conservative', label: '안정형', icon: '🛡️', desc: '원금 보전 중시' },
                      { value: 'moderate', label: '중립형', icon: '⚖️', desc: '균형 잡힌 투자' },
                      { value: 'aggressive', label: '공격형', icon: '🚀', desc: '높은 수익 추구' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setProfile({ ...profile, riskTolerance: option.value as any })}
                        className={`p-4 rounded-xl text-left transition-all border ${
                          profile.riskTolerance === option.value
                            ? 'bg-blue-500/20 border-blue-500 text-white'
                            : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <div className="font-bold mt-2">{option.label}</div>
                        <div className="text-xs opacity-70">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 투자 기간 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-3">투자 기간</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'short', label: '단기', desc: '1년 이내' },
                      { value: 'medium', label: '중기', desc: '1-5년' },
                      { value: 'long', label: '장기', desc: '5년 이상' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setProfile({ ...profile, investmentHorizon: option.value as any })}
                        className={`p-4 rounded-xl text-left transition-all border ${
                          profile.investmentHorizon === option.value
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-bold">{option.label}</div>
                        <div className="text-xs opacity-70">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 투자 목표 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-3">투자 목표</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'growth', label: '성장', icon: '📈' },
                      { value: 'income', label: '인컴', icon: '💰' },
                      { value: 'balanced', label: '균형', icon: '⚖️' },
                      { value: 'preservation', label: '보전', icon: '🏦' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setProfile({ ...profile, investmentGoal: option.value as any })}
                        className={`p-3 rounded-xl text-center transition-all border ${
                          profile.investmentGoal === option.value
                            ? 'bg-green-500/20 border-green-500 text-white'
                            : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <div className="font-bold text-sm mt-1">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-4 bg-dark-700 text-gray-400 rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    ← 이전
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    다음 단계 →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: 선호 지역 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-dark-700"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">3</span>
                선호하는 투자 지역
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'us', label: '미국', icon: '🇺🇸', desc: 'S&P 500, 나스닥 등' },
                    { value: 'kr', label: '한국', icon: '🇰🇷', desc: 'KOSPI, KOSDAQ 등' },
                    { value: 'global', label: '글로벌', icon: '🌍', desc: '전 세계 분산 투자' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setProfile({ ...profile, preferredRegion: option.value as any })}
                      className={`p-6 rounded-xl text-center transition-all border ${
                        profile.preferredRegion === option.value
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500 text-white'
                          : 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-4xl">{option.icon}</span>
                      <div className="font-bold text-lg mt-3">{option.label}</div>
                      <div className="text-sm opacity-70 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>

                {/* 요약 */}
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-400 mb-3">📋 입력 정보 요약</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">투자금액:</span>
                      <span className="text-white ml-2">{formatKRW(profile.investmentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">위험성향:</span>
                      <span className="text-white ml-2">
                        {profile.riskTolerance === 'conservative' ? '안정형' : 
                         profile.riskTolerance === 'moderate' ? '중립형' : '공격형'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">투자기간:</span>
                      <span className="text-white ml-2">
                        {profile.investmentHorizon === 'short' ? '단기' : 
                         profile.investmentHorizon === 'medium' ? '중기' : '장기'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">투자목표:</span>
                      <span className="text-white ml-2">
                        {profile.investmentGoal === 'growth' ? '성장' : 
                         profile.investmentGoal === 'income' ? '인컴' : 
                         profile.investmentGoal === 'balanced' ? '균형' : '보전'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-4 bg-dark-700 text-gray-400 rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    ← 이전
                  </button>
                  <button
                    onClick={handleGeneratePortfolio}
                    disabled={isLoading || !aiEnabled}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        AI가 분석 중...
                      </>
                    ) : (
                      <>
                        ✨ AI 포트폴리오 생성하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: 결과 */}
          {step === 4 && result && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* 포트폴리오 헤더 */}
              <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-6 md:p-8 border border-blue-500/30">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{result.portfolioName}</h2>
                    <p className="text-gray-400">{result.portfolioDescription}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">예상 연간 수익률</div>
                    <div className="text-2xl font-bold text-green-400">{result.expectedAnnualReturn}</div>
                  </div>
                </div>
                
                {result.isRealTimeData && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    실시간 데이터 적용
                  </div>
                )}
              </div>

              {/* 전략 설명 */}
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-3">📊 투자 전략</h3>
                <p className="text-gray-300 leading-relaxed">{result.overallStrategy}</p>
              </div>

              {/* 자산 배분 */}
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-4">🎯 자산 배분</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '주식', value: result.assetAllocation.equity, color: 'bg-blue-500' },
                    { label: '채권', value: result.assetAllocation.bond, color: 'bg-green-500' },
                    { label: '원자재', value: result.assetAllocation.commodity, color: 'bg-yellow-500' },
                    { label: '현금', value: result.assetAllocation.cash, color: 'bg-gray-500' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full ${item.color} flex items-center justify-center text-white font-bold text-lg`}>
                        {item.value.toFixed(0)}%
                      </div>
                      <div className="text-gray-400 text-sm mt-2">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 포트폴리오 종목 */}
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-4">💼 포트폴리오 구성</h3>
                <div className="space-y-4">
                  {result.holdings.map((holding, idx) => (
                    <motion.div
                      key={holding.ticker}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-dark-700/50 rounded-xl p-4 hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-white">{holding.ticker}</span>
                            <span className="text-gray-400">{holding.nameKo}</span>
                            <span className="px-2 py-0.5 bg-dark-600 rounded text-xs text-gray-400">
                              {holding.category}
                            </span>
                            {holding.source !== 'static' && (
                              <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs text-green-400">
                                실시간
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-2">{holding.rationale}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {holding.riskFactors.map((risk, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-500/10 rounded text-xs text-red-400">
                                ⚠️ {risk}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-white">{holding.weight.toFixed(1)}%</div>
                          <div className="text-sm text-gray-400">{formatKRW(holding.amount)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {holding.shares}주 × {holding.currency === 'USD' ? '$' : '₩'}{holding.currentPrice.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-400 mt-1">{holding.expectedReturn}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* 현금 */}
                  <div className="bg-dark-700/50 rounded-xl p-4 border-2 border-dashed border-dark-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-white">💵 현금</span>
                        <p className="text-gray-400 text-sm mt-1">{result.cashAllocation.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{result.cashAllocation.weight.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">{formatKRW(result.cashAllocation.amount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 리밸런싱 조언 */}
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-bold text-white mb-3">🔄 리밸런싱 조언</h3>
                <p className="text-gray-300">{result.rebalancingAdvice}</p>
              </div>

              {/* 주의사항 */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-500/10 rounded-2xl p-6 border border-yellow-500/30">
                  <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ 주의사항</h3>
                  <ul className="space-y-2">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 다시 만들기 */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setStep(1);
                  }}
                  className="flex-1 py-4 bg-dark-700 text-white font-bold rounded-xl hover:bg-dark-600 transition-colors"
                >
                  ← 처음부터 다시 만들기
                </button>
                <button
                  onClick={handleGeneratePortfolio}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  🔄 다른 포트폴리오 추천받기
                </button>
              </div>

              {/* 면책 조항 */}
              <p className="text-center text-gray-500 text-xs">
                * 본 포트폴리오는 AI의 분석 결과이며, 투자 권유가 아닙니다. 투자 결정 전 전문가와 상담하시기 바랍니다.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function PortfolioBuilderLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 to-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-400">로딩 중...</p>
      </div>
    </div>
  );
}

export default function PortfolioBuilderPage() {
  return (
    <Suspense fallback={<PortfolioBuilderLoading />}>
      <PortfolioBuilderContent />
    </Suspense>
  );
}
