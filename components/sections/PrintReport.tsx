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

        // Determine font size based on text length to prevent wrapping
        const getValueSize = (value: string | null | undefined) => {
            const length = value?.length || 0
            if (length > 50) return 'text-[13px]'
            if (length > 35) return 'text-[14px]'
            return '' // Use parent size (16px)
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
                {/* Letterhead selection */}
                {report.letterhead === 'ADAMS' ? (
                    /* AdamsWastl Healthcity Limited Header */
                    <div className="mb-4 font-sans text-center">
                        <div className="flex items-start justify-between mb-2">
                            {/* Logo */}
                            <div className="w-40 h-28 shrink-0 flex items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/awh_logo.png" alt="AWH Logo" className="w-full h-full object-contain" />
                            </div>

                            {/* Center Content */}
                            <div className="flex-1 pt-4">
                                <h1 className="text-3xl font-bold tracking-tight mb-0 border-b-2 border-black inline-block">
                                    ADAMSWASLT HEALTHCITY LIMITED
                                </h1>
                                <p className="text-2xl italic mt-1" style={{ color: '#dc2626', fontFamily: "'Brush Script MT', cursive, 'Apple Chancery', 'Segoe Script', 'Comic Sans MS'" }}>
                                    Best Care for a Healthy Life
                                </p>
                                <div className="mt-0.5 text-[13px] font-bold">
                                    <div className="flex justify-center flex-wrap gap-x-6">
                                        <span className="text-slate-700">P O BOX KQ 26, KENYASI</span>
                                        <span style={{ color: '#dc2626' }}>Email: adamswastlhealthcity@gmail.com</span>
                                    </div>
                                    <p className="mt-0.5">
                                        Tel: 0322190828 / 0248666208
                                    </p>
                                </div>
                            </div>

                            {/* Right Side 'H' */}
                            <div className="w-16 h-[110px] border-[3px] border-red-600 rounded-[40px] flex items-center justify-center shrink-0 mt-4 -mb-8 relative z-10 bg-white">
                                <span className="text-4xl font-bold text-red-600">H</span>
                            </div>
                        </div>

                        {/* Triple Border */}
                        <div className="flex w-full h-1.5 mb-2">
                            <div className="w-1/4 bg-red-600 h-full"></div>
                            <div className="w-1/2 bg-green-700 h-full"></div>
                            <div className="w-1/4 bg-blue-700 h-full"></div>
                        </div>

                        {/* Endoscopy Unit Title */}
                        <div className="mb-2">
                            <h2 className="text-4xl font-extrabold tracking-widest" style={{ color: '#1e40af' }}>
                                ENDOSCOPY UNIT
                            </h2>
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-bold border-b border-black inline-block uppercase tracking-tight">
                                GASTROINTESTINAL ENDOSCOPY RECORD ({report.procedure?.includes('UPPER') ? 'UPPER GI' : 'LOWER GI'})
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Lars Medical Centre Header (Default) */
                    <div className="mb-6 font-sans">
                        {/* Top Row: Logo Left, Title Center/Right */}
                        <div className="flex items-center justify-center gap-6 mb-3 relative">
                            {/* Logo Box - Absolute leftish or just flex */}
                            <div className="w-20 h-20 border-2 flex items-center justify-center p-0.5 shrink-0" style={{ borderColor: '#155e75' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo.jpg" alt="LMC Logo" className="w-full h-full object-contain" />
                            </div>

                            {/* Title Block */}
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold tracking-wider leading-none mb-1">
                                    <span style={{ color: '#DC2626' }}>LARS</span> <span style={{ color: '#0891b2' }}>MEDICAL CENTRE</span>
                                </h1>
                                <p className="text-sm font-bold tracking-widest uppercase" style={{ color: 'black' }}>
                                    ENDOSCOPY UNIT
                                </p>
                            </div>
                        </div>

                        {/* Address Lines - Compact & Centered */}
                        <div className="text-center text-[16px] font-bold text-black leading-tight space-y-1">
                            <p>
                                OPPOSITE VICTORY HARDWARE, SUNYANI-ABESIM ROAD, NEAR TYCO CITY HOTEL, SUNYANI
                            </p>
                            <p>
                                P.O.BOX SY 524, SUNYANI, B/R &nbsp;&nbsp; TEL: 0200-638-932 / 0352196970. &nbsp;&nbsp; WORKING HOURS: 24/7
                            </p>
                            <p>
                                <span style={{ color: '#1e3a8a' }}>EMAIL: larsmedicalcentre@yahoo.com</span> &nbsp;&nbsp;&nbsp;&nbsp;
                                <span style={{ color: '#dc2626' }}>GPS ADDRESS: BS-0174-2635</span>
                            </p>
                        </div>

                        {/* Lars Title Line */}
                        <div className="text-center mt-4">
                            <h2 className="text-xl font-bold border-b-2 border-black inline-block uppercase tracking-widest">
                                {(report.procedure || 'UPPER ENDOSCOPY').toUpperCase()}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Patient Info Grid - Exact Image Match */}
                <div className="grid grid-cols-12 gap-y-0.5 text-[15px] mb-2 uppercase tracking-tight font-bold">
                    {/* Row 1 */}
                    <div className="col-span-12 flex justify-between">
                        <div className="flex gap-2">
                            <span className="shrink-0">NAME:</span>
                            <span className="font-bold">{client.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="shrink-0">SEX:</span>
                            <span className="font-bold">{client.sex}</span>
                        </div>
                        <div className="flex gap-2 w-1/4">
                            <span className="shrink-0">AGE:</span>
                            <span className="font-bold">{client.age} YRS</span>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="col-span-12 flex justify-between">
                        <div className="flex gap-2">
                            <span className="shrink-0">REQUESTING DOCTOR:</span>
                            <span className="font-bold">{report.refDoctor || client.refDoctor || 'SELF'}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="shrink-0">ADDRESS:</span>
                            <span className="font-bold">{client.address || 'AWH, KENYASI'}</span>
                        </div>
                        <div className="flex gap-2 w-1/4">
                            <span className="shrink-0">DATE:</span>
                            <span className="font-bold">{formatDate(report.date || report.createdAt || null)}</span>
                        </div>
                    </div>
                </div>

                {/* Operation Team & Times */}
                <div className="text-[15px] font-bold space-y-0.5 mb-2">
                    <div>
                        <span className="uppercase">OPERATION TEAM:</span>
                        <div className="flex flex-wrap gap-x-8 mt-0.5">
                            {(() => {
                                const team = Array.isArray(report.operationTeam) && report.operationTeam.length > 0
                                    ? report.operationTeam
                                    : Array.isArray(client.operationTeam) && client.operationTeam.length > 0
                                        ? client.operationTeam
                                        : ['DR. M. S. ADAMS', 'DR. M. BOMTOH', 'MR. J. AFRAM', 'SIS. PRISCILLA K. OSEI'];

                                return team.map((member, idx) => (
                                    <span key={idx} className="uppercase">{idx + 1}. {member}</span>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="flex gap-x-12 uppercase">
                        <div>
                            <span>TIME STARTED:</span> <span className="font-bold">{formatTime(report.timeStarted || null) || '9:00 AM'}</span>
                        </div>
                        <div>
                            <span>TIME ENDED:</span> <span className="font-bold">{formatTime(report.timeEnded || null) || '9:15 AM'}</span>
                        </div>
                    </div>

                    <div className="flex gap-x-12 uppercase">
                        <div className="flex gap-1">
                            <span>MEDICATION GIVEN:</span> <span className="font-bold">{report.medicationGiven || 'INJ. DORMICUM AND BUSCOPAN'}</span>
                        </div>
                        <div className="flex gap-1">
                            <span>STOMACH CONTENT:</span> <span className="font-bold italic">{report.stomachContent || 'EMPTY'}</span>
                        </div>
                    </div>

                    <div className="flex gap-x-8 uppercase">
                        <div className="flex gap-1">
                            <span>INSTRUMENT USED:</span> <span className="font-bold">{Array.isArray(report.instrumentsUsed) ? report.instrumentsUsed.join(', ') : (report.instrumentsUsed || 'OLYMPUS GIF-1T140')}</span>
                        </div>
                        <div className="flex gap-1">
                            <span>BIOPSY:</span> <span className="font-bold italic">{report.biopsy || 'YES'}</span>
                        </div>
                        <div className="flex gap-1">
                            <span>SITE OF BIOPSY:</span> <span className="font-bold italic">{report.biopsySite || 'GASTRIC MUCOSA'}</span>
                        </div>
                    </div>

                    <div className="flex gap-1 uppercase">
                        <span>CLINICAL SUMMARY:</span> <span className="font-bold">{report.clinicalSummary || client.clinicalSummary || 'PUD'}</span>
                    </div>
                </div>

                {/* Findings Header */}
                <div className="mb-2">
                    <p className="underline text-[15px] font-bold">
                        {report.procedure === 'LOWER ENDOSCOPY' ? 'COLONOSCOPY FINDINGS:' : ((report.procedure || 'UPPER ENDOSCOPY').toUpperCase() + ' FINDINGS:')}
                    </p>
                </div>

                {/* Anatomical Findings */}
                <div className="mb-4 text-[15px] space-y-0.5">
                    {report.procedure === 'LOWER ENDOSCOPY' ? (
                        <>
                            {/* Lower Endoscopy Fields */}
                            {report.dre && (
                                <p className="mb-1"><span className="uppercase font-bold">INSPECTION AND DIGITO RECTAL EXAMINATION:</span> <span className={`uppercase ${getFindingStyle(report.dre, 'dre')} ${getValueSize(report.dre)}`}>{report.dre}</span></p>
                            )}
                            {report.anus && (
                                <p><span className="font-bold">Anus:</span> <span className={`uppercase ${getFindingStyle(report.anus, 'anus')} ${getValueSize(report.anus)}`}>{report.anus}</span></p>
                            )}
                            {report.rectum && (
                                <p><span className="font-bold">Rectum:</span> <span className={`uppercase ${getFindingStyle(report.rectum, 'rectum')} ${getValueSize(report.rectum)}`}>{report.rectum}</span></p>
                            )}
                            {report.sigmoid && (
                                <p><span className="font-bold">Sigmoid:</span> <span className={`uppercase ${getFindingStyle(report.sigmoid, 'sigmoid')} ${getValueSize(report.sigmoid)}`}>{report.sigmoid}</span></p>
                            )}
                            {report.descendingColon && (
                                <p><span className="font-bold">Descending:</span> <span className={`uppercase ${getFindingStyle(report.descendingColon, 'descendingColon')} ${getValueSize(report.descendingColon)}`}>{report.descendingColon}</span></p>
                            )}
                            {report.splenicFlexure && (
                                <p><span className="font-bold">Splenic flexure:</span> <span className={`uppercase ${getFindingStyle(report.splenicFlexure, 'splenicFlexure')} ${getValueSize(report.splenicFlexure)}`}>{report.splenicFlexure}</span></p>
                            )}
                            {report.transverseColon && (
                                <p><span className="font-bold">Transverse:</span> <span className={`uppercase ${getFindingStyle(report.transverseColon, 'transverseColon')} ${getValueSize(report.transverseColon)}`}>{report.transverseColon}</span></p>
                            )}
                            {report.hepaticFlexure && (
                                <p><span className="font-bold">Hepatic flexure:</span> <span className={`uppercase ${getFindingStyle(report.hepaticFlexure, 'hepaticFlexure')} ${getValueSize(report.hepaticFlexure)}`}>{report.hepaticFlexure}</span></p>
                            )}
                            {report.ascendingColon && (
                                <p><span className="font-bold">Ascending:</span> <span className={`uppercase ${getFindingStyle(report.ascendingColon, 'ascendingColon')} ${getValueSize(report.ascendingColon)}`}>{report.ascendingColon}</span></p>
                            )}
                            {report.caecum && (
                                <p><span className="font-bold">Caecum:</span> <span className={`uppercase ${getFindingStyle(report.caecum, 'caecum')} ${getValueSize(report.caecum)}`}>{report.caecum}</span></p>
                            )}
                            {report.ileoCaecalValve && (
                                <p><span className="font-bold">Ileo-caecal valve:</span> <span className={`uppercase ${getFindingStyle(report.ileoCaecalValve, 'ileoCaecalValve')} ${getValueSize(report.ileoCaecalValve)}`}>{report.ileoCaecalValve}</span></p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Upper Endoscopy Fields */}
                            {(() => {
                                const oesophagusValue = report.oesophagusGE || ''
                                const geJunctionValue = report.geJunction || ''
                                if (oesophagusValue.trim().toUpperCase() !== geJunctionValue.trim().toUpperCase() && (oesophagusValue && geJunctionValue)) {
                                    return (
                                        <>
                                            {oesophagusValue && (<p><span className="font-bold">Oesophagus:</span> <span className={`${getFindingStyle(report.oesophagusGE, 'oesophagusGE')} ${getValueSize(report.oesophagusGE)}`}>{report.oesophagusGE}</span></p>)}
                                            {geJunctionValue && (<p><span className="font-bold">G.E Junction:</span> <span className={`${getFindingStyle(report.geJunction, 'geJunction')} ${getValueSize(report.geJunction)}`}>{report.geJunction}</span></p>)}
                                        </>
                                    )
                                } else if (oesophagusValue) {
                                    return (<p><span className="font-bold">Oesophagus and G.E junction:</span> <span className={`${getFindingStyle(report.oesophagusGE, 'oesophagusGE')} ${getValueSize(report.oesophagusGE)}`}>{report.oesophagusGE}</span></p>)
                                }
                                return null
                            })()}
                            {report.fundus && (<p><span className="font-bold">Fundus:</span> <span className={`${getFindingStyle(report.fundus, 'fundus')} ${getValueSize(report.fundus)}`}>{report.fundus}</span></p>)}
                            {report.body && (<p><span className="font-bold">Body:</span> <span className={`${getFindingStyle(report.body, 'body')} ${getValueSize(report.body)}`}>{report.body}</span></p>)}
                            {report.antrum && (<p><span className="font-bold">Antrum:</span> <span className={`${getFindingStyle(report.antrum, 'antrum')} ${getValueSize(report.antrum)}`}>{report.antrum}</span></p>)}
                            {report.pylorus && (<p><span className="font-bold">Pylorus:</span> <span className={`${getFindingStyle(report.pylorus, 'pylorus')} ${getValueSize(report.pylorus)}`}>{report.pylorus}</span></p>)}
                            {(report.d1 || report.d2 || report.duodenum) && (
                                <>
                                    <p className="mt-1 font-bold">DUODENUM:</p>
                                    {report.d1 && <p><span className="font-bold">1st Position:</span> <span className={`${getFindingStyle(report.d1, 'd1')} ${getValueSize(report.d1)}`}>{report.d1}</span></p>}
                                    {report.d2 && <p><span className="font-bold">2nd Position:</span> <span className={`${getFindingStyle(report.d2, 'd2')} ${getValueSize(report.d2)}`}>{report.d2}</span></p>}
                                    {!report.d1 && !report.d2 && report.duodenum && (<p><span className="font-bold">1st & 2nd Position:</span> <span className={`${getFindingStyle(report.duodenum, 'duodenum')} ${getValueSize(report.duodenum)}`}>{report.duodenum}</span></p>)}
                                </>
                            )}
                        </>
                    )}
                    {report.findings && (
                        <p className="mt-1 whitespace-pre-wrap font-bold">{report.findings}</p>
                    )}
                </div>

                {/* HUT / Antigen Test */}
                {report.procedure !== 'LOWER ENDOSCOPY' && (
                    <div className="mb-2 text-[15px]">
                        {report.testType && report.testResult ? (
                            <p>
                                <span className="font-bold">{report.testType === 'Stool Antigen Test' ? 'H.pylori Antigen (stool) Test' : 'H.pylori Antigen (HUT) Test'}:</span> <span className="font-bold italic uppercase">{report.testResult}</span>
                            </p>
                        ) : (
                            <p><span className="font-bold">(HUT - TEST) Test:</span> <span className="font-bold italic uppercase">{report.hutTestResult ? String(report.hutTestResult).replace(/\(HUT - TEST\) Test:/i, '').replace(/\(STOOL ANTIGEN\) Test:/i, '').trim() : 'PENDING'}</span></p>
                        )}
                    </div>
                )}

                {/* Impression */}
                <div className="mb-2 text-[15px]">
                    <span className="font-bold">IMPRESSION:</span> <span className="font-bold italic">{report.impression || 'N/A'}</span>
                </div>

                {/* Comments */}
                <div className="mb-0 text-[15px] print:break-inside-avoid">
                    <span className="font-bold">COMMENTS:</span> <span className="font-bold italic uppercase">{report.comments || 'N/A'}</span>
                </div>

                {/* Doctor Signature */}
                <div className="text-right mt-4 text-[16px] print:break-inside-avoid">
                    <p className="font-bold">DR. M. S. ADAMS</p>
                </div>
            </div>
        )
    }
)

PrintableReport.displayName = 'PrintableReport'
