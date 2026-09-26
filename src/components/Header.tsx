import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Layers,
  BarChart3,
  Settings,
  HelpCircle,
  FileCheck2,
  Shield,
  ArrowRight,
  Database,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'evaluations' | 'leaderboard' | 'admin' | 'guide';
  setCurrentTab: (tab: 'evaluations' | 'leaderboard' | 'admin' | 'guide') => void;
  onOpenLogin: () => void;
  onOpenOath: () => void;
  isAdminPortal: boolean;
  setIsAdminPortal: (admin: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLogin,
  onOpenOath,
  isAdminPortal,
  setIsAdminPortal,
}) => {
  const { currentUser, judges, quickSwitchJudge, loginAsAdmin, logout, isCloudConnected } = useContest();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#431766] bg-[#32134e] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand & Logo Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isAdminPortal) {
                setCurrentTab('admin');
              } else {
                setCurrentTab('evaluations');
              }
            }}
            className="group flex items-center gap-2.5 text-left text-lg sm:text-xl font-extrabold tracking-tight text-white hover:text-amber-200 transition-all cursor-pointer"
          >
            <span>{isAdminPortal ? 'AI 헤리티지 공모전 관리자 페이지' : 'AI 헤리티지 공모전 심사'}</span>
            {isAdminPortal && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 text-[#32134e] text-xs font-black tracking-normal shadow-xs">
                관리자
              </span>
            )}
          </button>
        </div>

        {/* Zone 2: Navigation Links (Strictly separated!) */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
          {!isAdminPortal ? (
            /* JUDGE PORTAL NAV - Strictly evaluation only, NO leaderboard */
            <>
              <button
                onClick={() => setCurrentTab('evaluations')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  currentTab === 'evaluations'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                출품작 심사 목록
              </button>

              <button
                onClick={() => setCurrentTab('guide')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  currentTab === 'guide'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                심사기준 가이드
              </button>
            </>
          ) : (
            /* ADMIN PORTAL NAV - Operations, Aggregation, Distribution */
            <>
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  currentTab === 'admin'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                관리자 페이지
              </button>

              <button
                onClick={() => setCurrentTab('leaderboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  currentTab === 'leaderboard'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                실시간 집계 & 리더보드
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Portal Switcher & User Status */}
        <div className="flex items-center gap-2.5">
          {/* Supabase Cloud Sync Status */}
          <div
            title={
              isCloudConnected
                ? 'Supabase 클라우드 데이터베이스 실시간 동기화 활성화됨'
                : '로컬/브라우저 캐시 모드 (VITE_SUPABASE_URL 환경변수 연결 시 Supabase와 자동 연동)'
            }
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isCloudConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 text-slate-300 border-white/15'
            }`}
          >
            <Database className={`h-3 w-3 ${isCloudConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{isCloudConnected ? 'Supabase 연동중' : '로컬 모드'}</span>
          </div>

          {/* Quick Switch Button between Judge Portal and Admin Portal */}
          {!isAdminPortal ? (
            <button
              onClick={() => {
                loginAsAdmin();
                setIsAdminPortal(true);
                setCurrentTab('admin');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 rounded-lg border border-white/15 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-amber-300" />
              <span>관리자 콘솔로 전환</span>
            </button>
          ) : (
            <button
              onClick={() => {
                quickSwitchJudge(judges[0]?.id || 'judge-01');
                setIsAdminPortal(false);
                setCurrentTab('evaluations');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-400/40 transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
              <span>심사위원 페이지로 복귀</span>
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 transition-colors shadow-xs"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[#32134e] font-black text-xs">
                  {currentUser.role === 'ADMIN' ? '管' : '審'}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'JUDGE' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${currentUser.judge?.oathSigned ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40' : 'text-amber-200 bg-amber-950/60 border border-amber-400/40'}`}>
                        {currentUser.judge?.oathSigned ? '서약완료' : '서약필요'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-[11px] text-slate-500 font-medium">현재 접속자</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser.name}</p>
                    {currentUser.judge && (
                      <p className="text-slate-600 text-xs mt-0.5">
                        {currentUser.judge.affiliation} · {currentUser.judge.title}
                      </p>
                    )}
                  </div>

                  {currentUser.role === 'JUDGE' && (
                    <div className="px-2 py-1.5 border-b border-slate-100">
                      <button
                        onClick={onOpenOath}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg hover:bg-slate-100 text-slate-700 hover:text-amber-800 transition-colors font-medium"
                      >
                        <FileCheck2 className="h-4 w-4 text-amber-600" />
                        <span>서약서 확인 및 전자서명</span>
                      </button>
                    </div>
                  )}

                  {/* Fast Switch Judges for testing */}
                  <div className="px-3.5 py-2">
                    <p className="text-[11px] text-slate-500 font-bold mb-1.5">심사위원 빠른 전환 (테스트용)</p>
                    <div className="space-y-1">
                      {judges.map((j) => (
                        <button
                          key={j.id}
                          onClick={() => {
                            quickSwitchJudge(j.id);
                            setIsAdminPortal(false);
                            setCurrentTab('evaluations');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            currentUser.judge?.id === j.id
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{j.name} 심사위원</span>
                          {j.oathSigned ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">서약완료</span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">미서약</span>
                          )}
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          loginAsAdmin();
                          setIsAdminPortal(true);
                          setCurrentTab('admin');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          isAdminPortal
                            ? 'bg-indigo-100 text-indigo-900 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="font-bold">공모전 총괄관리자</span>
                        <span className="text-[10px] text-indigo-700 font-bold">관리자 모드</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-2 pt-1.5 mt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              심사위원 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
