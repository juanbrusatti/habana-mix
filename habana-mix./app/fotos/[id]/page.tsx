import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Camera, ExternalLink } from 'lucide-react'
import { SmartImage } from '@/components/smart-image'
import { formatAlbumDate } from '@/lib/photos'
import { getAlbum } from '@/lib/site-content'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await getAlbum(id)
  if (!album) return { title: 'Álbum no encontrado | Habana Mix' }
  return {
    title: `Fotos: ${album.title} | Habana Mix`,
    description: album.description || 'Buscá tu foto y descargala.',
  }
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await getAlbum(id)
  if (!album) notFound()

  const date = formatAlbumDate(album.album_date)

  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link
            href="/fotos"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Fotos
          </Link>
          <p className="flex-1 truncate px-2 text-center text-sm font-semibold sm:text-base">{album.title}</p>
          <span className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-4 sm:pt-6">
        <div className="border-border/40 bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-3xl border sm:aspect-[16/9]">
          {album.cover_url ? (
            <SmartImage
              src={album.cover_url}
              alt={album.title}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          ) : (
            <div className="from-secondary to-card absolute inset-0 flex items-center justify-center bg-gradient-to-br">
              <Camera className="text-primary/40 h-16 w-16" />
            </div>
          )}
          <div aria-hidden className="from-background/90 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
            <h1 className="font-serif text-3xl leading-tight font-semibold sm:text-5xl">{album.title}</h1>
            {date && (
              <p className="text-foreground/85 mt-2 flex items-center gap-2 text-sm">
                <CalendarDays className="text-primary h-4 w-4" />
                {date}
              </p>
            )}
          </div>
        </div>

        <section className="border-primary/30 bg-primary/10 space-y-4 rounded-3xl border p-5 sm:p-7">
          <div>
            <h2 className="font-serif text-2xl leading-tight font-semibold">Buscá tu foto</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {album.description || 'Entrá a la carpeta, buscá tu foto y descargala.'}
            </p>
          </div>

          <a
            href={album.drive_url}
            target="_blank"
            rel="noreferrer"
            className="cta-shine group bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
          >
            Ver y descargar fotos
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Se abre en Google Drive. Para bajar una foto, abrila y tocá el ícono de descarga (⤓) arriba
            a la derecha.
          </p>
        </section>
      </main>
    </div>
  )
}
