import React, { useState } from 'react';
import { ExternalLink, Eye, AlertCircle, FileText, CheckCircle2, Film, Image as ImageIcon } from 'lucide-react';
import { Category } from '../types';

interface DriveEmbedViewerProps {
  driveLink: string;
  previewImageUrl: string;
  category: Category;
  title: string;
  videoDuration?: string;
}

export const DriveEmbedViewer: React.FC<DriveEmbedViewerProps> = ({
  driveLink,
  previewImageUrl,
  category,
  title,
  videoDuration,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'embed'>('preview');
  const [imgError, setImgError] = useState(false);

  // Extract Drive File ID if present
  const getDriveEmbedUrl = (url: string) => {
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const embedUrl = getDriveEmbedUrl(driveLink);

  return (
    <div className="space-y-3">
      {/* Media container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-md">
        {viewMode === 'embed' && embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${title} - 구글 드라이브 미리보기`}
            className="h-full w-full border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : (
          <div className="relative h-full w-full group">
            {!imgError ? (
              <img
                src={previewImageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-600 p-6 text-center">
                {category === 'VIDEO' ? <Film className="h-12 w-12 text-slate-400 mb-2" /> : <ImageIcon className="h-12 w-12 text-slate-400 mb-2" />}
                <p className="text-base font-medium text-slate-800">{title}</p>
                <p className="text-sm text-slate-500 mt-1">고화질 원본 파일은 구글 드라이브 링크로 제공됩니다</p>
              </div>
            )}

            {/* Subtle Gradient Scrim for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Media Overlay Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-black/75 backdrop-blur-md text-amber-300 border border-white/20">
                {category === 'VIDEO' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {category === 'VIDEO' ? `동영상 부문 ${videoDuration ? `(${videoDuration})` : ''}` : '이미지 부문'}
              </span>
            </div>

            {/* Bottom info banner */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-amber-300">공모전 출품작</p>
                <h4 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">{title}</h4>
              </div>

              <div className="flex items-center gap-2">
                {embedUrl && (
                  <button
                    onClick={() => setViewMode('embed')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm backdrop-blur-sm transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-600" />
                    화면으로 바로보기
                  </button>
                )}
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-md transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  드라이브 원본 열기
                </a>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'embed' && (
          <button
            onClick={() => setViewMode('preview')}
            className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 hover:bg-black text-xs text-white rounded-md border border-white/20 backdrop-blur-md transition-colors"
          >
            미리보기로 복귀
          </button>
        )}
      </div>

      {/* Google Drive Link & Permissions Notice Box */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs text-slate-700 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">구글 드라이브 출품작 저장소:</span>
              <span className="font-mono text-slate-600 truncate max-w-sm">{driveLink}</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              출품자가 [링크가 있는 모든 사용자]에게 권한을 부여한 고화질 원본 드라이브 링크입니다. 심사위원은 무손실 원본 파일 및 제작 프롬프트 문서를 직접 열람할 수 있습니다.
            </p>
          </div>
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg border border-amber-200 transition-colors"
          >
            <span>열람</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

