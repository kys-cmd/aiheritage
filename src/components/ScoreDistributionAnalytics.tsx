import React, { useState, useMemo } from 'react';
import { useContest } from '../context/ContestContext';
import { Category, Evaluation } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Scale,
  Users,
  CheckCircle2,
  Info,
  Layers,
  ChevronDown,
  Sparkles,
  Award,
} from 'lucide-react';

interface ScoreDistributionAnalyticsProps {
  categoryFilter?: 'ALL' | Category;
}

export const ScoreDistributionAnalytics: React.FC<ScoreDistributionAnalyticsProps> = ({
  categoryFilter = 'ALL',
}) => {
  const { submissions, judges, evaluations, rubricCriteria, getSubmissionStats } = useContest();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | Category>(categoryFilter);
  const [activeAnalysisView, setActiveAnalysisView] = useState<'judges' | 'criteria' | 'discrepancy'>('judges');

  // Filter submissions by selected category
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (selectedCategory === 'ALL') return true;
      return s.category === selectedCategory;
    });
  }, [submissions, selectedCategory]);

  const filteredSubmissionIds = useMemo(() => {
    return new Set(filteredSubmissions.map((s) => s.id));
  }, [filteredSubmissions]);

  // Valid submitted evaluations for filtered submissions
  const validEvaluations = useMemo(() => {
    return evaluations.filter(
      (e) => e.status === 'SUBMITTED' && filteredSubmissionIds.has(e.submissionId),
    );
  }, [evaluations, filteredSubmissionIds]);

  // Overall Global Statistics
  const overallStats = useMemo(() => {
    if (validEvaluations.length === 0) {
      return {
        avgTotalScore: 0,
        avgItemScore: 0,
        stdDev: 0,
        totalScoresCount: 0,
        scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalScores = validEvaluations.map((e) => e.totalScore);
    const sum = totalScores.reduce((acc, v) => acc + v, 0);
    const mean = sum / totalScores.length;

    const variance =
      totalScores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / totalScores.length;
    const stdDev = Math.sqrt(variance);

    // Distribution of all individual criterion scores (1~5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let itemScoreSum = 0;
    let itemScoreCount = 0;

    validEvaluations.forEach((evalItem) => {
      evalItem.scores.forEach((s) => {
        const rounded = Math.min(5, Math.max(1, Math.round(s.score)));
        distribution[rounded] = (distribution[rounded] || 0) + 1;
        itemScoreSum += s.score;
        itemScoreCount += 1;
      });
    });

    return {
      avgTotalScore: Number(mean.toFixed(2)),
      avgItemScore: itemScoreCount > 0 ? Number((itemScoreSum / itemScoreCount).toFixed(2)) : 0,
      stdDev: Number(stdDev.toFixed(2)),
      totalScoresCount: itemScoreCount,
      scoreDistribution: distribution,
    };
  }, [validEvaluations]);

  // Judge-by-Judge Statistics
  const judgeStats = useMemo(() => {
    return judges.map((judge) => {
      const judgeEvals = validEvaluations.filter((e) => e.judgeId === judge.id);
      const evalCount = judgeEvals.length;

      if (evalCount === 0) {
        return {
          judge,
          evalCount: 0,
          avgTotalScore: 0,
          avgItemScore: 0,
          stdDev: 0,
          leniencyBias: '데이터 없음',
          deltaFromMean: 0,
          scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
          criterionAverages: {} as Record<string, number>,
        };
      }

      const totalScores = judgeEvals.map((e) => e.totalScore);
      const sum = totalScores.reduce((acc, v) => acc + v, 0);
      const avgTotal = sum / evalCount;

      const variance =
        totalScores.reduce((acc, v) => acc + Math.pow(v - avgTotal, 2), 0) / evalCount;
      const stdDev = Math.sqrt(variance);

      // 1~5 distribution
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let itemSum = 0;
      let itemCount = 0;
      const critSums: Record<string, { sum: number; count: number }> = {};

      judgeEvals.forEach((e) => {
        e.scores.forEach((s) => {
          const rounded = Math.min(5, Math.max(1, Math.round(s.score)));
          distribution[rounded] = (distribution[rounded] || 0) + 1;
          itemSum += s.score;
          itemCount += 1;

          if (!critSums[s.criterionId]) {
            critSums[s.criterionId] = { sum: 0, count: 0 };
          }
          critSums[s.criterionId].sum += s.score;
          critSums[s.criterionId].count += 1;
        });
      });

      const avgItem = itemCount > 0 ? Number((itemSum / itemCount).toFixed(2)) : 0;

      // Leniency index comparing judge avg to overall average
      const delta = avgTotal - overallStats.avgTotalScore;
      let leniencyBias = '균형적 채점 (중립)';
      if (delta >= 1.5) leniencyBias = '관대화 경향 (평균보다 높음)';
      else if (delta <= -1.5) leniencyBias = '엄격화 경향 (평균보다 낮음)';

      const criterionAverages: Record<string, number> = {};
      rubricCriteria.forEach((c) => {
        if (critSums[c.id] && critSums[c.id].count > 0) {
          criterionAverages[c.id] = Number(
            (critSums[c.id].sum / critSums[c.id].count).toFixed(2),
          );
        } else {
          criterionAverages[c.id] = 0;
        }
      });

      return {
        judge,
        evalCount,
        avgTotalScore: Number(avgTotal.toFixed(2)),
        avgItemScore: avgItem,
        stdDev: Number(stdDev.toFixed(2)),
        leniencyBias,
        deltaFromMean: Number(delta.toFixed(2)),
        scoreDistribution: distribution,
        criterionAverages,
      };
    });
  }, [judges, validEvaluations, overallStats, rubricCriteria]);

  // Criteria-by-Criteria Statistics
  const criteriaStats = useMemo(() => {
    return rubricCriteria.map((criterion) => {
      const scoresForCrit: number[] = [];
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      validEvaluations.forEach((evalItem) => {
        const found = evalItem.scores.find((s) => s.criterionId === criterion.id);
        if (found) {
          scoresForCrit.push(found.score);
          const rounded = Math.min(5, Math.max(1, Math.round(found.score)));
          distribution[rounded] = (distribution[rounded] || 0) + 1;
        }
      });

      const count = scoresForCrit.length;
      if (count === 0) {
        return {
          criterion,
          count: 0,
          average: 0,
          stdDev: 0,
          distribution,
          discriminationIndex: '데이터 없음',
        };
      }

      const sum = scoresForCrit.reduce((acc, v) => acc + v, 0);
      const avg = sum / count;
      const variance =
        scoresForCrit.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / count;
      const stdDev = Math.sqrt(variance);

      let discriminationIndex = '보통 변별력';
      if (stdDev >= 0.7) discriminationIndex = '높은 변별력 (작품 간 점수차 큼)';
      else if (stdDev <= 0.4) discriminationIndex = '점수 수렴형 (위원 간 동질 점수)';

      return {
        criterion,
        count,
        average: Number(avg.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        distribution,
        discriminationIndex,
      };
    });
  }, [rubricCriteria, validEvaluations]);

  // Inter-rater Discrepancy & Outlier Detection
  const discrepancyAnalysis = useMemo(() => {
    return filteredSubmissions
      .map((submission) => {
        const subEvals = validEvaluations.filter((e) => e.submissionId === submission.id);
        if (subEvals.length < 2) {
          return {
            submission,
            evalCount: subEvals.length,
            scores: subEvals.map((e) => ({ judgeName: e.judgeName, score: e.totalScore })),
            maxDelta: 0,
            stdDev: 0,
            averageScore: subEvals.length === 1 ? subEvals[0].totalScore : 0,
            hasHighDiscrepancy: false,
          };
        }

        const scores = subEvals.map((e) => e.totalScore);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const maxDelta = maxScore - minScore;

        const sum = scores.reduce((acc, v) => acc + v, 0);
        const avg = sum / scores.length;
        const variance =
          scores.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        const hasHighDiscrepancy = maxDelta >= 4;

        return {
          submission,
          evalCount: subEvals.length,
          scores: subEvals.map((e) => ({ judgeName: e.judgeName, score: e.totalScore })),
          maxDelta,
          stdDev: Number(stdDev.toFixed(2)),
          averageScore: Number(avg.toFixed(2)),
          hasHighDiscrepancy,
        };
      })
      .sort((a, b) => b.maxDelta - a.maxDelta);
  }, [filteredSubmissions, validEvaluations]);

  const highDiscrepancyCount = discrepancyAnalysis.filter((d) => d.hasHighDiscrepancy).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-1">
              <Scale className="h-4 w-4" />
              <span>심사위원별 채점 분포 및 공정성 분석</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              심사 공정성 및 점수 분포 심층 분석
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              심사위원별 관대화·엄격화 편향, 5점 척도 항목별 득점 분포 및 위원 간 불일치(이상치)를 다각도로 시각화하여 공정성을 검증합니다.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 부문
            </button>
            <button
              onClick={() => setSelectedCategory('IMAGE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedCategory === 'IMAGE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              이미지 부문
            </button>
            <button
              onClick={() => setSelectedCategory('VIDEO')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedCategory === 'VIDEO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              동영상 부문
            </button>
          </div>
        </div>

        {/* Global Summary KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">분석 대상 완료 평가</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                {validEvaluations.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">건</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              항목별 채점 총 {overallStats.totalScoresCount}회 집계
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">전체 평점 평균 (5.0 척도)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-2xl font-black text-amber-700 tabular-nums">
                {overallStats.avgItemScore.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              총점 환산 평균 {overallStats.avgTotalScore.toFixed(1)}점 (25점 만점)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">전체 채점 표준편차</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-2xl font-black text-slate-800 tabular-nums">
                {overallStats.stdDev.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">점</span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              {overallStats.stdDev < 1.0 ? '안정적 수렴 분포' : '적절한 점수 분산도 유지'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">위원 간 점수 차이 집중 검토작</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-2xl font-black text-amber-700 tabular-nums">
                {highDiscrepancyCount}
              </span>
              <span className="text-xs text-slate-500 font-mono">건</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">최고-최저 점수 편차 4점 이상</p>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAnalysisView('judges')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAnalysisView === 'judges'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>01. 심사위원별 점수 분포 & 성향 분석</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('criteria')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAnalysisView === 'criteria'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>02. 5개 심사항목별 점수 분포 & 변별력</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('discrepancy')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAnalysisView === 'discrepancy'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>03. 위원 간 편차(이상치) 검토 ({highDiscrepancyCount}건)</span>
        </button>
      </div>

      {/* VIEW 1: JUDGE-BY-JUDGE ANALYSIS */}
      {activeAnalysisView === 'judges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {judgeStats.map(({ judge, evalCount, avgTotalScore, avgItemScore, stdDev, leniencyBias, deltaFromMean, scoreDistribution }) => {
              const totalScoresCount = Object.values(scoreDistribution).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={judge.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900">{judge.name}</h3>
                          <span className="text-xs text-slate-500 font-mono font-bold">({judge.loginId})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {judge.affiliation} · {judge.specialty}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800">
                        완료 {evalCount}건
                      </span>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 block font-medium">부여 총점 평균</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono text-lg font-black text-amber-700 tabular-nums">
                            {evalCount > 0 ? avgTotalScore.toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-slate-500">/ 25점</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 block font-medium">채점 표준편차</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono text-lg font-black text-slate-800 tabular-nums">
                            {evalCount > 0 ? stdDev.toFixed(2) : '-'}
                          </span>
                          <span className="text-xs text-slate-500">점</span>
                        </div>
                      </div>
                    </div>

                    {/* Leniency indicator badge */}
                    <div className="mt-3 flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-medium">채점 성향 판정:</span>
                      <span
                        className={`font-bold ${
                          leniencyBias.includes('관대화')
                            ? 'text-amber-800'
                            : leniencyBias.includes('엄격화')
                            ? 'text-sky-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {leniencyBias}
                      </span>
                    </div>

                    {/* Histogram of 1~5 points given by this judge */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span>점수대별 부여 빈도 (1점 ~ 5점)</span>
                        <span className="font-mono text-xs text-slate-500">총 {totalScoresCount}개 항목</span>
                      </div>

                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((pts) => {
                          const dist = scoreDistribution as Record<number, number>;
                          const count = dist[pts] || 0;
                          const pct = totalScoresCount > 0 ? Math.round((count / totalScoresCount) * 100) : 0;
                          return (
                            <div key={pts} className="flex items-center gap-2 text-xs">
                              <span className="w-8 font-mono text-xs font-bold text-slate-700 shrink-0 text-right">
                                {pts}점
                              </span>
                              <div className="h-3.5 flex-1 rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    pts === 5
                                      ? 'bg-amber-500'
                                      : pts === 4
                                      ? 'bg-amber-600'
                                      : pts === 3
                                      ? 'bg-slate-400'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-14 font-mono text-xs text-slate-600 text-right tabular-nums">
                                {count}회 ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                    전체 평균 대비 편차:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {(deltaFromMean ?? 0) > 0 ? `+${deltaFromMean}` : deltaFromMean}점
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Comparison Chart Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                심사위원별 5개 평가 항목별 채점 평균 비교 매트릭스
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                특정 심사위원이 특정 항목(예: 윤리성, 기술 완성도)에서 유독 엄격하거나 관대한지 가로 비교할 수 있습니다.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">심사위원</th>
                    {rubricCriteria.map((c, i) => (
                      <th key={c.id} className="py-3.5 px-3 text-center font-bold">
                        <span className="text-amber-700 font-mono mr-1">0{i + 1}.</span>
                        {c.name.split(' ')[0]}
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center font-bold">평균 평점 (5.0)</th>
                    <th className="py-3.5 px-4 text-center font-bold">공정성 편향 진단</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {judgeStats.map(({ judge, evalCount, criterionAverages, avgItemScore, leniencyBias }) => (
                    <tr key={judge.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{judge.name} 심사위원</div>
                        <div className="text-xs text-slate-500">{judge.affiliation}</div>
                      </td>
                      {rubricCriteria.map((c) => {
                        const score = criterionAverages[c.id] || 0;
                        return (
                          <td key={c.id} className="py-3.5 px-3 text-center font-mono">
                            {evalCount > 0 ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                  score >= 4.5
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : score <= 3.5
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                    : 'bg-white text-slate-900 border border-slate-200'
                                }`}
                              >
                                {score.toFixed(1)}점
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-800 text-base">
                        {evalCount > 0 ? avgItemScore.toFixed(2) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            leniencyBias.includes('관대화')
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : leniencyBias.includes('엄격화')
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {leniencyBias}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CRITERIA DISTRIBUTION & DISCRIMINATION */}
      {activeAnalysisView === 'criteria' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">5개 핵심 심사항목별 점수 분포 누적 막대 차트</h3>
              <p className="text-xs text-slate-500 mt-1">
                각 항목별 1점~5점의 득점 비율 및 평균을 시각화하여, 어떤 항목에서 작품 간 점수 차이가 벌어졌는지(변별력)를 검토합니다.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <span className="text-slate-500 font-semibold">범례:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-amber-500" />
                <span className="text-slate-700 font-medium">5점 (매우 우수)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-amber-600" />
                <span className="text-slate-700 font-medium">4점 (우수)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-slate-400" />
                <span className="text-slate-700 font-medium">3점 (보통)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-rose-500" />
                <span className="text-slate-700 font-medium">2점 이하 (미흡)</span>
              </div>
            </div>

            {/* Horizontal Distribution Bars per criterion */}
            <div className="space-y-4 pt-2">
              {criteriaStats.map(({ criterion, count, average, stdDev, distribution, discriminationIndex }, idx) => {
                const total = count || 1;
                const p5 = Math.round(((distribution[5] || 0) / total) * 100);
                const p4 = Math.round(((distribution[4] || 0) / total) * 100);
                const p3 = Math.round(((distribution[3] || 0) / total) * 100);
                const p2 = Math.round(((distribution[2] || 0) / total) * 100);
                const p1 = Math.round(((distribution[1] || 0) / total) * 100);
                const pLow = p2 + p1;

                return (
                  <div
                    key={criterion.id}
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-amber-700 font-bold mr-1.5 text-sm">
                          0{idx + 1}.
                        </span>
                        <span className="text-sm font-bold text-slate-900">{criterion.name}</span>
                        <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                          ({criterion.description.slice(0, 36)}...)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <span className="text-xs text-slate-500">평균: </span>
                          <span className="font-mono text-sm font-bold text-amber-800">
                            {average.toFixed(2)}점
                          </span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-300 font-bold text-slate-700">
                          {discriminationIndex}
                        </span>
                      </div>
                    </div>

                    {/* Stacked 100% Bar */}
                    <div className="h-7 w-full rounded-lg bg-slate-200 overflow-hidden flex border border-slate-300">
                      {p5 > 0 && (
                        <div
                          className="h-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ width: `${p5}%` }}
                          title={`5점: ${distribution[5]}건 (${p5}%)`}
                        >
                          {p5 >= 8 && `${p5}%`}
                        </div>
                      )}
                      {p4 > 0 && (
                        <div
                          className="h-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ width: `${p4}%` }}
                          title={`4점: ${distribution[4]}건 (${p4}%)`}
                        >
                          {p4 >= 8 && `${p4}%`}
                        </div>
                      )}
                      {p3 > 0 && (
                        <div
                          className="h-full bg-slate-400 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ width: `${p3}%` }}
                          title={`3점: ${distribution[3]}건 (${p3}%)`}
                        >
                          {p3 >= 8 && `${p3}%`}
                        </div>
                      )}
                      {pLow > 0 && (
                        <div
                          className="h-full bg-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ width: `${pLow}%` }}
                          title={`2점 이하: ${(distribution[2] || 0) + (distribution[1] || 0)}건 (${pLow}%)`}
                        >
                          {pLow >= 8 && `${pLow}%`}
                        </div>
                      )}
                    </div>

                    {/* Sub-label counts */}
                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span>5점 {distribution[5] || 0}건</span>
                      <span>4점 {distribution[4] || 0}건</span>
                      <span>3점 {distribution[3] || 0}건</span>
                      <span>2점 {distribution[2] || 0}건</span>
                      <span>1점 {distribution[1] || 0}건</span>
                      <span className="text-slate-700 font-sans">
                        표준편차: <strong className="text-slate-900 font-mono">{stdDev.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: INTER-RATER DISCREPANCY & OUTLIER DETECTION */}
      {activeAnalysisView === 'discrepancy' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>심사위원 간 점수 편차 및 이상치 모니터링</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  심사위원 간 최고점과 최저점의 차이(Δ)가 4점 이상 발생한 작품을 우선 검토하여, 편파 심사 또는 착오 입력 여부를 확인합니다.
                </p>
              </div>

              <div className="shrink-0 text-xs text-slate-500">
                총 <strong className="text-amber-800 font-mono font-bold">{discrepancyAnalysis.length}</strong>개 작품 분석
              </div>
            </div>

            <div className="space-y-3">
              {discrepancyAnalysis.map(({ submission, evalCount, scores, maxDelta, stdDev, averageScore, hasHighDiscrepancy }) => (
                <div
                  key={submission.id}
                  className={`p-5 rounded-2xl border transition-colors ${
                    hasHighDiscrepancy
                      ? 'border-amber-300 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {submission.submissionNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {submission.category === 'VIDEO' ? '동영상' : '이미지'}
                        </span>
                        {hasHighDiscrepancy && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            편차 주의 ({maxDelta}점 차이)
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{submission.title}</h4>
                      <p className="text-xs text-slate-500">
                        {submission.heritageSubject} · {submission.submitterName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {/* Individual judge scores */}
                      <div className="flex items-center gap-2">
                        {scores.map((sc, i) => (
                          <div
                            key={i}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs"
                          >
                            <span className="block text-[11px] text-slate-500 truncate max-w-[90px]">
                              {sc.judgeName}
                            </span>
                            <span className="font-mono font-bold text-amber-800 text-sm">
                              {sc.score}점
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Discrepancy stats */}
                      <div className="text-right border-l border-slate-200 pl-4">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-xs text-slate-500">평균:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {averageScore.toFixed(1)}점
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          최대 편차 {maxDelta}점 · 표준편차 {stdDev.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
