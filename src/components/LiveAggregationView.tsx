import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import { Category } from '../types';
import { ScoreDistributionAnalytics } from './ScoreDistributionAnalytics';
import {
  Trophy,
  Award,
  Medal,
  Film,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Star,
  Users,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

interface LiveAggregationViewProps {
  onSelectSubmission: (id: string) => void;
}

export const LiveAggregationView: React.FC<LiveAggregationViewProps> = ({ onSelectSubmission }) => {
  const { submissions, judges, evaluations, getSubmissionStats } = useContest();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | Category>('ALL');
  const [viewMode, setViewMode] = useState<'leaderboard' | 'distribution'>('leaderboard');

  // Filter submissions
  const filtered = submissions.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  // Sort by average score descending
  const ranked = [...filtered].sort((a, b) => {
    const statsA = getSubmissionStats(a.id);
    const statsB = getSubmissionStats(b.id);
    return statsB.averageScore - statsA.averageScore;
  });

  // Calculate overall metrics
  const totalSubmissions = submissions.length;
  const totalPossibleEvaluations = totalSubmissions * judges.length;
  const completedEvaluations = evaluations.filter((e) => e.status === 'SUBMITTED').length;
  const overallProgress = totalPossibleEvaluations > 0 ? Math.round((completedEvaluations / totalPossibleEvaluations) * 100) : 0;

  // Award helper
  const getAwardBadge = (index: number) => {
    if (index === 0) {
      return {
        name: '대상 후보 (문화체육관광부 장관상)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        icon: <Trophy className="h-4 w-4 text-amber-700" />,
      };
    }
    if (index === 1) {
      return {
        name: '최우수상 후보',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
        icon: <Award className="h-4 w-4 text-slate-700" />,
      };
    }
    if (index === 2) {
      return {
        name: '우수상 후보',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
        icon: <Medal className="h-4 w-4 text-amber-700" />,
      };
    }
    return null;
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>실시간 심사 집계 및 순위 현황</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            실시간 심사 집계 및 순위 현황판
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            모든 위원의 5점 척도 심사표 입력 결과가 실시간으로 자동 가중 합산되어 공모전 순위표로 시각화됩니다.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setViewMode('leaderboard')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              viewMode === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>실시간 순위 리더보드</span>
          </button>
          <button
            onClick={() => setViewMode('distribution')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              viewMode === 'distribution'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>점수 분포 & 공정성 분석 차트</span>
          </button>
        </div>
      </div>

      {viewMode === 'distribution' ? (
        <ScoreDistributionAnalytics categoryFilter={selectedCategory} />
      ) : (
        <>
          {/* Metric Cards Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">총 접수 출품작</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">{totalSubmissions}</span>
                <span className="text-xs text-slate-500">개 작품</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">이미지 {submissions.filter(s => s.category === 'IMAGE').length} · 동영상 {submissions.filter(s => s.category === 'VIDEO').length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">심사 진행 현황</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-amber-700 tabular-nums">{completedEvaluations}</span>
                <span className="text-xs text-slate-500 font-mono">/ {totalPossibleEvaluations}건</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-600" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">위촉 심사위원</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">{judges.length}</span>
                <span className="text-xs text-slate-500">명</span>
              </div>
              <p className="text-xs text-emerald-700 font-bold mt-1">전원 서약 및 심사진행 중</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">현재 선두 최고 평점</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-amber-700 tabular-nums">
                  {ranked[0] ? getSubmissionStats(ranked[0].id).averageScore.toFixed(2) : '-'}
                </span>
                <span className="text-xs text-slate-500">/ 5.0 만점</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                {ranked[0] ? ranked[0].title : '-'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              종합 순위 (전체 {submissions.length})
            </button>

            <button
              onClick={() => setSelectedCategory('IMAGE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === 'IMAGE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>이미지 분야 ({submissions.filter((s) => s.category === 'IMAGE').length})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('VIDEO')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === 'VIDEO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Film className="h-4 w-4" />
              <span>동영상 분야 ({submissions.filter((s) => s.category === 'VIDEO').length})</span>
            </button>
          </div>

          {/* Ranked List Cards */}
          <div className="space-y-3.5">
            {ranked.map((submission, index) => {
              const stats = getSubmissionStats(submission.id);
              const award = getAwardBadge(index);

              return (
                <div
                  key={submission.id}
                  onClick={() => onSelectSubmission(submission.id)}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer shadow-xs"
                >
                  {/* Left Zone: Rank, Thumbnail, Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank number */}
                    <div className="flex flex-col items-center justify-center w-10 shrink-0 text-center">
                      <span className={`font-mono text-xl font-black ${index < 3 ? 'text-amber-700' : 'text-slate-400'}`}>
                        0{index + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">위</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-200">
                      <img
                        src={submission.previewImageUrl}
                        alt={submission.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 left-1">
                        <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-amber-300">
                          {submission.category === 'VIDEO' ? '동영상' : '이미지'}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {submission.title}
                        </h3>
                        {award && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${award.badgeClass}`}>
                            {award.icon}
                            <span>{award.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <span className="text-amber-800 font-bold">{submission.heritageSubject}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>출품자: {submission.submitterName}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono text-slate-500">{submission.submissionNumber}</span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        활용 AI 도구: {submission.aiTools.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Right Zone: Score Metric and Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-baseline md:justify-end gap-1">
                        <span className="font-mono text-2xl font-black text-amber-800 tabular-nums">
                          {stats.evaluatedCount > 0 ? stats.averageScore.toFixed(2) : '-'}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-bold">/ 5.0</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">
                        심사 {stats.evaluatedCount}/{stats.totalJudges}명 완료
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                      <span>작품 채널 열기</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
