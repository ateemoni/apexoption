"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const strengthScore = strength.filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"][strengthScore];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (strengthScore < 2) { setError("Please choose a stronger password"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#0f1520] border border-[#1a2235] rounded-2xl p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Check your email</h2>
        <p className="text-sm text-zinc-400">We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click it to activate your account.</p>
        <Link href="/auth/login" className="block w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm">Back to Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Zap size={28} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Apex<span className="text-cyan-400">Option</span></h1>
        <p className="text-zinc-500 text-sm mt-1">Create your free account</p>
      </div>
      <div className="w-full max-w-sm bg-[#0f1520] border border-[#1a2235] rounded-2xl p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={15} />{error}
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
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
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strengthScore ? strengthColor : "bg-[#1a2235]"}`}/>)}
                </div>
                <p className="text-[10px] text-zinc-500">{strengthLabel} password</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Confirm Password</label>
            <input type={showPass ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-[#080c14] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors ${confirm && confirm !== password ? "border-red-500/50" : confirm && confirm === password ? "border-emerald-500/50" : "border-[#1a2235] focus:border-cyan-500/50"}`} />
            {confirm && confirm !== password && <p className="text-[10px] text-red-400 mt-1">Passwords don&apos;t match</p>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Creating account…</> : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
