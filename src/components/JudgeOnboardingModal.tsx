import React, { useState, useRef, useEffect } from 'react';
import { useContest } from '../context/ContestContext';
import { ShieldCheck, PenTool, CheckCircle, RotateCcw, X, AlertTriangle, FileText } from 'lucide-react';

interface JudgeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 'profile' | 'oath';
}

export const JudgeOnboardingModal: React.FC<JudgeOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialStep = 'profile',
}) => {
  const { currentUser, oathText, updateJudgeProfile, signJudgeOath } = useContest();
  const judge = currentUser?.judge;

  const [step, setStep] = useState<'profile' | 'oath'>('profile');
  const [formData, setFormData] = useState({
    name: '',
    affiliation: '',
    title: '',
    specialty: '',
    email: '',
    phone: '',
  });

  const [isAgreed, setIsAgreed] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (judge) {
      setFormData({
        name: judge.name || '',
        affiliation: judge.affiliation || '',
        title: judge.title || '',
        specialty: judge.specialty || '',
        email: judge.email || '',
        phone: judge.phone || '',
      });
      setTypedName(judge.name || '');

      if (!judge.isProfileComplete) {
        setStep('profile');
      } else if (!judge.oathSigned) {
        setStep('oath');
      } else {
        setStep(initialStep);
      }
    }
  }, [judge, initialStep, isOpen]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#b45309'; // dark amber
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judge) return;
    updateJudgeProfile(judge.id, formData);
    setStep('oath');
  };

  const handleOathSubmit = () => {
    if (!judge || !isAgreed) return;

    let signatureDataUrl = '';
    if (signatureType === 'draw' && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    } else {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60"><rect width="100%" height="100%" fill="transparent"/><text x="20" y="40" font-family="serif" font-size="24" font-style="italic" fill="#b45309">${typedName || judge.name} (서명)</text></svg>`;
      signatureDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    signJudgeOath(judge.id, signatureDataUrl);
    onClose();
  };

  if (!isOpen || !judge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl text-slate-900 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Step Header */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-amber-700 mb-1 font-bold">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wider">
              심사위원 등록 및 공정 심사 서약 절차
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === 'profile' ? '심사위원 정보 등록 및 확인' : '심사위원 공정심사 및 비밀유지 서약서'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {step === 'profile'
              ? '원활한 심사 진행 및 공정성 확보를 위해 심사위원 기본 정보를 입력해 주세요.'
              : '공모전 심사의 공정성 및 보안을 위하여 서약서 내용을 확인하고 전자서명을 완료해 주십시오.'}
          </p>

          {/* Stepper indicators */}
          <div className="flex items-center gap-3 mt-4">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'profile' ? 'text-amber-800' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'profile' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span>기본 정보 등록</span>
            </div>
            <div className="h-px w-10 bg-slate-200" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'oath' ? 'text-amber-800' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'oath' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span>공정 서약 및 전자서명</span>
            </div>
          </div>
        </div>

        {/* Step 1: Profile Form */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  심사위원 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="예: 김태형"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  소속 기관 / 대학교 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="예: 한국디지털헤리티지학회"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  직위 / 직책 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="예: 상임이사 / 교수"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  전문 분야 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="예: 문화유산 3D 복원, 생성형 AI"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  이메일 주소 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="example@heritage.kr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  연락처 (휴대전화)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors"
              >
                정보 확인 및 서약서 단계로 이동
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Oath & Signature */}
        {step === 'oath' && (
          <div className="space-y-4">
            {/* Oath Document Paper Box (at least 12pt / 16px font readability) */}
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-800 font-sans whitespace-pre-wrap select-none shadow-xs">
              {oathText}
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50/70 cursor-pointer hover:bg-amber-100/60 transition-colors">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-bold text-amber-950 leading-relaxed">
                [필수] 본인은 상기 공정심사 및 비밀유지 서약서의 모든 내용을 충분히 숙지하였으며, 이에 전적으로 동의하고 서명합니다.
              </span>
            </label>

            {/* Signature Area */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <PenTool className="h-4 w-4 text-amber-700" />
                  심사위원 전자서명
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureType('draw')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      signatureType === 'draw'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    직접 서명 그리기
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType('type')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      signatureType === 'type'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    이름 입력 서명
                  </button>
                  {signatureType === 'draw' && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-800 transition-colors ml-2 font-medium"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      지우기
                    </button>
                  )}
                </div>
              </div>

              {signatureType === 'draw' ? (
                <div className="relative rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <span className="pointer-events-none absolute text-xs text-slate-400 font-sans">
                      마우스 또는 터치로 이곳에 서명해 주세요
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="심사위원 성명을 입력하십시오"
                    className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="italic text-2xl font-bold text-amber-800 tracking-wider">
                      {typedName || judge.name} (서명)
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>서약일시: {new Date().toLocaleDateString('ko-KR')}</span>
                <span>심사위원: <strong>{judge.name}</strong> ({judge.affiliation})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('profile')}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← 이전 (정보 수정)
              </button>

              <button
                type="button"
                disabled={!isAgreed || (signatureType === 'draw' && !hasDrawn && !judge.oathSigned)}
                onClick={handleOathSubmit}
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>서약 완료 및 공식 심사 시작</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
