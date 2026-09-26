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

  // Overall rankings across all categories (분야 관계 없이 높은 순위 기준)
  const overallRanked = [...submissions].sort((a, b) => {
    const statsA = getSubmissionStats(a.id);
    const statsB = getSubmissionStats(b.id);
    return statsB.averageScore - statsA.averageScore;
  });

  // Calculate overall metrics
  const totalSubmissions = submissions.length;
  const totalPossibleEvaluations = totalSubmissions * judges.length;
  const completedEvaluations = evaluations.filter((e) => e.status === 'SUBMITTED').length;
  const overallProgress = totalPossibleEvaluations > 0 ? Math.round((completedEvaluations / totalPossibleEvaluations) * 100) : 0;

  // Award helper based on overall rank across all categories (분야별 관계 없이 높은 순위 대상 시상)
  // 백제상(대상) 1명 (전체 1위)
  // 웅진상(금상) 1명 (전체 2위)
  // 무령상(은상) 2명 (전체 3위, 4위)
  // 고마상(동상) 3명 (전체 5위, 6위, 7위)
  const getAwardBadgeForSubmission = (submissionId: string) => {
    const overallRankIndex = overallRanked.findIndex((s) => s.id === submissionId);
    if (overallRankIndex === -1) return null;

    if (overallRankIndex === 0) {
      return {
        name: '백제상(대상) 후보 · 1명',
        awardTitle: '백제상 (대상)',
        tier: '1st',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold shadow-xs',
        icon: <Trophy className="h-4 w-4 text-amber-700" />,
      };
    }
    if (overallRankIndex === 1) {
      return {
        name: '웅진상(금상) 후보 · 1명',
        awardTitle: '웅진상 (금상)',
        tier: '2nd',
        badgeClass: 'bg-yellow-50 text-yellow-900 border-yellow-300 font-extrabold shadow-xs',
        icon: <Award className="h-4 w-4 text-yellow-700" />,
      };
    }
    if (overallRankIndex === 2 || overallRankIndex === 3) {
      return {
        name: '무령상(은상) 후보 · 2명',
        awardTitle: '무령상 (은상)',
        tier: '3rd',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold shadow-xs',
        icon: <Medal className="h-4 w-4 text-slate-700" />,
      };
    }
    if (overallRankIndex >= 4 && overallRankIndex <= 5) {
      return {
        name: '고마상(동상) 후보 · 2명',
        awardTitle: '고마상 (동상)',
        tier: '4th',
        badgeClass: 'bg-orange-50 text-orange-900 border-orange-300 font-bold shadow-xs',
        icon: <Medal className="h-4 w-4 text-orange-700" />,
      };
    }
    if (overallRankIndex >= 6 && overallRankIndex <= 9) {
      const reserveNumber = overallRankIndex - 5;
      return {
        name: `예비 후보 (${reserveNumber}순위)`,
        awardTitle: `예비 (${reserveNumber}순위)`,
        tier: 'reserve',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs',
        icon: <CheckCircle2 className="h-4 w-4 text-rose-600" />,
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

          {/* Official Awards Specification Guide Banner (요구사항: 백제상 1명, 웅진상 1명, 무령상 2명, 고마상 3명 / 분야별 관계없이 고득점순 시상) */}
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-slate-50 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-700" />
                <h3 className="text-sm sm:text-base font-black text-amber-950">
                  공모전 공식 시상 체계 안내
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-xs font-bold border border-amber-300">
                  총 7개 작품 시상
                </span>
              </div>
              <p className="text-xs text-amber-900/80 font-bold">
                ※ 무령상(은상)과 고마상(동상)은 분야(이미지/동영상) 구분 없이 전체 고득점 순위로 시상합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-amber-300 bg-white/90 p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs shadow-xs">
                  🏆
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-950">백제상 (대상)</div>
                  <div className="text-[11px] text-amber-800 font-bold">전체 1위 · 1명</div>
                </div>
              </div>

              <div className="rounded-xl border border-yellow-300 bg-white/90 p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-yellow-950 font-black text-xs shadow-xs">
                  🥇
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900">웅진상 (금상)</div>
                  <div className="text-[11px] text-slate-600 font-bold">전체 2위 · 1명</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-300 bg-white/90 p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-800 font-black text-xs shadow-xs">
                  🥈
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900">무령상 (은상)</div>
                  <div className="text-[11px] text-indigo-700 font-bold">전체 3~4위 · 2명 (분야무관)</div>
                </div>
              </div>

              <div className="rounded-xl border border-orange-300 bg-white/90 p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-900 font-black text-xs shadow-xs">
                  🥉
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900">고마상 (동상)</div>
                  <div className="text-[11px] text-orange-800 font-bold">전체 5~6위 · 2명 (분야무관)</div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-4 rounded-xl border border-rose-200 bg-rose-50/50 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-300">
                    예비 후보군
                  </span>
                  <span className="font-bold text-slate-800">
                    전체 7위 ~ 10위 (총 4개 작품, 예비 1순위~4순위)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  본선 수상작 결격 또는 포기 발생 시 고득점 순으로 승계
                </span>
              </div>
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
              종합 순위 (시상 기준 · 전체 {submissions.length})
            </button>

            <button
              onClick={() => setSelectedCategory('IMAGE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === 'IMAGE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>이미지 분야 ({submissions.filter((s) => s.category === 'IMAGE').length})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('VIDEO')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === 'VIDEO'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
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
              const award = getAwardBadgeForSubmission(submission.id);

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
                        <span
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black border shadow-2xs ${
                            submission.category === 'VIDEO'
                              ? 'bg-orange-500 text-white border-orange-400'
                              : 'bg-blue-600 text-white border-blue-400'
                          }`}
                        >
                          {submission.category === 'VIDEO' ? (
                            <Film className="h-2.5 w-2.5" />
                          ) : (
                            <ImageIcon className="h-2.5 w-2.5" />
                          )}
                          <span>{submission.category === 'VIDEO' ? '동영상' : '이미지'}</span>
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
                      <span>출품작 상세 보기</span>
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
