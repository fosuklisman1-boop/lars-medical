'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Client } from '@/types'

/**
 * SearchClient Component
 * Allows users to search for clients by their unique ID (LMC-XXXXXX) or name
 * Redirects to the detailed client page upon selection
 */
export function SearchClient() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)


  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [clientPendingDelete, setClientPendingDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  /**
   * Real-time search function
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(query)}`)
      const result = await response.json()
      if (response.ok) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error('Error searching clients:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  /**
   * Debounced search - triggers 300ms after user stops typing
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, performSearch])

  /**
   * Handles clicking on a search result
   * Redirects to the client details page
   */
  const handleSelectClient = (clientId: string) => {
    router.push(`/client/${clientId}`)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const handleDeleteClient = async () => {
    if (!clientPendingDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/clients/${clientPendingDelete.clientId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to delete client')
        return
      }

      setSearchResults((prev) =>
        prev.filter((c) => c.clientId !== clientPendingDelete.clientId)
      )
      toast.success(
        result.reportsDeleted
          ? `Client deleted along with ${result.reportsDeleted} report(s)`
          : 'Client deleted successfully'
      )
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('An error occurred while deleting the client')
    } finally {
      setDeleting(false)
      setClientPendingDelete(null)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Search Form */}
      <Card className="p-8 mb-6 bg-white/50 backdrop-blur shadow-xl border-white/20">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Search Clients</h1>
        <p className="text-slate-500 mb-6">Start typing to search - results appear as you type</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter client ID digits (e.g. 0001) or name"
              className="bg-white pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          {searchQuery && (
            <Button type="button" variant="outline" onClick={handleClearSearch}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {searchQuery && !searching && searchResults.length === 0 && (
          <p className="text-sm text-slate-400 mt-3">No clients found matching &quot;{searchQuery}&quot;</p>
        )}
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
          <div className="space-y-2">
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="p-4 border rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group"
                onClick={() => handleSelectClient(client.clientId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{client.name}</p>
                    <p className="text-sm text-slate-500">ID: <Badge variant="secondary">{client.clientId}</Badge></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-slate-500">
                      <p>Age: {client.age} • {client.sex}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      aria-label={`Delete ${client.name}`}
                      title={`Delete ${client.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setClientPendingDelete(client)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && searchQuery && !searching && (
        <Card className="p-8 text-center bg-slate-50 border-dashed border-2">
          <p className="text-slate-600">No clients found matching <span className="font-bold">&quot;{searchQuery}&quot;</span></p>
          <p className="text-sm text-slate-400 mt-2">Check the ID or try searching by name</p>
        </Card>
      )}

      <AlertDialog open={!!clientPendingDelete} onOpenChange={(open) => !open && setClientPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {clientPendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client and all of their medical reports. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteClient()
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

