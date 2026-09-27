import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Film,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Category } from '../types';
import { getDriveImageUrl, getDriveVideoPlayUrl, extractDriveFileId } from '../utils/driveHelpers';

interface DriveEmbedViewerProps {
  driveLink: string;
  previewImageUrl: string;
  category: Category;
  title: string;
  videoDuration?: string;
  videoUrl?: string;
}

export const DriveEmbedViewer: React.FC<DriveEmbedViewerProps> = ({
  driveLink,
  previewImageUrl,
  category,
  title,
  videoDuration,
  videoUrl,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const displayImageUrl = getDriveImageUrl(driveLink, previewImageUrl);
  const videoSource = getDriveVideoPlayUrl(driveLink, videoUrl);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // =========================================================================
  // 1. 이미지 부문: 작품 영역에 오직 이미지만 표출 (수식어 없이 "이미지 부문")
  // =========================================================================
  if (category === 'IMAGE') {
    return (
      <div className="space-y-3">
        {/* Clean Image Artwork Frame */}
        <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-200 overflow-hidden shadow-md flex items-center justify-center min-h-[380px] max-h-[720px]">
          {!imgError ? (
            <div
              className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
                isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? '클릭하여 원래 크기로 보기' : '클릭하여 확대해 보기'}
            >
              <img
                src={displayImageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fileId = extractDriveFileId(driveLink);
                  const lh3Url = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : '';
                  if (lh3Url && e.currentTarget.src !== lh3Url) {
                    e.currentTarget.src = lh3Url;
                    return;
                  }
                  if (displayImageUrl !== previewImageUrl && previewImageUrl) {
                    e.currentTarget.src = previewImageUrl;
                  } else {
                    setImgError(true);
                  }
                }}
                className="w-full max-h-[680px] object-contain select-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <ImageIcon className="h-16 w-16 mb-3 text-slate-500" />
              <p className="text-base font-bold text-slate-300">{title}</p>
              <p className="text-xs text-slate-400 mt-1">
                구글 드라이브 원본 파일 링크를 통해 열람하실 수 있습니다.
              </p>
            </div>
          )}

          {/* Category Badge: strictly '이미지 부문' with no extra words */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide bg-blue-600 text-white backdrop-blur-md border border-blue-400 shadow-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>이미지 부문</span>
            </span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-colors shadow-sm cursor-pointer"
            >
              {isZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
              <span>{isZoomed ? '축소' : '확대'}</span>
            </button>
          </div>
        </div>

        {/* Clean Caption & Drive Link */}
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs text-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
              IMG
            </span>
            <div>
              <p className="font-bold text-slate-900 text-sm">{title}</p>
              <p className="text-slate-500 text-xs">구글 드라이브 원본 이미지 연동</p>
            </div>
          </div>
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>구글 드라이브 원본 열람</span>
          </a>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. 동영상 부문: 구글 드라이브 동영상 실제 플레이 가능 (수식어 없이 "동영상 부문")
  // =========================================================================
  return (
    <div className="space-y-3">
      {/* Video Player Frame */}
      <div className="relative aspect-video w-full rounded-2xl bg-black border border-slate-200 overflow-hidden shadow-lg">
        {videoSource.type === 'drive_embed' ? (
          /* Google Drive Video Player iframe (Direct Playable) */
          <iframe
            src={videoSource.url}
            title={`${title} - 구글 드라이브 동영상`}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : videoSource.type === 'direct' ? (
          /* Direct HTML5 Video Player */
          <div className="relative w-full h-full">
            {!videoError ? (
              <video
                ref={videoRef}
                src={videoSource.url}
                poster={previewImageUrl}
                controls
                playsInline
                preload="metadata"
                onError={() => setVideoError(true)}
                className="w-full h-full object-contain bg-black"
              >
                브라우저가 HTML5 비디오 재생을 지원하지 않습니다.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-900 text-slate-300">
                <Film className="h-12 w-12 text-amber-500 mb-3" />
                <p className="font-bold text-base text-white">{title}</p>
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  구글 드라이브에서 열기
                </a>
              </div>
            )}
          </div>
        ) : videoSource.type === 'youtube' ? (
          <iframe
            src={videoSource.url}
            title={`${title} - 영상 플레이어`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* Fallback when drive link is not a direct file or is empty */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950">
            <Film className="h-12 w-12 text-orange-400 mb-3" />
            <p className="text-lg font-bold">{title}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              구글 드라이브 링크를 통해 영상을 재생하거나 원본을 확인하실 수 있습니다.
            </p>
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>구글 드라이브 동영상 열람</span>
            </a>
          </div>
        )}

        {/* Category Badge: strictly '동영상 부문' with NO other words */}
        <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide bg-orange-600 text-white backdrop-blur-md border border-orange-400 shadow-sm">
            <Film className="h-3.5 w-3.5" />
            <span>동영상 부문</span>
          </span>
        </div>
      </div>

      {/* Playback speed controls if direct video */}
      {videoSource.type === 'direct' && !videoError && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">재생 속도:</span>
            {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              }
            }}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>처음부터 다시보기</span>
          </button>
        </div>
      )}

      {/* Google Drive Link Box */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs text-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
            VID
          </span>
          <div>
            <p className="font-bold text-slate-900 text-sm">{title}</p>
            <p className="text-slate-500 text-xs">구글 드라이브 동영상 연동</p>
          </div>
        </div>
        <a
          href={driveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
          <span>구글 드라이브 원본 열람</span>
        </a>
      </div>
    </div>
  );
};
