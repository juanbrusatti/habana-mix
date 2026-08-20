import { AboutSection } from '@/components/about-section'
import { EventsSection } from '@/components/events-section'
import { Hero } from '@/components/hero'
import { LocationSection } from '@/components/location-section'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'

export default async function HomePage() {
  return (
    <>
      <SiteNav />
      <Hero />
      <main>
        <EventsSection />
        <LocationSection />
        <AboutSection />
      </main>
      <SiteFooter />
    </>
  )
}
