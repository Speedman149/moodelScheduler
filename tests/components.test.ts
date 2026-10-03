import { describe,it,expect } from "vitest";
import { normalizeCourse } from "@/lib/normalize";
import { getComponentOptions,getManualOption,groupComponents,sanitizeSelection } from "@/lib/components";
import { DEFAULT_PREFERENCES,generateSchedules,getConflicts } from "@/lib/schedule";
import { getCourse } from "@/lib/data";
import type { Course } from "@/types/course";

function example():Course {
  const rows=[];
  for(const [registration,lecture,tutorial,lab,start] of [[11,10,11,11,630],[21,20,21,21,750]]) {
    const time=(n:number)=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
    for(const [type,component,day] of [["הרצאה",lecture,"ראשון"],["הרצאה",lecture,"חמישי"],["תרגול",tutorial,"שני"],["מעבדה",lab,"שלישי"]] as const) {
      rows.push({"קבוצה":registration,"מס.":component,"סוג":type,"יום":day,"שעה":time(start)+" - "+time(start+60)});
    }
  }
  return normalizeCourse({general:{"מספר מקצוע":"02340124","שם מקצוע":"קורס א"},schedule:rows})!;
}
const free={respectRegistrationGroups:false,allowedComponents:{}};
describe("independent lecture, tutorial and lab options",()=>{
  it("generates all eight combinations and retains both weekly lecture meetings",()=>{
    const course=example();
    const registered=generateSchedules([course],DEFAULT_PREFERENCES);
    const mixed=generateSchedules([course],DEFAULT_PREFERENCES,{},200000,free);
    expect(registered.validCount).toBe(2);
    expect(mixed.validCount).toBe(8);
    for(const schedule of mixed.schedules) {
      expect(schedule.options).toHaveLength(1);
      expect(schedule.options[0].mode).toBe("free");
      expect(schedule.options[0].components).toHaveLength(3);
      expect(schedule.meetings).toHaveLength(4);
      expect(schedule.meetings.filter(m=>m.type==="הרצאה")).toHaveLength(2);
      expect(getConflicts(schedule.meetings)).toHaveLength(0);
    }
    expect(mixed.schedules.some(s=>s.options[0].components?.map(c=>c.componentGroup).join(",")==="20,11,11")).toBe(true);
  });
  it("finds a mixed solution when both registered combinations conflict",()=>{
    const blocker=normalizeCourse({general:{"מספר מקצוע":"02340218","שם מקצוע":"קורס ב"},schedule:[
      {"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"ראשון","שעה":"10:30 - 11:30"},
      {"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"שני","שעה":"12:30 - 13:30"},
      {"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"שלישי","שעה":"12:30 - 13:30"},
    ]})!;
    const courses=[example(),blocker];
    expect(generateSchedules(courses,DEFAULT_PREFERENCES).validCount).toBe(0);
    const result=generateSchedules(courses,DEFAULT_PREFERENCES,{},200000,free);
    expect(result.validCount).toBe(1);
    const picks=result.schedules[0].options.find(o=>o.courseId==="02340124")!.components!;
    expect(picks.find(c=>c.type==="הרצאה")?.componentGroup).toBe("20");
    expect(picks.find(c=>c.type==="תרגול")?.componentGroup).toBe("11");
    expect(picks.find(c=>c.type==="מעבדה")?.componentGroup).toBe("11");
  });
  it("deduplicates shared real lectures without dropping recurring meetings",()=>{
    const course=getCourse("234124")!;
    const components=getComponentOptions(course);
    expect(components.filter(c=>c.type==="הרצאה"&&c.componentGroup==="10")).toHaveLength(1);
    expect(components.find(c=>c.type==="הרצאה"&&c.componentGroup==="10")?.meetings).toHaveLength(1);
    const calculus=getComponentOptions(getCourse("104031")!);
    expect(calculus.find(c=>c.type==="הרצאה"&&c.componentGroup==="20")?.meetings).toHaveLength(2);
  });
  it("lets each component allowlist restrict a different registration origin",()=>{
    const course=example(),components=getComponentOptions(course);
    const allowed=Object.fromEntries([...groupComponents(components)].map(([type,choices])=>[type,[choices.find(c=>c.componentGroup===(type==="הרצאה"?"20":"11"))!.id]]));
    const result=generateSchedules([course],DEFAULT_PREFERENCES,{},200000,{...free,allowedComponents:{[course.id]:allowed}});
    expect(result.validCount).toBe(1);
    expect(generateSchedules([course],DEFAULT_PREFERENCES,{[course.id]:[]},200000,free).validCount).toBe(8);
    expect(generateSchedules([course],DEFAULT_PREFERENCES,{},200000,{...free,allowedComponents:{[course.id]:{"מעבדה":[]}}}).errors).toHaveLength(1);
  });
  it("reconstructs a saved free selection and keeps registered manual choices separate",()=>{
    const course=example(),choices=getComponentOptions(course),selected=Object.fromEntries(choices.filter(c=>c.componentGroup===(c.type==="הרצאה"?"20":"11")).map(c=>[c.type,c.id]));
    const manual=getManualOption(course,"11",selected,false)!;
    expect(manual.mode).toBe("free");
    expect(manual.components?.find(c=>c.type==="הרצאה")?.componentGroup).toBe("20");
    expect(getManualOption(course,"11",selected,true)?.registrationGroup).toBe("11");
  });
  it("blocks mixed internal overlaps and still honors hard constraints",()=>{
    const course=example();
    course.entries.find(e=>e.type==="תרגול"&&e.componentGroup==="11")!.meeting!.day=0;
    const result=generateSchedules([course],DEFAULT_PREFERENCES,{},200000,free);
    expect(result.validCount).toBe(6);
    expect(result.schedules.every(s=>!getConflicts(s.meetings).length)).toBe(true);
    expect(generateSchedules([example()],{...DEFAULT_PREFERENCES,freeDay:4,freeDayRule:{hard:true,weight:5}}, {},200000,free).validCount).toBe(0);
  });
  it("treats physical education activities as alternatives in one component category",()=>{
    const components=getComponentOptions(getCourse("03940801")!);
    expect(groupComponents(components).size).toBe(1);
    const result=generateSchedules([getCourse("03940801")!],DEFAULT_PREFERENCES,{},200000,free);
    expect(result.validCount).toBeGreaterThan(1);
    expect(result.schedules.every(s=>s.options[0].components?.length===1)).toBe(true);
  });
  it("retains incomplete component warnings even when another recurring row is valid",()=>{
    const course=example();
    const row=course.entries.find(e=>e.type==="מעבדה")!;
    course.entries.push({...row,timeLabel:"לא ידוע",meeting:null});
    const choices=getComponentOptions(course);
    expect(choices.find(c=>c.type==="מעבדה"&&c.componentGroup==="11")?.warnings).toHaveLength(1);
    const result=generateSchedules([course],DEFAULT_PREFERENCES,{},200000,free);
    expect(result.validCount).toBe(4);
    expect(result.schedules.every(s=>s.options[0].components?.find(c=>c.type==="מעבדה")?.componentGroup==="21")).toBe(true);
  });
  it("bounds component backtracking and validates API selection policy",()=>{
    expect(generateSchedules([example()],DEFAULT_PREFERENCES,{},1,free).truncated).toBe(true);
    expect(sanitizeSelection(undefined,[]).respectRegistrationGroups).toBe(true);
    expect(sanitizeSelection({respectRegistrationGroups:false,allowedComponents:{bad:{"הרצאה":["x"]}}},[])).toEqual(free);
    expect(sanitizeSelection({respectRegistrationGroups:"false"},[]).respectRegistrationGroups).toBe(true);
  });
});
