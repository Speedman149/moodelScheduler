import { getData } from "@/lib/data";
import SearchClient from "@/components/SearchClient";
export default function Home(){const {summaries}=getData();return <SearchClient courses={summaries} faculties={Array.from(new Set(summaries.map(c=>c.faculty))).sort((a,b)=>a.localeCompare(b,"he"))}/>;}
