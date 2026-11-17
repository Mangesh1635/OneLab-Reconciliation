import type { EventType } from './transaction';
export interface BankSettlement{settlement_id:string;transaction_id:string;event_type:EventType;original_transaction_id?:string;settled_at:string;amount:number;currency:string;bank_reference:string;sourceRow:number;amountPaise:number}
