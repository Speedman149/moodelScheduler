import Link from "next/link";
export default function NotFound(){return <div className="empty-state panel"><h1>הקורס אינו זמין בסמסטר הזה</h1><p>ייתכן שזהו קורס קדם שאינו מוצע כרגע, או שמספר הקורס שגוי.</p><Link href="/" className="button primary">חזרה לחיפוש</Link></div>;}
