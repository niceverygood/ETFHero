'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CharacterAvatar } from '@/components/CharacterAvatar';
import type { TradingSignal, SignalType, AIOpinion } from '@/lib/signals/types';

interface NotificationPreferences {
  enabledSignalTypes: SignalType[];
  minStrength: number;
  unanimousOnly: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    telegram?: string;
  };
}

const SIGNAL_STYLES: Record<SignalType, { bg: string; text: string; border: string; emoji: string; label: string }> = {
  'STRONG_BUY': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50', emoji: '🚀', label: '적극 매수' },
  'BUY': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50', emoji: '📈', label: '매수' },
  'HOLD': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50', emoji: '⏸️', label: '보유' },
  'SELL': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50', emoji: '📉', label: '매도' },
  'STRONG_SELL': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', emoji: '🔻', label: '적극 매도' },
};

interface Performance {
  hitRate: number;
  avgReturn: number;
  totalSignals: number;
  winCount: number;
  lossCount: number;
}

export default function SignalsPage() {
  const [activeSignals, setActiveSignals] = useState<TradingSignal[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<TradingSignal[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    enabledSignalTypes: ['STRONG_BUY', 'STRONG_SELL'],
    minStrength: 70,
    unanimousOnly: false,
    notifications: { email: false, push: true },
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  
  // 필터
  const [filter, setFilter] = useState<{
    type: SignalType | 'all';
    unanimousOnly: boolean;
    minStrength: number;
  }>({
    type: 'all',
    unanimousOnly: false,
    minStrength: 60,
  });

  // 시그널 로드
  const loadSignals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.set('type', filter.type);
      if (filter.unanimousOnly) params.set('unanimous', 'true');
      if (filter.minStrength > 0) params.set('minStrength', filter.minStrength.toString());

      const response = await fetch(`/api/signals?${params}`);
      const data = await response.json();

      if (data.success) {
        setActiveSignals(data.data.activeSignals);
        setRecentCompleted(data.data.recentCompleted);
        setPerformance(data.data.performance);
      }
    } catch (error) {
      console.error('Failed to load signals:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 시그널 스캔
  const scanSignals = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      });
      const data = await response.json();
      console.log('Scan response:', data);
      if (data.success && data.data) {
        // 스캔 결과를 바로 표시
        const signals = data.data.activeSignals || data.data.signals || [];
        console.log('Setting active signals:', signals);
        setActiveSignals(signals);
      }
    } catch (error) {
      console.error('Failed to scan signals:', error);
    } finally {
      setScanning(false);
    }
  };

  // 알림 설정 로드
  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/signals/preferences');
      const data = await response.json();
      if (data.success) {
        setNotifPrefs(data.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  // 알림 설정 저장
  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const response = await fetch('/api/signals/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifPrefs),
      });
      const data = await response.json();
      if (data.success) {
        alert('알림 설정이 저장되었습니다!');
        setShowNotificationModal(false);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSavingPrefs(false);
    }
  };

  useEffect(() => {
    loadSignals();
    loadPreferences();
  }, [loadSignals]);

  // 시그널 카드 컴포넌트
  const SignalCard = ({ signal }: { signal: TradingSignal }) => {
    const style = SIGNAL_STYLES[signal.signalType];
    
    return (
      <div
        className={`${style.bg} ${style.border} border rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-all`}
        onClick={() => setSelectedSignal(signal)}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl`}>{style.emoji}</div>
            <div>
              <div className="font-bold text-lg">{signal.ticker}</div>
              <div className="text-sm text-dark-400">{signal.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${style.text}`}>{style.label}</div>
            <div className="text-xs text-dark-400">강도 {signal.strength}%</div>
          </div>
        </div>

        {/* 만장일치 배지 */}
        {signal.isUnanimous && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium mb-3">
            🎯 만장일치
          </div>
        )}

        {/* 가격 정보 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-dark-500">현재가</div>
            <div className="font-semibold">${signal.currentPrice}</div>
          </div>
          <div className="bg-dark-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-dark-500">목표가</div>
            <div className={`font-semibold ${style.text}`}>${signal.targetPrice}</div>
          </div>
          <div className="bg-dark-800/50 rounded-lg p-2 text-center">
            <div className="text-xs text-dark-500">예상수익</div>
            <div className={`font-semibold ${signal.potentialReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {signal.potentialReturn >= 0 ? '+' : ''}{signal.potentialReturn}%
            </div>
          </div>
        </div>

        {/* AI 의견 미리보기 */}
        <div className="flex justify-center gap-2">
          {signal.opinions.map((opinion) => (
            <div key={opinion.character} className="flex items-center gap-1">
              <CharacterAvatar character={opinion.character} size="sm" />
              <span className={`text-xs ${SIGNAL_STYLES[opinion.signal].text}`}>
                {SIGNAL_STYLES[opinion.signal].emoji}
              </span>
            </div>
          ))}
        </div>

        {/* 타임스탬프 */}
        <div className="text-xs text-dark-500 text-center mt-3">
          {new Date(signal.createdAt).toLocaleString('ko-KR')}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900/20 to-dark-950 py-12">
        <div className="container-app">
          <div className="flex items-center gap-2 text-purple-400 mb-4">
            <Link href="/" className="hover:text-purple-300">홈</Link>
            <span>/</span>
            <span className="text-dark-300">AI 매매 시그널</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                🎯 AI 매매 시그널
              </h1>
              <p className="text-dark-300 text-lg">
                Claude, Gemini, GPT 3인방의 합의 기반 매수/매도 신호
              </p>
            </div>
            <button
              onClick={scanSignals}
              disabled={scanning}
              className={`px-6 py-3 rounded-xl font-medium transition ${
                scanning
                  ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {scanning ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  스캔 중...
                </span>
              ) : (
                '🔍 시그널 스캔'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        {/* 성과 통계 */}
        {performance && performance.totalSignals > 0 && (
          <div className="bg-gradient-to-r from-purple-900/30 to-dark-900 rounded-2xl p-6 border border-purple-800/30 mb-8">
            <h3 className="text-lg font-semibold mb-4">📊 시그널 성과</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{performance.hitRate}%</div>
                <div className="text-sm text-dark-400">적중률</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <div className={`text-3xl font-bold ${performance.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {performance.avgReturn >= 0 ? '+' : ''}{performance.avgReturn}%
                </div>
                <div className="text-sm text-dark-400">평균 수익률</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{performance.totalSignals}</div>
                <div className="text-sm text-dark-400">총 시그널</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{performance.winCount}</div>
                <div className="text-sm text-dark-400">적중</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{performance.lossCount}</div>
                <div className="text-sm text-dark-400">미적중</div>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">시그널:</span>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as SignalType | 'all' })}
              className="px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-sm"
            >
              <option value="all">전체</option>
              <option value="STRONG_BUY">🚀 적극 매수</option>
              <option value="BUY">📈 매수</option>
              <option value="HOLD">⏸️ 보유</option>
              <option value="SELL">📉 매도</option>
              <option value="STRONG_SELL">🔻 적극 매도</option>
            </select>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.unanimousOnly}
              onChange={(e) => setFilter({ ...filter, unanimousOnly: e.target.checked })}
              className="w-4 h-4 rounded bg-dark-800 border-dark-600"
            />
            <span className="text-sm text-dark-300">🎯 만장일치만</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">최소 강도:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filter.minStrength}
              onChange={(e) => setFilter({ ...filter, minStrength: parseInt(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm text-dark-300">{filter.minStrength}%</span>
          </div>
        </div>

        {/* 활성 시그널 */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            활성 시그널 ({activeSignals.length})
          </h2>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-dark-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-6 bg-dark-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-dark-700 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeSignals.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-900 rounded-2xl">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-dark-400 mb-4">활성 시그널이 없습니다</p>
              <button
                onClick={scanSignals}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600"
              >
                시그널 스캔하기
              </button>
            </div>
          )}
        </div>

        {/* 완료된 시그널 */}
        {recentCompleted.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">📋 최근 완료된 시그널</h2>
            <div className="bg-dark-900 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">ETF</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">시그널</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">진입가</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">결과가</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">수익률</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">적중</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompleted.map((signal) => {
                    const style = SIGNAL_STYLES[signal.signalType];
                    return (
                      <tr key={signal.id} className="border-t border-dark-800">
                        <td className="px-4 py-3">
                          <div className="font-medium">{signal.ticker}</div>
                          <div className="text-xs text-dark-500">{signal.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${style.text}`}>{style.emoji} {style.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">${signal.currentPrice}</td>
                        <td className="px-4 py-3 text-right">${signal.outcome?.finalPrice}</td>
                        <td className={`px-4 py-3 text-right font-medium ${(signal.outcome?.actualReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(signal.outcome?.actualReturn || 0) >= 0 ? '+' : ''}{signal.outcome?.actualReturn}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          {signal.outcome?.isHit ? '✅' : '❌'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 알림 설정 섹션 */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-dark-900 rounded-2xl p-8 border border-purple-800/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                🔔 시그널 알림 설정
              </h3>
              <p className="text-dark-400 text-sm mt-1">
                관심 있는 시그널 발생 시 알림을 받으세요
              </p>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600"
            >
              설정하기
            </button>
          </div>
          
          {/* 현재 설정 미리보기 */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-sm text-dark-400 mb-1">알림 받을 시그널</div>
              <div className="flex flex-wrap gap-1">
                {notifPrefs.enabledSignalTypes.length > 0 ? (
                  notifPrefs.enabledSignalTypes.map(type => (
                    <span key={type} className={`text-xs px-2 py-0.5 rounded ${SIGNAL_STYLES[type].bg} ${SIGNAL_STYLES[type].text}`}>
                      {SIGNAL_STYLES[type].emoji} {SIGNAL_STYLES[type].label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-dark-500">설정 안됨</span>
                )}
              </div>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-sm text-dark-400 mb-1">최소 강도</div>
              <div className="font-bold">{notifPrefs.minStrength}% 이상</div>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-sm text-dark-400 mb-1">알림 채널</div>
              <div className="flex gap-2">
                {notifPrefs.notifications.push && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">📱 푸시</span>}
                {notifPrefs.notifications.email && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">📧 이메일</span>}
                {notifPrefs.notifications.telegram && <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">💬 텔레그램</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 프리미엄 안내 */}
        <div className="mt-8 bg-gradient-to-r from-amber-900/30 to-dark-900 rounded-2xl p-8 border border-amber-800/30 text-center">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-2">프리미엄 시그널 알림</h3>
          <p className="text-dark-400 mb-6">
            만장일치 시그널 발생 시 실시간으로 알림을 받으세요.<br />
            카카오톡, 텔레그램, 이메일로 즉시 전송됩니다.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90">
            프리미엄 구독하기 - 월 9,900원
          </button>
        </div>
      </div>

      {/* 시그널 상세 모달 */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedSignal(null)}>
          <div className="bg-dark-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl`}>{SIGNAL_STYLES[selectedSignal.signalType].emoji}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSignal.ticker}</h2>
                    <p className="text-dark-400">{selectedSignal.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="p-2 rounded-lg hover:bg-dark-800"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 시그널 정보 */}
              <div className={`${SIGNAL_STYLES[selectedSignal.signalType].bg} rounded-xl p-4 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xl font-bold ${SIGNAL_STYLES[selectedSignal.signalType].text}`}>
                      {SIGNAL_STYLES[selectedSignal.signalType].label}
                    </span>
                    {selectedSignal.isUnanimous && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        만장일치
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-dark-400">시그널 강도</div>
                    <div className="text-xl font-bold">{selectedSignal.strength}%</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-dark-300">{selectedSignal.consensusSummary}</p>
              </div>

              {/* 가격 정보 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-dark-500">현재가</div>
                  <div className="font-bold">${selectedSignal.currentPrice}</div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-dark-500">목표가</div>
                  <div className={`font-bold ${SIGNAL_STYLES[selectedSignal.signalType].text}`}>
                    ${selectedSignal.targetPrice}
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-dark-500">손절가</div>
                  <div className="font-bold text-red-400">${selectedSignal.stopLoss}</div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-dark-500">R/R 비율</div>
                  <div className="font-bold">{selectedSignal.riskRewardRatio}</div>
                </div>
              </div>

              {/* AI 의견 상세 */}
              <h3 className="font-bold mb-4">🤖 AI 전문가 의견</h3>
              <div className="space-y-4">
                {selectedSignal.opinions.map((opinion) => (
                  <div key={opinion.character} className="bg-dark-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CharacterAvatar character={opinion.character} size="md" />
                      <div>
                        <div className="font-medium capitalize">{opinion.character}</div>
                        <div className={`text-sm ${SIGNAL_STYLES[opinion.signal].text}`}>
                          {SIGNAL_STYLES[opinion.signal].emoji} {SIGNAL_STYLES[opinion.signal].label} (신뢰도 {opinion.confidence}%)
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-xs text-dark-500">목표가</div>
                        <div className="font-bold">${opinion.targetPrice}</div>
                      </div>
                    </div>
                    <p className="text-sm text-dark-300 mb-2">{opinion.reasoning}</p>
                    <div className="flex flex-wrap gap-2">
                      {opinion.keyFactors.map((factor, idx) => (
                        <span key={idx} className="text-xs bg-dark-700 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 mt-6">
                <Link
                  href={`/battle/${selectedSignal.ticker}`}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium text-center hover:bg-purple-600"
                >
                  🎭 토론 보기
                </Link>
                <button 
                  onClick={() => {
                    setSelectedSignal(null);
                    setShowNotificationModal(true);
                  }}
                  className="flex-1 py-3 bg-dark-700 text-white rounded-xl font-medium hover:bg-dark-600"
                >
                  🔔 알림 설정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 알림 설정 모달 */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowNotificationModal(false)}>
          <div className="bg-dark-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">🔔 알림 설정</h2>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-2 rounded-lg hover:bg-dark-800"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 시그널 타입 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">알림 받을 시그널</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'] as SignalType[]).map(type => {
                    const style = SIGNAL_STYLES[type];
                    const isSelected = notifPrefs.enabledSignalTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const newTypes = isSelected
                            ? notifPrefs.enabledSignalTypes.filter(t => t !== type)
                            : [...notifPrefs.enabledSignalTypes, type];
                          setNotifPrefs({ ...notifPrefs, enabledSignalTypes: newTypes });
                        }}
                        className={`p-3 rounded-xl border-2 transition ${
                          isSelected
                            ? `${style.bg} ${style.border} ${style.text}`
                            : 'bg-dark-800 border-dark-700 text-dark-400'
                        }`}
                      >
                        <span className="text-lg mr-2">{style.emoji}</span>
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 최소 강도 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  최소 시그널 강도: <span className="text-purple-400">{notifPrefs.minStrength}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={notifPrefs.minStrength}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, minStrength: parseInt(e.target.value) })}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 만장일치만 */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-dark-800 rounded-xl">
                  <input
                    type="checkbox"
                    checked={notifPrefs.unanimousOnly}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, unanimousOnly: e.target.checked })}
                    className="w-5 h-5 rounded bg-dark-700 border-dark-600"
                  />
                  <div>
                    <div className="font-medium">🎯 만장일치 시그널만</div>
                    <div className="text-sm text-dark-400">3명의 AI가 모두 동의한 경우에만 알림</div>
                  </div>
                </label>
              </div>

              {/* 알림 채널 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">알림 채널</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-dark-800 rounded-xl">
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifications.push}
                      onChange={(e) => setNotifPrefs({
                        ...notifPrefs,
                        notifications: { ...notifPrefs.notifications, push: e.target.checked }
                      })}
                      className="w-5 h-5 rounded bg-dark-700 border-dark-600"
                    />
                    <div>
                      <div className="font-medium">📱 푸시 알림</div>
                      <div className="text-sm text-dark-400">브라우저 푸시 알림</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-dark-800 rounded-xl">
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifications.email}
                      onChange={(e) => setNotifPrefs({
                        ...notifPrefs,
                        notifications: { ...notifPrefs.notifications, email: e.target.checked }
                      })}
                      className="w-5 h-5 rounded bg-dark-700 border-dark-600"
                    />
                    <div>
                      <div className="font-medium">📧 이메일</div>
                      <div className="text-sm text-dark-400">가입된 이메일로 전송</div>
                    </div>
                  </label>
                  <div className="p-4 bg-dark-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">💬</span>
                      <div className="font-medium">텔레그램</div>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">프리미엄</span>
                    </div>
                    <input
                      type="text"
                      placeholder="텔레그램 채팅 ID"
                      value={notifPrefs.notifications.telegram || ''}
                      onChange={(e) => setNotifPrefs({
                        ...notifPrefs,
                        notifications: { ...notifPrefs.notifications, telegram: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className={`w-full py-4 rounded-xl font-bold text-center ${
                  savingPrefs
                    ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                {savingPrefs ? '저장 중...' : '설정 저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

