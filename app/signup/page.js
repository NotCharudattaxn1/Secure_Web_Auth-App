"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Strict input validation happens both on client (basic) and server (zod)
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess(true);
      // Automatically logged in via cookie, redirect shortly
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex justify-center mb-8">
        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <ShieldCheck className="w-10 h-10 text-blue-500" />
        </div>
      </div>
      
      <div className="glass-panel rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-sm text-gray-400">Join our secure platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-500/90">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5 relative z-10" />
            <p className="text-sm text-green-500/90 relative z-10">Account created securely. Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400/70" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field rounded-xl py-2.5 pl-10 pr-4 text-sm"
                placeholder="Choose a username"
                required
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1 ml-1">Must be 3-20 alphanumeric characters</p>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400/70" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field rounded-xl py-2.5 pl-10 pr-4 text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1 ml-1 leading-relaxed">
              At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="btn-primary rounded-xl py-2.5 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Confirm & Create <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
