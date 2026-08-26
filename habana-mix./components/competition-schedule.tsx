'use client'

import { Calendar, MapPin, Clock } from 'lucide-react'
import type { CompetitionSchedule } from '@/lib/competition-types'

interface CompetitionScheduleProps {
  schedule: CompetitionSchedule
}

export function CompetitionSchedule({ schedule }: CompetitionScheduleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-base">{schedule.title}</h4>
          {schedule.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {schedule.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{formatDate(schedule.start_time)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {formatTime(schedule.start_time)}
            {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
          </span>
        </div>
        
        {schedule.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{schedule.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}