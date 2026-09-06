import Image from 'next/image'
import { isOptimizableImage } from '@/lib/event-format'

interface SmartImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** Solo para la imagen que domina la primera pantalla. */
  priority?: boolean
  sizes?: string
}

/**
 * Imagen que llena a su contenedor (que debe ser `relative`).
 *
 * Usa next/image —y con eso AVIF/WebP y el tamaño justo para el dispositivo—
 * cuando el host está permitido, y cae a una <img> normal si algún día entra
 * una URL de otro dominio, para que eso no rompa la página.
 */
export function SmartImage({
  src,
  alt,
  className = 'object-cover',
  priority = false,
  sizes = '100vw',
}: SmartImageProps) {
  if (!src) return null

  if (!isOptimizableImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      quality={78}
    />
  )
}
