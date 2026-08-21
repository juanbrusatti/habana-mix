import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Habana Mix | Academia de Baile Cubano — Salsa, Bachata y Timba',
  description:
    'Academia de baile Habana Mix: clases de salsa cubana, bachata, timba y rueda de casino. Eventos, fiestas y talleres con el sabor de La Habana.',
  generator: 'v0.app',
  keywords: [
    'academia de baile',
    'salsa cubana',
    'bachata',
    'timba',
    'rueda de casino',
    'Habana Mix',
    'clases de baile',
  ],
  openGraph: {
    title: 'Habana Mix | Academia de Baile Cubano',
    description:
      'Clases de salsa cubana, bachata y timba. Eventos y fiestas con el sabor de La Habana.',
    type: 'website',
  },
  icons: {
    icon: '/images/icono.jpeg',
    apple: '/images/icono.jpeg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#231a12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
