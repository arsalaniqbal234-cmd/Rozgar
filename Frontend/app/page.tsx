"use client";

import { useEffect, useState } from "react";

type Job = {
  id: number;
  title: string;
  company: string;
  salary: number;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/jobs")
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
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rozgar
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {jobs.length} live positions
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            🚀 Updated automatically, every day
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Find your next
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              remote role
            </span>
          </h1>
          <p className="text-slate-500 mt-5 text-lg max-w-xl mx-auto">
            Curated remote opportunities, scraped fresh and ready for you to apply.
          </p>

          <div className="mt-9 max-w-xl mx-auto">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
                placeholder="Search by title or company..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading && (
          <div className="text-center text-slate-400 py-24">
            <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
            <p className="font-medium">Loading jobs...</p>
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
              className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  avatarStyles[i % avatarStyles.length]
                }`}
              >
                {initials(job.company)}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                  {job.title}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5 font-medium">
                  {job.company}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                  Remote
                </span>
                {job.salary > 0 && (
                  <span className="text-sm font-bold text-slate-700">
                    ${job.salary.toLocaleString()}
                  </span>
                )}
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}