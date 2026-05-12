"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ArrowUpRight,
  Flame,
  Clock,
  Filter,
  Search,
  X,
  ChevronRight,
} from "lucide-react";

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  reddit:       { label: "Reddit",       color: "text-orange-400", bg: "bg-orange-400/8 border-orange-400/20",  dot: "bg-orange-400" },
  producthunt:  { label: "ProductHunt",  color: "text-rose-400",   bg: "bg-rose-400/8 border-rose-400/20",    dot: "bg-rose-400"   },
  hn:           { label: "HackerNews",   color: "text-amber-400",  bg: "bg-amber-400/8 border-amber-400/20",  dot: "bg-amber-400"  },
  linkedin:     { label: "LinkedIn",     color: "text-blue-400",   bg: "bg-blue-400/8 border-blue-400/20",    dot: "bg-blue-400"   },
  indiehackers: { label: "IndieHackers", color: "text-violet-400", bg: "bg-violet-400/8 border-violet-400/20",dot: "bg-violet-400" },
};

const SORT_OPTIONS = [
  { id: "score",  label: "Highest Score",    Icon: TrendingUp },
  { id: "newest", label: "Newest",           Icon: Clock      },
  { id: "hot",    label: "Most Discussed",   Icon: Flame      },
];

const PLATFORMS = ["All", "Reddit", "ProductHunt", "HackerNews", "LinkedIn", "IndieHackers"];

function ScoreBadge({ score }: { score: number }) {
  const val = Math.min(Math.round(score * 10), 99);
  const color = val >= 80 ? "#34d399" : val >= 60 ? "#818cf8" : "#64748b";
  return (
    <span
      className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-md border"
      style={{ color, borderColor: `${color}30`, background: `${color}10` }}
    >
      {val}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse flex items-start gap-5 p-5 border-b border-white/[0.05] last:border-b-0">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.06]" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <div className="h-2.5 bg-white/[0.06] rounded-full w-24" />
        <div className="h-3 bg-white/[0.06] rounded w-full" />
        <div className="h-3 bg-white/[0.06] rounded w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-white/[0.06] rounded-md" />
          <div className="h-5 w-20 bg-white/[0.06] rounded-md" />
        </div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.06]" />
    </div>
  );
}

export default function TrendingProblemsPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/ideas?limit=30")
      .then((r) => r.json())
      .then((data) => {
        let all: any[] = [];
        data.forEach((p: any) => { all = [...all, ...p.ideas]; });
        setIdeas(all);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...ideas];
    if (platform !== "All") {
      result = result.filter((idea) => {
        const p = idea.platform?.toLowerCase();
        const sel = platform.toLowerCase();
        if (sel === "hackernews" && p === "hn") return true;
        return p === sel;
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (idea) =>
          idea.problem?.toLowerCase().includes(q) ||
          idea.idea?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "score")  result.sort((a, b) => b.score - a.score);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "hot")    result.sort((a, b) => (b.upvotes || b.score) - (a.upvotes || a.score));
    return result;
  }, [ideas, platform, query, sortBy]);

  const handleClick = (idea: any) => {
    const id = idea.id || encodeURIComponent(idea.problem?.slice(0, 40));
    sessionStorage.setItem(`trending_${id}`, JSON.stringify(idea));
    router.push(`/dashboard/trending/${id}`);
  };

  const currentSort = SORT_OPTIONS.find((s) => s.id === sortBy)!;

  return (
    <div className="pb-20 animate-in fade-in duration-500">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            </span>
            <span className="text-xs font-semibold text-rose-400 tracking-widest uppercase">Trending</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Trending Problems</h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg leading-relaxed">
            Real pain points people are talking about right now — sorted by signal strength.
          </p>
        </div>

        {!loading && (
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-white tabular-nums">{filtered.length}</p>
            <p className="text-xs text-slate-600 mt-0.5">problems found</p>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems…"
            className="w-full pl-10 pr-9 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all whitespace-nowrap"
          >
            <currentSort.Icon className="w-3.5 h-3.5 text-slate-500" />
            {currentSort.label}
            <Filter className="w-3 h-3 text-slate-600 ml-1" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#16161a] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-30">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                  className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${
                    sortBy === opt.id ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <opt.Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Platform Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              platform === p
                ? "bg-white text-black border-white"
                : "text-slate-500 border-white/[0.08] bg-[#111113] hover:border-white/20 hover:text-slate-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
          </>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <TrendingUp className="w-8 h-8 text-slate-700" />
            <p className="text-slate-500 text-sm">No problems match your filters.</p>
            <button
              onClick={() => { setQuery(""); setPlatform("All"); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((idea, idx) => {
            const meta = PLATFORM_META[idea.platform?.toLowerCase()] || {
              label: idea.platform, color: "text-slate-400", bg: "bg-white/5 border-white/10", dot: "bg-slate-400"
            };
            return (
              <div
                key={idea.id || idx}
                onClick={() => handleClick(idea)}
                className="group flex items-start gap-5 p-5 border-b border-white/[0.05] last:border-b-0 cursor-pointer hover:bg-white/[0.025] transition-colors"
              >
                {/* Rank */}
                <div className="shrink-0 w-8 flex flex-col items-center justify-start pt-0.5">
                  <span className="text-xl font-bold text-slate-700 tabular-nums leading-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
                      {meta.label}
                    </span>
                    <ScoreBadge score={idea.score} />
                  </div>

                  <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed line-clamp-2 transition-colors mb-2.5">
                    {idea.problem}
                  </p>

                  {(idea.features || []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {(idea.features || []).slice(0, 3).map((f: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[110px]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="shrink-0 pt-0.5">
                  <div className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center text-slate-700 group-hover:text-slate-300 group-hover:border-white/20 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
