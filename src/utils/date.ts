export function monthKey(d:string):string{return d.slice(0,7)}
export function parseDate(s:string):Date|null{const d=new Date(s);return isNaN(d.getTime())?null:d}
export function daysBetween(a:string,b:string):number{const da=parseDate(a),db=parseDate(b);if(!da||!db)return NaN;return Math.round((db.getTime()-da.getTime())/86400000)}
export function monthEnd(month:string):string{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)}
export function isInMonth(d:string,month:string):boolean{return monthKey(d)===month}
export function monthLabel(month:string):string{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1,1)).toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'UTC'})}
