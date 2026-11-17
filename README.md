# OneLab Reconciliation

A local-first payment reconciliation & discrepancy investigation platform (React + TypeScript + Vite + Tailwind + Recharts + PapaParse + Zod + Vitest).

## Run it
```bash
cd onelab-reconciliation
npm install
npm run dev        # http://localhost:5173
npm test           # 19 tests (Vitest)
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

## Demo (60 seconds)
1. Open the app → **Data Import** → **Load sample datasets** (38 platform records, 40 bank rows, 1 invalid row rejected and reported).
2. **Dashboard** → month `2026-10`, currency `INR` → **Run reconciliation**.
3. **Reconciliation** → filter TIMING → open TXN-1031 (processed 31 Oct, settled 1 Nov).
4. Dashboard banner: 3 rounding records × ₹0.01 = aggregate ₹0.03, above tolerance.
5. **Discrepancies** → DUPLICATE_ENTRY STL-2006 (₹4,799 excluded) and ORPHAN_REFUND STL-2038 (original TXN-9997 does not exist).
6. **Reports** → download any CSV (all generated from the live result).

## Verified sample results (Oct 2026)
Platform 38 records ₹1,46,365.49 · Bank in period ₹1,26,268.46 · Matched 36 (₹1,29,866.49) · Timing 1 (₹12,499.00) · Rounding aggregate ₹0.03 · Duplicate ₹4,799.00 excluded · Orphan refund −₹2,499.00 · Platform-only 1 (₹8,999.00) · Bank-only 1 (₹4,200.00) · Amount mismatch 1 (₹300.00) · Invalid 1 · **Final unexplained difference ₹0.00** (status: RECONCILED_WITH_EXCEPTIONS). Full ground truth: `docs/ground-truth.md`.

## Architecture
- `src/features/reconciliation/` — independent engine modules: `reconciliationEngine`, `matchingEngine`, `duplicateDetection`, `roundingAnalysis`, `timingAnalysis`, `refundValidation`, `exceptionClassifier`, `validation` (Zod).
- `src/utils/` — `currency` (integer paise), `date`, `csv` (PapaParse + CSV export).
- `src/pages/` — Dashboard, Data Import, Reconciliation, Discrepancy Investigation, Reports, Settings. `src/state.tsx` — in-memory app state (no persistence, no external calls).
- Sample data: `public/sample-data/platform_transactions.csv`, `bank_settlements.csv` (deterministic).

## Assumptions
Transaction IDs are the primary matching key; settlement IDs detect duplicates; a sale and its refund never match each other; refunds reduce net cash; INR only, no FX; no fees/taxes/chargebacks; normal settlement delay 1–2 days; per-record rounding tolerance ₹0.01, aggregate tolerance ₹0.01, grace period 2 days after month-end; each currency reconciled independently; reporting period by platform date, bank totals by settlement date; timezone Asia/Kolkata (configurable in Settings). All assumptions are also listed in-app.

## Deployment (Vercel)
No deployment was performed in this environment (no Vercel credentials/login available) and no URL is claimed. To deploy:
```bash
npm i -g vercel   # or npx vercel
vercel login
vercel --prod     # framework preset: Vite; build command: npm run build; output: dist
```
The app is a static SPA with no server, API keys or environment variables.

## Production limitations (exactly three sentences)
Incorrect or reused transaction identifiers would silently prevent matching or, worse, match the wrong records, so identifier quality at source is the single biggest risk. Unexpected bank file formats, extra columns, or settlement delays beyond the configured two-day grace period would misclassify real settlements as missing or timing differences until the mapping and grace settings are updated. Fees, foreign-exchange conversion, and partial settlements are not represented in this simplified model, so any of those in real bank data would appear as unexplained amount mismatches rather than being reconciled correctly.
