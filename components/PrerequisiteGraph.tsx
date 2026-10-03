import Link from "next/link";
import { getCourse } from "@/lib/data";
import { parsePrerequisites } from "@/lib/prerequisites";
import type { PrerequisiteNode } from "@/types/course";
export default function PrerequisiteGraph({id}:{id:string}){
 let budget=100;
 function courseNode(courseId:string,path:Set<string>,depth:number):React.ReactNode {
  const course=getCourse(courseId),cycle=path.has(courseId);
  if(--budget<0)return <p className="muted">המשך החקירה זמין בדף הקורס.</p>;
  const next=new Set(path);next.add(courseId);const parsed=parsePrerequisites(course?.prerequisites||"");
  return <div className="graph-course"><Link href={"/course/"+courseId} className="graph-node"><bdi>{courseId}</bdi><strong>{course?.name||"קורס שאינו מופיע בסמסטר הנוכחי"}</strong></Link>{cycle?<span className="graph-note">קשר מחזורי — כאן נעצרת החקירה</span>:depth>=6?<Link className="text-link" href={"/prerequisites/"+courseId}>להמשך מפת הקדמים</Link>:parsed.ast?<details open={depth<2}><summary>קדמים לקורס</summary>{expression(parsed.ast,next,depth+1)}</details>:parsed.error?<div className="notice warning">{parsed.error}<p>{parsed.raw}</p></div>:<span className="graph-note">{course?"לא צוינו קדמים בנתונים":"המידע על קדמי קורס זה אינו זמין"}</span>}</div>;
 }
 function expression(node:PrerequisiteNode,path:Set<string>,depth:number):React.ReactNode {
  if(node.kind==="course")return courseNode(node.id,path,depth);
  return <div className={"graph-operator "+node.kind}><span className="operator-label">{node.kind==="and"?"וגם · כל התנאים":"או · אחת האפשרויות"}</span><div className="graph-branches">{node.children.map((child,i)=><div className="graph-branch" key={i}>{expression(child,path,depth)}</div>)}</div></div>;
 }
 return <div className="prerequisite-graph">{courseNode(id,new Set(),0)}</div>;
}
