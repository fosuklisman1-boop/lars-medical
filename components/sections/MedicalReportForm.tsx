'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { AutocompleteTextarea } from '@/components/ui/autocomplete-textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Printer } from 'lucide-react'
import { Client, MedicalReport } from '@/types'

interface MedicalReportFormProps {
    client: Client
    report?: MedicalReport // Optional: if provided, we are editing. If not, creating.
    onSave: (report: MedicalReport) => void
    onCancel: () => void
    onPrint?: (report: MedicalReport) => void // Optional print callback
}

export function MedicalReportForm({ client, report, onSave, onCancel, onPrint }: MedicalReportFormProps) {
    const [loading, setLoading] = useState(false)
    const isEditing = !!report

    const [formData, setFormData] = useState({
        refDoctor: report?.refDoctor || '',
        procedure: report?.procedure || 'UPPER ENDOSCOPY',
        operationTeam: Array.isArray(report?.operationTeam) ? report.operationTeam.join(', ') : (report?.operationTeam || ''),
        timeStarted: report?.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '',
        timeEnded: report?.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '',
        medicationGiven: report?.medicationGiven || '',
        stomachContent: report?.stomachContent || 'EMPTY',
        instrumentsUsed: Array.isArray(report?.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report?.instrumentsUsed || 'OLYMPUS GIF-IT140'),
        clinicalSummary: report?.clinicalSummary || '',
        biopsy: report?.biopsy || 'NO',
        biopsySite: report?.biopsySite || '',
        // Anatomical Findings
        oesophagusGE: report?.oesophagusGE || '',
        geJunction: report?.geJunction || '',
        fundus: report?.fundus || '',
        body: report?.body || '',
        antrum: report?.antrum || '',
        pylorus: report?.pylorus || '',
        d1: report?.d1 || '',
        d2: report?.d2 || '',
        duodenum: report?.duodenum || '',
        findings: report?.findings || '',
        hutTestResult: report?.hutTestResult || '',
        impression: report?.impression || '',
        comments: report?.comments || '',
        medication: report?.medication || '',
        testType: report?.testType || (report?.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
        testResult: report?.testResult || (report?.hutTestResult?.split(': ')[1] || report?.hutTestResult || ''),
    })

    // Update form when report prop changes (e.g. after save)
    useMemo(() => {
        if (report) {
            setFormData({
                refDoctor: report.refDoctor || '',
                procedure: report.procedure || 'UPPER ENDOSCOPY',
                operationTeam: Array.isArray(report.operationTeam) ? report.operationTeam.join(', ') : (report.operationTeam || ''),
                timeStarted: report.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '',
                timeEnded: report.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '',
                medicationGiven: report.medicationGiven || '',
                stomachContent: report.stomachContent || 'EMPTY',
                instrumentsUsed: Array.isArray(report.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report.instrumentsUsed || 'OLYMPUS GIF-IT140'),
                clinicalSummary: report.clinicalSummary || '',
                biopsy: report.biopsy || 'NO',
                biopsySite: report.biopsySite || '',
                oesophagusGE: report.oesophagusGE || '',
                geJunction: report.geJunction || '',
                fundus: report.fundus || '',
                body: report.body || '',
                antrum: report.antrum || '',
                pylorus: report.pylorus || '',
                d1: report.d1 || '',
                d2: report.d2 || '',
                duodenum: report.duodenum || '',
                findings: report.findings || '',
                hutTestResult: report.hutTestResult || '',
                impression: report.impression || '',
                comments: report.comments || '',
                medication: report.medication || '',
                testType: report.testType || (report.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
                testResult: report.testResult || (report.hutTestResult?.split(': ')[1] || report.hutTestResult || ''),
            });
        }
    }, [report]);

    // Original form data for comparison (memoized)
    const originalFormData = useMemo(() => ({
        refDoctor: report?.refDoctor || '',
        procedure: report?.procedure || 'UPPER ENDOSCOPY',
        operationTeam: Array.isArray(report?.operationTeam) ? report.operationTeam.join(', ') : (report?.operationTeam || ''),
        timeStarted: report?.timeStarted ? new Date(report.timeStarted).toTimeString().substring(0, 5) : '',
        timeEnded: report?.timeEnded ? new Date(report.timeEnded).toTimeString().substring(0, 5) : '',
        medicationGiven: report?.medicationGiven || '',
        stomachContent: report?.stomachContent || 'EMPTY',
        instrumentsUsed: Array.isArray(report?.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report?.instrumentsUsed || 'OLYMPUS GIF-IT140'),
        clinicalSummary: report?.clinicalSummary || '',
        biopsy: report?.biopsy || 'NO',
        biopsySite: report?.biopsySite || '',
        oesophagusGE: report?.oesophagusGE || '',
        geJunction: report?.geJunction || '',
        fundus: report?.fundus || '',
        body: report?.body || '',
        antrum: report?.antrum || '',
        pylorus: report?.pylorus || '',
        d1: report?.d1 || '',
        d2: report?.d2 || '',
        duodenum: report?.duodenum || '',
        findings: report?.findings || '',
        hutTestResult: report?.hutTestResult || '',
        impression: report?.impression || '',
        comments: report?.comments || '',
        medication: report?.medication || '',
        testType: report?.testType || (report?.hutTestResult?.includes('Stool') ? 'Stool Antigen Test' : 'HUT Test Result'),
        testResult: report?.testResult || (report?.hutTestResult?.split(': ')[1] || report?.hutTestResult || ''),
    }), [report])

    // Check if form has unsaved changes
    const hasChanges = useMemo(() => {
        return JSON.stringify(formData) !== JSON.stringify(originalFormData)
    }, [formData, originalFormData])

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Process payload with defaults for empty fields
            const payload = {
                ...formData,
                // Use placeholders if empty (trimmed check)
                stomachContent: formData.stomachContent?.trim() || 'EMPTY',
                instrumentsUsed: (formData.instrumentsUsed?.trim() ? formData.instrumentsUsed.split(',').map((s: string) => s.trim()).filter(Boolean) : ['OLYMPUS GIF-IT140']),

                // New Fields directly (SQL schema updated)
                testType: formData.testType || 'HUT Test Result',
                testResult: formData.testResult || 'PENDING',
                hutTestResult: `(${formData.testType === 'HUT Test Result' ? 'HUT - TEST' : 'STOOL ANTIGEN'}) Test: ${formData.testResult || 'PENDING'}`, // Keep for backward compatibility/display backup

                // Anatomical defaults
                oesophagusGE: formData.oesophagusGE?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                geJunction: formData.geJunction?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                fundus: formData.fundus?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                body: formData.body?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                antrum: formData.antrum?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                pylorus: formData.pylorus?.trim() || 'SCANTY SUPERFICIAL ERYTHEMATOUS LESIONS SEEN',
                d1: formData.d1?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                d2: formData.d2?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
                // duodenum: formData.duodenum?.trim() || 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',

                // Assessment & Plan
                impression: formData.impression?.trim() || 'H. PYLORI GASTRITIS',
                comments: formData.comments?.trim() || 'MAY BENEFIT FROM PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14 + TAB METRONIDAZOLE 400MG BD X 14 + BISMUTH 240MG BD X 14 + REVIEW UPON COMPLETION OF MEDICATION',
                medication: formData.medication?.trim() || 'PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14 + TAB METRONIDAZOLE 400MG BD X 14 + BISMUTH 240MG BD X 14',

                // Procedure Info Defaults
                refDoctor: formData.refDoctor?.trim() || 'DR. M. S. ADAMS',
                clinicalSummary: formData.clinicalSummary?.trim() || 'EPIGASTRIC PAIN THAT RADIATE TO THE BACK',
                biopsy: formData.biopsy || 'NO',
                biopsySite: formData.biopsySite?.trim() || '',
                medicationGiven: formData.medicationGiven?.trim() || 'INJ. DORMICUM, PROPOFOL AND BUSCOPAN',

                operationTeam: (formData.operationTeam?.trim() ? formData.operationTeam : 'DR M. S. ADAMS, DR KWARTENG W., GLADYS ABEDU, ABIGAIL OPPONG').split(',').map((s: string) => s.trim()).filter(Boolean),
                timeStarted: formData.timeStarted ? new Date(`${new Date().toDateString()} ${formData.timeStarted}`).toISOString() : null,
                timeEnded: formData.timeEnded ? new Date(`${new Date().toDateString()} ${formData.timeEnded}`).toISOString() : null,
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

    return (
        <Card className="p-8 mt-6">
            <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit' : 'New'} Medical Report</h2>
            <p className="text-sm text-slate-500 mb-6">💡 Fields will show suggestions from previous reports as you type</p>

            <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Procedure Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Referring Doctor</label>
                        <AutocompleteInput name="refDoctor" value={formData.refDoctor} onChange={handleInputChange} field="refDoctor" placeholder="DR. M. S. ADAMS" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure</label>
                        <AutocompleteInput name="procedure" value={formData.procedure} onChange={handleInputChange} field="procedure" placeholder="E.g. Upper Endoscopy" />
                    </div>
                </div>

                {/* Team & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Operation Team (comma separated)</label>
                        <Input name="operationTeam" value={formData.operationTeam} onChange={handleInputChange} placeholder="DR M. S. ADAMS, DR KWARTENG W., GLADYS ABEDU, ABIGAIL OPPONG..." />
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
                        <div>
                            <label className="block text-sm font-medium mb-1">Stomach Content</label>
                            <AutocompleteInput name="stomachContent" value={formData.stomachContent} onChange={handleInputChange} field="stomachContent" placeholder="EMPTY" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Instruments Used (comma separated)</label>
                        <AutocompleteInput name="instrumentsUsed" value={formData.instrumentsUsed} onChange={handleInputChange} field="instrumentsUsed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Clinical Summary</label>
                        <AutocompleteInput name="clinicalSummary" value={formData.clinicalSummary} onChange={handleInputChange} field="clinicalSummary" placeholder="EPIGASTRIC PAIN THAT RADIATE TO THE BACK" />
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
                    <h3 className="text-lg font-bold mb-4 text-blue-700">ENDOSCOPY FINDINGS</h3>
                    <div className="space-y-3">
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
                            <AutocompleteInput name="pylorus" value={formData.pylorus} onChange={handleInputChange} field="pylorus" placeholder="SCANTY SUPERFICIAL ERYTHEMATOUS LESIONS SEEN" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duodenum (1st Position)</label>
                            <AutocompleteInput name="d1" value={formData.d1} onChange={handleInputChange} field="d1" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duodenum (2nd Position)</label>
                            <AutocompleteInput name="d2" value={formData.d2} onChange={handleInputChange} field="d2" placeholder="NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Additional Findings (Optional)</label>
                            <Textarea name="findings" value={formData.findings} onChange={handleInputChange} rows={2} placeholder="Any other observations..." />
                        </div>
                    </div>
                </div>

                {/* Results */}
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
                    <div>
                        <label className="block text-sm font-medium mb-1">Impression</label>
                        <AutocompleteInput name="impression" value={formData.impression} onChange={handleInputChange} field="impression" placeholder="H. PYLORI GASTRITIS" />
                    </div>
                </div>

                {/* Final Comments/Meds - Expandable */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Comments (Expandable)</label>
                        <AutocompleteTextarea name="comments" value={formData.comments} onChange={handleInputChange} field="comments" placeholder="MAY BENEFIT FROM PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14 + TAB METRONIDAZOLE 400MG BD X 14 + BISMUTH 240MG BD X 14 + REVIEW UPON COMPLETION OF MEDICATION" rows={3} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Prescribed Medication (Expandable)</label>
                        <AutocompleteTextarea name="medication" value={formData.medication} onChange={handleInputChange} field="medication" placeholder="PANTOPRAZOLE 20MG BD X 14 + CAPS TETRACYCLINE 500MG BD X 14..." rows={2} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t">
                    <div>
                        {hasChanges && (
                            <span className="text-sm text-amber-600 font-medium">● Unsaved changes</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {isEditing && onPrint && (
                            <Button type="button" variant="outline" onClick={handlePrintClick} disabled={loading}>
                                <Printer className="w-4 h-4 mr-2" /> Print Report
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 text-white" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Report'}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    )
}
