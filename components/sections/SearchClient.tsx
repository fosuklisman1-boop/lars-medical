'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, X } from 'lucide-react'

/**
 * SearchClient Component
 * Allows users to search for clients by their unique ID (LMC-XXXXXX) or name
 * Displays detailed client information when found
 */
export function SearchClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)

  /**
   * Handles search form submission
   * Searches for clients by ID or name
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)

    try {
      // Send GET request to search for clients
      const response = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to search clients')
        return
      }

      setSearchResults(result.data)

      if (result.data.length === 0) {
        toast.info('No clients found matching your search')
      } else {
        toast.success(`Found ${result.data.length} client(s)`)
      }
    } catch (error) {
      console.error('Error searching clients:', error)
      toast.error('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handles clicking on a search result to view full details
   */
  const handleSelectClient = async (clientId: string) => {
    setLoading(true)

    try {
      // Fetch full client details
      const response = await fetch(`/api/clients/${clientId}`)
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to fetch client details')
        return
      }

      setSelectedClient(result.data)
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('An error occurred while fetching client details')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Clears the search and results
   */
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedClient(null)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Search Form */}
      <Card className="p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">Search Clients</h1>
        <p className="text-gray-600 mb-6">Search by client ID (LMC-XXXXXX) or name</p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter client ID (e.g., LMC-ABC123) or name"
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSearch}
              className="px-4"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </form>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedClient && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
          <div className="space-y-2">
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                onClick={() => handleSelectClient(client.clientId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{client.name}</p>
                    <p className="text-sm text-gray-600">
                      ID: <Badge variant="outline">{client.clientId}</Badge>
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Age: {client.age}</p>
                    <p>Sex: {client.sex}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Client Details */}
      {selectedClient && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">{selectedClient.name}</h2>
              <p className="text-gray-600 mt-1">
                Client ID: <Badge className="ml-2">{selectedClient.clientId}</Badge>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedClient(null)}
              className="px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Sex:</span> {selectedClient.sex}</p>
                <p><span className="font-medium">Age:</span> {selectedClient.age} years</p>
                {selectedClient.address && (
                  <p><span className="font-medium">Address:</span> {selectedClient.address}</p>
                )}
                <p><span className="font-medium">Registered:</span> {new Date(selectedClient.dateOfRegistration).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-3">Medical Information</h3>
              <div className="space-y-2 text-sm">
                {selectedClient.refDoctor && (
                  <p><span className="font-medium">Referring Doctor:</span> {selectedClient.refDoctor}</p>
                )}
                {selectedClient.procedure && (
                  <p><span className="font-medium">Procedure:</span> {selectedClient.procedure}</p>
                )}
                {selectedClient.hutTestResult && (
                  <p><span className="font-medium">HUT Test:</span> {selectedClient.hutTestResult}</p>
                )}
                {selectedClient.impression && (
                  <p><span className="font-medium">Impression:</span> {selectedClient.impression}</p>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Details */}
          {(selectedClient.clinicalSummary || selectedClient.findings) && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Clinical Details</h3>
              <div className="space-y-4">
                {selectedClient.clinicalSummary && (
                  <div>
                    <p className="font-medium text-sm mb-1">Clinical Summary:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedClient.clinicalSummary}</p>
                  </div>
                )}
                {selectedClient.findings && (
                  <div>
                    <p className="font-medium text-sm mb-1">Findings:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedClient.findings}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treatment Information */}
          {(selectedClient.medicationGiven || selectedClient.medication || selectedClient.comments) && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Treatment & Recommendations</h3>
              <div className="space-y-4">
                {selectedClient.medicationGiven && (
                  <div>
                    <p className="font-medium text-sm mb-1">Medication Given:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedClient.medicationGiven}</p>
                  </div>
                )}
                {selectedClient.medication && (
                  <div>
                    <p className="font-medium text-sm mb-1">Prescribed Medication:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedClient.medication}</p>
                  </div>
                )}
                {selectedClient.comments && (
                  <div>
                    <p className="font-medium text-sm mb-1">Doctor's Comments:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedClient.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 border-t pt-6 flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Copy client ID to clipboard
                navigator.clipboard.writeText(selectedClient.clientId)
                toast.success('Client ID copied to clipboard')
              }}
            >
              Copy Client ID
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedClient(null)}
            >
              Back to Search
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !selectedClient && searchQuery && !loading && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No clients found matching "{searchQuery}"</p>
          <p className="text-sm text-gray-500 mt-2">Try searching with a different ID or name</p>
        </Card>
      )}
    </div>
  )
}
