'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '#eventos', label: 'Eventos' },
  { href: '#como-llegar', label: 'Cómo llegar' },
  { href: '#nosotros', label: 'Nosotros' },
]

export function SiteNav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((element): element is HTMLElement => Boolean(element))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(`#${visible.target.id}`)
      },
      { threshold: [0.25, 0.5], rootMargin: '-20% 0px -40% 0px' },
    )

    for (const section of sections) observer.observe(section)
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
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          solid
            ? 'border-border/30 bg-background/75 border-b backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          {/* La marca se ve desde el primer scroll: antes aparecía recién pasado el hero. */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-serif text-lg font-semibold tracking-tight"
          >
            Habana<span className="text-primary">Mix</span>
          </button>

          <ul className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <button
                  type="button"
                  onClick={() => go(link.href)}
                  className={cn(
                    'relative px-1 py-2 text-sm font-medium transition-colors duration-300',
                    active === link.href
                      ? 'text-primary'
                      : 'text-foreground/65 hover:text-foreground',
                  )}
                >
                  {link.label}
                  {active === link.href && (
                    <span className="bg-primary absolute inset-x-0 -bottom-px h-px" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go('#eventos')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hidden h-10 items-center rounded-full px-5 text-sm font-semibold transition-transform active:scale-95 md:inline-flex"
            >
              Comprar entrada
            </button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
              className="border-border/70 bg-background/50 text-foreground flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-200 active:scale-90 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          'bg-background/98 fixed inset-0 z-40 backdrop-blur-xl transition-all duration-400 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-5 px-8">
          {links.map((link, index) => (
            <li key={link.href} className="w-full max-w-xs">
              <button
                type="button"
                onClick={() => go(link.href)}
                style={{ transitionDelay: open ? `${index * 60 + 80}ms` : '0ms' }}
                className={cn(
                  'border-border/30 hover:border-primary/40 hover:text-primary w-full border-b py-5 font-serif text-4xl font-medium transition-all duration-400 active:scale-[0.98]',
                  open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
                )}
              >
                {link.label}
              </button>
            </li>
          ))}

          <li className="w-full max-w-xs pt-4">
            <button
              type="button"
              onClick={() => go('#eventos')}
              style={{ transitionDelay: open ? '260ms' : '0ms' }}
              className={cn(
                'bg-primary text-primary-foreground h-13 w-full rounded-full text-[15px] font-semibold transition-all duration-400 active:scale-[0.98]',
                open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
              )}
            >
              Comprar entrada
            </button>
          </li>
        </ul>
      </div>
    </>
  )
}
