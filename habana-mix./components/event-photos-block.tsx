import { Camera, ExternalLink } from 'lucide-react'

/** Bloque "Fotos del evento" en la página del evento: el link que lleva al Drive. */
export function EventPhotosBlock({ photosUrl }: { photosUrl: string }) {
  return (
    <section
      id="fotos"
      className="border-primary/30 bg-primary/10 scroll-mt-20 space-y-4 rounded-3xl border p-5 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Camera className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-2xl leading-tight font-semibold">Fotos del evento</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Entrá a la carpeta, buscá tu foto y descargala.
          </p>
        </div>
      </div>

      <a
        href={photosUrl}
        target="_blank"
        rel="noreferrer"
        className="cta-shine group bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
      >
        Ver y descargar fotos
        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Se abre en Google Drive. Para bajar una foto, abrila y tocá el ícono de descarga (⤓) arriba a
        la derecha.
      </p>
    </section>
  )
}
