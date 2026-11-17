# Execution log — OneLab Reconciliation

> Honest limitation: this log records the actual commands, errors and fixes from this build session as observed by the agent. The session does not expose a complete verbatim shell history, so timestamps are given at day granularity (2026-11-17) rather than invented per-command times.

## 1. Inspection
- Workspace `~/workspace` contained prior projects (dental-clinic-demo, tuition-classes-demo, RouteLab, portfolio, SentryGun) and no existing OneLab project — fresh scaffold was correct.
- Node v24.22.1, npm 10.9.4, `zip`/`tar` available.

## 2. Scaffold & dependencies
- `npm create vite@latest onelab-reconciliation -- --template react-ts` — succeeded (create-vite 9.3.4).
- `npm install` then `npm install recharts papaparse zod lucide-react` and `npm install -D tailwindcss@3.4.17 postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @types/papaparse` — all succeeded. Installed versions: recharts 3.10.1, papaparse 5.7.1, zod 4.6.7, lucide-react 1.74.0, vitest 5.1.0, tailwindcss 3.4.17.

## 3. Implementation (files written via generator scripts /tmp/gen1–gen5.py)
- Types, utils (currency/date/csv), engine modules (reconciliationEngine, matchingEngine, duplicateDetection, roundingAnalysis, timingAnalysis, refundValidation, exceptionClassifier, validation), state context, UI components, 6 pages, App, sample CSVs, tests, docs, README.

## 4. Errors encountered and fixes (genuine mistakes preserved)
1. **Vercel availability check hung** — `npx --yes vercel --version` stalled on network download; killed the process (SIGTERM). Deployment was not attempted; Vercel instructions are in README instead. No URL invented.
2. **Generator bug (gen2.py)** — `platmap` unpacked 5 values from 6-tuples → `ValueError`; removed the unused line and fixed the bank-loop unpack. Re-ran successfully.
3. **Duplicate object key** — `bankOnlyPaise` appeared twice in the summary literal in reconciliationEngine.ts; removed the duplicate.
4. **Dashboard JSX** — missing `</Card>` after the "Exceptions by category" card → Vitest transform error `Expected corresponding JSX closing tag for 'Card'`; added the closing tag.
5. **TypeScript (tsc -b)** — `ReactNode` needed `import type` (verbatimModuleSyntax) in ui.tsx/state.tsx; unused imports in matchingEngine/reconciliationEngine; unused `unexplained` variable; ImportPage ternary produced a union type for `setData` → replaced with explicit branches. All fixed; `tsc` then passed.
6. **PostCSS ESM error** — `postcss.config.js` / `tailwind.config.js` used `module.exports` under `"type":"module"` → renamed both to `.cjs`; build then succeeded.
7. **UI test failures (×2)** — `getByText('Data Import')` then `getByText(/OneLab/i)` each matched multiple elements; switched to `getAllByText(...).length` assertions.
8. **Sample-data timing count was 4, not 1** — normal Oct-30 transactions settled +2 days (1 Nov) and were correctly classified as timing differences. This was correct engine behaviour but muddied the demo, so the generator was changed to cap normal settlements at 2026-10-31; only planted TXN-1031 remains a timing difference. Re-ran gen2 (which also overwrote state.tsx/ui.tsx with the pre-fix versions — the `import type ReactNode` fix had to be re-applied, then the build passed again).

## 5. Final validation (2026-11-17)
- `npm test`: **19 passed, 0 failed** (17 engine + 1 sample integration + 1 UI).
- `npm run build`: **passed** — `dist/index.html` 0.49 kB, JS 761.55 kB (chunk-size warning only, from Recharts; noted, not an error).
- `vite preview` + curl: `/` returned the app HTML (200), `/sample-data/platform_transactions.csv` returned 200.
- Sample reconciliation verified: platform 38 / ₹1,46,365.49; bank in period ₹1,26,268.46; matched 36; timing 1 (₹12,499.00); rounding aggregate 3 paise; duplicate STL-2006 ₹4,799.00 excluded; orphan STL-2038 / TXN-9997; unexplained ₹0.00.
- ZIP created (see README / handoff); Playwright not run (see test-cases.md).
