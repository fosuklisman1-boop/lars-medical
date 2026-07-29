# Client & Report Deletion — Design Spec

**Date:** 2026-07-29
**Status:** Approved

## Problem

There is no way to delete a client or an individual medical report from the UI. A `DELETE /api/reports/[reportId]` endpoint exists but is unused by any UI. A `DELETE /api/clients/[clientId]` endpoint exists but only removes the `Client` row, leaving that client's `MedicalReport` rows orphaned (referencing a `clientId` that no longer resolves to a client).

## Context

- The app is single-role: one Supabase Auth login gate protects the entire app (`app/page.tsx`, `app/login/page.tsx`). There is no roles table or permission tiers. Any authenticated user is already treated as "System Administrator" in the UI copy. This feature does not add a new permission layer — it adds delete UI/logic available to any logged-in user, consistent with the rest of the app.
- Data model: `Client` (keyed by human-readable `clientId`, e.g. `LMC-END-0001`) has a one-to-many relationship with `MedicalReport` (each report row has a `clientId` foreign column, no confirmed DB-level cascade).
- Existing UI touchpoints:
  - `components/sections/SearchClient.tsx` — renders a list of client search results, each row navigates to `/client/[clientId]` on click.
  - `app/client/[clientId]/page.tsx` — client detail page listing that client's reports as cards, each with Print/Share buttons.
- `components/ui/alert-dialog.tsx` (shadcn) is already present in the project and unused elsewhere for destructive-action confirmation — no new dependency needed.

## Design

### 1. Backend: fix cascade delete in `app/api/clients/[clientId]/route.ts`

The existing `DELETE` handler deletes only the `Client` row. Change it to:

1. Delete all `MedicalReport` rows where `clientId` equals the target client's `clientId`.
2. If that succeeds, delete the `Client` row.
3. Return `{ success: true, message: 'Client deleted successfully', reportsDeleted: <count> }`.

Order matters: reports are deleted first so that if the client-row delete fails for any reason, we haven't left a dangling client with reports silently removed — and if the report delete fails, we abort before touching the client, leaving the system in its original consistent state rather than an orphaned-client state.

No change to `app/api/reports/[reportId]/route.ts` — its `DELETE` handler already works correctly for deleting a single report.

### 2. `components/sections/SearchClient.tsx` — delete client from list

- Add a trash-icon `Button` to each search result row, positioned so it doesn't trigger the row's existing `onClick` navigation (`e.stopPropagation()`).
- Clicking opens an `AlertDialog` confirmation: "Delete [client name]? This will permanently delete this client and all of their medical reports. This cannot be undone."
- On confirm: `DELETE /api/clients/${clientId}`. On success, remove the client from local `searchResults` state and show a success toast (mentioning `reportsDeleted` count if > 0). On failure, show an error toast and leave state untouched.

### 3. `app/client/[clientId]/page.tsx` — delete report and delete client

**Delete report** (per report card, alongside existing Print/Share buttons):
- Add a "Delete" button with a trash icon, same `stopPropagation` treatment since cards are clickable to open the report editor.
- Confirm via `AlertDialog`: "Delete this report? This cannot be undone."
- On confirm: `DELETE /api/reports/${report.id}`. On success, remove it from local `reports` state and toast success. On failure, toast error.

**Delete client** (in the client header card, near the name/badges):
- Add a trash-icon button.
- Confirm via `AlertDialog` with a stronger warning naming the report count: "Delete [client name] and all N of their medical report(s)? This cannot be undone."
- On confirm: `DELETE /api/clients/${clientId}`. On success, toast success and `router.push('/')`. On failure, toast error and stay on the page.

### Error handling

All three actions:
- Wrap the fetch in try/catch.
- Never mutate local UI state until the API call resolves successfully.
- Show `toast.error` with a specific message on failure (network error vs. API-reported error).
- Use the existing `sonner` toast pattern already used throughout the app.

### Out of scope

- No new authentication/authorization roles.
- No schema migration — assumes existing `MedicalReport.clientId` column already used by the reports-fetch endpoint.
- No bulk/multi-select delete.
- No "undo" or soft-delete/trash mechanism — deletes are permanent, matching the existing single-report DELETE endpoint's behavior.

## Testing

- Manually verify: create a client, add a report, delete the client, then confirm `GET /api/clients/[clientId]` returns 404 and `GET /api/clients/[clientId]/reports` returns an empty list (no orphaned rows).
- Manually verify: deleting a single report removes only that report, client and other reports remain.
- Manually verify: cancelling either confirmation dialog leaves data untouched.
- Manually verify: error toast appears if a delete call fails (e.g. temporarily point at an invalid ID).
