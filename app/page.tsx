'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RegisterClient } from '@/components/sections/RegisterClient'
import { SearchClient } from '@/components/sections/SearchClient'
import { Stethoscope, Search, Plus } from 'lucide-react'

/**
 * Home Page Component
 * Main dashboard for clinic management system
 * Allows switching between client registration and search functionality
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<'register' | 'search'>('register')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lars Medical Centre</h1>
                <p className="text-sm text-gray-600">Clinic Management System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4">
            {/* Register Tab */}
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Register Client
            </button>

            {/* Search Tab */}
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-600">
                Lars Medical Centre Clinic Management System - Efficient patient registration and record management.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Automatic unique ID generation (LMC-XXXXXX)</li>
                <li>✓ Comprehensive client registration</li>
                <li>✓ Quick search by ID or name</li>
                <li>✓ Detailed medical records</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
              <p className="text-sm text-gray-600">
                Email: larsmedicalscentre@yahoo.com<br />
                Phone: 0200-638-932 / 0352196970<br />
                Address: Opposite Victory Hardware, Sunyani
              </p>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 Lars Medical Centre. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
