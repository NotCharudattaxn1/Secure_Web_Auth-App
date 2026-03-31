"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Database,
  Lock,
  Zap,
  Eye,
  EyeOff,
  Activity,
  ArrowRight,
  Star,
  Users,
} from "lucide-react";

const SecurityFeature = ({ icon: Icon, title, description, color, badge }) => (
  <div className="group relative glass-panel rounded-2xl p-5 overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
    <div
      className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5 group-hover:opacity-10 transition-opacity -mr-10 -mt-10"
      style={{ background: color }}
    />
    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border text-sm"
          style={{
            background: `${color}15`,
            borderColor: `${color}30`,
            color: color,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full border"
            style={{
              background: `${color}15`,
              borderColor: `${color}30`,
              color: color,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-sm text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

const StatCard = ({ value, label, color, icon: Icon }) => (
  <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0"
      style={{ background: `${color}15`, borderColor: `${color}30`, color }}
    >
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  </div>
);

export default function DashboardClient({ user }) {
  const [loading, setLoading] = useState(false);
  const [showId, setShowId] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/security/audit")
      .then((r) => r.json())
      .then((d) => { if (d.logs) setLogs(d.logs); })
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const successCount = logs.filter((l) => l.action?.includes("SUCCESS")).length;
  const failCount    = logs.filter((l) => l.action?.includes("FAILED")).length;

  // Initials avatar
  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const securityScore = Math.max(60, Math.min(100, 100 - failCount * 10));

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#09090b]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, <span className="text-blue-400">{user.username}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Your account is secured &amp; active
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-sm font-medium border border-indigo-500/20 hover:-translate-y-0.5"
          >
            <Users className="w-4 h-4" />
            User Lookup
          </button>
          <button
            onClick={() => router.push("/dashboard/security")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all text-sm font-medium border border-orange-500/20 hover:-translate-y-0.5"
          >
            <ShieldAlert className="w-4 h-4" />
            Security Center
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loading ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>

      {/* ── Security Score + Stat Cards ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between sm:col-span-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Security Score
          </div>
          <div className="flex items-end gap-1">
            <span className="text-5xl font-black text-white">{securityScore}</span>
            <span className="text-gray-400 text-lg mb-1">/100</span>
          </div>
          {/* Score bar */}
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${securityScore}%`,
                background:
                  securityScore >= 80
                    ? "linear-gradient(90deg,#22c55e,#4ade80)"
                    : securityScore >= 60
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#ef4444,#f87171)",
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {securityScore >= 80 ? "Great security posture" : "Consider reviewing failed logins"}
          </p>
        </div>

        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard value={logs.length} label="Total Events" color="#6366f1" icon={Activity} />
          <StatCard value={successCount} label="Successful Logins" color="#22c55e" icon={ShieldCheck} />
          <StatCard value={failCount}    label="Failed Attempts"  color="#ef4444" icon={ShieldAlert} />
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Session card */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group md:col-span-1">
          <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-32 h-32 text-green-500 -mr-6 -mt-6" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Active Session</h3>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Authenticated
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Secured via HttpOnly JWT cookie. JavaScript cannot access your session
            token, protecting against XSS-based token theft.
          </p>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 font-mono text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">User ID</span>
              <button
                onClick={() => setShowId((v) => !v)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-green-400">
              {showId ? user.id : "••••••••••••"}
            </span>
          </div>
        </div>

        {/* Security features */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SecurityFeature
            icon={Database}
            color="#3b82f6"
            badge="SQL-Safe"
            title="Parameterized Queries"
            description="All DB queries use parameterized statements — SQL injection is structurally impossible."
          />
          <SecurityFeature
            icon={Lock}
            color="#8b5cf6"
            badge="bcrypt"
            title="Password Hashing"
            description="Passwords are hashed with bcrypt (salt rounds ≥ 12) and never stored in plaintext."
          />
          <SecurityFeature
            icon={ShieldCheck}
            color="#22c55e"
            badge="HttpOnly"
            title="Secure Cookie Sessions"
            description="Tokens live in HttpOnly cookies, invisible to any JavaScript running on the page."
          />
          <SecurityFeature
            icon={Zap}
            color="#f59e0b"
            badge="CSRF-Safe"
            title="SameSite Protection"
            description="Cookies carry SameSite=Strict, blocking cross-site request forgery attacks entirely."
          />
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          <button
            onClick={() => router.push("/dashboard/security")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors group"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
            <span className="w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
            <span className="text-sm">Loading activity…</span>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 5).map((log, i) => {
              const isSuccess = log.action?.includes("SUCCESS");
              const isFailed  = log.action?.includes("FAILED");
              const color = isSuccess ? "#22c55e" : isFailed ? "#ef4444" : "#6366f1";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors flex-wrap gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{log.ip_address}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
