-- =====================================================
-- Debate Messages 테이블에 추가 컬럼 생성
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- target_return 컬럼 추가 (예상 수익률)
ALTER TABLE debate_messages 
ADD COLUMN IF NOT EXISTS target_return DECIMAL(8,4);

-- time_horizon 컬럼 추가 (투자 기간)
ALTER TABLE debate_messages 
ADD COLUMN IF NOT EXISTS time_horizon VARCHAR(20);

-- =====================================================
-- Service Role Write Policies (이미 존재하면 스킵)
-- =====================================================

-- debate_sessions에 대한 쓰기 권한 (service role)
DROP POLICY IF EXISTS "service_write_debate_sessions" ON debate_sessions;
CREATE POLICY "service_write_debate_sessions" ON debate_sessions 
FOR ALL USING (true) WITH CHECK (true);

-- debate_messages에 대한 쓰기 권한 (service role)
DROP POLICY IF EXISTS "service_write_debate_messages" ON debate_messages;
CREATE POLICY "service_write_debate_messages" ON debate_messages 
FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 완료!
-- =====================================================

