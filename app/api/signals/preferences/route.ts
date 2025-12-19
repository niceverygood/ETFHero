import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { SignalType, UserSignalPreferences } from '@/lib/signals/types';

// 메모리 저장소 (실제로는 DB 사용)
const userPreferences = new Map<string, UserSignalPreferences>();

// 기본 설정
const DEFAULT_PREFERENCES: Omit<UserSignalPreferences, 'userId'> = {
  enabledSignalTypes: ['STRONG_BUY', 'STRONG_SELL'],
  minStrength: 70,
  unanimousOnly: false,
  categories: [],
  notifications: {
    email: false,
    push: true,
    telegram: undefined,
  },
};

/**
 * GET /api/signals/preferences
 * 
 * 사용자 시그널 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 임시 사용자 ID (실제로는 인증에서 가져옴)
    const userId = cookies().get('user_id')?.value || 'anonymous';

    const preferences = userPreferences.get(userId) || {
      userId,
      ...DEFAULT_PREFERENCES,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch preferences',
    }, { status: 500 });
  }
}

/**
 * POST /api/signals/preferences
 * 
 * 사용자 시그널 알림 설정 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = cookies().get('user_id')?.value || 'anonymous';

    const {
      enabledSignalTypes,
      minStrength,
      unanimousOnly,
      categories,
      notifications,
    } = body;

    const preferences: UserSignalPreferences = {
      userId,
      enabledSignalTypes: enabledSignalTypes || DEFAULT_PREFERENCES.enabledSignalTypes,
      minStrength: typeof minStrength === 'number' ? minStrength : DEFAULT_PREFERENCES.minStrength,
      unanimousOnly: typeof unanimousOnly === 'boolean' ? unanimousOnly : DEFAULT_PREFERENCES.unanimousOnly,
      categories: Array.isArray(categories) ? categories : DEFAULT_PREFERENCES.categories,
      notifications: {
        email: notifications?.email ?? DEFAULT_PREFERENCES.notifications.email,
        push: notifications?.push ?? DEFAULT_PREFERENCES.notifications.push,
        telegram: notifications?.telegram || undefined,
      },
    };

    userPreferences.set(userId, preferences);

    return NextResponse.json({
      success: true,
      data: preferences,
      message: '알림 설정이 저장되었습니다.',
    });
  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save preferences',
    }, { status: 500 });
  }
}

