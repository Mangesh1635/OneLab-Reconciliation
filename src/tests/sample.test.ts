import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCsvText } from '../utils/csv';
import { validatePlatformRows, validateBankRows } from '../features/reconciliation/validation';
import { reconcile } from '../features/reconciliation/reconciliationEngine';
describe('sample data',()=>{
 it('reconciles Oct 2026 sample with all four planted scenarios',()=>{
  const pt=readFileSync('public/sample-data/platform_transactions.csv','utf8');
  const bt=readFileSync('public/sample-data/bank_settlements.csv','utf8');
  const p=validatePlatformRows(parseCsvText(pt).data);
  const b=validateBankRows(parseCsvText(bt).data);
  expect(p.valid.length).toBe(38); expect(p.invalid.length).toBe(1);
  expect(b.valid.length).toBe(40);
  const r=reconcile(p.valid,b.valid,'2026-10','INR',undefined,[...p.invalid.map(x=>({...x,dataset:'platform'})),...b.invalid.map(x=>({...x,dataset:'bank'}))]);
  console.log(JSON.stringify(r.summary,null,2));
  expect(r.summary.timingCount).toBe(1);
  expect(r.summary.aggregateRoundingPaise).toBe(3);
  expect(r.summary.duplicateCount).toBe(1);
  expect(r.summary.duplicatePaise).toBe(479900);
  expect(r.summary.orphanCount).toBe(1);
  expect(r.exceptions.find(e=>e.category==='ORPHAN_REFUND')?.reason).toContain('TXN-9997');
  expect(r.summary.unexplainedPaise).toBe(0);
 });
});
