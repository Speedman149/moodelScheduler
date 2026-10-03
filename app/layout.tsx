import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Technion Smart Planner | הסמסטר שלך, בדרך שלך", description: "חיפוש קורסים, חקר קדמים ותכנון מערכת שעות חכמה לסטודנטים בטכניון" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="he" dir="rtl"><body>{children}</body></html>; }
