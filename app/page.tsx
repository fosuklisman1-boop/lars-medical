'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

import { RegisterClient } from '@/components/sections/RegisterClient'
import { SearchClient } from '@/components/sections/SearchClient'
import { Dashboard } from '@/components/sections/Dashboard'
import { Search, Plus, LogOut, User as UserIcon, Loader2, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@/lib/auth'

/**
 * Home Page Component
 * Main dashboard for clinic management system
 * Allows switching between client registration and search functionality
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<'register' | 'search' | 'dashboard'>('register')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('admin')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        const resolvedRole = session.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin'
        setRole(resolvedRole)
        if (resolvedRole === 'super_admin') {
          setActiveTab('dashboard')
        }
        setLoading(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        setRole(session.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch {
      toast.error('Error logging out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Authenticating Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg overflow-hidden w-10 h-10 border border-slate-200 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="LMC Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">Lars Medical Centre</h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Clinic Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-sm font-bold text-slate-800">{user?.email?.split('@')[0] || 'Admin User'}</p>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter bg-blue-50 px-1 rounded">
                  {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <UserIcon className="w-5 h-5 text-slate-400" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4">
            {/* Dashboard Tab */}
            {role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-all ${activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
            )}

            {/* Register Tab */}
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-all ${activeTab === 'register'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Register Client
            </button>

            {/* Search Tab */}
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-all ${activeTab === 'search'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search Clients
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8">
        {activeTab === 'register' && <RegisterClient />}
        {activeTab === 'search' && <SearchClient />}
        {activeTab === 'dashboard' && role === 'super_admin' && <Dashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-widest">About System</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Lars Medical Centre Clinic Management System - Professional healthcare record management and diagnostic tracking.
              </p>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-widest">System Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600 uppercase">Database Connected</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Powered by Lars Endoscopy Unit</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-widest">Contact Support</h3>
              <p className="text-xs text-slate-500 font-medium">
                Email: larsmedicalscentre@yahoo.com<br />
                Phone: 0200-638-932 / 0352196970
              </p>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">&copy; 2026 Lars Medical Centre. Secure Administrative Access.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

