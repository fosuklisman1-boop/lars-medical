# Admin Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Amount Charged (GH₵)" field to medical reports (internal use only, never printed/shared) and a new "Dashboard" tab showing total clients (all-time), and visits/revenue for a selectable Day/Week/Month period with prev/next navigation and a trend chart.

**Architecture:** One new nullable `amount` column on `MedicalReport`, populated by a new form field and passed through the existing report create/update API routes unchanged otherwise. A new `GET /api/dashboard/stats` route does live Supabase aggregation (a `Client` count plus one `MedicalReport` range query, bucketed by day in JS using `date-fns`). A new `Dashboard` component (new "Dashboard" tab on the home page) renders three stat tiles and two single-series trend charts (Visits, Revenue) built with the already-installed `recharts`/shadcn `chart.tsx`.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase JS client (`@supabase/supabase-js`), `date-fns` (already installed) for date window math, `recharts` + `components/ui/chart.tsx` (shadcn wrapper, already installed) for charts, shadcn `card`/`button`/`input` components, `lucide-react` icons.

**Spec:** `docs/superpowers/specs/2026-09-28-admin-analytics-dashboard-design.md`

## Global Constraints

- No new npm dependencies — `date-fns` and `recharts` are already in `package.json`.
- No test framework exists in this repo (no jest/vitest configured). Verification is via `npx tsc --noEmit`, `npm run lint`, `curl` against the dev server for the API, and manual browser testing for the UI. Do not introduce a test framework as part of this feature.
- The `amount` field must never be read by `components/sections/PrintReport.tsx` or by the PDF/share generation path in `app/client/[clientId]/page.tsx` — do not touch either of those files in this plan.
- No price list, no backfilling historical amounts, no role-based access control, no precomputed/materialized summary tables — see the spec's Non-goals section.
- Match existing code style in each file (this codebase does not use comments explaining *what* code does — only add a comment where the *why* is non-obvious).
- Currency is Ghana Cedi, displayed with the `GH₵` prefix.

---

### Task 1: `amount` field — schema, type, and report form

**Files:**
- Create: `add_amount_column.sql`
- Modify: `types/index.ts`
- Modify: `app/api/clients/[clientId]/reports/route.ts` (`POST` handler)
- Modify: `app/api/reports/[reportId]/route.ts` (`PUT` handler)
- Modify: `components/sections/MedicalReportForm.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `MedicalReport.amount: number | null` — the field Task 2's revenue aggregation reads via Supabase's `MedicalReport` table.

- [ ] **Step 1: Add the migration file**

Create `add_amount_column.sql` at the project root:

```sql
-- Add amount column to MedicalReport table (GH₵ charged for the visit; admin-only, never shown on the printed/shared report)
ALTER TABLE "MedicalReport" ADD COLUMN IF NOT EXISTS "amount" NUMERIC;
```

Run this against the Supabase project's SQL editor (same manual process used for the existing `add_letterhead_column.sql` etc. — this repo has no migration runner).

- [ ] **Step 2: Add `amount` to the `MedicalReport` type**

In `types/index.ts`, in the `MedicalReport` interface, add the field right after `medication?: string;`:

```typescript
    medication?: string;
    amount?: number | null;
    date?: string;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors (the field is optional, so nothing currently constructing a `MedicalReport` breaks).

- [ ] **Step 4: Accept `amount` in the report create route**

In `app/api/clients/[clientId]/reports/route.ts`, in the `POST` handler's `.insert({...})` call, add a line right after `medication: body.medication || null,`:

```typescript
                medication: body.medication || null,
                amount: body.amount === null || body.amount === undefined || body.amount === '' ? null : Number(body.amount),
```

- [ ] **Step 5: Accept `amount` in the report update route**

In `app/api/reports/[reportId]/route.ts`, in the `PUT` handler, add right after the existing `if (body.medication !== undefined) updateData.medication = body.medication` line:

```typescript
        if (body.medication !== undefined) updateData.medication = body.medication
        if (body.amount !== undefined) {
            updateData.amount = body.amount === null || body.amount === '' ? null : Number(body.amount)
        }
```

- [ ] **Step 6: Add `amount` to the form's state**

In `components/sections/MedicalReportForm.tsx`, add `amount` to all three places `formData`-shaped objects are built, right after the `medication`-adjacent line (this codebase's fields don't include a top-level `medication` field, so add it right after `letterhead: report?.letterhead || 'LARS',` in each of the three blocks — the initial `useState`, the `useMemo` reset on `report` change, and `originalFormData`):

Initial `useState` (around line 82):
```typescript
        letterhead: report?.letterhead || 'LARS',
        amount: report?.amount != null ? String(report.amount) : '',
```

`useMemo` reset (around line 139):
```typescript
                letterhead: report.letterhead || 'LARS',
                amount: report.amount != null ? String(report.amount) : '',
```

`originalFormData` (around line 191):
```typescript
        letterhead: report?.letterhead || 'LARS',
        amount: report?.amount != null ? String(report.amount) : '',
```

- [ ] **Step 7: Send `amount` as a number in the submit payload**

In the `handleSubmit` function's `payload` object (around line 344, right after `letterhead: formData.letterhead,`), add:

```typescript
                letterhead: formData.letterhead,
                amount: formData.amount?.trim() ? parseFloat(formData.amount) : null,
```

This overrides the string value that `...formData` already spread into `payload`, converting it to a number (or `null` if left blank).

- [ ] **Step 8: Add the "Amount Charged" field to the form UI**

In `components/sections/MedicalReportForm.tsx`, insert this block right after the "Final Comments/Meds" `<div className="space-y-4">...</div>` block closes (after line 730, before the `{/* Actions */}` comment):

```tsx
                {/* Amount Charged — admin-only; intentionally never read by PrintReport or the share/PDF path */}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                    <label htmlFor="amount" className="block text-sm font-medium mb-1 text-slate-700">
                        Amount Charged (GH₵) <span className="text-xs font-normal text-slate-400">— internal use only, not shown on the report</span>
                    </label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="e.g. 350.00"
                        className="max-w-xs"
                    />
                </div>
```

- [ ] **Step 9: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to any file touched in this task.

Run: `npm run lint`
Expected: no new errors related to these files.

- [ ] **Step 10: Manual verification against the dev server**

Run: `npm run dev` (leave running in background)

Register a throwaway client, then create a report for them with an amount, and confirm it persists:

```bash
CLIENT=$(curl -s -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -d '{"name":"Amount Test","sex":"F","age":40}')
CLIENT_ID=$(echo "$CLIENT" | grep -o '"clientId":"[^"]*"' | head -1 | cut -d'"' -f4)

REPORT=$(curl -s -X POST "http://localhost:3000/api/clients/$CLIENT_ID/reports" -H "Content-Type: application/json" -d '{"procedure":"UPPER ENDOSCOPY","amount":350.50}')
echo "$REPORT"
# Expected: response data includes "amount":350.5

REPORT_ID=$(echo "$REPORT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -s -X PUT "http://localhost:3000/api/reports/$REPORT_ID" -H "Content-Type: application/json" -d '{"amount":null}'
# Expected: response data includes "amount":null
```

Then in the browser: log in, open this client's detail page, edit the report, confirm the "Amount Charged" field is present and blank (since it was just cleared), enter an amount, save, reopen the edit form and confirm the value persisted. Print and share the report and visually confirm the amount does not appear anywhere in the printed/shared output.

- [ ] **Step 11: Commit**

```bash
git add add_amount_column.sql types/index.ts "app/api/clients/[clientId]/reports/route.ts" "app/api/reports/[reportId]/route.ts" components/sections/MedicalReportForm.tsx
git commit -m "feat: add admin-only amount charged field to medical reports"
```

---

### Task 2: Dashboard stats API route

**Files:**
- Create: `app/api/dashboard/stats/route.ts`

**Interfaces:**
- Consumes: `supabase` client from `@/lib/supabase`; `MedicalReport.amount`, `MedicalReport.date` from Task 1 (the `date` column already exists — it's the report's visit timestamp, set at creation, and is what `visits`/`revenue` are filtered on — **not** a `createdAt` column, which this table does not populate).
- Produces: `GET /api/dashboard/stats?period=day|week|month&offset=N` returning `{ success: true, data: { totalClients: number, visits: number, revenue: number, rangeLabel: string, trend: { label: string, visits: number, revenue: number }[] } }` on success, or `{ success: false, error: string }` on failure. This is the shape Task 3's `Dashboard` component fetches and renders.

- [ ] **Step 1: Create the route file with window-resolution logic**

Create `app/api/dashboard/stats/route.ts`:

```typescript
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
        const offsetParam = parseInt(searchParams.get('offset') || '0')

        if (!['day', 'week', 'month'].includes(periodParam)) {
            return NextResponse.json(
                { success: false, error: 'Invalid period. Expected day, week, or month.' },
                { status: 400 }
            )
        }

        const period = periodParam as Period
        const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0

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
        const revenue = tileRows.reduce((sum, row) => sum + (row.amount || 0), 0)

        const dayBuckets = new Map<string, { visits: number; revenue: number }>()
        for (const day of eachDayOfInterval({ start: trend.start, end: trend.end })) {
            dayBuckets.set(format(day, 'yyyy-MM-dd'), { visits: 0, revenue: 0 })
        }
        for (const row of allRows) {
            const key = format(new Date(row.date), 'yyyy-MM-dd')
            const bucket = dayBuckets.get(key)
            if (bucket) {
                bucket.visits += 1
                bucket.revenue += row.amount || 0
            }
        }

        const trendPoints = Array.from(dayBuckets.entries()).map(([key, value]) => ({
            label: format(new Date(key), period === 'month' ? 'd' : 'EEE'),
            visits: value.visits,
            revenue: value.revenue,
        }))

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
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to `app/api/dashboard/stats/route.ts`.

Run: `npm run lint`
Expected: no new errors related to this file.

- [ ] **Step 3: Manual verification against the dev server**

Run: `npm run dev` (leave running in background, if not already running from Task 1)

```bash
curl -s "http://localhost:3000/api/dashboard/stats?period=week&offset=0" | head -c 2000
```

Expected: `{"success":true,"data":{"totalClients":<N>,"visits":<N>,"revenue":<N>,"rangeLabel":"<Mon D> – <Mon D, YYYY>","trend":[{"label":"Mon","visits":...},...]}}` with exactly 7 `trend` points.

```bash
curl -s "http://localhost:3000/api/dashboard/stats?period=day&offset=0" | head -c 2000
```

Expected: `trend` has exactly 7 points (rolling week ending today), but `visits`/`revenue` reflect only today — create a report via the Task 1 curl commands with today's date implicitly set, then re-run this and confirm `visits` increased by 1 and `revenue` increased by that report's `amount`.

```bash
curl -s "http://localhost:3000/api/dashboard/stats?period=month&offset=1"
```

Expected: `rangeLabel` names last month, and the response succeeds (no error) even if `visits`/`revenue` are 0 for that period.

```bash
curl -s "http://localhost:3000/api/dashboard/stats?period=bogus"
```

Expected: `{"success":false,"error":"Invalid period. Expected day, week, or month."}` with a 400 status.

- [ ] **Step 4: Commit**

```bash
git add app/api/dashboard/stats/route.ts
git commit -m "feat: add dashboard stats API route"
```

---

### Task 3: Dashboard UI tab

**Files:**
- Create: `components/sections/Dashboard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `GET /api/dashboard/stats?period=...&offset=...` from Task 2, returning the shape documented there.
- Produces: `Dashboard` component (default export style matches this codebase's named-export convention: `export function Dashboard()`), rendered as a new tab in `app/page.tsx`. Nothing else depends on this.

- [ ] **Step 1: Create the Dashboard component**

Create `components/sections/Dashboard.tsx`:

```tsx
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
                            GH₵{(stats?.revenue ?? 0).toLocaleString()}
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
                            <ChartTooltip content={<ChartTooltipContent />} />
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
                            <ChartTooltip content={<ChartTooltipContent />} />
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
```

- [ ] **Step 2: Wire the Dashboard tab into the home page**

In `app/page.tsx`, update the imports:

```typescript
import { RegisterClient } from '@/components/sections/RegisterClient'
import { SearchClient } from '@/components/sections/SearchClient'
import { Dashboard } from '@/components/sections/Dashboard'
import { Search, Plus, LogOut, User as UserIcon, Loader2, LayoutDashboard } from 'lucide-react'
```

Update the tab state type:

```typescript
  const [activeTab, setActiveTab] = useState<'register' | 'search' | 'dashboard'>('register')
```

Add a third tab button, right after the "Search Tab" `<button>` block closes (after line 134) and before the closing `</div>` of the nav tabs container:

```tsx
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-all ${activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
```

Add the tab's content, right after `{activeTab === 'search' && <SearchClient />}`:

```tsx
        {activeTab === 'dashboard' && <Dashboard />}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to `components/sections/Dashboard.tsx` or `app/page.tsx`.

Run: `npm run lint`
Expected: no new errors related to these files.

- [ ] **Step 4: Manual verification in the browser**

With `npm run dev` running (and at least one report with a non-null `amount` created via Task 1/2's curl commands): log in, click the new "Dashboard" tab, and confirm:
- The three stat tiles show a spinner briefly, then real numbers.
- "Total Clients" matches the count of clients in Search Clients.
- Switching Day/Week/Month updates Visits/Revenue and the range label, and resets to the current period (no stale prev/next offset carried over).
- Clicking the left (previous) arrow moves to an earlier period and updates the range label and numbers; the right (next) arrow is disabled at the current period and re-enables after going back.
- Both trend charts render without console errors, show a smooth area fill, and the tooltip appears on hover with the correct label/value.
- Resize the browser to phone width (~400px) and confirm the stat tiles and charts stack without horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Dashboard.tsx app/page.tsx
git commit -m "feat: add admin analytics dashboard tab"
```
