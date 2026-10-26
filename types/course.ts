export interface ScheduleEntry { registrationGroup:string; componentGroup:string; type:string; dayLabel:string; timeLabel:string; lecturer:string; room:string; meeting:Meeting|null; }
export interface Meeting { id:string; courseId:string; courseName:string; registrationGroup:string; componentGroup:string; type:string; day:number; startMinutes:number; endMinutes:number; lecturer:string; room:string; }
export interface ComponentSelection { id:string; type:string; componentGroup:string; label:string; }
export interface ComponentOption extends ComponentSelection { courseId:string; meetings:Meeting[]; warnings:string[]; registrationGroups:string[]; }
export interface ScheduleSelection { respectRegistrationGroups:boolean; allowedComponents:Record<string,Record<string,string[]>>; }
export interface CourseOption { mode?:"registered"|"free"; components?:ComponentSelection[]; id:string; courseId:string; registrationGroup:string; meetings:Meeting[]; warnings:string[]; }
export interface Course { id:string; name:string; credits:number|null; faculty:string; lecturers:string[]; prerequisites:string; syllabus:string; notes:string; exams:string[]; general:Record<string,string>; entries:ScheduleEntry[]; options:CourseOption[]; }
export interface CourseSummary { id:string; name:string; credits:number|null; faculty:string; optionCount:number; }
export type PrerequisiteNode = {kind:"course";id:string}|{kind:"and"|"or";children:PrerequisiteNode[]};
export interface ParsedPrerequisites { ast:PrerequisiteNode|null; error:string|null; raw:string; }
export interface Preference { weight:number; hard:boolean; }
export interface UserPreferences { freeDay:number; freeDayRule:Preference; startMinutes:number; startRule:Preference; finishMinutes:number; finishRule:Preference; gaps:Preference; campusDays:Preference; shortDays:Preference; atLeastOneFreeDay:boolean; maxGapMinutes:number|null; preferLecturer:string; avoidLecturer:string; lecturerRule:Preference; }
export interface ScheduleMetrics { campusDays:number; freeDays:number[]; earliestStart:number; latestFinish:number; dailySpanMinutes:number[]; longestDayMinutes:number; totalGapMinutes:number; maxGapMinutes:number; morningMinutes:number; lateMinutes:number; }
export interface GeneratedSchedule { id:string; options:CourseOption[]; meetings:Meeting[]; score:number; metrics:ScheduleMetrics; violations:string[]; }
export interface GenerationResult { schedules:GeneratedSchedule[]; examined:number; validCount:number; truncated:boolean; errors:string[]; }
