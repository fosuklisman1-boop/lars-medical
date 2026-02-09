'use client'

import React from 'react'
// import { Badge } from '@/components/ui/badge' // This import is no longer needed based on the new code

import { Client, MedicalReport } from '@/types'

const DEFAULT_FINDINGS = {
    // Upper Endoscopy Defaults
    oesophagusGE: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    geJunction: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    fundus: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    body: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    antrum: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    pylorus: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    d1: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    d2: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    duodenum: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',

    // Lower Endoscopy Defaults
    dre: 'NO DISCHARGES, NO ULCERS, NO PROLAPSED MUCOSA SEEN. PROSTATE PALPABLE WITHIN NORMAL LIMITS',
    anus: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    rectum: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    sigmoid: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    descendingColon: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    splenicFlexure: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    transverseColon: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    hepaticFlexure: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    ascendingColon: 'NORMAL LOOKING MUCOSA. NO SUSPICIOUS LESIONS SEEN',
    caecum: 'NOT EXAMINED',
    ileoCaecalValve: 'NOT EXAMINED',
}

interface PrintReportProps {
    client: Client
    report: MedicalReport
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

        // Check if finding matches default (case insensitive trim)
        // If it matches default -> Normal text
        // If it differs -> Bold Italic
        const getFindingStyle = (value: string | null | undefined, defaultKey: keyof typeof DEFAULT_FINDINGS) => {
            if (!value) return ''
            const normalizedValue = value.trim().toUpperCase()
            const normalizedDefault = DEFAULT_FINDINGS[defaultKey].trim().toUpperCase()

            // If they are equal, return normal style (empty string)
            // If they differ, return bold italic
            return normalizedValue === normalizedDefault ? '' : 'font-bold italic'
        }

        return (
            <div
                ref={ref}
                className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto print:px-6 print:pb-6 print:pt-10 print:m-0"
                style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.4'
                }}
            >
                {/* Header with Logo */}
                {/* Header matching image layout */}
                <div className="mb-6 font-sans">
                    {/* Top Row: Logo Left, Title Center/Right */}
                    <div className="flex items-center justify-center gap-6 mb-3 relative">
                        {/* Logo Box - Absolute leftish or just flex */}
                        <div className="w-20 h-20 border-2 border-cyan-800 flex items-center justify-center p-0.5 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.jpg" alt="LMC Logo" className="w-full h-full object-contain" />
                        </div>

                        {/* Title Block */}
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-wider leading-none mb-1">
                                <span style={{ color: '#DC2626' }}>LARS</span> <span style={{ color: '#0891b2' }}>MEDICAL CENTRE</span>
                            </h1>
                            <p className="text-sm font-bold tracking-widest" style={{ color: 'black' }}>
                                ENDOSCOPY UNIT
                            </p>
                        </div>
                    </div>

                    {/* Address Lines - Compact & Centered */}
                    {/* Address Lines - Compact & Centered */}
                    <div className="text-center text-[16px] font-bold text-black leading-tight space-y-1">
                        <p>
                            OPPOSITE VICTORY HARDWARE, SUNYANI-ABESIM ROAD, NEAR TYCO CITY HOTEL, SUNYANI
                        </p>
                        <p>
                            P.O.BOX SY 524, SUNYANI, B/R &nbsp;&nbsp; TEL: 0200-638-932 / 0352196970. &nbsp;&nbsp; WORKING HOURS: 24/7
                        </p>
                        <p>
                            <span className="text-blue-900">EMAIL: larsmedicalcentre@yahoo.com</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            <span className="text-red-600">GPS ADDRESS: BS-0174-2635</span>
                        </p>
                    </div>
                </div>

                {/* Procedure Title */}
                <div className="text-center mb-4">
                    <p className="font-bold underline text-[16px]">
                        {(report.procedure || 'UPPER ENDOSCOPY').toUpperCase()}
                    </p>
                </div>

                {/* Patient Info Grid - Aligned perfectly like the image */}
                <div className="grid grid-cols-12 gap-y-1 text-[16px] mb-2 uppercase tracking-tight">
                    {/* Row 1 */}
                    <div className="col-span-6 flex">
                        <span className="w-[60px] shrink-0">NAME:</span>
                        <span className="font-bold">{client.name}</span>
                    </div>
                    <div className="col-span-3 flex">
                        <span className="w-[50px] shrink-0">SEX:</span>
                        <span className="font-bold">{client.sex}</span>
                    </div>
                    <div className="col-span-3 flex">
                        <span className="w-[50px] shrink-0">AGE:</span>
                        <span className="font-bold">{client.age} YEARS</span>
                    </div>

                    {/* Row 2 */}
                    <div className="col-span-6 flex items-start">
                        <span className="w-[100px] shrink-0 whitespace-nowrap">REQ. DOC.:</span>
                        <span className="font-bold">{report.refDoctor || client.refDoctor || 'N/A'}</span>
                    </div>
                    <div className="col-span-3 flex items-center">
                        <span className="w-[90px] shrink-0 whitespace-nowrap">ADDRESS:</span>
                        <span className="font-bold">{client.address || 'N/A'}</span>
                    </div>
                    <div className="col-span-3 flex">
                        <span className="w-[60px] shrink-0">DATE:</span>
                        <span className="font-bold">{formatDate(report.date || report.createdAt || null)}</span>
                    </div>
                </div>

                {/* Operation Team */}
                <div className="mb-1 text-[16px]">
                    <span className="underline">OPERATION TEAM:</span>
                    <div className="ml-4">
                        {/* Try report first, then client, then default */}
                        {Array.isArray(report.operationTeam) && report.operationTeam.length > 0 ? (
                            report.operationTeam.map((member: string, index: number) => (
                                <span key={index} className="mr-6">
                                    {index + 1}. {member}
                                </span>
                            ))
                        ) : Array.isArray(client.operationTeam) && client.operationTeam.length > 0 ? (
                            client.operationTeam.map((member: string, index: number) => (
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
                <div className="flex gap-8 mb-1 text-[16px]">
                    <div>
                        <span>TIME STARTED:</span> <span className="font-bold">{formatTime(report.timeStarted || null) || 'N/A'}</span>
                    </div>
                    <div>
                        <span>TIME ENDED:</span> <span className="font-bold">{formatTime(report.timeEnded || null) || 'N/A'}</span>
                    </div>
                </div>

                {/* Medication Given */}
                <div className="mb-1 text-[16px]">
                    <span>MEDICATION GIVEN:</span> <span className="font-bold">{report.medicationGiven || 'N/A'}</span>
                </div>

                {/* Content - Hide for Colonoscopy typically, but requested image didn't show it explicitly. However, keeping it consistent or hiding if null */}
                {(report.procedure !== 'LOWER ENDOSCOPY') && (
                    <div className="mb-1 text-[16px]">
                        <span>STOMACH CONTENT:</span> <span className={`uppercase ${report.stomachContent?.trim().toUpperCase() === 'EMPTY' ? '' : 'font-bold italic'}`}>{report.stomachContent || 'EMPTY'}</span>
                    </div>
                )}

                {/* Instruments Used Row */}
                <div className="mb-1 text-[16px]">
                    <div className="flex gap-6">
                        <span>INSTRUMENTS USED:</span>
                        <div>
                            <span>BIOPSY:</span> <span className="font-bold italic">{report.biopsy || ''}</span>
                        </div>
                        <div>
                            <span>SITE OF BIOPSY:</span> <span className="font-bold italic">{report.biopsySite || ''}</span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <span>{Array.isArray(report.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report.instrumentsUsed || 'OLYMPUS GIF-IT140')}</span>
                    </div>
                </div>

                {/* Clinical Summary */}
                <div className="mb-2 text-[16px]">
                    <span>CLINICAL SUMMARY:</span> <span className="font-bold italic">{report.clinicalSummary || client.clinicalSummary || ''}</span>
                </div>

                {/* Findings Header */}
                <div className="mb-2">
                    <p className="underline text-[16px]">
                        {report.procedure === 'LOWER ENDOSCOPY' ? 'COLONOSCOPY FINDINGS:' : ((report.procedure || 'UPPER ENDOSCOPY').toUpperCase() + ' FINDINGS:')}
                    </p>
                </div>

                {/* Anatomical Findings */}
                <div className="mb-4 text-[16px] space-y-1">
                    {report.procedure === 'LOWER ENDOSCOPY' ? (
                        <>
                            {/* Lower Endoscopy Fields */}
                            {report.dre && (
                                <p className="mb-2"><span className="uppercase">INSPECTION AND DIGITO RECTAL EXAMINATION:</span> <span className={`uppercase ${getFindingStyle(report.dre, 'dre')}`}>{report.dre}</span></p>
                            )}
                            {report.anus && (
                                <p><span>Anus:</span> <span className={`uppercase ${getFindingStyle(report.anus, 'anus')}`}>{report.anus}</span></p>
                            )}
                            {report.rectum && (
                                <p><span>Rectum:</span> <span className={`uppercase ${getFindingStyle(report.rectum, 'rectum')}`}>{report.rectum}</span></p>
                            )}
                            {report.sigmoid && (
                                <p><span>Sigmoid:</span> <span className={`uppercase ${getFindingStyle(report.sigmoid, 'sigmoid')}`}>{report.sigmoid}</span></p>
                            )}
                            {report.descendingColon && (
                                <p><span>Descending:</span> <span className={`uppercase ${getFindingStyle(report.descendingColon, 'descendingColon')}`}>{report.descendingColon}</span></p>
                            )}
                            {report.splenicFlexure && (
                                <p><span>Splenic flexure:</span> <span className={`uppercase ${getFindingStyle(report.splenicFlexure, 'splenicFlexure')}`}>{report.splenicFlexure}</span></p>
                            )}
                            {report.transverseColon && (
                                <p><span>Transverse:</span> <span className={`uppercase ${getFindingStyle(report.transverseColon, 'transverseColon')}`}>{report.transverseColon}</span></p>
                            )}
                            {report.hepaticFlexure && (
                                <p><span>Hepatic flexure:</span> <span className={`uppercase ${getFindingStyle(report.hepaticFlexure, 'hepaticFlexure')}`}>{report.hepaticFlexure}</span></p>
                            )}
                            {report.ascendingColon && (
                                <p><span>Ascending:</span> <span className={`uppercase ${getFindingStyle(report.ascendingColon, 'ascendingColon')}`}>{report.ascendingColon}</span></p>
                            )}
                            {report.caecum && (
                                <p><span>Caecum:</span> <span className={`uppercase ${getFindingStyle(report.caecum, 'caecum')}`}>{report.caecum}</span></p>
                            )}
                            {report.ileoCaecalValve && (
                                <p><span>Ileo-caecal valve:</span> <span className={`uppercase ${getFindingStyle(report.ileoCaecalValve, 'ileoCaecalValve')}`}>{report.ileoCaecalValve}</span></p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Upper Endoscopy Fields */}
                            {report.oesophagusGE && (
                                <p><span>Oesophagus and G.E junction:</span> <span className={getFindingStyle(report.oesophagusGE, 'oesophagusGE')}>{report.oesophagusGE}</span></p>
                            )}
                            {(report.geJunction && !report.oesophagusGE) && (
                                <p><span>G.E Junction:</span> <span className={getFindingStyle(report.geJunction, 'geJunction')}>{report.geJunction}</span></p>
                            )}
                            {report.fundus && (
                                <p><span>Fundus:</span> <span className={getFindingStyle(report.fundus, 'fundus')}>{report.fundus}</span></p>
                            )}
                            {report.body && (
                                <p><span>Body:</span> <span className={getFindingStyle(report.body, 'body')}>{report.body}</span></p>
                            )}
                            {report.antrum && (
                                <p><span>Antrum:</span> <span className={getFindingStyle(report.antrum, 'antrum')}>{report.antrum}</span></p>
                            )}
                            {report.pylorus && (
                                <p><span>Pylorus:</span> <span className={getFindingStyle(report.pylorus, 'pylorus')}>{report.pylorus}</span></p>
                            )}
                            {(report.d1 || report.d2 || report.duodenum) && (
                                <>
                                    <p className="mt-2">DUODENUM:</p>
                                    {report.d1 && <p><span>1st Position:</span> <span className={getFindingStyle(report.d1, 'd1')}>{report.d1}</span></p>}
                                    {report.d2 && <p><span>2nd Position:</span> <span className={getFindingStyle(report.d2, 'd2')}>{report.d2}</span></p>}
                                    {/* Fallback for legacy data */}
                                    {!report.d1 && !report.d2 && report.duodenum && (
                                        <p><span>1st & 2nd Position:</span> <span className={getFindingStyle(report.duodenum, 'duodenum')}>{report.duodenum}</span></p>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {report.findings && (
                        <p className="mt-2 whitespace-pre-wrap">{report.findings}</p>
                    )}
                </div>

                {/* HUT / Antigen Test - Hide for Colonoscopy */}
                {report.procedure !== 'LOWER ENDOSCOPY' && (
                    <div className="mb-2 text-[16px]">
                        {report.testType && report.testResult ? (
                            <p>
                                <span>{report.testType === 'Stool Antigen Test' ? 'H.pylori Antigen (stool) Test' : 'H.pylori Antigen (HUT) Test'}:</span> <span className="font-bold italic uppercase">{report.testResult}</span>
                            </p>
                        ) : (
                            <p><span>(HUT - TEST) Test:</span> <span className="font-bold italic uppercase">{report.hutTestResult ? String(report.hutTestResult).replace(/\(HUT - TEST\) Test:/i, '').replace(/\(STOOL ANTIGEN\) Test:/i, '').trim() : 'PENDING'}</span></p>
                        )}
                    </div>
                )}

                {/* Impression */}
                <div className="mb-3 text-[16px]">
                    <span>IMPRESSION:</span> <span className="font-bold italic">{report.impression || 'N/A'}</span>
                </div>

                {/* Comments */}
                <div className="mb-4 text-[16px]">
                    <span>COMMENTS:</span> <span className="font-bold italic uppercase">{report.comments || 'N/A'}</span>
                </div>

                {/* Medication - Explicitly separate - Hide for Lower Endoscopy */}


                {/* Doctor Signature */}
                <div className="text-right mt-12 text-[16px]">
                    <p className="font-bold">DR. M. S. ADAMS</p>
                </div>
            </div>
        )
    }
)

PrintableReport.displayName = 'PrintableReport'
