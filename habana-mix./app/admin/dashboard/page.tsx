'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HeroEditor } from '@/components/admin/hero-editor'
import { LocationEditor } from '@/components/admin/location-editor'
import { AboutEditor } from '@/components/admin/about-editor'
import { FooterEditor } from '@/components/admin/footer-editor'
import { toast } from 'sonner'
import { Lock, Unlock } from 'lucide-react'

interface AdminSession {
  admin_id: string
  username: string
  full_name: string
  login_time: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

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

  const handleTabChange = (tabId: string) => {
    const lockedTabs = ['clases', 'eventos', 'sorteos']
    if (lockedTabs.includes(tabId)) {
      toast.error('Esta sección está bloqueada temporalmente')
      return
    }
    setActiveTab(tabId)
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="clases" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Clases
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="sorteos" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sorteos
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Edición General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clases" className="space-y-4">
            <div className="p-8 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Sección Bloqueada</h3>
              </div>
              <p className="text-muted-foreground">
                La gestión de clases estará disponible próximamente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="eventos" className="space-y-4">
            <div className="p-8 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Sección Bloqueada</h3>
              </div>
              <p className="text-muted-foreground">
                La gestión de eventos estará disponible próximamente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sorteos" className="space-y-4">
            <div className="p-8 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Sección Bloqueada</h3>
              </div>
              <p className="text-muted-foreground">
                El sistema de sorteos estará disponible próximamente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Edición General</h3>
              <p className="text-muted-foreground mb-6">
                Aquí podrás editar elementos generales del sitio.
              </p>
              
              <Tabs defaultValue="hero" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
                  <TabsTrigger value="quienes-somos">Quiénes somos</TabsTrigger>
                  <TabsTrigger value="footer">Footer</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-4">
                  <HeroEditor />
                </TabsContent>

                <TabsContent value="ubicacion" className="space-y-4">
                  <LocationEditor />
                </TabsContent>

                <TabsContent value="quienes-somos" className="space-y-4">
                  <AboutEditor />
                </TabsContent>

                <TabsContent value="footer" className="space-y-4">
                  <FooterEditor />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}