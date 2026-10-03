import { describe,it,expect } from "vitest";
import { getData,getCourse,searchCourses } from "@/lib/data";
import { parsePrerequisites } from "@/lib/prerequisites";
import { DEFAULT_PREFERENCES,generateSchedules,getConflicts } from "@/lib/schedule";
describe("real Technion data",()=>{
 it("loads the actual semester and resolves old course numbers",()=>{expect(getData().courses.length).toBeGreaterThan(1000);expect(getCourse("234124")?.name).toBe("מבוא לתכנות מערכות");expect(searchCourses("234124")[0]?.id).toBe("02340124");expect(searchCourses("מבני נתונים").length).toBeGreaterThan(0);});
 it("preserves all four meetings of the real calculus registration group",()=>{const c=getCourse("104031")!;expect(c.options.find(o=>o.registrationGroup==="22")?.meetings).toHaveLength(4);});
 it("parses the actual data structures OR of AND clauses",()=>{const p=parsePrerequisites(getCourse("234218")!.prerequisites);expect(p.error).toBeNull();expect(p.ast?.kind).toBe("or");});
 it("generates legal schedules for real courses without mixing registration groups",()=>{const courses=["234124","234218","234247"].map(id=>getCourse(id)!);const r=generateSchedules(courses,DEFAULT_PREFERENCES);expect(r.schedules.length).toBeGreaterThan(0);for(const s of r.schedules){expect(s.options).toHaveLength(3);expect(getConflicts(s.meetings)).toHaveLength(0);for(const o of s.options)expect(courses.find(c=>c.id===o.courseId)?.options).toContainEqual(o);}});
});
