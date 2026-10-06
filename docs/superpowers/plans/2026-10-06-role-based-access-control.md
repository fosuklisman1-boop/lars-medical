# Role-Based Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce two roles (`admin`, `super_admin`) with real server-side enforcement — `admin` can register/search/delete clients and view/print/share existing reports; only `super_admin` can create/edit/delete reports, manage the signature library, or see the analytics dashboard.

**Architecture:** Role lives in each Supabase Auth user's `app_metadata.role` (server-writable only, included in the JWT). A new `lib/auth.ts` validates the `Authorization: Bearer <token>` header on the server and returns the caller's role (defaulting to the more restrictive `admin` when unset). A new `lib/api-client.ts` wraps `fetch` to attach that token automatically, replacing every raw `fetch('/api/...')` call in the app. Every API route then requires a valid session (401 if missing), and the report-mutation/signature/dashboard routes additionally require `super_admin` (403 otherwise). The UI mirrors this by hiding what a role can't do, using the role already present in the session it already holds.

**Tech Stack:** Next.js (App Router), TypeScript, `@supabase/supabase-js` (already installed, provides `supabase.auth.getUser(token)` for server-side JWT validation).

**Spec:** `docs/superpowers/specs/2026-10-06-role-based-access-design.md`

## Global Constraints

- No new npm dependencies.
- No test framework exists in this repo (no jest/vitest configured). Verification is via `npx tsc --noEmit`, `npm run lint` (currently fails repo-wide with a pre-existing, unrelated ESLint config-loading error — "Converting circular structure to JSON" — do not treat this as a regression; confirm it's the *same* error, not a new one), `curl` against the dev server, and manual browser testing.
- `role` defaults to `admin` (the more restrictive role) whenever `app_metadata.role` is anything other than exactly `'super_admin'` — fail-safe-restrictive, never fail-open.
- Every API route must reject a request with no/invalid `Authorization` header with `401 { success: false, error: 'Unauthorized' }` before doing anything else. Routes restricted to `super_admin` must reject a valid-but-wrong-role request with `403 { success: false, error: 'Forbidden' }`.
- Match existing code style in each file (this codebase does not use comments explaining *what* code does — only keep that pattern).

---

### Task 1: Core auth helpers

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/api-client.ts`

**Interfaces:**
- Consumes: `supabase` client from `@/lib/supabase` (already exists).
- Produces: `getAuthenticatedUser(request: Request): Promise<{ user: User; role: 'admin' | 'super_admin' } | null>` from `lib/auth.ts` — every later task's API-route guards call this exact function with this exact return shape. `apiFetch(url: string, options?: RequestInit): Promise<Response>` from `lib/api-client.ts` — Task 2 replaces every `fetch(...)` call in the frontend with this.

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type Role = 'admin' | 'super_admin'

export interface AuthenticatedUser {
    user: User
    role: Role
}

/**
 * Validates the request's `Authorization: Bearer <token>` header against
 * Supabase Auth. Role comes from app_metadata (writable only via the
 * service-role key, never by the user themselves) and defaults to the
 * more restrictive 'admin' whenever it isn't exactly 'super_admin'.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.slice('Bearer '.length)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
        return null
    }

    const role: Role = data.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin'

    return { user: data.user, role }
}
```

- [ ] **Step 2: Create `lib/api-client.ts`**

```typescript
import { supabase } from '@/lib/supabase'

/**
 * Drop-in replacement for fetch() against this app's own /api routes —
 * attaches the current session's access token so API routes can
 * authenticate the caller. Falls back to a plain fetch with no auth
 * header if there's no active session (the route will 401).
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession()

    const headers = new Headers(options.headers)
    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    return fetch(url, { ...options, headers })
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/auth.ts` or `lib/api-client.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts lib/api-client.ts
git commit -m "feat: add server-side role check and authenticated fetch helpers"
```

---

### Task 2: Wire `apiFetch` into every frontend API call

**Files:**
- Modify: `components/sections/RegisterClient.tsx`
- Modify: `components/sections/SearchClient.tsx`
- Modify: `components/sections/MedicalReportForm.tsx`
- Modify: `components/sections/Dashboard.tsx`
- Modify: `app/client/[clientId]/page.tsx`
- Modify: `components/ui/autocomplete-input.tsx`
- Modify: `components/ui/autocomplete-textarea.tsx`

**Interfaces:**
- Consumes: `apiFetch` from `@/lib/api-client` (Task 1).
- Produces: nothing consumed by later tasks — this task is purely "every API call now sends a bearer token." It is safe to ship on its own: no route checks that token yet, so behavior is unchanged until Tasks 3-4 land.

- [ ] **Step 1: `components/sections/RegisterClient.tsx`**

Add the import at the top, alongside the other imports:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change the one fetch call:

```typescript
      const response = await fetch('/api/clients', {
```
to:
```typescript
      const response = await apiFetch('/api/clients', {
```

- [ ] **Step 2: `components/sections/SearchClient.tsx`**

Add the import:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change both fetch calls:

```typescript
      const response = await fetch(`/api/clients?search=${encodeURIComponent(query)}`)
```
to:
```typescript
      const response = await apiFetch(`/api/clients?search=${encodeURIComponent(query)}`)
```

and:

```typescript
      const response = await fetch(`/api/clients/${clientPendingDelete.clientId}`, {
```
to:
```typescript
      const response = await apiFetch(`/api/clients/${clientPendingDelete.clientId}`, {
```

- [ ] **Step 3: `components/sections/MedicalReportForm.tsx`**

Add the import, alongside the existing imports:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change all five fetch calls in this file:

```typescript
            const response = await fetch('/api/signatures')
```
to:
```typescript
            const response = await apiFetch('/api/signatures')
```

```typescript
            const response = await fetch(`/api/signatures/${signature.id}`, { method: 'DELETE' })
```
to:
```typescript
            const response = await apiFetch(`/api/signatures/${signature.id}`, { method: 'DELETE' })
```

```typescript
            const response = await fetch('/api/signatures', {
```
to:
```typescript
            const response = await apiFetch('/api/signatures', {
```

```typescript
                const clientUpdateRes = await fetch(`/api/clients/${client.clientId}`, {
```
to:
```typescript
                const clientUpdateRes = await apiFetch(`/api/clients/${client.clientId}`, {
```

```typescript
            const response = await fetch(url, {
```
to:
```typescript
            const response = await apiFetch(url, {
```

- [ ] **Step 4: `components/sections/Dashboard.tsx`**

Add the import:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change the one fetch call:

```typescript
            const response = await fetch(`/api/dashboard/stats?period=${period}&offset=${offset}`)
```
to:
```typescript
            const response = await apiFetch(`/api/dashboard/stats?period=${period}&offset=${offset}`)
```

- [ ] **Step 5: `app/client/[clientId]/page.tsx`**

Add the import, alongside the existing imports:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change all four fetch calls in this file:

```typescript
            const response = await fetch(`/api/reports/${reportPendingDelete.id}`, {
```
to:
```typescript
            const response = await apiFetch(`/api/reports/${reportPendingDelete.id}`, {
```

```typescript
            const response = await fetch(`/api/clients/${clientId}`, {
```
to:
```typescript
            const response = await apiFetch(`/api/clients/${clientId}`, {
```

```typescript
            const clientRes = await fetch(`/api/clients/${clientId}`)
```
to:
```typescript
            const clientRes = await apiFetch(`/api/clients/${clientId}`)
```

```typescript
            const reportsRes = await fetch(`/api/clients/${clientId}/reports`)
```
to:
```typescript
            const reportsRes = await apiFetch(`/api/clients/${clientId}/reports`)
```

- [ ] **Step 6: `components/ui/autocomplete-input.tsx`**

Add the import:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change the one fetch call:

```typescript
                const response = await fetch(`/api/reports/suggestions?field=${field}`)
```
to:
```typescript
                const response = await apiFetch(`/api/reports/suggestions?field=${field}`)
```

- [ ] **Step 7: `components/ui/autocomplete-textarea.tsx`**

Add the import:

```typescript
import { apiFetch } from '@/lib/api-client'
```

Change the one fetch call:

```typescript
                const response = await fetch(`/api/reports/suggestions?field=${field}`)
```
to:
```typescript
                const response = await apiFetch(`/api/reports/suggestions?field=${field}`)
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in any of the 7 files touched.

- [ ] **Step 9: Manual verification**

Run: `npm run dev`. Log in, exercise each flow that was touched (register a client, search clients, open a client and view/print/share a report, create/edit a report, check the Dashboard tab, use autocomplete fields). Everything should work exactly as before — this task only adds a header, no route reads it yet.

- [ ] **Step 10: Commit**

```bash
git add components/sections/RegisterClient.tsx components/sections/SearchClient.tsx components/sections/MedicalReportForm.tsx components/sections/Dashboard.tsx "app/client/[clientId]/page.tsx" components/ui/autocomplete-input.tsx components/ui/autocomplete-textarea.tsx
git commit -m "feat: send auth token on every API call via apiFetch"
```

---

### Task 3: Guard the clients + reports API routes

**Files:**
- Modify: `app/api/clients/route.ts`
- Modify: `app/api/clients/[clientId]/route.ts`
- Modify: `app/api/clients/[clientId]/reports/route.ts`
- Modify: `app/api/reports/[reportId]/route.ts`
- Modify: `app/api/reports/suggestions/route.ts`

**Interfaces:**
- Consumes: `getAuthenticatedUser` from `@/lib/auth` (Task 1).
- Produces: from this point on, `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/[clientId]`, `GET /api/clients/[clientId]/reports`, and `GET /api/reports/suggestions` require any valid session (401 otherwise); `POST /api/clients/[clientId]/reports` and `PUT/DELETE /api/reports/[reportId]` additionally require `role === 'super_admin'` (403 otherwise). Task 5's UI relies on the 403s existing so its own hiding is backed by a real boundary.

- [ ] **Step 1: `app/api/clients/route.ts` — auth-required on both handlers**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'
```

In `GET`, right after the opening `try {`:

```typescript
export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
```

In `POST`, right after the opening `try {`:

```typescript
export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
```

- [ ] **Step 2: `app/api/clients/[clientId]/route.ts` — auth-required on GET/PUT/DELETE**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isValidClientId } from '@/lib/client-id'
import { getAuthenticatedUser } from '@/lib/auth'
```

In `GET`, right after the opening `try {`:

```typescript
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
```

In `PUT`, right after the opening `try {`:

```typescript
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()
```

In `DELETE`, right after the opening `try {`:

```typescript
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
```

(Each of these three handlers already declares `request: Request` as its first parameter — only the body changes.)

- [ ] **Step 3: `app/api/clients/[clientId]/reports/route.ts` — auth-required on GET, `super_admin`-only on POST**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'
```

In `GET`, right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { clientId } = await params
```

In `POST`, right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { clientId } = await params
        const body = await request.json()
```

- [ ] **Step 4: `app/api/reports/[reportId]/route.ts` — `super_admin`-only on PUT and DELETE**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth'
```

In `PUT`, right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { reportId } = await params
        const body = await request.json()
```

In `DELETE`, right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { reportId } = await params
```

- [ ] **Step 5: `app/api/reports/suggestions/route.ts` — auth-required on GET**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth'
```

Right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in any of the 5 files touched.

- [ ] **Step 7: Manual verification against the dev server**

Run: `npm run dev` (leave running in background). In a second terminal, confirm a request with no token is rejected, and one with a valid token succeeds:

```bash
curl -s "http://localhost:3000/api/clients"
# Expected: 401 {"success":false,"error":"Unauthorized"}

curl -s "http://localhost:3000/api/reports/suggestions?field=procedure"
# Expected: 401 {"success":false,"error":"Unauthorized"}
```

Then, in the browser dev tools (logged in), run `(await window.supabase?.auth.getSession())` is not available since `supabase` isn't on `window` — instead, get a real token from the Network tab: perform any in-app action (e.g. search clients) after Task 2 has landed, inspect that request's `Authorization` header in DevTools, copy the token, and:

```bash
TOKEN="<paste the token from DevTools>"
curl -s "http://localhost:3000/api/clients" -H "Authorization: Bearer $TOKEN"
# Expected: 200 with client data

curl -s -X POST "http://localhost:3000/api/clients/LMC-END-0001/reports" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"procedure":"Test"}'
# Expected: 403 if this account's app_metadata.role is not 'super_admin' (true for every account until Task 6's provisioning step), 201 if it is
```

- [ ] **Step 8: Commit**

```bash
git add app/api/clients/route.ts "app/api/clients/[clientId]/route.ts" "app/api/clients/[clientId]/reports/route.ts" "app/api/reports/[reportId]/route.ts" app/api/reports/suggestions/route.ts
git commit -m "feat: require authentication on client/report routes, super_admin on report mutations"
```

---

### Task 4: Guard the signatures + dashboard API routes

**Files:**
- Modify: `app/api/signatures/route.ts`
- Modify: `app/api/signatures/[signatureId]/route.ts`
- Modify: `app/api/dashboard/stats/route.ts`

**Interfaces:**
- Consumes: `getAuthenticatedUser` from `@/lib/auth` (Task 1).
- Produces: `GET/POST /api/signatures`, `DELETE /api/signatures/[signatureId]`, and `GET /api/dashboard/stats` all now require `role === 'super_admin'` (401 if unauthenticated, 403 if authenticated but not `super_admin`).

- [ ] **Step 1: `app/api/signatures/route.ts`**

The current `GET` handler has no `request` parameter — add one, since it now needs to read the `Authorization` header. Replace the full file:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/signatures
 * Retrieves all saved signatures in the reusable signature library
 */
export async function GET(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

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
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

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
```

- [ ] **Step 2: `app/api/signatures/[signatureId]/route.ts`**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth'
```

Right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { signatureId } = await params
```

- [ ] **Step 3: `app/api/dashboard/stats/route.ts`**

Add the import at the top:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'
import {
    startOfDay,
```

(keep the rest of the existing `date-fns` import list unchanged — only the new `getAuthenticatedUser` import line is added, right after the `supabase` import.)

Right after the opening `try {`:

```typescript
    try {
        const auth = await getAuthenticatedUser(request)
        if (!auth) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (auth.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in any of the 3 files touched.

- [ ] **Step 5: Manual verification against the dev server**

```bash
curl -s "http://localhost:3000/api/signatures"
# Expected: 401 {"success":false,"error":"Unauthorized"}

curl -s "http://localhost:3000/api/dashboard/stats?period=week"
# Expected: 401 {"success":false,"error":"Unauthorized"}
```

With a real token (same DevTools approach as Task 3 Step 7):
```bash
curl -s "http://localhost:3000/api/signatures" -H "Authorization: Bearer $TOKEN"
# Expected: 403 (until Task 6 provisions a super_admin account), {"success":false,"error":"Forbidden"}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/signatures/route.ts "app/api/signatures/[signatureId]/route.ts" app/api/dashboard/stats/route.ts
git commit -m "feat: require super_admin role on signature library and dashboard routes"
```

---

### Task 5: UI role-gating

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/client/[clientId]/page.tsx`

**Interfaces:**
- Consumes: `session.user.app_metadata?.role` (Supabase session already fetched in both files); the 403 responses from Tasks 3-4 as the real backstop if a hidden action is somehow still reached.
- Produces: nothing consumed by later tasks — this is the final task in the plan.

- [ ] **Step 1: `app/page.tsx` — hide the Dashboard tab for `admin`**

Add a `role` state and compute it alongside the existing session check. Replace the `useEffect` block:

```typescript
  const [activeTab, setActiveTab] = useState<'register' | 'search' | 'dashboard'>('register')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        setRole(session.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin')
        setLoading(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        setRole(session.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])
```

Update the role label in the header (it currently always says "System Administrator"):

```tsx
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter bg-blue-50 px-1 rounded">System Administrator</p>
```
to:
```tsx
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter bg-blue-50 px-1 rounded">
                  {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
```

Wrap the Dashboard tab button so it only renders for `super_admin`:

```tsx
            {/* Dashboard Tab */}
            {role === 'super_admin' && (
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
            )}
```

And guard the rendered content the same way, in case `activeTab` is somehow still `'dashboard'` for an `admin` session (e.g. stale state from a role change mid-session):

```tsx
        {activeTab === 'register' && <RegisterClient />}
        {activeTab === 'search' && <SearchClient />}
        {activeTab === 'dashboard' && role === 'super_admin' && <Dashboard />}
```

- [ ] **Step 2: `app/client/[clientId]/page.tsx` — add the session/role check, redirect if unauthenticated**

This page currently has no auth check at all (the comment says "assuming middleware or parent layout checks" but nothing actually checks). Add the import:

```typescript
import { supabase } from '@/lib/supabase'
```

Add role state and a session check effect, right after the existing state declarations (after `const [deletingClient, setDeletingClient] = useState(false)`):

```typescript
    const [deletingClient, setDeletingClient] = useState(false)
    const [role, setRole] = useState<'admin' | 'super_admin'>('admin')

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setRole(session.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin')
        }
        checkSession()
    }, [router])
```

(This file already imports `useEffect` and `useRouter` — only the new `useState`/effect block and the `supabase` import are added.)

- [ ] **Step 3: Hide "+ New Report" and the empty-state CTA for `admin`**

```tsx
                                <Button
                                    onClick={() => {
                                        setEditingReport(null)
                                        setIsEditingReport(true)
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    + New Report
                                </Button>
```
to:
```tsx
                                {role === 'super_admin' && (
                                    <Button
                                        onClick={() => {
                                            setEditingReport(null)
                                            setIsEditingReport(true)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                    >
                                        + New Report
                                    </Button>
                                )}
```

```tsx
                            {reports.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-100 bg-slate-50/50">
                                    <p className="text-slate-400 italic">No reports found in this folder</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setIsEditingReport(true)}
                                        className="text-blue-600 font-bold"
                                    >
                                        Click here to create the first report
                                    </Button>
                                </div>
                            ) : (
```
to:
```tsx
                            {reports.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-100 bg-slate-50/50">
                                    <p className="text-slate-400 italic">No reports found in this folder</p>
                                    {role === 'super_admin' && (
                                        <Button
                                            variant="link"
                                            onClick={() => setIsEditingReport(true)}
                                            className="text-blue-600 font-bold"
                                        >
                                            Click here to create the first report
                                        </Button>
                                    )}
                                </div>
                            ) : (
```

- [ ] **Step 4: Make report cards read-only (no open-to-edit, no Delete) for `admin`**

```tsx
                                    {reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="group p-6 rounded-2xl border bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                            onClick={() => {
                                                setEditingReport(report)
                                                setIsEditingReport(true)
                                            }}
                                        >
```
to:
```tsx
                                    {reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className={`group p-6 rounded-2xl border bg-white transition-all duration-300 relative overflow-hidden ${role === 'super_admin'
                                                ? 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 cursor-pointer'
                                                : ''
                                                }`}
                                            onClick={() => {
                                                if (role !== 'super_admin') return
                                                setEditingReport(report)
                                                setIsEditingReport(true)
                                            }}
                                        >
```

And the card's action row:

```tsx
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                triggerPrint(report)
                                                            }}
                                                        >
                                                            <Printer className="w-3.5 h-3.5 mr-1" />
                                                            Print
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShare(report)
                                                            }}
                                                        >
                                                            <Share2 className="w-3.5 h-3.5 mr-1" />
                                                            Share
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setReportPendingDelete(report)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                            Delete
                                                        </Button>
                                                        <span className="text-blue-600 font-bold text-sm self-center">Open →</span>
                                                    </div>
```
to:
```tsx
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                triggerPrint(report)
                                                            }}
                                                        >
                                                            <Printer className="w-3.5 h-3.5 mr-1" />
                                                            Print
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShare(report)
                                                            }}
                                                        >
                                                            <Share2 className="w-3.5 h-3.5 mr-1" />
                                                            Share
                                                        </Button>
                                                        {role === 'super_admin' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setReportPendingDelete(report)
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                    Delete
                                                                </Button>
                                                                <span className="text-blue-600 font-bold text-sm self-center">Open →</span>
                                                            </>
                                                        )}
                                                    </div>
```

(The "Delete Client" button and its handler are unchanged — both roles keep that per the spec.)

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to `app/page.tsx` or `app/client/[clientId]/page.tsx`.

Run: `npm run lint`
Expected: the same pre-existing config-loading error as before, nothing new.

- [ ] **Step 6: Manual verification in the browser**

With `npm run dev` running: this requires Task 6's account provisioning to be done first to see both roles live (an `admin`-role session and a `super_admin`-role session). For the `admin` account: confirm the Dashboard tab is gone, the header label reads "Admin", opening a client with reports shows them without "Open →"/Delete but with working Print/Share, "+ New Report" and the empty-state CTA are gone, and "Delete Client" still works. For the `super_admin` account: confirm nothing changed from current behavior.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx "app/client/[clientId]/page.tsx"
git commit -m "feat: hide dashboard and report mutation controls from the admin role"
```

---

## Post-implementation: account provisioning (not a coded task)

This cannot be scripted — it requires the user to create a real account with their own chosen credentials. Once Tasks 1-5 are merged:

1. User creates a new account in the Supabase dashboard (Authentication → Users → Add User), choosing their own email and password.
2. User provides that email.
3. Run this SQL (via the Supabase SQL editor, or the Management API as done for prior migrations in this project) to grant it the `super_admin` role:
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
   WHERE email = '<the new account's email>';
   ```
4. The existing account needs no change — `role` defaults to `admin` whenever `app_metadata.role` is unset.
5. End-to-end check: log in as each account and confirm the behavior described in Task 5 Step 6.
