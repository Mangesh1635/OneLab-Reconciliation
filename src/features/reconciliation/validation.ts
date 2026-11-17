import { z } from 'zod';
import { toPaise } from '../../utils/currency';
import type { PlatformTransaction } from '../../types/transaction';
import type { BankSettlement } from '../../types/settlement';
const platSchema=z.object({transaction_id:z.string().min(1),event_type:z.enum(['SALE','REFUND']),created_at:z.string().min(1),amount:z.string().min(1),currency:z.string().min(1),status:z.string().min(1)});
const bankSchema=z.object({settlement_id:z.string().min(1),transaction_id:z.string().min(1),event_type:z.enum(['SALE','REFUND']),settled_at:z.string().min(1),amount:z.string().min(1),currency:z.string().min(1),bank_reference:z.string().min(1)});
export function validatePlatformRows(rows:Record<string,string>[]):{valid:PlatformTransaction[];invalid:{sourceRow:number;reason:string;raw:string}[]}{
 const valid:PlatformTransaction[]=[];const invalid:{sourceRow:number;reason:string;raw:string}[]=[];
 rows.forEach((r,i)=>{const row=i+2;const parsed=platSchema.safeParse(r);const paise=toPaise(r.amount||'');const d=new Date(r.created_at||'');
  if(!parsed.success||!Number.isFinite(paise)||isNaN(d.getTime())){invalid.push({sourceRow:row,reason:!parsed.success?'Missing or invalid required field(s)':(!Number.isFinite(paise)?'Amount is not a number':'Date is invalid'),raw:JSON.stringify(r)});return}
  valid.push({transaction_id:r.transaction_id!,event_type:r.event_type as 'SALE'|'REFUND',original_transaction_id:r.original_transaction_id||undefined,created_at:r.created_at!,amount:parseFloat(r.amount!),currency:r.currency!,status:r.status!,sourceRow:row,amountPaise:paise})});
 return{valid,invalid}}
export function validateBankRows(rows:Record<string,string>[]):{valid:BankSettlement[];invalid:{sourceRow:number;reason:string;raw:string}[]}{
 const valid:BankSettlement[]=[];const invalid:{sourceRow:number;reason:string;raw:string}[]=[];
 rows.forEach((r,i)=>{const row=i+2;const parsed=bankSchema.safeParse(r);const paise=toPaise(r.amount||'');const d=new Date(r.settled_at||'');
  if(!parsed.success||!Number.isFinite(paise)||isNaN(d.getTime())){invalid.push({sourceRow:row,reason:!parsed.success?'Missing or invalid required field(s)':(!Number.isFinite(paise)?'Amount is not a number':'Date is invalid'),raw:JSON.stringify(r)});return}
  valid.push({settlement_id:r.settlement_id!,transaction_id:r.transaction_id!,event_type:r.event_type as 'SALE'|'REFUND',original_transaction_id:r.original_transaction_id||undefined,settled_at:r.settled_at!,amount:parseFloat(r.amount!),currency:r.currency!,bank_reference:r.bank_reference!,sourceRow:row,amountPaise:paise})});
 return{valid,invalid}}
