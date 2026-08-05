"use client";

import { useEffect, useState } from "react";

type Job = {
  id: number;
  source_id: string;
  title: string;
  company: string;
  salary: number;
  url: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  }, []);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const avatarStyles = [
    "bg-indigo-50 text-indigo-600",
    "bg-violet-50 text-violet-600",
    "bg-fuchsia-50 text-fuchsia-600",
    "bg-cyan-50 text-cyan-600",
    "bg-rose-50 text-rose-600",
    "bg-amber-50 text-amber-600",
    "bg-teal-50 text-teal-600",
    "bg-orange-50 text-orange-600",
  ];

  const handleJobClick = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-base">R</span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Rozgar
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a className="hover:text-indigo-600 transition-colors cursor-pointer">
              Browse Jobs
            </a>
            <a className="hover:text-indigo-600 transition-colors cursor-pointer">
              Companies
            </a>
            <a className="hover:text-indigo-600 transition-colors cursor-pointer">
              About
            </a>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {jobs.length} live
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-slate-50 border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-indigo-300/30 to-violet-300/30 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-indigo-100 shadow-sm text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-7">
            🚀 Updated automatically, straight from RemoteOK
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Find your next
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              remote opportunity
            </span>
          </h1>
          <p className="text-slate-500 mt-5 text-lg max-w-xl mx-auto font-medium">
            {jobs.length}+ live roles from companies hiring remote talent worldwide.
          </p>

          {/* Search */}
          <div className="mt-9 max-w-2xl mx-auto">
            <div className="relative">
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job title or company..."
                className="w-full pl-14 pr-4 py-4.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-10 flex items-center justify-center gap-10 text-sm">
            <div>
              <div className="text-2xl font-black text-slate-900">{jobs.length}</div>
              <div className="text-slate-500 font-medium">Open roles</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <div className="text-2xl font-black text-slate-900">
                {new Set(jobs.map((j) => j.company)).size}
              </div>
              <div className="text-slate-500 font-medium">Companies</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <div className="text-2xl font-black text-slate-900">100%</div>
              <div className="text-slate-500 font-medium">Remote</div>
            </div>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {search ? `Results for "${search}"` : "All open positions"}
          </h2>
          <span className="text-sm font-medium text-slate-400">
            {filteredJobs.length} found
          </span>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 animate-pulse"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredJobs.length === 0 && (
          <div className="text-center text-slate-400 py-24 font-medium">
            No jobs match your search.
          </div>
        )}

        <div className="grid gap-3">
          {filteredJobs.map((job, i) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job.url)}
              className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  avatarStyles[i % avatarStyles.length]
                }`}
              >
                {initials(job.company)}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                  {job.title}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5 font-semibold">
                  {job.company}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Remote
                </span>
                {job.salary > 0 && (
                  <span className="text-sm font-black text-slate-700">
                    ${job.salary.toLocaleString()}
                  </span>
                )}
                <button className="flex items-center gap-1 bg-slate-900 group-hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                  Apply
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-slate-400 font-medium">
          Built by Arsalan · Powered by RemoteOK · Updated automatically
        </div>
      </footer>
    </div>
  );
}