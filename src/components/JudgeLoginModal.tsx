import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import { User, Lock, X, Check, Shield } from 'lucide-react';

interface JudgeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
}

export const JudgeLoginModal: React.FC<JudgeLoginModalProps> = ({ isOpen, onClose, onLoggedIn }) => {
  const { loginAsJudge, loginAsAdmin, judges } = useContest();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (loginId.trim().toLowerCase() === 'admin') {
      if (password === 'gpflxlwl') {
        loginAsAdmin();
        onLoggedIn();
        onClose();
        return;
      } else {
        setErrorMsg('관리자 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    const res = loginAsJudge(loginId, password);
    if (res.success) {
      onLoggedIn();
      onClose();
    } else {
      setErrorMsg(res.message || '로그인에 실패했습니다.');
    }
  };

  const handleQuickSelect = (id: string, pw: string = 'password123') => {
    setLoginId(id);
    setPassword(pw);
    const res = loginAsJudge(id, pw);
    if (res.success) {
      onLoggedIn();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">심사위원 로그인</h2>
          <p className="text-sm text-slate-600 mt-1">부여받으신 심사위원 ID와 비밀번호를 입력해 주십시오.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">심사위원 아이디</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                placeholder="예: judge1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 text-sm font-bold text-white bg-[#32134e] hover:bg-[#431766] rounded-xl shadow-md transition-colors"
          >
            로그인 및 심사 시스템 접속
          </button>
        </form>

        {/* Quick preset selector for review convenience */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-500 mb-2.5 text-center">테스트용 빠른 1클릭 로그인</p>
          <div className="grid grid-cols-1 gap-2">
            {judges.map((j) => (
              <button
                key={j.id}
                onClick={() => handleQuickSelect(j.loginId, j.password)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-left transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{j.name} 심사위원</span>
                  <span className="text-slate-500 text-xs ml-2">아이디: {j.loginId}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${j.oathSigned ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-amber-800 bg-amber-100 border border-amber-300'}`}>
                  {j.oathSigned ? '서약완료' : '미서약 (체험)'}
                </span>
              </button>
            ))}

            <button
              onClick={() => {
                loginAsAdmin();
                onLoggedIn();
                onClose();
              }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50/60 hover:bg-indigo-100 border border-indigo-200 text-left transition-colors text-xs text-indigo-900"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-700" />
                <span className="font-bold">공모전 총괄관리자 (사무국)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full text-indigo-800 bg-indigo-100 font-bold">
                관리자 모드
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
