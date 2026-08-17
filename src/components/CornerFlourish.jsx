import React from 'react';

export const CornerFlourish = ({ position = 'top-left', color = 'rgba(212, 212, 212, 0.65)', size = 64 }) => {
  // Transform for each corner
  const transforms = {
    'top-left': 'scale(1, 1)',
    'top-right': 'scale(-1, 1)',
    'bottom-left': 'scale(1, -1)',
    'bottom-right': 'scale(-1, -1)',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: transforms[position] || 'none',
        color: color,
        pointerEvents: 'none',
      }}
      className={`flourish-corner flourish-${position}`}
    >
      {/* Outer framing line */}
      <path
        d="M 6 94 L 6 30 C 6 16.745 16.745 6 30 6 L 94 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Inner accent line */}
      <path
        d="M 12 94 L 12 34 C 12 21.849 21.849 12 34 12 L 94 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 2"
        opacity="0.6"
      />

      {/* Main Floral Spiral Swirl */}
      <path
        d="M 6 6 C 22 6 32 16 32 30 C 32 44 18 52 8 42 C -2 32 8 14 26 18 C 40 21 48 38 42 54 C 37 68 20 74 10 66"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
      />

      {/* Counter Branch Swirl */}
      <path
        d="M 6 6 C 6 22 16 32 30 32 C 44 32 52 18 42 8 C 32 -2 14 8 18 26 C 21 40 38 48 54 42 C 68 37 74 20 66 10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ornate Leaf accents */}
      <path
        d="M 30 6 Q 42 16 38 28 Q 28 22 30 6 Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M 6 30 Q 16 42 28 38 Q 22 28 6 30 Z"
        fill="currentColor"
        opacity="0.75"
      />

      {/* Ornamental Dots */}
      <circle cx="6" cy="6" r="3" fill="currentColor" />
      <circle cx="30" cy="32" r="2" fill="currentColor" />
      <circle cx="50" cy="12" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="50" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="68" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="68" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
};

export const OrnateFrameCorners = ({ color, size = 64 }) => (
  <div className="ornate-frame-corners">
    <CornerFlourish position="top-left" color={color} size={size} />
    <CornerFlourish position="top-right" color={color} size={size} />
    <CornerFlourish position="bottom-left" color={color} size={size} />
    <CornerFlourish position="bottom-right" color={color} size={size} />
  </div>
);

export default CornerFlourish;
