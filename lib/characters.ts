import type { CharacterType } from './types';

export interface CharacterInfo {
  id: CharacterType;
  name: string;
  nameKo: string;
  role: string;
  roleKo: string;
  image: string;
  color: string;
  gradient: string;
  bgColor: string;
  description: string;
  tags: string[];
  // Extended details
  fullBio: string;
  analysisStyle: string;
  strengths: string[];
  focusAreas: string[];
  catchphrase: string;
  experience: string;
  accuracy: number;
  totalAnalyses: number;
}

export const CHARACTERS: Record<CharacterType, CharacterInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude Lee',
    nameKo: '클로드 리',
    role: 'ETF Valuation Analyst',
    roleKo: 'ETF 밸류에이션 분석가',
    image: '/images/characters/claude.png',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    description: '침착하고 분석적이며 디테일에 강함. 비용 구조, 추적 오차, 포트폴리오 구성을 깊이 파고드는 타입.',
    tags: ['비용 분석', '추적 오차'],
    // Extended details
    fullBio: '자산운용사에서 10년간 ETF 상품 개발과 분석을 담당한 후 AI 애널리스트로 전환한 클로드 리는 ETF의 비용 구조와 성과를 분석하는 것을 즐깁니다. "총 보수 0.01%의 차이가 30년 후 수익률을 바꿉니다"가 그의 좌우명입니다. 매번 분석할 때마다 최소 20개 이상의 ETF 지표를 확인하며, 특히 추적 오차와 운용 효율성에 집중합니다.',
    analysisStyle: '데이터 중심의 정량적 분석을 선호합니다. 감정을 배제하고 오직 숫자로만 판단하며, 비용 대비 성과와 추적 품질을 중시합니다.',
    strengths: [
      '비용 구조 심층 분석',
      '추적 오차 평가',
      '포트폴리오 구성 분석',
      '운용사 비교 분석',
      'ETF 효율성 측정',
    ],
    focusAreas: [
      '총 보수 비용(TER)',
      '추적 오차(Tracking Error)',
      '괴리율(Premium/Discount)',
      '유동성 및 거래량',
      '자산 규모(AUM)',
    ],
    catchphrase: '"비용은 확실한 마이너스 수익입니다. 작은 차이가 큰 결과를 만듭니다"',
    experience: 'ETF 분석 경력 10년',
    accuracy: 68.5,
    totalAnalyses: 1456,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemi Nine',
    nameKo: '제미나인',
    role: 'Thematic ETF Strategist',
    roleKo: '테마 ETF 전략가',
    image: '/images/characters/gemini.png',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    description: '세련됨, 센스, 빠른 판단. 테마 ETF, 신흥 섹터, 혁신 분야 분석의 1인자.',
    tags: ['테마 투자', '트렌드'],
    // Extended details
    fullBio: '실리콘밸리 출신의 제미나인은 새로운 투자 테마와 섹터를 발굴하는 데 탁월한 능력을 보여왔습니다. AI, 클린에너지, 우주산업 등 차세대 성장 테마를 누구보다 먼저 포착합니다. "오늘의 테마 ETF가 내일의 메인스트림이 됩니다"라는 신념을 가지고 있습니다.',
    analysisStyle: '트렌드 중심의 정성적 분석을 선호합니다. 기술 변화와 사회적 트렌드가 ETF 성과에 미치는 영향을 분석하며, 중장기 성장 잠재력에 집중합니다.',
    strengths: [
      '테마 ETF 발굴',
      '섹터 로테이션 예측',
      '글로벌 트렌드 분석',
      '신흥 산업 조기 발견',
      '성장 잠재력 평가',
    ],
    focusAreas: [
      'AI/반도체 테마',
      '클린에너지/ESG',
      '신흥 시장 ETF',
      '혁신 기술 섹터',
      '테마 ETF 신상품',
    ],
    catchphrase: '"좋은 테마를 찾으면 좋은 ETF는 따라옵니다"',
    experience: '테마 투자 전문 분석 8년',
    accuracy: 65.2,
    totalAnalyses: 1089,
  },
  gpt: {
    id: 'gpt',
    name: 'G.P. Taylor',
    nameKo: '지피 테일러',
    role: 'Asset Allocation Chief',
    roleKo: '자산배분 리스크 총괄',
    image: '/images/characters/gpt.png',
    color: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    description: '중후함, 느긋함, 깊은 통찰. 자산 배분, 포트폴리오 이론, 리스크 관리의 원로 애널리스트.',
    tags: ['자산배분', '리스크관리'],
    // Extended details
    fullBio: '40년간 글로벌 자산운용을 담당해온 지피 테일러는 수많은 시장 사이클을 경험한 베테랑입니다. 현대 포트폴리오 이론의 실무 적용에 능하며, ETF를 활용한 효율적 자산 배분을 설계합니다. "분산 투자는 공짜 점심입니다"라는 말을 자주 합니다.',
    analysisStyle: '자산배분 관점의 하향식(Top-down) 분석을 선호합니다. 리스크 조정 수익률을 최우선으로 하며, 장기적 안목으로 포트폴리오를 구성합니다.',
    strengths: [
      '자산 배분 전략',
      '상관관계 분석',
      '리스크 패리티',
      '샤프 비율 최적화',
      '다운사이드 리스크 관리',
    ],
    focusAreas: [
      '주식/채권 배분',
      '섹터 간 상관관계',
      '변동성 관리',
      '리밸런싱 전략',
      '글로벌 분산 투자',
    ],
    catchphrase: '"개별 ETF가 아니라 포트폴리오 전체를 보세요"',
    experience: '글로벌 자산배분 40년',
    accuracy: 72.1,
    totalAnalyses: 4215,
  },
};

export function getCharacter(type: CharacterType): CharacterInfo {
  return CHARACTERS[type];
}
