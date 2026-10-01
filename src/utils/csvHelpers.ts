import { Submission, Category, ParticipantCategory, BaekjeRelated, PostEditingUsage } from '../types';
import { getDriveImageUrl, getVideoThumbnailUrl, getDriveVideoPlayUrl } from './driveHelpers';

export interface ParsedCsvRow {
  rowNumber: number;
  data: Partial<Submission>;
  rawValues: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ParseCsvResult {
  totalRows: number;
  validRows: ParsedCsvRow[];
  errorRows: ParsedCsvRow[];
  headers: string[];
}

// Standard CSV Headers for Submissions
export const SUBMISSION_CSV_HEADERS = [
  '접수번호',
  '작품명',
  '부문(이미지/동영상)',
  '출품자명',
  '참가구분(일반인/학생)',
  '소속',
  '소재국가유산명',
  '공주백제관련(사용함/사용하지 않음)',
  '작품설명',
  '사용한AI도구',
  '후반편집여부(사용함/사용하지 않음)',
  '후반편집상세',
  '프롬프트전문',
  '구글드라이브작품링크',
  '생성과정캡쳐링크',
];

/**
 * Generates sample CSV template content with UTF-8 BOM
 */
export function generateSubmissionCsvTemplate(): string {
  const headers = SUBMISSION_CSV_HEADERS.join(',');
  const sampleRow1 = [
    'DH-IMG-001',
    '천년의 숨결 백제 금제관식',
    '이미지',
    '홍길동',
    '일반인',
    '한국디지털아트연구소',
    '무령왕릉 금제관식',
    '사용함',
    '"무령왕릉에서 출토된 왕의 금제관식을 현대적 시선으로 재해석하여 황금빛 광채와 백제 예술의 영롱함을 3D 렌더링 스타일로 형상화하였습니다."',
    '"Midjourney v6, Stable Diffusion XL"',
    '사용하지 않음',
    '""',
    '"masterpiece, ancient Baekje gold royal crown ornaments, intricate filigree, King Muryeong tomb heritage, ethereal golden aura, cinematic lighting, 8k resolution, photorealistic"',
    'https://drive.google.com/file/d/1SAMPLE_DRIVE_IMAGE_LINK_1/view?usp=sharing',
    'https://drive.google.com/file/d/1SAMPLE_PROCESS_CAPTURE_LINK_1/view?usp=sharing',
  ].join(',');

  const sampleRow2 = [
    'DH-VID-002',
    '공산성의 달밤과 미디어아트',
    '동영상',
    '김한국',
    '학생(초/중/고)',
    '공주예술고등학교',
    '공주 공산성',
    '사용함',
    '"공산성 성곽 위로 차오르는 보름달과 금강의 물결을 생성형 AI 비디오 기술로 재현하여 찬란한 백제의 옛 야경을 1분짜리 서정적 영상으로 연출했습니다."',
    '"Runway Gen-3, Midjourney v6, Suno AI"',
    '사용함',
    '"색감 보정 및 배경 사운드 믹싱"',
    '"cinematic aerial drone footage, Gongsanseong Fortress night view, Baekje kingdom ancient citadel, full moon over Geumgang river, hyper-detailed, fluid motion, 4k"',
    'https://drive.google.com/file/d/1SAMPLE_DRIVE_VIDEO_LINK_2/view?usp=sharing',
    'https://drive.google.com/file/d/1SAMPLE_PROCESS_CAPTURE_LINK_2/view?usp=sharing',
  ].join(',');

  // UTF-8 BOM (\uFEFF) ensures Excel opens Korean text without encoding errors
  return `\uFEFF${headers}\r\n${sampleRow1}\r\n${sampleRow2}\r\n`;
}

/**
 * Triggers download of the submission template CSV
 */
export function downloadSubmissionCsvTemplate(): void {
  const csvContent = generateSubmissionCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', '공모전_출품작_일괄등록_양식.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports existing submissions to CSV with UTF-8 BOM
 */
export function exportSubmissionsToCsv(submissions: Submission[]): void {
  const headers = SUBMISSION_CSV_HEADERS.join(',');
  const rows = submissions.map((sub) => {
    const aiToolsStr = Array.isArray(sub.aiTools) ? sub.aiTools.join(', ') : (sub.aiTools || '');
    return [
      escapeCsvValue(sub.submissionNumber),
      escapeCsvValue(sub.title),
      escapeCsvValue(sub.category === 'VIDEO' ? '동영상' : '이미지'),
      escapeCsvValue(sub.submitterName),
      escapeCsvValue(sub.participantCategory || '일반인'),
      escapeCsvValue(sub.submitterAffiliation || ''),
      escapeCsvValue(sub.nationalHeritageName || sub.heritageSubject || ''),
      escapeCsvValue(sub.baekjeRelated || '사용하지 않음'),
      escapeCsvValue(sub.description || ''),
      escapeCsvValue(aiToolsStr),
      escapeCsvValue(sub.postEditingUsage || '사용하지 않음'),
      escapeCsvValue(sub.postEditingDetails || ''),
      escapeCsvValue(sub.fullPrompt || ''),
      escapeCsvValue(sub.driveLink || ''),
      escapeCsvValue(sub.processCaptureDriveUrl || ''),
    ].join(',');
  });

  const csvContent = `\uFEFF${headers}\r\n${rows.join('\r\n')}\r\n`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('href', url);
  link.setAttribute('download', `공모전_출품작목록_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(val: string | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Robust RFC 4180 CSV line & cell splitter
 */
function parseCsvRows(text: string): string[][] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header string for fuzzy matching
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_\-()（）[\]\/\\,·.・]/g, '');
}

/**
 * Strict parser for BaekjeRelated field:
 * Explicitly checks negative forms first to avoid "사용하지 않음" matching "사용".
 */
export function parseBaekjeRelatedField(rawVal: string): BaekjeRelated {
  if (!rawVal) return '사용하지 않음';
  const clean = rawVal.trim().replace(/[\s_\-()（）[\]\/\\,·.・]/g, '').toLowerCase();

  // Negative checks FIRST (Must precede any affirmative check)
  if (
    clean === '사용하지않음' ||
    clean.includes('사용하지않음') ||
    clean.includes('사용안함') ||
    clean.includes('미사용') ||
    clean.includes('해당없음') ||
    clean.includes('관련없음') ||
    clean.includes('비해당') ||
    clean.includes('아니오') ||
    clean.includes('아니요') ||
    clean.includes('아님') ||
    clean === 'n' ||
    clean === 'no' ||
    clean === 'false' ||
    clean === '0' ||
    clean === 'x' ||
    clean === '-' ||
    clean === '없음' ||
    clean === '부'
  ) {
    return '사용하지 않음';
  }

  // Affirmative checks
  if (
    clean === '사용함' ||
    clean === '사용' ||
    clean === '예' ||
    clean === 'o' ||
    clean === 'y' ||
    clean === 'yes' ||
    clean === 'true' ||
    clean === '1' ||
    clean === '해당' ||
    clean.includes('사용함') ||
    clean.includes('해당함')
  ) {
    return '사용함';
  }

  return '사용하지 않음';
}

/**
 * Strict parser for PostEditingUsage field:
 * Explicitly checks negative forms first to avoid "사용하지 않음" matching "사용".
 */
export function parsePostEditingUsageField(rawVal: string, rawDetails: string = ''): PostEditingUsage {
  const clean = (rawVal || '').trim().replace(/[\s_\-()（）[\]\/\\,·.・]/g, '').toLowerCase();
  const cleanDetails = (rawDetails || '').trim().toLowerCase();

  // If details explicitly indicate no editing was done
  if (
    cleanDetails === '없음' ||
    cleanDetails === '없음.' ||
    cleanDetails.startsWith('없음') ||
    cleanDetails.includes('색 보정·리터칭·합성 없음') ||
    cleanDetails === '미사용' ||
    cleanDetails === '해당없음' ||
    cleanDetails === 'x' ||
    cleanDetails === '-' ||
    cleanDetails === 'none'
  ) {
    return '사용하지 않음';
  }

  // Negative checks FIRST (Must precede any affirmative check)
  if (
    clean === '사용하지않음' ||
    clean.includes('사용하지않음') ||
    clean.includes('사용안함') ||
    clean.includes('미사용') ||
    clean.includes('해당없음') ||
    clean.includes('비해당') ||
    clean.includes('아니오') ||
    clean.includes('아니요') ||
    clean.includes('아님') ||
    clean === 'n' ||
    clean === 'no' ||
    clean === 'false' ||
    clean === '0' ||
    clean === 'x' ||
    clean === '-' ||
    clean === '없음' ||
    clean === '부'
  ) {
    return '사용하지 않음';
  }

  // Affirmative checks
  if (
    clean === '사용함' ||
    clean === '사용' ||
    clean === '예' ||
    clean === 'o' ||
    clean === 'y' ||
    clean === 'yes' ||
    clean === 'true' ||
    clean === '1' ||
    clean === '해당' ||
    clean.includes('사용함') ||
    clean.includes('해당함')
  ) {
    return '사용함';
  }

  // If rawVal is empty or unspecified, infer from details
  if (!clean) {
    if (
      cleanDetails &&
      cleanDetails !== '없음' &&
      cleanDetails !== '미사용' &&
      cleanDetails !== '해당없음' &&
      cleanDetails !== '-' &&
      cleanDetails !== 'x'
    ) {
      return '사용함';
    }
    return '사용하지 않음';
  }

  return '사용하지 않음';
}

/**
 * Maps raw CSV row array to typed Partial<Submission>
 */
export function parseSubmissionCsv(csvText: string, existingCount: number = 0): ParseCsvResult {
  const allRows = parseCsvRows(csvText);
  if (allRows.length === 0) {
    return {
      totalRows: 0,
      validRows: [],
      errorRows: [],
      headers: [],
    };
  }

  const rawHeaders = allRows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const dataRows = allRows.slice(1);

  // Helper to find column index by multiple keyword aliases
  const getColIndex = (aliases: string[]): number => {
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      const idx = normalizedHeaders.findIndex((h) => h.includes(normAlias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxNumber = getColIndex(['접수번호', '등록번호', 'submissionnumber', 'id', '번호', 'no']);
  const idxTitle = getColIndex(['작품명', '제목', '작품제목', 'title', 'name']);
  const idxCategory = getColIndex(['부문', '카테고리', '분야', 'category', '구분']);
  const idxSubmitter = getColIndex(['출품자명', '출품자', '작가명', '성명', '이름', 'submittername', 'author']);
  const idxParticipantCat = getColIndex(['참가구분', '참가자구분', 'participantcategory']);
  const idxAffiliation = getColIndex(['소속', '소속기관', '학교', 'submitteraffiliation', 'affiliation']);
  const idxHeritage = getColIndex(['국가유산명', '소재국가유산명', '유산명', '소재', 'heritagesubject', 'nationalheritagename']);
  const idxBaekje = getColIndex([
    '공주백제관련',
    '공주백제',
    '공주웅진백제',
    '웅진백제',
    '백제관련',
    '백제',
    '공주',
    'baekjerelated',
    'baekje',
  ]);
  const idxDesc = getColIndex(['작품설명', '작품소개', '설명', 'description', 'desc']);
  const idxAiTools = getColIndex(['사용한ai도구', '사용ai도구', 'ai도구', '생성형ai', 'aitools']);
  const idxPostEdit = getColIndex([
    '후반편집여부',
    '후반편집사용',
    '후반편집',
    '후반작업',
    '후반보정',
    'posteditingusage',
    'postedit',
    'editing',
  ]);
  const idxPostEditDetails = getColIndex([
    '후반편집상세',
    '후반편집내용',
    '후반편집도구',
    '편집상세',
    '후반작업상세',
    'posteditingdetails',
    'posteditdetails',
  ]);
  const idxPrompt = getColIndex(['프롬프트전문', '프롬프트', 'fullprompt', 'prompt']);
  const idxDrive = getColIndex(['구글드라이브작품링크', '구글드라이브', '드라이브링크', '작품링크', 'drivelink', 'url', '링크']);
  const idxCapture = getColIndex(['생성과정캡쳐링크', '과정캡쳐링크', '캡쳐링크', 'processcapturedriveurl', 'capture']);

  const validRows: ParsedCsvRow[] = [];
  const errorRows: ParsedCsvRow[] = [];

  let sequenceCounter = existingCount + 1;

  dataRows.forEach((row, index) => {
    // If entire row is empty, skip
    if (row.every((cell) => !cell || cell.trim() === '')) {
      return;
    }

    const rowNumber = index + 2; // +1 for 0-index, +1 for header
    const rawValues: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
      rawValues[h] = row[i] || '';
    });

    const errors: string[] = [];

    const getVal = (colIdx: number): string => (colIdx >= 0 && colIdx < row.length ? row[colIdx].trim() : '');

    const title = getVal(idxTitle);
    if (!title) {
      errors.push('작품명(제목)이 입력되지 않았습니다.');
    }

    const submitterName = getVal(idxSubmitter);
    if (!submitterName) {
      errors.push('출품자명이 입력되지 않았습니다.');
    }

    const rawCategory = getVal(idxCategory).toLowerCase();
    let category: Category = 'IMAGE';
    if (rawCategory.includes('동영상') || rawCategory.includes('영상') || rawCategory.includes('video') || rawCategory.includes('vid')) {
      category = 'VIDEO';
    }

    const rawParticipantCat = getVal(idxParticipantCat);
    let participantCategory: ParticipantCategory = '일반인';
    if (
      rawParticipantCat.includes('학생') ||
      rawParticipantCat.includes('초등') ||
      rawParticipantCat.includes('중학') ||
      rawParticipantCat.includes('고등')
    ) {
      participantCategory = '학생(초/중/고)';
    }

    const rawBaekje = getVal(idxBaekje);
    const baekjeRelated: BaekjeRelated = parseBaekjeRelatedField(rawBaekje);

    const rawPostEdit = getVal(idxPostEdit);
    const rawPostEditDetails = getVal(idxPostEditDetails);
    const postEditingUsage: PostEditingUsage = parsePostEditingUsageField(rawPostEdit, rawPostEditDetails);

    const rawNumber = getVal(idxNumber);
    const prefix = category === 'IMAGE' ? 'DH-IMG' : 'DH-VID';
    const submissionNumber = rawNumber || `${prefix}-${String(sequenceCounter).padStart(3, '0')}`;
    if (!rawNumber) {
      sequenceCounter++;
    }

    const driveLink = getVal(idxDrive);
    if (!driveLink) {
      errors.push('구글 드라이브 작품 링크가 누락되었습니다.');
    }

    const rawAiTools = getVal(idxAiTools);
    const aiTools = rawAiTools
      ? rawAiTools.split(/[,/|]/).map((t) => t.trim()).filter(Boolean)
      : ['Midjourney v6'];

    // Generate drive thumbnails & direct video URLs
    const previewImageUrl = category === 'VIDEO'
      ? getVideoThumbnailUrl(driveLink)
      : getDriveImageUrl(driveLink);

    const videoPlayInfo = getDriveVideoPlayUrl(driveLink);

    const item: Partial<Submission> = {
      submissionNumber,
      title,
      category,
      submitterName,
      participantCategory,
      submitterAffiliation: getVal(idxAffiliation),
      nationalHeritageName: getVal(idxHeritage) || '한국 전통 문화유산',
      heritageSubject: getVal(idxHeritage) || '한국 전통 문화유산',
      baekjeRelated,
      description: getVal(idxDesc) || '작품 설명이 등록되지 않았습니다.',
      aiTools,
      postEditingUsage,
      postEditingDetails: getVal(idxPostEditDetails),
      fullPrompt: getVal(idxPrompt) || '프롬프트 정보 없음',
      driveLink: driveLink || 'https://drive.google.com',
      processCaptureDriveUrl: getVal(idxCapture) || driveLink || 'https://drive.google.com',
      previewImageUrl,
      videoUrl: category === 'VIDEO' ? videoPlayInfo.url : undefined,
    };

    const parsedRow: ParsedCsvRow = {
      rowNumber,
      data: item,
      rawValues,
      isValid: errors.length === 0,
      errors,
    };

    if (errors.length === 0) {
      validRows.push(parsedRow);
    } else {
      errorRows.push(parsedRow);
    }
  });

  return {
    totalRows: validRows.length + errorRows.length,
    validRows,
    errorRows,
    headers: rawHeaders,
  };
}

/**
 * Reads a File object with automatic UTF-8 / EUC-KR encoding detection
 */
export async function readCsvFileContent(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Try decoding as UTF-8 first
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(arrayBuffer);
  } catch {
    // If UTF-8 fails (e.g. EUC-KR / CP949 encoded file saved from Korean Excel)
    try {
      const euckrDecoder = new TextDecoder('euc-kr');
      return euckrDecoder.decode(arrayBuffer);
    } catch {
      // Fallback to standard utf-8 without fatal
      const fallbackDecoder = new TextDecoder('utf-8');
      return fallbackDecoder.decode(arrayBuffer);
    }
  }
}
