import React, { useState, useEffect } from 'react';
import { useContest } from '../context/ContestContext';
import { Submission, RubricScore } from '../types';
import { DriveEmbedViewer } from './DriveEmbedViewer';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Save,
  Award,
  Clock,
  ExternalLink,
  Star,
  ArrowLeft,
  HelpCircle,
  Copy,
  Check,
  FolderOpen,
  User,
  Building,
  Wrench,
  Layers,
  FileText,
  Minus,
  Plus,
  Film,
  Image as ImageIcon,
} from 'lucide-react';

interface WorkChannelViewProps {
  submission: Submission;
  onClose: () => void;
  onSelectSubmission: (id: string) => void;
}

// 5-Star Rating component with Half-Star support (0.5 to 5.0 step)
interface StarRatingProps {
  score: number;
  onChange: (val: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ score, onChange }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayScore = hoverValue !== null ? hoverValue : score;
  const formattedScore = displayScore % 1 === 0 ? `${displayScore}점` : `${displayScore}점`;

  const handleStep = (delta: number) => {
    const next = Math.min(5, Math.max(0.5, Math.round((score + delta) * 2) / 2));
    onChange(next);
  };

  return (
    <div className="flex items-center gap-3">
      {/* 5-Stars container with half-star hitboxes */}
      <div
        className="flex items-center gap-1 select-none"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = displayScore >= starIndex;
          const isHalf = !isFull && displayScore >= starIndex - 0.5;

          return (
            <div key={starIndex} className="relative inline-flex items-center justify-center p-0.5">
              {/* Star graphics */}
              {isFull ? (
                <Star className="w-8 h-8 text-amber-500 fill-amber-400 drop-shadow-xs transition-transform hover:scale-110" />
              ) : isHalf ? (
                <div className="relative inline-flex items-center justify-center">
                  {/* Empty base */}
                  <Star className="w-8 h-8 text-slate-200 fill-slate-100" />
                  {/* Half-filled overlay */}
                  <div className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                    <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
                  </div>
                </div>
              ) : (
                <Star className="w-8 h-8 text-slate-200 fill-slate-100 hover:text-slate-300 transition-colors" />
              )}

              {/* Left half hitbox (starIndex - 0.5) */}
              <button
                type="button"
                aria-label={`${starIndex - 0.5}점 선택`}
                className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer z-10 opacity-0"
                onMouseEnter={() => setHoverValue(starIndex - 0.5)}
                onClick={() => onChange(starIndex - 0.5)}
              />

              {/* Right half hitbox (starIndex) */}
              <button
                type="button"
                aria-label={`${starIndex}점 선택`}
                className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer z-10 opacity-0"
                onMouseEnter={() => setHoverValue(starIndex)}
                onClick={() => onChange(starIndex)}
              />
            </div>
          );
        })}
      </div>

      {/* Score label badge (e.g. 5점, 4.5점, 4점) */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-base font-black px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 shadow-xs min-w-16 text-center tabular-nums">
          {formattedScore}
        </span>

        {/* Small step adjustment buttons for touch/convenience */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            disabled={score <= 0.5}
            title="0.5점 감소"
            aria-label="0.5점 감소"
            className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-3.5 bg-slate-200" />
          <button
            type="button"
            onClick={() => handleStep(0.5)}
            disabled={score >= 5.0}
            title="0.5점 증가"
            aria-label="0.5점 증가"
            className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const WorkChannelView: React.FC<WorkChannelViewProps> = ({
  submission,
  onClose,
  onSelectSubmission,
}) => {
  const {
    currentUser,
    rubricCriteria,
    submissions,
    saveEvaluation,
    getSubmissionEvaluationByJudge,
    getSubmissionStats,
  } = useContest();

  const currentJudgeName = currentUser?.name || '심사위원';

  // Load existing evaluation if already evaluated by this judge
  const existingEval = currentUser?.judge
    ? getSubmissionEvaluationByJudge(submission.id, currentUser.judge.id)
    : undefined;

  // Rubric Scores State (0.5 to 5.0 per criterion)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    rubricCriteria.forEach((crit) => {
      const existingScore = existingEval?.scores.find((s) => s.criterionId === crit.id);
      initial[crit.id] = existingScore ? existingScore.score : 4.5;
    });
    return initial;
  });

  const [comment, setComment] = useState(existingEval?.comment || '');
  const [recommendForAward, setRecommendForAward] = useState(existingEval?.recommendForAward || false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Sync when submission or existingEval changes
  useEffect(() => {
    if (existingEval) {
      const map: Record<string, number> = {};
      rubricCriteria.forEach((crit) => {
        const found = existingEval.scores.find((s) => s.criterionId === crit.id);
        map[crit.id] = found ? found.score : 4.5;
      });
      setScores(map);
      setComment(existingEval.comment);
      setRecommendForAward(existingEval.recommendForAward);
    } else {
      const initial: Record<string, number> = {};
      rubricCriteria.forEach((crit) => {
        initial[crit.id] = 4.5;
      });
      setScores(initial);
      setComment('');
      setRecommendForAward(false);
    }
    setSaveSuccessMsg(null);
  }, [submission.id, existingEval, rubricCriteria]);

  // Score calculations (Max 5 per criterion, 5 criteria -> max 25)
  const totalScore = Math.round(Object.values(scores).reduce((sum, val) => sum + val, 0) * 10) / 10;
  const averageScore = Number((totalScore / rubricCriteria.length).toFixed(2));
  const normalized100 = Math.round((totalScore / 25) * 100);

  // Submissions navigation
  const currentIndex = submissions.findIndex((s) => s.id === submission.id);
  const prevSubmission = currentIndex > 0 ? submissions[currentIndex - 1] : null;
  const nextSubmission = currentIndex < submissions.length - 1 ? submissions[currentIndex + 1] : null;

  // Next un-evaluated work
  const nextUnevaluated = submissions.find((s) => {
    if (!currentUser?.judge) return false;
    const stats = getSubmissionStats(s.id);
    return !stats.isEvaluatedByCurrentJudge && s.id !== submission.id;
  });

  const handleScoreChange = (criterionId: string, val: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: val }));
  };

  const handleCopyPrompt = () => {
    const textToCopy = submission.fullPrompt || submission.promptSummary || '';
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleSaveEvaluation = (status: 'DRAFT' | 'SUBMITTED') => {
    if (!currentUser?.judge) return;

    const rubricScores: RubricScore[] = rubricCriteria.map((c) => ({
      criterionId: c.id,
      criterionName: c.name,
      score: scores[c.id] || 0,
      description: `${scores[c.id] || 0}점 부여`,
    }));

    saveEvaluation({
      submissionId: submission.id,
      judgeId: currentUser.judge.id,
      judgeName: currentUser.judge.name,
      scores: rubricScores,
      totalScore,
      averageScore,
      comment,
      recommendForAward,
      status,
    });

    const msg =
      status === 'SUBMITTED'
        ? '평가가 완료되어 최종 점수가 정상 제출되었습니다!'
        : '심사 내용이 임시 저장되었습니다.';
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const stats = getSubmissionStats(submission.id);

  // Field values with fallbacks
  const submitterName = submission.submitterName;
  const participantCategory = submission.participantCategory || '일반인';
  const submitterAffiliation = submission.submitterAffiliation || '소속 미기재';
  const nationalHeritageName = submission.nationalHeritageName || submission.heritageSubject || '한국 문화유산';
  const baekjeRelated = submission.baekjeRelated || '사용하지 않음';
  const postEditingUsage = submission.postEditingUsage || '사용하지 않음';
  const postEditingDetails = submission.postEditingDetails;
  const fullPrompt = submission.fullPrompt || submission.promptSummary || '등록된 프롬프트 정보가 없습니다.';
  const processCaptureDriveUrl =
    submission.processCaptureDriveUrl || submission.driveLink || 'https://drive.google.com';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 text-slate-900 overflow-y-auto">
      {/* Top Header Bar (1280px aligned) */}
      <header className="sticky top-0 z-40 border-b border-[#431766] bg-[#32134e] text-white shadow-md">
        <div className="mx-auto w-full max-w-[1280px] flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>목록으로 돌아가기</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 text-sm">
              <span className="font-mono text-cyan-300 font-extrabold bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
                {submission.submissionNumber}
              </span>
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-black border shadow-xs ${
                  submission.category === 'VIDEO'
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-blue-600 text-white border-blue-400'
                }`}
              >
                {submission.category === 'VIDEO' ? (
                  <Film className="h-3 w-3" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                <span>{submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <h1 className="text-white font-bold truncate max-w-xl text-base sm:text-lg">
                {submission.title}
              </h1>
            </div>
          </div>

          {/* Top Right: Status Badge & Close */}
          <div className="flex items-center gap-3">
            {stats.isEvaluatedByCurrentJudge ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm border border-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>평가 완료 ({stats.currentJudgeEvaluation?.totalScore}점)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm">
                <Clock className="h-3.5 w-3.5 text-slate-950" />
                <span>미평가 (심사 대기)</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="닫기"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (1280px max width container, vertical flow: Submission Content -> Rubric Sheet) */}
      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-32">
        {/* ========================================================================= */}
        {/* 1. 출품 내용 SECTION (Submission Content & Dossier)                        */}
        {/* ========================================================================= */}
        <section aria-labelledby="submission-content-heading" className="space-y-6">
          {/* Top Work Title Banner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {submission.submissionNumber}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black shadow-xs border ${
                      submission.category === 'VIDEO'
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-blue-600 text-white border-blue-400'
                    }`}
                  >
                    {submission.category === 'VIDEO' ? (
                      <Film className="h-3.5 w-3.5" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    <span>{submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
                  </span>
                  {baekjeRelated === '사용함' && (
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      ★ 공주·웅진백제 관련 문화유산 연계작
                    </span>
                  )}
                </div>
                <h2 id="submission-content-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {submission.title}
                </h2>
              </div>

              {/* Work Drive Link Button */}
              <div className="flex items-center gap-3">
                <a
                  href={submission.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-cyan-400" />
                  <span>출품작 원본 구글 드라이브 열기</span>
                </a>
              </div>
            </div>

            {/* Media Player Container */}
            <div className="mt-6">
              <DriveEmbedViewer
                driveLink={submission.driveLink}
                previewImageUrl={submission.previewImageUrl}
                videoUrl={submission.videoUrl}
                category={submission.category}
                title={submission.title}
                videoDuration={submission.videoDuration}
              />
            </div>
          </div>

          {/* Submission Detailed Metadata Dossier Cards (Requirements 5, 6, 7) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span>출품작 상세 정보 및 명세</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                출품자가 접수한 공모전 세부 메타데이터 및 생성 과정 증빙 자료입니다.
              </p>
            </div>

            {/* Key Metadata Grid (출품자명, 참가 구분, 소속, 소재로 활용된 국가유산명, 공주/웅진백제 관련 사용여부, 후반 편집툴 사용 여부) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. 출품자명 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  출품자명
                </span>
                <p className="text-lg font-extrabold text-slate-900">
                  {submitterName}
                </p>
              </div>

              {/* 2. 참가 구분 (일반인 또는 학생(초/중/고)) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  참가 구분
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold ${
                      participantCategory === '일반인'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {participantCategory}
                  </span>
                </div>
              </div>

              {/* 3. 소속 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  소속
                </span>
                <p className="text-base font-bold text-slate-900">
                  {submitterAffiliation}
                </p>
              </div>

              {/* 4. 소재로 활용된 국가유산명 (요구사항 5: 대상 문화유산 대체, 요구사항 7) */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-5 space-y-1.5 md:col-span-2 lg:col-span-1">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  소재로 활용된 국가유산명
                </span>
                <p className="text-lg font-black text-amber-950">
                  {nationalHeritageName}
                </p>
              </div>

              {/* 5. 공주,웅진백제 관련 사용여부 (사용함 또는 사용하지 않음) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  공주·웅진백제 관련 사용여부
                </span>
                <div>
                  {baekjeRelated === '사용함' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-extrabold bg-amber-500 text-slate-950 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-slate-950" />
                      사용함 (공주·웅진백제 연계)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-slate-200 text-slate-700">
                      사용하지 않음
                    </span>
                  )}
                </div>
              </div>

              {/* 6. 후반 편집툴 사용 여부 (사용함 또는 사용하지 않음) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-slate-400" />
                  후반 편집툴 사용 여부
                </span>
                <div className="space-y-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold ${
                      postEditingUsage === '사용함'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {postEditingUsage}
                  </span>
                  {postEditingDetails && (
                    <p className="text-xs text-slate-600 mt-1">
                      {postEditingDetails}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 생성 과정 화면 캡쳐 구글 드라이브 링크 카드 (요구사항 7) */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-indigo-700" />
                  <h4 className="text-base font-extrabold text-indigo-950">
                    생성 과정 화면 캡쳐 (구글 드라이브 증빙 링크)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-200 text-indigo-900">
                    필수 확인자료
                  </span>
                </div>
                <p className="text-sm text-indigo-900/80 leading-relaxed">
                  생성형 AI 프롬프트 입력창, 파라미터 세팅, 중간 생성 과정 및 레이어 캡쳐본이 보관된 구글 드라이브 폴더입니다.
                </p>
              </div>

              <a
                href={processCaptureDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold shadow-md transition-all hover:scale-102"
              >
                <FolderOpen className="h-4 w-4" />
                <span>생성 과정 화면 캡쳐 확인하기 ↗</span>
              </a>
            </div>

            {/* 작품 설명서 (요구사항 7) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <span>작품 설명서</span>
                </h4>
                <span className="text-xs font-semibold text-slate-500">기획 의도 및 연출 설명</span>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-slate-800 whitespace-pre-line font-normal">
                {submission.description}
              </p>
            </div>

            {/* 사용한 생성형 AI 도구 (요구사항 7) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  <span>사용한 생성형 AI 도구</span>
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {submission.aiTools.length}개 툴 활용
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {submission.aiTools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold shadow-2xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    <span>{tool}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 사용 프롬프트 전문에 대한 정보 (요구사항 7) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-600" />
                  <span>사용 프롬프트 전문 (Full Prompt)</span>
                </h4>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>프롬프트 전문 복사</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl bg-slate-900 p-4 sm:p-5 text-slate-100 border border-slate-800">
                <p className="font-mono text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap selection:bg-amber-500 selection:text-slate-950">
                  {fullPrompt}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. 심사평가표 SECTION (출품 내용 밑에 위치: Requirement 2)                */}
        {/*    심플하게 심사평가 구분 + 별점 5개 (반개 0.5단위: Requirement 3)         */}
        {/*    동그라미 물음표 아이콘 + 호버 설명 툴팁 (Requirement 4)                 */}
        {/* ========================================================================= */}
        <section aria-labelledby="evaluation-sheet-heading" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md space-y-6">
            {/* Sheet Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                  공식 온라인 심사위원 평가표
                </span>
                <h3 id="evaluation-sheet-heading" className="text-2xl font-black text-slate-900 mt-1">
                  공모전 심사표 (5점 만점 척도)
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  심사위원: <strong className="text-slate-900 font-bold">{currentJudgeName}</strong>
                  <span className="mx-2 text-slate-300">·</span>
                  각 평가 구분별 별점 5개 중 해당 점수를 클릭하여 평가하십시오. (별점 반개 0.5점 단위 부여 가능)
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {stats.isEvaluatedByCurrentJudge ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold shadow-xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>평가 완료 ({stats.currentJudgeEvaluation?.totalScore}점)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-bold shadow-xs">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span>심사 대기중</span>
                  </span>
                )}
              </div>
            </div>

            {/* Success toast notification */}
            {saveSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-emerald-950 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                <span className="font-extrabold text-base">{saveSuccessMsg}</span>
              </div>
            )}

            {/* Rubric Criteria List (5 Criteria Rows with Simple 5-Star + Tooltip) */}
            <div className="divide-y divide-slate-100">
              {rubricCriteria.map((criterion, index) => {
                const currentScore = scores[criterion.id] ?? 4.5;

                return (
                  <div
                    key={criterion.id}
                    className="py-5 first:pt-2 last:pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Criterion Name + Circular Help Tooltip */}
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          0{index + 1}
                        </span>

                        <span className="text-lg font-bold text-slate-900">
                          {criterion.name}
                        </span>

                        {/* Circular Question Mark Icon with Hover Tooltip (Requirement 4) */}
                        <div className="group relative inline-flex items-center">
                          <button
                            type="button"
                            aria-label={`${criterion.name} 평가 설명 보기`}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-800 border border-slate-300 transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>

                          {/* Hover Tooltip Box */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 rounded-2xl bg-slate-900 text-white p-4 text-xs leading-relaxed shadow-2xl border border-slate-700 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                              <span className="font-bold text-amber-400 text-sm">
                                {criterion.name}
                              </span>
                              <span className="text-[11px] text-slate-400">평가 가이드</span>
                            </div>

                            <p className="text-slate-200 text-xs leading-relaxed mb-3">
                              {criterion.description}
                            </p>

                            <div className="space-y-1 pt-1 border-t border-slate-800">
                              <span className="text-[11px] font-bold text-slate-400 block mb-1">척도별 기준:</span>
                              {criterion.levels.map((lvl) => (
                                <div key={lvl.score} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                                  <span className="font-mono font-bold text-amber-300 shrink-0">{lvl.score}점:</span>
                                  <span className="text-slate-300">{lvl.label}</span>
                                </div>
                              ))}
                            </div>

                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 pl-8 leading-relaxed">
                        {criterion.description}
                      </p>
                    </div>

                    {/* Right: 5-Stars Rating Component with Half-Stars (Requirement 3) */}
                    <div className="shrink-0 pl-8 lg:pl-0">
                      <StarRating
                        score={currentScore}
                        onChange={(newVal) => handleScoreChange(criterion.id, newVal)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Qualitative Review Comments (선택) */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-extrabold text-slate-800">
                종합 심사평 및 정성 의견 <span className="text-slate-500 font-normal text-xs ml-1">(선택)</span>
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="본 출품작의 문화유산 고증도, 생성형 AI 기술 완성도, 연출의 독창성에 대한 총평 및 심사위원 의견을 입력해 주십시오..."
                className="w-full rounded-2xl bg-slate-50 border border-slate-300 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none leading-relaxed transition-all shadow-2xs"
              />
            </div>

            {/* Award Recommendation Checkbox */}
            <label className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={recommendForAward}
                onChange={(e) => setRecommendForAward(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-sm">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-base">
                  <Award className="h-4 w-4 text-amber-600" />
                  본선 수상 후보작 추천
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  백제상(대상)·웅진상(금상)·무령상(은상)·고마상(동상) 등 상위 본선 시상 후보작으로 적극 추천할 경우 체크합니다.
                </p>
              </div>
            </label>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveEvaluation('DRAFT')}
                className="w-full sm:flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-base font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Save className="h-5 w-5 text-slate-600" />
                <span>임시 저장</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveEvaluation('SUBMITTED')}
                className="w-full sm:flex-1 py-3.5 px-4 bg-[#32134e] hover:bg-[#431766] text-white text-base font-extrabold rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>평가 완료 제출</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR (1280px aligned) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-6 shadow-2xl">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4">
          {/* Left: Back to List */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-sm font-bold text-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록으로 돌아가기</span>
          </button>

          {/* Center: Previous & Next work navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => prevSubmission && onSelectSubmission(prevSubmission.id)}
              disabled={!prevSubmission}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 text-sm font-bold text-slate-800 transition-colors shadow-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">이전 작품</span>
            </button>

            <div className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-sm font-mono font-extrabold text-slate-800">
              {currentIndex + 1} / {submissions.length}
            </div>

            <button
              onClick={() => nextSubmission && onSelectSubmission(nextSubmission.id)}
              disabled={!nextSubmission}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 text-sm font-bold text-slate-800 transition-colors shadow-xs"
            >
              <span className="hidden sm:inline">다음 작품</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Quick actions (Next Unevaluated or Submit) */}
          <div className="flex items-center gap-2">
            {nextUnevaluated && (
              <button
                onClick={() => onSelectSubmission(nextUnevaluated.id)}
                className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-300 rounded-xl text-sm font-bold transition-colors shadow-xs"
              >
                <Clock className="h-4 w-4 text-cyan-700" />
                <span>다음 미평가 작품 심사하기 →</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveEvaluation('SUBMITTED')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#32134e] hover:bg-[#431766] text-white text-sm font-extrabold rounded-xl shadow-md transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>평가 완료 제출</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
