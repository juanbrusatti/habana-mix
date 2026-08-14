import { AboutSection } from '@/components/about-section'
import { ClassesSection } from '@/components/classes-section'
import { EventsSection } from '@/components/events-section'
import { Hero } from '@/components/hero'
import { LocationSection } from '@/components/location-section'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { StyleMarquee } from '@/components/style-marquee'
import { getClasses } from '@/lib/data'

export default async function HomePage() {
  const classes = await getClasses()

  return (
    <>
      <SiteNav />
      <Hero />
      <main>
        <StyleMarquee />
        <EventsSection />
        <ClassesSection classes={classes} />
        <LocationSection />
        <AboutSection />
      </main>
      <SiteFooter />
    </>
  )
}
