import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateClientId } from '@/lib/client-id'

/**
 * GET /api/clients
 * Retrieves all clients or searches by clientId/name
 * Query parameters:
 *   - search: Search by clientId or name
 *   - limit: Number of results to return (default: 50)
 *   - offset: Number of results to skip (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query filter based on search parameter
    const where = search
      ? {
          OR: [
            { clientId: { contains: search.toUpperCase(), mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Fetch clients with pagination
    const clients = await prisma.client.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { dateOfRegistration: 'desc' },
    })

    // Get total count for pagination
    const total = await prisma.client.count({ where })

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 * Creates a new client with auto-generated unique ID (LMC-XXXXXX)
 * Request body should contain client information
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.sex || body.age === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, sex, age' },
        { status: 400 }
      )
    }

    // Generate unique client ID
    let clientId = generateClientId()
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    // Ensure the generated ID is unique (retry if collision)
    while (!isUnique && attempts < maxAttempts) {
      const existing = await prisma.client.findUnique({
        where: { clientId },
      })
      if (!existing) {
        isUnique = true
      } else {
        clientId = generateClientId()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique client ID' },
        { status: 500 }
      )
    }

    // Create new client in database
    const client = await prisma.client.create({
      data: {
        clientId,
        name: body.name,
        sex: body.sex,
        age: parseInt(body.age),
        address: body.address || null,
        refDoctor: body.refDoctor || null,
        procedure: body.procedure || null,
        operationTeam: body.operationTeam || [],
        timeStarted: body.timeStarted ? new Date(body.timeStarted) : null,
        timeEnded: body.timeEnded ? new Date(body.timeEnded) : null,
        medicationGiven: body.medicationGiven || null,
        instrumentsUsed: body.instrumentsUsed || [],
        clinicalSummary: body.clinicalSummary || null,
        findings: body.findings || null,
        hutTestResult: body.hutTestResult || null,
        impression: body.impression || null,
        comments: body.comments || null,
        medication: body.medication || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Client registered successfully',
        data: client,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
