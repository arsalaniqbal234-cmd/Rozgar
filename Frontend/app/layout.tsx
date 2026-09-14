import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navigation from "./components/navigation";
import "./globals.css";

export const metadata: Metadata = { title: "Rozgar — Find your next role", description: "Search jobs and save alerts for new matching opportunities." };

const themeScript = `(function(){try{var t=localStorage.getItem('rozgar-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <Navigation />{children}
    <footer className="site-footer mx-auto mt-12 max-w-7xl border-t px-5 py-8 text-sm">Rozgar · Opportunities from multiple job boards</footer>
  </body></html></ClerkProvider>;
}
