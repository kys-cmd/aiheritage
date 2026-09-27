import React from 'react';
import { Submission } from '../types';
import { useContest } from '../context/ContestContext';
import { CheckCircle2, Clock, Film, Image as ImageIcon, MessageSquare, ArrowRight } from 'lucide-react';
import { getDriveImageUrl } from '../utils/driveHelpers';

interface WorkListItemProps {
  submission: Submission;
  onClick: () => void;
}

export const WorkListItem: React.FC<WorkListItemProps> = ({ submission, onClick }) => {
  const { getSubmissionStats, getChannelMessages } = useContest();
  const stats = getSubmissionStats(submission.id);
  const messages = getChannelMessages(submission.id);

  const isEvaluated = stats.isEvaluatedByCurrentJudge;
  const myEval = stats.currentJudgeEvaluation;

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isEvaluated
          ? 'border-slate-200 bg-slate-50/70 shadow-xs hover:border-slate-300 hover:shadow-md'
          : 'border-amber-300/80 bg-white shadow-sm hover:border-amber-400 hover:shadow-md ring-1 ring-amber-400/20'
      }`}
    >
      {/* Left: Thumbnail & Details */}
      <div className="flex items-start md:items-center gap-4 flex-1">
        {/* Thumbnail */}
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-200">
          <img
            src={submission.previewImageUrl}
            alt={submission.title}
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isEvaluated ? 'brightness-70 contrast-90' : ''
            }`}
          />

          {/* Darkened overlay for evaluated items */}
          {isEvaluated && (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] z-10 flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 text-white font-extrabold text-xs tracking-wide border border-white/20 shadow-sm backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                <span>심사 완료</span>
              </span>
            </div>
          )}

          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-20">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black backdrop-blur-sm shadow-xs border ${
                submission.category === 'VIDEO'
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-blue-600 text-white border-blue-400'
              }`}
            >
              {submission.category === 'VIDEO' ? (
                <Film className="h-3 w-3 text-orange-100" />
              ) : (
                <ImageIcon className="h-3 w-3 text-blue-100" />
              )}
              <span>{submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
            </span>
          </div>
          <div className="absolute bottom-1 right-1 z-20">
            <span className="font-mono text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
              {submission.submissionNumber}
            </span>
          </div>
        </div>

        {/* Content Details (Dimmed if evaluated) */}
        <div className={`space-y-2 flex-1 min-w-0 transition-opacity ${isEvaluated ? 'opacity-70 group-hover:opacity-95' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                submission.category === 'VIDEO'
                  ? 'bg-orange-50 text-orange-700 border-orange-300'
                  : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}
            >
              {submission.submissionNumber}
            </span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded border ${
                submission.category === 'VIDEO'
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              {submission.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}
            </span>
            <h3 className={`text-lg font-bold transition-colors truncate ${
              isEvaluated
                ? 'text-slate-600 group-hover:text-slate-900'
                : 'text-slate-900 group-hover:text-indigo-900'
            }`}>
              {submission.title}
            </h3>

            {/* Status Indicator */}
            {isEvaluated && myEval ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>심사 완료: {myEval.totalScore}점 / 25점 (평점 {myEval.averageScore.toFixed(1)})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300">
                <span className="h-3 w-3 rounded-full border-2 border-amber-500" />
                <span>미평가 (심사 대기)</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-medium">
            <span className={isEvaluated ? 'text-slate-700 font-semibold' : 'text-amber-800 font-bold'}>
              {submission.nationalHeritageName || submission.heritageSubject}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className={isEvaluated ? 'text-slate-500' : 'text-slate-700'}>
              출품자: {submission.submitterName}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 text-xs">도구: {submission.aiTools.slice(0, 3).join(', ')}</span>
          </div>

          <p className={`text-base line-clamp-1 leading-relaxed ${isEvaluated ? 'text-slate-500' : 'text-slate-700'}`}>
            {submission.description}
          </p>
        </div>
      </div>

      {/* Right: Scores & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            <span>기록 {messages.length}</span>
          </div>

          {/* Score indicator */}
          <div className="text-right pl-3 border-l border-slate-200">
            {isEvaluated && myEval ? (
              <div>
                <span className="text-xs text-slate-500 block">심사 점수</span>
                <span className="font-mono text-xl font-black text-slate-900 tabular-nums">
                  {myEval.totalScore}점
                </span>
                <span className="text-xs text-slate-500 font-mono"> / 25</span>
              </div>
            ) : (
              <div>
                <span className="text-xs text-amber-700 font-bold block">상태</span>
                <span className="text-sm font-bold text-slate-800">심사 대기</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all whitespace-nowrap ${
            isEvaluated
              ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300'
              : 'bg-[#32134e] hover:bg-[#431766] text-white shadow-sm'
          }`}
        >
          <span>{isEvaluated ? '심사 완료 (수정하기)' : '심사하기'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
