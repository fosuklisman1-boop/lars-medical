import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


/**
 * GET /api/clients
 * Retrieves all clients or searches by clientId/name
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('Client')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('dateOfRegistration', { ascending: false })

    if (search) {
      // Basic OR search logic for Supabase (clientId OR name)
      // Note: Supabase 'or' syntax: .or('clientId.ilike.%SEARCH%,name.ilike.%SEARCH%')
      query = query.or(`clientId.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const { data: clients, error, count } = await query

    if (error) {
      console.error('Supabase fetch error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
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

    // Check for existing client with same Name, Sex and Age
    // This prevents re-registration of the same person
    const { data: existingClient } = await supabase
      .from('Client')
      .select('*')
      .ilike('name', body.name.trim()) // Case insensitive name match
      .eq('sex', body.sex)
      .eq('age', parseInt(body.age))
      .maybeSingle() // Use maybeSingle to avoid error if 0 rows, but error if > 1 (though logic handles 1)

    if (existingClient) {
      return NextResponse.json(
        {
          success: true,
          message: 'Client already exists. Redirecting to existing record.',
          data: existingClient,
          isExisting: true
        },
        { status: 200 } // OK status, not Created
      )
    }

    // Generate sequential client ID: LMC-END-XXXXXXXX
    // 1. Fetch the latest client ID
    const { data: latestClient } = await supabase
      .from('Client')
      .select('clientId')
      .order('dateOfRegistration', { ascending: false })
      .limit(1)
      .single()

    let nextIdNumber = 1

    if (latestClient && latestClient.clientId) {
      // Extract the number part
      // Format: LMC-END-XXXXXXXX
      const parts = latestClient.clientId.split('-')
      if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
        nextIdNumber = parseInt(parts[2]) + 1
      }
    }

    // Format: LMC-END-XXXX (min 4 digits, expands naturally)
    const clientId = `LMC-END-${String(nextIdNumber).padStart(4, '0')}`

    // Create new client in Supabase
    // Note: 'dateOfRegistration', 'createdAt', 'updatedAt' can ideally be handled by default now() values in DB,
    // but passing them here is also fine to maintain parity with previous logic if schema expects it.
    const { data: client, error } = await supabase
      .from('Client')
      .insert({
        clientId,
        name: body.name,
        sex: body.sex,
        age: parseInt(body.age),
        address: body.address || null,
        refDoctor: body.refDoctor || null,
        procedure: body.procedure || null,
        operationTeam: body.operationTeam || [],
        timeStarted: body.timeStarted ? new Date(body.timeStarted).toISOString() : null,
        timeEnded: body.timeEnded ? new Date(body.timeEnded).toISOString() : null,
        medicationGiven: body.medicationGiven || null,
        instrumentsUsed: body.instrumentsUsed || [],
        clinicalSummary: body.clinicalSummary || null,
        findings: body.findings || null,
        hutTestResult: body.hutTestResult || null,
        impression: body.impression || null,
        comments: body.comments || null,
        medication: body.medication || null,
        dateOfRegistration: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

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
