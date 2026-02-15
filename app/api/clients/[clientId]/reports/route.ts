
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/clients/[clientId]/reports
 * Retrieves all medical reports for a specific client
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params

        const { data: reports, error } = await supabase
            .from('MedicalReport')
            .select('*')
            .eq('clientId', clientId)
            .order('date', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: reports || [],
        })
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reports' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/clients/[clientId]/reports
 * Creates a new medical report for a specific client
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params
        const body = await request.json()

        // Create new report
        const { data: report, error } = await supabase
            .from('MedicalReport')
            .insert({
                clientId,
                refDoctor: body.refDoctor || null,
                procedure: body.procedure || null,
                operationTeam: body.operationTeam || [],
                timeStarted: body.timeStarted ? new Date(body.timeStarted).toISOString() : null,
                timeEnded: body.timeEnded ? new Date(body.timeEnded).toISOString() : null,
                medicationGiven: body.medicationGiven || null,
                stomachContent: body.stomachContent || null,
                instrumentsUsed: body.instrumentsUsed || [],
                clinicalSummary: body.clinicalSummary || null,
                biopsy: body.biopsy || null,
                biopsySite: body.biopsySite || null,
                // Anatomical Findings
                oesophagusGE: body.oesophagusGE || null,
                geJunction: body.geJunction || null,
                fundus: body.fundus || null,
                body: body.body || null,
                antrum: body.antrum || null,
                pylorus: body.pylorus || null,
                d1: body.d1 || null,
                d2: body.d2 || null,
                // Lower Endoscopy Fields
                dre: body.dre || null,
                anus: body.anus || null,
                rectum: body.rectum || null,
                sigmoid: body.sigmoid || null,
                descendingColon: body.descendingColon || null,
                splenicFlexure: body.splenicFlexure || null,
                transverseColon: body.transverseColon || null,
                hepaticFlexure: body.hepaticFlexure || null,
                ascendingColon: body.ascendingColon || null,
                caecum: body.caecum || null,
                ileoCaecalValve: body.ileoCaecalValve || null,
                // duodenum: body.duodenum || null, 
                findings: body.findings || null,
                hutTestResult: body.hutTestResult || null,
                impression: body.impression || null,
                comments: body.comments || null,
                medication: body.medication || null,
                testType: body.testType || null,
                testResult: body.testResult || null,
                letterhead: body.letterhead || 'LARS',
                date: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(
            {
                success: true,
                message: 'Report created successfully',
                data: report,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating report:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create report' },
            { status: 500 }
        )
    }
}
