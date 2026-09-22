"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowUpRight, Bookmark } from "lucide-react";
import ThemeToggle from "./theme-toggle";

export default function Navigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="site-nav">
    <div className="nav-inner">
      <Link href="/" className="brand" aria-label="Rozgar home"><span className="brand-mark" aria-hidden><ArrowUpRight size={25} strokeWidth={2.5} /></span>rozgar<span className="brand-dot">.</span></Link>
      <div className="nav-links">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Find a job</Link>
        <Link href="/shortlist" aria-current={pathname === "/shortlist" ? "page" : undefined}><Bookmark size={15} aria-hidden />Shortlist</Link>
        <Link href="/saved-searches" aria-current={pathname === "/saved-searches" ? "page" : undefined}>Saved searches</Link>
        <Link href="/followed-companies" aria-current={pathname === "/followed-companies" ? "page" : undefined}>Following</Link>
      </div>
      <div className="nav-actions"><ThemeToggle />
        <Show when="signed-out"><SignInButton mode="modal"><button className="button nav-signin">Sign in <ArrowUpRight size={15} aria-hidden /></button></SignInButton></Show>
        <Show when="signed-in"><UserButton /></Show>
      </div>
    </div>
  </nav>;
}
