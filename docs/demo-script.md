# Demo script (60–90 seconds) — video still to be recorded

> No demo video was recorded in this session (no screen-recording step was available in the workspace). Record the walkthrough below against the running app (`npm run dev`, then Data Import → Load sample datasets).

| Time | Action | Say / show |
|---|---|---|
| 0–10s | Dashboard (empty state) | "Month-end reconciliation: the platform and the bank should agree, but they rarely do." |
| 10–20s | Data Import → **Load sample datasets** | "38 platform records, 40 bank rows, 1 rejected invalid row — nothing silently discarded." |
| 20–30s | Dashboard, month Oct 2026, **Run reconciliation** | Totals: platform ₹1,46,365.49; bank in period ₹1,26,268.46; 36 matched. |
| 30–40s | Reconciliation → filter TIMING → open TXN-1031 | "Processed 31 Oct, settled 1 Nov — a timing difference, not a missing payment." |
| 40–50s | Dashboard aggregate-rounding banner / filter ROUNDING | "Three records, ₹0.01 each — individually nothing, together ₹0.03, above tolerance." |
| 50–60s | Discrepancies → DUPLICATE_ENTRY STL-2006 | "Same settlement ID twice; ₹4,799 excluded from totals, canonical row kept." |
| 60–70s | Discrepancies → ORPHAN_REFUND STL-2038 | "Refund for TXN-9997, which does not exist in the platform data." |
| 70–80s | Reports → Download exception report CSV | "Every report is generated from the live result, not a static file." |
| 80–90s | Dashboard bridge + Settings assumptions | "Final unexplained difference ₹0.00, and here is the formula and every assumption." |
