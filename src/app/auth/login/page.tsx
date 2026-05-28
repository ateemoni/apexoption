"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Zap, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Zap size={28} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Apex<span className="text-cyan-400">Option</span></h1>
        <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
      </div>
      <div className="w-full max-w-sm bg-[#0f1520] border border-[#1a2235] rounded-2xl p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={15} />{error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#080c14] border border-[#1a2235] focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080c14] border border-[#1a2235] focus:border-cyan-500/50 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 outline-none transition-colors" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Signing in…</> : "Sign In"}
          </button>
        </form>
        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-[#1a2235]" /><span className="text-xs text-zinc-600">or</span><div className="flex-1 h-px bg-[#1a2235]" /></div>
        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold">Create one</Link>
        </p>
      </div>
    </div>
  );
}
