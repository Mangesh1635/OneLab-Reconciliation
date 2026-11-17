export type EventType='SALE'|'REFUND';
export interface PlatformTransaction{transaction_id:string;event_type:EventType;original_transaction_id?:string;created_at:string;amount:number;currency:string;status:string;sourceRow:number;amountPaise:number}
export interface RawPlatformRow{transaction_id?:string;event_type?:string;original_transaction_id?:string;created_at?:string;amount?:string;currency?:string;status?:string}
