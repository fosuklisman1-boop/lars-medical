import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/reports/suggestions
 * Retrieves unique values from previous reports for autocomplete suggestions
 */
export async function GET(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const field = searchParams.get('field')

        if (!field) {
            return NextResponse.json(
                { success: false, error: 'Field parameter is required' },
                { status: 400 }
            )
        }

        // Allowed fields for suggestions
        const allowedFields = [
            'refDoctor',
            'procedure',
            'medicationGiven',
            'stomachContent',
            'instrumentsUsed',
            'clinicalSummary',
            'biopsySite',
            'oesophagusGE',
            'geJunction',
            'fundus',
            'body',
            'antrum',
            'pylorus',
            'd1',
            'd2',
            'duodenum',
            'findings',
            'hutTestResult',
            'impression',
            'comments',
            'medication',
            'operationTeam',
            'dre',
            'anus',
            'rectum',
            'sigmoid',
            'descendingColon',
            'splenicFlexure',
            'transverseColon',
            'hepaticFlexure',
            'ascendingColon',
            'caecum',
            'ileoCaecalValve'
        ]

        if (!allowedFields.includes(field)) {
            return NextResponse.json(
                { success: false, error: 'Invalid field' },
                { status: 400 }
            )
        }

        // Fetch distinct values for the specified field
        // If field is d1 or d2, also fetch legacy 'duodenum' for suggestions
        const fieldsToSelect = (field === 'd1' || field === 'd2') ? `${field}, duodenum` : field

        const { data, error } = await supabaseAdmin
            .from('MedicalReport')
            .select(fieldsToSelect)
            .limit(100)

        if (error) throw error

        // Extract unique non-empty values
        const rawValues: string[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((row: any) => {
            const val = row[field]
            if (val) {
                if (Array.isArray(val)) {
                    // For arrays (like operationTeam, instrumentsUsed), join them to suggest the full set
                    if (val.length > 0) rawValues.push(val.join(', '))
                } else if (typeof val === 'string') {
                    rawValues.push(val)
                }
            }
            // Add legacy suggestions for d1/d2
            if ((field === 'd1' || field === 'd2') && row.duodenum) rawValues.push(row.duodenum)
        })

        const uniqueValues = [...new Set(
            rawValues
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((val: any) => val && typeof val === 'string' && val.trim() !== '' && val.trim().toUpperCase() !== 'NOT EXAMINED')
        )].slice(0, 50) // Limit to 50 suggestions

        return NextResponse.json({
            success: true,
            data: uniqueValues,
        })
    } catch (error) {
        console.error('Error fetching suggestions:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch suggestions' },
            { status: 500 }
        )
    }
}
