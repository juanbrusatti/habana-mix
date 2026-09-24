import Link from 'next/link'
import { PhotoAlbumCard } from '@/components/photo-album-card'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import type { PhotoAlbum } from '@/lib/photos'

/** Adelanto de la sección Fotos en la home: los últimos álbumes publicados. */
export function PhotosSection({ albums }: { albums: PhotoAlbum[] }) {
  if (albums.length === 0) return null
  const latest = albums.slice(0, 3)

  return (
    <section id="fotos" aria-labelledby="fotos-title" className="scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Fotos"
            title="Buscá tu foto"
            description="Entrá al álbum, abrí la carpeta y descargá las tuyas."
          />
          <Link
            href="/fotos"
            className="text-primary shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Ver todos los álbumes →
          </Link>
        </div>
        <h2 id="fotos-title" className="sr-only">
          Fotos
        </h2>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {latest.map((album, index) => (
            <Reveal key={album.id} delay={Math.min(index * 80, 240)}>
              <PhotoAlbumCard album={album} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
