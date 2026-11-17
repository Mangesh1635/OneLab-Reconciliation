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

## 6. Demo video recording (2026-11-17)
- Built the app (`npm run build` passed, chunk-size warning only) and served the production build with `npx vite preview --port 4173 --strictPort`; curl confirmed `/` and `/sample-data/platform_transactions.csv` both returned 200.
- No Playwright package was in the project, so `playwright-core@1.55.0` was installed in a throwaway folder `/tmp/video-tmp` (NOT added to the app's package.json) and pointed at the cached Chromium at `~/.cache/ms-playwright/chromium-1187/chrome-linux/chrome`. ffmpeg/ffprobe at `/usr/bin/ffmpeg`.
- Read `src/App.tsx` and all pages first, so selectors matched real labels: nav buttons "Data Import"/"Dashboard"/"Reconciliation"/"Discrepancies"/"Reports", "Load sample datasets", "Run reconciliation", filter select `aria-label="Discrepancy filter"` (option TIMING), category select on Discrepancies (DUPLICATE_ENTRY / ORPHAN_REFUND), "Download CSV" buttons on Reports. No label had to be changed from the script; the script's wording "Load sample datasets" / "Run reconciliation" matched exactly. Default month was already `2026-10` and currency `INR`, confirmed in the recording log.
- Recording script `/tmp/video-tmp/record.cjs` drove the full demo flow in headless Chromium, viewport 1280×800, Playwright `recordVideo`: Dashboard empty state → Data Import → Load sample datasets ("Sample loaded:" waited for) → Dashboard → Run reconciliation → rounding banner → Reconciliation, filter TIMING, click TXN-1031 row (waited for "Transaction detail") → Discrepancies, filter DUPLICATE_ENTRY then ORPHAN_REFUND → Reports, clicked the 4th "Download CSV" (Exception report) — the download event was captured, filename `exception-report.csv` → Dashboard financial bridge, end. Result: **FLOW OK, exit 0**.
- Raw video: `videos/b27310622a6bb338d068b199b6efc7d5.webm`, 47.48 s, 1280×800, VP8, 3.3 MB. Verified with ffprobe and by extracting frames and viewing them: Dashboard empty state; Dashboard loaded (38 platform / 36 matched / rounding banner ₹0.03); TXN-1031 detail panel (2026-10-31 → 2026-11-01, TIMING); EXC-001 duplicate STL-2006 ₹4,799; EXC-008 orphan refund STL-2038, missing original TXN-9997, −₹2,499; Reports page with the finance summary; final financial bridge. All frames show the real app; none were black or blank (frame JPEGs 14–44 KB).
- Raw length 47.5 s was below the 60–120 s target, so it was slowed 1.35× with ffmpeg (`setpts=1.35*PTS`, `-r 25`, libx264, yuv420p, CRF 20, faststart) — no content added, removed, or reordered. Final: `docs/demo.mp4`, **64.08 s, 1280×800, H.264, 2.3 MB**; verified again with ffprobe and frame extraction (4 frames, 17–44 KB, non-black). Copy saved as `~/workspace/onelab-reconciliation-demo.mp4`.
- Preview server killed after recording (curl then returned 000 / connection refused; no vite process running). Nothing was copied to the user's Mac.
