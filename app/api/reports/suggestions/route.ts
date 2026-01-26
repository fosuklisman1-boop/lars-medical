import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/reports/suggestions
 * Retrieves unique values from previous reports for autocomplete suggestions
 */
export async function GET(request: Request) {
    try {
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
            'medication'
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

        const { data, error } = await supabase
            .from('MedicalReport')
            .select(fieldsToSelect)
            .limit(100)

        if (error) throw error

        // Extract unique non-empty values
        const rawValues: string[] = []
        data.forEach((row: any) => {
            if (row[field]) rawValues.push(row[field])
            // Add legacy suggestions for d1/d2
            if ((field === 'd1' || field === 'd2') && row.duodenum) rawValues.push(row.duodenum)
        })

        const uniqueValues = [...new Set(
            rawValues
                .filter((val: any) => val && typeof val === 'string' && val.trim() !== '')
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
