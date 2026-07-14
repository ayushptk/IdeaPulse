"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkX,
  Search,
  LayoutGrid,
  List,
  X,
  Sparkles,
  Clock,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { useSavedIdeas, SavedIdea } from "@/hooks/useSavedIdeas";

const PLATFORM_META: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  reddit: {
    label: "Reddit",
    color: "text-orange-400",
    dot: "bg-orange-400",
    badge: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  },
  producthunt: {
    label: "ProductHunt",
    color: "text-rose-400",
    dot: "bg-rose-400",
    badge: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  },
  hn: {
    label: "HackerNews",
    color: "text-amber-400",
    dot: "bg-amber-400",
    badge: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-blue-400",
    dot: "bg-blue-400",
    badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  indiehackers: {
    label: "IndieHackers",
    color: "text-violet-400",
    dot: "bg-violet-400",
    badge: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  },
};

function getIdKey(idea: SavedIdea) {
  return idea.id
    ? String(idea.id)
    : encodeURIComponent(idea.problem?.slice(0, 60) || "unknown");
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(Math.round(score * 10), 99);
  const color = pct >= 80 ? "#34d399" : pct >= 60 ? "#818cf8" : "#94a3b8";
  return (
    <div
      className="flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 shrink-0"
      style={{ borderColor: color }}
    >
      <span className="text-[11px] font-bold leading-none" style={{ color }}>
        {pct}
      </span>
    </div>
  );
}

function SavedCardGrid({
  idea,
  onUnsave,
  onClick,
}: {
  idea: SavedIdea;
  onUnsave: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const meta =
    PLATFORM_META[idea.platform?.toLowerCase() || ""] || {
      label: idea.platform,
      color: "text-slate-400",
      dot: "bg-slate-400",
      badge: "text-slate-400 bg-white/5 border-white/10",
    };

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#111113] border border-white/[0.06] rounded-2xl p-5 cursor-pointer flex flex-col gap-4 hover:border-indigo-500/30 hover:bg-[#16161a] transition-all duration-200 overflow-hidden"
    >
      {}
      <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ScoreRing score={idea.score || 0} />
          <button
            onClick={onUnsave}
            title="Remove from saved"
            className="p-1.5 rounded-lg text-indigo-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <BookmarkX className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-200 leading-relaxed line-clamp-3 flex-1 group-hover:text-white transition-colors relative z-10">
        {idea.problem}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] relative z-10">
        <div className="flex gap-1.5 flex-wrap">
          {(idea.features || []).slice(0, 2).map((f: string, i: number) => (
            <span
              key={i}
              className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[90px]"
            >
              {f}
            </span>
          ))}
        </div>
        {idea.savedAt && (
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(idea.savedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function SavedCardList({
  idea,
  onUnsave,
  onClick,
}: {
  idea: SavedIdea;
  onUnsave: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const meta =
    PLATFORM_META[idea.platform?.toLowerCase() || ""] || {
      label: idea.platform,
      color: "text-slate-400",
      dot: "bg-slate-400",
    };

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-5 px-5 py-4 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors last:border-b-0"
    >
      <ScoreRing score={idea.score || 0} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </span>
          {idea.savedAt && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1 ml-auto">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(idea.savedAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed line-clamp-2 transition-colors">
          {idea.problem}
        </p>
        {idea.idea && idea.idea !== idea.problem && (
          <p className="text-xs text-slate-500 line-clamp-1">{idea.idea}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <button
          onClick={onUnsave}
          title="Remove from saved"
          className="p-1.5 rounded-lg text-indigo-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <BookmarkX className="w-3.5 h-3.5" />
        </button>
        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-6 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Bookmark className="w-9 h-9 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#111113] border border-white/10 flex items-center justify-center">
          <X className="w-3 h-3 text-slate-500" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1.5">No saved ideas yet</h3>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Bookmark ideas from the Dashboard or Explore page and they&apos;ll appear here for easy access.
        </p>
      </div>
      <Link
        href="/dashboard/explore"
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
      >
        <Sparkles className="w-4 h-4" />
        Browse Ideas
      </Link>
    </div>
  );
}

function DetailModal({
  idea,
  onClose,
  onUnsave,
}: {
  idea: SavedIdea;
  onClose: () => void;
  onUnsave: () => void;
}) {
  const meta =
    PLATFORM_META[idea.platform?.toLowerCase() || ""] || {
      label: idea.platform,
      badge: "text-slate-400 bg-white/5 border-white/10",
    };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${meta.badge}`}>
              {meta.label}
            </span>
            <span className="text-xs text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              Score: {Math.round((idea.score || 0) * 10)}
            </span>
            {idea.savedAt && (
              <span className="text-xs text-slate-600 flex items-center gap-1 ml-1">
                <Bookmark className="w-3 h-3 text-indigo-400" />
                Saved {timeAgo(idea.savedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUnsave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-7 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1.5 leading-tight">
              {idea.idea_name || idea.idea || "SaaS Idea"}
            </h2>
            {idea.solution && idea.solution !== idea.idea && (
              <p className="text-indigo-300 text-sm font-medium">{idea.solution}</p>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-white/[0.06]">
            {}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                The Problem
              </h3>
              <p className="text-slate-200 leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] text-sm">
                {idea.problem}
              </p>
            </div>

            {}
            {(idea.users || idea.target_customer) && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Target Audience
                </h3>
                <p className="text-slate-200 leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] text-sm">
                  {idea.users || idea.target_customer}
                </p>
              </div>
            )}

            {}
            {(((idea.features || idea.core_features || []) as string[]).length > 0) && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Core Features
                </h3>
                <ul className="grid grid-cols-1 gap-2">
                  {((idea.features || idea.core_features || []) as string[]).map(
                    (feature: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 bg-white/[0.04] p-3 rounded-lg border border-white/[0.06]"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-200">{feature}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {}
            {(idea.monetization || idea.monetization_model) && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Monetization
                </h3>
                <p className="text-slate-200 leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] text-sm">
                  {idea.monetization || idea.monetization_model}
                </p>
              </div>
            )}

            {}
            {(idea.why_this_will_work || idea.competitor_gap) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idea.why_this_will_work && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Why it works
                    </h3>
                    <p className="text-slate-200 text-sm leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] h-full">
                      {idea.why_this_will_work}
                    </p>
                  </div>
                )}
                {idea.competitor_gap && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Competitor Gap
                    </h3>
                    <p className="text-slate-200 text-sm leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] h-full">
                      {idea.competitor_gap}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedIdeasPage() {
  const { savedIdeas, unsaveIdea } = useSavedIdeas();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return savedIdeas;
    const q = query.toLowerCase();
    return savedIdeas.filter(
      (idea) =>
        idea.problem?.toLowerCase().includes(q) ||
        idea.idea?.toLowerCase().includes(q) ||
        (idea.features || []).some((f: string) => f.toLowerCase().includes(q))
    );
  }, [savedIdeas, query]);

  const handleUnsave = (idea: SavedIdea, e?: React.MouseEvent) => {
    e?.stopPropagation();
    unsaveIdea(idea);
    if (selectedIdea && getIdKey(selectedIdea) === getIdKey(idea)) {
      setSelectedIdea(null);
    }
  };

  const avgScore =
    savedIdeas.length > 0
      ? Math.round(
          (savedIdeas.reduce((acc, i) => acc + (i.score || 0), 0) / savedIdeas.length) * 10
        )
      : 0;

  const topPlatform = (() => {
    if (!savedIdeas.length) return null;
    const counts: Record<string, number> = {};
    savedIdeas.forEach((i) => {
      const p = i.platform?.toLowerCase() || "unknown";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  })();

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse pb-20">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center" />
          <div className="h-7 bg-white/[0.08] rounded w-48" />
        </div>
        <div className="h-4 bg-white/[0.08] rounded w-96 mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white/[0.05] rounded-2xl border border-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Saved Ideas</h1>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-1">
            Your personal collection of bookmarked SaaS ideas.
          </p>
        </div>

        {savedIdeas.length > 0 && (
          <div className="flex items-center gap-3 text-center shrink-0">
            <div className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
              <p className="text-xl font-bold text-white">{savedIdeas.length}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Saved</p>
            </div>
            <div className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
              <p className="text-xl font-bold text-emerald-400">{avgScore}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Score</p>
            </div>
            {topPlatform && (
              <div className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                <p className="text-sm font-bold text-white capitalize">
                  {PLATFORM_META[topPlatform]?.label || topPlatform}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Top Source</p>
              </div>
            )}
          </div>
        )}
      </div>

      {savedIdeas.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your saved ideas…"
                className="w-full pl-10 pr-10 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {}
            <div className="flex items-center bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 px-3.5 transition-colors ${
                  viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 px-3.5 transition-colors ${
                  viewMode === "list" ? "bg-white/[0.08] text-white" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {}
          <p className="text-xs text-slate-600">
            {filtered.length} idea{filtered.length !== 1 ? "s" : ""}{" "}
            {query && (
              <>
                for &ldquo;<span className="text-slate-400">{query}</span>&rdquo;
              </>
            )}
          </p>

          {}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.length > 0 ? (
                filtered.map((idea, idx) => (
                  <SavedCardGrid
                    key={getIdKey(idea) || idx}
                    idea={idea}
                    onUnsave={(e) => handleUnsave(idea, e)}
                    onClick={() => setSelectedIdea(idea)}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <p className="text-slate-500 text-sm">No saved ideas match your search.</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
              {filtered.length > 0 ? (
                filtered.map((idea, idx) => (
                  <SavedCardList
                    key={getIdKey(idea) || idx}
                    idea={idea}
                    onUnsave={(e) => handleUnsave(idea, e)}
                    onClick={() => setSelectedIdea(idea)}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <p className="text-slate-500 text-sm">No saved ideas match your search.</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {}
      {selectedIdea && (
        <DetailModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onUnsave={() => {
            handleUnsave(selectedIdea);
          }}
        />
      )}
    </div>
  );
}
