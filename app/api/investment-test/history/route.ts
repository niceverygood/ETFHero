/**
 * 투자 성향 테스트 기록 API
 * - GET: 사용자의 테스트 기록 조회
 * - POST: 테스트 결과 저장 (일주일에 한 번만 가능)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (서버 사이드)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 테스트 가능 여부 확인 (일주일 제한)
async function canTakeTest(userId: string): Promise<{ canTake: boolean; lastTestAt?: string; nextAvailableAt?: string }> {
  const supabase = getSupabaseClient();
  
  // 최근 테스트 기록 조회
  const { data, error } = await supabase
    .from('investment_test_history')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error checking test history:', error);
    return { canTake: true }; // 에러 시 테스트 허용
  }
  
  if (!data || data.length === 0) {
    return { canTake: true }; // 기록 없음
  }
  
  const lastTestAt = new Date(data[0].created_at);
  const oneWeekLater = new Date(lastTestAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  if (now < oneWeekLater) {
    return {
      canTake: false,
      lastTestAt: lastTestAt.toISOString(),
      nextAvailableAt: oneWeekLater.toISOString(),
    };
  }
  
  return { canTake: true, lastTestAt: lastTestAt.toISOString() };
}

/**
 * GET /api/investment-test/history
 * 사용자의 테스트 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // 테스트 기록 조회
    const { data: history, error } = await supabase
      .from('investment_test_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching test history:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch test history' },
        { status: 500 }
      );
    }
    
    // 테스트 가능 여부 확인
    const testAvailability = await canTakeTest(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        history: history || [],
        canTakeTest: testAvailability.canTake,
        lastTestAt: testAvailability.lastTestAt,
        nextAvailableAt: testAvailability.nextAvailableAt,
      },
    });
    
  } catch (error: any) {
    console.error('Test history GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/investment-test/history
 * 테스트 결과 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, investorType, scores, expertAnalysis } = body;
    
    if (!userId || !investorType) {
      return NextResponse.json(
        { success: false, error: 'User ID and investor type required' },
        { status: 400 }
      );
    }
    
    // 일주일 제한 확인
    const testAvailability = await canTakeTest(userId);
    
    if (!testAvailability.canTake) {
      const nextDate = new Date(testAvailability.nextAvailableAt!);
      const daysLeft = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return NextResponse.json({
        success: false,
        error: `아직 테스트를 할 수 없습니다. ${daysLeft}일 후에 다시 테스트할 수 있습니다.`,
        canTakeTest: false,
        lastTestAt: testAvailability.lastTestAt,
        nextAvailableAt: testAvailability.nextAvailableAt,
      }, { status: 429 });
    }
    
    const supabase = getSupabaseClient();
    
    // 테스트 결과 저장
    const { data, error } = await supabase
      .from('investment_test_history')
      .insert({
        user_id: userId,
        investor_type_code: investorType.code,
        investor_type_name: investorType.name,
        investor_type_emoji: investorType.emoji,
        investor_type_nickname: investorType.nickname,
        investor_type_description: investorType.description,
        scores: scores,
        strengths: investorType.strengths,
        weaknesses: investorType.weaknesses,
        advice: investorType.advice,
        compatible_etfs: investorType.compatibleETFs,
        famous_person: investorType.famousPerson,
        expert_analysis: expertAnalysis,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving test result:', error);
      
      // 테이블이 없으면 생성 안내
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'Test history table not found. Please create the table first.',
          tableCreationSQL: getTableCreationSQL(),
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to save test result' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        record: data,
        message: '테스트 결과가 저장되었습니다.',
      },
    });
    
  } catch (error: any) {
    console.error('Test history POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save test result' },
      { status: 500 }
    );
  }
}

// 테이블 생성 SQL
function getTableCreationSQL(): string {
  return `
-- 투자 성향 테스트 기록 테이블
CREATE TABLE IF NOT EXISTS investment_test_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 투자자 유형 정보
  investor_type_code VARCHAR(4) NOT NULL,
  investor_type_name VARCHAR(50) NOT NULL,
  investor_type_emoji VARCHAR(10),
  investor_type_nickname VARCHAR(100),
  investor_type_description TEXT,
  
  -- 점수
  scores JSONB NOT NULL,
  
  -- 유형 상세
  strengths TEXT[],
  weaknesses TEXT[],
  advice TEXT,
  compatible_etfs TEXT[],
  famous_person VARCHAR(100),
  
  -- AI 분석 결과
  expert_analysis JSONB,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_investment_test_history_user_id ON investment_test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_test_history_created_at ON investment_test_history(created_at DESC);

-- RLS 정책
ALTER TABLE investment_test_history ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 기록만 조회/수정 가능
CREATE POLICY "Users can view own test history" ON investment_test_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test history" ON investment_test_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  `;
}

