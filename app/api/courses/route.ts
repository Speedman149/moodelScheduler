import { getCourse } from "@/lib/data";
import { normalizeCourseNumber } from "@/lib/normalize";
export function GET(request:Request){const ids=(new URL(request.url).searchParams.get("ids")||"").split(",").slice(0,10).map(normalizeCourseNumber).filter(Boolean);return Response.json({courses:ids.map(getCourse).filter(Boolean)});}
