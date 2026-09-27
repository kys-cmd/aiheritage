export type Category = 'IMAGE' | 'VIDEO';
export type ParticipantCategory = '일반인' | '학생(초/중/고)';
export type BaekjeRelated = '사용함' | '사용하지 않음';
export type PostEditingUsage = '사용함' | '사용하지 않음';

export interface RubricScore {
  criterionId: string;
  criterionName: string;
  score: number; // 0.5 to 5.0 (0.5 step: e.g. 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
  description: string;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  judgeId: string;
  judgeName: string;
  scores: RubricScore[];
  totalScore: number; // max 25
  averageScore: number; // max 5.0
  comment: string;
  recommendForAward: boolean;
  status: 'DRAFT' | 'SUBMITTED';
  updatedAt: string;
}

export interface ChannelMessage {
  id: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  authorRole: 'JUDGE' | 'ADMIN';
  message: string;
  createdAt: string;
  tag?: 'NOTE' | 'QUESTION' | 'HIGHLIGHT';
}

export interface Submission {
  id: string;
  submissionNumber: string; // e.g. DH-IMG-001, DH-VID-002
  title: string;
  category: Category;
  submitterName: string; // 출품자명
  participantCategory: ParticipantCategory; // 참가 구분 (일반인 또는 학생(초/중/고))
  submitterAffiliation: string; // 소속
  nationalHeritageName: string; // 소재로 활용된 국가유산명
  heritageSubject?: string; // legacy support
  baekjeRelated: BaekjeRelated; // 공주,웅진백제 관련 사용여부 (사용함 또는 사용하지 않음)
  description: string; // 작품 설명서
  aiTools: string[]; // 사용한 생성형 AI 도구
  postEditingUsage: PostEditingUsage; // 후반 편집툴 사용 여부 (사용함 또는 사용하지 않음)
  postEditingDetails?: string; // 후반 편집 상세
  promptSummary?: string;
  fullPrompt: string; // 사용 프롬프트 전문에 대한 정보
  processCaptureDriveUrl: string; // 생성 과정 화면 캡쳐 구글 드라이브 링크
  driveLink: string; // Google Drive share URL
  previewImageUrl: string;
  videoUrl?: string; // Direct video stream (.mp4, .webm, blob:, data:) or YouTube/Vimeo embed URL
  videoDuration?: string; // for video category
  submittedAt?: string;
  channelNotesCount?: number;
}

export interface JudgeOath {
  judgeId: string;
  judgeName: string;
  signedAt: string;
  signatureDataUrl?: string; // Canvas drawn signature or calligraphic mark
  isAgreed: boolean;
  ipAddress?: string;
}

export interface Judge {
  id: string;
  loginId: string;
  password?: string;
  name: string;
  affiliation: string; // 소속 기관
  title: string; // 직책
  specialty: string; // 전문 분야 (예: AI 비전, 문화유산 디지털복원, 영상디자인)
  email: string;
  phone: string;
  isProfileComplete: boolean;
  oathSigned: boolean;
  oath?: JudgeOath;
  assignedCategory?: 'ALL' | 'IMAGE' | 'VIDEO';
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description: string;
  detailedPoints?: string[];
  levels: {
    score: number;
    label: string;
  }[];
}
