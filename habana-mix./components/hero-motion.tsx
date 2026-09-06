'use client'

import { useEffect } from 'react'

/**
 * Parallax del hero sin markup propio: solo actualiza `--hero-p` (0 → 1) en el
 * elemento [data-hero] mientras se scrollea la primera pantalla.
 *
 * Con esto el hero puede ser Server Component: el HTML sale del servidor con la
 * imagen y el texto ya puestos, y esto es únicamente el movimiento.
 */
export function HeroMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-hero]')
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const height = window.innerHeight || 1
      const progress = Math.min(Math.max(window.scrollY / height, 0), 1)
      hero.style.setProperty('--hero-p', progress.toFixed(3))
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      hero.style.removeProperty('--hero-p')
    }
  }, [])

  return null
}
