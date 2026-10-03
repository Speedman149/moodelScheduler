"use client";
import { Check,Plus } from "lucide-react";
import { toggleCourse,usePlanner } from "@/lib/store";
export default function AddCourseButton({id,compact=false}:{id:string;compact?:boolean}){const s=usePlanner(),added=s.selected.includes(id),full=!added&&s.selected.length>=10;return <button className={compact?"add-button "+(added?"added":""):"button "+(added?"secondary":"primary")} onClick={()=>toggleCourse(id)} disabled={full} aria-label={added?"הסרת קורס "+id:"הוספת קורס "+id} title={full?"אפשר לבחור עד 10 קורסים":added?"הסרה מהמערכת":"הוספה למערכת"}>{added?<Check size={17}/>:<Plus size={17}/>}<span>{compact?(added?"נוסף":"הוספה"):(added?"נוסף למערכת":"הוספה למערכת")}</span></button>;}
