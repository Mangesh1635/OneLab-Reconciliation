export function toPaise(amount:number|string):number{const n=typeof amount==='string'?parseFloat(amount):amount;if(!Number.isFinite(n))return NaN;return Math.round(n*100)}
export function fromPaise(p:number):number{return p/100}
export function formatINR(paise:number,currency='INR'):string{const v=paise/100;try{return new Intl.NumberFormat('en-IN',{style:'currency',currency}).format(v)}catch{return `${currency} ${v.toFixed(2)}`}}
export function formatAmount(amount:number,currency='INR'):string{return formatINR(Math.round(amount*100),currency)}
export function signedPaise(amountPaise:number,eventType:string):number{return eventType==='REFUND'?-Math.abs(amountPaise):Math.abs(amountPaise)}
