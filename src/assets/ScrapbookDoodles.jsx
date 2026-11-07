import React from 'react';

/**
 * Decorative Star Sticker (aria-hidden by default as required for decorative elements)
 */
export function StarSticker({ size = 28, fill = '#FCF0C2', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M18 3L22.2 12.6L32.7 13.7L24.8 20.8L27.1 31.1L18 25.7L8.9 31.1L11.2 20.8L3.3 13.7L13.8 12.6L18 3Z"
        fill={fill}
        stroke="#261F1C"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Decorative Heart Sticker
 */
export function HeartSticker({ size = 26, fill = '#FAD2DD', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M18 31C18 31 5 22.4 5 12.6C5 8.1 8.6 5 12.6 5C15.2 5 17.2 6.4 18 8.4C18.8 6.4 20.8 5 23.4 5C27.4 5 31 8.1 31 12.6C31 22.4 18 31 18 31Z"
        fill={fill}
        stroke="#261F1C"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Decorative Flower Doodle
 */
export function FlowerSticker({ size = 30, fill = '#E4DAF6', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="20" cy="9" r="6" fill={fill} stroke="#261F1C" strokeWidth="2.2" />
      <circle cx="20" cy="31" r="6" fill={fill} stroke="#261F1C" strokeWidth="2.2" />
      <circle cx="9" cy="20" r="6" fill={fill} stroke="#261F1C" strokeWidth="2.2" />
      <circle cx="31" cy="20" r="6" fill={fill} stroke="#261F1C" strokeWidth="2.2" />
      <circle cx="20" cy="20" r="5.5" fill="#FCF0C2" stroke="#261F1C" strokeWidth="2.2" />
    </svg>
  );
}

/**
 * Meaningful SVG Polaroid Illustration (includes role="img" and accessible title/alt text)
 */
export function PolaroidIllustration({
  variant = 'friends',
  alt,
  caption,
}) {
  const accessibleLabel = alt || caption || 'Illustrated polaroid memory of friends';

  const svgElement = (
    <svg
      viewBox="0 0 220 165"
      role="img"
      aria-label={accessibleLabel}
      style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '2px solid #261F1C' }}
    >
      <title>{accessibleLabel}</title>
      {variant === 'friends' ? (
        <>
          <rect width="220" height="165" fill="#E4DAF6" />
          <circle cx="185" cy="34" r="16" fill="#FCF0C2" stroke="#261F1C" strokeWidth="2.2" />
          <path d="M0 130 Q60 110 120 130 T220 125 L220 165 L0 165 Z" fill="#D5E8DA" stroke="#261F1C" strokeWidth="2" />
          {/* Friend 1 */}
          <circle cx="80" cy="78" r="22" fill="#FDE0C6" stroke="#261F1C" strokeWidth="2.4" />
          <path d="M62 72 Q80 50 98 72" fill="none" stroke="#261F1C" strokeWidth="3" strokeLinecap="round" />
          <circle cx="73" cy="78" r="2.5" fill="#261F1C" />
          <circle cx="87" cy="78" r="2.5" fill="#261F1C" />
          <path d="M73 86 Q80 92 87 86" fill="none" stroke="#261F1C" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M52 145 C52 114 108 114 108 145" fill="#FAD2DD" stroke="#261F1C" strokeWidth="2.4" />
          {/* Friend 2 */}
          <circle cx="138" cy="82" r="21" fill="#FDE0C6" stroke="#261F1C" strokeWidth="2.4" />
          <circle cx="131" cy="82" r="2.5" fill="#261F1C" />
          <circle cx="145" cy="82" r="2.5" fill="#261F1C" />
          <path d="M131 90 Q138 96 145 90" fill="none" stroke="#261F1C" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M112 145 C112 116 164 116 164 145" fill="#FCF0C2" stroke="#261F1C" strokeWidth="2.4" />
        </>
      ) : (
        <>
          <rect width="220" height="165" fill="#FDE0C6" />
          <rect x="45" y="38" width="130" height="90" rx="10" fill="#FFFDF9" stroke="#261F1C" strokeWidth="2.4" />
          <path d="M65 65 H155 M65 85 H140 M65 105 H125" stroke="#52423A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="162" cy="108" r="12" fill="#FAD2DD" stroke="#261F1C" strokeWidth="2" />
        </>
      )}
    </svg>
  );

  if (caption) {
    return (
      <div className="polaroid-frame">
        {svgElement}
        <div className="polaroid-caption">{caption}</div>
      </div>
    );
  }

  return svgElement;
}

/**
 * Slamly Brand Book Emblem SVG
 */
export function SlamlyLogoMark({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8" y="6" width="46" height="52" rx="8" fill="#FAD2DD" stroke="#261F1C" strokeWidth="3.2" />
      <rect x="15" y="6" width="41" height="52" rx="6" fill="#FFFDF9" stroke="#261F1C" strokeWidth="3.2" />
      <path
        d="M35.5 23.5c-2.4-3.6-7.4-4-9.8-0.7-2.2 3-1 7.2 2.1 9.9l7.7 6.1 7.7-6.1c3.1-2.7 4.3-6.9 2.1-9.9-2.4-3.3-7.4-2.9-9.8 0.7z"
        fill="#E86F88"
        stroke="#261F1C"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <line x1="23" y1="46" x2="47" y2="46" stroke="#261F1C" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

