import type { ComponentOption,ComponentSelection,Course,CourseOption,ScheduleSelection } from "@/types/course";
import { overlaps } from "./normalize";

// A component number identifies the complete recurring lecture/tutorial/lab.
// Registration groups may repeat the same component rows.
const ACADEMIC_TYPES = new Set(["הרצאה", "תרגול", "מעבדה", "פרויקט", "סמינר"]);
export function getComponentOptions(course:Course):ComponentOption[] {
  const choices = new Map<string,ComponentOption>();
  for (const entry of course.entries) {
    const actualType = entry.type.trim();
    const type = ACADEMIC_TYPES.has(actualType) ? actualType : "מפגש";
    const componentGroup = entry.componentGroup || entry.registrationGroup || "לא ידוע";
    const id = course.id + ":component:" + encodeURIComponent(type) + ":" + encodeURIComponent(actualType) + ":" + encodeURIComponent(componentGroup);
    let choice = choices.get(id);
    if (!choice) {
      choice = { id,courseId:course.id,type,componentGroup,label:actualType,meetings:[],warnings:[],registrationGroups:[] };
      choices.set(id,choice);
    }
    if (!choice.registrationGroups.includes(entry.registrationGroup)) choice.registrationGroups.push(entry.registrationGroup);
    if (!entry.meeting) {
      const warning = "נתוני זמן חסרים: " + actualType + " " + entry.dayLabel + " " + entry.timeLabel;
      if (!choice.warnings.includes(warning)) choice.warnings.push(warning);
      continue;
    }
    const m = entry.meeting;
    if (!choice.meetings.some(n=>n.day===m.day&&n.startMinutes===m.startMinutes&&n.endMinutes===m.endMinutes&&n.lecturer===m.lecturer&&n.room===m.room)) {
      choice.meetings.push({...m,id:choice.id+":"+choice.meetings.length,registrationGroup:""});
    }
  }
  for (const choice of choices.values()) {
    if (choice.meetings.some((m,i)=>choice.meetings.slice(i+1).some(n=>overlaps(m,n)))) {
      choice.warnings.push("חפיפה פנימית בין מפגשי האפשרות");
    }
  }
  return [...choices.values()];
}
export function groupComponents(choices:ComponentOption[]):Map<string,ComponentOption[]> {
  const types = new Map<string,ComponentOption[]>();
  for (const choice of choices) {
    const list = types.get(choice.type) || [];
    list.push(choice);
    types.set(choice.type,list);
  }
  return types;
}
export function componentSelection(choice:ComponentOption):ComponentSelection {
  return {id:choice.id,type:choice.type,componentGroup:choice.componentGroup,label:choice.label};
}
export function combineComponents(courseId:string,choices:ComponentOption[]):CourseOption {
  return {id:courseId+":free:"+choices.map(c=>c.id).sort().join("+"),courseId,registrationGroup:"",mode:"free",components:choices.map(componentSelection),meetings:choices.flatMap(c=>c.meetings),warnings:choices.flatMap(c=>c.warnings)};
}
export function describeOption(option:CourseOption):string {
  return option.mode==="free" ? (option.components||[]).map(c=>c.label+" "+c.componentGroup).join(" + ") : "קבוצה "+option.registrationGroup;
}
export function sanitizeSelection(input:unknown,courseIds:string[]):ScheduleSelection {
  const r=input&&typeof input==="object"?input as Record<string,unknown>:{};
  const allowedComponents:Record<string,Record<string,string[]>>={};
  if(r.allowedComponents&&typeof r.allowedComponents==="object"){
    for(const [courseId,types] of Object.entries(r.allowedComponents)){
      if(!courseIds.includes(courseId)||!types||typeof types!=="object"||Array.isArray(types))continue;
      allowedComponents[courseId]={};
      for(const [type,ids] of Object.entries(types)){
        if(Array.isArray(ids)&&ids.every(id=>typeof id==="string"))allowedComponents[courseId][type]=ids.slice(0,500);
      }
    }
  }
  return {respectRegistrationGroups:r.respectRegistrationGroups!==false,allowedComponents};
}

export function getManualOption(course:Course,group:string|undefined,selected:Record<string,string>={},respectRegistrationGroups=true):CourseOption|undefined {
  const registered=course.options.find(o=>o.registrationGroup===group)||course.options.find(o=>!o.warnings.length)||course.options[0];
  if(respectRegistrationGroups)return registered;
  const choices=getComponentOptions(course),types=groupComponents(choices);
  if(!types.size)return undefined;
  const picks=[...types].map(([type,options])=>
    options.find(o=>o.id===selected[type])||
    options.find(o=>!o.warnings.length&&registered?.meetings.some(m=>m.type.trim()===o.label&&m.componentGroup===o.componentGroup))||
    options.find(o=>!o.warnings.length)||options[0]
  );
  return combineComponents(course.id,picks);
}
