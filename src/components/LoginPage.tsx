import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import {
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Database,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginAsJudge, loginAsAdmin } = useContest();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const trimmedId = loginId.trim();

    // 1. Check Administrator credentials (ID: admin / PW: gpflxlwl)
    if (trimmedId.toLowerCase() === 'admin') {
      if (password === 'gpflxlwl') {
        setTimeout(() => {
          loginAsAdmin();
          setIsLoading(false);
          onLoginSuccess();
        }, 300);
        return;
      } else {
        setIsLoading(false);
        setErrorMsg('관리자 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
        return;
      }
    }

    // 2. Check Judge credentials
    setTimeout(() => {
      const res = loginAsJudge(trimmedId, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e0a30] to-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative Heritage Motif Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#32134e]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Center Login Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="rounded-3xl border border-white/15 bg-white/95 backdrop-blur-xl p-7 sm:p-8 shadow-2xl text-slate-900">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">AI 헤리티지 공모전 심사</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              부여받으신 계정의 아이디와 비밀번호를 입력해 주십시오.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-bold flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                아이디 (ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디 입력"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-700">
                  비밀번호 (Password) <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-[#32134e] via-[#431766] to-indigo-900 hover:opacity-95 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? '로그인 확인 중...' : '접속하기'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
