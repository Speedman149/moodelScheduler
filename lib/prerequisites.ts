import { normalizeCourseNumber } from "./normalize";
import type { ParsedPrerequisites,PrerequisiteNode } from "@/types/course";
type Token={kind:"course"|"and"|"or"|"("|")";value:string};
export function parsePrerequisites(raw:string):ParsedPrerequisites {
 if(!raw.trim())return {ast:null,error:null,raw};
 try {
 const tokens:Token[]=[];let rest=raw.trim();
 while(rest){if(tokens.length>1000)throw Error("ביטוי ארוך מדי");const ws=rest.match(/^\s+/);if(ws){rest=rest.slice(ws[0].length);continue;}
 const m=rest.match(/^(\d{6,8})\b/);if(m){tokens.push({kind:"course",value:normalizeCourseNumber(m[1])});rest=rest.slice(m[0].length);continue;}
 if(rest[0]==="("||rest[0]===")"){tokens.push({kind:rest[0] as "("|")",value:rest[0]});rest=rest.slice(1);continue;}
 const or=rest.match(/^(או|OR\b|\|\|?|\/)/i);if(or){tokens.push({kind:"or",value:or[0]});rest=rest.slice(or[0].length);continue;}
 const and=rest.match(/^(וגם|ו\s*[-־]?|AND\b|&&?|[,;])/i);if(and){tokens.push({kind:"and",value:and[0]});rest=rest.slice(and[0].length);continue;}
 throw Error("הביטוי מכיל תנאי שלא ניתן לפרש");
 }
 let i=0,depth=0;
 function primary():PrerequisiteNode {if(++depth>60)throw Error("ביטוי עמוק מדי");const t=tokens[i++];let n:PrerequisiteNode;if(t?.kind==="course")n={kind:"course",id:t.value};else if(t?.kind==="("){n=orExpr();if(tokens[i++]?.kind!==")")throw Error("סוגריים לא מאוזנים");}else throw Error("חסר קורס או תנאי");depth--;return n;}
 function andExpr():PrerequisiteNode {const children=[primary()];while(tokens[i]?.kind==="and"||tokens[i]?.kind==="course"||tokens[i]?.kind==="("){if(tokens[i]?.kind==="and")i++;children.push(primary());}return children.length===1?children[0]:{kind:"and",children};}
 function orExpr():PrerequisiteNode {const children=[andExpr()];while(tokens[i]?.kind==="or"){i++;children.push(andExpr());}return children.length===1?children[0]:{kind:"or",children};}
 const ast=orExpr();if(i!==tokens.length)throw Error("תנאי לא שלם או סוגריים לא מאוזנים");return {ast,error:null,raw};
 }catch(e){return {ast:null,error:e instanceof Error?e.message:"לא ניתן לפרש את הקדמים",raw};}
}
export function prerequisiteIds(node:PrerequisiteNode|null):string[]{if(!node)return [];return node.kind==="course"?[node.id]:Array.from(new Set(node.children.flatMap(prerequisiteIds)));}
