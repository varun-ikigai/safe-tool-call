import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoryPage } from "@/components/sections/story";

export const metadata: Metadata = {
  title: "The Journey | Ikigai Guardian",
  description:
    "AI adoption is here. Your teams are already using it. When you're ready to run autonomous agents against production, Guardian is the governed runtime waiting for you.",
  openGraph: {
    title: "The Journey | Ikigai Guardian",
    description:
      "From developer tools to autonomous agents — the path every bank is on, and the trust layer you'll need when you get there.",
    type: "website",
  },
};

export default function Story() {
  return (
    <>
      <Header />
      <main>
        <StoryPage />
      </main>
      <Footer />
    </>
  );
}
