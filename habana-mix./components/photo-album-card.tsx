import Link from 'next/link'
import { CalendarDays, Camera } from 'lucide-react'
import { SmartImage } from '@/components/smart-image'
import { formatAlbumDate, type PhotoAlbum } from '@/lib/photos'

/** Card de un álbum: lleva a su página, donde está el botón a Drive. */
export function PhotoAlbumCard({ album, priority = false }: { album: PhotoAlbum; priority?: boolean }) {
  const date = formatAlbumDate(album.album_date)

  return (
    <Link
      href={`/fotos/${album.id}`}
      className="group border-border/50 bg-card card-lift hover:border-primary/35 block overflow-hidden rounded-3xl border hover:-translate-y-1"
    >
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {album.cover_url ? (
          <SmartImage
            src={album.cover_url}
            alt={album.title}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="from-secondary to-card absolute inset-0 flex items-center justify-center bg-gradient-to-br">
            <Camera className="text-primary/40 h-12 w-12" />
          </div>
        )}
        <div aria-hidden className="from-background/85 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
        <h3 className="absolute inset-x-0 bottom-0 p-4 font-serif text-xl leading-tight font-semibold text-balance">
          {album.title}
        </h3>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 text-sm">
        {date ? (
          <p className="text-foreground/85 flex items-center gap-2">
            <CalendarDays className="text-primary h-4 w-4 shrink-0" />
            {date}
          </p>
        ) : (
          <span />
        )}
        <p className="text-primary shrink-0 font-semibold">
          Buscá tu foto{' '}
          <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  )
}
