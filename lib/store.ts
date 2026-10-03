"use client";
import { useSyncExternalStore } from "react";
import type { GenerationResult,UserPreferences } from "@/types/course";
import { DEFAULT_PREFERENCES,sanitizePreferences } from "./schedule";
import { normalizeCourseNumber,record } from "./normalize";
export interface PlannerState { selected:string[]; manual:Record<string,string>; allowed:Record<string,string[]>; preferences:UserPreferences; dark:boolean; results:GenerationResult|null; storageError:boolean; }
const initial:PlannerState={selected:[],manual:{},allowed:{},preferences:DEFAULT_PREFERENCES,dark:false,results:null,storageError:false};
let state=initial,loaded=false;const listeners=new Set<()=>void>();const KEY="technion-smart-vibe:2026_200:v1";
function load(){if(loaded||typeof window==="undefined")return;loaded=true;try{const raw=localStorage.getItem(KEY);if(raw){const r=record(JSON.parse(raw)),selected=Array.isArray(r.selected)?Array.from(new Set(r.selected.filter((x):x is string=>typeof x==="string").map(normalizeCourseNumber).filter(Boolean))).slice(0,10):[];state={...initial,selected,manual:Object.fromEntries(Object.entries(record(r.manual)).filter(([id,v])=>selected.includes(id)&&typeof v==="string")) as Record<string,string>,allowed:Object.fromEntries(Object.entries(record(r.allowed)).filter(([id,v])=>selected.includes(id)&&Array.isArray(v)&&v.every(x=>typeof x==="string"))) as Record<string,string[]>,preferences:sanitizePreferences(r.preferences),dark:r.dark===true};}}catch{state={...initial,storageError:true};}}
function snapshot(){load();return state;}
function subscribe(listener:()=>void){listeners.add(listener);const onStorage=(e:StorageEvent)=>{if(e.key===KEY){loaded=false;load();listeners.forEach(f=>f());}};window.addEventListener("storage",onStorage);return ()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);};}
export function usePlanner(){return useSyncExternalStore(subscribe,snapshot,()=>initial);}
export function updatePlanner(update:Partial<PlannerState>|((s:PlannerState)=>Partial<PlannerState>)){load();state={...state,...(typeof update==="function"?update(state):update)};try{const {selected,manual,allowed,preferences,dark}=state;localStorage.setItem(KEY,JSON.stringify({selected,manual,allowed,preferences,dark}));}catch{state={...state,storageError:true};}listeners.forEach(f=>f());}
export function toggleCourse(id:string){updatePlanner(s=>({selected:s.selected.includes(id)?s.selected.filter(x=>x!==id):s.selected.length<10?[...s.selected,id]:s.selected,results:null}));}
