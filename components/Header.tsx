'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';

// 메인 네비게이션 링크
const NAV_LINKS = [
  { href: '/signals', label: '시그널', icon: '🎯' },
  { href: '/verdict', label: 'Top5', icon: '' },
  { href: '/heroes', label: 'AI', icon: '' },
  { href: '/backtest', label: '백테스트', icon: '' },
  { href: '/dividend', label: '배당', icon: '' },
  { href: '/compare', label: '비교', icon: '' },
  { href: '/battle/SPY', label: '토론', icon: '' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="fixed top-[41px] left-0 right-0 z-40">
      <div className="container-app py-2 sm:py-3">
        <nav className="glass rounded-xl sm:rounded-2xl px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 sm:gap-2 group shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xs sm:text-sm">E</span>
              </div>
              <span className="hidden xs:block font-semibold text-dark-100 group-hover:text-white transition-colors text-sm sm:text-base whitespace-nowrap">
                ETFHero
              </span>
            </Link>

            {/* Desktop Navigation - 모든 메뉴 항상 표시 */}
            <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-2 lg:px-3 py-1.5 text-2xs sm:text-xs lg:text-sm rounded-lg transition-all whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-brand-400 bg-brand-500/10'
                      : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                  }`}
                >
                  {link.icon && <span className="mr-0.5 sm:mr-1">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              <div className="ml-1 lg:ml-3 pl-1 lg:pl-3 border-l border-dark-700 flex-shrink-0">
                <UserMenu />
              </div>
            </div>

            {/* Mobile Menu Button & User Menu */}
            <div className="flex md:hidden items-center gap-1 flex-shrink-0">
              <UserMenu />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 sm:p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 rounded-lg transition-all"
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
