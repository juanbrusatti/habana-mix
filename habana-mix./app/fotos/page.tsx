import Link from 'next/link'
import { ArrowLeft, Camera } from 'lucide-react'
import { PhotoAlbumCard } from '@/components/photo-album-card'
import { Reveal } from '@/components/reveal'
import { getAlbums } from '@/lib/site-content'

export const metadata = {
  title: 'Fotos de los eventos | Habana Mix',
  description: 'Buscá tu foto de los eventos de Habana Mix y descargala.',
}

/** Se regenera cada minuto: cuando el admin crea un álbum, aparece solo. */
export const revalidate = 60

export default async function PhotosPage() {
  const albums = await getAlbums()

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
          <p className="flex-1 text-center font-serif text-lg font-semibold">
            Habana<span className="text-primary">Mix</span>
          </p>
          <span className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="animate-enter-up">
          <div className="flex items-center gap-3">
            <span className="bg-primary h-px w-6 sm:w-8" />
            <span className="text-primary text-[11px] font-semibold tracking-[0.24em] uppercase">
              Fotos
            </span>
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Buscá tu foto
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
            Elegí el álbum, entrá a la carpeta y descargá las tuyas.
          </p>
        </div>

        {albums.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {albums.map((album, index) => (
              <Reveal key={album.id} delay={Math.min(index * 80, 240)}>
                <PhotoAlbumCard album={album} priority={index === 0} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="border-border/60 mt-10 rounded-3xl border border-dashed p-10 text-center">
            <Camera className="text-muted-foreground mx-auto h-8 w-8" />
            <p className="mt-3 font-medium">Todavía no hay fotos publicadas</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Las subimos unos días después de cada fiesta.
            </p>
            <Link
              href="/#eventos"
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold transition-transform active:scale-[0.98]"
            >
              Ver próximos eventos
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
