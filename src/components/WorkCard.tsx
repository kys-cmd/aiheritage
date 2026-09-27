import React from 'react';
import { Submission } from '../types';
import { useContest } from '../context/ContestContext';
import { Check, CheckCircle2, Clock, Film, Image as ImageIcon, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { getDriveImageUrl } from '../utils/driveHelpers';

interface WorkCardProps {
  submission: Submission;
  onClick: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ submission, onClick }) => {
  const { getSubmissionStats, getChannelMessages } = useContest();
  const stats = getSubmissionStats(submission.id);
  const messages = getChannelMessages(submission.id);

  const isEvaluated = stats.isEvaluatedByCurrentJudge;
  const myEval = stats.currentJudgeEvaluation;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer ${
        isEvaluated
          ? 'border-slate-200 bg-slate-50/60 shadow-xs hover:border-slate-300 hover:shadow-md'
          : 'border-amber-300/80 bg-white shadow-sm hover:border-amber-400 hover:shadow-md ring-1 ring-amber-400/20'
      }`}
    >
      {/* Top Media Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={getDriveImageUrl(submission.driveLink, submission.previewImageUrl)}
          alt={submission.title}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isEvaluated ? 'brightness-70 contrast-90' : ''
          }`}
        />

        {/* Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Darkened Overlay & Center Badge for Evaluated Card */}
        {isEvaluated && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px] z-10 flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-black/85 text-white font-black text-lg sm:text-xl tracking-wider border border-white/30 shadow-2xl backdrop-blur-md">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 stroke-[2.5]" />
              <span>심사 완료</span>
            </span>
          </div>
        )}

        {/* Category Badge on Top Left: strictly 동영상 부문 / 이미지 부문 */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-20">
          <span
            className={`flex items-center gap-1 text-xs font-black backdrop-blur-md px-2.5 py-1 rounded-md border shadow-xs ${
              submission.category === 'VIDEO'
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-blue-600 text-white border-blue-400'
            }`}
          >
            {submission.category === 'VIDEO' ? (
              <Film className="h-3.5 w-3.5 text-orange-100" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-blue-100" />
            )}
            <span>{submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
          </span>
        </div>

        {/* Status Indicator on Top Right */}
        <div className="absolute top-3 right-3 flex items-center z-20">
          {isEvaluated ? (
            <div className="flex items-center gap-1.5 bg-emerald-600/95 text-white text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full shadow-md border border-emerald-400/60 backdrop-blur-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-emerald-700 font-black text-[10px]">
                ✓
              </span>
              <span>심사 완료</span>
              {myEval && (
                <span className="ml-0.5 font-mono font-black text-white text-xs sm:text-sm">
                  {myEval.totalScore}점
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/95 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md border border-amber-300 backdrop-blur-sm">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center" />
              <span>미평가 (대기)</span>
            </div>
          )}
        </div>

        {/* Submission Code on bottom left of thumbnail */}
        <div className="absolute bottom-2.5 left-3 z-20">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm border border-white/20">
            {submission.submissionNumber}
          </span>
        </div>
      </div>

      {/* Content Body (Dimmed / Softened if evaluated to clearly highlight pending works) */}
      <div className={`flex flex-1 flex-col p-5 space-y-3 transition-opacity ${
        isEvaluated ? 'opacity-70 group-hover:opacity-95' : ''
      }`}>
        {/* Title Header with Code badge */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {submission.submissionNumber}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}
            </span>
            {isEvaluated && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                심사 완료
              </span>
            )}
          </div>
          <h3 className={`text-lg font-bold transition-colors line-clamp-1 leading-snug ${
            isEvaluated
              ? 'text-slate-600 group-hover:text-slate-900'
              : 'text-slate-900 group-hover:text-indigo-900'
          }`}>
            {submission.title}
          </h3>
        </div>

        {/* Metadata info */}
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className={isEvaluated ? 'text-slate-700 font-semibold' : 'text-amber-800 font-bold'}>
            {submission.nationalHeritageName || submission.heritageSubject}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className={isEvaluated ? 'text-slate-500' : 'text-slate-700'}>
            출품자: {submission.submitterName}
          </span>
        </div>

        {/* Description (Dimmed when evaluated) */}
        <p className={`text-base leading-relaxed line-clamp-2 ${
          isEvaluated ? 'text-slate-500' : 'text-slate-700'
        }`}>
          {submission.description}
        </p>

        {/* AI Tools Tag Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-500">활용 도구:</span>
          {submission.aiTools.map((tool, idx) => (
            <span
              key={idx}
              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                isEvaluated
                  ? 'bg-slate-100/70 text-slate-500 border-slate-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Prominent Score Box */}
        <div className="pt-2">
          {isEvaluated && myEval ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 border border-slate-300 text-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700">심사 완료 (내 점수)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-lg font-black text-slate-900">
                  {myEval.totalScore}
                </span>
                <span className="font-mono text-xs text-slate-600 font-bold">/ 25점</span>
                <span className="text-xs font-medium text-slate-500 ml-1">
                  (평점 {myEval.averageScore.toFixed(1)})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-900">심사 대기중</span>
              </div>
              <span className="text-xs font-bold text-amber-800">
                아직 평가하지 않은 작품
              </span>
            </div>
          )}
        </div>

        {/* Footer info & Action button */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            <span>채널 기록 {messages.length}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isEvaluated
              ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300'
              : 'bg-[#32134e] hover:bg-[#431766] text-white shadow-sm'
          }`}>
            <span>{isEvaluated ? '심사 완료 (수정하기)' : '심사하기'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
