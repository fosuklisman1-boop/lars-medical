import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidClientId } from '@/lib/client-id'

/**
 * GET /api/clients/[clientId]
 * Retrieves a specific client by their unique ID (LMC-XXXXXX)
 * 
 * @param clientId - The unique client ID to retrieve
 */
export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Search for client by ID
    const client = await prisma.client.findUnique({
      where: { clientId },
    })

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
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const body = await request.json()

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { clientId },
    })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update client with provided fields
    const updatedClient = await prisma.client.update({
      where: { clientId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.sex && { sex: body.sex }),
        ...(body.age !== undefined && { age: parseInt(body.age) }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.refDoctor !== undefined && { refDoctor: body.refDoctor }),
        ...(body.procedure !== undefined && { procedure: body.procedure }),
        ...(body.operationTeam && { operationTeam: body.operationTeam }),
        ...(body.timeStarted && { timeStarted: new Date(body.timeStarted) }),
        ...(body.timeEnded && { timeEnded: new Date(body.timeEnded) }),
        ...(body.medicationGiven !== undefined && { medicationGiven: body.medicationGiven }),
        ...(body.instrumentsUsed && { instrumentsUsed: body.instrumentsUsed }),
        ...(body.clinicalSummary !== undefined && { clinicalSummary: body.clinicalSummary }),
        ...(body.findings !== undefined && { findings: body.findings }),
        ...(body.hutTestResult !== undefined && { hutTestResult: body.hutTestResult }),
        ...(body.impression !== undefined && { impression: body.impression }),
        ...(body.comments !== undefined && { comments: body.comments }),
        ...(body.medication !== undefined && { medication: body.medication }),
      },
    })

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
 * Deletes a client record (admin only)
 * 
 * @param clientId - The unique client ID to delete
 */
export async function DELETE(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Check if client exists before deleting
    const existingClient = await prisma.client.findUnique({
      where: { clientId },
    })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Delete the client
    await prisma.client.delete({
      where: { clientId },
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
