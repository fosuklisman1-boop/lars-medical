import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/signatures
 * Retrieves all saved signatures in the reusable signature library
 */
export async function GET() {
    try {
        const { data: signatures, error } = await supabase
            .from('SavedSignature')
            .select('*')
            .order('label', { ascending: true })

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: signatures || [],
        })
    } catch (error) {
        console.error('Error fetching saved signatures:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch saved signatures' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/signatures
 * Saves a new signature to the reusable signature library
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()

        if (!body.label?.trim() || !body.imageData?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: label, imageData' },
                { status: 400 }
            )
        }

        const { data: signature, error } = await supabase
            .from('SavedSignature')
            .insert({
                label: body.label.trim(),
                imageData: body.imageData,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(
            {
                success: true,
                message: 'Signature saved successfully',
                data: signature,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error saving signature:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save signature' },
            { status: 500 }
        )
    }
}
