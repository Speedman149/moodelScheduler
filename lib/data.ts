import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeCourse,normalizeCourseNumber } from "./normalize";
import type { Course,CourseSummary } from "@/types/course";
let cached: {courses:Course[];byId:Map<string,Course>;summaries:CourseSummary[]}|undefined;
export function getData(){
 if(!cached){const raw:unknown=JSON.parse(readFileSync(path.join(process.cwd(),"data/courses_2026_200.json"),"utf8"));
 if(!Array.isArray(raw))throw Error("קובץ נתוני הקורסים אינו תקין");
 const courses=raw.map(normalizeCourse).filter((c):c is Course=>c!==null);
 cached={courses,byId:new Map(courses.map(c=>[c.id,c])),summaries:courses.map(c=>({id:c.id,name:c.name,credits:c.credits,faculty:c.faculty,optionCount:c.options.filter(o=>!o.warnings.length).length}))};}
 return cached;
}
export function getCourse(id:string){return getData().byId.get(normalizeCourseNumber(id));}
export function searchCourses(query:string,faculty=""):CourseSummary[] {
 const q=query.trim().toLocaleLowerCase("he"),numeric=/^\d+$/.test(q),canonical=numeric&&q.length>=6?normalizeCourseNumber(q):"";
 return getData().summaries.filter(c=>(!faculty||c.faculty===faculty)&&(!q||(numeric?(c.id.includes(q)||c.id.replace(/^0/,"").replace(/0(?=\d{3}$)/,"").includes(q)||c.id===canonical):c.name.toLocaleLowerCase("he").includes(q))));
}
export const SEMESTER={id:"2026_200",label:'חורף תשפ״ז · 2026–2027',start:"2026-10-28",end:"2027-03-23",source:"https://raw.githubusercontent.com/michael-maltsev/technion-sap-info-fetcher/gh-pages/courses_2026_200.json"};
