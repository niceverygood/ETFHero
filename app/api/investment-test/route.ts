/**
 * 투자 성향 테스트 API - MBTI 스타일
 * 16가지 투자자 유형 + 3명의 AI 전문가 분석
 * 
 * 4가지 축:
 * - R/S: Risk-taker vs Safety-first (위험추구 vs 안전추구)
 * - A/I: Analytical vs Intuitive (분석형 vs 직관형)
 * - L/S: Long-term vs Short-term (장기투자 vs 단기투자)
 * - P/F: Passive vs Active (패시브 vs 액티브)
 */

import { NextRequest, NextResponse } from 'next/server';
import { hasOpenRouterKey } from '@/lib/llm/openrouter';
import { US_ETFS, KR_ETFS } from '@/lib/data/etf-list';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// AI 캐릭터별 모델
// 빠른 응답을 위해 경량 모델 사용
const CHARACTER_MODELS = {
  claude: 'anthropic/claude-3-haiku',  // 빠른 모델로 변경
  gemini: 'google/gemini-2.0-flash-001',
  gpt: 'openai/gpt-4o-mini',
};

// 캐릭터 정보
const CHARACTER_INFO = {
  claude: {
    name: 'Claude Lee',
    nameKo: '클로드 리',
    title: '밸류에이션 전문가',
    personality: '신중하고 분석적인 투자 철학',
    avatar: '🎩',
    color: 'from-orange-500 to-amber-500',
  },
  gemini: {
    name: 'Gemi Nine',
    nameKo: '제미나인',
    title: '성장주 전문가',
    personality: '공격적이고 트렌드를 추구하는 스타일',
    avatar: '🚀',
    color: 'from-blue-500 to-cyan-500',
  },
  gpt: {
    name: 'G.P. Taylor',
    nameKo: '쥐피테일러',
    title: '자산배분 전략가',
    personality: '보수적이고 리스크 관리 중심',
    avatar: '📊',
    color: 'from-green-500 to-emerald-500',
  },
};

// 16가지 투자자 유형 정의
const INVESTOR_TYPES: Record<string, {
  name: string;
  emoji: string;
  nickname: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
  compatibleETFs: string[];
  famousPerson: string;
  famousPersonBio: string;
  famousPersonQuote: string;
  famousPersonStyle: string;
}> = {
  'RALP': {
    name: '리스크 테이커',
    emoji: '🦁',
    nickname: '정글의 왕',
    description: '높은 변동성도 두렵지 않은 당신! 분석적으로 접근하면서도 장기적 관점에서 패시브하게 시장을 이기려 합니다. 위기를 기회로 바꾸는 진정한 용기의 투자자.',
    strengths: ['침착한 위기 대응', '장기 복리 효과 극대화', '시장 타이밍 스트레스 없음'],
    weaknesses: ['과도한 위험 노출 가능', '단기 손실에 무감각', '기회비용 간과'],
    advice: '레버리지 ETF나 변동성 높은 섹터 ETF는 비중을 20% 이하로 제한하세요.',
    compatibleETFs: ['QQQ', 'SOXX', 'ARKK', 'TQQQ'],
    famousPerson: '캐시 우드 (ARK Invest)',
    famousPersonBio: 'ARK Invest 창업자. 2020년 테슬라와 혁신 기술주에 대한 과감한 베팅으로 +150% 수익률을 기록하며 월가의 주목을 받았습니다.',
    famousPersonQuote: '"혁신이 세상을 바꾼다. 우리는 변화의 올바른 편에 서야 한다."',
    famousPersonStyle: '파괴적 혁신 기업에 집중 투자하는 테마 투자의 대가. 남들이 무시할 때 확신을 갖고 베팅합니다.',
  },
  'RALA': {
    name: '트렌드 서퍼',
    emoji: '🏄',
    nickname: '파도의 지배자',
    description: '시장의 파도를 읽고 올라타는 액티브 투자자! 리스크를 감수하면서 분석적으로 장기 트렌드를 포착합니다. 테마 투자의 달인.',
    strengths: ['트렌드 포착 능력', '높은 수익 잠재력', '적극적 리밸런싱'],
    weaknesses: ['과잉 거래 위험', '감정적 매매 유혹', '비용 증가'],
    advice: '핵심 보유 70% + 전술적 배분 30% 전략을 추천합니다.',
    compatibleETFs: ['SMH', 'XLK', 'KWEB', 'ARKG'],
    famousPerson: '피터 린치',
    famousPersonBio: '피델리티 마젤란펀드를 13년간 운용하며 연평균 29.2% 수익률을 달성한 전설적인 펀드매니저입니다.',
    famousPersonQuote: '"일상에서 투자 아이디어를 찾아라. 당신이 아는 것에 투자하라."',
    famousPersonStyle: '생활 속에서 성장 기업을 발굴하는 바텀업 투자. 10배 수익 종목(텐배거)을 찾는 것으로 유명합니다.',
  },
  'RASP': {
    name: '스윙 트레이더',
    emoji: '⚡',
    nickname: '번개 손',
    description: '단기 변동성을 즐기는 분석형 투자자! 패시브하게 포지션을 유지하면서도 짧은 사이클에서 수익을 추구합니다.',
    strengths: ['빠른 수익 실현', '시장 변동성 활용', '유연한 대응'],
    weaknesses: ['스트레스 높음', '세금 비효율', '장기 복리 포기'],
    advice: '전체 자산의 30% 이하로 단기 매매를 제한하세요.',
    compatibleETFs: ['SOXL', 'UPRO', 'SPXS', 'VXX'],
    famousPerson: '폴 튜더 존스',
    famousPersonBio: '튜더 인베스트먼트 창업자. 1987년 블랙먼데이를 예측해 200% 수익을 거둔 매크로 트레이딩의 전설입니다.',
    famousPersonQuote: '"손실을 빨리 인정하라. 그것이 가장 중요한 원칙이다."',
    famousPersonStyle: '기술적 분석과 매크로 분석을 결합한 스윙 트레이딩. 철저한 리스크 관리로 유명합니다.',
  },
  'RASA': {
    name: '데이 트레이더',
    emoji: '🎰',
    nickname: '월가의 도박사',
    description: '극도로 공격적인 단기 액티브 투자자! 분석력과 실행력이 뛰어나지만, 높은 리스크를 감수합니다.',
    strengths: ['빠른 의사결정', '기회 포착력', '손절 능력'],
    weaknesses: ['번아웃 위험', '높은 거래비용', '감정 소모'],
    advice: '꼭 손절 라인을 정하고, 하루 손실 한도를 설정하세요.',
    compatibleETFs: ['TQQQ', 'SQQQ', 'UVXY', 'LABU'],
    famousPerson: '제시 리버모어',
    famousPersonBio: '20세기 초 가장 위대한 투기꾼. 1929년 대공황을 예측해 1억 달러(현재 가치 약 15억 달러)를 벌었습니다.',
    famousPersonQuote: '"시장은 절대 틀리지 않는다. 의견은 종종 틀린다."',
    famousPersonStyle: '가격 움직임과 시장 타이밍에 집중하는 순수 투기. 극단적인 집중과 고독한 결정을 추구했습니다.',
  },
  'RILP': {
    name: '비전 홀더',
    emoji: '🔮',
    nickname: '미래를 보는 자',
    description: '직관과 비전으로 장기 투자하는 패시브 투자자! 숫자보다 스토리와 가능성을 봅니다.',
    strengths: ['거시적 시야', '인내심', '혁신 기업 발굴'],
    weaknesses: ['밸류에이션 무시', '확증편향', '손실 인정 지연'],
    advice: '직관을 신뢰하되, 기본적 분석으로 검증하는 습관을 들이세요.',
    compatibleETFs: ['ARKK', 'BOTZ', 'ICLN', 'LIT'],
    famousPerson: '손정의 (소프트뱅크)',
    famousPersonBio: '소프트뱅크 그룹 회장. 알리바바 초기 투자로 2,000배 수익을 거두며 세계 최대 벤처 투자자가 되었습니다.',
    famousPersonQuote: '"30년 후를 내다보고 투자하라. 미래는 이미 시작되었다."',
    famousPersonStyle: '기술 혁명에 대한 확고한 비전으로 초기 스타트업에 대규모 베팅. 300년 비전을 얘기하는 것으로 유명합니다.',
  },
  'RILA': {
    name: '무브먼트 리더',
    emoji: '🚀',
    nickname: '혁명가',
    description: '직관으로 다음 빅 씽을 찾아 적극 투자하는 장기 액티브 투자자! 남들이 모를 때 먼저 움직입니다.',
    strengths: ['선제적 투자', '높은 확신', '대세 선도'],
    weaknesses: ['고집', '분산 부족', '타이밍 리스크'],
    advice: '확신이 있어도 한 종목에 20% 이상 투자하지 마세요.',
    compatibleETFs: ['ARKQ', 'DRIV', 'MOON', 'BLOK'],
    famousPerson: '일론 머스크',
    famousPersonBio: '테슬라, 스페이스X 창업자. 전기차와 우주 산업의 판도를 바꾸며 세계 최고 부자가 되었습니다.',
    famousPersonQuote: '"가장 큰 리스크는 리스크를 감수하지 않는 것이다."',
    famousPersonStyle: '미래 기술에 전 재산을 베팅하는 올인 투자. 실패해도 다시 도전하는 불굴의 의지가 특징입니다.',
  },
  'RISP': {
    name: '모멘텀 라이더',
    emoji: '🎢',
    nickname: '롤러코스터 마니아',
    description: '직관으로 단기 모멘텀을 포착하는 패시브 투자자! 느낌이 올 때까지 기다렸다가 올라탑니다.',
    strengths: ['타이밍 감각', '트렌드 서핑', '빠른 수익'],
    weaknesses: ['FOMO 취약', '일관성 부족', '과잉 확신'],
    advice: '모멘텀 지표(RSI, MACD)를 활용해 직관을 보완하세요.',
    compatibleETFs: ['MTUM', 'FFTY', 'PDP', 'DWAS'],
    famousPerson: '빌 오닐',
    famousPersonBio: 'Investor\'s Business Daily 창업자. CAN SLIM 투자법을 개발해 수많은 개인 투자자에게 영향을 끼쳤습니다.',
    famousPersonQuote: '"시장의 방향을 거스르지 마라. 트렌드를 따라가라."',
    famousPersonStyle: '모멘텀과 기술적 분석을 결합한 성장주 투자. 차트 패턴과 거래량을 중시합니다.',
  },
  'RISA': {
    name: '임펄스 트레이더',
    emoji: '💥',
    nickname: '즉흥 예술가',
    description: '직관과 순발력으로 단기 액티브 매매하는 투자자! 본능을 믿고 빠르게 행동합니다.',
    strengths: ['순발력', '기회 포착', '결단력'],
    weaknesses: ['충동 매매', '복수 매매', '감정 기복'],
    advice: '매매 일지를 작성하고 패턴을 분석하세요. 감정 매매를 줄일 수 있습니다.',
    compatibleETFs: ['SOXS', 'SPXU', 'TMV', 'ERX'],
    famousPerson: '조지 소로스 (젊은 시절)',
    famousPersonBio: '퀀텀펀드 창업자. 1992년 영국 파운드 공매도로 하루 만에 10억 달러를 벌며 "영란은행을 무너뜨린 남자"라는 별명을 얻었습니다.',
    famousPersonQuote: '"먼저 투자하고, 나중에 조사하라." (젊은 시절 스타일)',
    famousPersonStyle: '직관적인 매크로 투자와 과감한 레버리지. 확신이 생기면 올인하는 대담한 스타일입니다.',
  },
  'SALP': {
    name: '워렌 버핏 주니어',
    emoji: '🦉',
    nickname: '현명한 부엉이',
    description: '안전을 추구하면서 분석적으로 장기 패시브 투자하는 정석 투자자! 복리의 마법을 믿습니다.',
    strengths: ['안정적 성장', '낮은 스트레스', '비용 효율'],
    weaknesses: ['기회 손실', '보수적 성향', '성장 한계'],
    advice: '코어-새틀라이트 전략으로 안정성과 성장성을 동시에 추구하세요.',
    compatibleETFs: ['VOO', 'VTI', 'SCHD', 'VIG'],
    famousPerson: '워렌 버핏',
    famousPersonBio: '버크셔 해서웨이 회장. 60년간 연평균 20% 수익률을 기록하며 "오마하의 현인"으로 불리는 가치투자의 전설입니다.',
    famousPersonQuote: '"남들이 탐욕스러울 때 두려워하고, 남들이 두려워할 때 탐욕스러워라."',
    famousPersonStyle: '내재가치 대비 저평가된 우량 기업을 장기 보유. 복리와 인내심의 힘을 믿습니다.',
  },
  'SALA': {
    name: '퀄리티 헌터',
    emoji: '🎯',
    nickname: '가치 사냥꾼',
    description: '안전하면서도 분석적으로 장기 액티브 투자하는 퀄리티 투자자! 좋은 기업을 합리적 가격에 삽니다.',
    strengths: ['펀더멘털 분석', '안전마진 확보', '장기 아웃퍼폼'],
    weaknesses: ['인내심 필요', '밸류 트랩 위험', '성장주 놓침'],
    advice: '분기별 리밸런싱으로 승자와 패자를 구분하세요.',
    compatibleETFs: ['QUAL', 'MOAT', 'DGRW', 'PKW'],
    famousPerson: '찰리 멍거',
    famousPersonBio: '버크셔 해서웨이 부회장. 워렌 버핏의 50년 파트너로, 가치투자에 퀄리티 요소를 더했습니다.',
    famousPersonQuote: '"좋은 기업을 적정 가격에 사는 것이, 평범한 기업을 싸게 사는 것보다 낫다."',
    famousPersonStyle: '경쟁 우위(해자)가 있는 우량 기업에 집중. 다학제적 사고를 통해 투자 결정을 내립니다.',
  },
  'SASP': {
    name: '스마트 세이버',
    emoji: '🐢',
    nickname: '느리지만 확실한',
    description: '안전하고 분석적으로 단기 패시브 투자하는 신중한 투자자! 확실한 것만 믿습니다.',
    strengths: ['원금 보존', '안정적 인컴', '낮은 변동성'],
    weaknesses: ['인플레이션 리스크', '낮은 수익률', '기회비용'],
    advice: '채권 ETF와 배당 ETF를 활용해 안정적 현금흐름을 만드세요.',
    compatibleETFs: ['BND', 'AGG', 'JEPI', 'QYLD'],
    famousPerson: '레이 달리오 (현재)',
    famousPersonBio: '브릿지워터 어소시에이츠 창업자. 세계 최대 헤지펀드를 운용하며 "올웨더 포트폴리오" 전략을 개발했습니다.',
    famousPersonQuote: '"분산투자가 투자에서 유일한 공짜 점심이다."',
    famousPersonStyle: '자산군 간 분산과 리스크 패리티. 모든 시장 상황에서 안정적인 수익을 추구합니다.',
  },
  'SASA': {
    name: '캐시 매니저',
    emoji: '🏦',
    nickname: '금고지기',
    description: '안전하고 분석적으로 단기 액티브 투자하는 현금 관리자! 유동성과 안전성이 최우선.',
    strengths: ['유동성 확보', '기회 대기', '손실 회피'],
    weaknesses: ['현금 마찰', '타이밍 스트레스', '인플레이션 손실'],
    advice: '현금 비중이 30%를 넘지 않도록 하고, MMF나 초단기 채권 ETF를 활용하세요.',
    compatibleETFs: ['SHV', 'BIL', 'SGOV', 'USFR'],
    famousPerson: '하워드 막스',
    famousPersonBio: '오크트리 캐피탈 공동 창업자. "가치 사이클"과 리스크 관리에 관한 통찰력 있는 메모로 유명합니다.',
    famousPersonQuote: '"가장 중요한 것은 손실을 피하는 것이다. 수익은 그 다음이다."',
    famousPersonStyle: '시장 사이클을 읽고 하방 리스크를 관리. 불확실할 때 현금을 모으고 기회를 기다립니다.',
  },
  'SILP': {
    name: '감성 투자자',
    emoji: '🌙',
    nickname: '달빛 투자자',
    description: '안전을 추구하면서 직관으로 장기 패시브 투자하는 감성파! 좋아하는 기업에 장기 투자합니다.',
    strengths: ['심리적 안정', '브랜드 충성도', '장기 보유력'],
    weaknesses: ['객관성 부족', '과잉 애착', '매도 어려움'],
    advice: '좋아하는 기업도 비중 10% 이하로 제한하고, 정기 점검하세요.',
    compatibleETFs: ['VIG', 'NOBL', 'SDY', 'DGRO'],
    famousPerson: '피터 린치 (은퇴 후)',
    famousPersonBio: '은퇴 후 가족과 자선 활동에 집중하며 여유로운 삶을 살고 있습니다. 스트레스 없는 장기 투자를 강조합니다.',
    famousPersonQuote: '"투자에 너무 많은 시간을 쓰지 마라. 인생을 즐겨라."',
    famousPersonStyle: '좋은 기업을 사고 오래 보유. 시장을 자주 확인하지 않고 심리적 안정을 유지합니다.',
  },
  'SILA': {
    name: 'ESG 챔피언',
    emoji: '🌱',
    nickname: '지구 수호자',
    description: '안전과 가치를 추구하며 직관으로 장기 액티브 투자하는 가치 투자자! 돈과 가치를 함께 추구합니다.',
    strengths: ['가치 지향', '장기 비전', '사회적 영향'],
    weaknesses: ['수익률 제한', '주관적 기준', '그린워싱 리스크'],
    advice: 'ESG 평가 기준을 명확히 하고, 다양한 ESG ETF를 비교하세요.',
    compatibleETFs: ['ESGU', 'SUSA', 'ICLN', 'KRMA'],
    famousPerson: '래리 핑크 (블랙록)',
    famousPersonBio: '블랙록 CEO. 세계 최대 자산운용사를 이끌며 ESG 투자의 주류화를 주도하고 있습니다.',
    famousPersonQuote: '"기업의 목적은 이해관계자 모두에게 장기적 가치를 창출하는 것이다."',
    famousPersonStyle: '지속가능한 투자와 스튜어드십. 기업의 장기적 가치와 사회적 책임을 함께 고려합니다.',
  },
  'SISP': {
    name: '힐링 투자자',
    emoji: '🧘',
    nickname: '젠 마스터',
    description: '안전과 평화를 추구하는 직관형 단기 패시브 투자자! 스트레스 없는 투자가 목표입니다.',
    strengths: ['정신 건강', '일관성', '감정 통제'],
    weaknesses: ['너무 보수적', '기회 놓침', '성장 제한'],
    advice: '자동 투자 시스템을 구축하고, 시장을 자주 확인하지 마세요.',
    compatibleETFs: ['SPLV', 'USMV', 'EFAV', 'ACWV'],
    famousPerson: '존 보글',
    famousPersonBio: '뱅가드 창업자. 개인 투자자를 위한 저비용 인덱스 펀드를 개발하여 투자 민주화에 기여했습니다.',
    famousPersonQuote: '"시장을 이기려 하지 마라. 시장을 소유하라."',
    famousPersonStyle: '저비용 인덱스 투자와 장기 보유. 시장 타이밍을 포기하고 단순함을 추구합니다.',
  },
  'SISA': {
    name: '수비형 미드필더',
    emoji: '🛡️',
    nickname: '철벽 수비수',
    description: '안전하면서 직관으로 단기 액티브하게 방어하는 투자자! 수익보다 손실 회피가 먼저.',
    strengths: ['하방 보호', '빠른 철수', '리스크 관리'],
    weaknesses: ['수익 제한', '과잉 방어', '기회비용'],
    advice: '헤지 ETF나 인버스 ETF는 단기 헤지 용도로만 사용하세요.',
    compatibleETFs: ['TAIL', 'BTAL', 'PSQ', 'SH'],
    famousPerson: '나심 탈렙',
    famousPersonBio: '《블랙 스완》 저자. 극단적 리스크(테일 리스크)를 연구하고 안티프래질 투자 철학을 개발했습니다.',
    famousPersonQuote: '"희귀하지만 치명적인 리스크에 대비하라. 그것이 투자의 핵심이다."',
    famousPersonStyle: '테일 리스크 헤지와 블랙스완 대비. 극단적 시나리오에서 보호받는 포트폴리오를 구축합니다.',
  },
};

// 테스트 질문 목록 (재미있고 전문적인 시나리오)
const TEST_QUESTIONS = [
  // R/S 축 (위험 성향)
  {
    id: 1,
    dimension: 'RS',
    question: '💸 친구가 "이 코인 다음 달에 3배 간다" 라고 합니다. 당신의 반응은?',
    options: [
      { value: 'R', label: '일단 소액이라도 넣어본다. 3배면 해볼만하지!', score: { R: 2 } },
      { value: 'R2', label: '친구 정보력 체크하고 괜찮으면 투자', score: { R: 1 } },
      { value: 'S', label: '"그런 건 없어" 하고 무시', score: { S: 1 } },
      { value: 'S2', label: '친구 걱정... 혹시 사기 아니야?', score: { S: 2 } },
    ],
  },
  {
    id: 2,
    dimension: 'RS',
    question: '📉 내 포트폴리오가 하루 만에 -15% 찍었습니다!',
    options: [
      { value: 'R', label: '세일이다! 추가 매수 기회!', score: { R: 2 } },
      { value: 'R2', label: '뭐 어때, 장기 투자인걸. 앱 끄자.', score: { R: 1 } },
      { value: 'S', label: '손절? 홀딩? 밤새 고민...', score: { S: 1 } },
      { value: 'S2', label: '일단 절반 손절. 더 빠지면 어쩌지', score: { S: 2 } },
    ],
  },
  {
    id: 3,
    dimension: 'RS',
    question: '🎲 카지노에서 룰렛. 빨강에 10만원 걸어서 20만원 됐습니다!',
    options: [
      { value: 'R', label: '전액 다시 건다! 한 번 더!', score: { R: 2 } },
      { value: 'R2', label: '10만원만 더 걸어볼까?', score: { R: 1 } },
      { value: 'S', label: '10만원 챙기고 나머지로 플레이', score: { S: 1 } },
      { value: 'S2', label: '전액 현금화. 오늘 운 다 썼어!', score: { S: 2 } },
    ],
  },
  // A/I 축 (분석 vs 직관)
  {
    id: 4,
    dimension: 'AI',
    question: '🔍 새로운 ETF에 투자하기 전, 당신의 리서치 방법은?',
    options: [
      { value: 'A', label: '운용보고서, 구성종목, 수수료, 추적오차 완전 분석', score: { A: 2 } },
      { value: 'A2', label: '핵심 지표 몇 개만 빠르게 체크', score: { A: 1 } },
      { value: 'I', label: '전문가 추천이나 평판 위주로 판단', score: { I: 1 } },
      { value: 'I2', label: '그냥 유명한 거, 느낌 오는 거 산다', score: { I: 2 } },
    ],
  },
  {
    id: 5,
    dimension: 'AI',
    question: '📊 투자 결정할 때 가장 중요하게 보는 것은?',
    options: [
      { value: 'A', label: 'PER, PBR, ROE 같은 재무제표 숫자들', score: { A: 2 } },
      { value: 'A2', label: '매출 성장률, 시장 점유율 데이터', score: { A: 1 } },
      { value: 'I', label: '경영진 비전과 회사 스토리', score: { I: 1 } },
      { value: 'I2', label: '이 회사/산업이 대세가 될 것 같은 느낌', score: { I: 2 } },
    ],
  },
  {
    id: 6,
    dimension: 'AI',
    question: '🧠 투자 아이디어는 주로 어디서 얻나요?',
    options: [
      { value: 'A', label: '퀀트 스크리닝, 백테스트 데이터', score: { A: 2 } },
      { value: 'A2', label: '애널리스트 리포트, 공시 자료', score: { A: 1 } },
      { value: 'I', label: '유튜브, 블로그, 투자 커뮤니티', score: { I: 1 } },
      { value: 'I2', label: '일상에서 발견! (많이 쓰는 서비스, 인기 브랜드)', score: { I: 2 } },
    ],
  },
  // L/S 축 (장기 vs 단기)
  {
    id: 7,
    dimension: 'LS',
    question: '⏰ 투자하고 얼마나 기다릴 수 있나요?',
    options: [
      { value: 'L', label: '10년? 20년? 은퇴할 때까지 OK', score: { L: 2 } },
      { value: 'L2', label: '3-5년은 충분히 기다릴 수 있지', score: { L: 1 } },
      { value: 'S', label: '1년 안에 결과를 보고 싶어', score: { S: 1 } },
      { value: 'S2', label: '한 달? 일주일? 빨리빨리!', score: { S: 2 } },
    ],
  },
  {
    id: 8,
    dimension: 'LS',
    question: '📱 주식 앱을 얼마나 자주 확인하나요?',
    options: [
      { value: 'L', label: '한 달에 한 번? 분기에 한 번?', score: { L: 2 } },
      { value: 'L2', label: '일주일에 한두 번 정도', score: { L: 1 } },
      { value: 'S', label: '하루에 몇 번은 체크해야 안심', score: { S: 1 } },
      { value: 'S2', label: '실시간 알림 켜놓고 수시로 확인', score: { S: 2 } },
    ],
  },
  {
    id: 9,
    dimension: 'LS',
    question: '🎁 100만원이 생겼습니다. 투자 계획은?',
    options: [
      { value: 'L', label: '인덱스 펀드에 넣고 잊어버리기', score: { L: 2 } },
      { value: 'L2', label: '성장 가능성 높은 ETF에 장기 투자', score: { L: 1 } },
      { value: 'S', label: '최근 오르는 섹터에 단기 투자', score: { S: 1 } },
      { value: 'S2', label: '핫한 종목 찾아서 단타 도전!', score: { S: 2 } },
    ],
  },
  // P/A 축 (패시브 vs 액티브)
  {
    id: 10,
    dimension: 'PA',
    question: '🔄 포트폴리오 리밸런싱, 얼마나 자주 하나요?',
    options: [
      { value: 'P', label: '1년에 한 번, 아니 그냥 안 해', score: { P: 2 } },
      { value: 'P2', label: '분기에 한 번 정도?', score: { P: 1 } },
      { value: 'A', label: '매달 체크하고 조정해', score: { A: 1 } },
      { value: 'A2', label: '시장 상황 보면서 수시로!', score: { A: 2 } },
    ],
  },
  {
    id: 11,
    dimension: 'PA',
    question: '💼 이상적인 투자 방식은?',
    options: [
      { value: 'P', label: '자동이체로 적립식 투자. 신경 끄기!', score: { P: 2 } },
      { value: 'P2', label: '좋은 ETF 몇 개 사서 오래 보유', score: { P: 1 } },
      { value: 'A', label: '시장 상황에 따라 비중 조절', score: { A: 1 } },
      { value: 'A2', label: '종목 발굴하고 적극적으로 매매!', score: { A: 2 } },
    ],
  },
  {
    id: 12,
    dimension: 'PA',
    question: '📈 시장이 급등할 때 당신은?',
    options: [
      { value: 'P', label: '내 포트폴리오도 올랐겠지~ (확인 안 함)', score: { P: 2 } },
      { value: 'P2', label: '오 올랐네! 근데 뭘 하진 않아', score: { P: 1 } },
      { value: 'A', label: '일부 차익실현하고 현금 확보', score: { A: 1 } },
      { value: 'A2', label: '더 오를 종목으로 갈아타기!', score: { A: 2 } },
    ],
  },
];

// 투자 유형 판정
function determineInvestorType(scores: Record<string, number>): string {
  const R_S = (scores.R || 0) > (scores.S || 0) ? 'R' : 'S';
  const A_I = (scores.A || 0) > (scores.I || 0) ? 'A' : 'I';
  const L_S = (scores.L || 0) > (scores.S_time || 0) ? 'L' : 'S';
  const P_A = (scores.P || 0) > (scores.A_style || 0) ? 'P' : 'A';
  
  return R_S + A_I + L_S + P_A;
}

// 점수 계산
function calculateScores(answers: { questionId: number; answer: string; scores: Record<string, number> }[]): Record<string, number> {
  const totalScores: Record<string, number> = {
    R: 0, S: 0, A: 0, I: 0, L: 0, S_time: 0, P: 0, A_style: 0
  };
  
  answers.forEach(answer => {
    const question = TEST_QUESTIONS.find(q => q.id === answer.questionId);
    if (!question) return;
    
    Object.entries(answer.scores).forEach(([key, value]) => {
      if (key === 'S' && question.dimension === 'LS') {
        totalScores.S_time += value;
      } else if (key === 'A' && question.dimension === 'PA') {
        totalScores.A_style += value;
      } else {
        totalScores[key] = (totalScores[key] || 0) + value;
      }
    });
  });
  
  return totalScores;
}

// AI 전문가 분석 프롬프트
function buildExpertPrompt(
  character: 'claude' | 'gemini' | 'gpt',
  investorType: string,
  typeInfo: typeof INVESTOR_TYPES[string],
  scores: Record<string, number>
): string {
  const info = CHARACTER_INFO[character];
  
  const etfExamples = character === 'gemini' 
    ? US_ETFS.filter(e => e.category === 'Technology' || e.category === 'Thematic').slice(0, 10)
    : character === 'gpt'
    ? [...US_ETFS.filter(e => e.category === 'Bond' || e.category === 'Dividend').slice(0, 5), ...KR_ETFS.slice(0, 5)]
    : US_ETFS.slice(0, 10);

  const etfList = etfExamples.map(e => `${e.ticker}: ${e.nameKo} (${e.category})`).join(', ');

  const characterPrompts = {
    claude: `당신은 클로드 리(Claude Lee), 월가 15년 경력의 밸류에이션 전문가입니다.
- 기본적 분석과 내재가치를 중시합니다
- 신중하고 논리적인 분석을 제공합니다
- 말투: 차분하고 분석적, "제 분석에 따르면...", "데이터가 말해주고 있습니다"`,

    gemini: `당신은 제미나인(Gemi Nine), 실리콘밸리 출신의 성장주 전문가입니다.
- 기술주와 혁신 테마에 열광합니다
- 미래 트렌드와 성장 잠재력을 중시합니다
- 말투: 열정적이고 도전적, "이건 미래야!", "10배 갈 수 있어요"`,

    gpt: `당신은 쥐피테일러(G.P. Taylor), 40년 경력의 자산배분 전략가입니다.
- 리스크 관리와 분산투자를 최우선합니다
- 보수적이지만 현명한 조언을 합니다
- 말투: 신중하고 경험에서 우러나오는, "40년간 봐왔는데...", "리스크를 먼저 생각해야 해요"`,
  };

  return `${characterPrompts[character]}

## 투자자 프로필
- **투자 유형**: ${investorType} - "${typeInfo.name}" ${typeInfo.emoji}
- **별명**: ${typeInfo.nickname}
- **성향 설명**: ${typeInfo.description}
- **강점**: ${typeInfo.strengths.join(', ')}
- **약점**: ${typeInfo.weaknesses.join(', ')}
- **추천 조언**: ${typeInfo.advice}
- **닮은 유명 투자자**: ${typeInfo.famousPerson}

## 점수 분석
- 위험 성향: R=${scores.R || 0} vs S=${scores.S || 0} ${(scores.R || 0) > (scores.S || 0) ? '→ 공격적' : '→ 보수적'}
- 분석 스타일: A=${scores.A || 0} vs I=${scores.I || 0} ${(scores.A || 0) > (scores.I || 0) ? '→ 분석형' : '→ 직관형'}
- 투자 기간: L=${scores.L || 0} vs S=${scores.S_time || 0} ${(scores.L || 0) > (scores.S_time || 0) ? '→ 장기' : '→ 단기'}
- 투자 방식: P=${scores.P || 0} vs A=${scores.A_style || 0} ${(scores.P || 0) > (scores.A_style || 0) ? '→ 패시브' : '→ 액티브'}

## 사용 가능한 ETF
${etfList}

## 응답 형식 (반드시 JSON으로)
{
  "personalMessage": "이 투자자에게 전하는 개인화된 메시지 (2-3문장, 캐릭터 말투로, 유형 특성 언급)",
  "strengthAnalysis": "이 유형의 투자 강점 분석 (1-2문장)",
  "riskWarning": "이 유형이 특히 주의해야 할 점 (1-2문장)",
  "recommendations": [
    {
      "ticker": "ETF 티커",
      "name": "ETF 이름", 
      "reason": "이 유형에게 추천하는 이유 (1문장)",
      "allocation": 비중 (숫자, 전체 합 100)
    }
  ],
  "strategy": "이 유형에게 맞는 투자 전략 (2-3문장)",
  "actionItem": "당장 실행할 수 있는 구체적인 행동 1가지",
  "expectedReturn": "예상 연간 수익률 범위 (예: '8-12%')",
  "riskScore": 1-5 숫자 (이 유형의 적정 위험 수준)
}

반드시 JSON으로만 응답하세요.`;
}

// OpenRouter AI 호출
async function callExpertAI(
  character: 'claude' | 'gemini' | 'gpt',
  prompt: string
): Promise<{
  personalMessage: string;
  strengthAnalysis: string;
  riskWarning: string;
  recommendations: { ticker: string; name: string; reason: string; allocation: number }[];
  strategy: string;
  actionItem: string;
  expectedReturn: string;
  riskScore: number;
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://etfhero.vercel.app',
      'X-Title': 'ETFHero Investment Test',
    },
    body: JSON.stringify({
      model: CHARACTER_MODELS[character],
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`OpenRouter ${character} error:`, error);
    throw new Error(`AI call failed for ${character}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse ${character} response`);
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Fallback expert analysis when AI is not available
function generateFallbackExpert(
  character: 'claude' | 'gemini' | 'gpt',
  investorType: string,
  typeInfo: typeof INVESTOR_TYPES[string]
) {
  const info = CHARACTER_INFO[character];
  const etfs = typeInfo.compatibleETFs || ['VOO', 'QQQ', 'SCHD'];
  
  const characterMessages = {
    claude: {
      personalMessage: `${typeInfo.name} 유형이시군요! 제 분석에 따르면, 당신은 ${typeInfo.description.slice(0, 50)}... 펀더멘털 분석을 기반으로 신중한 투자를 추천드립니다.`,
      strengthAnalysis: `${typeInfo.strengths[0]}이(가) 강점입니다. 이를 활용한 밸류에이션 기반 투자가 적합합니다.`,
      riskWarning: `${typeInfo.weaknesses[0]}에 주의하세요. 객관적 데이터로 판단하는 습관을 들이세요.`,
      strategy: `${typeInfo.advice} 분기별 리밸런싱으로 포트폴리오를 점검하세요.`,
      expectedReturn: '7-12%',
      riskScore: 3,
    },
    gemini: {
      personalMessage: `Hey! ${typeInfo.name} 타입이시네요! ${typeInfo.nickname}라니 멋지네요. 성장 잠재력이 큰 테마에 투자해보세요!`,
      strengthAnalysis: `${typeInfo.strengths[0]} - 이 강점으로 미래 성장 산업을 포착할 수 있어요!`,
      riskWarning: `${typeInfo.weaknesses[0]}만 조심하면 돼요. 분산투자 잊지 마세요!`,
      strategy: `${typeInfo.advice} 기술 혁신과 메가 트렌드에 올라타세요!`,
      expectedReturn: '10-20%',
      riskScore: 4,
    },
    gpt: {
      personalMessage: `${typeInfo.name} 유형이시군요. 40년간 다양한 투자자를 봐왔는데, ${typeInfo.nickname} 스타일은 리스크 관리가 중요합니다.`,
      strengthAnalysis: `${typeInfo.strengths[0]}은(는) 장기 투자에서 큰 자산입니다.`,
      riskWarning: `${typeInfo.weaknesses[0]}에 대비해 분산투자와 현금 비중 유지를 권합니다.`,
      strategy: `${typeInfo.advice} 자산 배분의 원칙을 지키세요.`,
      expectedReturn: '5-10%',
      riskScore: 2,
    },
  };

  const charAdvice = characterMessages[character];
  
  return {
    character,
    ...info,
    personalMessage: charAdvice.personalMessage,
    strengthAnalysis: charAdvice.strengthAnalysis,
    riskWarning: charAdvice.riskWarning,
    recommendations: etfs.slice(0, 4).map((ticker, i) => {
      const etf = [...US_ETFS, ...KR_ETFS].find(e => e.ticker === ticker);
      return {
        ticker,
        name: etf?.nameKo || etf?.name || ticker,
        reason: `${typeInfo.name} 유형에 적합한 ETF`,
        allocation: i === 0 ? 40 : i === 1 ? 30 : i === 2 ? 20 : 10,
      };
    }),
    strategy: charAdvice.strategy,
    actionItem: `${etfs[0]} ETF를 시작으로 투자 여정을 시작해보세요.`,
    expectedReturn: charAdvice.expectedReturn,
    riskScore: charAdvice.riskScore,
    success: false, // Mark as fallback
  };
}

/**
 * GET /api/investment-test
 * 테스트 질문 목록 반환
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      questions: TEST_QUESTIONS,
      totalQuestions: TEST_QUESTIONS.length,
      investorTypes: Object.keys(INVESTOR_TYPES).length,
      aiEnabled: true, // Always enabled with fallback
      experts: Object.entries(CHARACTER_INFO).map(([key, info]) => ({
        id: key,
        ...info,
      })),
    },
  });
}

/**
 * POST /api/investment-test
 * 테스트 결과 분석 및 3명의 AI 전문가 추천
 */
export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();
    
    if (!answers || !Array.isArray(answers) || answers.length !== TEST_QUESTIONS.length) {
      return NextResponse.json(
        { success: false, error: '모든 질문에 답해주세요.' },
        { status: 400 }
      );
    }

    // 점수 계산
    const scores = calculateScores(answers);
    const investorType = determineInvestorType(scores);
    const typeInfo = INVESTOR_TYPES[investorType] || INVESTOR_TYPES['SALP']; // 기본값

    console.log(`Investment test: type=${investorType}, scores=`, scores);

    let expertResults;
    
    if (hasOpenRouterKey()) {
      // 3명의 AI 전문가 병렬 호출
      const expertPromises = (['claude', 'gemini', 'gpt'] as const).map(async (character) => {
        try {
          const prompt = buildExpertPrompt(character, investorType, typeInfo, scores);
          const result = await callExpertAI(character, prompt);
          return {
            character,
            ...CHARACTER_INFO[character],
            ...result,
            success: true,
          };
        } catch (error) {
          console.error(`Expert ${character} failed:`, error);
          return generateFallbackExpert(character, investorType, typeInfo);
        }
      });

      expertResults = await Promise.all(expertPromises);
    } else {
      // AI 키가 없으면 기본 분석 제공
      console.log('No OpenRouter key, using fallback analysis');
      expertResults = (['claude', 'gemini', 'gpt'] as const).map(character => 
        generateFallbackExpert(character, investorType, typeInfo)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        // 투자 유형 결과
        investorType: {
          code: investorType,
          ...typeInfo,
        },
        // 점수 상세
        scores: {
          riskTolerance: { R: scores.R || 0, S: scores.S || 0 },
          analysisStyle: { A: scores.A || 0, I: scores.I || 0 },
          investmentHorizon: { L: scores.L || 0, S: scores.S_time || 0 },
          tradingStyle: { P: scores.P || 0, A: scores.A_style || 0 },
        },
        // 3명의 전문가 분석
        expertAnalysis: expertResults,
        // 메타 정보
        analyzedAt: new Date().toISOString(),
        isAIAnalysis: hasOpenRouterKey(),
      },
    });

  } catch (error: any) {
    console.error('Investment test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}
