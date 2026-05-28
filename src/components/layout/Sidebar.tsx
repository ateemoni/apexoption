export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-[#11131a] flex flex-col">
      {/* HEADER */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-5">
        <h2 className="text-sm font-semibold text-zinc-300">
          Open Positions
        </h2>
      </div>

      {/* EMPTY STATE */}
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        No active trades
      </div>

      {/* FOOTER */}
      <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
        0 open positions
      </div>
    </aside>
  );
}