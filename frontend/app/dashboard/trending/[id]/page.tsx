"use client";

import { useEffect, useState, ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import { SavedIdea } from "@/hooks/useSavedIdeas";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Lightbulb,
  DollarSign,
  Zap,
  GitBranch,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
} from "lucide-react";

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  reddit:       { label: "Reddit",       color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20",  dot: "bg-orange-400" },
  producthunt:  { label: "ProductHunt",  color: "text-rose-400",   bg: "bg-rose-400/10 border-rose-400/20",    dot: "bg-rose-400"   },
  hn:           { label: "HackerNews",   color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20",  dot: "bg-amber-400"  },
  linkedin:     { label: "LinkedIn",     color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20",    dot: "bg-blue-400"   },
  indiehackers: { label: "IndieHackers", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20",dot: "bg-violet-400" },
};

function Section({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</h2>
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="pb-20 animate-pulse space-y-10">
      <div className="h-4 bg-white/[0.06] rounded-full w-24" />
      <div className="space-y-4">
        <div className="h-3 bg-white/[0.06] rounded w-20" />
        <div className="h-7 bg-white/[0.06] rounded w-3/4" />
        <div className="h-7 bg-white/[0.06] rounded w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 bg-white/[0.06] rounded w-28" />
            <div className="h-24 bg-white/[0.06] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrendingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [idea, setIdea] = useState<SavedIdea | null>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`trending_${id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`trending_${id}`);
      if (cached) return false;
    }
    return true;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    if (!idea) {
      // Fallback — fetch all and find by id
      fetch("http://localhost:8000/api/v1/ideas?limit=50")
        .then((r) => r.json())
        .then((data) => {
          let all: SavedIdea[] = [];
          data.forEach((p: { ideas: SavedIdea[] }) => { all = [...all, ...p.ideas]; });
          const found = all.find(
            (item) =>
              item.id === id ||
              encodeURIComponent(item.problem?.slice(0, 40) || "") === id
          );
          if (found) setIdea(found);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, idea]);

  if (!mounted || loading) return <Skeleton />;

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <TrendingUp className="w-10 h-10 text-slate-700" />
        <p className="text-slate-400">Problem not found.</p>
        <button
          onClick={() => router.push("/dashboard/trending")}
          className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
        >
          Back to Trending
        </button>
      </div>
    );
  }

  const meta = PLATFORM_META[idea.platform?.toLowerCase() || ""] || {
    label: idea.platform, color: "text-slate-400", bg: "bg-white/5 border-white/10", dot: "bg-slate-400"
  };
  const score = Math.min(Math.round((idea.score || 0) * 10), 99);
  const scoreColor = score >= 80 ? "#34d399" : score >= 60 ? "#818cf8" : "#64748b";
  const features: string[] = (idea.features || idea.core_features || []) as string[];

  return (
    <div className="max-w-3xl pb-20 animate-in fade-in duration-500">

      {/* ── Back Nav ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-10 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Trending Problems
      </button>

      {/* ── Hero ── */}
      <div className="mb-12">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${meta.bg} ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>

          {/* Score pill */}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border"
            style={{ color: scoreColor, borderColor: `${scoreColor}30`, background: `${scoreColor}10` }}
          >
            <TrendingUp className="w-3 h-3" />
            {score} signal score
          </span>

          {idea.created_at && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.03]">
              <Clock className="w-3 h-3" />
              {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[1.75rem] font-bold text-white leading-snug tracking-tight mb-3">
          {idea.idea_name || idea.idea || "Untitled Idea"}
        </h1>

        {/* Subtitle / solution headline */}
        {idea.solution && idea.solution !== idea.idea && (
          <p className="text-base text-slate-400 leading-relaxed">
            {idea.solution}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-white/[0.06] mb-12" />

      {/* ── Body sections ── */}
      <div className="space-y-10">

        {/* Problem */}
        <Section icon={Zap} label="The Problem">
          <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-6">
            <p className="text-slate-300 leading-relaxed text-sm">{idea.problem}</p>
          </div>
        </Section>

        {/* Two-col: Audience + Monetization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section icon={Users} label="Target Audience">
            <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-5 h-full">
              <p className="text-slate-300 leading-relaxed text-sm">
                {idea.users || idea.target_customer || "General audience"}
              </p>
            </div>
          </Section>

          <Section icon={DollarSign} label="Monetization">
            <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-5 h-full">
              <p className="text-slate-300 leading-relaxed text-sm">
                {idea.monetization || idea.monetization_model || "Not specified"}
              </p>
            </div>
          </Section>
        </div>

        {/* Core Features */}
        {features.length > 0 && (
          <Section icon={Lightbulb} label="Core Features">
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-[#111113] border border-white/[0.07] rounded-xl px-4 py-3"
                >
                  <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Why it works + Competitor gap */}
        {(idea.why_this_will_work || idea.competitor_gap) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {idea.why_this_will_work && (
              <Section icon={TrendingUp} label="Why It Works">
                <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-5 h-full">
                  <p className="text-slate-300 leading-relaxed text-sm">{idea.why_this_will_work}</p>
                </div>
              </Section>
            )}
            {idea.competitor_gap && (
              <Section icon={GitBranch} label="Competitor Gap">
                <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-5 h-full">
                  <p className="text-slate-300 leading-relaxed text-sm">{idea.competitor_gap}</p>
                </div>
              </Section>
            )}
          </div>
        )}

      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-white/[0.06] my-12" />

      {/* ── Bottom Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSaved(!saved)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            saved
              ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
              : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-indigo-400 text-indigo-400" : ""}`} />
          {saved ? "Saved" : "Save Idea"}
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: idea.idea_name || "Trending Problem", text: idea.problem, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 bg-white/[0.04] transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        <button
          onClick={() => router.push("/dashboard/explore")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 bg-white/[0.04] transition-all ml-auto"
        >
          Explore More Ideas
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
