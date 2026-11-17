# Ground truth — planted sample data (Oct 2026, INR)

Source files: `public/sample-data/platform_transactions.csv` (38 valid rows + 1 invalid row, 40 lines incl. header) and `public/sample-data/bank_settlements.csv` (40 rows: 39 canonical + 1 duplicate, 41 lines incl. header).

## Verified reconciliation result (engine, `npm test` sample test)
- Platform: 38 records, ₹1,46,365.49 (14,636,549 paise)
- Bank in period (settled Oct 2026): 38 canonical records, ₹1,26,268.46
- Bank canonical total (all months): ₹1,38,767.46
- Matched: 36 records, ₹1,29,866.49 (includes 1 timing + 3 rounding records)
- Platform-only: 1 (TXN-1061, ₹8,999.00)
- Bank-only: 1 (STL-2039 / TXN-8888, ₹4,200.00)
- Timing: 1 (TXN-1031, ₹12,499.00)
- Rounding: 3 records, aggregate variance 3 paise (₹0.03), exceeds aggregate tolerance 1 paise
- Duplicates: 1 (STL-2006, ₹4,799.00, excluded)
- Orphan refunds: 1 (STL-2038, −₹2,499.00)
- Amount mismatches: 1 (TXN-1062, diff ₹300.00)
- Invalid records: 1 (platform TXN-1099, row 40, bad date + missing amount)
- Final unexplained difference: ₹0.00 — status RECONCILED_WITH_EXCEPTIONS

## Planted scenarios
1. **Timing — TXN-1031**: platform 2026-10-31 ₹12,499.00; bank STL-2026 settled 2026-11-01. TIMING_DIFFERENCE, counted as matched, not platform-only.
2. **Rounding — TXN-1041/1042/1043**: platform ₹2,499.00 / ₹3,499.00 / ₹1,999.00; bank ₹0.01 less each. Each diff 1 paise (within per-record tolerance 1 paise); aggregate 3 paise > aggregate tolerance 1 paise.
3. **Duplicate — STL-2006 / TXN-1005**: identical bank row repeated as the last row of bank_settlements.csv (source row 41). Canonical row retained; duplicate excluded from all totals (₹4,799.00).
4. **Orphan refund — STL-2038 / TXN-9998**: bank REFUND, original_transaction_id TXN-9997, which does not exist anywhere in the platform file. Amount ₹2,499.00 (signed −₹2,499.00). ORPHAN_REFUND.

## Other deliberate cases
- Platform-only: TXN-1061, ₹8,999.00, 2026-10-20, no bank row.
- Bank-only: STL-2039 / TXN-8888, ₹4,200.00, settled 2026-10-18, no platform row.
- Amount mismatch: TXN-1062 platform ₹7,500.00 vs bank ₹7,200.00 (diff ₹300.00).
- Legitimate refund pair: TXN-1051 SALE ₹5,999.00 (2026-10-10) and TXN-1052 REFUND ₹1,200.00, original TXN-1051 (2026-10-11); both match their bank rows.
- Invalid row: platform TXN-1099, `created_at=not-a-date`, empty amount — rejected at import, reported, never counted.
- Normal sales: TXN-1000–TXN-1010, TXN-1021–TXN-1025 (IDs start at TXN-1000), TXN-1071–TXN-1075, settled +1 day (odd dates) or +2 days (even dates), capped at 2026-10-31 so no extra timing differences are created.
