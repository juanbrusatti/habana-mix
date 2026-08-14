'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Retardo en ms para escalonar elementos de una misma fila */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'footer'
}

/**
 * Aparición suave al entrar en viewport. Usa IntersectionObserver (barato en
 * móvil) y respeta prefers-reduced-motion vía CSS.
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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      data-visible={visible}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
}
