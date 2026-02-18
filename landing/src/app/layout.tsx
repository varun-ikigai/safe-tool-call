import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ikigai Guardian | Mechanical Trust for AI Agents in Banking",
  description:
    "A governed runtime proxy between AI agents and banking infrastructure. Schema validation, permission checks, PII filtering, and audit logging on every tool call. Mechanical, not probabilistic.",
  icons: {
    icon: "https://cdn.prod.website-files.com/67c99d5589b9a2e085105aa8/67c99d98cd6ab1e8cca5fa8d_ikigai-favicon.png",
  },
  openGraph: {
    title: "Ikigai Guardian | Mechanical Trust for AI Agents in Banking",
    description:
      "Every tool call validated, every output filtered, every action audited. The mechanical boundary between AI and your systems.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
