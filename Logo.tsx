export function MinistryLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle - Ministry green */}
      <circle cx="50" cy="50" r="48" fill="#008358" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />

      {/* Open book - representing education */}
      <path
        d="M25 38 Q50 32 50 32 Q50 32 75 38 L75 64 Q50 58 50 58 Q50 58 25 64 Z"
        fill="#ffffff"
      />
      <path d="M50 32 L50 58" stroke="#008358" strokeWidth="1" />
      <path d="M30 42 Q40 39 48 39" stroke="#003366" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M30 48 Q40 45 48 45" stroke="#003366" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M52 39 Q60 39 70 42" stroke="#003366" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M52 45 Q60 45 70 48" stroke="#003366" strokeWidth="0.8" fill="none" opacity="0.4" />

      {/* Palm tree top - Saudi symbol */}
      <path d="M50 20 Q45 14 42 16 Q44 18 48 19" fill="#003366" />
      <path d="M50 20 Q55 14 58 16 Q56 18 52 19" fill="#003366" />
      <path d="M50 18 Q50 12 48 10 Q49 14 50 16" fill="#003366" />
      <path d="M50 18 Q50 12 52 10 Q51 14 50 16" fill="#003366" />

      {/* Base circle */}
      <ellipse cx="50" cy="72" rx="18" ry="2" fill="#003366" opacity="0.15" />

      {/* Date palm trunk */}
      <rect x="48.5" y="18" width="3" height="6" rx="1" fill="#003366" />
    </svg>
  );
}

export function SchoolLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-bl from-primary-600 to-primary-400 shadow-card ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Building/school icon */}
        <path d="M50 10 L20 30 L20 80 L80 80 L80 30 Z" fill="white" />
        <rect x="42" y="50" width="16" height="30" fill="#008358" rx="2" />
        <rect x="28" y="45" width="10" height="10" fill="#003366" rx="1" />
        <rect x="62" y="45" width="10" height="10" fill="#003366" rx="1" />
        <path d="M15 80 L85 80 L85 88 L15 88 Z" fill="#003366" />
        {/* Flag */}
        <line x1="50" y1="10" x2="50" y2="2" stroke="white" strokeWidth="2" />
        <path d="M50 2 L62 5 L50 8 Z" fill="white" />
      </svg>
    </div>
  );
}
