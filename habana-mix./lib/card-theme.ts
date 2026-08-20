import type { CardTheme } from './types'

/**
 * Mapa de temas de card. El admin elige un `theme` por evento/clase y esto
 * traduce la elección a clases de Tailwind, sin permitir estilos arbitrarios.
 */
export const cardThemes: Record<
  CardTheme,
  {
    label: string
    /** Color sólido para acentos (chips, líneas, precio) */
    accentText: string
    accentBg: string
    accentBorder: string
    /** Degradado que se apoya sobre la imagen */
    overlay: string
  }
> = {
  amber: {
    label: 'Ámbar habanero',
    accentText: 'text-primary',
    accentBg: 'bg-primary text-primary-foreground',
    accentBorder: 'border-primary/30',
    overlay: 'from-[oklch(0.18_0.04_55)] via-[oklch(0.18_0.04_55)]/60 to-transparent',
  },
  coral: {
    label: 'Coral cubano',
    accentText: 'text-accent',
    accentBg: 'bg-accent text-accent-foreground',
    accentBorder: 'border-accent/35',
    overlay: 'from-[oklch(0.2_0.07_20)] via-[oklch(0.2_0.07_20)]/60 to-transparent',
  },
  teal: {
    label: 'Turquesa caribe',
    accentText: 'text-secondary',
    accentBg: 'bg-secondary text-secondary-foreground',
    accentBorder: 'border-secondary/35',
    overlay: 'from-[oklch(0.17_0.04_195)] via-[oklch(0.17_0.04_195)]/60 to-transparent',
  },
  noche: {
    label: 'Noche de Malecón',
    accentText: 'text-foreground',
    accentBg: 'bg-foreground text-background',
    accentBorder: 'border-foreground/20',
    overlay: 'from-[oklch(0.12_0.01_40)] via-[oklch(0.12_0.01_40)]/65 to-transparent',
  },
  crema: {
    label: 'Crema colonial',
    accentText: 'text-[oklch(0.88_0.05_85)]',
    accentBg: 'bg-[oklch(0.88_0.05_85)] text-[oklch(0.2_0.03_45)]',
    accentBorder: 'border-[oklch(0.88_0.05_85)]/30',
    overlay: 'from-[oklch(0.22_0.025_70)] via-[oklch(0.22_0.025_70)]/60 to-transparent',
  },
}

export function getCardTheme(theme: CardTheme) {
  return cardThemes[theme] ?? cardThemes.amber
}
