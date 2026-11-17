# Raw prompt — original implementation prompt (preserved as faithfully as possible)

> This file preserves the complete original assessment prompt used for this build, as supplied in the user message of 2026-11-17. Wording is reproduced faithfully from that message; where the message repeated itself (the prompt text appeared twice in the conversation), the duplication is not reproduced.

## Build a Complete Payment Reconciliation & Discrepancy Investigation Platform

You are acting as a senior full-stack engineer, financial data analyst, product designer, QA engineer, and technical lead.

Your task is to BUILD a complete, working, professional-quality application for the following assessment.

Do not just explain how you would build it. Do not stop after producing a plan. Inspect the current workspace, make the necessary implementation decisions, write the code, install dependencies, execute the application, run tests, fix errors, and prepare all submission deliverables.

You have permission to make reasonable technical and product decisions without asking me questions. Document every important assumption.

---

# 1. THE BUSINESS PROBLEM

A payments company has a month-end reconciliation problem.

The company knows:
- Every transaction its payment platform processed.
- What the bank actually received and settled.
- These two datasets should reconcile, but they currently do not.

Transactions are recorded instantly on the platform, while the bank batches and settles funds 1–2 days later.

At month-end, the company needs to identify which transactions have matching settlements and explain every discrepancy.

Build a web application that allows an analyst to upload or use sample platform transaction data and bank settlement data, reconcile both datasets, identify discrepancies, and understand exactly where the gaps are.

The application must deliberately demonstrate these four discrepancy scenarios:

1. **Month-boundary settlement:** A transaction processed on the final day of one month settles in the following month. This must be classified as a timing difference, not automatically marked missing.
2. **Aggregate rounding difference:** Individual transaction differences are within a small rounding tolerance, but their cumulative difference becomes visible when the amounts are summed.
3. **Duplicate entry:** One dataset contains a duplicate record. The application must detect it and prevent it from being counted twice.
4. **Orphan refund:** A bank refund references an original transaction that cannot be found in the platform transaction dataset. The application must identify and explain this exception.

The objective is to make the reconciliation process understandable, transparent, and auditable.

# 2. REQUIRED TECHNOLOGY STACK

Use the following stack unless the existing workspace has a strong technical reason to retain another compatible setup:

- Frontend: React
- Language: TypeScript
- Build tool: Vite
- Styling: Tailwind CSS
- Charts: Recharts
- CSV parsing: PapaParse
- Validation: Zod
- Testing: Vitest and React Testing Library
- Browser-level testing: Playwright, where available
- Icons: Lucide React
- Deployment: Vercel

Prefer a local-first architecture. The application must work without API keys, paid services, an external database, or an AI API.

Perform reconciliation calculations deterministically in TypeScript. Do not fabricate AI-powered functionality. The application can generate clear, human-readable explanations using its actual calculation results.

# 3. PRODUCT DESIGN AND USER EXPERIENCE

Build a premium financial SaaS dashboard. The visual design should feel like a real payment operations and financial reconciliation product, not a generic student project.

Design direction: clean and modern financial dashboard; professional typography; neutral backgrounds with a restrained accent palette; strong visual hierarchy; consistent spacing and alignment; subtle shadows and borders; carefully designed tables, charts, status indicators, and empty states; responsive layout for desktop and tablet; accessible contrast and readable numbers; avoid unnecessary animations and visual clutter.

The application name should be: **OneLab Reconciliation**

Create the following interface:

### A. Main Dashboard
Display: total platform transactions; total bank settlements; total platform transaction amount; total bank settlement amount; successfully matched transactions; unmatched transactions; duplicate records; timing differences; rounding differences; orphan refunds; overall reconciliation status. Use summary cards, charts, and meaningful indicators. Add a prominent month selector and currency selector.

### B. Data Import Page
Allow the user to: upload platform transactions as CSV; upload bank settlements as CSV; load generated sample datasets; preview uploaded files before processing; validate required fields; display malformed rows and validation errors; map uploaded CSV columns to the expected fields if column names differ; replace or clear previously uploaded data. Show the number of records successfully imported and the number rejected. Do not silently discard invalid records.

### C. Reconciliation Page
Create an interactive reconciliation workspace. The analyst must be able to: select a month; run reconciliation; view the overall reconciliation summary; compare platform and bank totals; see matched transactions; see unmatched platform transactions; see unmatched bank settlements; see timing differences; see duplicates; see rounding differences; see orphan refunds. Provide filters for discrepancy type, transaction status, currency, date, and amount. Clicking a transaction should open a detail panel showing: platform transaction information; bank settlement information, when available; transaction reference; settlement reference; transaction date; settlement date; platform amount; bank amount; amount difference; matching decision; discrepancy classification; a clear explanation of why the record was flagged. Every result must be traceable to its original source row.

### D. Discrepancy Investigation Page
Create a dedicated exception investigation view. Each discrepancy should have: a unique exception ID; exception category; severity; associated transaction or settlement ID; amount involved; source dataset; source row number; reason for classification; recommended action. Suggested exception categories: TIMING_DIFFERENCE, ROUNDING_VARIANCE, DUPLICATE_ENTRY, ORPHAN_REFUND, PLATFORM_ONLY, BANK_ONLY, AMOUNT_MISMATCH, INVALID_RECORD. Use understandable descriptions rather than exposing only technical codes.

### E. Reports Page
Generate: reconciliation summary; matched transactions report; unmatched transactions report; exception report; duplicate records report; rounding variance report; timing differences report. Allow CSV downloads for all these reports. Provide a clear reconciliation summary suitable for a finance or operations manager.

# 4. SYNTHETIC DATA GENERATION — MANDATORY

No test data has been provided. You must generate realistic synthetic data yourself. Create at least 30–40 platform transaction records and corresponding bank settlement records. Include ordinary successful transactions as well as deliberately planted discrepancies. Use INR as the sample currency. Make the dataset deterministic and reproducible so tests always receive the same results.

Create these source files: `public/sample-data/platform_transactions.csv`, `public/sample-data/bank_settlements.csv`.

Platform transaction fields: transaction_id, event_type, original_transaction_id, created_at, amount, currency, status. `event_type` must distinguish SALE and REFUND.

Bank settlement fields: settlement_id, transaction_id, event_type, original_transaction_id, settled_at, amount, currency, bank_reference.

Create enough records to demonstrate normal matching and every required exception.

Required planted scenarios:
- **Scenario 1: Month-boundary settlement** — platform transaction dated on the last calendar day of the selected month; its bank settlement must occur on the first or second day of the following month. Identify the exact bank settlement; classify it as a timing difference; show its actual settlement date; explain that the transaction was processed in the selected month but settled after the month-end cutoff; do not classify it as an unexplained missing payment.
- **Scenario 2: Aggregate rounding difference** — at least three transactions where each individual amount difference is within the configured line-level rounding tolerance, but the cumulative variance exceeds the aggregate tolerance. For example, three separate records could each have a difference of INR 0.01, creating an aggregate variance of INR 0.03. Match the individual records; identify their small rounding variances; calculate the cumulative variance correctly; display the aggregate rounding discrepancy prominently; explain why individual differences may look insignificant while the combined difference matters. Do not simply introduce a large arbitrary amount mismatch and call it rounding.
- **Scenario 3: Duplicate entry** — insert an identical duplicate settlement record into the bank dataset, using the same settlement ID. Detect the duplicate; retain one canonical record; flag the repeated record with its source row number; exclude the duplicate from financial totals; prevent it from being matched as another legitimate settlement; clearly show the impact of the duplicate on the original uncleaned totals.
- **Scenario 4: Refund with no matching original transaction** — create a REFUND entry in the bank dataset whose original_transaction_id does not exist in the platform transaction dataset. Detect that the original transaction is missing; classify the refund as ORPHAN_REFUND; display the missing original transaction reference; show the refund amount; explain why the entry requires investigation; do not incorrectly mark it as a normal successful match.

Add other realistic cases if useful, such as: a platform transaction without a bank settlement; a bank settlement without a matching platform sale; a transaction where the amount differs beyond the allowed tolerance; invalid or incomplete CSV rows.

Create a separate ground-truth file documenting exactly which synthetic records were planted and what each record is expected to produce.

# 5. RECONCILIATION ENGINE

This is the most important part of the assessment. Implement the actual reconciliation engine as independent, testable TypeScript modules. Do not put all reconciliation logic inside React components.

Suggested structure: `src/components/`, `src/pages/`, `src/features/reconciliation/` (reconciliationEngine.ts, matchingEngine.ts, duplicateDetection.ts, roundingAnalysis.ts, timingAnalysis.ts, refundValidation.ts, exceptionClassifier.ts), `src/utils/` (currency.ts, date.ts, csv.ts), `src/types/` (transaction.ts, settlement.ts, reconciliation.ts), `src/data/`, `src/tests/`.

Matching logic (documented pipeline): 1. Validate and normalize the imported datasets. 2. Detect duplicates independently in each dataset. 3. Create canonical records without double-counting duplicates. 4. Normalize currency, transaction types, timestamps, and monetary values. 5. Match platform events with bank settlement events using exact transaction identifiers and event types. 6. Compare amounts using integer minor units wherever possible to avoid floating-point errors. 7. Identify timing differences using settlement dates. 8. Identify individual rounding differences. 9. Calculate aggregate rounding variance. 10. Identify orphan refunds by validating their original transaction references. 11. Identify platform-only and bank-only records. 12. Generate an auditable reconciliation result and exception report.

Important assumptions (make explicit in the application and documentation): Transaction IDs are the primary matching identifiers. Settlement IDs are used for duplicate settlement detection. A legitimate sale and its corresponding refund are different event types and must not be matched against each other. Refunds reduce the net cash movement. Sample data uses INR and does not involve foreign exchange conversion. Fees, taxes, chargebacks, and settlement deductions are not included because the assessment does not provide them. The normal expected bank settlement delay is 1–2 calendar days. A transaction recorded before the end of the reporting month but settled within the following two calendar days is treated as a timing difference. The default per-record rounding tolerance is INR 0.01. The aggregate rounding tolerance is configurable and defaults to INR 0.01. Each currency is reconciled independently. The reporting period is determined by the platform transaction date, while bank settlement totals are determined by the actual settlement date. The selected reporting timezone is configurable, with Asia/Kolkata as the default. Make the tolerances and settlement grace period adjustable through a settings panel. Do not assume that every bank transaction has already settled by the reporting date.

Reconciliation calculations — provide a transparent financial bridge that shows: platform processed total; bank settlements received during the reporting period; transactions awaiting settlement; matched amounts; duplicate amounts excluded; rounding variance; unmatched platform amounts; unmatched bank amounts; orphan refund amounts; final unexplained difference. Show the formula or calculation behind the final difference. Clearly separate: a genuine financial discrepancy; a timing difference; a rounding variance; a data-quality issue. Never hide a discrepancy just to make the dashboard show a successful reconciliation.

# 6. AUTOMATED TESTING

Write actual automated tests for the reconciliation engine. At minimum, test: 1. Correctly match two transactions using their transaction IDs. 2. Identify an ordinary unmatched platform transaction. 3. Identify an unmatched bank settlement. 4. Identify a transaction settled in the following month as a timing difference. 5. Detect a duplicate settlement ID. 6. Ensure duplicate entries are not included twice in totals. 7. Detect an orphan refund whose original transaction cannot be found. 8. Correctly match legitimate platform and bank refund events. 9. Identify an amount mismatch greater than the configured tolerance. 10. Identify individual rounding differences within tolerance. 11. Detect an aggregate rounding difference that becomes significant after summation. 12. Handle invalid CSV rows. 13. Handle empty datasets. 14. Handle multiple currencies without cross-matching. 15. Verify the reconciliation summary calculations.

Create test fixtures specifically designed for the four mandatory scenarios. Run the tests and fix failures. Include a human-readable test report containing: test case ID; scenario; input; expected result; actual result; pass/fail status. Do not report a test as passed unless it has actually been executed.

# 7. DOCUMENTATION AND ASSESSMENT SUBMISSION FILES

Prepare a complete `/docs` directory.

Deliverable 1: Brainstorming thread — `docs/brainstorming-thread.md`. Preserve the actual visible brainstorming and design conversation if the available Muse session supports exporting it. Include requirements analysis, alternatives considered, design decisions, and the assumptions made. Do not fabricate historical conversations or expose hidden internal chain-of-thought. If a complete conversation export is unavailable, explicitly label the file as a design and decision log rather than claiming it is the original full conversation.

Deliverable 2: Distilled prompt and raw prompt — `docs/distilled-prompt.md` (summarize the original assessment into a clear, reusable implementation brief) and `docs/raw-prompt.md` (save the complete original implementation prompt used for this build; preserve its wording).

Deliverable 3: Full execution thread — `docs/execution-log.md`. Record the actual implementation process, including: initial repository inspection; technical decisions; files and modules created; commands executed; dependency and configuration changes; actual errors encountered; incorrect implementation attempts; fixes and corrections; final validation results. Do not remove or invent genuine mistakes. Preserve the actual execution history available to you. If the session does not expose its entire execution history, document that limitation.

Deliverable 4: Test cases — `docs/test-cases.md`. Document all test cases, expected results, actual results, and execution status. Include the four required planted discrepancy scenarios.

Deliverable 5: Working output — a working application; a real deployment URL, if deployment is possible; a ZIP archive of the complete source code; a demo video showing the application and its discrepancy detection; a three-sentence explanation of what could go wrong in production. For the production explanation, discuss exactly three realistic failure risks, such as incorrect transaction identifiers, unexpected bank formats or settlement delays, and fees/FX/partial settlements not represented in the simplified model. Do not invent a deployment URL, claim a video exists when it does not, or claim a successful build without executing it. If deployment credentials or authorization are unavailable, finish the local build and provide exact deployment instructions. If video recording tools are available, record a short demonstration. Otherwise, create `docs/demo-script.md` with a clear 60–90 second recording walkthrough and state that the video still needs to be recorded.

# 8. DEMO FLOW

The finished application must support this exact demonstration: 1. Open the dashboard. 2. Explain the month-end reconciliation problem. 3. Load the generated sample datasets. 4. Show the platform transaction and bank settlement totals. 5. Select the reporting month. 6. Click Run Reconciliation. 7. Show successfully matched transactions. 8. Open the timing difference and show that the month-end transaction settled in the following month. 9. Open the rounding variance and show how multiple small differences produce an aggregate discrepancy. 10. Open the duplicate record and show that it is excluded from the corrected total. 11. Open the orphan refund and show the missing original transaction reference. 12. Open the exception report. 13. Export the reconciliation report as CSV. 14. Show the final reconciliation summary and the assumptions used. The demo must use the generated data, not mocked dashboard values.

# 9. QUALITY AND ENGINEERING REQUIREMENTS

Write clean, typed, modular code. Use reusable components. Avoid unnecessary dependencies. Handle errors gracefully. Include loading, success, error, and empty states. Add form validation. Make tables sortable and filterable. Ensure totals update when the source data or reporting period changes. Use deterministic calculations. Do not hardcode dashboard results independently of the dataset. Do not hardcode exception counts. Do not use fake charts or decorative metrics. Do not create buttons that do nothing. Do not leave placeholder sections. Preserve source row references for auditability. Never send uploaded financial data to external services. Include a clear README with installation, setup, usage, assumptions, and testing instructions.

# 10. FINAL EXECUTION CHECKLIST

Work directly in the current workspace. First inspect the existing files. Reuse a suitable existing project rather than unnecessarily replacing it. Then execute: 1. Build the complete application. 2. Generate the synthetic datasets. 3. Implement the reconciliation engine. 4. Implement all user interface pages. 5. Implement CSV imports and exports. 6. Implement all discrepancy classifications. 7. Implement automated tests. 8. Run all tests. 9. Run the production build. 10. Fix compilation errors, runtime errors, and broken interactions. 11. Run the app and verify the complete demo flow. 12. Create the documentation files. 13. Create a ZIP archive excluding node_modules and unnecessary generated files. 14. Attempt deployment if the environment permits. 15. Prepare the demo video or demo recording script.

Before finishing, verify: all four mandatory discrepancy scenarios exist in the actual sample datasets; the reconciliation engine identifies all four correctly; the duplicate never gets counted twice; the month-boundary transaction is identified as a timing difference; the cumulative rounding variance is calculated correctly; the orphan refund references an original transaction that genuinely does not exist; the reports are generated from real reconciliation results; all tests actually execute; the production build succeeds.

# 11. FINAL RESPONSE FORMAT

When the implementation is complete, give a clear handoff containing: **Project status** (Completed or partially completed, with an honest explanation); **Application** (local run command and actual deployed URL, if available); **Source code** (exact ZIP archive location); **Demo** (actual video location or the demo recording script); **Documentation** (links or paths to every required assessment document); **Testing** (number of tests passed and failed, based on actual test execution); **Four discrepancy scenarios** (briefly explain how each is demonstrated in the running application); **Production limitations** (exactly three sentences). Do not finish by giving another implementation plan. Finish by delivering the working project and clearly identifying any remaining manual steps.

BEGIN NOW. INSPECT THE WORKSPACE AND IMPLEMENT THE COMPLETE APPLICATION.

— and also deploy it, and work these on my mac create folder on desktop
