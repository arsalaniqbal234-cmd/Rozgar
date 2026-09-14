"use client";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import ThemeToggle from "./theme-toggle";

export default function Navigation() {
  return <nav aria-label="Main navigation" className="site-nav border-b">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
      <Link href="/" className="flex items-center gap-3 text-xl font-bold">
        <span className="rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 px-3 py-1 text-white">R</span> Rozgar
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/saved-searches" className="hover:text-cyan-300">Saved searches</Link>
        <ThemeToggle />
        <Show when="signed-out"><SignInButton mode="modal"><button className="button">Sign in</button></SignInButton></Show>
        <Show when="signed-in"><UserButton /></Show>
      </div>
    </div>
  </nav>;
}
