"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="empty-state panel"><h1>משהו השתבש בטעינת הדף</h1><p>אפשר לנסות שוב בעוד רגע.</p><button className="button primary" onClick={reset}>ניסיון נוסף</button></section>;}
