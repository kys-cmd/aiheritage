import React, { useState, useEffect } from 'react';
import { Submission } from '../types';
import { Film, Image as ImageIcon, Play } from 'lucide-react';
import { getArtworkThumbnailCandidates } from '../utils/driveHelpers';

interface ArtworkThumbnailProps {
  submission: Submission;
  className?: string;
  showPlayBadge?: boolean;
}

export const ArtworkThumbnail: React.FC<ArtworkThumbnailProps> = ({
  submission,
  className = 'h-full w-full object-cover',
  showPlayBadge = true,
}) => {
  const { urls, isDirectVideo, directVideoUrl } = getArtworkThumbnailCandidates(submission);
  const [urlIndex, setUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset state when submission changes
  useEffect(() => {
    setUrlIndex(0);
    setAllFailed(false);
    setLoaded(false);
  }, [submission.id, submission.driveLink, submission.previewImageUrl]);

  const handleImageError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  const isVideo = submission.category === 'VIDEO';

  // If all image thumbnail attempts failed, but we have a direct video URL, render video element at t=0.5
  if ((allFailed || urls.length === 0) && isDirectVideo && directVideoUrl) {
    return (
      <div className="relative h-full w-full bg-slate-950 overflow-hidden">
        <video
          src={`${directVideoUrl}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className={className}
        />
        {showPlayBadge && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-amber-600 transition-all">
              <Play className="h-4 w-4 fill-white ml-0.5" />
            </span>
          </div>
        )}
      </div>
    );
  }

  // If completely failed and no video fallback
  if (allFailed || urls.length === 0) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center select-none">
        {isVideo ? (
          <Film className="h-8 w-8 text-orange-400 mb-1 opacity-80" />
        ) : (
          <ImageIcon className="h-8 w-8 text-blue-400 mb-1 opacity-80" />
        )}
        <span className="text-[11px] font-bold text-slate-300 truncate max-w-full px-2">
          {submission.nationalHeritageName || submission.title}
        </span>
        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
          {isVideo ? '동영상 썸네일' : '이미지 썸네일'}
        </span>
      </div>
    );
  }

  const currentUrl = urls[urlIndex];

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden">
      <img
        key={currentUrl}
        src={currentUrl}
        alt={submission.title}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={handleImageError}
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />

      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          {isVideo ? (
            <Film className="h-6 w-6 text-slate-600" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-600" />
          )}
        </div>
      )}

      {/* Video First-Frame Play Indicator Badge */}
      {isVideo && showPlayBadge && loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-amber-600 transition-all">
            <Play className="h-4 w-4 fill-white ml-0.5" />
          </span>
        </div>
      )}
    </div>
  );
};
