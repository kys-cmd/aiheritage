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
  const fileId = extractDriveFileId(driveLinkOrUrl);
  if (fileId) {
    // Google high-resolution direct thumbnail endpoint (sz=w1920)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
  }
  return fallbackUrl || driveLinkOrUrl;
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
