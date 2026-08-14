'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '#eventos', label: 'Eventos' },
  { href: '#clases', label: 'Clases' },
  { href: '#como-llegar', label: 'Cómo llegar' },
  { href: '#nosotros', label: 'Nosotros' },
]

export function SiteNav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(`#${visible.target.id}`)
      },
      { threshold: [0.25, 0.5], rootMargin: '-20% 0px -40% 0px' },
    )

    for (const s of sections) observer.observe(s)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    document
      .getElementById(href.slice(1))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          solid
            ? 'border-border/60 bg-background/80 border-b backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={cn(
              'font-serif text-lg font-semibold tracking-tight transition-all duration-500',
              solid ? 'opacity-100' : 'opacity-0',
            )}
          >
            Habana<span className="text-primary">Mix</span>
          </button>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <button
                  type="button"
                  onClick={() => go(l.href)}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
                    active === l.href
                      ? 'text-primary'
                      : 'text-foreground/65 hover:text-foreground',
                  )}
                >
                  {l.label}
                  {active === l.href && (
                    <span className="bg-primary absolute inset-x-4 -bottom-px h-px" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="border-border/70 bg-background/50 text-foreground focus-visible:ring-ring flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-200 active:scale-90 focus-visible:ring-2 focus-visible:outline-none md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Menú móvil a pantalla completa */}
      <div
        className={cn(
          'bg-background/95 fixed inset-0 z-40 backdrop-blur-2xl transition-all duration-400 md:hidden',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-2 px-8">
          {links.map((l, i) => (
            <li key={l.href} className="w-full max-w-xs">
              <button
                type="button"
                onClick={() => go(l.href)}
                style={{ transitionDelay: open ? `${i * 60 + 80}ms` : '0ms' }}
                className={cn(
                  'border-border/50 hover:border-primary/50 hover:text-primary w-full border-b py-5 font-serif text-3xl font-medium transition-all duration-500 active:scale-[0.98]',
                  open
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0',
                )}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
