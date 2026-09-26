import { Category, Judge, RubricCriterion, Submission, Evaluation, ChannelMessage } from '../types';

export const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'heritage_relevance',
    name: '주제 적합성 및 헤리티지 고증·이해도',
    maxScore: 5,
    weight: 20,
    description: '대한민국 문화유산의 역사적 가치와 고유성을 올바르게 이해하고 충실히 고증·재해석하였는가?',
    levels: [
      { score: 5, label: '매우 우수 (탁월한 고증과 깊이 있는 문화유산 재해석)' },
      { score: 4, label: '우수 (문화유산의 핵심 가치를 잘 반영함)' },
      { score: 3, label: '보통 (일반적인 수준의 고증 및 배경 이해)' },
      { score: 2, label: '미흡 (원형 고증 왜곡 또는 피상적 접근)' },
      { score: 1, label: '매우 미흡 (주제 부적합 및 고증 심각한 결함)' },
    ],
  },
  {
    id: 'ai_technique',
    name: 'AI 기술 활용도 및 완성도',
    maxScore: 5,
    weight: 20,
    description: '생성형 AI 모델 및 툴을 창의적·복합적으로 활용하여 고해상도 디테일 및 완성도를 구현하였는가?',
    levels: [
      { score: 5, label: '매우 우수 (최첨단 AI 파이프라인 정밀 제어 및 무결점 디테일)' },
      { score: 4, label: '우수 (AI 툴 활용 능력이 능숙하며 우수한 해상도/동작)' },
      { score: 3, label: '보통 (표준적인 AI 생성 툴 프롬프트 결과물 수준)' },
      { score: 2, label: '미흡 (AI 아티팩트 왜곡 심함, 프레임 불안정)' },
      { score: 1, label: '매우 미흡 (단순 초벌 생성 수준 및 조악한 화질)' },
    ],
  },
  {
    id: 'creativity_art',
    name: '독창성 및 예술적 표현력',
    maxScore: 5,
    weight: 20,
    description: '단순 복제를 탈피하여 현대적 감각의 독창적인 시각 언어와 예술적 심미성을 발휘하였는가?',
    levels: [
      { score: 5, label: '매우 우수 (압도적인 예술성 및 독창적 미학적 감동)' },
      { score: 4, label: '우수 (참신한 연출력과 조화로운 색채/사운드 구성)' },
      { score: 3, label: '보통 (무난한 구성과 일반적인 시각적 연출)' },
      { score: 2, label: '미흡 (식상하거나 진부한 클리셰 반복)' },
      { score: 1, label: '매우 미흡 (예술적 완성도 및 독창성 결여)' },
    ],
  },
  {
    id: 'public_impact',
    name: '대중성 및 디지털 확산 기여도',
    maxScore: 5,
    weight: 20,
    description: '일반 국민 및 글로벌 대중이 문화유산을 친근하게 향유하고 감동을 공유할 수 있는 잠재력이 있는가?',
    levels: [
      { score: 5, label: '매우 우수 (글로벌 공감대 형성 및 교육·문화 확산력 탁월)' },
      { score: 4, label: '우수 (대중적 호응도 및 전시·활용 가치 높음)' },
      { score: 3, label: '보통 (일반적인 관심 유도 가능 수준)' },
      { score: 2, label: '미흡 (대중적 공감대 형성에 한계)' },
      { score: 1, label: '매우 미흡 (확산성 및 활용 가치 부재)' },
    ],
  },
  {
    id: 'ethics_compliance',
    name: 'AI 윤리성 및 저작권 준수',
    maxScore: 5,
    weight: 20,
    description: '공공누리·문화유산 저작권 가이드라인을 준수하고 AI 학습데이터 윤리 및 창작 원칙을 성실히 이행하였는가?',
    levels: [
      { score: 5, label: '매우 우수 (저작권 공공누리 완벽 준수 및 제작과정 투명 공개)' },
      { score: 4, label: '우수 (가이드라인 성실 이행 및 출처 명시 양호)' },
      { score: 3, label: '보통 (기본적 저작권 사항 준수)' },
      { score: 2, label: '미흡 (출처 표기 불명확 및 일부 저작권 논란 소지)' },
      { score: 1, label: '매우 미흡 (타인 저작물 침해 의혹 또는 윤리 기준 미달)' },
    ],
  },
];

export const INITIAL_JUDGES: Judge[] = [
  {
    id: 'judge-01',
    loginId: 'judge1',
    password: 'password123',
    name: '김태형',
    affiliation: '한국디지털헤리티지학회',
    title: '상임이사 / 교수',
    specialty: '문화유산 3D 복원 및 디지털 보존',
    email: 'thkim@heritage-digital.kr',
    phone: '010-3491-8821',
    isProfileComplete: true,
    oathSigned: true,
    oath: {
      judgeId: 'judge-01',
      judgeName: '김태형',
      signedAt: '2026-09-24 10:15:32',
      isAgreed: true,
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="10" y="28" font-family="serif" font-size="22" font-style="italic" fill="%232563eb">김태형 (서명)</text></svg>',
    },
    assignedCategory: 'ALL',
  },
  {
    id: 'judge-02',
    loginId: 'judge2',
    password: 'password123',
    name: '이지은',
    affiliation: '국립현대미술관 미디어아트랩',
    title: '수석 큐레이터',
    specialty: '생성형 AI 미디어아트 및 디지털 전시',
    email: 'jelee@mmca-art.kr',
    phone: '010-9124-7712',
    isProfileComplete: true,
    oathSigned: false, // will experience oath signing modal
    assignedCategory: 'ALL',
  },
  {
    id: 'judge-03',
    loginId: 'judge3',
    password: 'password123',
    name: '박성호',
    affiliation: '한국콘텐츠진흥원 실감콘텐츠본부',
    title: '전문위원',
    specialty: '영상 AI 파이프라인 및 시각 특수효과(VFX)',
    email: 'shpark@kocca-vfx.kr',
    phone: '010-4412-0981',
    isProfileComplete: false, // will experience profile + oath onboarding
    oathSigned: false,
    assignedCategory: 'VIDEO',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [];

export const INITIAL_EVALUATIONS: Evaluation[] = [];

export const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [];

export const OFFICIAL_OATH_TEXT = `[ AI 디지털헤리티지 공모전 심사위원 공정심사 및 비밀유지 서약서 ]

본인은 문화체육관광부 및 공모전 운영위원회가 주관하는 「2026 AI 디지털헤리티지 공모전」의 심사위원으로 위촉됨에 따라, 다음과 같은 제반 사항을 성실히 준수할 것을 엄숙히 서약합니다.

1. (공정 심사의 의무)
본인은 출품작을 심사함에 있어 학연, 지연, 친분관계 등 일체의 사적 이해관계를 배제하고, 공모전 심사 기준표 및 관련 규정에 의거하여 오직 작품의 예술성, 기술 완성도, 문화유산 고증도에 따라 공정하고 객관적으로 심사에 임하겠습니다.

2. (비밀 유지 및 보안 의무)
본인은 심사 과정에서 취득한 출품자의 신원정보, 출품작 원본 데이터(구글 드라이브 비공개 파일 포함), 심사위원 간의 논의 내용 및 개별 채널 기록, 최종 점수 집계 결과 등을 공모전 운영위원회의 공식 발표 전까지 제3자에게 누설하거나 외부에 유출하지 않겠습니다.

3. (지식재산권 및 저작물 보호)
본인은 심사를 목적으로 열람한 출품작의 아이디어, 이미지, 동영상 파일, 프롬프트 데이터 등을 무단 복제, 배포, 인용하거나 본인의 개인적 연구 또는 영리 목적에 사용하지 않겠습니다.

4. (이해관계 자진 신고 및 회피)
본인은 본인과 직접적인 이해관계(가족, 친족, 동일 연구실/프로젝트 소속 등)가 있는 출품작을 인지한 즉시 운영사무국에 통보하고 해당 작품에 대한 심사 회피를 신청하겠습니다.

5. (위반 시 책임)
상기 서약 사항을 성실히 이행하지 아니하여 발생하는 모든 법적, 행정적 책임 및 손해배상 책임을 감수할 것을 서약합니다.`;
