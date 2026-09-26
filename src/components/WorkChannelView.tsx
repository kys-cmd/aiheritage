import React, { useState, useEffect } from 'react';
import { useContest } from '../context/ContestContext';
import { Submission, RubricScore } from '../types';
import { DriveEmbedViewer } from './DriveEmbedViewer';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Save,
  Award,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Tag,
  Star,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface WorkChannelViewProps {
  submission: Submission;
  onClose: () => void;
  onSelectSubmission: (id: string) => void;
}

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
    getChannelMessages,
    addChannelMessage,
  } = useContest();

  const currentJudgeId = currentUser?.judge?.id || 'admin';
  const currentJudgeName = currentUser?.name || '심사위원';

  // Load existing evaluation if already evaluated by this judge
  const existingEval = currentUser?.judge
    ? getSubmissionEvaluationByJudge(submission.id, currentUser.judge.id)
    : undefined;

  // Rubric Scores State (1 to 5 per criterion)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    rubricCriteria.forEach((crit) => {
      const existingScore = existingEval?.scores.find((s) => s.criterionId === crit.id);
      initial[crit.id] = existingScore ? existingScore.score : 4;
    });
    return initial;
  });

  const [comment, setComment] = useState(existingEval?.comment || '');
  const [recommendForAward, setRecommendForAward] = useState(existingEval?.recommendForAward || false);
  const [channelNote, setChannelNote] = useState('');
  const [noteTag, setNoteTag] = useState<'NOTE' | 'QUESTION' | 'HIGHLIGHT'>('NOTE');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync when submission or existingEval changes
  useEffect(() => {
    if (existingEval) {
      const map: Record<string, number> = {};
      rubricCriteria.forEach((crit) => {
        const found = existingEval.scores.find((s) => s.criterionId === crit.id);
        map[crit.id] = found ? found.score : 4;
      });
      setScores(map);
      setComment(existingEval.comment);
      setRecommendForAward(existingEval.recommendForAward);
    } else {
      const initial: Record<string, number> = {};
      rubricCriteria.forEach((crit) => {
        initial[crit.id] = 4;
      });
      setScores(initial);
      setComment('');
      setRecommendForAward(false);
    }
    setSaveSuccessMsg(null);
  }, [submission.id, existingEval]);

  // Score calculations (Max 5 per criterion, 5 criteria -> max 25)
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
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

  const handleSaveEvaluation = (status: 'DRAFT' | 'SUBMITTED') => {
    if (!currentUser?.judge) return;

    const rubricScores: RubricScore[] = rubricCriteria.map((c) => ({
      criterionId: c.id,
      criterionName: c.name,
      score: scores[c.id] || 0,
      description: c.levels.find((l) => l.score === scores[c.id])?.label || '',
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

  const handleSendChannelMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelNote.trim()) return;
    addChannelMessage(submission.id, channelNote.trim(), noteTag);
    setChannelNote('');
  };

  const channelMessages = getChannelMessages(submission.id);
  const stats = getSubmissionStats(submission.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#431766] bg-[#32134e] text-white px-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록으로 돌아가기</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-200">
            <span className="font-mono text-cyan-300 font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {submission.submissionNumber}
            </span>
            <span aria-hidden="true" className="text-white/40">·</span>
            <span className="text-white font-bold truncate max-w-md text-base">
              {submission.title}
            </span>
          </div>
        </div>

        {/* Top Right: Status Badge & Close */}
        <div className="flex items-center gap-3">
          {stats.isEvaluatedByCurrentJudge ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold shadow-sm border border-cyan-400">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-cyan-600 font-black text-[9px]">✓</span>
              <span>평가 완료 ({stats.currentJudgeEvaluation?.totalScore}점)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
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

      {/* Main Workspace Layout (2 columns: Media & Channel / Rubric Scoring) */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        {/* Left Column: Media & Work Channel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Media Player with Google Drive Viewer */}
          <DriveEmbedViewer
            driveLink={submission.driveLink}
            previewImageUrl={submission.previewImageUrl}
            category={submission.category}
            title={submission.title}
            videoDuration={submission.videoDuration}
          />

          {/* Submission Metadata Dossier (Body font >= 12pt / 16px) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
                <span className="font-mono">{submission.submissionNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{submission.category === 'VIDEO' ? '동영상 분야' : '이미지 분야'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">접수일: {submission.submittedAt}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {submission.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <span className="font-bold text-amber-800">대상 문화유산:</span>
                <span className="font-semibold text-slate-900">{submission.heritageSubject}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-bold text-slate-500">출품자:</span>
                <span className="text-slate-900 font-medium">{submission.submitterName}</span>
                {submission.submitterAffiliation && (
                  <span className="text-slate-600">({submission.submitterAffiliation})</span>
                )}
              </div>
            </div>

            {/* Description (min 12pt / 16px) */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-500 mb-2">
                작품 기획 의도 및 설명
              </h4>
              <p className="text-base leading-relaxed text-slate-800 whitespace-pre-line">
                {submission.description}
              </p>
            </div>

            {/* AI Tools & Prompts */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">
                  활용 AI 도구
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {submission.aiTools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">
                  주요 프롬프트 요약
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {submission.promptSummary}
                </p>
              </div>
            </div>
          </div>

          {/* DEDICATED WORK CHANNEL (작품별 채널 기능) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  작품별 심사 채널 (평가 기록 및 개별 메모)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                기록 {channelMessages.length}건
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              본 작품에 대한 심사위원의 개별 평가 메모, 심사 포인트, 질문 등을 자유롭게 남길 수 있는 전용 채널입니다.
            </p>

            {/* Message feed */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {channelMessages.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  아직 등록된 채널 기록이 없습니다. 본 작품에 대한 첫 메모나 의견을 남겨보세요.
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{msg.authorName}</span>
                        {msg.tag === 'HIGHLIGHT' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-semibold">
                            주목 포인트
                          </span>
                        )}
                        {msg.tag === 'QUESTION' && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300 text-[11px] font-semibold">
                            확인 요망
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{msg.createdAt}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px] pt-1">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Channel input form */}
            <form onSubmit={handleSendChannelMessage} className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">구분:</span>
                {(['NOTE', 'HIGHLIGHT', 'QUESTION'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNoteTag(t)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                      noteTag === t
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'NOTE' ? '일반 메모' : t === 'HIGHLIGHT' ? '주목 포인트' : '확인 사항'}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={channelNote}
                  onChange={(e) => setChannelNote(e.target.value)}
                  placeholder={`[${currentJudgeName}] 작품에 대한 평가 기록이나 메모를 입력하세요...`}
                  className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!channelNote.trim()}
                  className="flex items-center gap-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>기록</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive 5-Point Rubric Evaluation Sheet (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-5">
            {/* Header */}
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <span className="text-xs text-amber-700 font-bold">
                  공식 심사 평가표
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  공모전 심사표 (최대 5점 척도)
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  심사위원: <strong className="text-slate-900">{currentJudgeName}</strong>
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {stats.isEvaluatedByCurrentJudge ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>평가 완료</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-400 text-amber-900 text-xs font-bold">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>심사 대기</span>
                  </span>
                )}
              </div>
            </div>

            {/* Success toast */}
            {saveSuccessMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-sm text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="font-semibold">{saveSuccessMsg}</span>
              </div>
            )}

            {/* Rubric Criteria List (5 Criteria, 1 to 5 points each) */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {rubricCriteria.map((criterion, index) => {
                const currentScore = scores[criterion.id] || 0;
                const currentLevel = criterion.levels.find((l) => l.score === currentScore);

                return (
                  <div
                    key={criterion.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-amber-700 text-sm font-bold mr-1.5">
                          0{index + 1}.
                        </span>
                        <span className="text-sm font-bold text-slate-900">{criterion.name}</span>
                      </div>
                      <span className="font-mono text-sm font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300 shadow-sm">
                        {currentScore} / 5점
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {criterion.description}
                    </p>

                    {/* Interactive 5-Point Stepper Buttons - Large & Prominent */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((pts) => {
                        const isSelected = currentScore === pts;
                        return (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => handleScoreChange(criterion.id, pts)}
                            className={`py-2.5 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500 scale-105'
                                : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-300 shadow-sm'
                            }`}
                          >
                            <span className="text-base font-black">{pts}점</span>
                            <span className="text-[10px] font-medium opacity-90 mt-0.5">
                              {pts === 5
                                ? '최상'
                                : pts === 4
                                ? '우수'
                                : pts === 3
                                ? '보통'
                                : pts === 2
                                ? '미흡'
                                : '부적'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {currentLevel && (
                      <p className="text-xs text-amber-800 font-semibold italic pt-0.5">
                        ↳ {currentLevel.label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Score Meter - High Contrast & Very Legible */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600">
                    심사위원 부여 총점
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-3xl font-black text-amber-800 tabular-nums">
                      {totalScore}
                    </span>
                    <span className="font-mono text-sm text-slate-600 font-bold">/ 25점 만점</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600">
                    평점 환산 (5.0 척도)
                  </span>
                  <div className="flex items-baseline justify-end gap-1 mt-0.5">
                    <span className="font-mono text-3xl font-black text-slate-900 tabular-nums">
                      {averageScore.toFixed(1)}
                    </span>
                    <span className="font-mono text-sm text-slate-600 font-bold">/ 5.0</span>
                    <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-100 px-1.5 py-0.5 rounded ml-1">
                      ({normalized100}점)
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Score Bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                  style={{ width: `${(totalScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Qualitative Review Comments (min 12pt / 16px) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                종합 심사평 및 정성 의견 <span className="text-amber-600">*</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="본 작품의 문화유산 고증도, 생성형 AI 기술 완성도, 독창성에 대한 총평을 입력해 주십시오..."
                className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Recommendation Checkbox */}
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={recommendForAward}
                onChange={(e) => setRecommendForAward(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-sm">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-600" />
                  본선 수상 후보작 추천
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  대상·최우수상 등 상위 수상작 후보로 적극 추천할 경우 체크합니다.
                </p>
              </div>
            </label>

            {/* Submission Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveEvaluation('DRAFT')}
                className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="h-4 w-4 text-slate-600" />
                <span>임시 저장</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveEvaluation('SUBMITTED')}
                className="flex-1 py-3 px-3 bg-[#32134e] hover:bg-[#431766] text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>평가 완료 제출</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR (User requirement: 아래에 위치해서 고정) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Back to List */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-sm font-bold text-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록으로 돌아가기</span>
          </button>

          {/* Center: Previous & Next work navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => prevSubmission && onSelectSubmission(prevSubmission.id)}
              disabled={!prevSubmission}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 text-sm font-bold text-slate-800 transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">이전 작품</span>
            </button>

            <div className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-sm font-mono font-bold text-slate-800">
              {currentIndex + 1} / {submissions.length}
            </div>

            <button
              onClick={() => nextSubmission && onSelectSubmission(nextSubmission.id)}
              disabled={!nextSubmission}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 text-sm font-bold text-slate-800 transition-colors shadow-sm"
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
                className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-300 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                <Clock className="h-4 w-4 text-cyan-700" />
                <span>다음 미평가 작품 심사하기 →</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveEvaluation('SUBMITTED')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#32134e] hover:bg-[#431766] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>평가 완료 제출</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
