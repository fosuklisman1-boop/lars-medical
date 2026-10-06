import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * DELETE /api/signatures/[signatureId]
 * Deletes a saved signature from the reusable signature library
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ signatureId: string }> }
) {
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { signatureId } = await params

        // Uses the service-role client: RLS on SavedSignature permits public
        // SELECT/INSERT but not DELETE, same as MedicalReport deletes.
        const { error, count } = await supabaseAdmin
            .from('SavedSignature')
            .delete({ count: 'exact' })
            .eq('id', signatureId)

        if (error) throw error

        if (!count) {
            return NextResponse.json(
                { success: false, error: 'Signature not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Signature deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting signature:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete signature' },
            { status: 500 }
        )
    }
}
