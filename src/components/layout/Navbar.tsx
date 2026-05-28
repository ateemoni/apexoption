"use client";

export default function Navbar({ balance }: { balance: number }) {
  return (
    <nav className="h-14 border-b border-zinc-800 bg-[#0f1116] flex items-center justify-between px-6">
      {/* LEFT */}
      <div className="flex items-center gap-10">
        <div className="text-xl font-bold tracking-wide">
          Apex<span className="text-cyan-400">Option</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <button className="hover:text-white transition">Markets</button>
          <button className="hover:text-white transition">Trade</button>
          <button className="hover:text-white transition">Portfolio</button>
          <button className="hover:text-white transition">History</button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* FIX: fallback to 0 so .toFixed(2) never crashes on undefined balance */}
        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-mono text-emerald-400">
          ${(balance ?? 0).toFixed(2)}
        </div>

        <button className="bg-cyan-400 hover:bg-cyan-300 text-black px-5 py-2 rounded-lg text-sm font-semibold transition">
          Deposit
        </button>
      </div>
    </nav>
  );
}
