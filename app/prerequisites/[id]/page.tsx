import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/data";
import PrerequisiteGraph from "@/components/PrerequisiteGraph";
export default async function PrerequisitesPage({params}:{params:Promise<{id:string}>}){const {id}=await params,c=getCourse(id);if(!c)notFound();return <><Link href={"/course/"+c.id} className="back-link">← חזרה לפרטי הקורס</Link><div className="page-heading"><div><span className="overline">מחברים את הדרך לתואר</span><h1>מפת הקדמים</h1><p>{c.name} · <bdi>{c.id}</bdi></p></div></div><div className="notice">״וגם״ מחייב את כל התנאים. ״או״ מציג חלופות. לחצו על שם קורס לפרטים, או הרחיבו את הקדמים שלו. המפה מציגה עד שישה שלבים בכל דף.</div><section className="panel graph-panel"><PrerequisiteGraph id={c.id}/></section></>;}
