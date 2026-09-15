"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(notify: () => void) {
  window.addEventListener("rozgar-theme-change", notify);
  return () => window.removeEventListener("rozgar-theme-change", notify);
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark");

  function toggleTheme() {
    const selected = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = selected;
    try { window.localStorage.setItem("rozgar-theme", selected); } catch { /* The theme still works when storage is unavailable. */ }
    window.dispatchEvent(new Event("rozgar-theme-change"));
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button type="button" className="theme-toggle" onClick={toggleTheme}
    aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}>
    {theme === "dark" ? <Sun aria-hidden size={18} /> : <Moon aria-hidden size={18} />}
  </button>;
}
