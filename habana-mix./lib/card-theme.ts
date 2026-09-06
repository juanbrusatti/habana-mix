import type { CardTheme } from './types'

/**
 * Mapa de temas de card. El admin elige un `theme` por evento y esto traduce la
 * elección a clases de Tailwind, sin permitir estilos arbitrarios.
 *
 * Recalibrado a la paleta nueva (noche cálida + amarillo eléctrico): todos los
 * `accentBg` mantienen contraste de botón real, para que el CTA siga leyéndose
 * como CTA sin importar el tema que elija el admin.
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
    label: 'Amarillo Habana',
    accentText: 'text-primary',
    accentBg: 'bg-primary text-primary-foreground',
    accentBorder: 'border-primary/35',
    overlay: 'from-[oklch(0.13_0.02_60)] via-[oklch(0.13_0.02_60)]/55 to-transparent',
  },
  coral: {
    label: 'Rojo del local',
    accentText: 'text-[oklch(0.72_0.16_30)]',
    accentBg: 'bg-accent text-accent-foreground',
    accentBorder: 'border-accent/45',
    overlay: 'from-[oklch(0.16_0.06_25)] via-[oklch(0.16_0.06_25)]/55 to-transparent',
  },
  teal: {
    label: 'Turquesa caribe',
    accentText: 'text-[oklch(0.78_0.11_190)]',
    accentBg: 'bg-[oklch(0.78_0.11_190)] text-[oklch(0.17_0.02_200)]',
    accentBorder: 'border-[oklch(0.78_0.11_190)]/40',
    overlay: 'from-[oklch(0.14_0.03_200)] via-[oklch(0.14_0.03_200)]/55 to-transparent',
  },
  noche: {
    label: 'Noche de Malecón',
    accentText: 'text-foreground',
    accentBg: 'bg-foreground text-background',
    accentBorder: 'border-foreground/25',
    overlay: 'from-[oklch(0.11_0.012_40)] via-[oklch(0.11_0.012_40)]/60 to-transparent',
  },
  crema: {
    label: 'Crema colonial',
    accentText: 'text-[oklch(0.9_0.05_85)]',
    accentBg: 'bg-[oklch(0.9_0.05_85)] text-[oklch(0.19_0.02_45)]',
    accentBorder: 'border-[oklch(0.9_0.05_85)]/35',
    overlay: 'from-[oklch(0.18_0.02_70)] via-[oklch(0.18_0.02_70)]/55 to-transparent',
  },
}

export function getCardTheme(theme: CardTheme) {
  return cardThemes[theme] ?? cardThemes.amber
}
