import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Shell from "@/components/Shell";
import "./globals.css";
export const metadata: Metadata={title:{default:"Technion Smart Planner | הסמסטר שלך, בדרך שלך",template:"%s | Smart Planner"},description:"חיפוש קורסים, חקר קדמים ותכנון מערכת שעות חכמה לסטודנטים בטכניון"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="he" dir="rtl" suppressHydrationWarning><body><Shell>{children}</Shell><Analytics /></body></html>;}
