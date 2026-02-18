import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { GuardianArchitecture } from "@/components/sections/guardian-architecture";
import { ToolManifests } from "@/components/sections/tool-manifests";
import { ForWho } from "@/components/sections/for-who";
import { CTA } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <GuardianArchitecture />
        <ToolManifests />
        <ForWho />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
