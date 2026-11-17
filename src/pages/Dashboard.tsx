import { useApp } from '../state';
import { Card, StatCard, Badge, Empty } from '../components/ui';
import { formatINR } from '../utils/currency';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CATEGORY_LABELS } from '../features/reconciliation/exceptionClassifier';
export default function Dashboard(){const {result,data,month,setMonth,currency,setCurrency,run}=useApp();
 const s=result?.summary;
 const pie=s?[{name:'Matched',value:s.matchedCount},{name:'Platform only',value:s.platformOnlyCount},{name:'Bank only',value:s.bankOnlyCount},{name:'Amount mismatch',value:s.amountMismatchCount},{name:'Timing',value:s.timingCount}].filter(x=>x.value>0):[];
 const bar=s?[{name:'Platform',amount:s.platformTotalPaise/100},{name:'Bank in period',amount:s.bankInPeriodPaise/100},{name:'Matched',amount:s.matchedAmountPaise/100},{name:'Unexplained',amount:s.unexplainedPaise/100}]:[];
 const byCat:Record<string,number>={}; result?.exceptions.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+1});
 return <div className="space-y-6">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Month-end reconciliation</h1><p className="text-sm text-slate-500 mt-1">Platform transactions vs bank settlements for {month}. Every difference is explained — nothing is hidden to force a match.</p></div>
  <div className="flex gap-2"><label className="text-xs text-slate-500">Month <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="ml-1 rounded border px-2 py-1 text-sm"/></label><label className="text-xs text-slate-500">Currency <select value={currency} onChange={e=>setCurrency(e.target.value)} className="ml-1 rounded border px-2 py-1 text-sm"><option>INR</option><option>USD</option><option>EUR</option></select></label><button onClick={run} className="rounded bg-cyan-700 px-3 py-1.5 text-sm font-medium text-white">Run reconciliation</button></div></div>
  {!data.loaded?<Empty title="No data loaded yet" body="Go to Data Import and load the sample datasets, or upload your own platform and bank CSV files."/>:s?<>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
   <StatCard label="Platform transactions" value={String(s.platformCount)} sub={formatINR(s.platformTotalPaise,currency)}/>
   <StatCard label="Bank settlements (in period)" value={String(s.bankCount)} sub={formatINR(s.bankInPeriodPaise,currency)}/>
   <StatCard label="Matched" value={String(s.matchedCount)} sub={formatINR(s.matchedAmountPaise,currency)} accent="#047857"/>
   <StatCard label="Overall status" value={s.status.replaceAll('_',' ')} sub={s.unexplainedPaise===0?'Final unexplained difference is zero':'Final unexplained difference is not zero'} accent={s.unexplainedPaise===0?'#047857':'#B91C1C'}/>
   <StatCard label="Unmatched platform" value={String(s.platformOnlyCount)} sub={formatINR(s.platformOnlyPaise,currency)}/>
   <StatCard label="Bank only" value={String(s.bankOnlyCount)} sub={formatINR(s.bankOnlyPaise,currency)}/>
   <StatCard label="Duplicates excluded" value={String(s.duplicateCount)} sub={formatINR(s.duplicatePaise,currency)+' excluded'}/>
   <StatCard label="Timing differences" value={String(s.timingCount)} sub={formatINR(s.timingPaise,currency)}/>
   <StatCard label="Rounding records" value={String(s.roundingCount)} sub={`Aggregate ${formatINR(s.aggregateRoundingPaise,currency)}`}/>
   <StatCard label="Orphan refunds" value={String(s.orphanCount)} sub={formatINR(s.orphanPaise,currency)}/>
   <StatCard label="Amount mismatches" value={String(s.amountMismatchCount)} sub={formatINR(s.amountMismatchDiffPaise,currency)}/>
   <StatCard label="Invalid records" value={String(s.invalidCount)} sub="Rejected at import — never silently discarded"/>
  </div>
  {s.aggregateRoundingExceeds&&<Card className="p-4 border-amber-300 bg-amber-50"><div className="flex gap-2"><AlertTriangle className="h-5 w-5 text-amber-700"/><p className="text-sm"><b>Aggregate rounding discrepancy:</b> {s.roundingCount} records each differ by only ₹0.01, but the cumulative variance is {formatINR(s.aggregateRoundingPaise,currency)} — above the aggregate tolerance of {formatINR(1,currency)}. Individually insignificant, collectively material.</p></div></Card>}
  <div className="grid md:grid-cols-2 gap-4">
   <Card className="p-4"><h3 className="font-semibold mb-2">Outcome mix (platform records)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={90} label>{pie.map((_,i)=><Cell key={i} fill={['#047857','#B91C1C','#B45309','#0E7490','#6D28D9'][i%5]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></Card>
   <Card className="p-4"><h3 className="font-semibold mb-2">Financial bridge (₹)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={bar}><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v)=>formatINR(Number(v)*100,currency)}/><Bar dataKey="amount" fill="#0E7490"/></BarChart></ResponsiveContainer></div></Card>
  </div>
  <Card className="p-4"><h3 className="font-semibold mb-2">Exceptions by category</h3><div className="flex flex-wrap gap-2">{Object.entries(byCat).map(([k,v])=><Badge key={k} text={`${CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS]}: ${v}`} tone={k==='ORPHAN_REFUND'||k==='AMOUNT_MISMATCH'?'red':k==='TIMING_DIFFERENCE'||k==='ROUNDING_VARIANCE'?'amber':'blue'}/>)}{Object.keys(byCat).length===0&&<span className="text-sm text-slate-500">No exceptions.</span>}</div></Card>
  <Card className="p-4"><h3 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/>Financial bridge — how the final difference is calculated</h3><table className="w-full text-sm"><tbody>{result!.bridge.map(b=><tr key={b.label} className="border-t"><td className="py-2">{b.label}<div className="text-xs text-slate-500">{b.note}</div></td><td className="py-2 text-right tabular-nums font-medium">{formatINR(b.amountPaise,currency)}</td></tr>)}</tbody></table><p className="text-xs text-slate-500 mt-2">Formula: platform total − bank in period − timing − platform-only − mismatch difference − rounding + bank-only + orphan (signed) = unexplained difference.</p></Card>
  </>:<Empty title="Data loaded" body="Reconciliation is computing."/>}
 </div>}
