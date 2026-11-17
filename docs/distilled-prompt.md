# Distilled prompt — OneLab Reconciliation (reusable implementation brief)

**Goal:** Build a local-first React + TypeScript + Vite + Tailwind web app, "OneLab Reconciliation", that reconciles platform transactions against bank settlements for a reporting month (default Oct 2026, INR, Asia/Kolkata) and explains every discrepancy.

**Pages:** Dashboard (KPIs, charts, bridge, month/currency selectors), Data Import (CSV upload with column mapping, validation, preview, malformed-row reporting, sample loader, clear), Reconciliation (run, filters, sortable table, click-for-detail panel with source rows), Discrepancy Investigation (exception ID, category, severity, amount, source dataset/row, reason, recommended action), Reports (7 CSV downloads + manager summary), Settings (per-record/aggregate rounding tolerance, grace days, timezone, assumptions).

**Engine (independent TS modules, integer paise):** validate/normalise → detect duplicates per dataset (settlement ID for bank) → canonical records → match on transaction ID + event type + currency → amount compare vs per-record tolerance (₹0.01) → timing (settled ≤2 days after month-end) → rounding (individual + aggregate vs ₹0.01) → orphan refunds (original_transaction_id not in platform) → platform-only / bank-only → auditable result + financial bridge with explicit formula.

**Sample data (deterministic, `public/sample-data/`):** 38 valid platform rows + 1 invalid; 40 bank rows incl. 1 exact duplicate. Plant: month-boundary TXN-1031 (2026-10-31 → settled 2026-11-01); 3× ₹0.01 rounding (aggregate ₹0.03); duplicate settlement STL-2006; orphan refund STL-2038 referencing missing TXN-9997. Plus platform-only, bank-only, ₹300 amount mismatch, legitimate refund pair, invalid row. Ground truth in `docs/ground-truth.md`.

**Testing:** Vitest + RTL, ≥15 engine tests covering the brief's 15 cases plus a sample-data integration test asserting the verified numbers; `npm test` must pass; `npm run build` must pass.

**Constraints:** No hardcoded dashboard counts; no dead buttons or placeholders; no data sent externally; no invented deployment URL or video — provide Vercel instructions and `docs/demo-script.md` instead; ZIP excluding node_modules/dist.
