'use client'

import Link from 'next/link'
import { ChevronRight, Calendar, MapPin } from 'lucide-react'
import type { Competition } from '@/lib/competition-types'

interface CompetitionCardProps {
  competition: Competition
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  return (
    <Link 
      href={`/competencia/${competition.slug}`}
      className="block w-full"
    >
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
        {competition.cover_image_url ? (
          <img
            src={competition.cover_image_url}
            alt={competition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-serif text-amber-800/30 dark:text-amber-200/30">
              {competition.title.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-serif">
            {competition.title}
          </h3>
          {competition.description && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3">
              {competition.description}
            </p>
          )}
          <div className="flex items-center text-white/90 text-sm">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              Ver detalles
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}