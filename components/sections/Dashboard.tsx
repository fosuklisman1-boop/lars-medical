'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Activity, ChevronLeft, ChevronRight, Loader2, Users, Wallet } from 'lucide-react'

type Period = 'day' | 'week' | 'month'

interface TrendPoint {
    label: string
    visits: number
    revenue: number
}

interface DashboardStats {
    totalClients: number
    visits: number
    revenue: number
    rangeLabel: string
    trend: TrendPoint[]
}

const PERIOD_LABELS: Record<Period, string> = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
}

export function Dashboard() {
    const [period, setPeriod] = useState<Period>('week')
    const [offset, setOffset] = useState(0)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/dashboard/stats?period=${period}&offset=${offset}`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load dashboard stats')
            }

            setStats(result.data)
        } catch (err) {
            console.error('Error fetching dashboard stats:', err)
            setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
        } finally {
            setLoading(false)
        }
    }, [period, offset])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handlePeriodChange = (next: Period) => {
        setPeriod(next)
        setOffset(0)
    }

    return (
        <div className="space-y-6">
            <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-2">
                    {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                        <Button
                            key={p}
                            type="button"
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange(p)}
                            className={period === p ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                            {PERIOD_LABELS[p]}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setOffset((o) => o + 1)}
                        aria-label="Previous period"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-slate-600 min-w-[11rem] text-center">
                        {stats?.rangeLabel ?? '—'}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setOffset((o) => Math.max(0, o - 1))}
                        disabled={offset === 0}
                        aria-label="Next period"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </Card>

            {error && (
                <Card className="p-6 border-red-200 bg-red-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700">{error}</p>
                    <Button type="button" variant="outline" size="sm" onClick={fetchStats}>
                        Retry
                    </Button>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Clients</p>
                    </div>
                    {loading && !stats ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                        <p className="text-3xl font-black text-slate-800">{stats?.totalClients ?? 0}</p>
                    )}
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Visits</p>
                    </div>
                    {loading && !stats ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                        <p className="text-3xl font-black text-slate-800">{stats?.visits ?? 0}</p>
                    )}
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Revenue</p>
                    </div>
                    {loading && !stats ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                        <p className="text-3xl font-black text-slate-800">
                            GH₵{(stats?.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Visits Trend</p>
                    <ChartContainer config={{ visits: { label: 'Visits', color: '#2a78d6' } }} className="h-[220px] w-full">
                        <AreaChart data={stats?.trend ?? []}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}`} />} />
                            <Area
                                type="monotone"
                                dataKey="visits"
                                stroke="var(--color-visits)"
                                fill="var(--color-visits)"
                                fillOpacity={0.15}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                </Card>

                <Card className="p-6">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Revenue Trend (GH₵)</p>
                    <ChartContainer config={{ revenue: { label: 'Revenue', color: '#eb6834' } }} className="h-[220px] w-full">
                        <AreaChart data={stats?.trend ?? []}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}`} />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-revenue)"
                                fill="var(--color-revenue)"
                                fillOpacity={0.15}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                </Card>
            </div>
        </div>
    )
}
