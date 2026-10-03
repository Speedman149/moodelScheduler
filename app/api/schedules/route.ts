import { getCourse } from "@/lib/data";
import { normalizeCourseNumber,record } from "@/lib/normalize";
import { generateSchedules,sanitizePreferences } from "@/lib/schedule";
import type { Course } from "@/types/course";
export const maxDuration=30;
export async function POST(request:Request){
 try {
 if(Number(request.headers.get("content-length"))>50000)return Response.json({error:"הבקשה גדולה מדי"},{status:413});
 const raw=await request.text();if(raw.length>50000)return Response.json({error:"הבקשה גדולה מדי"},{status:413});
 const body=record(JSON.parse(raw));if(!Array.isArray(body.ids)||body.ids.length<1||body.ids.length>10||!body.ids.every(x=>typeof x==="string"))return Response.json({error:"יש לבחור בין קורס אחד לעשרה קורסים"},{status:400});
 const ids=Array.from(new Set(body.ids.map(x=>normalizeCourseNumber(x as string)))),courses=ids.map(getCourse).filter((c):c is Course=>!!c);if(courses.length!==ids.length)return Response.json({error:"אחד הקורסים אינו מופיע בסמסטר הנוכחי"},{status:400});
 const allowed=Object.fromEntries(Object.entries(record(body.allowed)).filter(([id,groups])=>ids.includes(id)&&Array.isArray(groups)&&groups.every(g=>typeof g==="string"))) as Record<string,string[]>;
 return Response.json(generateSchedules(courses,sanitizePreferences(body.preferences),allowed));
 }catch(error){console.error("Schedule request failed",error instanceof Error?error.message:"Unknown error");return Response.json({error:"לא ניתן לעבד את הבקשה. נסו שוב."},{status:400});}
}
