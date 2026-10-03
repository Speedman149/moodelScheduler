import type { Course,CourseOption,Meeting,ScheduleEntry } from "@/types/course";
export const DAYS=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
export function normalizeCourseNumber(value:string|number):string {
 const s=String(value).trim(); if(!/^\d{1,8}$/.test(s)) return "";
 if(s.length<=6){const legacy=s.padStart(6,"0");return legacy.slice(0,3).padStart(4,"0")+legacy.slice(3).padStart(4,"0");}
 return s.padStart(8,"0");
}
export function parseTime(value:string):number|null { const m=value.trim().match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;const h=Number(m[1]),min=Number(m[2]);return h<24&&min<60?h*60+min:null;}
export function parseTimeRange(value:string):{startMinutes:number;endMinutes:number}|null {const parts=value.split(/\s*[-–—]\s*/);if(parts.length!==2)return null;const a=parseTime(parts[0]),b=parseTime(parts[1]);return a!==null&&b!==null&&a<b?{startMinutes:a,endMinutes:b}:null;}
export function formatTime(minutes:number):string{return String(Math.floor(minutes/60)).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0");}
export function overlaps(a:Pick<Meeting,"day"|"startMinutes"|"endMinutes">,b:Pick<Meeting,"day"|"startMinutes"|"endMinutes">):boolean{return a.day===b.day&&a.startMinutes<b.endMinutes&&b.startMinutes<a.endMinutes;}
export function record(value:unknown):Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};}
export function text(value:unknown):string{return typeof value==="string"||typeof value==="number"?String(value).trim():"";}
export function normalizeCourse(raw:unknown):Course|null {
 const r=record(raw),g=record(r.general),id=normalizeCourseNumber(text(g["מספר מקצוע"]));if(!id)return null;
 const name=text(g["שם מקצוע"])||"קורס ללא שם", options=new Map<string,CourseOption>();
 const entries:ScheduleEntry[]=(Array.isArray(r.schedule)?r.schedule:[]).map((item,index)=>{
  const s=record(item),registrationGroup=text(s["קבוצה"]),componentGroup=text(s["מס."]),type=text(s["סוג"])||"מפגש",dayLabel=text(s["יום"]),timeLabel=text(s["שעה"]),lecturer=text(s["מרצה/מתרגל"]);
  const room=[text(s["בניין"]),text(s["חדר"])==="0"?"":text(s["חדר"])].filter(Boolean).join(" · ");
  const day=DAYS.indexOf(dayLabel),range=parseTimeRange(timeLabel);
  const meeting:Meeting|null=registrationGroup&&range&&day>=0?{id:id+":"+registrationGroup+":"+index,courseId:id,courseName:name,registrationGroup,componentGroup,type,day,...range,lecturer,room}:null;
  const key=registrationGroup||"unknown";
  if(!options.has(key))options.set(key,{id:id+":"+key,courseId:id,registrationGroup:key,meetings:[],warnings:[]});
  const option=options.get(key)!;
  if(meeting){const same=option.meetings.some(m=>m.componentGroup===meeting.componentGroup&&m.type===type&&m.day===day&&m.startMinutes===range!.startMinutes&&m.endMinutes===range!.endMinutes&&m.lecturer===lecturer&&m.room===room);if(!same)option.meetings.push(meeting);}
  else option.warnings.push("נתוני זמן או קבוצת רישום חסרים: "+type+" "+dayLabel+" "+timeLabel);
  return {registrationGroup,componentGroup,type,dayLabel,timeLabel,lecturer,room,meeting};
 });
 for(const option of options.values()){if(option.meetings.some((m,i)=>option.meetings.slice(i+1).some(n=>overlaps(m,n))))option.warnings.push("חפיפה פנימית בין מפגשי הקבוצה");}
 const credits=text(g["נקודות"]),parsed=Number(credits);
 return {id,name,credits:credits&&Number.isFinite(parsed)?parsed:null,faculty:text(g["פקולטה"])||"לא צוינה פקולטה",lecturers:Array.from(new Set(entries.map(e=>e.lecturer).filter(Boolean))),prerequisites:text(g["מקצועות קדם"]),syllabus:text(g["סילבוס"]),notes:text(g["הערות"]),exams:[text(g["מועד א"]),text(g["מועד ב"])],general:Object.fromEntries(Object.entries(g).map(([k,v])=>[k,text(v)])),entries,options:Array.from(options.values()).sort((a,b)=>Number(a.registrationGroup)-Number(b.registrationGroup))};
}
