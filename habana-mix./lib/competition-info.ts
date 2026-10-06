/**
 * ============================================================================
 *  CONTENIDO TEMPORAL — Competencia de la "Social de colores"
 * ============================================================================
 *  Todo lo de la competencia (categorías, reglamentos, logos) sale de acá.
 *
 *  PARA SACARLO cuando termine el evento:
 *   - Rápido: poner `enabled: false` → desaparece de la home, del menú y de la
 *     página del evento, y /reglamento muestra "no disponible".
 *   - Definitivo: borrar este archivo, la carpeta public/competencia/,
 *     app/reglamento/ y components/competition-info-*.tsx, y quitar las
 *     líneas marcadas con "COMPETENCIA TEMPORAL" (home, menú, detalle de evento).
 *
 *  No toca la venta: no cambia el evento, los precios, el botón de compra ni
 *  nada del flujo de pago o de las entradas.
 * ============================================================================
 */

export const competitionInfo = {
  enabled: true,

  /** Página donde se muestra todo. */
  href: '/reglamento',

  /** Eventos (por slug) que muestran el acceso a esta info en su página. */
  eventSlugs: ['social-de-colores'],

  title: 'Competencia',
  subtitle: 'Categorías y reglamentos',
  intro:
    'En la Social de colores también se compite. Acá tenés las categorías y los reglamentos oficiales para preparar tu participación.',

  /** Logos en blanco con fondo transparente (generados desde los originales). */
  organizations: [
    { name: 'Oaxaca Salsa & Bachata Paramount Cup', logo: '/competencia/logo-oaxaca.png' },
    { name: 'World Latin Dance Cup', logo: '/competencia/logo-wldc.png' },
  ],

  categories: [
    { name: 'Salsa', count: 45, image: '/competencia/categorias-salsa.jpeg' },
    { name: 'Bachata', count: 37, image: '/competencia/categorias-bachata.jpeg' },
    { name: 'Casino', count: 14, image: '/competencia/categorias-casino.jpeg' },
  ],

  documents: [
    {
      title: 'Convocatoria, bases y reglamento',
      organization: 'Oaxaca Salsa & Bachata Paramount Cup 2026',
      file: '/competencia/reglamento-oaxaca-paramount-cup-2026.pdf',
      pages: 20,
      size: '1,1 MB',
    },
    {
      title: 'Reglamento 2026',
      organization: 'World Latin Dance Cup',
      file: '/competencia/reglamento-world-latin-dance-cup-2026.pdf',
      pages: 21,
      size: '4,4 MB',
    },
  ],
} as const

export function showCompetitionForEvent(slug: string | null | undefined) {
  return competitionInfo.enabled && Boolean(slug) && (competitionInfo.eventSlugs as readonly string[]).includes(slug!)
}
