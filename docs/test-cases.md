# Test cases — actual execution results

Run: `npm test` (Vitest 5.1.0, jsdom) in `~/workspace/onelab-reconciliation`. **Result: 19 passed, 0 failed** (final run 2026-11-17; build also passes). Test files: `src/tests/engine.test.ts` (17), `src/tests/sample.test.ts` (1), `src/tests/ui.test.tsx` (1).

| ID | Scenario | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC01 | Match by transaction ID | TXN-1 ₹100 both sides | matchedCount 1, unexplained 0 | matchedCount 1, unexplained 0 | PASS |
| TC02 | Unmatched platform txn | TXN-1, no bank row | PLATFORM_ONLY ×1 | PLATFORM_ONLY ×1 | PASS |
| TC03 | Unmatched bank settlement | Bank TXN-9 only | BANK_ONLY ×1 | BANK_ONLY ×1 | PASS |
| TC04 | Month-boundary timing | TXN-31 2026-10-31, settled 2026-11-01 | TIMING ×1, platform-only 0 | TIMING ×1, platform-only 0 | PASS |
| TC05 | Duplicate settlement ID | STL-1 twice (rows 2, 3) | 1 duplicate, source row 3 | 1 duplicate, source row 3 | PASS |
| TC06 | Duplicate excluded from totals | Same as TC05, reconciled | bankInPeriod ₹100.00, duplicate ₹100.00 | bankInPeriod 10000 paise, duplicate 10000 paise | PASS |
| TC07 | Orphan refund | Bank REFUND orig TXN-9997 (absent) | ORPHAN_REFUND ×1, reason cites TXN-9997 | ORPHAN_REFUND ×1, reason cites TXN-9997 | PASS |
| TC08 | Legitimate refund match | SALE ₹100 + REFUND ₹20 both sides | matched 2, platform total ₹80.00 | matched 2, total 8000 paise | PASS |
| TC09 | Amount mismatch > tolerance | ₹100 vs ₹90 | AMOUNT_MISMATCH ×1, diff 1000 paise | diff 1000 paise | PASS |
| TC10 | Individual rounding ≤ tolerance | ₹100 vs ₹99.99 | rounding ×1, still matched | rounding 1, matched 1 | PASS |
| TC11 | Aggregate rounding | 3× ₹0.01 diffs | aggregate 3 paise, exceeds=true | aggregate 3, exceeds true | PASS |
| TC12 | Invalid CSV row | Bad date + empty amount | 0 valid, 1 invalid, row 2 | 0 valid, 1 invalid, row 2 | PASS |
| TC13 | Empty datasets | No rows | status NO_DATA, total 0 | NO_DATA, 0 | PASS |
| TC14 | Multi-currency, no cross-match | USD platform vs INR bank | INR matched 0; USD matched 1 | INR 0, USD 1 | PASS |
| TC15 | Summary calculations | ₹100+₹50 platform, ₹100 bank | platform 15000, bank 10000, platform-only 5000 | as expected | PASS |
| TC16 | Sale vs refund same ID | SALE platform vs REFUND bank | matched 0 (no cross-match) | matched 0 | PASS |
| TC17 | Invalid bank row | Empty settlement_id | 0 valid, 1 invalid | 0 valid, 1 invalid | PASS |
| TC18 | Sample-data integration | Full Oct 2026 CSVs | 38 valid/1 invalid platform; 40 bank; timing 1; aggregate 3 paise; duplicate ₹4,799; orphan 1 (TXN-9997); unexplained 0 | All asserted values matched (see ground truth) | PASS |
| TC19 | App shell renders | Render `<App/>` | OneLab header + nav present | Header + Data Import/Reports nav present | PASS |

Playwright browser tests: not run — Playwright was not installed (heavyweight for this environment); noted as a limitation, not claimed. The production build was verified by serving `dist/` with `vite preview` and curling `/` (200) and `/sample-data/platform_transactions.csv` (200).
