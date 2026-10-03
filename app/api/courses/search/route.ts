import { searchCourses } from "@/lib/data";
export function GET(request:Request){const url=new URL(request.url),q=url.searchParams.get("q")||"",faculty=url.searchParams.get("faculty")||"";const courses=searchCourses(q.slice(0,100),faculty);return Response.json({courses:courses.slice(0,100),total:courses.length});}
