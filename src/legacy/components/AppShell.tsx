import type {ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {api,AUTH_BASE} from '@/lib/api';
import type {Me} from '@/lib/types';
export function useMe(){return useQuery<Me>({queryKey:['me'],queryFn:()=>api.get(`${AUTH_BASE}/me`),retry:false});}
export function useIsOwner(){return useMe().data?.role==='OWNER';}
export function AppShell({children}:{children:ReactNode}){return <div className="legacy-control-plane">{children}</div>;}
export function MetricCard({label,value,hint}:{label:string;value:ReactNode;hint?:string}){return <div className="card"><small>{label}</small><div>{value}</div>{hint&&<small>{hint}</small>}</div>;}
export {StatusBadge} from './StatusBadge';
