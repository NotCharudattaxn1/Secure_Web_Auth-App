"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  KeyRound,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  RefreshCw,
  Filter,
} from "lucide-react";

/* ── Password Strength Helpers ───────────────────── */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Too short",  color: "#ef4444" },
    { label: "Weak",       color: "#f97316" },
    { label: "Fair",       color: "#f59e0b" },
    { label: "Good",       color: "#84cc16" },
    { label: "Strong",     color: "#22c55e" },
    { label: "Very Strong",color: "#10b981" },
  ];
  return { score, ...levels[Math.min(score, levels.length - 1)] };
}

/* ── Action badge helpers ────────────────────────── */
function getLogMeta(action = "") {
  if (action.includes("LOGIN") && action.includes("SUCCESS"))
    return { color: "#22c55e", Icon: LogIn };
  if (action.includes("LOGIN") && action.includes("FAILED"))
    return { color: "#ef4444", Icon: ShieldAlert };
  if (action.includes("LOGOUT"))
    return { color: "#6366f1", Icon: LogOut };
  if (action.includes("PASSWORD"))
    return { color: "#f59e0b", Icon: KeyRound };
  return { color: "#6b7280", Icon: Activity };
}

/* ── Password input with show/hide ──────────────── */
function PasswordInput({ value, onChange, placeholder, ringColor = "orange" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-${ringColor}-500/50 focus:border-${ringColor}-500/40 transition-all pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function SecurityClient({ user }) {
  const router = useRouter();

  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage]                 = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword]       = useState("");
  const [deleteLoading, setDeleteLoading]         = useState(false);
  const [deleteError, setDeleteError]             = useState(null);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch("/api/security/audit");
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage(null);
    try {
      const res  = await fetch("/api/auth/change-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        fetchLogs(true);
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res  = await fetch("/api/auth/delete-account", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) setDeleteError(data.error);
      else router.push("/");
    } catch {
      setDeleteError("An unexpected error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const FILTERS = ["ALL", "SUCCESS", "FAILED", "LOGOUT"];

  const filteredLogs = useMemo(() => {
    if (filter === "ALL") return logs;
    return logs.filter((l) => l.action?.includes(filter));
  }, [logs, filter]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in py-10 px-4 space-y-8">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2.5 rounded-xl glass-panel hover:bg-white/10 transition-all border border-white/10 hover:-translate-x-0.5"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Security Center
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage credentials and review account activity — Hello,{" "}
            <span className="text-white font-medium">{user.username}</span>
          </p>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-5">

        {/* ── Audit Logs ─────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 md:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-semibold">Activity Audit Logs</h3>
            </div>
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="p-2 rounded-xl glass-panel hover:bg-white/10 transition-all text-gray-400 hover:text-white border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  filter === f
                    ? "bg-white/15 border-white/30 text-white font-semibold"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Log Entries */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-gray-500" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No matching events found.</p>
            ) : (
              filteredLogs.map((log, i) => {
                const { color, Icon } = getLogMeta(log.action);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15`, color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                        >
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-400 font-mono ml-2">{log.ip_address}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary footer */}
          {!loading && logs.length > 0 && (
            <div className="flex gap-4 text-xs pt-2 border-t border-white/5 text-gray-500">
              <span>Total: <b className="text-gray-300">{logs.length}</b></span>
              <span>Success: <b className="text-green-400">{logs.filter((l)=>l.action?.includes("SUCCESS")).length}</b></span>
              <span>Failed: <b className="text-red-400">{logs.filter((l)=>l.action?.includes("FAILED")).length}</b></span>
            </div>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────── */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* ── Change Password ─── */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Change Password</h3>
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Current Password
                </label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  ringColor="orange"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  ringColor="orange"
                />

                {/* Strength meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background:
                              idx < passwordStrength.score
                                ? passwordStrength.color
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex gap-2 items-start border ${
                    message.type === "error"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {message.type === "error" ? (
                    <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading || (newPassword.length > 0 && passwordStrength.score < 2)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Credentials"}
              </button>
            </form>
          </div>

          {/* ── Danger Zone ─── */}
          <div className="glass-panel rounded-2xl p-6 border border-red-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-400">Danger Zone</h3>
                <p className="text-[11px] text-red-500/70">This action is permanent &amp; irreversible</p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                id="delete-account-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="relative w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-3 relative">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Confirm by entering your password. All your data will be permanently erased.
                </p>
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Confirm your password"
                  ringColor="red"
                />
                {deleteError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {deleteError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(null); }}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-xs hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 py-2 text-xs transition-all disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Delete"}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
