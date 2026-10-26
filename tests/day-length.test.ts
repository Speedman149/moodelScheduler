import { describe,it,expect } from "vitest";
import { normalizeCourse } from "@/lib/normalize";
import { DEFAULT_PREFERENCES,generateSchedules,metrics,sanitizePreferences,scoreSchedule } from "@/lib/schedule";
import type { CourseOption,Meeting } from "@/types/course";

const meeting=(id:string,day:number,startMinutes:number,endMinutes:number):Meeting=>({id,day,startMinutes,endMinutes,courseId:"a",courseName:"test",registrationGroup:"11",componentGroup:"10",type:"הרצאה",lecturer:"",room:""});
const option=(meetings:Meeting[]):CourseOption=>({id:"a:11",courseId:"a",registrationGroup:"11",meetings,warnings:[]});
function alternatives(){
  const fixed=normalizeCourse({general:{"מספר מקצוע":"02340124","שם מקצוע":"קורס קבוע"},schedule:[{"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"ראשון","שעה":"08:00 - 13:00"}]})!;
  const movable=normalizeCourse({general:{"מספר מקצוע":"02340218","שם מקצוע":"קורס לבחירה"},schedule:[
    {"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"ראשון","שעה":"13:00 - 17:00"},
    {"קבוצה":11,"מס.":10,"סוג":"הרצאה","יום":"שני","שעה":"08:00 - 09:00"},
    {"קבוצה":21,"מס.":20,"סוג":"הרצאה","יום":"שני","שעה":"08:00 - 13:00"},
  ]})!;
  return [fixed,movable];
}

describe("shorter and balanced days",()=>{
  it.each([true,false])("ranks 5h + 5h above 9h + 1h in registration mode %s",respectRegistrationGroups=>{
    const result=generateSchedules(alternatives(),DEFAULT_PREFERENCES,{},200000,{respectRegistrationGroups,allowedComponents:{}});
    expect(result.validCount).toBe(2);
    expect(result.schedules[0].metrics.dailySpanMinutes).toEqual([300,300,0,0,0,0,0]);
    expect(result.schedules[1].metrics.dailySpanMinutes).toEqual([540,60,0,0,0,0,0]);
    expect(result.schedules[0].score).toBeGreaterThan(result.schedules[1].score);
    expect(result.schedules[0].meetings.reduce((n,m)=>n+m.endMinutes-m.startMinutes,0)).toBe(600);
    expect(result.schedules[1].meetings.reduce((n,m)=>n+m.endMinutes-m.startMinutes,0)).toBe(600);
  });
  it("lets zero disable the preference and higher importance strengthen its influence",()=>{
    const results=(weight:number)=>generateSchedules(alternatives(),{...DEFAULT_PREFERENCES,shortDays:{weight,hard:false}}).schedules;
    const off=results(0);expect(off[0].score).toBe(off[1].score);
    const low=results(1),high=results(5);
    expect(high[0].score-high[1].score).toBeGreaterThan(low[0].score-low[1].score);
  });
  it("includes within-day gaps and weekend meetings without mixing times from different days",()=>{
    const m=metrics([meeting("a",0,480,540),meeting("b",0,900,960),meeting("c",1,1140,1200),meeting("d",5,600,720)],DEFAULT_PREFERENCES);
    expect(m.dailySpanMinutes).toEqual([480,60,0,0,0,120,0]);
    expect(m.longestDayMinutes).toBe(480);expect(m.totalGapMinutes).toBe(360);
    expect(metrics([meeting("a",0,480,540),meeting("b",1,1140,1200)],DEFAULT_PREFERENCES).longestDayMinutes).toBe(60);
    expect(metrics([],DEFAULT_PREFERENCES).longestDayMinutes).toBe(0);
  });
  it("counts a long gap as a long day even when gap preference is off",()=>{
    const p={...DEFAULT_PREFERENCES,gaps:{weight:0,hard:false},campusDays:{weight:0,hard:false}};
    const compact=scoreSchedule([option([meeting("a",0,480,540),meeting("b",0,540,600)])],p)!;
    const spread=scoreSchedule([option([meeting("a",0,480,540),meeting("b",0,960,1020)])],p)!;
    expect(compact.score).toBeGreaterThan(spread.score);
  });
  it("does not treat free days as days that must be filled",()=>{
    const p={...DEFAULT_PREFERENCES,gaps:{weight:0,hard:false},campusDays:{weight:0,hard:false}};
    const sunday=scoreSchedule([option([meeting("a",0,480,840)])],p)!;
    const friday=scoreSchedule([option([meeting("a",5,480,840)])],p)!;
    expect(sunday.score).toBe(friday.score);expect(sunday.metrics.freeDays).toHaveLength(4);
  });
  it("preserves hard constraints when short-day preference is strongest",()=>{
    const p={...DEFAULT_PREFERENCES,shortDays:{weight:5,hard:false},freeDay:1,freeDayRule:{weight:0,hard:true}};
    expect(generateSchedules(alternatives(),p).schedules).toHaveLength(0);
  });
  it("migrates saved preferences and sanitizes incoming importance without adding a hard constraint",()=>{
    const old={gaps:{weight:5,hard:false},preferLecturer:"מרצה"};
    expect(sanitizePreferences(old).shortDays).toEqual({weight:3,hard:false});
    expect(sanitizePreferences(old).gaps.weight).toBe(5);expect(sanitizePreferences(old).preferLecturer).toBe("מרצה");
    expect(sanitizePreferences({shortDays:{weight:999,hard:true}}).shortDays).toEqual({weight:5,hard:false});
    expect(sanitizePreferences({shortDays:{weight:-5}}).shortDays.weight).toBe(0);
    expect(sanitizePreferences({shortDays:{weight:NaN}}).shortDays.weight).toBe(3);
  });
});
