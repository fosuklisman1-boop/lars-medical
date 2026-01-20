
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * PUT /api/reports/[reportId]
 * Updates a specific medical report
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ reportId: string }> }
) {
    try {
        const { reportId } = await params
        const body = await request.json()

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date().toISOString()
        }

        // Map fields
        if (body.refDoctor !== undefined) updateData.refDoctor = body.refDoctor
        if (body.procedure !== undefined) updateData.procedure = body.procedure
        if (body.operationTeam) updateData.operationTeam = body.operationTeam
        if (body.timeStarted) updateData.timeStarted = new Date(body.timeStarted).toISOString()
        if (body.timeEnded) updateData.timeEnded = new Date(body.timeEnded).toISOString()
        if (body.medicationGiven !== undefined) updateData.medicationGiven = body.medicationGiven
        if (body.stomachContent !== undefined) updateData.stomachContent = body.stomachContent
        if (body.instrumentsUsed) updateData.instrumentsUsed = body.instrumentsUsed
        if (body.clinicalSummary !== undefined) updateData.clinicalSummary = body.clinicalSummary
        // Anatomical Findings
        if (body.oesophagusGE !== undefined) updateData.oesophagusGE = body.oesophagusGE
        if (body.fundus !== undefined) updateData.fundus = body.fundus
        if (body.body !== undefined) updateData.body = body.body
        if (body.antrum !== undefined) updateData.antrum = body.antrum
        if (body.pylorus !== undefined) updateData.pylorus = body.pylorus
        if (body.duodenum !== undefined) updateData.duodenum = body.duodenum
        if (body.findings !== undefined) updateData.findings = body.findings
        if (body.hutTestResult !== undefined) updateData.hutTestResult = body.hutTestResult
        if (body.impression !== undefined) updateData.impression = body.impression
        if (body.comments !== undefined) updateData.comments = body.comments
        if (body.medication !== undefined) updateData.medication = body.medication

        const { data: updatedReport, error } = await supabase
            .from('MedicalReport')
            .update(updateData)
            .eq('id', reportId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: updatedReport,
        })
    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update report' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/reports/[reportId]
 * Deletes a specific medical report
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ reportId: string }> }
) {
    try {
        const { reportId } = await params

        const { error } = await supabase
            .from('MedicalReport')
            .delete()
            .eq('id', reportId)

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: 'Report deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting report:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete report' },
            { status: 500 }
        )
    }
}
