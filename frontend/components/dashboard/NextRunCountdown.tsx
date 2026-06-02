"use client";
import { useState, useEffect, useCallback } from "react";
import { Clock, Zap, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const _apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_BASE = _apiUrl.replace(/\/api\/v1\/?$/, '');

interface SchedulerStatus {
  scheduler_running: boolean;
  last_run_at: string | null;
  last_run_ideas: number;
  last_run_status: string;
  next_run_at: string | null;
  countdown_seconds: number;
  cron_schedule: string;
}

function formatCountdown(seconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

function formatRelative(isoStr: string | null): string {
  if (!isoStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  onPipelineComplete?: () => void;
}

export default function NextRunCountdown({ onPipelineComplete }: Props) {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduler/status`);
      if (!res.ok) throw new Error("Failed to fetch scheduler status");
      const data: SchedulerStatus = await res.json();
      setStatus(data);
      setCountdown(data.countdown_seconds);
      setError(null);
    } catch {
      setError("Backend offline");
    }
  }, []);

  // Poll scheduler status every 30s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Tick the countdown every second
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up — refresh status after a moment for next_run recalc
          setTimeout(fetchStatus, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchStatus]);

  const handleManualRun = async () => {
    setIsRunning(true);
    try {
      await fetch(`${API_BASE}/api/v1/pipelines/run-all`, { method: "POST" });
      await fetchStatus();
      onPipelineComplete?.();
    } finally {
      setIsRunning(false);
    }
  };

  const { h, m, s } = formatCountdown(countdown);
  const progress = status?.countdown_seconds
    ? 1 - countdown / status.countdown_seconds
    : 0;
  const ring = Math.PI * 2 * 30; // circumference of circle r=30

  return (
    <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Next Auto-Scrape</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status?.scheduler_running
                ? "bg-emerald-400 animate-pulse"
                : "bg-slate-500"
            }`}
          />
          <span className="text-xs text-slate-500">
            {status?.scheduler_running ? "Active" : "Idle"}
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-amber-400 text-xs py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error} — scheduler status unavailable</span>
        </div>
      ) : (
        <>
          {/* Countdown Ring */}
          <div className="flex items-center gap-5 mb-4">
            <div className="relative shrink-0">
              <svg width="76" height="76" className="-rotate-90">
                <circle
                  cx="38"
                  cy="38"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="5"
                />
                <circle
                  cx="38"
                  cy="38"
                  r="30"
                  fill="none"
                  stroke="url(#countdownGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ring * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
                <defs>
                  <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="flex-1">
              {/* Digital countdown */}
              <div className="flex items-center gap-1 mb-1">
                {[
                  { val: h, label: "h" },
                  { val: m, label: "m" },
                  { val: s, label: "s" },
                ].map(({ val, label }, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    {i > 0 && (
                      <span className="text-slate-600 font-mono text-base">:</span>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-xl font-bold text-white tabular-nums leading-none">
                        {val}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {status?.cron_schedule || "Loading…"}
              </p>
            </div>
          </div>

          {/* Last run info */}
          <div
            className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 mb-3 border ${
              status?.last_run_status === "success"
                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                : status?.last_run_status === "running"
                ? "bg-indigo-500/5 border-indigo-500/15 text-indigo-400"
                : "bg-white/5 border-white/5 text-slate-400"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Last run:{" "}
              <strong className="text-white">
                {formatRelative(status?.last_run_at ?? null)}
              </strong>{" "}
              {status?.last_run_ideas
                ? `— ${status.last_run_ideas} ideas`
                : ""}
            </span>
          </div>

          {/* Manual trigger */}
          <button
            onClick={handleManualRun}
            disabled={isRunning}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              isRunning
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 cursor-wait"
                : "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-300 hover:text-white"
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`}
            />
            {isRunning ? "Scraping all platforms…" : "Run Pipelines Now"}
          </button>
        </>
      )}
    </div>
  );
}
