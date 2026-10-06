'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Printer, Loader2, Home as HomeIcon, Share2, Trash2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

import { MedicalReportForm } from '@/components/sections/MedicalReportForm'
import { PrintableReport } from '@/components/sections/PrintReport'

import { Client, MedicalReport } from '@/types'
import { apiFetch } from '@/lib/api-client'
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

export default function ClientDetailsPage({ params }: { params: Promise<{ clientId: string }> }) {
    const router = useRouter()
    // Unwrap params using React.use() or await in useEffect? 
    // In Next.js 15 client components, we can unwrap with `use`.
    const { clientId } = use(params)

    const [loading, setLoading] = useState(true)
    const [client, setClient] = useState<Client | null>(null)
    const [reports, setReports] = useState<MedicalReport[]>([])
    const [isEditingReport, setIsEditingReport] = useState(false)
    const [editingReport, setEditingReport] = useState<MedicalReport | null>(null)
    const [reportToPrint, setReportToPrint] = useState<MedicalReport | null>(null)
    const [reportPendingDelete, setReportPendingDelete] = useState<MedicalReport | null>(null)
    const [deletingReport, setDeletingReport] = useState(false)
    const [clientPendingDelete, setClientPendingDelete] = useState(false)
    const [deletingClient, setDeletingClient] = useState(false)

    // Check auth (simplified, assuming middleware or parent layout checks, but added just in case)
    // Actually, usually headers/layout handle this, but let's be safe.

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Medical_Report_${client?.name || 'Client'}_${new Date().toLocaleDateString()}`,
    })

    const triggerPrint = (report: MedicalReport | null) => {
        setReportToPrint(report)
        // Small delay to let the print component update its props before printing
        setTimeout(() => {
            handlePrint()
        }, 100)
    }

    const handleShare = async (report: MedicalReport) => {
        const toastId = toast.loading('Generating PDF report...')

        try {
            const jsPDF = (await import('jspdf')).default
            const { toPng } = await import('html-to-image')

            // Temporary set the report to print so it renders in the hidden container
            setReportToPrint(report)

            // Small delay to ensure the component is rendered and images are loaded
            await new Promise(resolve => setTimeout(resolve, 1500))

            const printElement = printRef.current
            if (!printElement) {
                throw new Error('Print element not found')
            }

            const imgData = await toPng(printElement, {
                pixelRatio: 3,
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: false,
            })

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
            })

            const imgProps = pdf.getImageProperties(imgData)
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            const pdfBlob = pdf.output('blob')

            const fileName = `Medical_Report_${client?.name || 'Client'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Medical Report',
                    text: `Medical report for ${client?.name}`
                })
                toast.success('Report shared successfully', { id: toastId })
            } else {
                // Fallback to download
                const url = URL.createObjectURL(pdfBlob)
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Sharing not supported. PDF downloaded instead.', { id: toastId })
            }
        } catch (error) {
            console.error('Error sharing report:', error)
            toast.error('Failed to generate sharing file', { id: toastId })
        }
    }

    const handleDeleteReport = async () => {
        if (!reportPendingDelete) return

        setDeletingReport(true)
        try {
            const response = await apiFetch(`/api/reports/${reportPendingDelete.id}`, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to delete report')
                return
            }

            setReports((prev) => prev.filter((r) => r.id !== reportPendingDelete.id))
            toast.success('Report deleted successfully')
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.error('An error occurred while deleting the report')
        } finally {
            setDeletingReport(false)
            setReportPendingDelete(null)
        }
    }

    const handleDeleteClient = async () => {
        setDeletingClient(true)
        try {
            const response = await apiFetch(`/api/clients/${clientId}`, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to delete client')
                return
            }

            toast.success(
                result.reportsDeleted
                    ? `Client deleted along with ${result.reportsDeleted} report(s)`
                    : 'Client deleted successfully'
            )
            router.push('/')
        } catch (error) {
            console.error('Error deleting client:', error)
            toast.error('An error occurred while deleting the client')
        } finally {
            setDeletingClient(false)
            setClientPendingDelete(false)
        }
    }

    const fetchClientAndReports = async () => {
        setLoading(true)
        try {
            // Fetch Client
            const clientRes = await apiFetch(`/api/clients/${clientId}`)
            const clientData = await clientRes.json()

            if (!clientRes.ok) {
                toast.error(clientData.error || 'Failed to fetch client details')
                // If not found, maybe redirect home?
                if (clientRes.status === 404) {
                    setTimeout(() => router.push('/'), 2000)
                }
                return
            }
            setClient(clientData.data)

            // Fetch Reports
            const reportsRes = await apiFetch(`/api/clients/${clientId}/reports`)
            const reportsData = await reportsRes.json()
            if (reportsRes.ok) {
                setReports(reportsData.data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('An error occurred while loading client data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (clientId) {
            fetchClientAndReports()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!client) return <div className="p-8 text-center">Client not found</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 text-slate-500 hover:text-blue-600">
                    <HomeIcon className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                {isEditingReport ? (
                    <MedicalReportForm
                        client={client}
                        report={editingReport || undefined}
                        onSave={async (savedReport) => {
                            await fetchClientAndReports() // Reload reports
                            setEditingReport(savedReport)
                            // Stay on edit page or go back? Usually start fresh or stay.
                            // User asked to "create new report", so usually after save they might want to print.
                        }}
                        onCancel={() => {
                            setIsEditingReport(false)
                            setEditingReport(null)
                        }}
                        onPrint={(report) => triggerPrint(report)}
                        onShare={(report) => handleShare(report)}
                    />
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header / Personal Info */}
                        <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-blue-50/50">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {client.name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800">{client.name}</h2>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <Badge className="bg-slate-800">{client.clientId}</Badge>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600">{client.age} years</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600">{client.sex}</span>
                                        </div>
                                        {client.address && (
                                            <p className="text-sm text-slate-500 mt-2">{client.address}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setClientPendingDelete(true)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Client
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
                                                    {new Date(report.date || report.createdAt || new Date()).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                    <span className="mx-2">•</span>
                                                    {new Date(report.date || report.createdAt || new Date()).toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Badge>
                                                <h4 className="font-black text-slate-800 group-hover:text-blue-700 transition-colors uppercase truncate">
                                                    {report.procedure || 'Untitled Procedure'}
                                                </h4>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                                                    {report.impression || report.clinicalSummary || 'No details added yet'}
                                                </p>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-400">UID: {report.id.substring(0, 8)}</span>
                                                        {report.updatedAt && (
                                                            <span className="text-[10px] text-slate-300 mt-1">
                                                                Updated: {new Date(report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShare(report)
                                                            }}
                                                        >
                                                            <Share2 className="w-3.5 h-3.5 mr-1" />
                                                            Share
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setReportPendingDelete(report)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                            Delete
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
                    </div>
                )}

                {/* Delete Report Confirmation */}
                <AlertDialog open={!!reportPendingDelete} onOpenChange={(open) => !open && setReportPendingDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the {reportPendingDelete?.procedure || 'selected'} report. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingReport}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingReport}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDeleteReport()
                                }}
                            >
                                {deletingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Client Confirmation */}
                <AlertDialog open={clientPendingDelete} onOpenChange={setClientPendingDelete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete {client.name}
                                {reports.length === 0
                                    ? '?'
                                    : reports.length === 1
                                        ? ' and their 1 report?'
                                        : ` and all ${reports.length} of their reports?`}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this client and every medical report on file for them. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingClient}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingClient}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDeleteClient()
                                }}
                            >
                                {deletingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Print Container */}
                <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', left: '-9999px' }}>
                    {client && reportToPrint && (
                        <PrintableReport
                            ref={printRef}
                            client={client}
                            report={reportToPrint}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
