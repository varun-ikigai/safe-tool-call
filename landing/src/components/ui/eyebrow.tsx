interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <span
      className={`inline-block text-sm font-medium uppercase tracking-[0.3em] text-brand-cyan ${className}`}
    >
      / {children}
    </span>
  );
}
