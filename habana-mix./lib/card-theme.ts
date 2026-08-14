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
    /** Halo suave detrás de la card al hacer hover */
    glow: string
    ring: string
  }
> = {
  amber: {
    label: 'Ámbar habanero',
    accentText: 'text-primary',
    accentBg: 'bg-primary text-primary-foreground',
    accentBorder: 'border-primary/40',
    overlay: 'from-[oklch(0.18_0.05_55)] via-[oklch(0.18_0.05_55)]/70 to-transparent',
    glow: 'shadow-[0_24px_70px_-30px_oklch(0.79_0.152_68/0.55)]',
    ring: 'ring-primary/25',
  },
  coral: {
    label: 'Coral cubano',
    accentText: 'text-accent',
    accentBg: 'bg-accent text-accent-foreground',
    accentBorder: 'border-accent/45',
    overlay: 'from-[oklch(0.2_0.08_20)] via-[oklch(0.2_0.08_20)]/70 to-transparent',
    glow: 'shadow-[0_24px_70px_-30px_oklch(0.58_0.19_25/0.6)]',
    ring: 'ring-accent/25',
  },
  teal: {
    label: 'Turquesa caribe',
    accentText: 'text-secondary',
    accentBg: 'bg-secondary text-secondary-foreground',
    accentBorder: 'border-secondary/45',
    overlay: 'from-[oklch(0.17_0.05_195)] via-[oklch(0.17_0.05_195)]/70 to-transparent',
    glow: 'shadow-[0_24px_70px_-30px_oklch(0.62_0.11_185/0.55)]',
    ring: 'ring-secondary/25',
  },
  noche: {
    label: 'Noche de Malecón',
    accentText: 'text-foreground',
    accentBg: 'bg-foreground text-background',
    accentBorder: 'border-foreground/25',
    overlay: 'from-[oklch(0.12_0.01_40)] via-[oklch(0.12_0.01_40)]/75 to-transparent',
    glow: 'shadow-[0_24px_70px_-34px_oklch(0.96_0.012_85/0.3)]',
    ring: 'ring-foreground/15',
  },
  crema: {
    label: 'Crema colonial',
    accentText: 'text-[oklch(0.9_0.06_85)]',
    accentBg: 'bg-[oklch(0.9_0.06_85)] text-[oklch(0.2_0.03_45)]',
    accentBorder: 'border-[oklch(0.9_0.06_85)]/40',
    overlay: 'from-[oklch(0.22_0.03_70)] via-[oklch(0.22_0.03_70)]/70 to-transparent',
    glow: 'shadow-[0_24px_70px_-32px_oklch(0.9_0.06_85/0.4)]',
    ring: 'ring-[oklch(0.9_0.06_85)]/25',
  },
}

export function getCardTheme(theme: CardTheme) {
  return cardThemes[theme] ?? cardThemes.amber
}
