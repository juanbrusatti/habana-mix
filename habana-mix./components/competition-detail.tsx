'use client'

import { CompetitionSection } from '@/components/competition-section'
import { CompetitionSchedule } from '@/components/competition-schedule'
import type { CompetitionWithDetails } from '@/lib/competition-types'
import { Calendar, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CompetitionDetailProps {
  competition: CompetitionWithDetails
}

export function CompetitionDetail({ competition }: CompetitionDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header móvil con navegación */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-lg font-semibold flex-1 truncate">{competition.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Imagen principal */}
        {competition.cover_image_url && (
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] rounded-2xl overflow-hidden">
            <img
              src={competition.cover_image_url}
              alt={competition.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Información principal */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif">{competition.title}</h2>
          {competition.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {competition.description}
            </p>
          )}
        </div>

        {/* Horarios */}
        {competition.schedules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Horarios
            </h3>
            <div className="space-y-3">
              {competition.schedules.map((schedule) => (
                <CompetitionSchedule key={schedule.id} schedule={schedule} />
              ))}
            </div>
          </div>
        )}

        {/* Secciones visuales */}
        {competition.sections.length > 0 && (
          <div className="space-y-6">
            {competition.sections
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <CompetitionSection key={section.id} section={section} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}