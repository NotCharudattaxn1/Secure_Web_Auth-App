"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  Users,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Calendar,
  Hash,
  RefreshCw,
  User,
  Database,
  X,
  Copy,
  Check,
} from "lucide-react";

/* ── tiny copy-to-clipboard hook ────────────────── */
function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  };
  return { copied, copy };
}

/* ── Field row ───────────────────────────────────── */
function Field({ label, value, icon: Icon, color = "#6366f1", mono = false, copyable = false }) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-gray-400 text-xs min-w-[140px] flex-shrink-0">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span
          className={`text-sm text-right break-all ${mono ? "font-mono text-xs" : ""}`}
          style={{ color: color === "#6366f1" ? "white" : color }}
        >
          {value ?? "—"}
        </span>
        {copyable && value && (
          <button
            onClick={() => copy(value)}
            className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── User card (list view) ───────────────────────── */
function UserRow({ u, onClick, active }) {
  const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
  return (
    <button
      onClick={() => onClick(u)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
        active
          ? "bg-indigo-500/10 border-indigo-500/30"
          : "bg-black/20 border-white/5 hover:border-white/15 hover:bg-white/5"
      }`}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
        {u.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{u.username}</p>
        <p className="text-xs text-gray-500 font-mono">ID: {u.id}</p>
      </div>
      {isLocked ? (
        <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
      )}
    </button>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function AdminLookupClient({ currentUser }) {
  const router = useRouter();

  const [allUsers, setAllUsers]           = useState([]);
  const [selected, setSelected]           = useState(null);
  const [query, setQuery]                 = useState("");
  const [listLoading, setListLoading]     = useState(true);
  const [searching, setSearching]         = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Keep a ref to selected so loadAll can read the latest value
  // without needing it as a dependency (which would cause an infinite loop).
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch("/api/admin/user-lookup");
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
        // If a user detail is open, update it with fresh data from the list
        const current = selectedRef.current;
        if (current) {
          const fresh = data.users.find(u => u.id === current.id);
          if (fresh) setSelected(fresh);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — no deps needed thanks to the ref

  useEffect(() => { loadAll(); }, [loadAll]);

  // Fetch fresh data for a single user by username and select them
  const fetchAndSelect = useCallback(async (username) => {
    setDetailLoading(true);
    setSearchError(null);
    try {
      const res  = await fetch(`/api/admin/user-lookup?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "User not found");
      } else {
        setSelected(data.user);
      }
    } catch {
      setSearchError("Request failed.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSelected(null);
    try {
      const res  = await fetch(`/api/admin/user-lookup?username=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "User not found");
      } else {
        setSelected(data.user);
      }
    } catch {
      setSearchError("Request failed.");
    } finally {
      setSearching(false);
    }
  };

  const isLocked = (u) => u?.locked_until && new Date(u.locked_until) > new Date();

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

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
            <Database className="w-6 h-6 text-indigo-400" />
            User Lookup
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Inspect registered accounts — passwords are never exposed
          </p>
        </div>
      </div>

      {/* ── Notice banner ────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-sm text-indigo-300">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
        <span>
          This panel shows <strong>safe fields only</strong>. Passwords are hashed with bcrypt and
          never stored in plaintext. The hash preview shows the first 12 characters only and is not
          usable for authentication.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* ── Left — User list ──────────────────────── */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm">All Users</h3>
              {!listLoading && (
                <span className="text-xs bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">
                  {allUsers.length}
                </span>
              )}
            </div>
            <button
              onClick={() => loadAll(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchError(null); }}
                placeholder="Search by username…"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSelected(null); setSearchError(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {query.trim() && (
              <button
                type="submit"
                disabled={searching}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-all disabled:opacity-50"
              >
                {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {searching ? "Searching…" : "Exact search"}
              </button>
            )}
          </form>

          {searchError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> {searchError}
            </p>
          )}

          {/* User rows */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {listLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">No users match.</p>
            ) : (
              filteredUsers.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  onClick={(user) => fetchAndSelect(user.username)}
                  active={selected?.id === u.id}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right — Detail view ───────────────────── */}
        <div className="md:col-span-3">
          {!selected ? (
            <div className="glass-panel rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">No user selected</p>
                <p className="text-gray-600 text-xs mt-1">
                  Click a user from the list or search by username
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-in">
              {detailLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              )}
              {/* User header */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                  {selected.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{selected.username}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {isLocked(selected) ? (
                      <span className="text-xs flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Account Locked
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <Unlock className="w-3 h-3" /> Active
                      </span>
                    )}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      Viewing as{" "}
                      <span className="text-indigo-400 font-medium">{currentUser.username}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-white/8 transition-colors text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-0 divide-y divide-white/0">
                <Field
                  label="User ID"
                  value={selected.id}
                  icon={Hash}
                  color="#6366f1"
                  mono
                  copyable
                />
                <Field
                  label="Username"
                  value={selected.username}
                  icon={User}
                  color="#a78bfa"
                  copyable
                />
                <Field
                  label="Hash Preview"
                  value={selected.hash_preview}
                  icon={ShieldCheck}
                  color="#22c55e"
                  mono
                />
                <Field
                  label="Hash Length"
                  value={`${selected.hash_length} chars (bcrypt)`}
                  icon={Lock}
                  color="#84cc16"
                  mono
                />
                <Field
                  label="Failed Logins"
                  value={selected.failed_login_attempts ?? 0}
                  icon={ShieldAlert}
                  color={selected.failed_login_attempts > 0 ? "#f59e0b" : "#6b7280"}
                />
                <Field
                  label="Locked Until"
                  value={
                    selected.locked_until
                      ? new Date(selected.locked_until).toLocaleString()
                      : "Not locked"
                  }
                  icon={Lock}
                  color={isLocked(selected) ? "#ef4444" : "#6b7280"}
                  mono
                />
                <Field
                  label="Created At"
                  value={new Date(selected.created_at).toLocaleString()}
                  icon={Calendar}
                  color="#60a5fa"
                  mono
                />
              </div>

              {/* Security reminder */}
              <div className="mt-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  The hash preview is intentionally partial. The full bcrypt hash is
                  never transmitted to the browser.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
