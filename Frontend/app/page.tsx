"use client";

import { useEffect, useState, useMemo } from "react";

type Job = {
  id: number;
  source_id: string;
  title: string;
  company: string;
  salary: number;
  url: string;
  description?: string;
  location?: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  // Button Action States
  const [activeFilter, setActiveFilter] = useState<"all" | "companies">("all");
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", company: "", salary: "", url: "" });

  // View Mode
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

  // Standard Pagination Settings
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?limit=100&offset=0`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [jobs, search]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE) || 1;

  // Slice jobs for current page view only
  const displayedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredJobs, currentPage]);

  // Companies list for "About Companies" view
  const companySummary = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      map.set(job.company, (map.get(job.company) || 0) + 1);
    });
    return Array.from(map.entries()).map(([company, count]) => ({ company, count }));
  }, [jobs]);

  // Page navigation handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAllJobsClick = () => {
    setActiveFilter("all");
    setSearch("");
    setCurrentPage(1);
  };

  const handleCompaniesClick = () => {
    setActiveFilter("companies");
  };

  const handlePostJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;

    const createdJob: Job = {
      id: Date.now(),
      source_id: `custom_${Date.now()}`,
      title: newJob.title,
      company: newJob.company,
      salary: Number(newJob.salary) || 0,
      url: newJob.url || "#",
      description: "User submitted posting.",
    };

    setJobs([createdJob, ...jobs]);
    setNewJob({ title: "", company: "", salary: "", url: "" });
    setShowPostJobModal(false);
    setActiveFilter("all");
    setCurrentPage(1);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const avatarStyles = [
    "bg-indigo-50 text-indigo-600",
    "bg-violet-50 text-violet-600",
    "bg-fuchsia-50 text-fuchsia-600",
    "bg-cyan-50 text-cyan-600",
    "bg-rose-50 text-rose-600",
    "bg-amber-50 text-amber-600",
  ];

  const getAvatarStyle = (company: string) => {
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarStyles[Math.abs(hash) % avatarStyles.length];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 py-12 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">
            Remote OK Scraper Feed
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Find Your Next Remote Role
          </h1>
          <p className="text-slate-500 font-semibold max-w-xl mx-auto text-sm sm:text-base">
            Live developer and tech listings fetched directly from top global remote sources.
          </p>

          {/* ACTIVE ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleAllJobsClick}
              className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              All Remote Jobs
            </button>
            <button
              onClick={handleCompaniesClick}
              className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all ${
                activeFilter === "companies"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              About Companies
            </button>
            <button
              onClick={() => setShowPostJobModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-md"
            >
              + Post a Job
            </button>
          </div>

          {/* Search Bar */}
          {activeFilter === "all" && (
            <div className="max-w-xl mx-auto pt-4">
              <input
                type="text"
                placeholder="Search by role or company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeFilter === "companies" ? (
          /* ABOUT COMPANIES VIEW */
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Featured Hiring Companies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {companySummary.map(({ company, count }) => (
                <div
                  key={company}
                  onClick={() => {
                    setSearch(company);
                    setActiveFilter("all");
                    setCurrentPage(1);
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${getAvatarStyle(
                        company
                      )}`}
                    >
                      {initials(company)}
                    </div>
                    <span className="font-bold text-slate-900 text-sm truncate">{company}</span>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {count} {count === 1 ? "job" : "jobs"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ALL REMOTE JOBS VIEW */
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-sm font-bold text-slate-500">
                Showing {displayedJobs.length} of {filteredJobs.length} Jobs
              </span>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "card"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-center py-20 text-slate-400 font-bold">
                Loading job postings...
              </div>
            )}

            {error && (
              <div className="text-center py-20 text-rose-500 font-bold">
                Failed to load jobs. Please check your API connection.
              </div>
            )}

            {/* Cards View */}
            {!loading && !error && viewMode === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="group bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${getAvatarStyle(
                            job.company
                          )}`}
                        >
                          {initials(job.company)}
                        </div>
                        {job.salary > 0 && (
                          <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                            ${job.salary.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h2 className="font-bold text-slate-900 group-hover:text-indigo-700 line-clamp-1">
                        {job.title}
                      </h2>
                      <p className="text-slate-500 text-sm mt-0.5 font-semibold mb-3">
                        {job.company}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {!loading && !error && viewMode === "list" && (
              <div className="grid gap-3">
                {displayedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${getAvatarStyle(
                        job.company
                      )}`}
                    >
                      {initials(job.company)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                        {job.title}
                      </h2>
                      <p className="text-slate-500 text-sm mt-0.5 font-semibold">
                        {job.company}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {job.salary > 0 && (
                        <span className="text-sm font-black text-slate-700">
                          ${job.salary.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                        }}
                        className="bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STANDARD PAGINATION BAR */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8 py-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: POST A JOB */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900">Post a Remote Job</h3>
              <button
                onClick={() => setShowPostJobModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePostJobSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Job Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Senior React Developer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Company Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Annual Salary (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Application URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newJob.url}
                  onChange={(e) => setNewJob({ ...newJob, url: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: JOB DETAILS */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${getAvatarStyle(
                    selectedJob.company
                  )}`}
                >
                  {initials(selectedJob.company)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedJob.title}</h3>
                  <p className="text-slate-500 font-semibold">{selectedJob.company}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm leading-relaxed">
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                  100% Remote
                </span>
                {selectedJob.salary > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    ${selectedJob.salary.toLocaleString()} / year
                  </span>
                )}
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-900 text-base mb-2">Job Overview</h4>
                {selectedJob.description ? (
                  <div
                    className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                ) : (
                  <p className="text-slate-400 italic">
                    No detailed description provided for this listing. Click below to view full details on the employer's portal.
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
              >
                Close
              </button>
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                Apply on Official Site ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}