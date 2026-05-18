"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Check,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";

/* ─── Types ────────────────────────────────────────────── */
type Tab = "profile" | "notifications" | "appearance" | "account";

/* ─── Tiny primitives ───────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-300 mb-1.5">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{children}</p>;
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
    />
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.05] my-7" />;
}

function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sub}</p>}
    </div>
  );
}

function SaveButton({
  onClick,
  saved,
}: {
  onClick: () => void;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
        saved
          ? "bg-green-800 text-white-400 border border-green-500/25"
          : "bg-white text-black hover:bg-slate-100"
      }`}
    >
      {saved ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Saved
        </>
      ) : (
        "Save changes"
      )}
    </button>
  );
}

/* ─── Toggle ────────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? "bg-indigo-500" : "bg-white/10"
      }`}
      style={{ height: "22px", width: "40px" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-white/[0.05] last:border-b-0">
      <div>
        <p className="text-sm text-slate-200">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── Profile Tab ───────────────────────────────────────── */
function ProfileTab() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "Alex");
  const [username, setUsername] = useState(session?.user?.name?.toLowerCase().replace(/\s+/g, '_') || "alex_builder");
  const [email, setEmail] = useState(session?.user?.email || "alex@example.com");
  const [bio, setBio] = useState("");
  const [avatarSeed, setAvatarSeed] = useState(session?.user?.name || "Alex");
  const [saved, setSaved] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

  const handleSave = async () => {
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
      
      const res = await fetch(`${API_URL}/auth/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          name: name,
          picture: avatarUrl,
          bio: bio
        })
      });

      if (res.ok) {
        await update({
          name: name,
          picture: avatarUrl
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="space-y-0">
      <SectionHeading
        title="Public profile"
        sub="This is how others see you across the platform."
      />

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-7">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-white font-medium">Avatar</p>
          <p className="text-xs text-slate-500">Generated from your display name</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
              placeholder="Enter seed…"
              className="w-28 px-2.5 py-1.5 bg-[#0d0d0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
            />
            <span className="text-xs text-slate-600">change seed to update avatar</span>
          </div>
        </div>
      </div>

      <Divider />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label>Display name</Label>
          <Input value={name} onChange={setName} placeholder="Your name" />
          <Hint>Shown on your profile and idea cards.</Hint>
        </div>
        <div>
          <Label>Username</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full pl-7 pr-3.5 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          <Hint>Your unique handle on IdeaForge.</Hint>
        </div>
      </div>

      <div className="mt-5">
        <Label>Email address</Label>
        <Input
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <Hint>Used for notifications and login. Not shown publicly.</Hint>
      </div>

      <div className="mt-5">
        <Label>Bio</Label>
        <Textarea
          value={bio}
          onChange={setBio}
          placeholder="Tell us a bit about what you're building…"
          rows={3}
        />
        <Hint>Max 160 characters. Optional.</Hint>
      </div>

      <div className="mt-7 flex justify-end">
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ─── Notifications Tab ─────────────────────────────────── */
function NotificationsTab() {
  const [emailDigest, setEmailDigest] = useState(true);
  const [weeklyRoundup, setWeeklyRoundup] = useState(true);
  const [newIdeas, setNewIdeas] = useState(false);
  const [trendingAlerts, setTrendingAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [saved, setSaved] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "never">("weekly");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SectionHeading
        title="Email notifications"
        sub="Control what lands in your inbox. We'll never spam you."
      />

      <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-2xl px-5 py-1 mb-6">
        <ToggleRow
          label="Daily idea digest"
          sub="Top 5 ideas from the past 24 hours, delivered to your inbox."
          checked={emailDigest}
          onChange={setEmailDigest}
        />
        <ToggleRow
          label="Weekly roundup"
          sub="A curated summary of the week's best problems and opportunities."
          checked={weeklyRoundup}
          onChange={setWeeklyRoundup}
        />
        <ToggleRow
          label="New idea alerts"
          sub="Get notified the moment a new high-scoring idea drops."
          checked={newIdeas}
          onChange={setNewIdeas}
        />
        <ToggleRow
          label="Trending alerts"
          sub="Know when a problem starts gaining serious traction."
          checked={trendingAlerts}
          onChange={setTrendingAlerts}
        />
        <ToggleRow
          label="Product updates"
          sub="Changelog and new features from the IdeaForge team."
          checked={productUpdates}
          onChange={setProductUpdates}
        />
      </div>

      <Divider />

      <SectionHeading
        title="Digest frequency"
        sub="How often would you like to receive idea digests?"
      />

      <div className="flex gap-2">
        {(["daily", "weekly", "never"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFrequency(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${
              frequency === f
                ? "bg-white text-black border-white"
                : "text-slate-400 border-white/[0.08] bg-[#0d0d0f] hover:border-white/20 hover:text-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-7 flex justify-end">
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ─── Features Tab ─────────────────────────────────────── */
function FeaturesTab() {
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [defaultView, setDefaultView] = useState<"grid" | "list">("grid");
  const [showScores, setShowScores] = useState(true);
  const [animationsOn, setAnimationsOn] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SectionHeading
        title="App Features"
        sub="Customize how IdeaForge functions and looks for you."
      />

      <div className="space-y-6">
        <div>
          <Label>Functionality</Label>
          <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-2xl px-5 py-1">
            <ToggleRow
              label="AI-Powered Suggestions"
              sub="Get intelligent problem-solution matching powered by GPT-4."
              checked={aiSuggestions}
              onChange={setAiSuggestions}
            />
            <ToggleRow
              label="Auto-save Drafts"
              sub="Automatically save your progress while writing ideas."
              checked={autoSave}
              onChange={setAutoSave}
            />
            <ToggleRow
              label="Real-time Updates"
              sub="Sync changes across devices instantly (Beta)."
              checked={realtimeUpdates}
              onChange={setRealtimeUpdates}
            />
          </div>
        </div>

        <Divider />

        {/* Density */}
        <div>
          <Label>Layout density</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(["compact", "comfortable"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
                  density === d
                    ? "border-indigo-500/50 bg-indigo-500/8"
                    : "border-white/[0.06] bg-[#0d0d0f] hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-white capitalize">{d}</span>
                  {density === d && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {d === "compact"
                    ? "Tighter spacing, see more at once."
                    : "Relaxed spacing, easier to read."}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Default view */}
        <div>
          <Label>Default idea view</Label>
          <div className="flex gap-2 mt-2">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setDefaultView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${
                  defaultView === v
                    ? "bg-white text-black border-white"
                    : "text-slate-400 border-white/[0.08] bg-[#0d0d0f] hover:border-white/20 hover:text-slate-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Hint>This sets the default layout on Explore and Saved pages.</Hint>
        </div>
      </div>

      <Divider />

      <SectionHeading title="Interface Preferences" />

      <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-2xl px-5 py-1">
        <ToggleRow
          label="Show idea scores"
          sub="Display the numeric score ring on every idea card."
          checked={showScores}
          onChange={setShowScores}
        />
        <ToggleRow
          label="Animations"
          sub="Page transitions and micro-animations. Disable if you prefer reduced motion."
          checked={animationsOn}
          onChange={setAnimationsOn}
        />
      </div>

      <div className="mt-7 flex justify-end">
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ─── Account Tab ───────────────────────────────────────── */
function AccountTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handlePwSave = () => {
    if (!currentPw || !newPw || newPw !== confirmPw) return;
    setPwSaved(true);
    setTimeout(() => {
      setPwSaved(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }, 2500);
  };

  const pwMatch = newPw && confirmPw && newPw === confirmPw;
  const pwMismatch = newPw && confirmPw && newPw !== confirmPw;

  return (
    <div>
      <SectionHeading
        title="Change password"
        sub="Use a strong password you don't use anywhere else."
      />

      <div className="max-w-sm space-y-4">
        {/* Current password */}
        <div>
          <Label>Current password</Label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              className="w-full pr-10 px-3.5 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <Label>New password</Label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              className="w-full pr-10 px-3.5 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <Label>Confirm new password</Label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 bg-[#0d0d0f] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
              pwMismatch
                ? "border-red-500/40 focus:border-red-500/40 focus:ring-red-500/10"
                : pwMatch
                ? "border-emerald-500/40 focus:border-emerald-500/40 focus:ring-emerald-500/10"
                : "border-white/[0.08] focus:border-indigo-500/40 focus:ring-indigo-500/10"
            }`}
          />
          {pwMismatch && (
            <p className="text-xs text-red-400 mt-1.5">Passwords don&apos;t match.</p>
          )}
          {pwMatch && (
            <p className="text-xs text-emerald-400 mt-1.5">Passwords match.</p>
          )}
        </div>

        <div className="pt-1">
          <SaveButton onClick={handlePwSave} saved={pwSaved} />
        </div>
      </div>

      <Divider />

      {/* Danger zone */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-white">Danger zone</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">These actions are permanent and cannot be undone.</p>

        <div className="border border-red-500/15 rounded-2xl overflow-hidden">
          {/* Clear saved ideas */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-red-500/10">
            <div>
              <p className="text-sm font-medium text-slate-200">Clear saved ideas</p>
              <p className="text-xs text-slate-500 mt-0.5">Remove all bookmarked ideas from your local storage.</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("ideaforge_saved_ideas");
                alert("Saved ideas cleared.");
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Delete account */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-200">Delete account</p>
                <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all associated data.</p>
              </div>
              <button
                onClick={() => setConfirmDelete(!confirmDelete)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
              >
                Delete account
              </button>
            </div>

            {confirmDelete && (
              <div className="mt-4 p-4 bg-red-500/5 border border-red-500/15 rounded-xl space-y-3">
                <p className="text-xs text-red-300">
                  Type <span className="font-mono font-bold">delete my account</span> to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className="w-full px-3 py-2 bg-[#0d0d0f] border border-red-500/20 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/40 transition-all"
                />
                <button
                  disabled={confirmText !== "delete my account"}
                  className="px-4 py-2 bg-red-500 text-white text-xs font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                >
                  Permanently delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Navigation tabs config ────────────────────────────── */
const TABS: { id: Tab; label: string; icon: React.ElementType; sub: string }[] = [
  { id: "profile",       label: "Profile",       icon: User,    sub: "Name, avatar, bio"      },
  { id: "notifications", label: "Notifications", icon: Bell,    sub: "Email & alerts"         },
  { id: "appearance",   label: "Features",      icon: Zap,     sub: "App functionality"      },
  { id: "account",      label: "Account",       icon: Shield,  sub: "Password & data"        },
];

/* ─── Page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: session } = useSession();
  const [active, setActive] = useState<Tab>("profile");



  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {active === "profile" ? (session?.user?.name || "Profile Settings") : "Settings"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, preferences, and notifications.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* ── Left nav ── */}
        <nav className="lg:w-52 shrink-0">
          <ul className="space-y-0.5">
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActive(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-white/[0.07] text-white"
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    <tab.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tab.label}</p>
                      {isActive && (
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">{tab.sub}</p>
                      )}
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-7 lg:p-9">
            {active === "profile"       && <ProfileTab />}
            {active === "notifications" && <NotificationsTab />}
            {active === "appearance"    && <FeaturesTab />}
            {active === "account"       && <AccountTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
