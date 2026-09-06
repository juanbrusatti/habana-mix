'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Retardo en ms para escalonar elementos de una misma fila. Se limita a 300ms. */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'footer' | 'nav'
}

/** Si el observer no llegó a disparar en este tiempo, mostramos igual. */
const SAFETY_MS = 700

/**
 * Aparición suave al entrar en viewport.
 *
 * El estado final es SIEMPRE visible: además del IntersectionObserver hay dos
 * redes de seguridad, porque la versión anterior dejaba contenido en
 * `opacity: 0` para siempre cuando el scroll saltaba de golpe (llegar con
 * #eventos, restaurar la posición al volver atrás, o un salto por teclado).
 *
 *  1. Si al montar el elemento ya está en pantalla o quedó por encima, se
 *     muestra en el acto.
 *  2. Un timer de seguridad lo muestra igual si nada disparó.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Sin soporte de IntersectionObserver: mostrar y listo.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    // Ya visible o ya pasado de largo al montar.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
      return
    }
    if (rect.bottom <= 0) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(el)
    const safety = window.setTimeout(() => setVisible(true), SAFETY_MS + delay)

    return () => {
      observer.disconnect()
      window.clearTimeout(safety)
    }
  }, [delay])

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      data-visible={visible}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${Math.min(delay, 300)}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
}
