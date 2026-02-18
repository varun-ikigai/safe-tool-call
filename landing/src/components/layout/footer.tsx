import Image from "next/image";
import { GradientDivider } from "@/components/ui/gradient-divider";
import { LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-brand-dark-secondary">
      <GradientDivider />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src={LINKS.logoSvg}
              alt="Ikigai Digital"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
            <span className="text-brand-dark-quaternary">|</span>
            <span className="text-sm font-semibold tracking-tight text-white">
              Guardian
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-brand-muted">
            <a
              href={LINKS.website}
              className="transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              ikigaidigital.io
            </a>
            <a
              href={LINKS.github}
              className="transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href={LINKS.consultation}
              className="transition-colors hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-dark-quaternary/30 pt-8">
          <p className="text-center text-xs text-brand-muted/60">
            &copy; {new Date().getFullYear()} Ikigai Digital Limited. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
