'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INKCHAT_URL = 'https://inkchat.ai/character/149f8626-8743-426a-984a-a589c4f55eee';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // 3초 후 툴팁 자동 숨김
  useState(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  });

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* 툴팁 */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg text-sm font-medium max-w-[200px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🏦</span>
                <span>삼성 ETF 전문가에게 물어보세요!</span>
              </div>
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 버튼 */}
        <motion.button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center group"
        >
          {/* 삼성 로고 스타일 */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">💬</span>
          </div>
          
          {/* 펄스 애니메이션 */}
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          
          {/* 호버 시 텍스트 */}
          <div className="absolute -left-32 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
            삼성 ETF 전문가
          </div>
        </motion.button>
      </div>

      {/* 채팅 모달 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* 채팅 창 */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-32px)] md:w-[420px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">🏦</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">삼성 ETF 전문가</h3>
                    <p className="text-xs text-blue-100">Samsung Asset Management</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 새 창에서 열기 */}
                  <a
                    href={INKCHAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="새 창에서 열기"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* iframe으로 InkChat 삽입 */}
              <iframe
                src={INKCHAT_URL}
                className="flex-1 w-full border-0"
                allow="microphone"
                title="삼성 ETF 전문가 챗봇"
              />

              {/* 푸터 */}
              <div className="bg-gray-50 px-4 py-2 text-center border-t">
                <p className="text-xs text-gray-500">
                  Powered by <a href="https://inkchat.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">InkChat AI</a>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

