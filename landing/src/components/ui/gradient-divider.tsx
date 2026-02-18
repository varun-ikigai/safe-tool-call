interface GradientDividerProps {
  className?: string;
}

export function GradientDivider({ className = "" }: GradientDividerProps) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{
        background:
          "linear-gradient(90deg, transparent, #332651 50%, transparent)",
      }}
    />
  );
}
