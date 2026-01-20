'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, X, Printer, Loader2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

import { MedicalReportForm } from './MedicalReportForm'
import { PrintableReport } from './PrintReport'

/**
 * SearchClient Component
 * Allows users to search for clients by their unique ID (LMC-XXXXXX) or name
 * Displays detailed client information when found
 */
export function SearchClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [isEditingReport, setIsEditingReport] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)
  const [reportToPrint, setReportToPrint] = useState<any>(null)

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Medical_Report_${selectedClient?.name || 'Client'}_${new Date().toLocaleDateString()}`,
  })

  const triggerPrint = (report: any) => {
    setReportToPrint(report)
    // Small delay to let the print component update its props before printing
    setTimeout(() => {
      handlePrint()
    }, 100)
  }

  const fetchReports = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/reports`)
      const result = await response.json()
      if (response.ok) {
        setReports(result.data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

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
   */
  const handleSelectClient = async (clientId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error || 'Failed to fetch client details')
        return
      }
      setSelectedClient(result.data)
      await fetchReports(clientId)
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('An error occurred while fetching client details')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedClient(null)
    setReports([])
    setEditingReport(null)
    setIsEditingReport(false)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Search Form */}
      <Card className="p-8 mb-6 bg-white/50 backdrop-blur shadow-xl border-white/20">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Search Clients</h1>
        <p className="text-slate-500 mb-6">Start typing to search - results appear as you type</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter client ID (e.g., LMC-ABC123) or name"
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
          <p className="text-sm text-slate-400 mt-3">No clients found matching "{searchQuery}"</p>
        )}
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedClient && (
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
                  <div className="text-right text-sm text-slate-500">
                    <p>Age: {client.age} • {client.sex}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Client Folder View */}
      {selectedClient && (
        <>
          {isEditingReport ? (
            <MedicalReportForm
              client={selectedClient}
              report={editingReport}
              onSave={async (savedReport) => {
                await fetchReports(selectedClient.clientId)
                // Update the current editing report with the freshly saved one
                setEditingReport(savedReport)
                // We DON'T set setIsEditingReport(false) here so the user stays on the page
              }}
              onCancel={() => {
                setIsEditingReport(false)
                setEditingReport(null)
              }}
              onPrint={(report) => triggerPrint(report)}
            />
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header / Personal Info */}
              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-blue-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedClient.name[0]}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">{selectedClient.name}</h2>
                      <div className="flex gap-2 mt-2 items-center">
                        <Badge className="bg-slate-800">{selectedClient.clientId}</Badge>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{selectedClient.age} years</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{selectedClient.sex}</span>
                      </div>
                      {selectedClient.address && (
                        <p className="text-sm text-slate-500 mt-2">{selectedClient.address}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </Card>

              {/* Reports Folder */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Medical Reports Folder</h3>
                    <p className="text-sm text-slate-500">Manage all endoscopy and procedural reports</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingReport(null)
                      setIsEditingReport(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                  >
                    + New Report
                  </Button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-100 bg-slate-50/50">
                    <p className="text-slate-400 italic">No reports found in this folder</p>
                    <Button
                      variant="link"
                      onClick={() => setIsEditingReport(true)}
                      className="text-blue-600 font-bold"
                    >
                      Click here to create the first report
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="group p-6 rounded-2xl border bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          setEditingReport(report)
                          setIsEditingReport(true)
                        }}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-3xl group-hover:bg-blue-600 transition-colors duration-300" />
                        <div className="relative">
                          <Badge variant="outline" className="mb-2 bg-slate-50 border-none text-slate-500">
                            {new Date(report.date || report.createdAt).toLocaleDateString()}
                          </Badge>
                          <h4 className="font-black text-slate-800 group-hover:text-blue-700 transition-colors uppercase truncate">
                            {report.procedure || 'Untitled Procedure'}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                            {report.impression || report.clinicalSummary || 'No details added yet'}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">UID: {report.id.substring(0, 8)}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  triggerPrint(report)
                                }}
                              >
                                <Printer className="w-3.5 h-3.5 mr-1" />
                                Print
                              </Button>
                              <span className="text-blue-600 font-bold text-sm self-center">Open →</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Action Footer */}
              <div className="flex justify-between items-center py-4 px-2">
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-red-500"
                  onClick={() => {/* TODO: Delete Client Logic */ }}
                >
                  Archive Folder
                </Button>
                <p className="text-xs text-slate-400">Lars Medical Centre • Confidential Client Data</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !selectedClient && searchQuery && !loading && (
        <Card className="p-8 text-center bg-slate-50 border-dashed border-2">
          <p className="text-slate-600">No clients found matching <span className="font-bold">"{searchQuery}"</span></p>
          <p className="text-sm text-slate-400 mt-2">Check the ID or try searching by name</p>
        </Card>
      )}
      {/* Persistent Printable Component Holder */}
      <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', left: '-9999px' }}>
        {selectedClient && (
          <PrintableReport
            ref={printRef}
            client={selectedClient}
            report={reportToPrint || {}}
          />
        )}
      </div>
    </div>
  )
}

