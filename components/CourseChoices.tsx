"use client";
import type { Course,CourseOption } from "@/types/course";
import { DAYS,formatTime } from "@/lib/normalize";
import { getComponentOptions,groupComponents } from "@/lib/components";
import { updatePlanner,usePlanner } from "@/lib/store";

export default function CourseChoices({course,option}:{course:Course;option:CourseOption|undefined}) {
  const s=usePlanner();
  function allowGroup(group:string,checked:boolean) {
    const existing=s.allowed[course.id]||course.options.filter(o=>!o.warnings.length).map(o=>o.registrationGroup);
    updatePlanner({allowed:{...s.allowed,[course.id]:checked?[...new Set([...existing,group])]:existing.filter(g=>g!==group)},results:null});
  }
  function allowComponent(type:string,id:string,checked:boolean,defaults:string[]) {
    const byType=s.allowedComponents[course.id]||{};
    const existing=byType[type]||defaults;
    updatePlanner({allowedComponents:{...s.allowedComponents,[course.id]:{...byType,[type]:checked?[...new Set([...existing,id])]:existing.filter(x=>x!==id)}},results:null});
  }
  const types=groupComponents(getComponentOptions(course));
  if(!course.options.length) return <div className="notice warning">טרם פורסמו מפגשים. ניתן לשמור את הקורס, אך לא לייצר עבורו מערכת אוטומטית.</div>;
  return <>
    {s.respectRegistrationGroups ? <label className="group-select">קבוצת רישום למערכת הידנית
      <select aria-label={"קבוצת רישום "+course.name} value={option?.registrationGroup||""} onChange={e=>updatePlanner({manual:{...s.manual,[course.id]:e.target.value}})}>
        {course.options.map(o=><option key={o.id} value={o.registrationGroup}>קבוצה {o.registrationGroup} · {o.meetings.length} מפגשים{o.warnings.length?" · נתונים חסרים / חפיפה":""}</option>)}
      </select>
    </label> : [...types].map(([type,choices])=><label className="group-select" key={type}>{type} למערכת הידנית
      <select aria-label={type+" "+course.name} value={option?.components?.find(c=>c.type===type)?.id||""} onChange={e=>updatePlanner({manualComponents:{...s.manualComponents,[course.id]:{...s.manualComponents[course.id],[type]:e.target.value}}})}>
        {choices.map(choice=><option key={choice.id} value={choice.id}>{choice.label} {choice.componentGroup} · {choice.meetings.length} מפגשים{choice.warnings.length?" · נתונים חסרים / חפיפה":""}</option>)}
      </select>
    </label>)}
    <div className="option-meetings">{option?.meetings.map(m=><div key={m.id}><span>{m.type} · {DAYS[m.day]}</span><bdi>{formatTime(m.startMinutes)}–{formatTime(m.endMinutes)}</bdi><small>{m.lecturer||"מרצה טרם פורסם"}</small></div>)}</div>
    {option?.warnings.map((warning,i)=><div className="notice warning" key={i}>{warning}</div>)}
    {s.respectRegistrationGroups ? <details className="allowed-groups"><summary>קבוצות מותרות ליצירה אוטומטית</summary>
      <p className="muted">הבחירה הידנית אינה מגבילה את המנוע. סמנו כאן את הקבוצות המתאימות לכם.</p>
      <div>{course.options.map(o=><label className="check-label" key={o.id}><input type="checkbox" disabled={!!o.warnings.length} checked={!o.warnings.length&&(s.allowed[course.id]||course.options.map(o=>o.registrationGroup)).includes(o.registrationGroup)} onChange={e=>allowGroup(o.registrationGroup,e.target.checked)}/> קבוצה {o.registrationGroup}{o.warnings.length?" — לא זמינה ליצירה":""}</label>)}</div>
    </details> : <details className="allowed-groups"><summary>אפשרויות מותרות ליצירה אוטומטית</summary>
      <p className="muted">המנוע משלב אפשרות אחת מכל סוג. אפשר להגביל כאן הרצאות, תרגולים ומעבדות בנפרד.</p>
      {[...types].map(([type,choices])=><div className="component-allowlist" key={type}><strong>{type}</strong>
        <div>{choices.map(choice=><label className="check-label" key={choice.id}><input type="checkbox" disabled={!!choice.warnings.length} checked={!choice.warnings.length&&(s.allowedComponents[course.id]?.[type]||choices.map(c=>c.id)).includes(choice.id)} onChange={e=>allowComponent(type,choice.id,e.target.checked,choices.filter(c=>!c.warnings.length).map(c=>c.id))}/> {choice.label} {choice.componentGroup}{choice.warnings.length?" — לא זמינה ליצירה":""}</label>)}</div>
      </div>)}
    </details>}
  </>;
}
