import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { MarqueeStrip } from "@/components/marquee-strip"
import { StoresSection } from "@/components/stores-section"
import { HowItWorks } from "@/components/how-it-works"
import { CampusSection } from "@/components/campus-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main>
        <HeroSection />
        <MarqueeStrip />
        <StoresSection />
        <HowItWorks />
        <CampusSection />
      </main>
      <SiteFooter />
    </>
  )
}
