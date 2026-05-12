"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpRight,
  Bookmark,
  TrendingUp,
  Clock,
  Flame,
  ChevronDown,
  X,
} from "lucide-react";

const PLATFORM_META: Record<string, { label: string; color: string; dot: string }> = {
  reddit: { label: "Reddit", color: "text-orange-400", dot: "bg-orange-400" },
  producthunt: { label: "ProductHunt", color: "text-rose-400", dot: "bg-rose-400" },
  hn: { label: "HackerNews", color: "text-amber-400", dot: "bg-amber-400" },
  linkedin: { label: "LinkedIn", color: "text-blue-400", dot: "bg-blue-400" },
  indiehackers: { label: "IndieHackers", color: "text-violet-400", dot: "bg-violet-400" },
};

const SORT_OPTIONS = [
  { id: "score", label: "Highest Score", icon: TrendingUp },
  { id: "newest", label: "Newest First", icon: Clock },
  { id: "hottest", label: "Most Discussed", icon: Flame },
];

const PLATFORMS = ["All", "Reddit", "ProductHunt", "HackerNews", "LinkedIn", "IndieHackers"];

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(Math.round(score * 10), 99);
  const color = pct >= 80 ? "#34d399" : pct >= 60 ? "#818cf8" : "#94a3b8";
  return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 shrink-0"
      style={{ borderColor: color }}>
      <span className="text-[11px] font-bold leading-none" style={{ color }}>{pct}</span>
    </div>
  );
}

function IdeaCardGrid({ idea, onClick }: { idea: any; onClick: () => void }) {
  const meta = PLATFORM_META[idea.platform?.toLowerCase()] || { label: idea.platform, color: "text-slate-400", dot: "bg-slate-400" };
  const pct = Math.round(idea.score * 10);

  return (
    <div
      onClick={onClick}
      className="group bg-[#111113] border border-white/[0.06] rounded-2xl p-5 cursor-pointer flex flex-col gap-4 hover:border-white/20 hover:bg-[#16161a] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <ScoreRing score={idea.score} />
      </div>

      <p className="text-sm text-slate-200 leading-relaxed line-clamp-3 flex-1 group-hover:text-white transition-colors">
        {idea.problem}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex gap-1.5 flex-wrap">
          {(idea.features || []).slice(0, 2).map((f: string, i: number) => (
            <span key={i} className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[90px]">
              {f}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-slate-600 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function IdeaCardList({ idea, onClick }: { idea: any; onClick: () => void }) {
  const meta = PLATFORM_META[idea.platform?.toLowerCase()] || { label: idea.platform, color: "text-slate-400", dot: "bg-slate-400" };

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-5 px-5 py-4 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors last:border-b-0"
    >
      <ScoreRing score={idea.score} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed line-clamp-2 transition-colors">
          {idea.problem}
        </p>
        {idea.idea && idea.idea !== idea.problem && (
          <p className="text-xs text-slate-500 line-clamp-1">{idea.idea}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-600 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <Bookmark className="w-3.5 h-3.5" />
        </button>
        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-20 h-3 bg-white/[0.08] rounded-full" />
        <div className="w-10 h-10 rounded-full bg-white/[0.08]" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/[0.08] rounded" />
        <div className="w-5/6 h-3 bg-white/[0.08] rounded" />
        <div className="w-2/3 h-3 bg-white/[0.08] rounded" />
      </div>
      <div className="pt-3 border-t border-white/[0.06] flex gap-2">
        <div className="w-16 h-5 bg-white/[0.08] rounded-md" />
        <div className="w-16 h-5 bg-white/[0.08] rounded-md" />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex items-start gap-5 px-5 py-4 border-b border-white/[0.06] animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/[0.08] shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="w-20 h-3 bg-white/[0.08] rounded-full" />
        <div className="w-full h-3 bg-white/[0.08] rounded" />
        <div className="w-3/4 h-3 bg-white/[0.08] rounded" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/ideas?limit=20")
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
          idea.idea?.toLowerCase().includes(q) ||
          (idea.features || []).some((f: string) => f.toLowerCase().includes(q))
      );
    }

    if (sortBy === "score") result.sort((a, b) => b.score - a.score);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "hottest") result.sort((a, b) => (b.upvotes || b.score) - (a.upvotes || a.score));

    return result;
  }, [ideas, platform, query, sortBy]);

  const currentSort = SORT_OPTIONS.find((s) => s.id === sortBy)!;

  const handleIdeaClick = (idea: any) => {
    const id = idea.id || encodeURIComponent(idea.problem?.slice(0, 40));
    sessionStorage.setItem(`idea_${id}`, JSON.stringify(idea));
    router.push(`/dashboard/explore/${id}`);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Explore Ideas</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Browse, search and filter validated SaaS ideas from across the web.
        </p>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, ideas, features…"
            className="w-full pl-10 pr-4 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <currentSort.icon className="w-4 h-4 text-slate-500" />
            {currentSort.label}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#16161a] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-30">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                  className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${sortBy === opt.id ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 px-3.5 transition-colors ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-slate-600 hover:text-slate-400"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 px-3.5 transition-colors ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-slate-600 hover:text-slate-400"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-600">
          {filtered.length} idea{filtered.length !== 1 ? "s" : ""} found
          {query && <> for "<span className="text-slate-400">{query}</span>"</>}
        </p>
      )}

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <SkeletonGrid key={i} />)
            : filtered.length > 0
            ? filtered.map((idea, idx) => (
                <IdeaCardGrid key={idea.id || idx} idea={idea} onClick={() => handleIdeaClick(idea)} />
              ))
            : (
              <div className="col-span-full py-20 flex flex-col items-center gap-3 text-center">
                <p className="text-slate-400 text-sm">No ideas match your filters.</p>
                <button onClick={() => { setQuery(""); setPlatform("All"); }} className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                  Clear filters
                </button>
              </div>
            )}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonList key={i} />)
            : filtered.length > 0
            ? filtered.map((idea, idx) => (
                <IdeaCardList key={idea.id || idx} idea={idea} onClick={() => handleIdeaClick(idea)} />
              ))
            : (
              <div className="py-20 flex flex-col items-center gap-3 text-center">
                <p className="text-slate-400 text-sm">No ideas match your filters.</p>
                <button onClick={() => { setQuery(""); setPlatform("All"); }} className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                  Clear filters
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
