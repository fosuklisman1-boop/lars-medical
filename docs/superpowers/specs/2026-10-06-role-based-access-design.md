# Role-Based Access Control — Design

**Date:** 2026-10-06
**Status:** Approved, ready for implementation planning

## Problem

Every logged-in user is currently treated identically as "System Administrator" — there is no role concept anywhere in the app, and no API route checks who (if anyone) is calling it. Authorization today is purely a client-side UI convenience: any request that reaches an API route directly (bypassing the browser UI) succeeds regardless of whether the caller is logged in.

The clinic wants two tiers of access:
- **`admin`** (the existing account): can register clients, search clients, and delete clients. Can view and print/share a client's existing reports, but cannot create, edit, or delete reports, and cannot see the admin dashboard.
- **`super_admin`** (a new account): full access to everything — clients, reports (create/edit/delete), the signature library, and the analytics dashboard.

This must be a real security boundary, not just hidden UI — a caller who bypasses the browser and calls an API route directly must still be blocked.

## Goals

- Introduce exactly two roles: `admin` and `super_admin`, stored in each Supabase Auth user's `app_metadata.role` (writable only via the service-role key — a user can never self-escalate their own role).
- Every API route requires a valid authenticated session (401 if missing/invalid) — closing the existing gap where routes accept unauthenticated requests.
- Report-mutation routes (create/edit/delete) and the dashboard-stats/signature-library routes additionally require `role === 'super_admin'` (403 otherwise).
- Client registration/search/delete routes remain open to both roles (any authenticated user).
- UI hides what a role can't do (Dashboard tab, New Report, report edit/delete) — this is for UX, not the security boundary; the server-side checks are the real gate.
- `role` defaults to `admin` when `app_metadata.role` is unset — fail-safe-restrictive. This means the existing account needs no metadata change at all to become the limited role.

## Non-goals

- No self-service account creation or role-management UI — exactly two accounts, provisioned manually via the Supabase dashboard.
- No granular per-permission system (e.g. "can delete clients but not reports") — just the two fixed roles described above.
- No RLS-policy-level enforcement (Postgres row security) — enforcement lives in the API route layer, consistent with how this app already handles authorization-adjacent logic (e.g. the service-role-only delete pattern already used for `MedicalReport`/`Client` deletes).
- No change to how a user logs in (still Supabase email/password via the existing `/login` page) — only what their session is subsequently allowed to do.

## Data model

No new tables or columns. Role lives in Supabase Auth's built-in `app_metadata` field on each user (`{ "role": "admin" | "super_admin" }`), set via the Supabase Admin API / service-role client — never settable by the user themselves (unlike `user_metadata`, which a client-side call could modify). `app_metadata` is included in the issued JWT, so it's readable by both the browser (for UI hiding) and the server (for route checks) without an extra query.

## Server-side enforcement

**New `lib/auth.ts`:**
```typescript
export async function getAuthenticatedUser(request: Request): Promise<{ user: User; role: 'admin' | 'super_admin' } | null>
```
Reads the `Authorization: Bearer <token>` header, calls `supabase.auth.getUser(token)` to validate it, and returns the user plus `user.app_metadata?.role ?? 'admin'`. Returns `null` if the header is missing or the token is invalid.

**New `lib/api-client.ts`:**
```typescript
export async function apiFetch(url: string, options?: RequestInit): Promise<Response>
```
Wraps `fetch`, automatically attaching `Authorization: Bearer <session.access_token>` from `supabase.auth.getSession()`. Replaces every raw `fetch('/api/...')` call in the app (7 files: `RegisterClient.tsx`, `SearchClient.tsx`, `MedicalReportForm.tsx`, `Dashboard.tsx`, `app/client/[clientId]/page.tsx`, `components/ui/autocomplete-input.tsx`, `components/ui/autocomplete-textarea.tsx`).

**Every API route** starts with `getAuthenticatedUser(request)`; `null` → 401. Routes in the matrix below additionally check `role === 'super_admin'`; otherwise → 403.

## Route permission matrix

| Route | `admin` | `super_admin` |
|---|---|---|
| `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/[clientId]` | allowed | allowed |
| `GET /api/clients/[clientId]/reports` (list) | allowed | allowed |
| `POST /api/clients/[clientId]/reports` (create report) | 403 | allowed |
| `PUT/DELETE /api/reports/[reportId]` | 403 | allowed |
| `GET /api/reports/suggestions` | allowed | allowed |
| `GET/POST/DELETE /api/signatures`, `/api/signatures/[signatureId]` | 403 | allowed |
| `GET /api/dashboard/stats` | 403 | allowed |

All routes above require authentication at minimum (401 if missing); rows not marked 403 for `admin` are allowed for both roles once authenticated.

## UI changes

- `app/page.tsx`: read role from `session.user.app_metadata?.role` (default `admin`); render the "Dashboard" tab only for `super_admin`.
- `app/client/[clientId]/page.tsx` for `admin`: hide "+ New Report" and the empty-state "create first report" link; report cards lose their click-to-edit behavior ("Open →" removed) and their Delete button; Print and Share remain; "Delete Client" stays visible for both roles.
- `components/sections/SearchClient.tsx`: unchanged — delete-client available to both.
- A 403 from the server (reached only if someone bypasses the UI) shows a toast error, not a crash.

## Account provisioning

- Existing account: no change needed — `role` defaults to `admin` when `app_metadata.role` is unset.
- New super-admin account: created by the user directly in the Supabase dashboard (Authentication → Users → Add User, their own choice of email/password). The user then provides the email so `app_metadata.role = "super_admin"` can be set via a one-off SQL update (`UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb WHERE email = ...`).

## Testing

No automated test suite exists in this repo (established convention — verification via `npx tsc --noEmit`, `npm run lint`, and manual/curl testing). Manual verification:
- Log in as the existing (now `admin`) account: confirm Dashboard tab is gone, "+ New Report" is gone, report cards show Print/Share but not Open/Delete, Delete Client still works.
- Attempt to `curl` a restricted route (e.g. `POST /api/clients/[id]/reports`) with the `admin` account's token: expect 403.
- Attempt the same routes with no `Authorization` header at all: expect 401.
- Log in as the new `super_admin` account: confirm full access, including Dashboard and report create/edit/delete.
