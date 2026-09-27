import React, { useState } from 'react';
import { useContest } from '../context/ContestContext';
import { Category, Judge, Submission } from '../types';
import { getDriveImageUrl, getDriveVideoPlayUrl, extractDriveFileId } from '../utils/driveHelpers';
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
  BarChart3,
  TrendingUp,
  Database,
  Copy,
  Play,
  CheckCircle2,
  RotateCcw,
  Video,
  Eye,
  Sparkles,
  Check,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
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
    isCloudConnected,
  } = useContest();

  if (currentUser?.role !== 'ADMIN') {
    return null;
  }

  const [activeAdminTab, setActiveAdminTab] = useState<'submissions' | 'judges' | 'scores' | 'distribution' | 'oath' | 'cloud'>('submissions');
  const [copiedSql, setCopiedSql] = useState(false);

  // New Submission Form State
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [subForm, setSubForm] = useState({
    title: '',
    category: 'IMAGE' as Category,
    submitterName: '',
    submitterAffiliation: '',
    heritageSubject: '',
    participantCategory: '일반인' as '일반인' | '학생(초/중/고)',
    baekjeRelated: '사용하지 않음' as '사용함' | '사용하지 않음',
    postEditingUsage: '사용하지 않음' as '사용함' | '사용하지 않음',
    description: '',
    aiTools: 'Midjourney v6, Stable Diffusion',
    fullPrompt: '',
    driveLink: '',
    processCaptureDriveUrl: '',
  });

  // Judge Form & Oath State
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
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

  const [customOath, setCustomOath] = useState(oathText);
  const [uploadedNoticeName, setUploadedNoticeName] = useState(oathUploadNotice || '');
  const [oathModalJudge, setOathModalJudge] = useState<Judge | null>(null);

  // Start editing existing submission
  const startEditSubmission = (sub: Submission) => {
    setEditingSub(sub);
    setSubForm({
      title: sub.title,
      category: sub.category,
      submitterName: sub.submitterName,
      submitterAffiliation: sub.submitterAffiliation || '',
      heritageSubject: sub.nationalHeritageName || sub.heritageSubject || '',
      participantCategory: sub.participantCategory || '일반인',
      baekjeRelated: sub.baekjeRelated || '사용하지 않음',
      postEditingUsage: sub.postEditingUsage || '사용하지 않음',
      description: sub.description || '',
      aiTools: Array.isArray(sub.aiTools) ? sub.aiTools.join(', ') : (sub.aiTools || ''),
      fullPrompt: sub.fullPrompt || '',
      driveLink: sub.driveLink || '',
      processCaptureDriveUrl: sub.processCaptureDriveUrl || '',
    });
    setIsAddingSub(true);
  };

  // Reset form
  const resetSubForm = () => {
    setSubForm({
      title: '',
      category: 'IMAGE',
      submitterName: '',
      submitterAffiliation: '',
      heritageSubject: '',
      participantCategory: '일반인',
      baekjeRelated: '사용하지 않음',
      postEditingUsage: '사용하지 않음',
      description: '',
      aiTools: 'Midjourney v6, Stable Diffusion',
      fullPrompt: '',
      driveLink: '',
      processCaptureDriveUrl: '',
    });
    setEditingSub(null);
    setIsAddingSub(false);
  };

  // Handle Submission Creation or Update
  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();

    const driveImg = getDriveImageUrl(subForm.driveLink);
    const driveVid = getDriveVideoPlayUrl(subForm.driveLink);

    if (editingSub) {
      updateSubmission(editingSub.id, {
        title: subForm.title,
        category: subForm.category,
        submitterName: subForm.submitterName,
        submitterAffiliation: subForm.submitterAffiliation,
        nationalHeritageName: subForm.heritageSubject,
        heritageSubject: subForm.heritageSubject,
        participantCategory: subForm.participantCategory,
        baekjeRelated: subForm.baekjeRelated,
        postEditingUsage: subForm.postEditingUsage,
        description: subForm.description,
        aiTools: subForm.aiTools.split(',').map((t) => t.trim()),
        fullPrompt: subForm.fullPrompt,
        driveLink: subForm.driveLink,
        processCaptureDriveUrl: subForm.processCaptureDriveUrl.trim() || subForm.driveLink,
        previewImageUrl: driveImg,
        videoUrl: subForm.category === 'VIDEO' ? driveVid.url : undefined,
      });
    } else {
      addSubmission({
        title: subForm.title,
        category: subForm.category,
        submitterName: subForm.submitterName,
        submitterAffiliation: subForm.submitterAffiliation,
        nationalHeritageName: subForm.heritageSubject,
        heritageSubject: subForm.heritageSubject,
        participantCategory: subForm.participantCategory,
        baekjeRelated: subForm.baekjeRelated,
        postEditingUsage: subForm.postEditingUsage,
        description: subForm.description,
        aiTools: subForm.aiTools.split(',').map((t) => t.trim()),
        fullPrompt: subForm.fullPrompt,
        driveLink: subForm.driveLink,
        processCaptureDriveUrl: subForm.processCaptureDriveUrl.trim() || subForm.driveLink,
        previewImageUrl: driveImg,
        videoUrl: subForm.category === 'VIDEO' ? driveVid.url : undefined,
        submissionNumber: '',
      });
    }

    resetSubForm();
  };

  // Handle Judge Creation or Update
  const handleSaveJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJudge) {
      updateJudge(editingJudge.id, {
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
      setEditingJudge(null);
    } else {
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
    }

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

  const startEditJudge = (j: Judge) => {
    setEditingJudge(j);
    setIsAddingJudge(false);
    setJudgeForm({
      loginId: j.loginId,
      password: j.password || 'password123',
      name: j.name,
      affiliation: j.affiliation || '',
      title: j.title || '',
      specialty: j.specialty || '',
      email: j.email || '',
      phone: j.phone || '',
      assignedCategory: j.assignedCategory || 'ALL',
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
        s.category === 'IMAGE' ? '이미지 부문' : '동영상 부문',
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            AI 헤리티지 공모전 관리자 페이지
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
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
          <span>공모전 등록 작품 ({submissions.length})</span>
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
          <span>심사위원 관리 ({judges.length})</span>
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
          <span>심사 현황</span>
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
          <span>심사 점수 분석</span>
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

        <button
          onClick={() => setActiveAdminTab('cloud')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeAdminTab === 'cloud'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Supabase DB & 배포 설정</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS MANAGEMENT */}
      {activeAdminTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">공모전 작품 등록 및 수정</h2>
            </div>
            <button
              onClick={() => setIsAddingSub(!isAddingSub)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>등록</span>
            </button>
          </div>

          {/* Add/Edit Submission Form Modal/Card */}
          {isAddingSub && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6 space-y-6 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs">
                    {editingSub ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-amber-950">
                      {editingSub ? '공모전 출품작 정보 수정' : '신규 공모전 접수 작품 등록'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetSubForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/80 transition-colors"
                >
                  닫기
                </button>
              </div>

              {/* Instructions banner */}
              <div className="rounded-xl bg-white border border-amber-300 p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 text-sm font-bold">구글 드라이브 공유 링크 등록 안내:</strong>
                  <p className="text-xs text-slate-600 mt-1">
                    모든 작품 파일은 구글 드라이브 공유 링크를 등록합니다. (공유 권한: 링크가 있는 모든 사용자 - 뷰어)<br />
                    · <strong>이미지 부문:</strong> 작품 영역에 이미지만 깔끔하게 표출됩니다.<br />
                    · <strong>동영상 부문:</strong> 작품 영역에서 동영상이 실제 플레이(재생) 가능하도록 구동됩니다.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmission} className="space-y-6">
                {/* 1. 기본 출품 정보 */}
                <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-600" />
                    <span>기본 출품 메타데이터</span>
                  </h4>

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
                        출품 부문 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={subForm.category}
                        onChange={(e) => setSubForm({ ...subForm, category: e.target.value as Category })}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-bold"
                      >
                        <option value="IMAGE">이미지 부문</option>
                        <option value="VIDEO">동영상 부문</option>
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
                        참가 구분 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={subForm.participantCategory}
                        onChange={(e) => setSubForm({ ...subForm, participantCategory: e.target.value as any })}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="일반인">일반인</option>
                        <option value="학생(초/중/고)">학생(초/중/고)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        소속 (학교명 / 직장명 / 단체명)
                      </label>
                      <input
                        type="text"
                        value={subForm.submitterAffiliation}
                        onChange={(e) => setSubForm({ ...subForm, submitterAffiliation: e.target.value })}
                        placeholder="예: 한국디지털미디어고 / 개인 참가"
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        소재로 활용된 국가유산명 <span className="text-rose-500">*</span>
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        공주·웅진백제 관련 문화유산 연계 여부
                      </label>
                      <select
                        value={subForm.baekjeRelated}
                        onChange={(e) => setSubForm({ ...subForm, baekjeRelated: e.target.value as any })}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="사용하지 않음">사용하지 않음</option>
                        <option value="사용함">사용함</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        후반 편집툴(Photoshop, Premiere 등) 사용 여부
                      </label>
                      <select
                        value={subForm.postEditingUsage}
                        onChange={(e) => setSubForm({ ...subForm, postEditingUsage: e.target.value as any })}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="사용하지 않음">사용하지 않음</option>
                        <option value="사용함">사용함</option>
                      </select>
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
                      <p className="text-xs text-slate-500 mt-1">
                        작품 파일(이미지 또는 동영상)이 보관된 구글 드라이브 공유 링크를 붙여넣으세요.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        생성 과정 화면 캡쳐 이미지/드라이브 링크
                      </label>
                      <input
                        type="url"
                        value={subForm.processCaptureDriveUrl}
                        onChange={(e) => setSubForm({ ...subForm, processCaptureDriveUrl: e.target.value })}
                        placeholder="https://drive.google.com/... 또는 생성 과정 화면 캡쳐 이미지 URL"
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        AI 프롬프트 생성 과정, 파라미터 세팅, 화면 캡쳐본이 보관된 링크를 입력하세요. (심사위원 평가 화면의 '생성 과정 화면 캡쳐' 버튼에 자동 연결됩니다)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. 구글 드라이브 미디어 실시간 미리보기 (작품 영역 사전 검증) */}
                <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-amber-600" />
                      <span>작품 영역 실시간 화면 확인</span>
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs ${
                        subForm.category === 'VIDEO' ? 'bg-orange-600' : 'bg-blue-600'
                      }`}
                    >
                      {subForm.category === 'VIDEO' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      <span>{subForm.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
                    </span>
                  </div>

                  {subForm.category === 'IMAGE' ? (
                    /* IMAGE PREVIEW: ONLY IMAGE DISPLAYED */
                    <div className="relative aspect-video w-full rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                      {subForm.driveLink ? (
                        <img
                          src={getDriveImageUrl(subForm.driveLink)}
                          alt="구글 드라이브 이미지 미리보기"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fileId = extractDriveFileId(subForm.driveLink);
                            const lh3Url = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : '';
                            if (lh3Url && e.currentTarget.src !== lh3Url) {
                              e.currentTarget.src = lh3Url;
                            }
                          }}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-400">
                          <ImageIcon className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs">상단에 구글 드라이브 이미지 공유 링크를 입력하시면 여기에 이미지만 표출됩니다.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* VIDEO PREVIEW: ACTUALLY PLAYABLE GOOGLE DRIVE VIDEO */
                    <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-slate-800">
                      {subForm.driveLink && getDriveVideoPlayUrl(subForm.driveLink).url ? (
                        <iframe
                          src={getDriveVideoPlayUrl(subForm.driveLink).url}
                          title="구글 드라이브 동영상 플레이어"
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-400">
                          <Film className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs">상단에 구글 드라이브 동영상 공유 링크를 입력하시면 여기에 실제 플레이어가 로드됩니다.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. AI 도구 및 프롬프트 상세 */}
                <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-600" />
                    <span>생성형 AI 기술 정보 및 프롬프트 명세</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        작품 기획 의도 및 배경 설명
                      </label>
                      <input
                        type="text"
                        value={subForm.description}
                        onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                        placeholder="출품작의 기획 배경 및 문화유산 디지털 재해석 의도를 입력하세요."
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        사용 프롬프트 전문 (Prompt Engineering 명세)
                      </label>
                      <textarea
                        rows={3}
                        value={subForm.fullPrompt}
                        onChange={(e) => setSubForm({ ...subForm, fullPrompt: e.target.value })}
                        placeholder="출품작 생성에 사용된 프롬프트 전문, 파라미터(CFG scale, Steps, Seed 등), 파이프라인 제어 정보를 입력하세요."
                        className="w-full rounded-xl bg-white border border-slate-300 p-3 text-sm text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={resetSubForm}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingSub ? '수정 내용 저장' : '접수작 등록 및 채널 생성'}</span>
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
                  <th className="py-3.5 px-4 font-bold">부문</th>
                  <th className="py-3.5 px-4 font-bold">작품명 / 대상문화유산</th>
                  <th className="py-3.5 px-4 font-bold">출품자</th>
                  <th className="py-3.5 px-4 font-bold">구글 드라이브</th>
                  <th className="py-3.5 px-4 text-center font-bold">심사 현황</th>
                  <th className="py-3.5 px-4 text-right font-bold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">등록된 출품작이 없습니다.</p>
                      <p className="text-xs text-slate-400 mt-1">상단의 '등록' 버튼을 눌러 새 출품작을 추가해 주세요.</p>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => {
                    const stats = getSubmissionStats(sub.id);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{sub.submissionNumber}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-black text-xs px-2.5 py-0.5 rounded-md border ${
                              sub.category === 'VIDEO'
                                ? 'bg-orange-50 text-orange-700 border-orange-300'
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                            }`}
                          >
                            {sub.category === 'VIDEO' ? (
                              <Film className="h-3.5 w-3.5 text-orange-600" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span>{sub.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.title}</div>
                          <div className="text-xs text-slate-500">{sub.nationalHeritageName || sub.heritageSubject}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <div>{sub.submitterName}</div>
                          {sub.participantCategory && (
                            <span className="text-[10px] text-slate-400">({sub.participantCategory})</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <a
                            href={sub.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-amber-800 font-mono text-xs font-semibold"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            <span>드라이브 원본 열람</span>
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
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditSubmission(sub)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                              title="출품작 정보 및 구글 드라이브 링크 수정"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
              <h2 className="text-lg font-bold text-slate-900">심사위원 등록 및 관리</h2>
            </div>
            <button
              onClick={() => setIsAddingJudge(!isAddingJudge)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>심사위원 등록</span>
            </button>
          </div>

          {/* Add or Edit Judge Form */}
          {(isAddingJudge || editingJudge) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="text-base font-bold text-amber-900">
                  {editingJudge ? `'${editingJudge.name}' 심사위원 정보 및 계정 수정` : '신규 심사위원 정보 등록 (계정 생성)'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingJudge(false);
                    setEditingJudge(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handleSaveJudge} className="space-y-4">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      직위 / 직책
                    </label>
                    <input
                      type="text"
                      value={judgeForm.title}
                      onChange={(e) => setJudgeForm({ ...judgeForm, title: e.target.value })}
                      placeholder="예: 교수 / 책임연구원"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      전문 분야
                    </label>
                    <input
                      type="text"
                      value={judgeForm.specialty}
                      onChange={(e) => setJudgeForm({ ...judgeForm, specialty: e.target.value })}
                      placeholder="예: AI 미디어아트, 3D 문화유산"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={judgeForm.email}
                      onChange={(e) => setJudgeForm({ ...judgeForm, email: e.target.value })}
                      placeholder="judge@heritage.kr"
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      배정 심사 부문
                    </label>
                    <select
                      value={judgeForm.assignedCategory}
                      onChange={(e) => setJudgeForm({ ...judgeForm, assignedCategory: e.target.value as any })}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="ALL">전체</option>
                      <option value="IMAGE">이미지 부문</option>
                      <option value="VIDEO">동영상 부문</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingJudge(false);
                      setEditingJudge(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {editingJudge ? '심사위원 정보/계정 수정 저장' : '심사위원 계정 발급'}
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
                {judges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">등록된 심사위원이 없습니다.</p>
                      <p className="text-xs text-slate-400 mt-1">우측 상단의 '신규 심사위원 위촉/추가' 버튼을 눌러 심사위원을 등록해 주세요.</p>
                    </td>
                  </tr>
                ) : (
                  judges.map((j) => {
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEditJudge(j)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="정보 및 아이디/비밀번호 수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`'${j.name} 심사위원'을 삭제하시겠습니까?`)) {
                                deleteJudge(j.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                  TOP 10 집계
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (1위~6위 본선 시상 / 7위~10위 예비)
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">심사 현황 (상위 10개 작품)</h2>
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
                  <th className="py-3.5 px-4 font-bold">순위 / 구분</th>
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
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7 + judges.length} className="py-12 text-center text-slate-500">
                      <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">집계할 출품작 데이터가 없습니다.</p>
                      <p className="text-xs text-slate-400 mt-1">작품을 등록하고 심사를 진행하면 실시간 점수 매트릭스가 표기됩니다.</p>
                    </td>
                  </tr>
                ) : (
                  submissions
                    .slice()
                    .sort((a, b) => {
                      const statsA = getSubmissionStats(a.id);
                      const statsB = getSubmissionStats(b.id);
                      return statsB.averageScore - statsA.averageScore;
                    })
                    .slice(0, 10)
                    .map((sub, rankIndex) => {
                    const stats = getSubmissionStats(sub.id);
                    const awardRecommends = stats.evaluations.filter((e) => e.recommendForAward).length;

                    // Award title based on overall rank across all categories
                    // 1위: 백제상(대상) 1명
                    // 2위: 웅진상(금상) 1명
                    // 3위, 4위: 무령상(은상) 2명
                    // 5위, 6위: 고마상(동상)
                    // 7위~10위: 예비 (공모전 7위~10위 예비 후보)
                    let awardBadge = null;
                    if (rankIndex === 0) {
                      awardBadge = {
                        title: '백제상 (대상)',
                        badgeClass: 'bg-amber-100 text-amber-950 border-amber-400 font-black',
                      };
                    } else if (rankIndex === 1) {
                      awardBadge = {
                        title: '웅진상 (금상)',
                        badgeClass: 'bg-yellow-100 text-yellow-950 border-yellow-400 font-black',
                      };
                    } else if (rankIndex === 2 || rankIndex === 3) {
                      awardBadge = {
                        title: '무령상 (은상)',
                        badgeClass: 'bg-slate-100 text-slate-900 border-slate-300 font-bold',
                      };
                    } else if (rankIndex === 4 || rankIndex === 5) {
                      awardBadge = {
                        title: '고마상 (동상)',
                        badgeClass: 'bg-orange-50 text-orange-950 border-orange-300 font-bold',
                      };
                    } else if (rankIndex >= 6 && rankIndex <= 9) {
                      // 7위 (인덱스 6) ~ 10위 (인덱스 9)
                      const reserveNumber = rankIndex - 5; // 예비 1순위 ~ 예비 4순위
                      awardBadge = {
                        title: `예비 (${reserveNumber}순위)`,
                        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold',
                      };
                    }

                    const isReserve = rankIndex >= 6 && rankIndex <= 9;

                    return (
                      <tr
                        key={sub.id}
                        className={`transition-colors ${
                          isReserve ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold">
                            <span className={isReserve ? 'text-rose-600' : 'text-amber-700'}>
                              {rankIndex === 0 ? '🏆 1위' : `${rankIndex + 1}위`}
                            </span>
                            {isReserve && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200">
                                예비
                              </span>
                            )}
                          </div>
                          {awardBadge && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] border ${awardBadge.badgeClass}`}>
                              {awardBadge.title}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.title}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <span className="font-mono text-slate-500 font-semibold">{sub.submissionNumber}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black border ${
                                sub.category === 'VIDEO'
                                  ? 'bg-orange-50 text-orange-700 border-orange-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                              }`}
                            >
                              {sub.category === 'VIDEO' ? (
                                <Film className="h-3 w-3 text-orange-600" />
                              ) : (
                                <ImageIcon className="h-3 w-3 text-blue-600" />
                              )}
                              <span>{sub.category === 'VIDEO' ? '동영상 부문' : '이미지 부문'}</span>
                            </span>
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
                  })
                )}
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

      {/* TAB 6: SUPABASE CLOUD DB & NETLIFY DEPLOYMENT */}
      {activeAdminTab === 'cloud' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1">
                  <Database className="h-3 w-3 text-emerald-700" />
                  <span>Supabase & Netlify Production</span>
                </span>
                <span className={`text-xs font-extrabold ${isCloudConnected ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isCloudConnected ? '● 클라우드 실시간 동기화 활성화' : '○ 로컬 브라우저 모드 (미연결 시 로컬 스토리지 자동 작동)'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Supabase 클라우드 데이터베이스 및 Netlify 배포 연동</h2>
              <p className="text-xs text-slate-500">
                실제 운영을 위해 Supabase 프로젝트의 SQL 스크립트를 원클릭 복사하고 Netlify 환경변수를 설정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>현재 연결 상태 및 아키텍처</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="text-xs text-slate-500 font-bold">프론트엔드 호스팅</div>
                <div className="text-base font-black text-slate-900">Netlify</div>
                <p className="text-[11px] text-slate-600">
                  <code className="text-xs bg-slate-200 px-1 py-0.5 rounded">netlify.toml</code> 설정 완료 (SPA 라우팅 및 캐시 최적화)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="text-xs text-slate-500 font-bold">백엔드 및 데이터베이스</div>
                <div className="text-base font-black text-emerald-700">Supabase (PostgreSQL)</div>
                <p className="text-[11px] text-slate-600">
                  심사위원, 출품작, 채점표, 서약서 실시간 동기화(Realtime WebSocket)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="text-xs text-slate-500 font-bold">소스 코드 버전 관리</div>
                <div className="text-base font-black text-slate-900">GitHub</div>
                <p className="text-[11px] text-slate-600">
                  main 브랜치 푸시 시 Netlify 자동 빌드 및 배포 트리거
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Supabase Setup Guide */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">Step 1</span>
                <h3 className="text-base font-bold text-emerald-950">Supabase DB 스키마 생성 (SQL Editor 실행)</h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold hover:text-emerald-950">Supabase 대시보드</a>의 <strong>SQL Editor</strong>에 아래 스크립트를 붙여넣고 <strong>Run</strong>을 누르면 테이블 및 보안 규칙(RLS)이 자동 생성됩니다.
                </p>
              </div>
              <button
                onClick={() => {
                  const sqlContent = `-- 2026 AI 디지털헤리티지 공모전 심사 시스템 (AI Digital Heritage Contest)
CREATE TABLE IF NOT EXISTS public.judges (
  id TEXT PRIMARY KEY,
  login_id TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  affiliation TEXT,
  title TEXT,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  oath_signed BOOLEAN DEFAULT false,
  assigned_category TEXT DEFAULT 'ALL' CHECK (assigned_category IN ('ALL', 'IMAGE', 'VIDEO')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.judge_oaths (
  judge_id TEXT PRIMARY KEY REFERENCES public.judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  signature_data_url TEXT,
  is_agreed BOOLEAN DEFAULT true NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  submission_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('IMAGE', 'VIDEO')),
  submitter_name TEXT NOT NULL,
  participant_category TEXT DEFAULT '일반인' CHECK (participant_category IN ('일반인', '학생(초/중/고)')),
  submitter_affiliation TEXT,
  national_heritage_name TEXT NOT NULL,
  baekje_related TEXT DEFAULT '사용하지 않음' CHECK (baekje_related IN ('사용함', '사용하지 않음')),
  description TEXT,
  ai_tools JSONB DEFAULT '[]'::jsonb,
  post_editing_usage TEXT DEFAULT '사용하지 않음' CHECK (post_editing_usage IN ('사용함', '사용하지 않음')),
  post_editing_details TEXT,
  prompt_summary TEXT,
  full_prompt TEXT,
  process_capture_drive_url TEXT,
  drive_link TEXT NOT NULL,
  preview_image_url TEXT,
  video_duration TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_score NUMERIC(5,2) DEFAULT 0 NOT NULL,
  average_score NUMERIC(4,2) DEFAULT 0 NOT NULL,
  comment TEXT DEFAULT '',
  recommend_for_award BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_judge_submission UNIQUE (submission_id, judge_id)
);

CREATE TABLE IF NOT EXISTS public.channel_messages (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('JUDGE', 'ADMIN')),
  message TEXT NOT NULL,
  tag TEXT DEFAULT 'NOTE' CHECK (tag IN ('NOTE', 'QUESTION', 'HIGHLIGHT')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_oaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update submissions" ON public.submissions FOR ALL USING (true);

CREATE POLICY "Allow public read for evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update evaluations" ON public.evaluations FOR ALL USING (true);

CREATE POLICY "Allow public read for channel_messages" ON public.channel_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert channel_messages" ON public.channel_messages FOR ALL USING (true);

CREATE POLICY "Allow public read for judges" ON public.judges FOR SELECT USING (true);
CREATE POLICY "Allow public update judges" ON public.judges FOR ALL USING (true);

CREATE POLICY "Allow public read for judge_oaths" ON public.judge_oaths FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update judge_oaths" ON public.judge_oaths FOR ALL USING (true);`;
                  navigator.clipboard.writeText(sqlContent);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Copy className="h-4 w-4" />
                <span>{copiedSql ? '✓ SQL 복사 완료' : '전체 SQL 스크립트 복사'}</span>
              </button>
            </div>

            <div className="rounded-xl bg-slate-900 text-emerald-300 p-4 font-mono text-xs overflow-x-auto max-h-48 border border-emerald-950">
              <pre>{`-- 생성 대상 테이블:
-- 1. public.judges (심사위원 정보)
-- 2. public.judge_oaths (심사위원 전자서약서)
-- 3. public.submissions (출품작 및 구글드라이브 링크)
-- 4. public.evaluations (5점 척도 평가표 및 총점/평점)
-- 5. public.channel_messages (출품작별 심사 채널 기록)
-- + Supabase Realtime WebSocket 구독 연동 완료`}</pre>
            </div>
          </div>

          {/* Step 2: Netlify Environment Setup Guide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <span className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">Step 2</span>
            <h3 className="text-base font-bold text-slate-900">Netlify 환경변수 (Environment Variables) 등록</h3>
            <p className="text-xs text-slate-600">
              Netlify 대시보드 &gt; <strong>Site configuration</strong> &gt; <strong>Environment variables</strong> 에 아래 2가지 키를 등록합니다.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900">VITE_SUPABASE_URL</span>
                  <div className="text-[11px] text-slate-500">Supabase 프로젝트 URL (예: https://xyzcompany.supabase.co)</div>
                </div>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                  Settings &gt; API &gt; Project URL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900">VITE_SUPABASE_ANON_KEY</span>
                  <div className="text-[11px] text-slate-500">공개 anon public API 키</div>
                </div>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                  Settings &gt; API &gt; Project API keys (anon public)
                </span>
              </div>
            </div>
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
