interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  background?: "dark" | "dark-alt" | "gradient";
}

export function Section({
  id,
  children,
  className = "",
  background = "dark",
}: SectionProps) {
  const backgrounds = {
    dark: "bg-brand-dark",
    "dark-alt": "bg-brand-dark-secondary",
    gradient: "bg-gradient-dark",
  };

  return (
    <section
      id={id}
      className={`relative py-24 md:py-32 ${backgrounds[background]} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
    </section>
  );
}
