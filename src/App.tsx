import React, { useState } from 'react';
import { ContestProvider, useContest } from './context/ContestContext';
import { Header } from './components/Header';
import { WorkCard } from './components/WorkCard';
import { WorkListItem } from './components/WorkListItem';
import { WorkChannelView } from './components/WorkChannelView';
import { AdminPanel } from './components/AdminPanel';
import { LiveAggregationView } from './components/LiveAggregationView';
import { JudgeLoginModal } from './components/JudgeLoginModal';
import { JudgeOnboardingModal } from './components/JudgeOnboardingModal';
import { RubricGuideModal } from './components/RubricGuideModal';
import { Category, Submission } from './types';
import {
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  LayoutGrid,
  List,
  Shield,
} from 'lucide-react';

function ContestApp() {
  const {
    currentUser,
    submissions,
    getSubmissionStats,
    activeWorkId,
    setActiveWorkId,
  } = useContest();

  // Portal & Role separation (심사위원 전용 포털 vs 관리자 콘솔)
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(() => currentUser?.role === 'ADMIN');
  const [currentTab, setCurrentTab] = useState<'evaluations' | 'leaderboard' | 'admin' | 'guide'>('evaluations');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // View Layout Mode: Card Grid vs Horizontal List (User request: 리스트는 카드형태 말고도 리스트 형태로도 볼 수 있게 해줘)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | Category>('ALL');
  const [filterMode, setFilterMode] = useState<'UNREVIEWED_FIRST' | 'ALL' | 'UNREVIEWED_ONLY' | 'REVIEWED_ONLY'>('UNREVIEWED_FIRST');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto prompt for onboarding if logged-in judge hasn't signed oath
  React.useEffect(() => {
    if (currentUser?.role === 'JUDGE' && currentUser.judge && !currentUser.judge.oathSigned) {
      setIsOnboardingOpen(true);
    }
  }, [currentUser]);

  // Sync admin portal state if currentUser changes to ADMIN
  React.useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      setIsAdminPortal(true);
      setCurrentTab('admin');
    }
  }, [currentUser?.role]);

  // Active submission for Channel View
  const selectedSubmission = submissions.find((s) => s.id === activeWorkId);

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedCategory !== 'ALL' && sub.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sub.title.toLowerCase().includes(q);
      const matchHeritage = sub.heritageSubject.toLowerCase().includes(q);
      const matchSubmitter = sub.submitterName.toLowerCase().includes(q);
      const matchNum = sub.submissionNumber.toLowerCase().includes(q);
      const matchTool = sub.aiTools.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchHeritage && !matchSubmitter && !matchNum && !matchTool) {
        return false;
      }
    }

    const stats = getSubmissionStats(sub.id);
    if (filterMode === 'UNREVIEWED_ONLY' && stats.isEvaluatedByCurrentJudge) return false;
    if (filterMode === 'REVIEWED_ONLY' && !stats.isEvaluatedByCurrentJudge) return false;

    return true;
  });

  // Prioritize unreviewed works first (핵심 요구사항: 아직 평가하지 않은 작품의 리스트를 우선 보여줌)
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (filterMode === 'UNREVIEWED_FIRST') {
      const statsA = getSubmissionStats(a.id);
      const statsB = getSubmissionStats(b.id);
      if (!statsA.isEvaluatedByCurrentJudge && statsB.isEvaluatedByCurrentJudge) return -1;
      if (statsA.isEvaluatedByCurrentJudge && !statsB.isEvaluatedByCurrentJudge) return 1;
    }
    return 0;
  });

  // Progress metrics for current judge
  const totalCount = submissions.length;
  const reviewedCount = submissions.filter((s) => getSubmissionStats(s.id).isEvaluatedByCurrentJudge).length;
  const unreviewedCount = totalCount - reviewedCount;
  const progressPercent = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenOath={() => setIsOnboardingOpen(true)}
        isAdminPortal={isAdminPortal}
        setIsAdminPortal={setIsAdminPortal}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* JUDGE PORTAL / EVALUATION WORKSPACE (심사위원 전용 페이지)                  */}
        {/* ========================================================================= */}
        {!isAdminPortal && currentTab === 'evaluations' && (
          <div className="space-y-6">
            {/* Contest Header Banner - Clean Light Aesthetic */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    [디지털헤리티지페스타] AI 헤리티지 공모전 심사 페이지
                  </h1>
                  <p className="text-base text-slate-600 leading-relaxed">
                    출품작을 클릭하고 평가 부탁드립니다. 전체 평가 작품에 대하여 미평가 리스트가 없으면 완료됩니다.
                  </p>
                </div>

                {/* Judge Progress Pill Card */}
                {currentUser?.role === 'JUDGE' ? (
                  <div className="shrink-0 w-full md:w-84 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-800">
                        {currentUser.name} 심사위원 심사율
                      </span>
                      <span className="font-mono font-black text-[#32134e] text-base">{progressPercent}%</span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#32134e] via-indigo-600 to-cyan-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-cyan-800">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500 text-white text-[9px] font-black">✓</span>
                        <span>평가 완료 {reviewedCount}건</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>미평가 {unreviewedCount}건</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="px-5 py-3 bg-[#32134e] hover:bg-[#431766] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                    >
                      심사위원 로그인하기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Oath Agreement Reminder Banner if not signed */}
            {currentUser?.role === 'JUDGE' && currentUser.judge && !currentUser.judge.oathSigned && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-amber-950">
                      심사위원 공정심사 및 비밀유지 서약서 서명이 필요합니다
                    </h3>
                    <p className="text-sm text-slate-700 mt-0.5">
                      공정한 심사 집행을 위해 온라인 전자서약서를 작성 완료해 주십시오. (1분 소요)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-5 py-2.5 bg-[#32134e] hover:bg-[#431766] text-white text-xs font-bold rounded-xl shadow-md whitespace-nowrap self-start sm:self-auto"
                >
                  서약서 확인 및 서명하기
                </button>
              </div>
            )}

            {/* Filter Bar & Search Controls & View Layout Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#32134e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 분야 ({submissions.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('IMAGE')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    selectedCategory === 'IMAGE'
                      ? 'bg-[#32134e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>이미지 분야 ({submissions.filter((s) => s.category === 'IMAGE').length})</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('VIDEO')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    selectedCategory === 'VIDEO'
                      ? 'bg-[#32134e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Film className="h-4 w-4" />
                  <span>동영상 분야 ({submissions.filter((s) => s.category === 'VIDEO').length})</span>
                </button>
              </div>

              {/* Status Queue & Layout Toggle & Search */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Layout Toggle (Grid vs List) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      layoutMode === 'grid'
                        ? 'bg-[#32134e] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="카드 그리드 형태로 보기"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>카드형</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      layoutMode === 'list'
                        ? 'bg-[#32134e] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="리스트 형태로 보기"
                  >
                    <List className="h-4 w-4" />
                    <span>리스트형</span>
                  </button>
                </div>

                {/* Status Segmented Mode */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs">
                  <button
                    onClick={() => setFilterMode('UNREVIEWED_FIRST')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterMode === 'UNREVIEWED_FIRST'
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="미평가 작품이 목록 상단에 먼저 표시됩니다."
                  >
                    미평가 우선 정렬
                  </button>
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterMode === 'ALL'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    접수순 전체
                  </button>
                  <button
                    onClick={() => setFilterMode('UNREVIEWED_ONLY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterMode === 'UNREVIEWED_ONLY'
                        ? 'bg-amber-100 text-amber-950 border border-amber-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    미평가만 ({unreviewedCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('REVIEWED_ONLY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterMode === 'REVIEWED_ONLY'
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    심사완료만 ({reviewedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Queue Priority Banner */}
            {filterMode === 'UNREVIEWED_FIRST' && unreviewedCount > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-600 px-1 font-medium">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-700" />
                  <span>아직 평가하지 않은 작품이 목록 상단에 우선 배치되었습니다.</span>
                </span>
                <span className="font-mono text-amber-800 font-bold">
                  미평가 {unreviewedCount}개 작품 심사 대기
                </span>
              </div>
            )}

            {/* Submissions Display (Card Grid vs Compact List) */}
            {sortedSubmissions.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
                <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">조건에 부합하는 출품작이 없습니다</h3>
                <p className="text-sm text-slate-500 mt-1">검색어나 카테고리 필터를 변경해 보세요.</p>
              </div>
            ) : layoutMode === 'grid' ? (
              /* CARD GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedSubmissions.map((submission) => (
                  <WorkCard
                    key={submission.id}
                    submission={submission}
                    onClick={() => setActiveWorkId(submission.id)}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT HORIZONTAL LIST VIEW (User requirement: 리스트 형태로도 볼 수 있게 해줘) */
              <div className="space-y-3.5">
                {sortedSubmissions.map((submission) => (
                  <WorkListItem
                    key={submission.id}
                    submission={submission}
                    onClick={() => setActiveWorkId(submission.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* RUBRIC GUIDE VIEW (심사기준 가이드)                                        */}
        {/* ========================================================================= */}
        {currentTab === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <span className="text-xs font-bold text-amber-800">공모전 공식 심사 기준</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                공모전 심사기준 및 5점 척도 판정 지침
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                심사위원 평가 시 준수해야 하는 5개 핵심 평가 항목 및 점수 산정 가이드라인입니다.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-3">심사 원칙 및 점수 집계 방식</h3>
                <ul className="text-base text-slate-700 space-y-2.5 list-disc list-inside leading-relaxed">
                  <li>각 항목은 <strong>1점부터 최대 5점</strong>까지 정수 단위로 부여됩니다.</li>
                  <li>총 5개 항목으로 심사위원 1인당 <strong>최대 25점 만점</strong>입니다.</li>
                  <li>심사위원의 독립적인 판단을 보장하기 위해 <strong>타 심사위원의 실시간 채점 현황은 심사위원에게 노출되지 않습니다.</strong></li>
                  <li>모든 심사가 완료된 후 운영사무국 관리자 콘솔에서 공정성 분석 및 최종 순위가 집계됩니다.</li>
                </ul>
              </div>

              <RubricGuideModal isOpen={true} onClose={() => setCurrentTab('evaluations')} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN CONSOLE VIEW (관리자 전용 콘솔)                                       */}
        {/* ========================================================================= */}
        {isAdminPortal && currentTab === 'admin' && <AdminPanel />}

        {/* ADMIN LEADERBOARD VIEW */}
        {isAdminPortal && currentTab === 'leaderboard' && (
          <LiveAggregationView onSelectSubmission={(id) => setActiveWorkId(id)} />
        )}
      </main>

      {/* DEDICATED WORK CHANNEL MODAL / VIEW (With Fixed Bottom Navigation) */}
      {selectedSubmission && (
        <WorkChannelView
          submission={selectedSubmission}
          onClose={() => setActiveWorkId(null)}
          onSelectSubmission={(id) => setActiveWorkId(id)}
        />
      )}

      {/* JUDGE LOGIN MODAL */}
      <JudgeLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoggedIn={() => {
          setIsLoginOpen(false);
        }}
      />

      {/* JUDGE ONBOARDING & OATH SIGNING MODAL */}
      <JudgeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2026 디지털헤리티지페스타 AI 헤리티지 공모전</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ContestProvider>
      <ContestApp />
    </ContestProvider>
  );
}
