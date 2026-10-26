import { test,expect } from "@playwright/test";
import { normalizeCourse } from "../lib/normalize";

const course=normalizeCourse({general:{"מספר מקצוע":"02340124","שם מקצוע":"קורס לבדיקת אפשרויות"},schedule:[
  {"קבוצה":11,"מס.":90,"סוג":"הרצאה","יום":"ראשון","שעה":"טרם פורסם"},
  {"קבוצה":11,"מס.":91,"סוג":"תרגול","יום":"שני","שעה":"טרם פורסם"},
  {"קבוצה":11,"מס.":92,"סוג":"מעבדה","יום":"שלישי","שעה":"טרם פורסם"},
  {"קבוצה":12,"מס.":17,"סוג":"הרצאה","יום":"ראשון","שעה":"08:30 - 10:30"},
  {"קבוצה":12,"מס.":37,"סוג":"תרגול","יום":"שני","שעה":"08:30 - 09:30"},
  {"קבוצה":12,"מס.":57,"סוג":"מעבדה","יום":"שלישי","שעה":"08:30 - 10:30"},
  {"קבוצה":13,"מס.":42,"סוג":"הרצאה","יום":"ראשון","שעה":"10:30 - 12:30"},
  {"קבוצה":13,"מס.":62,"סוג":"תרגול","יום":"שני","שעה":"10:30 - 11:30"},
  {"קבוצה":13,"מס.":82,"סוג":"מעבדה","יום":"שלישי","שעה":"10:30 - 12:30"},
]})!;

test("bulk actions skip incomplete first options and keep a valid choice for lectures, tutorials and labs",async({page})=>{
 await page.goto("/");
 await page.getByRole("textbox",{name:"חיפוש קורס לפי שם או מספר"}).fill("234124");
 await page.getByRole("button",{name:"הוספת קורס 02340124"}).click();
 await page.route("**/api/courses?ids=**",route=>route.fulfill({json:{courses:[course]}}));
 await page.goto("/planner");
 const automatic=page.locator("details.allowed-groups");
 await automatic.locator("summary").click();
 const firstOnly=automatic.getByRole("button",{name:"השארת הראשונה בלבד — "+course.name,exact:true});
 const all=automatic.getByRole("button",{name:"בחירת הכול — "+course.name,exact:true});
 await all.click();await expect(automatic.locator('input:disabled')).toHaveCount(3);await expect(automatic.locator('input:disabled:checked')).toHaveCount(0);await expect(automatic.locator('input:checked')).toHaveCount(6);
 await firstOnly.click();await expect(automatic.locator('input:checked')).toHaveCount(3);
 for(const section of await automatic.locator(".component-allowlist").all())await expect(section.locator('input:enabled').first()).toBeChecked();
 await page.getByRole("checkbox",{name:"לשמור על קבוצות הרישום"}).check();
 if(!await automatic.evaluate(el=>(el as HTMLDetailsElement).open))await automatic.locator("summary").click();
 await all.click();await expect(automatic.locator('input:disabled:checked')).toHaveCount(0);await expect(automatic.locator('input:checked')).toHaveCount(2);
 await firstOnly.click();await expect(automatic.getByRole("checkbox",{name:"קבוצה 12",exact:true})).toBeChecked();await expect(automatic.locator('input:checked')).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
