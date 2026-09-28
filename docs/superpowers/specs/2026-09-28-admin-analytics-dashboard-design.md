# Admin Analytics Dashboard — Design

**Date:** 2026-09-28
**Status:** Approved, ready for implementation planning

## Problem

Admin has no visibility into clinic activity or revenue. There's no way to see how many clients have been registered overall, how many visits (reports) happened in a given day/week/month, or how much money was charged for those visits. There's also currently no concept of an "amount charged" anywhere in the data model.

## Goals

- Add a per-report `amount` (GH₵) charged at report-creation time, entered manually by admin.
- The amount must never appear on the printed/shared medical report — it is for internal admin use only.
- A new "Dashboard" tab (on the existing home page, alongside Register Client / Search Clients) showing:
  - **Total Clients** — an all-time count, does not change with period selection.
  - **Visits** — count of reports created within a selected period (Day / Week / Month).
  - **Revenue** — sum of `amount` for reports created within that same period.
  - A trend chart (using the already-installed `recharts` library) plotting visits/revenue across the selected period.
  - Prev/next navigation to view past periods (e.g. last week, a previous month), not just the current one.

## Non-goals

- No price list / auto-pricing by procedure type — amount is always manually entered.
- No backfilling amounts onto historical reports; revenue accumulates only from reports created after this ships (older reports have `amount = null` and are excluded from revenue sums but still counted as visits).
- No role-based access control — this app currently treats every logged-in user as an admin; the dashboard is visible to anyone who can log in, same as the rest of the app.
- No materialized/precomputed summary tables — aggregation is computed live per request; can be revisited later if data volume ever makes this slow.

## Data model

Add one column via a standalone SQL migration file (`add_amount_column.sql`), matching this project's existing pattern (`add_biopsy.sql`, `add_letterhead_column.sql`, etc.):

- `amount` — nullable numeric, GH₵, on the reports table.

This field is never read by `PrintReport.tsx` or by the PDF/share generation path in `app/client/[clientId]/page.tsx`, so it structurally cannot leak onto a printed or shared report.

## API

New route: `GET /api/dashboard/stats?period=day|week|month&offset=0`

- `period` — selects the aggregation window granularity.
- `offset` — shifts the window backward by N periods (`0` = current period, `1` = previous, etc.), backing the prev/next UI controls. Window boundaries (e.g. "this week" = Mon–Sun) are computed server-side from `period` + `offset`.

Response shape:

```json
{
  "success": true,
  "data": {
    "totalClients": 0,
    "visits": 0,
    "revenue": 0,
    "rangeLabel": "Sep 21 – Sep 27, 2026",
    "trend": [
      { "label": "Mon", "visits": 0, "revenue": 0 }
    ]
  }
}
```

- `totalClients` — `COUNT(*)` on `Client`, all-time, unaffected by `period`/`offset`.
- `visits` — `COUNT(*)` on reports where `date` (the existing report-visit timestamp column, set at creation) falls within the resolved window.
- `revenue` — `SUM(amount)` on the same set of reports (nulls excluded automatically by `SUM`).
- `trend` — one point per day. Week view: 7 points, one per day of the resolved week. Month view: one point per day of the resolved month. Day view: a single day's total isn't a meaningful chart, so it instead shows the 7 rolling days ending on the resolved day (giving today's number visible context against the recent trend), while the `visits`/`revenue` stat tiles still reflect only the resolved day itself.

## UI

- New "Dashboard" tab on `app/page.tsx`, alongside "Register Client" and "Search Clients", following the existing tab pattern.
- Day / Week / Month toggle, plus prev/next arrows tied to the `offset` param, with a label showing the resolved date range.
- Three stat tiles (using existing shadcn card patterns): Total Clients (static), Visits, Revenue (GH₵) — the latter two react to the period/offset selection.
- A recharts line or bar chart beneath the tiles, plotting the `trend` data (visits and/or revenue).
- On `MedicalReportForm.tsx`, a new optional "Amount Charged (GH₵)" number input, visually separated from the clinical fields (its own small section), never rendered on the print/PDF view.

## Error handling & edge cases

- Empty periods (zero reports) render as zero values, not errors.
- Reports with `amount = null` (all pre-existing reports, and any report where admin leaves it blank) are excluded from `SUM` but still counted in `visits`.
- API failure surfaces an inline error state with a retry action, consistent with the existing loading/error pattern in `SearchClient.tsx`.

## Testing

Manual verification:
- Create reports with varying amounts and creation dates; confirm stat tiles and chart match expected totals for Day/Week/Month.
- Confirm prev/next navigation shifts the window correctly and updates the range label.
- Confirm a report with no amount doesn't break the revenue sum or throw an error.
- Confirm the amount field never appears in the print view, generated PDF, or share flow.

## Related work in this batch (separate specs/approvals, not part of this doc)

- **WhatsApp share fix** (bounded, approved in chat): split `handleShare` behavior by platform — mobile keeps `navigator.share` with the file; desktop auto-downloads the PDF and opens a `wa.me` link with prefilled text ("Hello, please find the medical report attached."), with a toast instructing the admin to attach the downloaded file manually.
- **Electronic signature on reports** (bounded, approved in chat): add nullable `signatureImage` (base64 PNG) column to reports; `MedicalReportForm` gets a draw-or-upload signature section (optional, leaving it blank preserves today's physical-signing flow); `PrintReport.tsx` renders the image if present, otherwise the existing static text.
