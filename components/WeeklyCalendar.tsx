"use client";
import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import type { Meeting } from "@/types/course";
import { DAYS,formatTime,overlaps } from "@/lib/normalize";
import { getConflicts } from "@/lib/schedule";
const COLORS=["#1e8870","#6870c7","#c5793b","#4399ac","#bd668d","#859147","#636c93","#a55e48","#58836f","#916bbc"];
export default function WeeklyCalendar({meetings}:{meetings:Meeting[]}){
 const layout=useMemo(()=>{
 const ids=Array.from(new Set(meetings.map(m=>m.courseId))),conflicts=getConflicts(meetings),bad=new Set(conflicts.flatMap(([a,b])=>[a.id,b.id]));
 const dayCount=meetings.some(m=>m.day===6)?7:meetings.some(m=>m.day===5)?6:5;
 const start=Math.min(480,...meetings.map(m=>Math.floor(m.startMinutes/60)*60)),end=Math.max(1200,...meetings.map(m=>Math.ceil(m.endMinutes/60)*60));
 const placed:Record<string,{lane:number;lanes:number}>={};
 for(let day=0;day<dayCount;day++){
  const events=meetings.filter(m=>m.day===day).sort((a,b)=>a.startMinutes-b.startMinutes||a.endMinutes-b.endMinutes);
  let cluster:Meeting[]=[],clusterEnd=0;
  function flush(){const lanes:Meeting[][]=[];for(const m of cluster){let lane=lanes.findIndex(l=>l.every(n=>!overlaps(m,n)));if(lane<0){lane=lanes.length;lanes.push([]);}lanes[lane].push(m);placed[m.id]={lane,lanes:0};}cluster.forEach(m=>placed[m.id].lanes=lanes.length);}
  for(const m of events){if(cluster.length&&m.startMinutes>=clusterEnd){flush();cluster=[];clusterEnd=0;}cluster.push(m);clusterEnd=Math.max(clusterEnd,m.endMinutes);}if(cluster.length)flush();
 }
 return {ids,conflicts,bad,dayCount,start,end,placed};
 },[meetings]);
 const {ids,conflicts,bad,dayCount,start,end,placed}=layout,height=(end-start)*1.35;
 return <section className="panel calendar-panel"><div className="panel-title"><h2><CalendarDays size={20}/> השבוע שלך במבט אחד</h2><span className={"badge "+(conflicts.length?"danger":"")}>{conflicts.length?conflicts.length+" חפיפות":"ללא חפיפות"}</span></div>{conflicts.length>0&&<div className="notice warning" role="alert">{conflicts.slice(0,5).map(([a,b])=><p key={a.id+b.id}>{a.courseName} ו־{b.courseName} · יום {DAYS[a.day]} · <bdi>{formatTime(Math.max(a.startMinutes,b.startMinutes))}–{formatTime(Math.min(a.endMinutes,b.endMinutes))}</bdi></p>)}</div>}<div className="calendar-scroll"><div className="calendar" style={{minWidth:dayCount*135+60}}><div className="calendar-header" style={{gridTemplateColumns:"55px repeat("+dayCount+",1fr)"}}><span>שעה</span>{DAYS.slice(0,dayCount).map(d=><strong key={d}>{d}</strong>)}</div><div className="calendar-body" style={{height,gridTemplateColumns:"55px repeat("+dayCount+",1fr)"}}><div className="time-axis">{Array.from({length:(end-start)/60+1},(_,i)=><span key={i} style={{top:i*60*1.35}}>{formatTime(start+i*60)}</span>)}</div>{DAYS.slice(0,dayCount).map((d,day)=><div className="day-column" key={d}>{Array.from({length:(end-start)/60},(_,i)=><div key={i} className="hour-line" style={{top:i*60*1.35}}/>)}{meetings.filter(m=>m.day===day).map(m=>{const p=placed[m.id];return <article key={m.id} className={"meeting-card "+(bad.has(m.id)?"conflict":"")} style={{top:(m.startMinutes-start)*1.35,height:Math.max(34,(m.endMinutes-m.startMinutes)*1.35-3),width:"calc("+100/p.lanes+"% - 5px)",insetInlineStart:"calc("+p.lane*100/p.lanes+"% + 2px)",background:COLORS[ids.indexOf(m.courseId)%COLORS.length]+"1c",borderInlineStartColor:COLORS[ids.indexOf(m.courseId)%COLORS.length]}} title={m.courseName+" · "+m.type+" · "+m.lecturer+" · "+(m.room||"חדר טרם פורסם")}><strong>{m.courseName}</strong><span>{m.type} · קב׳ {m.registrationGroup}</span><bdi>{formatTime(m.startMinutes)}–{formatTime(m.endMinutes)}</bdi><small>{m.lecturer||"מרצה טרם פורסם"}</small><small>{m.room||"חדר טרם פורסם"}</small>{bad.has(m.id)&&<b className="conflict-label">חפיפה</b>}</article>;})}</div>)}</div></div></div>{!meetings.length&&<p className="muted calendar-empty">בחרו קורס וקבוצת רישום כדי לראות כאן את המפגשים.</p>}<div className="calendar-legend">{ids.map((id,i)=><span key={id}><i style={{background:COLORS[i%COLORS.length]}}/>{meetings.find(m=>m.courseId===id)?.courseName}</span>)}</div></section>;
}
