# Brainstorming thread — design & decision log

> **Label (honest): this is a design and decision log written during the build, NOT a verbatim export of a brainstorming conversation.** No complete conversation export was available in this session, so no historical dialogue is fabricated here. The requirements analysis, alternatives and decisions below are the real ones made while building OneLab Reconciliation on 2026-11-17.

## Requirements analysis
- Core job: month-end reconciliation of platform transactions vs bank settlements; every difference must be explained, never hidden to force a "reconciled" badge.
- Four mandatory scenarios (timing, aggregate rounding, duplicate, orphan refund) plus platform-only, bank-only, amount mismatch, legitimate refund pair, invalid rows.
- Stack fixed by the brief: React + TypeScript + Vite + Tailwind + Recharts + PapaParse + Zod + Vitest/RTL + lucide-react; local-first, no API keys, no external DB.
- Deliverables: working app, deterministic sample data + ground truth, engine tests (15 listed cases), docs, ZIP, Vercel instructions, demo script (video not recorded).

## Alternatives considered
- **Tailwind v4 (CSS-first) vs v3 (PostCSS config):** chose v3.4.17 with PostCSS — v4's Vite plugin and config-free setup was less predictable in this environment; v3 built first time once configs were renamed `.cjs` (see execution log).
- **State: backend / localStorage / in-memory:** chose in-memory React context. No backend is needed, data never leaves the browser (a stated requirement), and it keeps the app deployable as a static Vercel site. Trade-off: data does not persist across reloads — documented in README.
- **Charts:** Recharts (per brief) for outcome pie + bridge bar; no decorative metrics — both charts are computed from the live reconciliation result.
- **Matching key:** exact transaction ID + event type + currency. Fuzzy/amount-based matching was rejected: it would hide identifier problems, which is exactly failure risk #1 in production.
- **Duplicate handling:** canonical-first-occurrence wins; duplicates flagged with source row and excluded from totals. Alternative (last wins) was rejected as less auditable.
- **Timing window:** settlement within 2 days after month-end = timing. Alternative (any next-month settlement = timing) was rejected — a settlement weeks late is a real problem, not timing.

## Design decisions
- Reporting month Oct 2026 (sample month); currency selector INR/USD/EUR (sample is INR; other currencies show an honest empty/no-match state, not invented data).
- Amounts in integer paise everywhere in the engine; formatting only at display.
- Financial bridge with an explicit formula, so the final unexplained difference (₹0.00 on sample data) is auditable, not asserted.
- Sample IDs start at TXN-1000 (generator off-by-one from `1000+i`); kept because IDs are consistent across both files and documented in ground truth.
- Normal settlements capped at 2026-10-31 so only the planted TXN-1031 is a timing difference (see execution log — first run produced 4 timing differences).

## Assumptions (also shown in-app under Settings)
Transaction IDs are the primary key; settlement IDs detect duplicates; sale ≠ refund for matching; refunds reduce net cash; INR only, no FX; no fees/taxes/chargebacks; normal delay 1–2 days; per-record tolerance ₹0.01, aggregate tolerance ₹0.01, grace 2 days; each currency reconciled independently; reporting period by platform date, bank totals by settlement date; timezone Asia/Kolkata (configurable).
