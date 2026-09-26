import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import { Category, Judge, Submission } from '../types';
import { ScoreDistributionAnalytics } from './ScoreDistributionAnalytics';
import {
  Plus,
  Trash2,
  Edit2,
  FileCheck2,
  Upload,
  Download,
  Users,
  Film,
  Image as ImageIcon,
  ExternalLink,
  Shield,
  Layers,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    submissions,
    judges,
    evaluations,
    oathText,
    oathUploadNotice,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    addJudge,
    updateJudge,
    deleteJudge,
    updateOathText,
    setOathUploadNotice,
    getSubmissionStats,
    resetToDefaultData,
  } = useContest();

  const [activeAdminTab, setActiveAdminTab] = useState<'submissions' | 'judges' | 'scores' | 'distribution' | 'oath'>('submissions');

  // New Submission Form State
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subForm, setSubForm] = useState({
    title: '',
    category: 'IMAGE' as Category,
    submitterName: '',
    submitterAffiliation: '',
    heritageSubject: '',
    description: '',
    aiTools: 'Midjourney v6, Stable Diffusion',
    promptSummary: '',
    driveLink: '',
    previewImageUrl: '/src/assets/images/heritage_sukgulam_ai_1790403229254.jpg',
    videoDuration: '01:30',
  });

  // New Judge Form State
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [judgeForm, setJudgeForm] = useState({
    loginId: '',
    password: 'password123',
    name: '',
    affiliation: '',
    title: '',
    specialty: '',
    email: '',
    phone: '',
    assignedCategory: 'ALL' as 'ALL' | 'IMAGE' | 'VIDEO',
  });

  // Oath Editing State
  const [customOath, setCustomOath] = useState(oathText);
  const [uploadedNoticeName, setUploadedNoticeName] = useState(oathUploadNotice || '');
  const [oathModalJudge, setOathModalJudge] = useState<Judge | null>(null);

  // Handle Submission Creation
  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    addSubmission({
      title: subForm.title,
      category: subForm.category,
      submitterName: subForm.submitterName,
      submitterAffiliation: subForm.submitterAffiliation,
      heritageSubject: subForm.heritageSubject,
      description: subForm.description,
      aiTools: subForm.aiTools.split(',').map((t) => t.trim()),
      promptSummary: subForm.promptSummary,
      driveLink: subForm.driveLink || 'https://drive.google.com/drive/folders/sample_heritage_entry',
      previewImageUrl: subForm.previewImageUrl,
      videoDuration: subForm.category === 'VIDEO' ? subForm.videoDuration : undefined,
      submissionNumber: '',
    });

    setIsAddingSub(false);
    setSubForm({
      title: '',
      category: 'IMAGE',
      submitterName: '',
      submitterAffiliation: '',
      heritageSubject: '',
      description: '',
      aiTools: 'Midjourney v6, Stable Diffusion',
      promptSummary: '',
      driveLink: '',
      previewImageUrl: '/src/assets/images/heritage_sukgulam_ai_1790403229254.jpg',
      videoDuration: '01:30',
    });
  };

  // Handle Judge Creation
  const handleCreateJudge = (e: React.FormEvent) => {
    e.preventDefault();
    addJudge({
      loginId: judgeForm.loginId.trim(),
      password: judgeForm.password,
      name: judgeForm.name.trim(),
      affiliation: judgeForm.affiliation.trim(),
      title: judgeForm.title.trim(),
      specialty: judgeForm.specialty.trim(),
      email: judgeForm.email.trim(),
      phone: judgeForm.phone.trim(),
      assignedCategory: judgeForm.assignedCategory,
    });

    setIsAddingJudge(false);
    setJudgeForm({
      loginId: '',
      password: 'password123',
      name: '',
      affiliation: '',
      title: '',
      specialty: '',
      email: '',
      phone: '',
      assignedCategory: 'ALL',
    });
  };

  // CSV Export for final evaluation report
  const handleExportCSV = () => {
    const headers = [
      '접수번호',
      '출품분야',
      '작품명',
      '출품자',
      '대상문화유산',
      '심사완료인원',
      '평균평점(5.0)',
      '100점환산',
      '구글드라이브링크',
    ];

    const rows = submissions.map((s) => {
      const stats = getSubmissionStats(s.id);
      return [
        s.submissionNumber,
        s.category === 'IMAGE' ? '이미지' : '동영상',
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.submitterName}"`,
        `"${s.heritageSubject}"`,
        `${stats.evaluatedCount}/${stats.totalJudges}`,
        stats.averageScore.toFixed(2),
        Math.round((stats.averageScore / 5) * 100),
        `"${s.driveLink}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `2026_AI_디지털헤리티지_공모전_심사집계표_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-1">
            <Shield className="h-4 w-4" />
            <span>공모전 운영사무국 총괄 시스템</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            공모전 총괄 관리자 콘솔
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            접수 작품(구글 드라이브 연동), 심사위원 명단, 공정 서약서, 실시간 심사 집계 및 점수 분포 차트를 통합 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetToDefaultData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="초기 샘플 데이터 복원"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>기본값 복원</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>심사결과 CSV 다운로드</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('submissions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'submissions'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>공모전 접수 작품 관리 ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('judges')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'judges'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>심사위원 관리 및 서약 확인 ({judges.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'scores'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>실시간 심사 집계 매트릭스</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('distribution')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'distribution'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>점수 분포 & 공정성 분석 차트</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('oath')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'oath'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          <span>심사위원 서약서 양식 관리</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS MANAGEMENT */}
      {activeAdminTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">접수 작품 목록 및 구글 드라이브 연동 관리</h2>
              <p className="text-xs text-slate-500">
                대용량 이미지/동영상 원본을 구글 드라이브 링크로 연결하여 심사위원이 고해상도로 검토할 수 있도록 합니다.
              </p>
            </div>
            <button
              onClick={() => setIsAddingSub(!isAddingSub)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>신규 출품작 등록</span>
            </button>
          </div>

          {/* Add Submission Form Modal/Card */}
          {isAddingSub && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="text-base font-bold text-amber-900">
                  신규 공모전 접수 작품 등록 (구글 드라이브 연동)
                </h3>
                <button
                  onClick={() => setIsAddingSub(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  취소
                </button>
              </div>

              {/* Instructions banner */}
              <div className="rounded-xl bg-white border border-amber-300 p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 text-sm font-bold">구글 드라이브 연동 가이드:</strong>
                  <p className="text-xs text-slate-600 mt-1">
                    1. 출품자의 원본 8K 이미지 또는 4K 동영상을 구글 드라이브에 업로드합니다.<br />
                    2. 구글 드라이브 해당 파일에서 [공유] 클릭 → 일반 액세스를 <strong>[링크가 있는 모든 사용자 - 뷰어 또는 편집자]</strong>로 설정합니다.<br />
                    3. 복사된 공유 링크를 아래 '구글 드라이브 공유 링크'란에 붙여넣으면 심사위원이 즉시 열람 및 임베드로 검토할 수 있습니다.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmission} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      작품명 (출품작 제목) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subForm.title}
                      onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                      placeholder="예: 훈민정음: 소리의 형태를 빚다"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      출품 분야 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={subForm.category}
                      onChange={(e) => setSubForm({ ...subForm, category: e.target.value as Category })}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="IMAGE">이미지 분야 (디지털 일러스트/렌더링)</option>
                      <option value="VIDEO">동영상 분야 (영상/미디어아트)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      출품자 성명 또는 팀명 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subForm.submitterName}
                      onChange={(e) => setSubForm({ ...subForm, submitterName: e.target.value })}
                      placeholder="예: 아틀리에 헤리티지 (대표 최원석)"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      대상 문화유산 (고증 모티브) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subForm.heritageSubject}
                      onChange={(e) => setSubForm({ ...subForm, heritageSubject: e.target.value })}
                      placeholder="예: 국보 제24호 경주 석굴암 석조여래좌상"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      구글 드라이브 공유 링크 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={subForm.driveLink}
                      onChange={(e) => setSubForm({ ...subForm, driveLink: e.target.value })}
                      placeholder="https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      활용 AI 도구 (쉼표 구분)
                    </label>
                    <input
                      type="text"
                      value={subForm.aiTools}
                      onChange={(e) => setSubForm({ ...subForm, aiTools: e.target.value })}
                      placeholder="Midjourney v6, Runway Gen-3, Stable Diffusion"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      미리보기 썸네일 이미지 URL
                    </label>
                    <input
                      type="text"
                      value={subForm.previewImageUrl}
                      onChange={(e) => setSubForm({ ...subForm, previewImageUrl: e.target.value })}
                      placeholder="/src/assets/images/... 또는 이미지 URL"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      작품 기획 의도 및 설명
                    </label>
                    <textarea
                      rows={2}
                      value={subForm.description}
                      onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                      placeholder="출품작의 기획 배경 및 문화유산 디지털 재해석 의도를 입력하세요."
                      className="w-full rounded-xl bg-white border border-slate-300 p-3 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingSub(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    접수작 등록 및 채널 생성
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submissions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-bold">번호</th>
                  <th className="py-3.5 px-4 font-bold">분야</th>
                  <th className="py-3.5 px-4 font-bold">작품명 / 대상문화유산</th>
                  <th className="py-3.5 px-4 font-bold">출품자</th>
                  <th className="py-3.5 px-4 font-bold">구글 드라이브</th>
                  <th className="py-3.5 px-4 text-center font-bold">심사 현황</th>
                  <th className="py-3.5 px-4 text-right font-bold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const stats = getSubmissionStats(sub.id);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{sub.submissionNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 font-bold text-xs text-slate-800">
                          {sub.category === 'VIDEO' ? (
                            <Film className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                          )}
                          <span>{sub.category === 'VIDEO' ? '동영상' : '이미지'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.title}</div>
                        <div className="text-xs text-slate-500">{sub.heritageSubject}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{sub.submitterName}</td>
                      <td className="py-3.5 px-4">
                        <a
                          href={sub.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-mono text-xs font-semibold"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>드라이브 링크</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {stats.evaluatedCount}/{stats.totalJudges}명 완료
                        </span>
                        {stats.evaluatedCount > 0 && (
                          <div className="text-xs text-amber-700 font-mono font-bold">
                            평균 {stats.averageScore.toFixed(1)} / 5.0
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`'${sub.title}' 출품작을 삭제하시겠습니까?`)) {
                              deleteSubmission(sub.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JUDGE MANAGEMENT */}
      {activeAdminTab === 'judges' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">심사위원 명단 및 공정 서약서 서명 현황</h2>
              <p className="text-xs text-slate-500">
                심사위원에게 아이디와 패스워드를 발급하고, 공정 서약서 전자서명 여부를 확인합니다.
              </p>
            </div>
            <button
              onClick={() => setIsAddingJudge(!isAddingJudge)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>신규 심사위원 위촉/추가</span>
            </button>
          </div>

          {/* Add Judge Form */}
          {isAddingJudge && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="text-base font-bold text-amber-900">
                  신규 심사위원 정보 등록
                </h3>
                <button
                  onClick={() => setIsAddingJudge(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handleCreateJudge} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      로그인 ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={judgeForm.loginId}
                      onChange={(e) => setJudgeForm({ ...judgeForm, loginId: e.target.value })}
                      placeholder="예: judge4"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      비밀번호 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={judgeForm.password}
                      onChange={(e) => setJudgeForm({ ...judgeForm, password: e.target.value })}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      성명 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={judgeForm.name}
                      onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })}
                      placeholder="예: 홍길동"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      소속 기관 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={judgeForm.affiliation}
                      onChange={(e) => setJudgeForm({ ...judgeForm, affiliation: e.target.value })}
                      placeholder="예: 서울대학교 문화유산AI연구소"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingJudge(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    심사위원 계정 발급
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Judges Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-bold">심사위원명</th>
                  <th className="py-3.5 px-4 font-bold">로그인 ID / PW</th>
                  <th className="py-3.5 px-4 font-bold">소속 / 직책</th>
                  <th className="py-3.5 px-4 font-bold">전문 분야</th>
                  <th className="py-3.5 px-4 text-center font-bold">심사 진척도</th>
                  <th className="py-3.5 px-4 text-center font-bold">공정 서약서</th>
                  <th className="py-3.5 px-4 text-right font-bold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {judges.map((j) => {
                  const completedCount = evaluations.filter(
                    (e) => e.judgeId === j.id && e.status === 'SUBMITTED',
                  ).length;
                  const totalWorks = submissions.length;

                  return (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{j.name} 심사위원</div>
                        <div className="text-xs text-slate-500">{j.email || j.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <span>{j.loginId}</span>
                        <span className="text-slate-400 text-xs ml-1.5">/ {j.password || '••••'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{j.affiliation}</div>
                        <div className="text-xs text-slate-500">{j.title}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{j.specialty}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {completedCount} / {totalWorks}건
                        </span>
                        <div className="text-xs text-slate-500">
                          {Math.round((completedCount / (totalWorks || 1)) * 100)}% 완료
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {j.oathSigned ? (
                          <button
                            onClick={() => setOathModalJudge(j)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>서약 완료 (확인)</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>미서약 (대기)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`'${j.name} 심사위원'을 삭제하시겠습니까?`)) {
                              deleteJudge(j.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-TIME SCORES & MATRIX */}
      {activeAdminTab === 'scores' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">실시간 심사위원별 점수 매트릭스 및 종합 순위</h2>
              <p className="text-xs text-slate-500">
                모든 심사위원이 입력한 실시간 점수가 자동으로 가중 합산되어 순위가 도출됩니다.
              </p>
            </div>
            <button
              onClick={() => setActiveAdminTab('distribution')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors self-start sm:self-auto"
            >
              <BarChart3 className="h-3.5 w-3.5 text-amber-700" />
              <span>점수 분포 및 공정성 차트 분석</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-bold">순위</th>
                  <th className="py-3.5 px-4 font-bold">작품명 / 분야</th>
                  <th className="py-3.5 px-4 font-bold">출품자</th>
                  {judges.map((j) => (
                    <th key={j.id} className="py-3.5 px-3 text-center font-bold">
                      {j.name}
                      <div className="text-[10px] text-slate-400 font-normal">심사위원</div>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center font-bold">평균 평점 (5.0)</th>
                  <th className="py-3.5 px-4 text-center font-bold">총점 (25점 만점)</th>
                  <th className="py-3.5 px-4 text-center font-bold">수상 후보 추천</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions
                  .slice()
                  .sort((a, b) => {
                    const statsA = getSubmissionStats(a.id);
                    const statsB = getSubmissionStats(b.id);
                    return statsB.averageScore - statsA.averageScore;
                  })
                  .map((sub, rankIndex) => {
                    const stats = getSubmissionStats(sub.id);
                    const awardRecommends = stats.evaluations.filter((e) => e.recommendForAward).length;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          {rankIndex === 0 ? '🏆 1위' : `${rankIndex + 1}위`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.title}</div>
                          <div className="text-xs text-slate-500">
                            {sub.submissionNumber} · {sub.category === 'VIDEO' ? '동영상' : '이미지'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{sub.submitterName}</td>
                        {judges.map((j) => {
                          const judgeEval = evaluations.find(
                            (e) => e.submissionId === sub.id && e.judgeId === j.id,
                          );
                          return (
                            <td key={j.id} className="py-3 px-3 text-center font-mono">
                              {judgeEval ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    judgeEval.status === 'SUBMITTED'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {judgeEval.totalScore}점
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-800 text-base">
                          {stats.evaluatedCount > 0 ? `${stats.averageScore.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                          {stats.evaluatedCount > 0
                            ? `${(stats.totalScoreSum / stats.evaluatedCount).toFixed(1)} / 25점`
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {awardRecommends > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Award className="h-3.5 w-3.5 text-amber-700" />
                              <span>{awardRecommends}명 추천</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SCORE DISTRIBUTION & FAIRNESS ANALYTICS */}
      {activeAdminTab === 'distribution' && <ScoreDistributionAnalytics />}

      {/* TAB 5: OATH FORM & NOTICE MANAGEMENT */}
      {activeAdminTab === 'oath' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">심사위원 서약서 양식 및 첨부 공고문 관리</h2>
              <p className="text-xs text-slate-500">
                심사위원이 로그인 시 동의하고 전자서명할 공식 서약서 문안과 공고 서식 파일을 관리합니다.
              </p>
            </div>
          </div>

          {/* Upload notice file box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-amber-600" />
              <span>심사위원 서약서 공식 문서 첨부 파일 등록</span>
            </h3>
            <p className="text-xs text-slate-500">
              심사위원들이 다운로드받아 보관할 수 있는 날인 서약서 공문(PDF/HWP)을 등록합니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={uploadedNoticeName}
                onChange={(e) => setUploadedNoticeName(e.target.value)}
                placeholder="파일명 (예: 2026_AI_디지털헤리티지_공정심사_서약서_공식서식.pdf)"
                className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  setOathUploadNotice(uploadedNoticeName || null);
                  alert('공식 서약서 문서 공지가 저장되었습니다.');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors whitespace-nowrap"
              >
                공문 파일명 갱신
              </button>
            </div>
          </div>

          {/* Oath Text Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-amber-600" />
                <span>심사위원 공정심사 및 비밀유지 서약서 전문 편집</span>
              </h3>
              <button
                onClick={() => {
                  updateOathText(customOath);
                  alert('서약서 문안이 시스템에 성공적으로 반영되었습니다.');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>서약서 문안 저장</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={customOath}
              onChange={(e) => setCustomOath(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 border border-slate-300 p-4 text-sm font-sans text-slate-800 leading-relaxed focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Signed Oath Modal Detail */}
      {oathModalJudge && oathModalJudge.oath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {oathModalJudge.name} 심사위원 전자 서약서
                </h3>
              </div>
              <button
                onClick={() => setOathModalJudge(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">성명:</span>
                <span className="font-bold text-slate-900">{oathModalJudge.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">소속 / 직책:</span>
                <span>{oathModalJudge.affiliation} / {oathModalJudge.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">서약 일시:</span>
                <span className="font-mono">{oathModalJudge.oath.signedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">서약 내용 동의:</span>
                <span className="text-emerald-700 font-bold">전항 동의 완료</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500 mb-2 font-medium">심사위원 전자서명 인영</p>
              {oathModalJudge.oath.signatureDataUrl ? (
                <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <img
                    src={oathModalJudge.oath.signatureDataUrl}
                    alt={`${oathModalJudge.name} 서명`}
                    className="h-16 object-contain"
                  />
                </div>
              ) : (
                <span className="italic text-xl font-bold text-amber-700">
                  {oathModalJudge.name} (전자날인)
                </span>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setOathModalJudge(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
