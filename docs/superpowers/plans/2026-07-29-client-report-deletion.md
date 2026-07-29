# Client & Report Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any logged-in user delete a client (cascading to all of that client's medical reports) and delete individual medical reports, from the existing Search Clients list and the client detail page.

**Architecture:** Fix the existing `DELETE /api/clients/[clientId]` endpoint to delete `MedicalReport` rows before the `Client` row (currently it orphans reports). Wire the already-working `DELETE /api/reports/[reportId]` endpoint and the fixed client endpoint into two existing client components using the project's existing `AlertDialog` (shadcn/Radix) for confirmation and `sonner` for toasts. No new dependencies, no schema changes, no auth changes.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase JS client (`@supabase/supabase-js`), shadcn/ui components (`alert-dialog`, `button`, `badge`, `card`), `sonner` for toasts, `lucide-react` for icons.

## Global Constraints

- No new npm dependencies — `alert-dialog.tsx`, `button.tsx`, `sonner` are already in the project.
- No test framework exists in this repo (no jest/vitest/playwright configured, confirmed via `package.json`). Verification is via `npx tsc --noEmit`, `npm run lint`, and manual testing against the dev server (`npm run dev`) using `curl` for API checks and a browser for UI checks. Do not introduce a test framework as part of this feature.
- Deletes are permanent — no soft-delete/trash, no undo, matching the existing single-report DELETE endpoint's current behavior.
- Never mutate component state to reflect a delete until the API call has resolved successfully.
- Match existing code style in each file (this codebase does not use comments explaining *what* code does — only keep that pattern).

---

### Task 1: Fix cascade delete in the client DELETE endpoint

**Files:**
- Modify: `app/api/clients/[clientId]/route.ts:148-192` (the `DELETE` handler)

**Interfaces:**
- Consumes: `supabase` client from `@/lib/supabase` (already imported in this file), `isValidClientId` from `@/lib/client-id` (already imported).
- Produces: `DELETE /api/clients/[clientId]` now returns `{ success: true, message: 'Client deleted successfully', reportsDeleted: number }` on success. This is the shape Task 3's "Delete Client" UI reads from.

- [ ] **Step 1: Replace the DELETE handler body**

Replace the existing `DELETE` function (lines 148-192) with:

```typescript
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
    const { clientId } = await params

    // Validate client ID format
    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format. Expected format: LMC-XXXXXX' },
        { status: 400 }
      )
    }

    // Delete all reports for this client first, so a failure here never
    // leaves an orphaned client with reports silently removed.
    const { error: reportsError, count: reportsDeleted } = await supabase
      .from('MedicalReport')
      .delete({ count: 'exact' })
      .eq('clientId', clientId)

    if (reportsError) {
      throw reportsError
    }

    // Delete the client
    const { error } = await supabase
      .from('Client')
      .delete({ count: 'exact' })
      .eq('clientId', clientId)

    if (error) {
      throw error
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `app/api/clients/[clientId]/route.ts`.

- [ ] **Step 3: Manual verification against the dev server**

Run: `npm run dev` (leave running in background)

In a second terminal, register a throwaway client and a report for them, then delete the client and confirm both are gone:

```bash
CLIENT=$(curl -s -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -d '{"name":"Delete Test","sex":"M","age":30}')
echo "$CLIENT"
CLIENT_ID=$(echo "$CLIENT" | grep -o '"clientId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "clientId=$CLIENT_ID"

curl -s -X POST "http://localhost:3000/api/clients/$CLIENT_ID/reports" -H "Content-Type: application/json" -d '{"procedure":"Test procedure"}'

curl -s -X DELETE "http://localhost:3000/api/clients/$CLIENT_ID"
# Expected: {"success":true,"message":"Client deleted successfully","reportsDeleted":1}

curl -s "http://localhost:3000/api/clients/$CLIENT_ID"
# Expected: 404 body: {"success":false,"error":"Client not found"}

curl -s "http://localhost:3000/api/clients/$CLIENT_ID/reports"
# Expected: {"success":true,"data":[]}
```

Expected: `reportsDeleted` is `1`, the client fetch 404s, and the reports fetch returns an empty array.

- [ ] **Step 4: Commit**

```bash
git add app/api/clients/[clientId]/route.ts
git commit -m "fix: cascade-delete reports when a client is deleted"
```

---

### Task 2: Delete-client button in Search Clients results

**Files:**
- Modify: `components/sections/SearchClient.tsx`

**Interfaces:**
- Consumes: `DELETE /api/clients/[clientId]` from Task 1, returning `{ success, message, reportsDeleted }` on success or `{ success: false, error }` on failure.
- Produces: nothing consumed by later tasks (this task is UI-only, independent of Task 3).

- [ ] **Step 1: Add imports and delete-state**

In `components/sections/SearchClient.tsx`, update the top imports and add local state for tracking which client is pending deletion:

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Client } from '@/types'
```

Inside the `SearchClient` function, add state right after the existing `searchResults` state:

```typescript
  const [clientPendingDelete, setClientPendingDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)
```

- [ ] **Step 2: Add the delete handler**

Add this function alongside the existing `handleSelectClient`/`handleClearSearch` functions:

```typescript
  const handleDeleteClient = async () => {
    if (!clientPendingDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/clients/${clientPendingDelete.clientId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to delete client')
        return
      }

      setSearchResults((prev) =>
        prev.filter((c) => c.clientId !== clientPendingDelete.clientId)
      )
      toast.success(
        result.reportsDeleted
          ? `Client deleted along with ${result.reportsDeleted} report(s)`
          : 'Client deleted successfully'
      )
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('An error occurred while deleting the client')
    } finally {
      setDeleting(false)
      setClientPendingDelete(null)
    }
  }
```

- [ ] **Step 3: Add the delete button to each search result row**

Replace the search result row's JSX (the `.map((client) => (...))` block) so the row has a delete button that does not trigger navigation:

```tsx
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="p-4 border rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group"
                onClick={() => handleSelectClient(client.clientId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{client.name}</p>
                    <p className="text-sm text-slate-500">ID: <Badge variant="secondary">{client.clientId}</Badge></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-slate-500">
                      <p>Age: {client.age} • {client.sex}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setClientPendingDelete(client)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
```

- [ ] **Step 4: Add the confirmation dialog**

Add this JSX just before the closing `</div>` of the component's root `return`:

```tsx
      <AlertDialog open={!!clientPendingDelete} onOpenChange={(open) => !open && setClientPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {clientPendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client and all of their medical reports. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteClient()
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to `components/sections/SearchClient.tsx`.

Run: `npm run lint`
Expected: no new errors related to this file.

- [ ] **Step 6: Manual verification in the browser**

With `npm run dev` running, log in, go to the Search Clients tab, search for the test client created in Task 1 (or register a new one), click the trash icon, confirm the dialog shows the client's name and a warning about reports, click Delete, and confirm the row disappears and a success toast appears. Click the trash icon on another client and click Cancel — confirm the row remains.

- [ ] **Step 7: Commit**

```bash
git add components/sections/SearchClient.tsx
git commit -m "feat: add delete-client action to Search Clients results"
```

---

### Task 3: Delete-report and delete-client actions on the client detail page

**Files:**
- Modify: `app/client/[clientId]/page.tsx`

**Interfaces:**
- Consumes: `DELETE /api/reports/[reportId]` (existing, unchanged, returns `{ success: true, message }`), `DELETE /api/clients/[clientId]` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add imports and delete-state**

In `app/client/[clientId]/page.tsx`, update imports:

```typescript
import { Printer, Loader2, Home as HomeIcon, Share2, Trash2 } from 'lucide-react'
```

and add:

```typescript
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
```

Inside the component, alongside the existing `reportToPrint` state, add:

```typescript
    const [reportPendingDelete, setReportPendingDelete] = useState<MedicalReport | null>(null)
    const [deletingReport, setDeletingReport] = useState(false)
    const [clientPendingDelete, setClientPendingDelete] = useState(false)
    const [deletingClient, setDeletingClient] = useState(false)
```

- [ ] **Step 2: Add the delete-report handler**

Add alongside `handleShare`/`fetchClientAndReports`:

```typescript
    const handleDeleteReport = async () => {
        if (!reportPendingDelete) return

        setDeletingReport(true)
        try {
            const response = await fetch(`/api/reports/${reportPendingDelete.id}`, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to delete report')
                return
            }

            setReports((prev) => prev.filter((r) => r.id !== reportPendingDelete.id))
            toast.success('Report deleted successfully')
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.error('An error occurred while deleting the report')
        } finally {
            setDeletingReport(false)
            setReportPendingDelete(null)
        }
    }
```

- [ ] **Step 3: Add the delete-client handler**

Add alongside `handleDeleteReport`:

```typescript
    const handleDeleteClient = async () => {
        setDeletingClient(true)
        try {
            const response = await fetch(`/api/clients/${clientId}`, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                toast.error(result.error || 'Failed to delete client')
                return
            }

            toast.success(
                result.reportsDeleted
                    ? `Client deleted along with ${result.reportsDeleted} report(s)`
                    : 'Client deleted successfully'
            )
            router.push('/')
        } catch (error) {
            console.error('Error deleting client:', error)
            toast.error('An error occurred while deleting the client')
        } finally {
            setDeletingClient(false)
            setClientPendingDelete(false)
        }
    }
```

- [ ] **Step 4: Add a delete-client button to the header card**

In the header `Card` (the one rendering `client.name`, `client.clientId`, etc.), change the outer flex container so a delete button sits opposite the client info:

```tsx
                        <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-blue-50/50">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {client.name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800">{client.name}</h2>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <Badge className="bg-slate-800">{client.clientId}</Badge>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600">{client.age} years</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-600">{client.sex}</span>
                                        </div>
                                        {client.address && (
                                            <p className="text-sm text-slate-500 mt-2">{client.address}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setClientPendingDelete(true)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Client
                                </Button>
                            </div>
                        </Card>
```

- [ ] **Step 5: Add a delete button to each report card**

In the report card's action row (currently containing Print and Share buttons), add a Delete button:

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

- [ ] **Step 6: Add both confirmation dialogs**

Add just before the "Print Container" `<div>` near the end of the component's JSX:

```tsx
                {/* Delete Report Confirmation */}
                <AlertDialog open={!!reportPendingDelete} onOpenChange={(open) => !open && setReportPendingDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the {reportPendingDelete?.procedure || 'selected'} report. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingReport}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingReport}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDeleteReport()
                                }}
                            >
                                {deletingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Client Confirmation */}
                <AlertDialog open={clientPendingDelete} onOpenChange={setClientPendingDelete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {client.name} and all {reports.length} of their report(s)?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this client and every medical report on file for them. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingClient}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingClient}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDeleteClient()
                                }}
                            >
                                {deletingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

```

- [ ] **Step 7: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors related to `app/client/[clientId]/page.tsx`.

Run: `npm run lint`
Expected: no new errors related to this file.

- [ ] **Step 8: Manual verification in the browser**

With `npm run dev` running: register a test client, add two reports. On the client detail page, hover a report card and click Delete, confirm the dialog names the report's procedure, confirm, and verify the card disappears and the other report remains. Then click "Delete Client" in the header, confirm the dialog mentions the remaining report count, confirm, and verify you're redirected to `/` and the client no longer appears in search.

- [ ] **Step 9: Commit**

```bash
git add "app/client/[clientId]/page.tsx"
git commit -m "feat: add delete-report and delete-client actions to client detail page"
```
