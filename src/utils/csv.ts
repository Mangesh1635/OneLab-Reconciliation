import Papa from 'papaparse';
export interface ParsedCsv<T>{rows:T[];invalid:{sourceRow:number;reason:string;raw:string}[];headers:string[]}
export function parseCsvText(text:string):{data:Record<string,string>[];headers:string[]}{const r=Papa.parse<Record<string,string>>(text,{header:true,skipEmptyLines:true,transformHeader:(h)=>h.trim()});return{data:r.data as Record<string,string>[],headers:(r.meta.fields||[])}}
export function toCsv(rows:Record<string,unknown>[],headers:string[]):string{const esc=(v:unknown)=>{const s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};return [headers.join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n')}
export function downloadCsv(filename:string,csv:string){const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}
