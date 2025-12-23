'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';

// 캐릭터 이미지 경로
const CHARACTER_IMAGES = {
  claude: '/images/characters/claude.png',
  gemini: '/images/characters/gemini.png',
  gpt: '/images/characters/gpt.png',
};

// Types
interface QuestionOption {
  value: string;
  label: string;
  score: Record<string, number>;
}

interface Question {
  id: number;
  dimension: string;
  question: string;
  options: QuestionOption[];
}

interface Answer {
  questionId: number;
  answer: string;
  scores: Record<string, number>;
}

interface Expert {
  character: string;
  name: string;
  nameKo: string;
  title: string;
  personalMessage: string;
  strengthAnalysis: string;
  riskWarning: string;
  recommendations: { ticker: string; name: string; reason: string; allocation: number }[];
  strategy: string;
  actionItem: string;
  expectedReturn: string;
  riskScore: number;
  success: boolean;
}

interface InvestorType {
  code: string;
  name: string;
  emoji: string;
  nickname: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
  compatibleETFs: string[];
  famousPerson: string;
  famousPersonBio?: string;
  famousPersonQuote?: string;
  famousPersonStyle?: string;
}

interface Scores {
  riskTolerance: { R: number; S: number };
  analysisStyle: { A: number; I: number };
  investmentHorizon: { L: number; S: number };
  tradingStyle: { P: number; A: number };
}

interface AnalysisResult {
  investorType: InvestorType;
  scores: Scores;
  expertAnalysis: Expert[];
  analyzedAt: string;
  isAIAnalysis: boolean;
}

// 유형 코드 해석
const TYPE_DIMENSIONS = {
  R: { label: '위험추구', color: 'text-red-400', bg: 'bg-red-500/20' },
  S: { label: '안전추구', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  A: { label: '분석형', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  I: { label: '직관형', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  L: { label: '장기투자', color: 'text-green-400', bg: 'bg-green-500/20' },
  P: { label: '패시브', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

export default function InvestmentTestPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<'intro' | 'test' | 'loading' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  
  // 테스트 제한 관련 상태
  const [canTakeTest, setCanTakeTest] = useState(true);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // 질문 불러오기 + 테스트 가능 여부 확인
  useEffect(() => {
    fetch('/api/investment-test')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuestions(data.data.questions);
          setAiEnabled(data.data.aiEnabled);
        }
      })
      .catch(() => setError('질문을 불러오는데 실패했습니다.'));
    
    // 로그인한 사용자인 경우 테스트 가능 여부 확인
    if (user) {
      fetch(`/api/investment-test/history?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCanTakeTest(data.data.canTakeTest);
            setLastTestAt(data.data.lastTestAt);
            setNextAvailableAt(data.data.nextAvailableAt);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // 답변 선택
  const handleAnswer = (option: QuestionOption) => {
    const newAnswer: Answer = {
      questionId: questions[currentQuestion].id,
      answer: option.value,
      scores: option.score,
    };
    
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = newAnswer;
    setAnswers(updatedAnswers);

    // 다음 질문으로 또는 결과 분석
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      submitTest(updatedAnswers);
    }
  };

  // 테스트 제출
  const submitTest = async (finalAnswers: Answer[]) => {
    setCurrentStep('loading');
    setError(null);
    setSavedToHistory(false);

    try {
      const response = await fetch('/api/investment-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setResult(data.data);
      setCurrentStep('result');
      
      // 로그인한 사용자인 경우 결과 저장
      if (user) {
        saveTestResult(data.data);
      }
    } catch (err: any) {
      setError(err.message || '분석에 실패했습니다.');
      setCurrentStep('test');
    }
  };
  
  // 테스트 결과 저장
  const saveTestResult = async (testResult: AnalysisResult) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/investment-test/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          investorType: testResult.investorType,
          scores: testResult.scores,
          expertAnalysis: testResult.expertAnalysis,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSavedToHistory(true);
        setCanTakeTest(false);
        setLastTestAt(new Date().toISOString());
        setNextAvailableAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (response.status === 429) {
        // 일주일 제한
        console.log('Test limit reached:', data);
      }
    } catch (err) {
      console.error('Failed to save test result:', err);
    }
  };

  // 다시 시작
  const restartTest = () => {
    setAnswers([]);
    setCurrentQuestion(0);
    setResult(null);
    setCurrentStep('intro');
    setSelectedExpert(null);
  };

  // 진행률
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // 점수 바 렌더링
  const renderScoreBar = (label1: string, score1: number, label2: string, score2: number, color1: string, color2: string) => {
    const total = score1 + score2;
    const percent1 = total > 0 ? (score1 / total) * 100 : 50;
    
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className={score1 >= score2 ? 'font-bold text-white' : ''}>{label1}</span>
          <span className={score2 > score1 ? 'font-bold text-white' : ''}>{label2}</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden flex">
          <div className={`h-full ${color1}`} style={{ width: `${percent1}%` }} />
          <div className={`h-full ${color2}`} style={{ width: `${100 - percent1}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* 배경 효과 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
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

        {/* 인트로 */}
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 md:py-12"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-6xl mb-4">🧬</div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3">
                  투자 DNA 테스트
                </h1>
                <p className="text-gray-300 text-lg mb-1">
                  당신의 투자 성향 MBTI는?
                </p>
                <p className="text-gray-500 mb-6">
                  12가지 질문으로 16가지 투자자 유형 중 당신을 찾아드립니다
                </p>
              </motion.div>

              {/* MBTI 유형 미리보기 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6"
              >
                {[
                  { label: 'R / S', desc: '위험추구 vs 안전추구' },
                  { label: 'A / I', desc: '분석형 vs 직관형' },
                  { label: 'L / S', desc: '장기 vs 단기' },
                  { label: 'P / A', desc: '패시브 vs 액티브' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-dark-800/50 rounded-lg p-3 border border-dark-700">
                    <div className="font-bold text-white text-lg">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                ))}
              </motion.div>

              {/* AI 전문가 소개 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-3 mb-8"
              >
                {[
                  { image: CHARACTER_IMAGES.claude, name: '클로드 리', title: '밸류에이션 전문가' },
                  { image: CHARACTER_IMAGES.gemini, name: '제미나인', title: '성장주 전문가' },
                  { image: CHARACTER_IMAGES.gpt, name: '쥐피테일러', title: '자산배분 전략가' },
                ].map((expert, idx) => (
                  <div
                    key={idx}
                    className="bg-dark-800/50 backdrop-blur rounded-xl p-4 border border-dark-700"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-2 ring-2 ring-white/20">
                      <Image
                        src={expert.image}
                        alt={expert.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-bold text-white text-sm">{expert.name}</div>
                    <div className="text-xs text-gray-400">{expert.title}</div>
                  </div>
                ))}
              </motion.div>

              {/* 일주일 제한 안내 */}
              {user && !canTakeTest && nextAvailableAt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                >
                  <div className="text-yellow-400 font-bold mb-1">⏰ 테스트 대기 중</div>
                  <p className="text-gray-400 text-sm">
                    마지막 테스트: {new Date(lastTestAt!).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    다음 테스트 가능: <span className="text-yellow-400 font-medium">{new Date(nextAvailableAt).toLocaleDateString('ko-KR')}</span>
                  </p>
                  <Link 
                    href="/mypage?tab=overview"
                    className="inline-block mt-2 text-sm text-purple-400 hover:text-purple-300"
                  >
                    → 이전 테스트 결과 보기
                  </Link>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setCurrentStep('test')}
                disabled={!aiEnabled || questions.length === 0 || (user && !canTakeTest)}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {!aiEnabled ? 'AI 서비스 준비 중...' : questions.length === 0 ? '질문 로딩 중...' : (user && !canTakeTest) ? '🔒 일주일 후 다시 테스트' : '🧬 내 투자 DNA 찾기'}
              </motion.button>

              <p className="text-gray-500 text-sm mt-4">
                ⏱️ 약 3분 소요 • 16가지 유형 • 3명의 AI 분석
              </p>
            </motion.div>
          )}

          {/* 테스트 진행 */}
          {currentStep === 'test' && questions.length > 0 && (
            <motion.div
              key="test"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              {/* 진행 바 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Q{currentQuestion + 1} / {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* 질문 */}
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-5 md:p-8 border border-dark-700"
              >
                <div className="text-xs text-purple-400 mb-2 font-medium">
                  {questions[currentQuestion].dimension === 'RS' && '💪 위험 성향'}
                  {questions[currentQuestion].dimension === 'AI' && '🧠 분석 스타일'}
                  {questions[currentQuestion].dimension === 'LS' && '⏰ 투자 기간'}
                  {questions[currentQuestion].dimension === 'PA' && '🎯 투자 방식'}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white mb-6 leading-relaxed">
                  {questions[currentQuestion].question}
                </h2>

                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, idx) => (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 rounded-xl text-left transition-all border ${
                        answers[currentQuestion]?.answer === option.value
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-dark-700/50 border-dark-600 text-gray-300 hover:border-purple-500/50 hover:bg-dark-700'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>

                {/* 이전 버튼 */}
                {currentQuestion > 0 && (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion - 1)}
                    className="mt-6 text-gray-400 hover:text-white transition-colors"
                  >
                    ← 이전 질문
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* 로딩 */}
          {currentStep === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="flex justify-center gap-6 mb-8">
                {[
                  { image: CHARACTER_IMAGES.claude, name: '클로드 리' },
                  { image: CHARACTER_IMAGES.gemini, name: '제미나인' },
                  { image: CHARACTER_IMAGES.gpt, name: '쥐피테일러' },
                ].map((expert, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.2, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.3 }}
                      className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg shadow-purple-500/20"
                    >
                      <Image
                        src={expert.image}
                        alt={expert.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.2 + 0.5 }}
                      className="text-xs text-gray-400 mt-2"
                    >
                      {expert.name}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">🧬 투자 DNA 분석 중...</h2>
              <p className="text-gray-400">3명의 전문가가 당신의 투자 유형을 분석하고 있습니다</p>
              <div className="mt-8">
                <div className="w-48 h-1 bg-dark-800 rounded-full mx-auto overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 결과 */}
          {currentStep === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* 투자 유형 결과 - MBTI 스타일 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-500/20 via-dark-800/50 to-blue-500/20 rounded-2xl p-6 md:p-8 border border-purple-500/30 text-center"
              >
                <div className="text-6xl mb-4">{result.investorType.emoji}</div>
                
                {/* 유형 코드 */}
                <div className="flex justify-center gap-1 mb-3">
                  {result.investorType.code.split('').map((char, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-lg font-bold text-lg ${
                        TYPE_DIMENSIONS[char as keyof typeof TYPE_DIMENSIONS]?.bg || 'bg-gray-500/20'
                      } ${TYPE_DIMENSIONS[char as keyof typeof TYPE_DIMENSIONS]?.color || 'text-gray-400'}`}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {result.investorType.name}
                </h2>
                <p className="text-purple-400 font-medium mb-4">
                  &ldquo;{result.investorType.nickname}&rdquo;
                </p>
                <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  {result.investorType.description}
                </p>

              </motion.div>

              {/* 닮은 유명 투자자 - 상세 정보 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-amber-500/10 via-dark-800/50 to-orange-500/10 rounded-2xl p-6 border border-amber-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">👨‍💼</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">닮은 투자자</h3>
                    <p className="text-amber-400 font-semibold text-xl">{result.investorType.famousPerson}</p>
                  </div>
                </div>

                {/* 투자자 소개 */}
                {result.investorType.famousPersonBio && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {result.investorType.famousPersonBio}
                  </p>
                )}

                {/* 명언 */}
                {result.investorType.famousPersonQuote && (
                  <div className="bg-dark-900/50 rounded-xl p-4 mb-4 border-l-4 border-amber-500">
                    <p className="text-white italic text-lg leading-relaxed">
                      {result.investorType.famousPersonQuote}
                    </p>
                  </div>
                )}

                {/* 투자 스타일 */}
                {result.investorType.famousPersonStyle && (
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">💡</span>
                    <div>
                      <span className="text-amber-400 font-medium">투자 스타일: </span>
                      <span className="text-gray-300">{result.investorType.famousPersonStyle}</span>
                    </div>
                  </div>
                )}

                {/* 당신과의 연결 */}
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-medium">당신도 {result.investorType.famousPerson.split(' ')[0]}처럼</span>{' '}
                    {result.investorType.code.includes('R') ? '과감한 베팅과 ' : '신중한 접근과 '}
                    {result.investorType.code.includes('A') ? '철저한 분석으로 ' : '직관적인 판단으로 '}
                    {result.investorType.code.includes('L') ? '장기적 관점에서 ' : '기회를 포착해 '}
                    투자합니다.
                  </p>
                </div>
              </motion.div>

              {/* 점수 분석 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
              >
                <h3 className="text-lg font-bold text-white mb-4">📊 상세 분석</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {renderScoreBar(
                      '🔥 위험추구', result.scores.riskTolerance.R,
                      '🛡️ 안전추구', result.scores.riskTolerance.S,
                      'bg-red-500', 'bg-blue-500'
                    )}
                    {renderScoreBar(
                      '📊 분석형', result.scores.analysisStyle.A,
                      '💡 직관형', result.scores.analysisStyle.I,
                      'bg-purple-500', 'bg-yellow-500'
                    )}
                  </div>
                  <div>
                    {renderScoreBar(
                      '🏃 장기투자', result.scores.investmentHorizon.L,
                      '⚡ 단기투자', result.scores.investmentHorizon.S,
                      'bg-green-500', 'bg-orange-500'
                    )}
                    {renderScoreBar(
                      '🧘 패시브', result.scores.tradingStyle.P,
                      '🎯 액티브', result.scores.tradingStyle.A,
                      'bg-cyan-500', 'bg-pink-500'
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 강점/약점 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
                  <h4 className="font-bold text-green-400 mb-3">✅ 강점</h4>
                  <ul className="space-y-2">
                    {result.investorType.strengths.map((s, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/30">
                  <h4 className="font-bold text-red-400 mb-3">⚠️ 주의점</h4>
                  <ul className="space-y-2">
                    {result.investorType.weaknesses.map((w, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-red-400">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* 추천 ETF */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-800/50 rounded-xl p-5 border border-dark-700"
              >
                <h4 className="font-bold text-white mb-3">💎 당신에게 맞는 ETF</h4>
                <div className="flex flex-wrap gap-2">
                  {result.investorType.compatibleETFs.map((etf, i) => (
                    <span key={i} className="px-3 py-1.5 bg-purple-500/20 rounded-lg text-purple-300 font-medium text-sm">
                      {etf}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-3">
                  💡 {result.investorType.advice}
                </p>
              </motion.div>

              {/* 전문가 선택 탭 */}
              <div className="flex justify-center gap-2 flex-wrap">
                {result.expertAnalysis.map((expert) => (
                  <button
                    key={expert.character}
                    onClick={() => setSelectedExpert(selectedExpert === expert.character ? null : expert.character)}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      selectedExpert === expert.character
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ring-2 ring-purple-400'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={CHARACTER_IMAGES[expert.character as keyof typeof CHARACTER_IMAGES] || CHARACTER_IMAGES.claude}
                        alt={expert.nameKo}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{expert.nameKo}</span>
                  </button>
                ))}
              </div>

              {/* 전문가별 분석 */}
              <div className="grid grid-cols-1 gap-4">
                {result.expertAnalysis
                  .filter(e => !selectedExpert || e.character === selectedExpert)
                  .map((expert, idx) => (
                  <motion.div
                    key={expert.character}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-dark-800/50 backdrop-blur rounded-2xl p-6 border border-dark-700"
                  >
                    {/* 전문가 헤더 */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/20">
                        <Image
                          src={CHARACTER_IMAGES[expert.character as keyof typeof CHARACTER_IMAGES] || CHARACTER_IMAGES.claude}
                          alt={expert.nameKo}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{expert.nameKo}</h3>
                        <p className="text-sm text-gray-400">{expert.title}</p>
                      </div>
                      {expert.success && (
                        <div className="ml-auto text-right">
                          <div className="text-sm text-gray-400">예상 수익률</div>
                          <div className="text-lg font-bold text-green-400">{expert.expectedReturn}</div>
                        </div>
                      )}
                    </div>

                    {expert.success ? (
                      <>
                        {/* 개인 메시지 */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                          <p className="text-gray-200 leading-relaxed italic">&ldquo;{expert.personalMessage}&rdquo;</p>
                        </div>

                        {/* 강점 분석 */}
                        {expert.strengthAnalysis && (
                          <div className="mb-3">
                            <span className="text-green-400 font-medium">✨ </span>
                            <span className="text-gray-300">{expert.strengthAnalysis}</span>
                          </div>
                        )}

                        {/* 위험 경고 */}
                        {expert.riskWarning && (
                          <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <span className="text-yellow-400 font-medium">⚠️ </span>
                            <span className="text-gray-300">{expert.riskWarning}</span>
                          </div>
                        )}

                        {/* 추천 ETF */}
                        {expert.recommendations.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-gray-400 mb-2">📊 추천 포트폴리오</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {expert.recommendations.map((rec, i) => (
                                <div key={i} className="p-3 bg-dark-700/50 rounded-lg text-center">
                                  <div className="font-bold text-white">{rec.ticker}</div>
                                  <div className="text-xs text-gray-400">{rec.allocation}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 전략 */}
                        {expert.strategy && (
                          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <span className="text-blue-400 font-medium">🎯 전략: </span>
                            <span className="text-gray-300">{expert.strategy}</span>
                          </div>
                        )}

                        {/* 액션 아이템 */}
                        {expert.actionItem && (
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <span className="text-green-400 font-medium">✅ 지금 당장: </span>
                            <span className="text-gray-300">{expert.actionItem}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500 italic">{expert.personalMessage}</div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={restartTest}
                  className="px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                >
                  🔄 다시 테스트하기
                </button>
                <button
                  onClick={() => {
                    // 투자 성향 데이터를 sessionStorage에 저장
                    const investorData = {
                      code: result.investorType.code,
                      name: result.investorType.name,
                      nickname: result.investorType.nickname,
                      advice: result.investorType.advice,
                      compatibleETFs: result.investorType.compatibleETFs,
                      scores: result.scores,
                    };
                    sessionStorage.setItem('investorProfile', JSON.stringify(investorData));
                    window.location.href = '/portfolio-builder?fromTest=true';
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-center"
                >
                  ✨ 내 성향에 맞는 포트폴리오 만들기
                </button>
              </div>

              {/* 공유 버튼 */}
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">친구에게 공유하기</p>
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => {
                      const text = `나의 투자 DNA는 ${result.investorType.code} "${result.investorType.name}" ${result.investorType.emoji}\n\n${result.investorType.description}\n\n나도 테스트하기 👉`;
                      navigator.clipboard.writeText(text);
                      alert('클립보드에 복사되었습니다!');
                    }}
                    className="px-4 py-2 bg-dark-700 rounded-lg text-gray-300 hover:bg-dark-600 transition-colors text-sm"
                  >
                    📋 결과 복사
                  </button>
                </div>
              </div>

              {/* 면책 조항 */}
              <p className="text-center text-gray-500 text-xs">
                * 본 테스트는 AI 분석에 기반하며, 투자 권유가 아닙니다. 투자 결정 전 전문가와 상담하세요.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
