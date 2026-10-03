import { getComponentOptions,groupComponents,componentSelection } from "./components";
import type { Course,CourseOption,GeneratedSchedule,GenerationResult,Meeting,ScheduleMetrics,UserPreferences,ScheduleSelection } from "@/types/course";
import { DAYS,formatTime,overlaps,record,text } from "./normalize";
export const DEFAULT_PREFERENCES:UserPreferences={freeDay:4,freeDayRule:{weight:0,hard:false},startMinutes:630,startRule:{weight:0,hard:false},finishMinutes:990,finishRule:{weight:0,hard:false},gaps:{weight:4,hard:false},campusDays:{weight:2,hard:false},atLeastOneFreeDay:false,maxGapMinutes:null,preferLecturer:"",avoidLecturer:"",lecturerRule:{weight:3,hard:false}};
export function sanitizePreferences(input:unknown):UserPreferences{
 const r=record(input),number=(v:unknown,fallback:number,max:number)=>typeof v==="number"&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.round(v))):fallback;
 const rule=(v:unknown,fallback:{weight:number;hard:boolean})=>({weight:number(record(v).weight,fallback.weight,5),hard:record(v).hard===true});
 return {freeDay:number(r.freeDay,4,6),freeDayRule:rule(r.freeDayRule,DEFAULT_PREFERENCES.freeDayRule),startMinutes:number(r.startMinutes,630,1439),startRule:rule(r.startRule,DEFAULT_PREFERENCES.startRule),finishMinutes:number(r.finishMinutes,990,1439),finishRule:rule(r.finishRule,DEFAULT_PREFERENCES.finishRule),gaps:rule(r.gaps,DEFAULT_PREFERENCES.gaps),campusDays:rule(r.campusDays,DEFAULT_PREFERENCES.campusDays),atLeastOneFreeDay:r.atLeastOneFreeDay===true,maxGapMinutes:r.maxGapMinutes===null||r.maxGapMinutes===undefined?null:number(r.maxGapMinutes,90,1440),preferLecturer:text(r.preferLecturer).slice(0,100),avoidLecturer:text(r.avoidLecturer).slice(0,100),lecturerRule:rule(r.lecturerRule,DEFAULT_PREFERENCES.lecturerRule)};
}
export function getConflicts(meetings:Meeting[]):[Meeting,Meeting][]{const conflicts:[Meeting,Meeting][]=[];meetings.forEach((m,i)=>meetings.slice(i+1).forEach(n=>{if(overlaps(m,n))conflicts.push([m,n]);}));return conflicts;}
export function metrics(meetings:Meeting[],p:UserPreferences):ScheduleMetrics{
 const days=new Set(meetings.map(m=>m.day));let totalGapMinutes=0,maxGapMinutes=0;
 for(const day of days){const list=meetings.filter(m=>m.day===day).sort((a,b)=>a.startMinutes-b.startMinutes);let end=list[0].endMinutes;for(const m of list.slice(1)){const gap=Math.max(0,m.startMinutes-end);totalGapMinutes+=gap;maxGapMinutes=Math.max(maxGapMinutes,gap);end=Math.max(end,m.endMinutes);}}
 return {campusDays:days.size,freeDays:[0,1,2,3,4].filter(d=>!days.has(d)),earliestStart:meetings.length?Math.min(...meetings.map(m=>m.startMinutes)):0,latestFinish:meetings.length?Math.max(...meetings.map(m=>m.endMinutes)):0,totalGapMinutes,maxGapMinutes,morningMinutes:meetings.reduce((s,m)=>s+Math.max(0,Math.min(m.endMinutes,p.startMinutes)-m.startMinutes),0),lateMinutes:meetings.reduce((s,m)=>s+Math.max(0,m.endMinutes-Math.max(m.startMinutes,p.finishMinutes)),0)};
}
export function scoreSchedule(options:CourseOption[],p:UserPreferences):GeneratedSchedule|null{
 const meetings=options.flatMap(o=>o.meetings),m=metrics(meetings,p),onFree=meetings.filter(x=>x.day===p.freeDay).reduce((s,x)=>s+x.endMinutes-x.startMinutes,0);
 const lecturerMatch=(value:string,x:Meeting)=>value&&x.lecturer.toLocaleLowerCase().includes(value.toLocaleLowerCase());
 const avoided=meetings.filter(x=>lecturerMatch(p.avoidLecturer,x)).length,preferred=meetings.filter(x=>lecturerMatch(p.preferLecturer,x)).length;
 if((p.freeDayRule.hard&&onFree)||(p.startRule.hard&&m.morningMinutes)||(p.finishRule.hard&&m.lateMinutes)||(p.atLeastOneFreeDay&&!m.freeDays.length)||(p.maxGapMinutes!==null&&m.maxGapMinutes>p.maxGapMinutes)||(p.lecturerRule.hard&&avoided)||(p.lecturerRule.hard&&p.preferLecturer&&!preferred))return null;
 const violations:string[]=[];
 if(onFree&&(p.freeDayRule.weight||p.freeDayRule.hard))violations.push("שיעורים ביום "+DAYS[p.freeDay]);
 if(m.morningMinutes&&(p.startRule.weight||p.startRule.hard))violations.push(m.morningMinutes+" דקות לפני "+formatTime(p.startMinutes));
 if(m.lateMinutes&&(p.finishRule.weight||p.finishRule.hard))violations.push(m.lateMinutes+" דקות אחרי "+formatTime(p.finishMinutes));
 if(m.totalGapMinutes&&p.gaps.weight)violations.push(m.totalGapMinutes+" דקות חלונות");
 if(avoided)violations.push("מפגשים עם המרצה שממנו העדפת להימנע");
 if(p.preferLecturer&&!preferred)violations.push("המרצה המועדף לא מופיע במערכת");
 const parts:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]]=[[p.freeDayRule.weight,Math.min(1,onFree/360)],[p.startRule.weight,Math.min(1,m.morningMinutes/600)],[p.finishRule.weight,Math.min(1,m.lateMinutes/600)],[p.gaps.weight,Math.min(1,m.totalGapMinutes/600)],[p.campusDays.weight,Math.max(0,m.campusDays-1)/6],[p.preferLecturer||p.avoidLecturer?p.lecturerRule.weight:0,p.preferLecturer||p.avoidLecturer?Math.min(1,(avoided+(p.preferLecturer&&!preferred?1:0))/Math.max(1,meetings.length)):0]];
 const totalWeight=parts.reduce((s,[w])=>s+w,0),penalty=parts.reduce((s,[w,v])=>s+w*v,0);
 return {id:options.map(o=>o.id).sort().join("|"),options:[...options],meetings,score:Math.round(100*(1-(totalWeight?penalty/totalWeight:0))),metrics:m,violations};
}
export function generateSchedules(courses:Course[],preferences:UserPreferences,allowedGroups:Record<string,string[]>={},nodeLimit=200000,selection:ScheduleSelection={respectRegistrationGroups:true,allowedComponents:{}}):GenerationResult {
  const result:GenerationResult={schedules:[],examined:0,validCount:0,truncated:false,errors:[]};
  if(!courses.length){result.errors.push("יש לבחור לפחות קורס אחד");return result;}
  const units:{course:Course;label:string;options:CourseOption[]}[]=[];
  for(const course of courses) {
    if(selection.respectRegistrationGroups) {
      const options=course.options.filter(o=>!o.warnings.length&&o.meetings.length&&(!allowedGroups[course.id]||allowedGroups[course.id].includes(o.registrationGroup)));
      units.push({course,label:"קבוצת רישום",options});
    } else {
      const types=groupComponents(getComponentOptions(course));
      if(!types.size)result.errors.push(course.name+": אין אפשרויות עם נתוני זמן");
      for(const [type,choices] of types) {
        const allowed=selection.allowedComponents[course.id]?.[type];
        const options=choices.filter(c=>!c.warnings.length&&c.meetings.length&&(!allowed||allowed.includes(c.id))).map(c=>({
          id:c.id,courseId:course.id,registrationGroup:"",mode:"free" as const,components:[componentSelection(c)],meetings:c.meetings,warnings:[],
        }));
        units.push({course,label:type,options});
      }
    }
  }
  units.sort((a,b)=>a.options.length-b.options.length);
  for(const unit of units)if(!unit.options.length)result.errors.push(unit.course.name+": אין אפשרות "+unit.label+" עם נתוני זמן מלאים בבחירה הנוכחית");
  if(result.errors.length)return result;
  const current:CourseOption[]=[],meetings:Meeting[]=[];
  function assembledOptions():CourseOption[] {
    if(selection.respectRegistrationGroups)return current;
    return courses.map(course=>{
      const picks=current.filter(o=>o.courseId===course.id);
      return {id:course.id+":free:"+picks.map(o=>o.id).sort().join("+"),courseId:course.id,registrationGroup:"",mode:"free",components:picks.flatMap(o=>o.components||[]),meetings:picks.flatMap(o=>o.meetings),warnings:[]};
    });
  }
  function visit(index:number) {
    if(++result.examined>nodeLimit){result.truncated=true;return;}
    if(index===units.length) {
      const schedule=scoreSchedule(assembledOptions(),preferences);
      if(schedule) {
        result.validCount++;
        result.schedules.push(schedule);
        result.schedules.sort((a,b)=>b.score-a.score||a.metrics.totalGapMinutes-b.metrics.totalGapMinutes||a.id.localeCompare(b.id));
        if(result.schedules.length>10)result.schedules.pop();
      }
      return;
    }
    for(const option of units[index].options) {
      if(result.truncated)return;
      if(option.meetings.some(m=>meetings.some(n=>overlaps(m,n))))continue;
      if(option.meetings.some(m=>(preferences.freeDayRule.hard&&m.day===preferences.freeDay)||(preferences.startRule.hard&&m.startMinutes<preferences.startMinutes)||(preferences.finishRule.hard&&m.endMinutes>preferences.finishMinutes)||(preferences.lecturerRule.hard&&preferences.avoidLecturer&&m.lecturer.toLowerCase().includes(preferences.avoidLecturer.toLowerCase()))))continue;
      current.push(option);
      const before=meetings.length;
      meetings.push(...option.meetings);
      visit(index+1);
      meetings.length=before;
      current.pop();
    }
  }
  visit(0);
  return result;
}
