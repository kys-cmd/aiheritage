/**
 * Google Drive URL parser and media resolver
 */

export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Match /file/d/FILE_ID
  const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  // Match id=FILE_ID or &id=FILE_ID
  const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  // Match /d/FILE_ID
  const match3 = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match3 && match3[1]) return match3[1];

  // Match /folders/FILE_ID
  const match4 = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match4 && match4[1]) return match4[1];

  return null;
}

/**
 * Returns direct image URL for Google Drive files
 */
export function getDriveImageUrl(driveLinkOrUrl: string, fallbackUrl?: string): string {
  const target = (driveLinkOrUrl || '').trim();
  const fileId = extractDriveFileId(target);
  if (fileId) {
    // Google high-resolution direct thumbnail endpoint (sz=w1920)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
  }
  // Check YouTube
  const ytMatch = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return fallbackUrl || target;
}

/**
 * Returns video thumbnail URL (first frame capture from Google Drive or YouTube)
 */
export function getVideoThumbnailUrl(driveLinkOrUrl: string, fallbackUrl?: string): string {
  const target = (driveLinkOrUrl || '').trim();
  const fileId = extractDriveFileId(target);
  if (fileId) {
    // Google Drive video thumbnail endpoint (generates first keyframe of video)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  // Check YouTube
  const ytMatch = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return fallbackUrl || target;
}

/**
 * Returns list of thumbnail candidate URLs for robust cascading fallback
 */
export function getArtworkThumbnailCandidates(submission: {
  category: 'IMAGE' | 'VIDEO';
  driveLink: string;
  previewImageUrl?: string;
  videoUrl?: string;
}): {
  urls: string[];
  isDirectVideo: boolean;
  directVideoUrl?: string;
} {
  const link = (submission.driveLink || '').trim();
  const fileId = extractDriveFileId(link);
  const preview = (submission.previewImageUrl || '').trim();
  const video = (submission.videoUrl || '').trim();

  // Check direct HTML5 video stream
  const isDirectVideo =
    video.startsWith('blob:') ||
    video.startsWith('data:video') ||
    /\.(mp4|webm|ogg|mov)($|\?)/i.test(video) ||
    (/\.(mp4|webm|ogg|mov)($|\?)/i.test(link) && !fileId);

  const directVideoUrl = isDirectVideo ? (video || link) : undefined;

  const urls: string[] = [];

  if (fileId) {
    if (submission.category === 'VIDEO') {
      // Google Drive video thumbnail: first keyframe capture
      urls.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`);
      urls.push(`https://lh3.googleusercontent.com/d/${fileId}=w1000`);
      urls.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w640`);
    } else {
      // Google Drive image thumbnail: high resolution
      urls.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`);
      urls.push(`https://lh3.googleusercontent.com/d/${fileId}`);
      urls.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
    }
  }

  // YouTube match
  const ytMatch = (link || video).match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    urls.push(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
  }

  // If previewImageUrl provided and not already in urls
  if (preview && !urls.includes(preview)) {
    urls.push(preview);
  }

  // If link is a direct image URL
  if (link && !fileId && !isDirectVideo && !urls.includes(link)) {
    urls.push(link);
  }

  return {
    urls,
    isDirectVideo,
    directVideoUrl,
  };
}

/**
 * Returns playable video embed URL for Google Drive files, YouTube, or direct video
 */
export function getDriveVideoPlayUrl(driveLinkOrUrl: string, fallbackVideoUrl?: string): {
  type: 'drive_embed' | 'youtube' | 'direct' | 'none';
  url: string;
} {
  const target = (driveLinkOrUrl || fallbackVideoUrl || '').trim();
  if (!target) return { type: 'none', url: '' };

  // Google Drive
  const fileId = extractDriveFileId(target);
  if (fileId) {
    return {
      type: 'drive_embed',
      url: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // YouTube
  const ytMatch = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // Direct video URL (mp4, webm, blob, data)
  if (
    target.startsWith('blob:') ||
    target.startsWith('data:video') ||
    /\.(mp4|webm|ogg|mov)($|\?)/i.test(target) ||
    target.startsWith('http')
  ) {
    return { type: 'direct', url: target };
  }

  return { type: 'none', url: target };
}
