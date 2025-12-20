'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';

// 메인 네비게이션 링크
const NAV_LINKS = [
  { href: '/signals', label: '시그널', icon: '🎯', priority: 1 },
  { href: '/verdict', label: 'Top5', icon: '', priority: 1 },
  { href: '/heroes', label: 'AI', icon: '', priority: 2 },
  { href: '/backtest', label: '백테스트', icon: '', priority: 2 },
  { href: '/dividend', label: '배당', icon: '', priority: 3 },
  { href: '/compare', label: '비교', icon: '', priority: 3 },
  { href: '/battle/SPY', label: '토론', icon: '', priority: 1 },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // 화면 크기별로 표시할 링크 필터링 (priority 1: 항상, 2: lg 이상, 3: xl 이상)
  const getVisibilityClass = (priority: number) => {
    if (priority === 1) return 'flex';
    if (priority === 2) return 'hidden lg:flex';
    return 'hidden xl:flex';
  };

  return (
    <header className="fixed top-[41px] left-0 right-0 z-40">
      <div className="container-app py-2 sm:py-3">
        <nav className="glass rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">E</span>
              </div>
              <span className="font-semibold text-dark-100 group-hover:text-white transition-colors text-sm sm:text-base whitespace-nowrap">
                ETFHero
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-shrink-0">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${getVisibilityClass(link.priority)} items-center px-2 lg:px-3 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg transition-all whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-brand-400 bg-brand-500/10'
                      : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                  }`}
                >
                  {link.icon && <span className="mr-1">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              {/* 더보기 메뉴 (중간 화면에서) */}
              <div className="relative group xl:hidden">
                <button className="flex items-center px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 transition-all">
                  더보기
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 py-2 bg-dark-900 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {NAV_LINKS.filter(link => link.priority >= 2).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-2 text-sm ${
                        isActive(link.href)
                          ? 'text-brand-400 bg-brand-500/10'
                          : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      }`}
                    >
                      {link.icon && <span className="mr-2">{link.icon}</span>}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="ml-2 lg:ml-3 pl-2 lg:pl-3 border-l border-dark-700 flex-shrink-0">
                <UserMenu />
              </div>
            </div>

            {/* Mobile Menu Button & User Menu */}
            <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
              <UserMenu />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 rounded-lg transition-all"
                aria-label="메뉴 열기"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-dark-700/50">
              <div className="grid grid-cols-2 gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm rounded-lg transition-all text-center ${
                      isActive(link.href)
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800/50'
                    }`}
                  >
                    {link.icon && <span className="mr-1">{link.icon}</span>}
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
