import type { BankSettlement } from '../../types/settlement';
export function matchKey(currency:string,txnId:string,eventType:string){return `${currency}|${txnId}|${eventType}`}
export function buildBankIndex(s:BankSettlement[]):Map<string,BankSettlement>{const m=new Map<string,BankSettlement>();for(const x of s){const k=matchKey(x.currency,x.transaction_id,x.event_type);if(!m.has(k))m.set(k,x)}return m}
