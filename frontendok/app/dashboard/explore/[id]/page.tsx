"use client";

import { useEffect, useState, ComponentType } from "react";
import { useRouter, useParams } from "next/navigation";
import { SavedIdea } from "@/hooks/useSavedIdeas";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  Target,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  Clock,
  BarChart2,
} from "lucide-react";

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  reddit: {
    label: "Reddit",
    color: "text-orange-400",
    bg: "bg-orange-400/8",
    border: "border-orange-400/20",
    dot: "bg-orange-400",
  },
  producthunt: {
    label: "ProductHunt",
    color: "text-rose-400",
    bg: "bg-rose-400/8",
    border: "border-rose-400/20",
    dot: "bg-rose-400",
  },
  hn: {
    label: "HackerNews",
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/20",
    dot: "bg-amber-400",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-blue-400",
    bg: "bg-blue-400/8",
    border: "border-blue-400/20",
    dot: "bg-blue-400",
  },
  indiehackers: {
    label: "IndieHackers",
    color: "text-violet-400",
    bg: "bg-violet-400/8",
    border: "border-violet-400/20",
    dot: "bg-violet-400",
  },
};

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.min(Math.round(score * 10), 99);
  const color =
    pct >= 80 ? "#34d399" : pct >= 60 ? "#818cf8" : "#94a3b8";
  const label =
    pct >= 80 ? "High Potential" : pct >= 60 ? "Moderate" : "Early Stage";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-500 font-medium">Validation Score</span>
        <span className="text-2xl font-bold" style={{ color }}>
          {pct}
          <span className="text-sm text-slate-500 font-normal ml-0.5">/99</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  children,
  accent = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${accent ? "bg-indigo-500/15" : "bg-white/[0.05]"}`}>
          <Icon className={`w-3.5 h-3.5 ${accent ? "text-indigo-400" : "text-slate-400"}`} />
        </div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-block text-xs text-slate-400 bg-white/[0.05] border border-white/[0.07] px-3 py-1 rounded-full">
      {text}
    </span>
  );
}

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [idea, setIdea] = useState<SavedIdea | null>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`idea_${id}`);
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
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`idea_${id}`);
      if (cached) return false;
    }
    return true;
  });

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    if (!idea) {
      
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
          setIdea(found || null);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, idea]);

  const meta =
    PLATFORM_META[idea?.platform?.toLowerCase() || ""] || {
      label: idea?.platform || "Unknown",
      color: "text-slate-400",
      bg: "bg-white/[0.05]",
      border: "border-white/10",
      dot: "bg-slate-400",
    };

  const features: string[] =
    (idea?.features || idea?.core_features || []) as string[];

  if (!mounted || loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-pulse pb-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/[0.08] rounded-xl" />
          <div className="w-24 h-4 bg-white/[0.08] rounded" />
        </div>
        <div className="space-y-4">
          <div className="w-20 h-5 bg-white/[0.08] rounded-full" />
          <div className="w-full h-8 bg-white/[0.08] rounded" />
          <div className="w-3/4 h-8 bg-white/[0.08] rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.05] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <p className="text-slate-400 text-sm">Idea not found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Explore Ideas
      </button>

      {}
      <div className="space-y-5 mb-10">
        {}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${meta.color} ${meta.bg} ${meta.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>

        {}
        <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
          {idea.idea_name || idea.idea || "Untitled SaaS Idea"}
        </h1>

        {}
        {idea.solution && idea.solution !== idea.idea && (
          <p className="text-slate-400 text-base leading-relaxed">
            {idea.solution}
          </p>
        )}

        {}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setSaved(!saved)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              saved
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-white/[0.05] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-indigo-400 text-indigo-400" : ""}`} />
            {saved ? "Saved" : "Save idea"}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-white/[0.05] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 mb-6">
        <ScoreMeter score={idea.score || 0} />
      </div>

      {}
      <div className="h-px bg-white/[0.05] mb-8" />

      {}
      <div className="space-y-8">

        {}
        <Section icon={Target} label="The Problem">
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-slate-200 text-sm leading-relaxed">{idea.problem}</p>
          </div>
        </Section>

        {}
        {(idea.users || idea.target_customer) && (
          <Section icon={Users} label="Target Audience">
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-slate-200 text-sm leading-relaxed">
                {idea.users || idea.target_customer}
              </p>
            </div>
          </Section>
        )}

        {}
        {features.length > 0 && (
          <Section icon={Zap} label="Core Features" accent>
            <ul className="space-y-2">
              {features.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-3 bg-[#111113] border border-white/[0.06] rounded-xl p-4">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {}
        {(idea.monetization || idea.monetization_model) && (
          <Section icon={DollarSign} label="Monetization">
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-slate-200 text-sm leading-relaxed">
                {idea.monetization || idea.monetization_model}
              </p>
            </div>
          </Section>
        )}

        {}
        {(idea.why_this_will_work || idea.competitor_gap) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {idea.why_this_will_work && (
              <Section icon={Lightbulb} label="Why It Works">
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 h-full">
                  <p className="text-slate-200 text-sm leading-relaxed">{idea.why_this_will_work}</p>
                </div>
              </Section>
            )}
            {idea.competitor_gap && (
              <Section icon={BarChart2} label="Competitor Gap">
                <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 h-full">
                  <p className="text-slate-200 text-sm leading-relaxed">{idea.competitor_gap}</p>
                </div>
              </Section>
            )}
          </div>
        )}

        {}
        {(((idea.tags || idea.keywords || []) as string[]).length > 0) && (
          <Section icon={TrendingUp} label="Tags">
            <div className="flex flex-wrap gap-2">
              {((idea.tags || idea.keywords || []) as string[]).map((t: string, i: number) => (
                <Pill key={i} text={t} />
              ))}
            </div>
          </Section>
        )}

        {}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {idea.created_at
                ? new Date(idea.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date unknown"}
            </span>
          </div>
          {!!idea.url && (
            <a
              href={idea.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
