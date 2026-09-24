import { AboutSection } from '@/components/about-section'
import { CompetitionsSection } from '@/components/competitions-section'
import { EventsSection } from '@/components/events-section'
import { Hero } from '@/components/hero'
import { LocationSection } from '@/components/location-section'
import { PhotosSection } from '@/components/photos-section'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { isPastEvent } from '@/lib/event-format'
import {
  getAboutConfig,
  getEvents,
  getEventsWithPhotos,
  getFooterConfig,
  getHeroConfig,
  getLiveConfig,
  getLocationConfig,
  sortEventsByRelevance,
} from '@/lib/site-content'

/**
 * Home.
 *
 * Todos los datos se resuelven acá, en el servidor y en paralelo, y bajan por
 * props. El HTML sale completo: el navegador ve la imagen del hero y las cards
 * en la primera respuesta, sin esperar a ejecutar JavaScript ni a consultar
 * Supabase desde el cliente.
 */
/**
 * La home se regenera como máximo cada 30 segundos (ISR).
 *
 * Sin esto, Next la prerenderiza al momento del build y un evento publicado
 * desde el admin no aparecería hasta el próximo deploy. Con ISR, cada visita
 * recibe HTML ya armado (rápido) y el contenido nuevo entra solo.
 */
export const revalidate = 30

export default async function HomePage() {
  const [hero, events, location, about, footer, live, photoEvents] = await Promise.all([
    getHeroConfig(),
    getEvents(),
    getLocationConfig(),
    getAboutConfig(),
    getFooterConfig(),
    getLiveConfig(),
    getEventsWithPhotos(),
  ])

  const sortedEvents = sortEventsByRelevance(events)
  const nextEvent = sortedEvents.find((event) => !isPastEvent(event)) ?? null

  return (
    <>
      <SiteNav />
      <Hero config={hero} nextEvent={nextEvent} live={live} />
      <main>
        <EventsSection events={sortedEvents} />
        <PhotosSection events={photoEvents} />
        <CompetitionsSection />
        <LocationSection config={location} />
        <AboutSection config={about} />
      </main>
      <SiteFooter config={footer} location={location} />
    </>
  )
}
