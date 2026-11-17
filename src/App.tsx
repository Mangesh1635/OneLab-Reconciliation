import { useState } from 'react';
import { AppProvider } from './state';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import ReconPage from './pages/ReconPage';
import ExceptionsPage from './pages/ExceptionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
const TABS=[['Dashboard',Dashboard],['Data Import',ImportPage],['Reconciliation',ReconPage],['Discrepancies',ExceptionsPage],['Reports',ReportsPage],['Settings',SettingsPage]] as const;
export default function App(){const [tab,setTab]=useState(0);const Page=TABS[tab][1];
 return <AppProvider><div className="min-h-screen"><header className="bg-slate-900 text-white"><div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4"><div className="font-bold text-lg">OneLab <span className="text-cyan-400">Reconciliation</span></div><nav className="flex flex-wrap gap-1">{TABS.map(([label],i)=><button key={label} onClick={()=>setTab(i)} className={`px-3 py-1.5 rounded text-sm ${i===tab?'bg-cyan-700':'hover:bg-slate-800'}`}>{label}</button>)}</nav><span className="ml-auto text-xs text-slate-300">Local-first · No data leaves this browser · INR · Asia/Kolkata</span></div></header><main className="max-w-7xl mx-auto px-4 py-6"><Page/></main><footer className="max-w-7xl mx-auto px-4 pb-6 text-xs text-slate-500">OneLab Reconciliation — deterministic reconciliation in TypeScript. Amounts in integer paise; tolerances configurable in Settings.</footer></div></AppProvider>}
