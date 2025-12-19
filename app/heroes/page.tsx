'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CharacterAvatar } from '@/components/CharacterAvatar';

// 캐릭터 히어로 데이터
const HEROES = [
  {
    id: 'claude',
    name: 'Claude Lee',
    nameKo: '클로드 리',
    title: '숫자의 검사',
    subtitle: 'Balanced Analyst',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    tagline: '감(感)에만 의존한 투자를 멀리하세요.',
    description: '철저한 숫자 감각에 의존한 Top 5 추천을 만나보세요',
    philosophy: '"숫자는 거짓말하지 않습니다. 감정이 아닌 데이터로 투자하세요."',
    traits: [
      { icon: '📊', text: 'PER, PBR 기반 밸류에이션 분석' },
      { icon: '💰', text: '현금흐름 & 재무건전성 검증' },
      { icon: '📈', text: '실적 성장률 & 수익성 지표' },
    ],
    criteria: '펀더멘털이 검증된 저평가 우량주',
    buttonText: '클로드리의 Top 5 받아보기',
    avatar: '/avatars/claude.png',
  },
  {
    id: 'gemini',
    name: 'Gemi Nine',
    nameKo: '제미나인',
    title: '파괴적 혁신가',
    subtitle: 'Future Trend Strategist',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    tagline: '남들이 "미쳤다"고 할 때가 기회입니다.',
    description: '혁신과 성장에 베팅하는 공격적 Top 5를 만나보세요',
    philosophy: '"역사는 미친 놈들이 만들어요. 테슬라도, 엔비디아도 처음엔 미쳤다고 했죠."',
    traits: [
      { icon: '🚀', text: 'AI, 반도체, 혁신 테마주' },
      { icon: '📱', text: '신성장 산업 & 기술 트렌드' },
      { icon: '🎯', text: 'TAM 확대 & 시장 지배력' },
    ],
    criteria: '미래를 선도할 고성장 혁신 기업',
    buttonText: '제미나인의 Top 5 받아보기',
    avatar: '/avatars/gemini.png',
  },
  {
    id: 'gpt',
    name: 'G.P. Taylor',
    nameKo: 'G.P. 테일러',
    title: '월가의 노장',
    subtitle: 'Chief Macro & Risk Officer',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    tagline: '살아남아야 다음 기회가 있습니다.',
    description: '40년 경험이 담긴 리스크 최소화 Top 5를 만나보세요',
    philosophy: '"시장은 당신이 버틸 수 있는 것보다 더 오래 비이성적일 수 있습니다."',
    traits: [
      { icon: '🛡️', text: '변동성 대비 안정적 수익' },
      { icon: '💵', text: '배당 & 현금창출력 우선' },
      { icon: '🌍', text: '거시경제 리스크 고려' },
    ],
    criteria: '어떤 위기에도 버틸 수 있는 방어주',
    buttonText: '쥐피테일러의 Top 5 받아보기',
    avatar: '/avatars/gpt.png',
  },
];

export default function HeroesPage() {
  const [hoveredHero, setHoveredHero] = useState<string | null>(null);

  return (
    <>
      <main className="min-h-screen bg-dark-950 pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* Hero Section */}
      <section className="container-app mb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient">Stock Heros</span>
          </h1>
          <p className="text-lg sm:text-xl text-dark-300 mb-4">
            세 명의 전설적 AI 애널리스트가 당신만을 위한 종목을 추천합니다
          </p>
          <p className="text-dark-400">
            각자의 투자 철학과 분석 기준으로 엄선한 Top 5를 만나보세요
          </p>
        </div>
      </section>

      {/* Heroes Grid */}
      <section className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {HEROES.map((hero) => (
            <div
              key={hero.id}
              className={`relative group rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-500 ${
                hoveredHero === hero.id ? 'lg:scale-105 z-10' : 'lg:scale-100'
              }`}
              onMouseEnter={() => setHoveredHero(hero.id)}
              onMouseLeave={() => setHoveredHero(null)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${hero.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              {/* Card Content */}
              <div className={`relative glass ${hero.borderColor} border-2 rounded-2xl lg:rounded-3xl p-6 sm:p-8 h-full flex flex-col`}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${hero.color} p-0.5 shrink-0`}>
                    <div className="w-full h-full rounded-2xl bg-dark-900 flex items-center justify-center overflow-hidden">
                      <CharacterAvatar character={hero.id as 'claude' | 'gemini' | 'gpt'} size="lg" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{hero.name}</h2>
                    <p className={`text-sm ${hero.textColor} font-medium`}>{hero.title}</p>
                    <p className="text-xs text-dark-400">{hero.subtitle}</p>
                  </div>
                </div>

                {/* Tagline */}
                <div className={`${hero.bgColor} rounded-xl p-4 sm:p-5 mb-6`}>
                  <p className={`text-lg sm:text-xl font-bold ${hero.textColor} mb-2`}>
                    &quot;{hero.tagline}&quot;
                  </p>
                  <p className="text-sm sm:text-base text-dark-200">
                    {hero.description}
                  </p>
                </div>

                {/* Philosophy Quote */}
                <blockquote className="text-dark-400 text-sm italic mb-6 pl-4 border-l-2 border-dark-700">
                  {hero.philosophy}
                </blockquote>

                {/* Traits */}
                <div className="space-y-3 mb-6 flex-1">
                  <p className="text-xs text-dark-500 uppercase tracking-wider font-medium">분석 기준</p>
                  {hero.traits.map((trait, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-lg">{trait.icon}</span>
                      <span className="text-sm text-dark-300">{trait.text}</span>
                    </div>
                  ))}
                </div>

                {/* Criteria Badge */}
                <div className={`${hero.bgColor} rounded-lg px-4 py-2 mb-6`}>
                  <p className="text-xs text-dark-400 mb-1">추천 기준</p>
                  <p className={`text-sm font-medium ${hero.textColor}`}>{hero.criteria}</p>
                </div>

                {/* CTA Button */}
                <Link
                  href={`/heroes/${hero.id}`}
                  className={`w-full py-4 rounded-xl font-bold text-center text-white bg-gradient-to-r ${hero.color} hover:opacity-90 transition-all group-hover:shadow-lg group-hover:shadow-${hero.id === 'claude' ? 'blue' : hero.id === 'gemini' ? 'purple' : 'amber'}-500/20`}
                >
                  {hero.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container-app mt-16">
        <div className="glass rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
            세 분석가의 의견이 궁금하신가요?
          </h3>
          <p className="text-dark-400 mb-6">
            특정 종목에 대해 세 AI가 토론하는 모습을 지켜보세요
          </p>
          <Link
            href="/battle/005930"
            className="inline-flex items-center gap-2 btn-primary px-6 py-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI 토론 보러가기
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}

