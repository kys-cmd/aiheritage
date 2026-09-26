import React from 'react';
import { useContest } from '../context/ContestContext';
import { X, BookOpen, CheckCircle, Scale, Shield, Sparkles } from 'lucide-react';

interface RubricGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RubricGuideModal: React.FC<RubricGuideModalProps> = ({ isOpen, onClose }) => {
  const { rubricCriteria } = useContest();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl text-slate-900 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1">
            <Scale className="h-4 w-4" />
            <span>공식 심사 기준 및 평가 매트릭스</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            2026 AI 디지털헤리티지 공모전 심사기준표
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            본 심사표는 대한민국 문화유산의 원형 보존 및 창의적 AI 복원·재해석 수준을 객관적·공정하게 측정하기 위한 5점 척도 표준 평가 기준입니다.
          </p>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {rubricCriteria.map((criterion, idx) => (
            <div
              key={criterion.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-amber-700 text-sm font-bold mr-1.5">
                    0{idx + 1}.
                  </span>
                  <span className="text-base font-bold text-slate-900">{criterion.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 w-fit">
                  배점: 최대 {criterion.maxScore}점 (가중치 {criterion.weight}%)
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                {criterion.description}
              </p>

              {/* Rubric Levels 1 to 5 */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  등급별 판정 기준:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {criterion.levels.map((lvl) => (
                    <div
                      key={lvl.score}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <span className="w-12 font-mono font-black text-amber-800 text-sm shrink-0">
                        {lvl.score}점:
                      </span>
                      <span className="text-slate-800 text-sm font-medium">{lvl.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
