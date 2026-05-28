export default function RightPanel() {
  return (
    <aside className="w-80 border-l border-zinc-800 bg-[#11131a] flex flex-col">
      {/* HEADER */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-5">
        <h2 className="text-sm font-semibold text-zinc-300">
          Trade Panel
        </h2>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-5">
        {/* Stake */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">
            Stake Amount
          </label>

          <input
            type="number"
            defaultValue={10}
            className="w-full bg-[#0b0d12] border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </div>

        {/* Rise */}
        <button className="w-full bg-emerald-500 hover:bg-emerald-400 transition rounded-xl py-4 font-semibold text-lg">
          RISE
        </button>

        {/* Fall */}
        <button className="w-full bg-red-500 hover:bg-red-400 transition rounded-xl py-4 font-semibold text-lg">
          FALL
        </button>
      </div>

      {/* FOOTER */}
      <div className="mt-auto border-t border-zinc-800 p-4 text-xs text-zinc-500">
        Payout: 95%
      </div>
    </aside>
  );
}