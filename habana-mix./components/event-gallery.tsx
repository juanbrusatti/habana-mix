'use client'

import { useEffect, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { SmartImage } from '@/components/smart-image'
import type { EventSection } from '@/lib/types'

/**
 * Galería del evento con visor a pantalla completa.
 * Es lo único que necesita JavaScript en la página de detalle.
 */
export function EventGallery({ sections }: { sections: EventSection[] }) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!preview) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [preview])

  if (sections.length === 0) return null

  return (
    <>
      <div className="space-y-5">
        {sections.map((section, index) => (
          <figure
            key={section.id}
            className="group border-border/60 bg-card card-lift overflow-hidden rounded-3xl border hover:border-border"
          >
            <button
              type="button"
              onClick={() => setPreview(section.image_url)}
              className="relative block aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]"
              aria-label={`Ampliar ${section.title || `foto ${index + 1}`}`}
            >
              <SmartImage
                src={section.image_url}
                alt={section.title || `Foto ${index + 1} del evento`}
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute right-3 bottom-3 rounded-full bg-black/55 p-2 text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>

            {(section.title || section.description) && (
              <figcaption className="space-y-1.5 p-4 sm:p-5">
                {section.title && (
                  <h4 className="font-serif text-lg font-semibold">{section.title}</h4>
                )}
                {section.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                    {section.description}
                  </p>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {preview && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm duration-200"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada"
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar vista previa"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista ampliada"
            className="max-h-[90vh] max-w-full rounded-lg object-contain select-none"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
