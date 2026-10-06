import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isValidClientId } from '@/lib/client-id'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/clients/[clientId]
 * Retrieves a specific client by their unique ID (LMC-XXXXXX)
 * 
 * @param clientId - The unique client ID to retrieve
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Search for client by ID
    const { data: client, error } = await supabase
      .from('Client')
      .select('*')
      .eq('clientId', clientId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is specific to "zero rows" in .single()
      throw error
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/clients/[clientId]
 * Updates an existing client's information
 * 
 * @param clientId - The unique client ID to update
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Using simple spread logic, but we might want to be more explicit if validation is needed
    // Assuming body keys match DB columns mostly, except dates/numbers
    if (body.name) updateData.name = body.name
    if (body.sex) updateData.sex = body.sex
    if (body.age !== undefined) updateData.age = parseInt(body.age)
    if (body.address !== undefined) updateData.address = body.address
    if (body.refDoctor !== undefined) updateData.refDoctor = body.refDoctor
    if (body.procedure !== undefined) updateData.procedure = body.procedure
    if (body.operationTeam) updateData.operationTeam = body.operationTeam
    if (body.timeStarted) updateData.timeStarted = new Date(body.timeStarted).toISOString()
    if (body.timeEnded) updateData.timeEnded = new Date(body.timeEnded).toISOString()
    if (body.medicationGiven !== undefined) updateData.medicationGiven = body.medicationGiven
    if (body.instrumentsUsed) updateData.instrumentsUsed = body.instrumentsUsed
    if (body.clinicalSummary !== undefined) updateData.clinicalSummary = body.clinicalSummary
    if (body.findings !== undefined) updateData.findings = body.findings
    if (body.hutTestResult !== undefined) updateData.hutTestResult = body.hutTestResult
    if (body.impression !== undefined) updateData.impression = body.impression
    if (body.comments !== undefined) updateData.comments = body.comments
    if (body.medication !== undefined) updateData.medication = body.medication


    // Update client
    // .update() returns the modified rows if .select() is chained
    const { data: updatedClient, error } = await supabase
      .from('Client')
      .update(updateData)
      .eq('clientId', clientId)
      .select()
      .single()

    if (error) {
      // Check if error implies not found or other issues
      throw error
    }

    // If no row is returned, it means no client matched the ID
    if (!updatedClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient,
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clients/[clientId]
 * Deletes a client record and all of their medical reports (admin only)
 *
 * @param clientId - The unique client ID to delete
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Deletes use the service-role client: RLS on these tables permits
    // anon SELECT/INSERT/UPDATE but not DELETE, so the anon client would
    // silently affect 0 rows here.
    //
    // Delete reports before the client: if this fails, the client and its
    // reports are both left intact rather than orphaning report rows that
    // point at a client which no longer exists.
    const { error: reportsError, count: reportsDeleted } = await supabaseAdmin
      .from('MedicalReport')
      .delete({ count: 'exact' })
      .eq('clientId', clientId)

    if (reportsError) {
      throw reportsError
    }

    // Delete the client
    const { error, count } = await supabaseAdmin
      .from('Client')
      .delete({ count: 'exact' })
      .eq('clientId', clientId)

    if (error) {
      throw error
    }

    if (!count) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
      reportsDeleted: reportsDeleted || 0,
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
