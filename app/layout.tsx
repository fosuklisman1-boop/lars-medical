import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Metadata for the clinic management system
 * Includes SEO information and Open Graph tags for social sharing
 */
export const metadata: Metadata = {
  title: 'Lars Medical Centre - Clinic Management System',
  description: 'Comprehensive clinic management system for patient registration, medical records, and client search with unique ID generation (LMC-XXXXXX)',
  keywords: ['clinic', 'medical', 'patient management', 'healthcare', 'endoscopy'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clinic-management.vercel.app',
    siteName: 'Lars Medical Centre',
    title: 'Lars Medical Centre - Clinic Management System',
    description: 'Efficient patient registration and medical records management',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

/**
 * Root Layout Component
 * Provides global styling, fonts, and toast notifications
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
