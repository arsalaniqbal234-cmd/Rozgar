import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ClerkProvider } from "@clerk/nextjs";
import Navigation from "./components/navigation";
import ShortlistProvider from "./components/shortlist-provider";
import "./globals.css";

export const metadata: Metadata = { title: "Rozgar — Find your next role", description: "Search jobs, save searches, and shortlist opportunities." };

const themeScript = `(function(){try{var t=localStorage.getItem('rozgar-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <ShortlistProvider><Navigation />{children}</ShortlistProvider>
    <footer className="site-footer"><div className="footer-inner"><div><Link href="/" className="brand">rozgar<span className="brand-dot">.</span></Link><p>Good work. Better possibilities.</p></div><div className="footer-links"><Link href="/">Explore jobs</Link><Link href="/shortlist">Your shortlist</Link><Link href="/saved-searches">Saved searches <ArrowUpRight size={14} aria-hidden /></Link></div></div><div className="footer-bottom">Rozgar · Opportunities from multiple job boards<span>Made for your next chapter.</span></div></footer>
  </body></html></ClerkProvider>;
}
