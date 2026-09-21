'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { defaultLive, normalizeChannel, platformUrl, type LiveConfig, type LiveProvider } from '@/lib/live'
import { supabase } from '@/lib/supabase'

function getAdminId(): string | null {
  try {
    const stored = localStorage.getItem('admin_session')
    if (!stored) return null
    return JSON.parse(stored).admin_id ?? null
  } catch {
    return null
  }
}

export function LiveEditor() {
  const [config, setConfig] = useState<LiveConfig>(defaultLive)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc('get_live_config')
        if (error) throw error
        if (data) setConfig({ ...defaultLive, ...(data as object) } as LiveConfig)
      } catch (error) {
        console.error('Error cargando configuración del vivo:', error)
        toast.error('No se pudo cargar la configuración. ¿Corriste la migración 034?')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const save = async (patch: Partial<LiveConfig>, successMessage: string) => {
    const adminId = getAdminId()
    if (!adminId) {
      toast.error('No hay sesión activa')
      return false
    }

    const { data, error } = await supabase.rpc('update_live_config', {
      p_admin_id: adminId,
      p_is_live: patch.is_live ?? null,
      p_provider: patch.provider ?? null,
      p_channel: patch.channel ?? null,
      p_title: patch.title ?? null,
      p_subtitle: patch.subtitle ?? null,
      p_show_chat: patch.show_chat ?? null,
    })

    if (error) {
      console.error('Error guardando el vivo:', error)
      toast.error('No se pudo guardar')
      return false
    }
    if (!data?.success) {
      toast.error(data?.message || 'No se pudo guardar')
      return false
    }

    setConfig({ ...defaultLive, ...(data.config as object) } as LiveConfig)
    toast.success(successMessage)
    return true
  }

  /** El interruptor guarda solo: en plena puerta no hay tiempo de "editar y guardar". */
  const toggleLive = async () => {
    const turningOn = !config.is_live

    if (turningOn && !normalizeChannel(config.channel, config.provider)) {
      toast.error('Cargá primero el canal y guardá antes de salir en vivo')
      return
    }

    setToggling(true)
    await save(
      { is_live: turningOn },
      turningOn ? '🔴 Estás en vivo. Ya se ve en la web.' : 'Transmisión finalizada',
    )
    setToggling(false)
  }

  const saveDetails = async () => {
    setSaving(true)
    await save(
      {
        provider: config.provider,
        channel: normalizeChannel(config.channel, config.provider),
        title: config.title,
        subtitle: config.subtitle,
        show_chat: config.show_chat,
      },
      'Datos de la transmisión guardados',
    )
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando…
      </div>
    )
  }

  const channelReady = Boolean(normalizeChannel(config.channel, config.provider))
  const external = platformUrl(config)

  return (
    <div className="space-y-4">
      {/* Interruptor principal */}
      <div
        className={`rounded-xl border p-5 transition-colors ${
          config.is_live ? 'border-red-500/50 bg-red-500/5' : 'border-border'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                config.is_live ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">
                {config.is_live ? 'Estás en vivo' : 'Transmisión apagada'}
              </p>
              <p className="text-sm text-muted-foreground">
                {config.is_live
                  ? 'El reproductor se ve en la portada y en /vivo.'
                  : 'Nadie ve el reproductor todavía.'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={toggleLive}
            disabled={toggling || (!config.is_live && !channelReady)}
            className={`h-12 min-w-44 rounded-full text-[15px] font-semibold ${
              config.is_live
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {toggling ? 'Un momento…' : config.is_live ? 'Terminar transmisión' : 'Salir en vivo'}
          </Button>
        </div>

        {!channelReady && (
          <p className="mt-3 text-sm text-amber-600">
            Cargá el canal acá abajo y tocá Guardar para poder salir en vivo.
          </p>
        )}
      </div>

      {/* Datos de la transmisión */}
      <div className="space-y-4 rounded-xl border p-5">
        <div>
          <h3 className="font-semibold">Datos de la transmisión</h3>
          <p className="text-sm text-muted-foreground">
            El video sale de Twitch o YouTube: no se sube nada a la web, así que no consume el
            plan gratuito.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Plataforma</Label>
          <div className="flex gap-2">
            {(['twitch', 'youtube'] as LiveProvider[]).map((provider) => (
              <Button
                key={provider}
                type="button"
                variant={config.provider === provider ? 'default' : 'outline'}
                onClick={() => setConfig((current) => ({ ...current, provider }))}
                className="capitalize"
              >
                {provider}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="live-channel">
            {config.provider === 'twitch' ? 'Canal de Twitch' : 'ID o link del video de YouTube'}
          </Label>
          <Input
            id="live-channel"
            value={config.channel}
            placeholder={config.provider === 'twitch' ? 'habanamix' : 'https://youtu.be/…'}
            onChange={(event) =>
              setConfig((current) => ({ ...current, channel: event.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            {config.provider === 'twitch'
              ? 'Podés pegar el link completo (twitch.tv/habanamix) o solo el nombre.'
              : 'Pegá el link del vivo de YouTube; se extrae el ID solo.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="live-title">Título</Label>
          <Input
            id="live-title"
            value={config.title}
            onChange={(event) => setConfig((current) => ({ ...current, title: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="live-subtitle">Bajada</Label>
          <Input
            id="live-subtitle"
            value={config.subtitle}
            onChange={(event) =>
              setConfig((current) => ({ ...current, subtitle: event.target.value }))
            }
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={config.show_chat}
            onChange={(event) =>
              setConfig((current) => ({ ...current, show_chat: event.target.checked }))
            }
            className="h-4 w-4"
          />
          Mostrar el chat de la plataforma al lado del video
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="button" onClick={saveDetails} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>

          <a
            href="/vivo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver la página del vivo
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {external && (
            <a
              href={external}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Abrir el canal
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Cómo transmitir</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Creá la cuenta en Twitch y anotá el nombre del canal acá arriba.</li>
          <li>Empezá a transmitir desde OBS (compu) o desde la app de Twitch (celular).</li>
          <li>Cuando ya se vea en Twitch, tocá <strong>Salir en vivo</strong>.</li>
          <li>Al terminar, tocá <strong>Terminar transmisión</strong> para sacarlo de la web.</li>
        </ol>
      </div>
    </div>
  )
}
