import Image from 'next/image'
import { competitionInfo } from '@/lib/competition-info'
import { cn } from '@/lib/utils'

/** Logos de las organizaciones: PNG blancos con fondo transparente. */
export function CompetitionInfoLogos({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-8 gap-y-4', className)}>
      {competitionInfo.organizations.map((org) => (
        <li key={org.name} className="relative h-12 w-40 sm:h-14 sm:w-48">
          <Image
            src={org.logo}
            alt={org.name}
            fill
            sizes="192px"
            className="object-contain"
          />
        </li>
      ))}
    </ul>
  )
}
