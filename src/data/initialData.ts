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

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-001',
    submissionNumber: 'DH-IMG-001',
    title: '광배의 빛: 석굴암 본존불 홀로그래픽 복원',
    category: 'IMAGE',
    submitterName: '아틀리에 헤리티지 (대표 최원석)',
    submitterAffiliation: '디지털문화기술연구소',
    heritageSubject: '국보 제24호 경주 석굴암 석조여래좌상',
    description: '천 년의 세월 동안 훼손된 석굴암 내부의 채색 안료와 천상 세계의 환희를 AI 고해상도 생성 모델을 통해 초고화질 디지털 헤리티지로 복원한 작품입니다. 본존불의 자비로운 미소와 돔 천장의 연화문 감실 디테일을 정밀 복원하였습니다.',
    aiTools: ['Midjourney v6.1', 'Stable Diffusion XL', 'ControlNet Depth', 'Magnific AI'],
    promptSummary: '경주 석굴암 본존불 화강암 조각 디테일, 황금빛 광배의 체적 조명, 고대 단청 안료 흔적 및 박물관 복원급 정밀 렌더링',
    driveLink: 'https://drive.google.com/file/d/1_Sukgulam_Grotto_Heritage_Master_8K/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_sukgulam_ai_1790403229254.jpg',
    submittedAt: '2026-09-20 14:22:00',
  },
  {
    id: 'sub-002',
    submissionNumber: 'DH-VID-001',
    title: '달빛 교향곡: 한양도성과 경복궁 야간의 연희',
    category: 'VIDEO',
    submitterName: '스튜디오 여명 (팀장 강민경 외 3인)',
    submitterAffiliation: '한국예술종합학교 미디어아트과',
    heritageSubject: '사적 제117호 경복궁 경회루 및 한양도성 성곽길',
    description: '조선 정조 연간 달빛 아래 펼쳐진 궁중 연희를 1분 30초 시네마틱 영상으로 재현했습니다. 전통 국악 관현악과 생성형 AI 비디오 모델(Runway Gen-3, Kling)을 결합하여 경회루 연못에 비친 불꽃과 궁중 무희들의 태평무를 몽환적으로 구현했습니다.',
    aiTools: ['Runway Gen-3 Alpha', 'Kling AI 1.5', 'Midjourney v6', 'Topaz Video AI 4.0'],
    promptSummary: '달빛 아래 조선 경복궁 경회루 궁중 연희, 연못에 비친 등불 축제와 태평무 한복 무희들의 유려한 군무 연출',
    driveLink: 'https://drive.google.com/file/d/1_Hanyang_Palace_Midnight_Symphony_UHD/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_hanyang_palace_1790403241912.jpg',
    videoDuration: '01:34',
    submittedAt: '2026-09-21 11:05:12',
  },
  {
    id: 'sub-003',
    submissionNumber: 'DH-VID-002',
    title: '수궁가(水宮歌) 디지털 랩소디: 먹과 빛의 춤',
    category: 'VIDEO',
    submitterName: '소리빛 프로젝트 (이서연)',
    submitterAffiliation: '프리랜서 생성형 영상 아티스트',
    heritageSubject: '국가무형유산 제5호 판소리 수궁가',
    description: '판소리 수궁가 중 용왕과 토끼의 지혜 대결 장면을 한국 전통 수묵화의 번짐 효과와 AI 입자 시뮬레이션으로 시각화한 미디어아트 단편입니다. 명창의 소리 음절에 반응하는 오디오 반응형 AI 모션 알고리즘을 적용했습니다.',
    aiTools: ['ComfyUI AnimateDiff', 'Stable Video Diffusion', 'TouchDesigner', 'Suno AI(사운드)'],
    promptSummary: '전통 수묵화 번짐 효과로 살아나는 수궁가 용궁, 신화 속 거북이와 지혜로운 토끼의 율동적 붓 터치 시각화',
    driveLink: 'https://drive.google.com/file/d/1_Pansori_Sugungga_Digital_Rhapsody/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_pansori_digital_1790403254132.jpg',
    videoDuration: '02:18',
    submittedAt: '2026-09-22 09:40:45',
  },
  {
    id: 'sub-004',
    submissionNumber: 'DH-IMG-002',
    title: '훈민정음: 소리의 형태를 빚다',
    category: 'IMAGE',
    submitterName: '글꼴문화연구소 (연구원 박준호)',
    submitterAffiliation: '한글디자인연합',
    heritageSubject: '국보 제70호 훈민정음 해례본(訓民正音 解例本)',
    description: '세종대왕이 천지인(天地人) 삼재와 발성기관을 본떠 창제한 한글의 원리를 디지털 공간에서 빛의 조각으로 시각화했습니다. 훈민정음 예의본 28자의 획이 한지 위에서 유기적으로 호흡하며 현대적 타이포그래피 미학으로 승화되었습니다.',
    aiTools: ['Flux.1 Pro', 'Midjourney v6.1', 'Adobe Firefly Gen-3', 'Photoshop AI'],
    promptSummary: '한지 위에 떠오르는 훈민정음 28자의 홀로그램 발성 원리 및 천지인 과학적 타이포그래피 미학 형상화',
    driveLink: 'https://drive.google.com/file/d/1_Hunminjeongeum_Phonetic_Forms_Archival/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_hunminjeongeum_1790403266250.jpg',
    submittedAt: '2026-09-23 16:15:30',
  },
  {
    id: 'sub-005',
    submissionNumber: 'DH-IMG-003',
    title: '백제금동대향로의 영겁: 봉황의 비상',
    category: 'IMAGE',
    submitterName: '디지털부여 (대표 임동혁)',
    submitterAffiliation: '백제문화디지털아카이브',
    heritageSubject: '국보 제287호 백제 금동대향로',
    description: '부여 능산리사지에서 출토된 백제 금동대향로의 향 연기가 피어오르는 순간을 AI 3D 렌더링 기법과 결합하여 복원한 이미지입니다. 상단 봉황과 5악사, 74곳의 봉우리에 깃든 상상의 동물들을 초고해상도로 복원했습니다.',
    aiTools: ['Midjourney v6.1', 'Stable Diffusion XL', 'Upscayl AI'],
    promptSummary: '신비로운 안개 속 백제 금동대향로의 5악사와 상상의 동물, 정상의 봉황이 비상하는 금동 색채 복원',
    driveLink: 'https://drive.google.com/file/d/1_Baekje_Incense_Burner_Phoenix_Rise/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_sukgulam_ai_1790403229254.jpg',
    submittedAt: '2026-09-23 18:30:00',
  },
  {
    id: 'sub-006',
    submissionNumber: 'DH-VID-003',
    title: '조선 왕실 의궤 3D 반차도(班次圖) 행렬의 부활',
    category: 'VIDEO',
    submitterName: '의궤디지털복원단 (단장 오세훈)',
    submitterAffiliation: '한국학중앙연구원 협력팀',
    heritageSubject: '유네스코 세계기록유산 조선왕조의궤 원행을묘정리의궤',
    description: '정조 19년(1795년) 화성 원행 반차도에 등장하는 1,779명의 인물과 779필의 말을 생성형 AI 3D 모션 기술로 살아 움직이는 시네마틱 퍼레이드로 부활시킨 영상 작품입니다. 복식과 깃발의 고증을 철저히 검증했습니다.',
    aiTools: ['Luma Dream Machine', 'Runway Gen-3', 'EbSynth AI', 'Premiere Pro'],
    promptSummary: '정조 19년 을묘원행 반차도 1,779명의 군사와 신하 행렬, 전통 의장 깃발과 왕실 가마의 생생한 재현',
    driveLink: 'https://drive.google.com/file/d/1_Joseon_Royal_Procession_Uigwe_LivingScroll/view?usp=sharing',
    previewImageUrl: '/src/assets/images/heritage_hanyang_palace_1790403241912.jpg',
    videoDuration: '02:05',
    submittedAt: '2026-09-24 10:20:10',
  },
];

export const INITIAL_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-001-j1',
    submissionId: 'sub-001',
    judgeId: 'judge-01',
    judgeName: '김태형',
    scores: [
      { criterionId: 'heritage_relevance', criterionName: '주제 적합성 및 헤리티지 고증·이해도', score: 5, description: '석굴암 본존불의 조형미와 천장 돔 구조의 고증이 매우 철저함' },
      { criterionId: 'ai_technique', criterionName: 'AI 기술 활용도 및 완성도', score: 5, description: '화강암 표면 질감과 광배의 빛 연출 완성도가 탁월함' },
      { criterionId: 'creativity_art', criterionName: '독창성 및 예술적 표현력', score: 4, description: '불교 미술의 경건함을 현대적 색채로 격조 높게 승화' },
      { criterionId: 'public_impact', criterionName: '대중성 및 디지털 확산 기여도', score: 4, description: '문화유산 교육 및 박물관 미디어월에 바로 투입 가능한 가치' },
      { criterionId: 'ethics_compliance', criterionName: 'AI 윤리성 및 저작권 준수', score: 5, description: '공공누리 제1유형 데이터 출처 및 프롬프트 투명 공개' },
    ],
    totalScore: 23,
    averageScore: 4.6,
    comment: '석굴암의 장엄한 종교 예술미를 AI 생성 기술로 손상 없이 고귀하게 복원한 수작입니다. 특히 본존불 얼굴의 음영과 감실 주변의 원근감이 뛰어나 심사위원 만장일치 본선 진출이 기대됩니다.',
    recommendForAward: true,
    status: 'SUBMITTED',
    updatedAt: '2026-09-24 14:30:15',
  },
  {
    id: 'eval-002-j1',
    submissionId: 'sub-002',
    judgeId: 'judge-01',
    judgeName: '김태형',
    scores: [
      { criterionId: 'heritage_relevance', criterionName: '주제 적합성 및 헤리티지 고증·이해도', score: 4, description: '경복궁 경회루의 단청과 건축적 비례가 잘 반영됨' },
      { criterionId: 'ai_technique', criterionName: 'AI 기술 활용도 및 완성도', score: 4, description: 'Runway 영상 모델의 프레임 보간과 안정성이 매우 우수함' },
      { criterionId: 'creativity_art', criterionName: '독창성 및 예술적 표현력', score: 5, description: '달빛과 호수의 반영, 태평무 춤선의 서정성이 빼어남' },
      { criterionId: 'public_impact', criterionName: '대중성 및 디지털 확산 기여도', score: 5, description: '대중 영상 및 SNS 바이럴 확산력이 가장 강력할 것으로 판단' },
      { criterionId: 'ethics_compliance', criterionName: 'AI 윤리성 및 저작권 준수', score: 4, description: '국악 음원 및 복식 저작권 확인 양호' },
    ],
    totalScore: 22,
    averageScore: 4.4,
    comment: '정조 연간의 궁중 야간 연희를 한 편의 아름다운 시네마틱 환상시로 승화시켰습니다. 생성형 영상 특유의 왜곡을 최소화하고 감정선을 끝까지 유지한 점이 돋보입니다.',
    recommendForAward: true,
    status: 'SUBMITTED',
    updatedAt: '2026-09-24 16:10:40',
  },
];

export const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [
  {
    id: 'msg-001',
    submissionId: 'sub-001',
    authorId: 'admin',
    authorName: '공모전 운영사무국',
    authorRole: 'ADMIN',
    message: '[운영 공지] 본 작품은 국립경주박물관 소장 데이터 및 3D 스캔 기반 고증 자료를 참조한 출품작입니다. 구글 드라이브 원본(8K 무손실 PNG)을 확인하실 수 있습니다.',
    createdAt: '2026-09-24 09:00:00',
    tag: 'NOTE',
  },
  {
    id: 'msg-002',
    submissionId: 'sub-001',
    authorId: 'judge-01',
    authorName: '김태형 심사위원',
    authorRole: 'JUDGE',
    message: '감실 안의 십대제자상 부조 디테일까지 AI 뎁스 맵으로 섬세하게 표현된 점이 특히 인상적입니다. 문화재 복원 기준에 매우 부합합니다.',
    createdAt: '2026-09-24 14:32:00',
    tag: 'HIGHLIGHT',
  },
  {
    id: 'msg-003',
    submissionId: 'sub-002',
    authorId: 'judge-01',
    authorName: '김태형 심사위원',
    authorRole: 'JUDGE',
    message: '영상 0분 45초 부근의 연못 반사 표현과 궁중 한복 복식(치마 주름의 유체역학)이 AI 비디오의 기술적 한계를 잘 극복했습니다.',
    createdAt: '2026-09-24 16:12:00',
    tag: 'NOTE',
  },
];

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
