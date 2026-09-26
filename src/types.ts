export type Category = 'IMAGE' | 'VIDEO';

export interface RubricScore {
  criterionId: string;
  criterionName: string;
  score: number; // 1 to 5
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
  submitterName: string;
  submitterAffiliation?: string;
  heritageSubject: string; // e.g., 석굴암 석조여래좌상, 한양도성 야경, 판소리 수궁가
  description: string;
  aiTools: string[]; // e.g., Midjourney v6, Runway Gen-3, Stable Diffusion
  promptSummary: string;
  driveLink: string; // Google Drive share URL
  previewImageUrl: string;
  videoDuration?: string; // for video category
  submittedAt: string;
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
  levels: {
    score: number;
    label: string;
  }[];
}
