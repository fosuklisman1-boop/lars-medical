import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    subWeeks,
    subMonths,
    eachDayOfInterval,
    format,
} from 'date-fns'

type Period = 'day' | 'week' | 'month'

interface DateWindow {
    start: Date
    end: Date
}

interface ResolvedWindows {
    tile: DateWindow
    trend: DateWindow
    rangeLabel: string
}

/**
 * "day" uses a 7-day rolling trend window (ending on the resolved day) so the
 * chart has something to show; the tile stats stay scoped to the single day.
 */
function resolveWindows(period: Period, offset: number): ResolvedWindows {
    const now = new Date()

    if (period === 'day') {
        const base = subDays(now, offset)
        const tile = { start: startOfDay(base), end: endOfDay(base) }
        const trend = { start: startOfDay(subDays(base, 6)), end: endOfDay(base) }
        return { tile, trend, rangeLabel: format(base, 'MMM d, yyyy') }
    }

    if (period === 'week') {
        const base = subWeeks(now, offset)
        const start = startOfWeek(base, { weekStartsOn: 1 })
        const end = endOfWeek(base, { weekStartsOn: 1 })
        return {
            tile: { start, end },
            trend: { start, end },
            rangeLabel: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
        }
    }

    const base = subMonths(now, offset)
    const start = startOfMonth(base)
    const end = endOfMonth(base)
    return {
        tile: { start, end },
        trend: { start, end },
        rangeLabel: format(base, 'MMMM yyyy'),
    }
}

/**
 * GET /api/dashboard/stats
 * Returns clinic-wide totals for the admin dashboard: an all-time client
 * count plus visits/revenue for a selected Day/Week/Month window (optionally
 * shifted into the past via `offset`), and a day-by-day trend for charting.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const periodParam = searchParams.get('period') || 'week'
        const offsetParam = searchParams.get('offset') || '0'
        const parsedOffset = Number(offsetParam)

        if (!['day', 'week', 'month'].includes(periodParam)) {
            return NextResponse.json(
                { success: false, error: 'Invalid period. Expected day, week, or month.' },
                { status: 400 }
            )
        }

        if (!Number.isFinite(parsedOffset) || parsedOffset < 0 || !Number.isInteger(parsedOffset)) {
            return NextResponse.json(
                { success: false, error: 'Invalid offset. Expected a non-negative integer.' },
                { status: 400 }
            )
        }

        const period = periodParam as Period
        const offset = Math.min(parsedOffset, 240)

        const { tile, trend, rangeLabel } = resolveWindows(period, offset)

        const { count: totalClients, error: clientsError } = await supabase
            .from('Client')
            .select('*', { count: 'exact', head: true })

        if (clientsError) throw clientsError

        const { data: rows, error: reportsError } = await supabase
            .from('MedicalReport')
            .select('date, amount')
            .gte('date', trend.start.toISOString())
            .lte('date', trend.end.toISOString())

        if (reportsError) throw reportsError

        const allRows = rows || []

        const tileRows = allRows.filter((row) => {
            const rowDate = new Date(row.date)
            return rowDate >= tile.start && rowDate <= tile.end
        })

        const visits = tileRows.length
        const revenue = tileRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

        const dayBuckets = new Map<string, { label: string; visits: number; revenue: number }>()
        for (const day of eachDayOfInterval({ start: trend.start, end: trend.end })) {
            dayBuckets.set(format(day, 'yyyy-MM-dd'), {
                label: format(day, period === 'month' ? 'd' : 'EEE'),
                visits: 0,
                revenue: 0,
            })
        }
        for (const row of allRows) {
            const key = format(new Date(row.date), 'yyyy-MM-dd')
            const bucket = dayBuckets.get(key)
            if (bucket) {
                bucket.visits += 1
                bucket.revenue += Number(row.amount) || 0
            }
        }

        const trendPoints = Array.from(dayBuckets.values())

        return NextResponse.json({
            success: true,
            data: {
                totalClients: totalClients || 0,
                visits,
                revenue,
                rangeLabel,
                trend: trendPoints,
            },
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        )
    }
}
