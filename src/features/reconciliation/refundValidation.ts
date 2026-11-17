import type { BankSettlement } from '../../types/settlement';
export function isOrphanRefund(s:BankSettlement,platformIds:Set<string>):boolean{if(s.event_type!=='REFUND')return false;const orig=(s.original_transaction_id||'').trim();if(!orig)return true;return !platformIds.has(orig)}
