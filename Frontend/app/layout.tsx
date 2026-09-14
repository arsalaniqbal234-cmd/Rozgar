import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navigation from "./components/navigation";
import "./globals.css";

export const metadata: Metadata = { title: "Rozgar — Find your next role", description: "Search jobs and save alerts for new matching opportunities." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><html lang="en"><body>
    <Navigation />{children}
    <footer className="mx-auto mt-12 max-w-7xl border-t border-slate-800 px-5 py-8 text-sm text-slate-500">Rozgar · Opportunities from multiple job boards</footer>
  </body></html></ClerkProvider>;
}
