import type { PlatformTransaction } from '../../types/transaction';
import type { BankSettlement } from '../../types/settlement';
import type { ReconciliationResult, ReconciliationSummary, MatchResult, ExceptionItem, ReconConfig } from '../../types/reconciliation';
import { DEFAULT_CONFIG } from '../../types/reconciliation';
import { signedPaise } from '../../utils/currency';
import { canonicalSettlements, canonicalPlatform, detectBankDuplicates, detectPlatformDuplicates } from './duplicateDetection';
import { isTimingDifference, timingExplanation } from './timingAnalysis';
import { isOrphanRefund } from './refundValidation';
import { buildBankIndex, matchKey } from './matchingEngine';

let exSeq=0;
function excId(){exSeq+=1;return `EXC-${String(exSeq).padStart(3,'0')}`}
export function resetExceptionSequence(){exSeq=0}

export function reconcile(platform:PlatformTransaction[],bank:BankSettlement[],month:string,currency:string,config:ReconConfig=DEFAULT_CONFIG,invalidRecords:{dataset:string;sourceRow:number;reason:string;raw:string}[]=[]):ReconciliationResult{
 resetExceptionSequence();
 const platCanon=canonicalPlatform(platform.filter(p=>p.currency===currency));
 const bankCanon=canonicalSettlements(bank.filter(b=>b.currency===currency));
 const platDup=detectPlatformDuplicates(platform.filter(p=>p.currency===currency));
 const bankDup=detectBankDuplicates(bank.filter(b=>b.currency===currency));
 const platInMonth=platCanon.filter(p=>p.created_at.slice(0,7)===month);
 const bankIndex=buildBankIndex(bankCanon);
 const platformIds=new Set(platCanon.map(p=>p.transaction_id));
 const matches:MatchResult[]=[]; const exceptions:ExceptionItem[]=[];
 let matchedCount=0,matchedPaise=0,platformOnlyPaise=0,timingPaise=0,roundingPaise=0,amountMismatchDiff=0,orphanPaiseSigned=0;
 const roundingLines:{platformId:string;diffPaise:number}[]=[];
 const usedBank=new Set<string>();
 // duplicates as exceptions
 for(const d of [...bankDup,...platDup]){const isBank=d.key.includes('STL')||bankDup.includes(d);exceptions.push({id:excId(),category:'DUPLICATE_ENTRY',severity:'medium',transactionId:undefined,settlementId:d.key,amountPaise:d.amountPaise,currency,sourceDataset:isBank?'bank':'platform',sourceRow:d.sourceRow,reason:`Duplicate record: same ${isBank?'settlement ID':'transaction ID + event type'} as source row ${d.canonicalRow}. The canonical record on row ${d.canonicalRow} is retained; this copy is excluded from all totals.`,recommendation:'Remove the duplicate at source and confirm the bank/platform feed does not re-send it.',detail:`Canonical row ${d.canonicalRow}`})}
 const duplicatePaise=bankDup.reduce((s,d)=>s+signedPaise(d.amountPaise, bankCanon.find(b=>b.settlement_id===d.key)?.event_type||'SALE'),0);
 const duplicateRawPaise=bank.reduce((s,b)=>s+(b.currency===currency?signedPaise(b.amountPaise,b.event_type):0),0)-bankCanon.reduce((s,b)=>s+signedPaise(b.amountPaise,b.event_type),0);
 for(const p of platInMonth){
   const signedP=signedPaise(p.amountPaise,p.event_type);
   const b=bankIndex.get(matchKey(currency,p.transaction_id,p.event_type));
   if(!b){
     matches.push({platformId:p.transaction_id,platformAmountPaise:signedP,diffPaise:signedP,status:'PLATFORM_ONLY',platformRow:p.sourceRow,platformDate:p.created_at,currency,eventType:p.event_type,explanation:`No bank settlement was found for ${p.transaction_id} (${p.event_type}). The transaction was processed in ${month} but has not settled yet, or the settlement is missing from the bank file.`});
     platformOnlyPaise+=signedP;
     exceptions.push({id:excId(),category:'PLATFORM_ONLY',severity:'high',transactionId:p.transaction_id,amountPaise:signedP,currency,sourceDataset:'platform',sourceRow:p.sourceRow,reason:'Platform transaction has no matching bank settlement in the bank file.',recommendation:'Check whether the settlement is still in transit (1-2 day delay) or ask the bank for the settlement reference.'});
     continue;
   }
   usedBank.add(b.settlement_id+'|'+b.transaction_id);
   const signedB=signedPaise(b.amountPaise,b.event_type);
   const diff=signedP-signedB;
   const timing=isTimingDifference(p.created_at,b.settled_at,month,config.graceDays);
   if(Math.abs(diff)<=config.perRecordTolerancePaise){
     if(diff!==0){roundingLines.push({platformId:p.transaction_id,diffPaise:diff});roundingPaise+=diff;
       exceptions.push({id:excId(),category:'ROUNDING_VARIANCE',severity:'low',transactionId:p.transaction_id,settlementId:b.settlement_id,amountPaise:diff,currency,sourceDataset:'bank',sourceRow:b.sourceRow,reason:`Bank amount differs from platform amount by ${diff} paise (within the ${config.perRecordTolerancePaise} paise per-record tolerance). Individually insignificant, but such differences add up in aggregate.`,recommendation:'Accept as rounding if the aggregate variance stays within policy; otherwise investigate the bank rounding rule.'});
     }
     if(timing){timingPaise+=signedP;
       exceptions.push({id:excId(),category:'TIMING_DIFFERENCE',severity:'low',transactionId:p.transaction_id,settlementId:b.settlement_id,amountPaise:signedP,currency,sourceDataset:'bank',sourceRow:b.sourceRow,reason:timingExplanation(p.created_at,b.settled_at,month),recommendation:'No action — carry the amount into the next month\'s opening timing balance and confirm it settles by the grace date.'});
       matches.push({platformId:p.transaction_id,settlementId:b.settlement_id,platformAmountPaise:signedP,bankAmountPaise:signedB,diffPaise:diff,status:'TIMING',platformRow:p.sourceRow,bankRow:b.sourceRow,platformDate:p.created_at,settlementDate:b.settled_at,currency,eventType:p.event_type,explanation:timingExplanation(p.created_at,b.settled_at,month)});
     } else {
       matches.push({platformId:p.transaction_id,settlementId:b.settlement_id,platformAmountPaise:signedP,bankAmountPaise:signedB,diffPaise:diff,status:diff!==0?'MATCHED_ROUNDING':'MATCHED',platformRow:p.sourceRow,bankRow:b.sourceRow,platformDate:p.created_at,settlementDate:b.settled_at,currency,eventType:p.event_type,explanation:diff!==0?`Matched on transaction ID and event type. Small rounding difference of ${diff} paise, within tolerance.`:`Matched exactly on transaction ID, event type, currency and amount.`});
     }
     matchedCount+=1; matchedPaise+=signedP;
   } else {
     amountMismatchDiff+=diff;
     matches.push({platformId:p.transaction_id,settlementId:b.settlement_id,platformAmountPaise:signedP,bankAmountPaise:signedB,diffPaise:diff,status:'AMOUNT_MISMATCH',platformRow:p.sourceRow,bankRow:b.sourceRow,platformDate:p.created_at,settlementDate:b.settled_at,currency,eventType:p.event_type,explanation:`Matched on transaction ID but amounts differ by ${diff} paise, beyond the ${config.perRecordTolerancePaise} paise tolerance. This is a genuine amount mismatch, not rounding.`});
     exceptions.push({id:excId(),category:'AMOUNT_MISMATCH',severity:'high',transactionId:p.transaction_id,settlementId:b.settlement_id,amountPaise:diff,currency,sourceDataset:'bank',sourceRow:b.sourceRow,reason:`Amount differs by ${diff} paise, beyond the per-record tolerance of ${config.perRecordTolerancePaise} paise.`,recommendation:'Investigate with the bank: check for partial settlement, fees deducted, or a data-entry error.'});
   }
 }
 // bank-only + orphan refunds (canonical bank, in-period or any, not used)
 let bankOnlyPaise=0;
 for(const b of bankCanon){
   if(usedBank.has(b.settlement_id+'|'+b.transaction_id))continue;
   const signedB=signedPaise(b.amountPaise,b.event_type);
   // orphan refund check first
   if(b.event_type==='REFUND'&&isOrphanRefund(b,platformIds)){
     orphanPaiseSigned+=signedB;
     exceptions.push({id:excId(),category:'ORPHAN_REFUND',severity:'high',transactionId:b.transaction_id,settlementId:b.settlement_id,amountPaise:signedB,currency,sourceDataset:'bank',sourceRow:b.sourceRow,reason:`Bank refund ${b.settlement_id} references original transaction ${b.original_transaction_id||'(missing)'} which does not exist in the platform dataset. The refund cannot be linked to any sale.`,recommendation:'Do not post this refund automatically. Trace the original transaction in the platform and confirm with the bank before refunding the customer twice.',detail:`Missing original: ${b.original_transaction_id||'(none)'}`});
     matches.push({platformId:b.transaction_id,settlementId:b.settlement_id,platformAmountPaise:0,bankAmountPaise:signedB,diffPaise:-signedB,status:'BANK_ONLY',platformRow:0,bankRow:b.sourceRow,platformDate:'',settlementDate:b.settled_at,currency,eventType:b.event_type,explanation:`Orphan refund: original transaction ${b.original_transaction_id||'(missing)'} not found in platform data.`});
     continue;
   }
   // only count bank-only if its platform txn is in reporting month scope OR bank settled in month; count all unmatched canonical bank as bank-only for completeness, but totals use in-period
   bankOnlyPaise+=signedB;
   matches.push({platformId:b.transaction_id,settlementId:b.settlement_id,platformAmountPaise:0,bankAmountPaise:signedB,diffPaise:-signedB,status:'BANK_ONLY',platformRow:0,bankRow:b.sourceRow,platformDate:'',settlementDate:b.settled_at,currency,eventType:b.event_type,explanation:`Bank settlement ${b.settlement_id} has no matching platform transaction. It may be a settlement for a transaction outside this month, or a bank-side entry with no platform record.`});
   exceptions.push({id:excId(),category:'BANK_ONLY',severity:'high',transactionId:b.transaction_id,settlementId:b.settlement_id,amountPaise:signedB,currency,sourceDataset:'bank',sourceRow:b.sourceRow,reason:'Bank settlement has no matching platform transaction.',recommendation:'Trace the settlement reference with the bank and check whether the platform record is in a different month or missing.'});
 }
 // invalid records
 for(const inv of invalidRecords){exceptions.push({id:excId(),category:'INVALID_RECORD',severity:'medium',amountPaise:0,currency,sourceDataset:inv.dataset as 'platform'|'bank',sourceRow:inv.sourceRow,reason:inv.reason,recommendation:'Fix the source row and re-import; the row was not counted in any total.'})}
 const aggregateRounding=roundingLines.reduce((s,l)=>s+l.diffPaise,0);
 const aggregateExceeds=Math.abs(aggregateRounding)>config.aggregateTolerancePaise;
 if(aggregateExceeds){exceptions.push({id:excId(),category:'ROUNDING_VARIANCE',severity:'medium',amountPaise:aggregateRounding,currency,sourceDataset:'bank',sourceRow:0,reason:`Aggregate rounding variance is ${aggregateRounding} paise across ${roundingLines.length} records, exceeding the aggregate tolerance of ${config.aggregateTolerancePaise} paise even though each individual difference is within tolerance.`,recommendation:'Report the aggregate variance separately in the month-end summary and agree a rounding policy with the bank.'})}
 const platformTotalPaise=platInMonth.reduce((s,p)=>s+signedPaise(p.amountPaise,p.event_type),0);
 const bankInPeriodPaise=bankCanon.filter(b=>b.settled_at.slice(0,7)===month).reduce((s,b)=>s+signedPaise(b.amountPaise,b.event_type),0);
 const bankCanonicalTotalPaise=bankCanon.reduce((s,b)=>s+signedPaise(b.amountPaise,b.event_type),0);
 const platformCount=platInMonth.length; const bankCount=bankCanon.filter(b=>b.settled_at.slice(0,7)===month).length;
 const timingCount=exceptions.filter(e=>e.category==='TIMING_DIFFERENCE').length;
 const roundingCount=roundingLines.length;
 const orphanCount=exceptions.filter(e=>e.category==='ORPHAN_REFUND').length;
 const amountMismatchCount=exceptions.filter(e=>e.category==='AMOUNT_MISMATCH').length;
 const platformOnlyCount=exceptions.filter(e=>e.category==='PLATFORM_ONLY').length;
 const bankOnlyCount=exceptions.filter(e=>e.category==='BANK_ONLY').length;
 const diffPeriod=platformTotalPaise-bankInPeriodPaise;
 // bankOnlyPaise above includes orphan? No orphan excluded from bankOnlyPaise (continued). But bankInPeriod includes orphan, so +orphanSigned corrects it. Bank-only in-period only? Use in-period bank-only for bridge: recompute
 const bankOnlyInPeriod=bankCanon.filter(b=>b.settled_at.slice(0,7)===month&&!usedBank.has(b.settlement_id+'|'+b.transaction_id)&&!(b.event_type==='REFUND'&&isOrphanRefund(b,platformIds))).reduce((s,b)=>s+signedPaise(b.amountPaise,b.event_type),0);
 const unexplained2=diffPeriod-timingPaise-platformOnlyPaise-amountMismatchDiff-roundingPaise+bankOnlyInPeriod+orphanPaiseSigned;
 const summary:ReconciliationSummary={month,currency,platformCount,bankCount,platformTotalPaise,bankInPeriodPaise,bankCanonicalTotalPaise,matchedCount,matchedAmountPaise:matchedPaise,platformOnlyCount,platformOnlyPaise,bankOnlyCount,bankOnlyPaise,timingCount,timingPaise,roundingCount,roundingVariancePaise:roundingPaise,aggregateRoundingPaise:aggregateRounding,aggregateRoundingExceeds:aggregateExceeds,duplicateCount:bankDup.length+platDup.length,duplicatePaise:duplicatePaise,duplicateRawPaise:duplicateRawPaise,orphanCount,orphanPaise:orphanPaiseSigned,amountMismatchCount,amountMismatchDiffPaise:amountMismatchDiff,invalidCount:invalidRecords.length,unexplainedPaise:unexplained2,status:platInMonth.length===0&&bankCanon.length===0?'NO_DATA':(unexplained2===0&&amountMismatchCount===0&&platformOnlyCount===0&&bankOnlyCount===0&&orphanCount===0?'RECONCILED':(unexplained2===0?'RECONCILED_WITH_EXCEPTIONS':'UNRECONCILED'))};
 const bridge=[{label:`Platform processed total (${month})`,amountPaise:platformTotalPaise,note:'Sum of signed platform amounts in the reporting month'},{label:'Less: bank settlements received in period',amountPaise:-bankInPeriodPaise,note:'Signed bank total by settlement date in the reporting month'},{label:'Less: timing differences (settled next month)',amountPaise:-timingPaise,note:'Processed in-month, settled after month-end'},{label:'Less: platform-only (no settlement)',amountPaise:-platformOnlyPaise,note:'No bank record found'},{label:'Less: amount-mismatch difference',amountPaise:-amountMismatchDiff,note:'Platform minus bank for mismatched rows'},{label:'Less: rounding variance',amountPaise:-roundingPaise,note:'Sum of per-record rounding differences'},{label:'Add: bank-only settlements in period',amountPaise:bankOnlyInPeriod,note:'Bank money with no platform record'},{label:'Add: orphan refund (signed)',amountPaise:orphanPaiseSigned,note:'Bank refund with no original transaction'},{label:'Final unexplained difference',amountPaise:unexplained2,note:'Should be zero when every difference is explained; a non-zero value is a genuine discrepancy'}];
 return{summary,matches,exceptions,duplicates:bankDup.map(d=>({settlementId:d.key,amountPaise:d.amountPaise,sourceRow:d.sourceRow,canonicalRow:d.canonicalRow})),invalidRecords,bridge};
}
