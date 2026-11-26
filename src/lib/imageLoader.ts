'use client';

/**
 * Custom Image Loader that directly optimizes images via Cloudinary & Unsplash CDN,
 * bypassing Vercel's 5,000 image transformation monthly limit completely.
 *
 * Anti-Quota Cloudinary Optimization:
 * Quantizes image widths into 4 fixed tiers (384, 640, 1080, 1600) to maximize CDN cache
 * hits across all screen sizes and avoid consuming the 25 monthly free transformation credits.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return '';

  // Regrouper la largeur demandée en 4 paliers fixes (quantization / bucketing)
  let targetWidth = 1600;
  if (width <= 384) {
    targetWidth = 384;
  } else if (width <= 640) {
    targetWidth = 640;
  } else if (width <= 1080) {
    targetWidth = 1080;
  } else {
    targetWidth = 1600;
  }

  // 1. Cloudinary on-the-fly CDN transformation
  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    // Injecter les transformations Cloudinary: f_auto,q_auto:good,c_limit,w_${targetWidth}
    const transform = `f_auto,q_auto:good,c_limit,w_${targetWidth}`;

    const uploadIndex = src.indexOf('/image/upload/');
    if (uploadIndex !== -1) {
      const prefix = src.slice(0, uploadIndex + '/image/upload/'.length);
      const rest = src.slice(uploadIndex + '/image/upload/'.length);

      // Check if rest starts with existing transformation or version
      const isVersionOrFolder = /^v\d+\//.test(rest) || !/^[a-z]_[^/]+\//.test(rest);
      if (isVersionOrFolder) {
        return `${prefix}${transform}/${rest}`;
      } else {
        // Strip previous transformation flags and apply new ones
        return `${prefix}${transform}/${rest.replace(/^[a-z0-9_,]+\//, '')}`;
      }
    }
  }

  // 2. Unsplash on-the-fly CDN optimization
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('auto', 'format');
      if (quality) {
        url.searchParams.set('q', quality.toString());
      }
      return url.toString();
    } catch {
      return src;
    }
  }

  // 3. Fallback for local files or other domains
  return src;
}
