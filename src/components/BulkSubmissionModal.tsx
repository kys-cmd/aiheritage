import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { Submission } from '../types';
import {
  downloadSubmissionCsvTemplate,
  parseSubmissionCsv,
  readCsvFileContent,
  ParsedCsvRow,
  ParseCsvResult,
} from '../utils/csvHelpers';

interface BulkSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredCount: number) => void;
}

export const BulkSubmissionModal: React.FC<BulkSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { submissions, addBulkSubmissions } = useContest();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseCsvResult | null>(null);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('CSV 파일(.csv)만 업로드할 수 있습니다.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);
    setSuccessCount(null);

    try {
      const text = await readCsvFileContent(file);
      const result = parseSubmissionCsv(text, submissions.length);
      setParseResult(result);

      // By default select all valid rows
      const validIndices = new Set<number>();
      result.validRows.forEach((_, idx) => validIndices.add(idx));
      setSelectedRowIndices(validIndices);
    } catch (err: any) {
      setErrorMessage(`CSV 파일을 읽는 중 오류가 발생했습니다: ${err.message || '인코딩 또는 파일 형식을 확인해주세요.'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const toggleSelectAll = () => {
    if (!parseResult) return;
    if (selectedRowIndices.size === parseResult.validRows.length) {
      setSelectedRowIndices(new Set());
    } else {
      const all = new Set<number>();
      parseResult.validRows.forEach((_, idx) => all.add(idx));
      setSelectedRowIndices(all);
    }
  };

  const toggleSelectRow = (idx: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setSelectedRowIndices(new Set());
    setSuccessCount(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitBulk = async () => {
    if (!parseResult || selectedRowIndices.size === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const itemsToRegister: Array<Partial<Submission> & Pick<Submission, 'title' | 'category' | 'submitterName' | 'description' | 'aiTools' | 'driveLink' | 'previewImageUrl'>> = [];

      selectedRowIndices.forEach((idx) => {
        const item = parseResult.validRows[idx]?.data;
        if (item && item.title && item.submitterName && item.driveLink) {
          itemsToRegister.push(item as any);
        }
      });

      if (itemsToRegister.length === 0) {
        setErrorMessage('선택된 항목 중 등록 가능한 유효 데이터가 없습니다.');
        setIsSubmitting(false);
        return;
      }

      const count = await addBulkSubmissions(itemsToRegister);
      setSuccessCount(count);
      if (onSuccess) {
        onSuccess(count);
      }
    } catch (err: any) {
      setErrorMessage(`일괄 등록 중 오류가 발생했습니다: ${err.message || '다시 시도해 주십시오.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="h-5 w-5 text-amber-200" />
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>공모전 출품작 CSV 일괄 등록</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Bulk CSV Import
                </span>
              </h3>
              <p className="text-xs text-amber-100/80 mt-0.5">
                표준 CSV 양식 파일로 대량의 출품작 정보를 한 번에 등록하고 구글 드라이브와 연동합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Step 1: Template Download Callout Banner */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Download className="h-5 w-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950">표준 CSV 양식 다운로드 (엑셀 호환 UTF-8 BOM)</h4>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  한글 깨짐 없는 공식 양식 파일입니다. 다운로드 후 엑셀(Excel) 또는 스프레드시트에서 열어 작성하세요.<br className="hidden sm:inline" />
                  <span className="text-[11px] text-amber-800 font-medium">
                    (작품명, 출품자명, 부문, 구글 드라이브 원본 링크, AI 사용 도구, 프롬프트 등 15개 항목 지원)
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadSubmissionCsvTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>양식 다운로드 (.csv)</span>
            </button>
          </div>

          {/* Error Message Toast */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm">확인이 필요합니다</strong>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner when finished */}
          {successCount !== null ? (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-emerald-950">출품작 일괄 등록 완료</h4>
                <p className="text-xs text-emerald-800 font-medium">
                  총 <span className="font-black text-sm text-emerald-900">{successCount}건</span>의 출품작이 성공적으로 등록되었으며,
                  클라우드 데이터베이스 및 심사 채널이 개설되었습니다.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors"
                >
                  추가로 다른 파일 등록하기
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  확인 및 목록으로 돌아가기
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 2: File Upload Drag & Drop Zone */}
              {!parseResult && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/20 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shadow-xs">
                      {isParsing ? (
                        <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
                      ) : (
                        <Upload className="h-8 w-8 text-amber-700" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">
                        {isParsing ? 'CSV 파일 분석 중...' : '작성하신 CSV 파일을 이곳에 드래그하거나 클릭하여 선택하세요'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Microsoft Excel, 한글과컴퓨터, Google Sheets에서 내보낸 UTF-8 및 EUC-KR CSV 파일 모두 완벽 지원
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                        <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                        <span>파일 찾아보기 (.csv)</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Parse Result & Interactive Preview Table */}
              {parseResult && (
                <div className="space-y-4">
                  {/* File info bar & Summary chips */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {selectedFile?.name || '업로드된 파일'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''} · 행 분석 완료
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        다른 파일 선택
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-center">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">전체 감지 행</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {parseResult.totalRows}
                        <span className="text-xs font-normal text-slate-500 ml-1">건</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>정상 등록 가능</span>
                      </div>
                      <div className="text-xl font-black text-emerald-950 mt-0.5">
                        {parseResult.validRows.length}
                        <span className="text-xs font-normal text-emerald-700 ml-1">건</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                      <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        <span>오류 항목 (제외)</span>
                      </div>
                      <div className="text-xl font-black text-rose-950 mt-0.5">
                        {parseResult.errorRows.length}
                        <span className="text-xs font-normal text-rose-700 ml-1">건</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Rows Warning Box if any */}
                  {parseResult.errorRows.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-rose-900">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        <span>오류로 인해 등록에서 제외되는 {parseResult.errorRows.length}개 행이 있습니다:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-700 max-h-24 overflow-y-auto">
                        {parseResult.errorRows.map((errRow, idx) => (
                          <li key={idx}>
                            <strong>{errRow.rowNumber}행</strong> (작품명: {errRow.data.title || '누락'}, 출품자: {errRow.data.submitterName || '누락'}): {errRow.errors.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table for Valid Rows */}
                  {parseResult.validRows.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={
                                parseResult.validRows.length > 0 &&
                                selectedRowIndices.size === parseResult.validRows.length
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                            />
                            <span>전체 선택 ({selectedRowIndices.size}/{parseResult.validRows.length})</span>
                          </label>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          체크된 항목만 신규 출품작으로 등록됩니다.
                        </span>
                      </div>

                      <div className="overflow-x-auto max-h-[360px] divide-y divide-slate-100">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50/80 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">선택</th>
                              <th className="py-2.5 px-3">접수번호</th>
                              <th className="py-2.5 px-3">부문</th>
                              <th className="py-2.5 px-3">출품자</th>
                              <th className="py-2.5 px-3">작품명 / 소재 국가유산</th>
                              <th className="py-2.5 px-3">AI 도구</th>
                              <th className="py-2.5 px-3">구글 드라이브 링크</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {parseResult.validRows.map((row, idx) => {
                              const isChecked = selectedRowIndices.has(idx);
                              const sub = row.data;
                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-amber-50/40 transition-colors ${
                                    isChecked ? 'bg-white' : 'bg-slate-50/50 opacity-60'
                                  }`}
                                  onClick={() => toggleSelectRow(idx)}
                                >
                                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSelectRow(idx)}
                                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 font-bold">
                                    {sub.submissionNumber}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                        sub.category === 'VIDEO'
                                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}
                                    >
                                      {sub.category === 'VIDEO' ? (
                                        <Film className="h-3 w-3 text-orange-600" />
                                      ) : (
                                        <ImageIcon className="h-3 w-3 text-blue-600" />
                                      )}
                                      <span>{sub.category === 'VIDEO' ? '동영상' : '이미지'}</span>
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{sub.submitterName}</div>
                                    <div className="text-[10px] text-slate-500">
                                      {sub.participantCategory} · {sub.submitterAffiliation || '소속 미기재'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 max-w-xs truncate">
                                    <div className="font-bold text-slate-900 truncate">{sub.title}</div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                      {sub.nationalHeritageName}
                                      {sub.baekjeRelated === '사용함' && (
                                        <span className="ml-1 text-amber-700 font-semibold">(백제 관련)</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-[11px] text-slate-600">
                                    {Array.isArray(sub.aiTools) ? sub.aiTools.join(', ') : sub.aiTools}
                                  </td>
                                  <td className="py-3 px-3">
                                    <a
                                      href={sub.driveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-700 hover:text-indigo-900 hover:underline max-w-[150px] truncate"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      <span className="truncate">링크 확인</span>
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">등록 가능한 유효 행이 없습니다.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        양식 필수 컬럼(작품명, 출품자명, 구글드라이브 링크)이 누락되지 않았는지 확인 후 다시 시도해 주세요.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
            <span>등록된 출품작은 Supabase 클라우드 데이터베이스 및 중앙 서버에 실시간 자동 동기화됩니다.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
            >
              닫기
            </button>

            {parseResult && parseResult.validRows.length > 0 && successCount === null && (
              <button
                type="button"
                disabled={isSubmitting || selectedRowIndices.size === 0}
                onClick={handleSubmitBulk}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>일괄 등록 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>선택한 {selectedRowIndices.size}건 출품작 일괄 등록</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
