import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PlatformTransaction } from './types/transaction';
import type { BankSettlement } from './types/settlement';
import type { ReconConfig } from './types/reconciliation';
import { DEFAULT_CONFIG } from './types/reconciliation';
import { reconcile } from './features/reconciliation/reconciliationEngine';
export interface ImportState{platform:PlatformTransaction[];bank:BankSettlement[];invalid:{dataset:string;sourceRow:number;reason:string;raw:string}[];loaded:boolean}
const empty:ImportState={platform:[],bank:[],invalid:[],loaded:false};
interface AppCtx{data:ImportState;setData:(d:ImportState)=>void;month:string;setMonth:(m:string)=>void;currency:string;setCurrency:(c:string)=>void;config:ReconConfig;setConfig:(c:ReconConfig)=>void;result:ReturnType<typeof reconcile>|null;run:()=>void;hasRun:boolean}
const Ctx=createContext<AppCtx|null>(null);
export function AppProvider({children}:{children:ReactNode}){const [data,setData]=useState<ImportState>(empty);const [month,setMonth]=useState('2026-10');const [currency,setCurrency]=useState('INR');const [config,setConfig]=useState<ReconConfig>(DEFAULT_CONFIG);const [hasRun,setHasRun]=useState(false);
 const result=useMemo(()=>{if(!data.loaded)return null;return reconcile(data.platform,data.bank,month,currency,config,data.invalid)},[data,month,currency,config]);
 const run=useCallback(()=>setHasRun(true),[]);
 return <Ctx.Provider value={{data,setData,month,setMonth,currency,setCurrency,config,setConfig,result,run,hasRun}}>{children}</Ctx.Provider>}
export function useApp(){const c=useContext(Ctx);if(!c)throw new Error('useApp outside provider');return c}
