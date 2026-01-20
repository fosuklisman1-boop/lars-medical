'use client'

import React from 'react'
// import { Badge } from '@/components/ui/badge' // This import is no longer needed based on the new code

interface PrintReportProps {
    client: any
    report: any
}

export const PrintableReport = React.forwardRef<HTMLDivElement, PrintReportProps>(
    ({ client, report }, ref) => {
        // Format time helper
        const formatTime = (dateString: string | null) => {
            if (!dateString) return ''
            return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
        }

        // Format date helper
        const formatDate = (dateString: string | null) => {
            if (!dateString) return ''
            return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        }

        return (
            <div
                ref={ref}
                className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto print:p-6 print:m-0"
                style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '11px',
                    lineHeight: '1.4'
                }}
            >
                {/* Header with Logo */}
                <div className="text-center mb-4">
                    {/* Logo Circle */}
                    <div className="flex justify-center mb-2">
                        <div
                            className="w-16 h-16 rounded-full border-2 border-cyan-600 flex items-center justify-center"
                            style={{ borderColor: '#0891b2' }}
                        >
                            <span className="text-cyan-600 font-black text-sm" style={{ color: '#0891b2' }}>LMC</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1
                        className="text-2xl font-bold tracking-wide"
                        style={{ color: '#0891b2', letterSpacing: '0.1em' }}
                    >
                        LARS MEDICAL CENTRE
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm font-bold mt-1" style={{ color: '#0891b2' }}>
                        ENDOSCOPY UNIT
                    </p>

                    {/* Address Line 1 */}
                    <p className="text-[9px] mt-2 text-gray-700">
                        <span className="mr-1">◇</span>OPPOSITE VICTORY HARDWARE, SUNYANI-ABESIM ROAD, NEAR TYCO CITY HOTEL, SUNYANI
                    </p>

                    {/* Address Line 2 */}
                    <p className="text-[9px] text-gray-700">
                        P.O.BOX SY 524, SUNYANI, B/R &nbsp;&nbsp; TEL: 0200-638-932 / 0352196970. &nbsp;&nbsp; WORKING HOURS: 24/7
                    </p>

                    {/* Email and GPS */}
                    <p className="text-[9px] text-gray-700">
                        <span className="font-bold">EMAIL:</span> larsmedicalcentre@yahoo.com &nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="font-bold">GPS ADDRESS:</span> BS-0174-2635
                    </p>
                </div>

                {/* Procedure Title */}
                <div className="text-center mb-4">
                    <p className="font-bold underline text-sm">
                        {(report.procedure || 'UPPER ENDOSCOPY').toUpperCase()}
                    </p>
                </div>

                {/* Patient Info Row 1 */}
                <div className="flex gap-4 mb-1 text-[11px]">
                    <div className="flex-1">
                        <span className="font-bold">NAME:</span> <span className="uppercase">{client.name}</span>
                    </div>
                    <div>
                        <span className="font-bold">SEX:</span> {client.sex?.toUpperCase()}
                    </div>
                    <div>
                        <span className="font-bold">AGE:</span> {client.age} YEARS
                    </div>
                </div>

                {/* Patient Info Row 2 */}
                <div className="flex gap-4 mb-2 text-[11px]">
                    <div className="flex-1">
                        <span className="font-bold">REQ. DOC.:</span> {report.refDoctor || 'N/A'}
                    </div>
                    <div>
                        <span className="font-bold">ADDRESS:</span> LMC
                    </div>
                    <div>
                        <span className="font-bold">DATE:</span> {formatDate(report.date || report.createdAt)}
                    </div>
                </div>

                {/* Operation Team */}
                <div className="mb-1 text-[11px]">
                    <span className="font-bold underline">OPERATION TEAM:</span>
                    <div className="ml-4">
                        {Array.isArray(report.operationTeam) && report.operationTeam.length > 0 ? (
                            report.operationTeam.map((member: string, index: number) => (
                                <span key={index} className="mr-6">
                                    {index + 1}. {member}
                                </span>
                            ))
                        ) : (
                            <span>Clinical Staff</span>
                        )}
                    </div>
                </div>

                {/* Time Row */}
                <div className="flex gap-8 mb-1 text-[11px]">
                    <div>
                        <span className="font-bold">TIME STARTED:</span> {formatTime(report.timeStarted) || 'N/A'}
                    </div>
                    <div>
                        <span className="font-bold">TIME ENDED:</span> {formatTime(report.timeEnded) || 'N/A'}
                    </div>
                </div>

                {/* Medication Given */}
                <div className="mb-1 text-[11px]">
                    <span className="font-bold">MEDICATION GIVEN:</span> {report.medicationGiven || 'N/A'}
                </div>

                {/* Content */}
                <div className="mb-1 text-[11px]">
                    <span className="font-bold">CONTENT:</span> <span className="italic">{report.stomachContent || 'EMPTY'}</span>
                </div>

                {/* Instruments Used Row */}
                <div className="flex gap-6 mb-1 text-[11px]">
                    <div>
                        <span className="font-bold">INSTRUMENTS USED:</span> {Array.isArray(report.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report.instrumentsUsed || 'OLYMPUS GIF-IT140')}
                    </div>
                    <div>
                        <span className="font-bold">BIOPSY:</span> {report.biopsy || ''}
                    </div>
                    <div>
                        <span className="font-bold">SITE OF BIOPSY:</span> {report.biopsySite || ''}
                    </div>
                </div>

                {/* Clinical Summary */}
                <div className="mb-2 text-[11px]">
                    <span className="font-bold">CLINICAL SUMMARY:</span> <span className="italic">{report.clinicalSummary || ''}</span>
                </div>

                {/* Findings Header */}
                <div className="mb-2">
                    <p className="font-bold underline text-[11px]">
                        {(report.procedure || 'UPPER ENDOSCOPY').toUpperCase()} FINDINGS:
                    </p>
                </div>

                {/* Anatomical Findings */}
                <div className="mb-4 text-[11px] space-y-1">
                    {report.oesophagusGE && (
                        <p><span className="font-bold">Oesophagus AND G.E junction:</span> {report.oesophagusGE}</p>
                    )}
                    {report.fundus && (
                        <p><span className="font-bold">Fundus:</span> {report.fundus}</p>
                    )}
                    {report.body && (
                        <p><span className="font-bold">Body:</span> {report.body}</p>
                    )}
                    {report.antrum && (
                        <p><span className="font-bold">Antrum:</span> {report.antrum}</p>
                    )}
                    {report.pylorus && (
                        <p><span className="font-bold">Pylorus:</span> {report.pylorus}</p>
                    )}
                    {report.duodenum && (
                        <>
                            <p className="font-bold mt-2">DUODENUM:</p>
                            <p><span className="font-bold">1st & 2nd Position:</span> {report.duodenum}</p>
                        </>
                    )}
                    {report.findings && (
                        <p className="mt-2 whitespace-pre-wrap">{report.findings}</p>
                    )}
                </div>

                {/* HUT Test */}
                <div className="mb-2 text-[11px]">
                    <span className="font-bold">(HUT – TEST)</span> Test: <span className="font-bold">{report.hutTestResult || 'N/A'}</span>
                </div>

                {/* Impression */}
                <div className="mb-3 text-[11px]">
                    <span className="font-bold">IMPRESSION:</span> <span className="font-bold">{report.impression || 'N/A'}</span>
                </div>

                {/* Comments / Prescription */}
                <div className="mb-8 text-[11px]">
                    <span className="font-bold">COMMENTS:</span> {report.comments || report.medication || 'N/A'}
                </div>

                {/* Doctor Signature */}
                <div className="text-right mt-12 text-[11px]">
                    <p className="font-bold">{report.refDoctor || 'DR. M. S. ADAMS'}</p>
                </div>
            </div>
        )
    }
)

PrintableReport.displayName = 'PrintableReport'
