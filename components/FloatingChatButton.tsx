'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INKCHAT_URL = 'https://inkchat.ai/character/149f8626-8743-426a-984a-a589c4f55eee';

export function FloatingChatButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  // 5초 후 툴팁 자동 숨김
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    window.open(INKCHAT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 툴팁 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="relative bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg text-sm font-medium max-w-[220px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🏦</span>
              <span>삼성 ETF 전문가에게 물어보세요!</span>
            </div>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 버튼 */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group"
        aria-label="삼성 ETF 전문가 챗봇 열기"
      >
        {/* 채팅 아이콘 */}
        <span className="text-2xl">💬</span>
        
        {/* 펄스 애니메이션 */}
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
        
        {/* 호버 시 레이블 */}
        <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
          삼성 ETF 전문가
          <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45 -translate-y-1/2" />
        </div>
      </motion.button>
    </div>
  );
}
