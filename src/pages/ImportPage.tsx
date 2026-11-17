import { useState } from 'react';
import { useApp } from '../state';
import { Card, Empty } from '../components/ui';
import { parseCsvText } from '../utils/csv';
import { validatePlatformRows, validateBankRows } from '../features/reconciliation/validation';
const PLAT_FIELDS=['transaction_id','event_type','original_transaction_id','created_at','amount','currency','status'];
const BANK_FIELDS=['settlement_id','transaction_id','event_type','original_transaction_id','settled_at','amount','currency','bank_reference'];
function useFile(kind:'platform'|'bank'){
 const {data,setData}=useApp();
 const [headers,setHeaders]=useState<string[]>([]);const [rows,setRows]=useState<Record<string,string>[]>([]);const [map,setMap]=useState<Record<string,string>>({});const [error,setError]=useState('');
 const fields=kind==='platform'?PLAT_FIELDS:BANK_FIELDS;
 async function onFile(f:File){const text=await f.text();const {data:parsed,headers:h}=parseCsvText(text);setHeaders(h);setRows(parsed);const m:Record<string,string>={};fields.forEach(fl=>{m[fl]=h.includes(fl)?fl:''});setMap(m);setError('')}
 function apply(){
   const mapped=rows.map(r=>{const o:Record<string,string>={};for(const fl of fields){o[fl]=map[fl]?r[map[fl]]||'':''}return o});
   const res=kind==='platform'?validatePlatformRows(mapped):validateBankRows(mapped);
   const invalid=[...data.invalid.filter(x=>x.dataset!==kind),...res.invalid.map(x=>({...x,dataset:kind}))];
   if(kind==='platform') setData({...data,platform:res.valid as never,invalid,loaded:true}); else setData({...data,bank:res.valid as never,invalid,loaded:true});
 }
 return {headers,rows,map,setMap,onFile,apply,error,fields};
}
export default function ImportPage(){const {data,setData}=useApp();const plat=useFile('platform');const bank=useFile('bank');const [msg,setMsg]=useState('');
 async function loadSample(){setMsg('Loading sample datasets…');
  try{const [pt,bt]=await Promise.all([fetch('/sample-data/platform_transactions.csv').then(r=>{if(!r.ok)throw new Error('platform sample not found');return r.text()}),fetch('/sample-data/bank_settlements.csv').then(r=>{if(!r.ok)throw new Error('bank sample not found');return r.text()})]);
  const p=validatePlatformRows(parseCsvText(pt).data);const b=validateBankRows(parseCsvText(bt).data);
  setData({platform:p.valid,bank:b.valid,invalid:[...p.invalid.map(x=>({...x,dataset:'platform'})),...b.invalid.map(x=>({...x,dataset:'bank'}))],loaded:true});setMsg(`Sample loaded: ${p.valid.length} platform records (${p.invalid.length} rejected), ${b.valid.length} bank records (${b.invalid.length} rejected).`)}catch(e){setMsg('Could not load sample data: '+(e as Error).message)}}
 function clear(){setData({platform:[],bank:[],invalid:[],loaded:false});setMsg('All imported data cleared.')}
 function Section({kind,hook}:{kind:'platform'|'bank';hook:ReturnType<typeof useFile>}){return <Card className="p-4 space-y-3"><h3 className="font-semibold">{kind==='platform'?'Platform transactions':'Bank settlements'}</h3>
  <input type="file" accept=".csv,text/csv" onChange={e=>{const f=e.target.files?.[0];if(f)hook.onFile(f)}} className="text-sm"/>
  {hook.headers.length>0&&<><p className="text-xs text-slate-500">Map CSV columns to expected fields (headers found: {hook.headers.join(', ')}).</p><div className="grid md:grid-cols-2 gap-2">{hook.fields.map(fl=><label key={fl} className="text-xs">{fl}<select value={hook.map[fl]||''} onChange={e=>hook.setMap({...hook.map,[fl]:e.target.value})} className="ml-2 rounded border px-1 py-0.5 text-sm"><option value="">— not present —</option>{hook.headers.map(h=><option key={h} value={h}>{h}</option>)}</select></label>)}</div>
  <p className="text-xs text-slate-500">Preview: {hook.rows.length} rows parsed. First row: {JSON.stringify(hook.rows[0]||{})}</p>
  <button onClick={hook.apply} className="rounded bg-cyan-700 px-3 py-1.5 text-sm font-medium text-white">Import {kind} file</button></>}
 </Card>}
 return <div className="space-y-6"><h1 className="text-2xl font-bold">Data import</h1><p className="text-sm text-slate-500">Upload CSVs or load the deterministic sample datasets. Invalid rows are reported, never silently discarded. All processing is local — no data leaves this browser.</p>
 <div className="flex flex-wrap gap-2"><button onClick={loadSample} className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white">Load sample datasets</button><button onClick={clear} className="rounded border px-4 py-2 text-sm">Clear all data</button></div>
 {msg&&<p className="text-sm bg-emerald-50 border border-emerald-200 rounded p-3">{msg}</p>}
 {data.loaded&&<Card className="p-4"><p className="text-sm">Imported: <b>{data.platform.length}</b> platform records, <b>{data.bank.length}</b> bank records, <b>{data.invalid.length}</b> rejected.</p>{data.invalid.length>0&&<table className="w-full text-sm mt-2"><thead><tr className="text-left text-slate-500"><th>Dataset</th><th>Row</th><th>Reason</th></tr></thead><tbody>{data.invalid.map((x,i)=><tr key={i} className="border-t"><td>{x.dataset}</td><td>{x.sourceRow}</td><td>{x.reason}<div className="text-xs text-slate-500 break-all">{x.raw}</div></td></tr>)}</tbody></table>}</Card>}
 <div className="grid md:grid-cols-2 gap-4"><Section kind="platform" hook={plat}/><Section kind="bank" hook={bank}/></div>
 {!data.loaded&&<Empty title="No data yet" body="Load the sample datasets to see the four planted discrepancy scenarios, or upload your own CSV files above."/>}
 </div>}
