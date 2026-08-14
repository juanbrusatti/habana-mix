'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AdminSession {
  admin_id: string
  username: string
  full_name: string
  login_time: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    try {
      const sessionData = localStorage.getItem('admin_session')
      if (!sessionData) {
        window.location.href = '/admin'
        return
      }

      const session: AdminSession = JSON.parse(sessionData)
      
      // Verificar que la sesión no sea muy antigua (24 horas)
      const loginTime = new Date(session.login_time)
      const now = new Date()
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLogin > 24) {
        localStorage.removeItem('admin_session')
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.')
        window.location.href = '/admin'
        return
      }

      setUser(session)
    } catch (error) {
      console.error('Error verificando sesión:', error)
      localStorage.removeItem('admin_session')
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    toast.success('Sesión cerrada')
    window.location.href = '/admin'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Habana Mix Admin</h1>
              <span className="text-sm text-muted-foreground">Panel de Administración</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.full_name || user?.username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Bienvenido al Panel de Administración</h2>
            <p className="text-muted-foreground">
              Gestiona clases, eventos y contenido del sitio web
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Clases</h3>
              <p className="text-sm text-muted-foreground">Gestionar clases de baile</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Eventos</h3>
              <p className="text-sm text-muted-foreground">Crear y editar eventos</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Inscripciones</h3>
              <p className="text-sm text-muted-foreground">Gestionar inscripciones de alumnos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}