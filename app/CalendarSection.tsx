'use client';

import { useState } from 'react';
import { Calendar, VerdictDetail } from '@/components/Calendar';

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
}

interface DailyVerdict {
  date: string;
  top5: Top5Item[];
  isGenerated: boolean;
}

export function CalendarSection() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedVerdict, setSelectedVerdict] = useState<DailyVerdict | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleDateSelect(date: string, verdict: DailyVerdict | null) {
    setSelectedDate(date);
    setSelectedVerdict(verdict);
  }

  async function handleGenerateToday() {
    if (!selectedDate) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/calendar/generate-today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedVerdict({
          date: data.data.date,
          top5: data.data.top5,
          isGenerated: true,
        });
      }
    } catch (error) {
      console.error('Failed to generate today verdict:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="relative py-8 sm:py-12 md:py-16 border-t border-dark-800/50">
      <div className="container-app">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-dark-50 mb-2 sm:mb-4">
            AI ETF Pick Calendar
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-dark-400 max-w-xl mx-auto px-4">
            날짜별 AI가 선정한 Top 5 ETF를 확인하세요.
            <span className="hidden sm:inline"> 오늘 날짜를 선택하면 실시간 AI 분석을 생성할 수 있습니다.</span>
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="w-full lg:w-2/3">
            <Calendar onDateSelect={handleDateSelect} />
          </div>

          {/* Detail Panel */}
          <div className="w-full lg:w-1/3">
            {selectedDate ? (
              <VerdictDetail
                date={selectedDate}
                verdict={selectedVerdict}
                onGenerateClick={handleGenerateToday}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="card text-center py-8 sm:py-12 md:py-16">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">📊</div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-200 mb-1 sm:mb-2">날짜를 선택하세요</h3>
                <p className="text-xs sm:text-sm text-dark-500 px-4">
                  달력에서 날짜를 클릭하면 해당일의 Top 5 ETF를 볼 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card max-w-md text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-dark-700" />
                <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-dark-100 mb-2">AI ETF 분석 중</h3>
              <p className="text-dark-400 mb-4">
                Claude, Gemini, GPT가 ETF를 분석하고 있습니다.
                잠시만 기다려주세요...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                약 1-2분 소요
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
