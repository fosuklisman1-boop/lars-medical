'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { AutocompleteTextarea } from '@/components/ui/autocomplete-textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Loader2, Printer, ArrowLeft, Share2, X } from 'lucide-react'
import { Client, MedicalReport, SavedSignature } from '@/types'

interface MedicalReportFormProps {
    client: Client
    report?: MedicalReport // Optional: if provided, we are editing. If not, creating.
    onSave: (report: MedicalReport) => void
    onCancel: () => void
    onPrint?: (report: MedicalReport) => void // Optional print callback
    onShare?: (report: MedicalReport) => void // Optional share callback
}

export function MedicalReportForm({ client, report, onSave, onCancel, onPrint, onShare }: MedicalReportFormProps) {
    const [loading, setLoading] = useState(false)
    const isEditing = !!report

    const [formData, setFormData] = useState({
        refDoctor: report?.refDoctor || client.refDoctor || '',
        procedure: report?.procedure || 'UPPER ENDOSCOPY',
        operationTeam: Array.isArray(report?.operationTeam)
            ? report.operationTeam.join(', ')
            : (report?.operationTeam ||
                (Array.isArray(client.operationTeam) ? client.operationTeam.join(', ') : (client.operationTeam || ''))),
        timeStarted: report?.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '10:00',
        timeEnded: report?.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '10:15',
        medicationGiven: report?.medicationGiven || '',
        stomachContent: report?.stomachContent || 'EMPTY',
        instrumentsUsed: Array.isArray(report?.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report?.instrumentsUsed || 'OLYMPUS GIF-IT140'),
        clinicalSummary: (report?.clinicalSummary === 'PUD' || report?.clinicalSummary === 'NO SUMMARY' ? '' : (report?.clinicalSummary || client.clinicalSummary || '')),
        biopsy: report?.biopsy || 'NO',
        biopsySite: report?.biopsySite || '',
        // Anatomical Findings (Upper)
        oesophagusGE: report?.oesophagusGE || '',
        geJunction: report?.geJunction || '',
        fundus: report?.fundus || '',
        body: report?.body || '',
        antrum: report?.antrum || '',
        pylorus: report?.pylorus || '',
        d1: report?.d1 || '',
        d2: report?.d2 || '',
        duodenum: report?.duodenum || '',
        // Anatomical Findings (Lower)
        dre: report?.dre || '',
        anus: report?.anus || '',
        rectum: report?.rectum || '',
        sigmoid: report?.sigmoid || '',
        descendingColon: report?.descendingColon || '',
        splenicFlexure: report?.splenicFlexure || '',
        transverseColon: report?.transverseColon || '',
        hepaticFlexure: report?.hepaticFlexure || '',
        ascendingColon: report?.ascendingColon || '',
        caecum: (report?.caecum === 'NOT EXAMINED' ? '' : (report?.caecum || '')),
        ileoCaecalValve: (report?.ileoCaecalValve === 'NOT EXAMINED' ? '' : (report?.ileoCaecalValve || '')),

        findings: report?.findings || '',
        hutTestResult: report?.hutTestResult || '',
        impression: report?.impression || '',
        comments: report?.comments || '',
        testType: report?.testType || (report?.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
        testResult: report?.testResult || (report?.hutTestResult?.split(': ')[1] || report?.hutTestResult || ''),
        letterhead: report?.letterhead || 'LARS',
        amount: report?.amount != null ? String(report.amount) : '',
        signatureImage: report?.signatureImage || '',
        // Registration Details
        name: client.name || '',
        sex: client.sex || '',
        age: client.age?.toString() || '',
        address: client.address || '',
    })

    // Doctor Signature lock state — declared here so the reset effect below can resync it.
    // True only when this report already had a saved signature before this edit; the
    // draw/upload editor otherwise stays open through any number of strokes.
    const [signatureLockedByExisting, setSignatureLockedByExisting] = useState(!!report?.signatureImage)

    // Update form when report prop changes (e.g. after save)
    useMemo(() => {
        if (report) {
            setFormData({
                refDoctor: report.refDoctor || client.refDoctor || '',
                procedure: report.procedure || 'UPPER ENDOSCOPY',
                operationTeam: Array.isArray(report.operationTeam)
                    ? report.operationTeam.join(', ')
                    : (report.operationTeam ||
                        (Array.isArray(client.operationTeam) ? client.operationTeam.join(', ') : (client.operationTeam || ''))),
                timeStarted: report.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '10:00',
                timeEnded: report.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '10:15',
                medicationGiven: report.medicationGiven || '',
                stomachContent: report.stomachContent || 'EMPTY',
                instrumentsUsed: Array.isArray(report.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report.instrumentsUsed || 'OLYMPUS GIF-IT140'),
                clinicalSummary: (report.clinicalSummary === 'PUD' || report.clinicalSummary === 'NO SUMMARY' ? '' : (report.clinicalSummary || client.clinicalSummary || '')),
                biopsy: report.biopsy || 'NO',
                biopsySite: report.biopsySite || '',

                // Upper
                oesophagusGE: report.oesophagusGE || '',
                geJunction: report.geJunction || '',
                fundus: report.fundus || '',
                body: report.body || '',
                antrum: report.antrum || '',
                pylorus: report.pylorus || '',
                d1: report.d1 || '',
                d2: report.d2 || '',
                duodenum: report.duodenum || '',

                // Lower
                dre: report.dre || '',
                anus: report.anus || '',
                rectum: report.rectum || '',
                sigmoid: report.sigmoid || '',
                descendingColon: report.descendingColon || '',
                splenicFlexure: report.splenicFlexure || '',
                transverseColon: report.transverseColon || '',
                hepaticFlexure: report.hepaticFlexure || '',
                ascendingColon: report.ascendingColon || '',
                caecum: report.caecum === 'NOT EXAMINED' ? '' : (report.caecum || ''),
                ileoCaecalValve: report.ileoCaecalValve === 'NOT EXAMINED' ? '' : (report.ileoCaecalValve || ''),

                findings: report.findings || '',
                hutTestResult: report.hutTestResult || '',
                impression: report.impression || '',
                comments: report.comments || '',
                testType: report.testType || (report.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
                testResult: report.testResult || (report.hutTestResult?.split(': ')[1] || report.hutTestResult || ''),
                letterhead: report.letterhead || 'LARS',
                amount: report.amount != null ? String(report.amount) : '',
                signatureImage: report.signatureImage || '',
                // Registration Details (Keep synced with current client prop)
                name: client.name || '',
                sex: client.sex || '',
                age: client.age?.toString() || '',
                address: client.address || '',
            });
            setSignatureLockedByExisting(!!report.signatureImage)
        }
    }, [report]);

    // Original form data for comparison (memoized)
    const originalFormData = useMemo(() => ({
        refDoctor: report?.refDoctor || '',
        procedure: report?.procedure || 'UPPER ENDOSCOPY',
        operationTeam: Array.isArray(report?.operationTeam) ? report.operationTeam.join(', ') : (report?.operationTeam || ''),
        timeStarted: report?.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '10:00',
        timeEnded: report?.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '10:15',
        medicationGiven: report?.medicationGiven || '',
        stomachContent: report?.stomachContent || 'EMPTY',
        instrumentsUsed: Array.isArray(report?.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report?.instrumentsUsed || 'OLYMPUS GIF-IT140'),
        clinicalSummary: (report?.clinicalSummary === 'PUD' || report?.clinicalSummary === 'NO SUMMARY' ? '' : (report?.clinicalSummary || '')),
        biopsy: report?.biopsy || 'NO',
        biopsySite: report?.biopsySite || '',
        // Anatomical Findings (Upper)
        oesophagusGE: report?.oesophagusGE || '',
        geJunction: report?.geJunction || '',
        fundus: report?.fundus || '',
        body: report?.body || '',
        antrum: report?.antrum || '',
        pylorus: report?.pylorus || '',
        d1: report?.d1 || '',
        d2: report?.d2 || '',
        duodenum: report?.duodenum || '',
        // Anatomical Findings (Lower)
        dre: report?.dre || '',
        anus: report?.anus || '',
        rectum: report?.rectum || '',
        sigmoid: report?.sigmoid || '',
        descendingColon: report?.descendingColon || '',
        splenicFlexure: report?.splenicFlexure || '',
        transverseColon: report?.transverseColon || '',
        hepaticFlexure: report?.hepaticFlexure || '',
        ascendingColon: report?.ascendingColon || '',
        caecum: (report?.caecum === 'NOT EXAMINED' ? '' : (report?.caecum || '')),
        ileoCaecalValve: (report?.ileoCaecalValve === 'NOT EXAMINED' ? '' : (report?.ileoCaecalValve || '')),

        findings: report?.findings || '',
        hutTestResult: report?.hutTestResult || '',
        impression: report?.impression || '',
        comments: report?.comments || '',
        testType: report?.testType || (report?.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
        testResult: report?.testResult || (report?.hutTestResult?.split(': ')[1] || report?.hutTestResult || ''),
        letterhead: report?.letterhead || 'LARS',
        amount: report?.amount != null ? String(report.amount) : '',
        signatureImage: report?.signatureImage || '',
        // Registration Details
        name: client.name || '',
        sex: client.sex || '',
        age: client.age?.toString() || '',
        address: client.address || '',
    }), [report, client])

    // Check if form has unsaved changes
    const hasChanges = useMemo(() => {
        return JSON.stringify(formData) !== JSON.stringify(originalFormData)
    }, [formData, originalFormData])

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Doctor Signature — draw, upload, or pick from a saved library; leaving it blank
    // preserves the existing physical-signing flow.
    const [signatureMode, setSignatureMode] = useState<'draw' | 'upload' | 'saved'>('draw')
    const sigCanvasRef = useRef<SignatureCanvas>(null)

    const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([])
    const [loadingSavedSignatures, setLoadingSavedSignatures] = useState(false)
    const [newSignatureLabel, setNewSignatureLabel] = useState('')
    const [savingSignature, setSavingSignature] = useState(false)

    const fetchSavedSignatures = useCallback(async () => {
        setLoadingSavedSignatures(true)
        try {
            const response = await fetch('/api/signatures')
            const result = await response.json()
            if (result.success) {
                setSavedSignatures(result.data)
            }
        } catch (error) {
            console.error('Error fetching saved signatures:', error)
        } finally {
            setLoadingSavedSignatures(false)
        }
    }, [])

    useEffect(() => {
        fetchSavedSignatures()
    }, [fetchSavedSignatures])

    const handleSignatureDrawEnd = () => {
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            setFormData(prev => ({ ...prev, signatureImage: sigCanvasRef.current!.toDataURL('image/png') }))
        }
    }

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setFormData(prev => ({ ...prev, signatureImage: reader.result as string }))
        }
        reader.readAsDataURL(file)
    }

    const handleSelectSavedSignature = (signature: SavedSignature) => {
        setFormData(prev => ({ ...prev, signatureImage: signature.imageData }))
    }

    const handleDeleteSavedSignature = async (signature: SavedSignature) => {
        try {
            const response = await fetch(`/api/signatures/${signature.id}`, { method: 'DELETE' })
            const result = await response.json()
            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to delete saved signature')
                return
            }
            setSavedSignatures(prev => prev.filter(s => s.id !== signature.id))
            toast.success(`Deleted "${signature.label}"`)
        } catch (error) {
            console.error('Error deleting saved signature:', error)
            toast.error('An error occurred while deleting the signature')
        }
    }

    const handleSaveSignatureToLibrary = async () => {
        if (!newSignatureLabel.trim() || !formData.signatureImage) return

        setSavingSignature(true)
        try {
            const response = await fetch('/api/signatures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newSignatureLabel.trim(), imageData: formData.signatureImage }),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to save signature')
                return
            }
            setSavedSignatures(prev => [...prev, result.data].sort((a, b) => a.label.localeCompare(b.label)))
            setNewSignatureLabel('')
            toast.success(`Saved "${result.data.label}" to the signature library`)
        } catch (error) {
            console.error('Error saving signature:', error)
            toast.error('An error occurred while saving the signature')
        } finally {
            setSavingSignature(false)
        }
    }

    const handleClearCanvas = () => {
        sigCanvasRef.current?.clear()
        setFormData(prev => ({ ...prev, signatureImage: '' }))
    }

    const handleClearSignature = () => {
        setFormData(prev => ({ ...prev, signatureImage: '' }))
        setSignatureLockedByExisting(false)
        sigCanvasRef.current?.clear()
    }

    // Procedure Change Warning Logic
    const [showProcedureWarning, setShowProcedureWarning] = useState(false)
    const [pendingProcedure, setPendingProcedure] = useState<string | null>(null)

    const handleProcedureChange = (newValue: string) => {
        // If we are editing an existing report, OR if we have significant data entered?
        // User request: "when updating a report" -> implies isEditing
        if (isEditing && newValue !== formData.procedure) {
            setPendingProcedure(newValue)
            setShowProcedureWarning(true)
        } else {
            // Just change it if creating new or no warning needed
            setFormData(prev => ({ ...prev, procedure: newValue }))
        }
    }

    const confirmProcedureChange = () => {
        if (pendingProcedure) {
            setFormData(prev => ({ ...prev, procedure: pendingProcedure }))
            setPendingProcedure(null)
        }
        setShowProcedureWarning(false)
    }

    // Handle print button click
    const handlePrintClick = () => {
        if (!isEditing) {
            toast.error('Please save the report first before printing')
            return
        }
        if (hasChanges) {
            toast.error('Please save your changes before printing', {
                description: 'Changes must be saved to ensure they appear on the printed report.'
            })
            return
        }
        onPrint?.(report)
    }

    // Handle share button click
    const handleShareClick = () => {
        if (!isEditing) {
            toast.error('Please save the report first before sharing')
            return
        }
        if (hasChanges) {
            toast.error('Please save your changes before sharing', {
                description: 'Changes must be saved to ensure they appear on the shared report.'
            })
            return
        }
        onShare?.(report)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {

            // 1. Check if registration details have changed and update client profile if needed
            const registrationChanged =
                formData.name !== client.name ||
                formData.sex !== client.sex ||
                formData.age !== client.age?.toString() ||
                formData.address !== client.address;

            if (registrationChanged) {
                const clientUpdateRes = await fetch(`/api/clients/${client.clientId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        sex: formData.sex,
                        age: formData.age,
                        address: formData.address,
                    }),
                });

                if (!clientUpdateRes.ok) {
                    const clientResult = await clientUpdateRes.json();
                    toast.error(clientResult.error || 'Failed to update patient registration details');
                } else {
                    toast.success('Patient profile updated');
                }
            }

            // 2. Process report payload
            const isLower = formData.procedure === 'LOWER ENDOSCOPY';

            const payload = {
                ...formData,
                // ... (rest of payload processing)
                stomachContent: formData.stomachContent?.trim() || 'EMPTY',
                instrumentsUsed: (formData.instrumentsUsed?.trim() ? formData.instrumentsUsed.split(',').map((s: string) => s.trim()).filter(Boolean) : ['OLYMPUS GIF-IT140']),

                testType: formData.testType || 'HUT Test Result',
                testResult: formData.testResult || 'PENDING',
                hutTestResult: `(${formData.testType === 'HUT Test Result' ? 'HUT - TEST' : 'STOOL ANTIGEN'}) Test: ${formData.testResult || 'PENDING'}`,

                oesophagusGE: !isLower ? (formData.oesophagusGE?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                geJunction: !isLower ? (formData.geJunction?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                fundus: !isLower ? (formData.fundus?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                body: !isLower ? (formData.body?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                antrum: !isLower ? (formData.antrum?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                pylorus: !isLower ? (formData.pylorus?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                d1: !isLower ? (formData.d1?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                d2: !isLower ? (formData.d2?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,

                dre: isLower ? (formData.dre?.trim() || 'NO DISCHARGES, NO ULCERS, NO PROLAPSED MUCOSA SEEN. PROSTATE PALPABLE WITHIN NORMAL LIMITS') : null,
                anus: isLower ? (formData.anus?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                rectum: isLower ? (formData.rectum?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                sigmoid: isLower ? (formData.sigmoid?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                descendingColon: isLower ? (formData.descendingColon?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                splenicFlexure: isLower ? (formData.splenicFlexure?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                transverseColon: isLower ? (formData.transverseColon?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                hepaticFlexure: isLower ? (formData.hepaticFlexure?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                ascendingColon: isLower ? (formData.ascendingColon?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                caecum: isLower ? (formData.caecum?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,
                ileoCaecalValve: isLower ? (formData.ileoCaecalValve?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN') : null,

                impression: formData.impression?.trim() || (isLower ? 'NORMAL COLONOSCOPY' : 'H. PYLORI GASTRITIS'),
                comments: formData.comments?.trim() || (isLower ? 'NO SIGNS SUGGESTIVE OF POLYPS, TUMOURS, FISSURE, AND IBD ETC WERE SEEN.' : 'MAY BENEFIT FROM PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14 + TAB METRONIDAZOLE 400MG BD X 14 + BISMUTH 240MG BD X 14 + REVIEW UPON COMPLETION OF MEDICATION'),

                refDoctor: formData.refDoctor?.trim() || 'DR. M. S. ADAMS',
                clinicalSummary: formData.clinicalSummary?.trim() || 'NO SUMMARY',
                biopsy: formData.biopsy || 'NO',
                biopsySite: formData.biopsySite?.trim() || '',
                medicationGiven: formData.medicationGiven?.trim() || 'INJ. DORMICUM, PROPOFOL AND BUSCOPAN',

                operationTeam: (formData.operationTeam?.trim() ? formData.operationTeam : 'DR M. S. ADAMS, DR KWARTENG W., GLADYS ABEDU, ABIGAIL OPPONG').split(',').map((s: string) => s.trim()).filter(Boolean),
                timeStarted: formData.timeStarted ? new Date(`${new Date().toDateString()} ${formData.timeStarted}`).toISOString() : null,
                timeEnded: formData.timeEnded ? new Date(`${new Date().toDateString()} ${formData.timeEnded}`).toISOString() : null,
                letterhead: formData.letterhead,
                amount: formData.amount?.trim() ? parseFloat(formData.amount) : null,
                signatureImage: formData.signatureImage || null,
            }

            const url = isEditing
                ? `/api/reports/${report.id}`
                : `/api/clients/${client.clientId}/reports`

            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                toast.error(result.error || `Failed to ${isEditing ? 'update' : 'create'} report`)
                return
            }

            toast.success(`Report ${isEditing ? 'updated' : 'created'} successfully!`)
            onSave(result.data)
        } catch (error) {
            console.error('Error saving report:', error)
            toast.error('An error occurred whilst saving the report')
        } finally {
            setLoading(false)
        }
    }

    const isLowerEndoscopy = formData.procedure === 'LOWER ENDOSCOPY';

    return (
        <Card className="p-8 mt-6">
            <div className="flex items-start gap-4 mb-6">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="shrink-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100/50"
                    title="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{isEditing ? 'Edit' : 'New'} Medical Report</h2>
                    <p className="text-sm text-slate-500 mt-1">💡 Fields will show suggestions from previous reports as you type</p>
                </div>
            </div>

            <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Registration Details Section */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Patient Profile (Registration Details)</h3>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">EDITABLE</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="bg-white border-slate-200 focus:border-blue-500"
                                placeholder="Patient Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Sex</label>
                            <Select
                                value={formData.sex}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}
                            >
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">MALE</SelectItem>
                                    <SelectItem value="FEMALE">FEMALE</SelectItem>
                                    <SelectItem value="OTHER">OTHER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Age</label>
                            <Input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                className="bg-white border-slate-200 focus:border-blue-500"
                                placeholder="Age"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Physical Address</label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="bg-white border-slate-200 focus:border-blue-500"
                            placeholder="Patient Address"
                        />
                    </div>
                </div>

                {/* Procedure Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Referring Doctor</label>
                        <AutocompleteInput name="refDoctor" value={formData.refDoctor} onChange={handleInputChange} field="refDoctor" placeholder="DR. M. S. ADAMS" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure</label>
                        <Select
                            value={formData.procedure}
                            onValueChange={handleProcedureChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Procedure" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UPPER ENDOSCOPY">UPPER ENDOSCOPY</SelectItem>
                                <SelectItem value="LOWER ENDOSCOPY">LOWER ENDOSCOPY</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Letterhead Selection</label>
                        <Select
                            value={formData.letterhead}
                            onValueChange={(value: 'LARS' | 'ADAMS') => setFormData(prev => ({ ...prev, letterhead: value }))}
                        >
                            <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                                <SelectValue placeholder="Select Letterhead" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LARS">LARS MEDICAL CENTRE (Default)</SelectItem>
                                <SelectItem value="ADAMS">ADAMSWASLT HEALTHCITY LIMITED</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <AlertDialog open={showProcedureWarning} onOpenChange={setShowProcedureWarning}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Change Procedure Type?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Changing the procedure type will switch the form to the new procedure's layout.
                                <br /><br />
                                <span className="font-bold text-red-600">Warning:</span> Some data fields specific to the current procedure may be lost or hidden in the new format.
                                <br />
                                Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                                setShowProcedureWarning(false)
                                setPendingProcedure(null)
                            }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmProcedureChange} className="bg-red-600 hover:bg-red-700">Yes, Change Procedure</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Team & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Operation Team (comma separated)</label>
                        <AutocompleteInput name="operationTeam" value={formData.operationTeam} onChange={handleInputChange} field="operationTeam" placeholder="DR M. S. ADAMS, DR KWARTENG W., GLADYS ABEDU, ABIGAIL OPPONG..." />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Time Started</label>
                            <Input type="time" name="timeStarted" value={formData.timeStarted} onChange={handleInputChange} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Time Ended</label>
                            <Input type="time" name="timeEnded" value={formData.timeEnded} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* Clinical Info */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Medication Given</label>
                            <AutocompleteInput name="medicationGiven" value={formData.medicationGiven} onChange={handleInputChange} field="medicationGiven" placeholder="INJ. DORMICUM, PROPOFOL AND BUSCOPAN" />
                        </div>
                        {!isLowerEndoscopy && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Stomach Content</label>
                                <AutocompleteInput name="stomachContent" value={formData.stomachContent} onChange={handleInputChange} field="stomachContent" placeholder="EMPTY" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Instruments Used (comma separated)</label>
                        <AutocompleteInput name="instrumentsUsed" value={formData.instrumentsUsed} onChange={handleInputChange} field="instrumentsUsed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Clinical Summary</label>
                        <AutocompleteInput name="clinicalSummary" value={formData.clinicalSummary} onChange={handleInputChange} field="clinicalSummary" placeholder="NO SUMMARY" />
                    </div>
                </div>

                {/* Biopsy Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Biopsy Taken?</label>
                        <Select
                            value={formData.biopsy}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, biopsy: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="YES">YES</SelectItem>
                                <SelectItem value="NO">NO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Site of Biopsy</label>
                        <AutocompleteInput name="biopsySite" value={formData.biopsySite} onChange={handleInputChange} field="biopsySite" placeholder="e.g. Antrum" disabled={formData.biopsy === 'NO'} />
                    </div>
                </div>

                {/* Endoscopy Findings by Anatomical Location */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">{isLowerEndoscopy ? 'COLONOSCOPY FINDINGS' : 'UPPER ENDOSCOPY FINDINGS'}</h3>
                    <div className="space-y-3">
                        {isLowerEndoscopy ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">INSPECTION AND DIGITO RECTAL EXAMINATION</label>
                                    <AutocompleteTextarea name="dre" value={formData.dre} onChange={handleInputChange} field="dre" placeholder="NO DISCHARGES, NO ULCERS, NO PROLAPSED MUCOSA SEEN. PROSTATE PALPABLE WITHIN NORMAL LIMITS" rows={2} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Anus</label>
                                    <AutocompleteInput name="anus" value={formData.anus} onChange={handleInputChange} field="anus" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rectum</label>
                                    <AutocompleteInput name="rectum" value={formData.rectum} onChange={handleInputChange} field="rectum" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sigmoid</label>
                                    <AutocompleteInput name="sigmoid" value={formData.sigmoid} onChange={handleInputChange} field="sigmoid" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Descending Colon</label>
                                    <AutocompleteInput name="descendingColon" value={formData.descendingColon} onChange={handleInputChange} field="descendingColon" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Splenic Flexure</label>
                                    <AutocompleteInput name="splenicFlexure" value={formData.splenicFlexure} onChange={handleInputChange} field="splenicFlexure" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Transverse Colon</label>
                                    <AutocompleteInput name="transverseColon" value={formData.transverseColon} onChange={handleInputChange} field="transverseColon" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hepatic Flexure</label>
                                    <AutocompleteInput name="hepaticFlexure" value={formData.hepaticFlexure} onChange={handleInputChange} field="hepaticFlexure" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ascending Colon</label>
                                    <AutocompleteInput name="ascendingColon" value={formData.ascendingColon} onChange={handleInputChange} field="ascendingColon" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Caecum</label>
                                    <AutocompleteInput name="caecum" value={formData.caecum} onChange={handleInputChange} field="caecum" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ileo-caecal valve</label>
                                    <AutocompleteInput name="ileoCaecalValve" value={formData.ileoCaecalValve} onChange={handleInputChange} field="ileoCaecalValve" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Oesophagus</label>
                                    <AutocompleteInput name="oesophagusGE" value={formData.oesophagusGE} onChange={handleInputChange} field="oesophagusGE" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">G.E Junction</label>
                                    <AutocompleteInput name="geJunction" value={formData.geJunction} onChange={handleInputChange} field="geJunction" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fundus</label>
                                    <AutocompleteInput name="fundus" value={formData.fundus} onChange={handleInputChange} field="fundus" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Body</label>
                                    <AutocompleteInput name="body" value={formData.body} onChange={handleInputChange} field="body" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Antrum</label>
                                    <AutocompleteInput name="antrum" value={formData.antrum} onChange={handleInputChange} field="antrum" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Pylorus</label>
                                    <AutocompleteInput name="pylorus" value={formData.pylorus} onChange={handleInputChange} field="pylorus" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duodenum (1st Position)</label>
                                    <AutocompleteInput name="d1" value={formData.d1} onChange={handleInputChange} field="d1" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duodenum (2nd Position)</label>
                                    <AutocompleteInput name="d2" value={formData.d2} onChange={handleInputChange} field="d2" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">Additional Findings (Optional)</label>
                            <Textarea name="findings" value={formData.findings} onChange={handleInputChange} rows={2} placeholder="Any other observations..." />
                        </div>
                    </div>
                </div>

                {/* Results - Hide H.Pylori for Lower Endoscopy? Usually not relevant, but keeping layout consistent for now or hiding */}
                {!isLowerEndoscopy && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {formData.testType === 'Stool Antigen Test' ? 'H.pylori Antigen (stool) Test' : 'H.pylori Antigen (HUT) Test'}
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select
                                        value={formData.testType}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, testType: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Test Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HUT Test Result">HUT Test Result</SelectItem>
                                            <SelectItem value="Stool Antigen Test">Stool Antigen Test</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Select
                                        value={formData.testResult}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, testResult: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Result" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="POSITIVE">POSITIVE</SelectItem>
                                            <SelectItem value="NEGATIVE">NEGATIVE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Impression (Full width if no test info) */}
                <div>
                    <label className="block text-sm font-medium mb-1">Impression</label>
                    <AutocompleteInput name="impression" value={formData.impression} onChange={handleInputChange} field="impression" placeholder={isLowerEndoscopy ? "NORMAL COLONOSCOPY" : "H. PYLORI GASTRITIS"} />
                </div>

                {/* Final Comments/Meds - Expandable */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Comments (Expandable)</label>
                        <AutocompleteTextarea name="comments" value={formData.comments} onChange={handleInputChange} field="comments" placeholder={isLowerEndoscopy ? "NO SIGNS SUGGESTIVE OF POLYPS, TUMOURS, FISSURE, AND IBD ETC WERE SEEN." : "MAY BENEFIT FROM PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14 + TAB METRONIDAZOLE 400MG BD X 14 + BISMUTH 240MG BD X 14 + REVIEW UPON COMPLETION OF MEDICATION"} rows={3} />
                    </div>
                </div>

                {/* Amount Charged — admin-only; intentionally never read by PrintReport or the share/PDF path */}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                    <label htmlFor="amount" className="block text-sm font-medium mb-1 text-slate-700">
                        Amount Charged (GH₵) <span className="text-xs font-normal text-slate-400">— internal use only, not shown on the report</span>
                    </label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="e.g. 350.00"
                        className="max-w-xs"
                    />
                </div>

                {/* Doctor Signature — optional; leave blank to sign the printed copy by hand */}
                <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                        Doctor Signature <span className="text-xs font-normal text-slate-400">— optional; leave blank to sign the printed report by hand</span>
                    </label>

                    {signatureLockedByExisting && formData.signatureImage ? (
                        <div className="flex items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.signatureImage} alt="Doctor signature" className="h-20 border rounded-md bg-white" />
                            <Button type="button" variant="outline" size="sm" onClick={handleClearSignature}>
                                Clear & Re-sign
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={signatureMode === 'draw' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSignatureMode('draw')}
                                >
                                    Draw
                                </Button>
                                <Button
                                    type="button"
                                    variant={signatureMode === 'upload' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSignatureMode('upload')}
                                >
                                    Upload Image
                                </Button>
                                <Button
                                    type="button"
                                    variant={signatureMode === 'saved' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSignatureMode('saved')}
                                >
                                    Use Saved
                                </Button>
                            </div>

                            {signatureMode === 'draw' && (
                                <div className="space-y-2">
                                    <div className="border rounded-md bg-white w-fit">
                                        <SignatureCanvas
                                            ref={sigCanvasRef}
                                            penColor="black"
                                            canvasProps={{ width: 350, height: 120, className: 'rounded-md' }}
                                            onEnd={handleSignatureDrawEnd}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleClearCanvas}>
                                        Clear
                                    </Button>
                                </div>
                            )}

                            {signatureMode === 'upload' && (
                                <Input type="file" accept="image/*" onChange={handleSignatureUpload} className="max-w-xs" />
                            )}

                            {signatureMode === 'saved' && (
                                <div className="space-y-2">
                                    {loadingSavedSignatures ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    ) : savedSignatures.length === 0 ? (
                                        <p className="text-xs text-slate-400">No saved signatures yet — draw or upload one, then save it to reuse here.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {savedSignatures.map((signature) => (
                                                <div
                                                    key={signature.id}
                                                    className={`relative border rounded-md p-2 bg-white cursor-pointer hover:border-blue-400 transition-colors ${formData.signatureImage === signature.imageData ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                                                        }`}
                                                    onClick={() => handleSelectSavedSignature(signature)}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${signature.label}`}
                                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteSavedSignature(signature)
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={signature.imageData} alt={signature.label} className="h-12" />
                                                    <p className="text-xs text-center text-slate-600 mt-1">{signature.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.signatureImage && signatureMode !== 'saved' && (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Input
                                        value={newSignatureLabel}
                                        onChange={(e) => setNewSignatureLabel(e.target.value)}
                                        placeholder="Label, e.g. Dr. Adams"
                                        className="max-w-[200px]"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!newSignatureLabel.trim() || savingSignature}
                                        onClick={handleSaveSignatureToLibrary}
                                    >
                                        {savingSignature ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save to Library'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t">
                    <div>
                        {hasChanges && (
                            <span className="text-sm text-amber-600 font-medium">● Unsaved changes</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {isEditing && (
                            <div className="flex gap-3">
                                {onShare && (
                                    <Button type="button" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={handleShareClick} disabled={loading}>
                                        <Share2 className="w-4 h-4 mr-2" /> Share PDF
                                    </Button>
                                )}
                                {onPrint && (
                                    <Button type="button" variant="outline" onClick={handlePrintClick} disabled={loading}>
                                        <Printer className="w-4 h-4 mr-2" /> Print Report
                                    </Button>
                                )}
                            </div>
                        )}
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 text-white" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Report'}
                        </Button>
                    </div>
                </div>
            </form>
        </Card >
    )
}
