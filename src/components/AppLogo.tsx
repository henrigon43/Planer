import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
  strokeColor?: string;
  fillColor?: string;
}

export function AppLogo({
  className = 'w-7 h-7',
  size,
  strokeColor = 'currentColor',
  fillColor = 'transparent',
}: AppLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Logo Caderno & Planner"
    >
      {/* Caderno Outline with 4 spiral rings */}
      <path
        d="M 148 105
           L 148 158
           L 122 158
           A 15 15 0 0 0 122 188
           L 148 188
           L 148 218
           L 122 218
           A 15 15 0 0 0 122 248
           L 148 248
           L 148 278
           L 122 278
           A 15 15 0 0 0 122 308
           L 148 308
           L 148 338
           L 122 338
           A 15 15 0 0 0 122 368
           L 148 368
           L 148 405
           L 318 405
           L 318 105
           Z"
        stroke={strokeColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />

      {/* 5 horizontal lines on notebook page */}
      <line x1="178" y1="152" x2="288" y2="152" stroke={strokeColor} strokeWidth="18" strokeLinecap="round" />
      <line x1="178" y1="204" x2="288" y2="204" stroke={strokeColor} strokeWidth="18" strokeLinecap="round" />
      <line x1="178" y1="255" x2="288" y2="255" stroke={strokeColor} strokeWidth="18" strokeLinecap="round" />
      <line x1="178" y1="306" x2="288" y2="306" stroke={strokeColor} strokeWidth="18" strokeLinecap="round" />
      <line x1="178" y1="358" x2="288" y2="358" stroke={strokeColor} strokeWidth="18" strokeLinecap="round" />

      {/* Pencil eraser rounded dome */}
      <path
        d="M 364 140
           A 18 18 0 0 1 400 140
           Z"
        stroke={strokeColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />

      {/* Ferrule band (filled) */}
      <rect x="364" y="146" width="36" height="22" rx="2" fill={strokeColor} />

      {/* Pencil barrel */}
      <rect
        x="364"
        y="168"
        width="36"
        height="176"
        stroke={strokeColor}
        strokeWidth="18"
        strokeLinejoin="round"
        fill={fillColor}
      />

      {/* Pencil sharpened cone tip */}
      <polygon
        points="364,344 382,402 400,344"
        stroke={strokeColor}
        strokeWidth="18"
        strokeLinejoin="round"
        fill={fillColor}
      />

      {/* Graphite tip (filled) */}
      <polygon points="375,380 382,402 389,380" fill={strokeColor} />
    </svg>
  );
}
