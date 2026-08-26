'use client'

import type { CompetitionSection } from '@/lib/competition-types'

interface CompetitionSectionProps {
  section: CompetitionSection
}

export function CompetitionSection({ section }: CompetitionSectionProps) {
  return (
    <div className="space-y-4">
      {section.title && (
        <h3 className="text-xl font-semibold font-serif">{section.title}</h3>
      )}
      
      {section.media_url && (
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] rounded-xl overflow-hidden bg-muted">
          {section.media_type === 'video' ? (
            <video
              src={section.media_url}
              controls
              className="w-full h-full object-cover"
              playsInline
            />
          ) : (
            <img
              src={section.media_url}
              alt={section.title || 'Sección'}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
      
      {section.description && (
        <p className="text-base text-muted-foreground leading-relaxed">
          {section.description}
        </p>
      )}
      
      {section.button_text && section.button_url && (
        <a
          href={section.button_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-colors"
        >
          {section.button_text}
        </a>
      )}
    </div>
  )
}