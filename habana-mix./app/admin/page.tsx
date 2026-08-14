'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const sessionData = localStorage.getItem('admin_session')
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        const loginTime = new Date(session.login_time)
        const now = new Date()
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceLogin <= 24) {
          window.location.href = '/admin/dashboard'
        } else {
          localStorage.removeItem('admin_session')
        }
      } catch (error) {
        localStorage.removeItem('admin_session')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Verificar credenciales usando la función de Supabase
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_username: username,
        p_password: password
      })

      if (error) throw error

      if (!data || !data.success) {
        throw new Error(data.message || 'Credenciales inválidas')
      }

      // Almacenar sesión de admin en localStorage
      localStorage.setItem('admin_session', JSON.stringify({
        admin_id: data.admin_id,
        username: data.username,
        full_name: data.full_name,
        login_time: new Date().toISOString()
      }))

      toast.success('Bienvenido al panel de administración')
      window.location.href = '/admin/dashboard'
    } catch (error) {
      console.error('Error de login:', error)
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Habana Mix - Academia de Baile</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="administrador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>Solo usuarios autorizados pueden acceder</p>
        </div>
      </div>
    </div>
  )
}