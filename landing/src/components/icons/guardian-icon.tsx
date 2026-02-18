interface IconProps {
  className?: string;
  size?: number;
}

export function GuardianIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="guardian-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#2DFFFF" />
          <stop offset="100%" stopColor="#7822FF" />
        </linearGradient>
      </defs>
      {/* Outer fortress wall */}
      <path
        d="M24 4L6 12v8c0 14 8 24 18 28 10-4 18-14 18-28v-8L24 4z"
        stroke="url(#guardian-grad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner lock body */}
      <rect
        x="18"
        y="22"
        width="12"
        height="10"
        rx="2"
        stroke="#2DFFFF"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Lock shackle */}
      <path
        d="M20 22v-4a4 4 0 018 0v4"
        stroke="#7822FF"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="24" cy="26" r="1.5" fill="#2DFFFF" />
      <rect x="23.25" y="27" width="1.5" height="3" rx="0.5" fill="#2DFFFF" />
      {/* Trust rings */}
      <circle cx="24" cy="24" r="18" stroke="#2DFFFF" strokeWidth="0.5" opacity="0.1" />
      <circle cx="24" cy="24" r="22" stroke="#7822FF" strokeWidth="0.5" opacity="0.07" />
    </svg>
  );
}
