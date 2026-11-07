/**
 * Browser-side Photo Compression & Validation Utility (Milestone 6B)
 *
 * Compresses an uploaded image in the browser using an HTML5 <canvas> into a compact
 * JPEG data URL ("data:image/jpeg;base64,...") so it can be stored directly on the
 * Firestore response document while staying on the free Firebase Spark plan.
 *
 * Drawing onto a <canvas> and re-encoding as JPEG also strips all EXIF metadata
 * (including GPS location and camera details) for friend privacy.
 */

export const MAX_RAW_PHOTO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB raw upload limit
export const MAX_PHOTO_DIMENSION_PX = 800; // Longest side <= 800 px
export const MAX_CLIENT_PHOTO_DATA_URL_LENGTH = 120000; // Strictly < 120,000 chars (~85 KB)
export const MAX_RULES_PHOTO_DATA_URL_LENGTH = 150000; // Firestore rules hard ceiling (<= 150,000 chars)
export const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,';
export const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15];

/**
 * Validates a File/Blob object before attempting browser image decoding.
 * Rejects non-image files and files larger than 15 MB with a friendly error.
 */
export function validateRawPhotoFile(file) {
  if (!file) {
    const err = new Error('Please choose an image file.');
    err.code = 'photo/missing-file';
    err.isValidationError = true;
    throw err;
  }

  const mimeType = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  const fileName = typeof file.name === 'string' ? file.name.toLowerCase() : '';

  // Explicitly detect HEIC/HEIF early if the browser reports it, or non-image MIME types
  if (!mimeType.startsWith('image/')) {
    const isLikelyHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    const err = new Error(
      isLikelyHeic
        ? 'This browser cannot decode HEIC/HEIF photos directly. Please choose a JPEG, PNG, or WebP photo, or continue without a photo.'
        : 'Only image files (such as JPEG, PNG, or WebP) can be attached as a photo.'
    );
    err.code = 'photo/invalid-type';
    err.isValidationError = true;
    throw err;
  }

  if (typeof file.size === 'number' && file.size > MAX_RAW_PHOTO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const err = new Error(
      `That photo is ${sizeMb} MB, which is over the 15 MB limit. Please pick a smaller photo.`
    );
    err.code = 'photo/file-too-large';
    err.isValidationError = true;
    throw err;
  }

  if (typeof file.size === 'number' && file.size === 0) {
    const err = new Error('The selected photo file appears to be empty. Please try another photo.');
    err.code = 'photo/empty-file';
    err.isValidationError = true;
    throw err;
  }

  return true;
}

/**
 * Calculates scaled width and height so the longest side is at most `maxDimension` (800 px),
 * preserving the original aspect ratio and never upscaling smaller images.
 */
export function calculateScaledDimensions(
  naturalWidth,
  naturalHeight,
  maxDimension = MAX_PHOTO_DIMENSION_PX
) {
  const width = Number(naturalWidth) || 0;
  const height = Number(naturalHeight) || 0;

  if (width <= 0 || height <= 0) {
    const err = new Error(
      'Could not read the dimensions of this image. Please try another photo or continue without one.'
    );
    err.code = 'photo/invalid-dimensions';
    err.isValidationError = true;
    throw err;
  }

  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Validates that an encoded photo string is a valid JPEG data URL within size limits.
 */
export function validatePhotoDataUrl(
  photoDataUrl,
  maxLength = MAX_CLIENT_PHOTO_DATA_URL_LENGTH
) {
  if (photoDataUrl === undefined || photoDataUrl === null || photoDataUrl === '') {
    return null;
  }

  if (typeof photoDataUrl !== 'string') {
    const err = new Error('Invalid photo format. Please re-upload your photo or remove it.');
    err.code = 'photo/invalid-data-url';
    err.isValidationError = true;
    throw err;
  }

  const trimmed = photoDataUrl.trim();
  if (
    !trimmed.startsWith(JPEG_DATA_URL_PREFIX) ||
    trimmed.length <= JPEG_DATA_URL_PREFIX.length
  ) {
    const err = new Error('Photo must be compressed as a valid JPEG image.');
    err.code = 'photo/invalid-prefix';
    err.isValidationError = true;
    throw err;
  }

  if (trimmed.length >= maxLength) {
    const err = new Error(
      'This photo is still too large after compression. Please pick a smaller or simpler photo.'
    );
    err.code = 'photo/compressed-too-large';
    err.isValidationError = true;
    throw err;
  }

  return trimmed;
}

/**
 * Loads a File/Blob into an HTMLImageElement in the browser.
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      const err = new Error('Image processing is only available in the browser.');
      err.code = 'photo/unsupported-environment';
      reject(err);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore revoke errors
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = () => {
      cleanup();
      const err = new Error(
        'Your browser could not decode this image (for example, some HEIC photos are not supported). Please pick a JPEG or PNG photo, or continue without a photo.'
      );
      err.code = 'photo/decode-failed';
      err.isValidationError = true;
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an image File in the browser using an HTML5 <canvas>:
 * 1. Validates file type (image/*) and raw size (<= 15 MB).
 * 2. Decodes the image and scales it so the longest side is at most 800 px.
 * 3. Draws onto a <canvas> (automatically stripping EXIF/location metadata).
 * 4. Exports as `image/jpeg`, lowering quality step-by-step from 0.8 down until
 *    the resulting data URL is strictly under 120,000 characters.
 */
export async function compressPhotoFileToDataUrl(file) {
  validateRawPhotoFile(file);

  const img = await loadImageFromFile(file);
  const { width, height } = calculateScaledDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    MAX_PHOTO_DIMENSION_PX
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const err = new Error(
      'Could not initialize image compression in your browser. You can still submit your response without a photo.'
    );
    err.code = 'photo/canvas-unavailable';
    err.isValidationError = true;
    throw err;
  }

  // Fill with warm white first so transparent PNGs/WebPs have a clean white background in JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let selectedDataUrl = '';
  let usedQuality = QUALITY_STEPS[0];

  for (const quality of QUALITY_STEPS) {
    const candidate = canvas.toDataURL('image/jpeg', quality);
    if (
      typeof candidate === 'string' &&
      candidate.startsWith(JPEG_DATA_URL_PREFIX) &&
      candidate.length < MAX_CLIENT_PHOTO_DATA_URL_LENGTH
    ) {
      selectedDataUrl = candidate;
      usedQuality = quality;
      break;
    }
  }

  if (!selectedDataUrl) {
    const err = new Error(
      'We could not compress this photo under the keepsake size limit. Please pick a smaller or simpler photo, or continue without a photo.'
    );
    err.code = 'photo/compressed-too-large';
    err.isValidationError = true;
    throw err;
  }

  return {
    dataUrl: selectedDataUrl,
    width,
    height,
    quality: usedQuality,
    charLength: selectedDataUrl.length,
  };
}

