"use client";

import DepositModal from "@/components/DepositModal";
import ChartArea from "@/components/chart/ChartArea";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Zap, Activity, Clock, ChevronUp, ChevronDown, BarChart2, Briefcase, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Supabase ───────────────────────────────────────────────────────────────────
 

// ── Types ─────────────────────────────────────────────────────────────────────
type Trade    = { id: number; type: string; result: string; digit: number; stake: number; time: string };
type Position = { id: number; type: "even" | "odd"; entry: number; stake: number; status: "open" | "closed" };
type FeedItem = { id: number; user: string; result: string; amount: number };
{ id: "trade",     Icon: HomeIcon,  label: "Trade"     },
          { id: "positions", Icon: Briefcase, label: "Positions" },
          { id: "account",   Icon: BarChart2, label: "Account"   },

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const now = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export default function Home() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [balance,        setBalance]        = useState(0);           // starts at 0, loaded from Supabase
  const [userId,         setUserId]         = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [stake,          setStake]          = useState(10);
  const [customStake,    setCustomStake]    = useState("");
  const [message,        setMessage]        = useState<{ text: string; type: "win" | "loss" | "info" | "" }>({ text: "", type: "" });
  const [isTrading,      setIsTrading]      = useState(false);
  const [countdown,      setCountdown]      = useState(0);
  const [marketTrend,    setMarketTrend]    = useState<"bullish" | "bearish">("bullish");
  const [price,          setPrice]          = useState(9664.32);
  const [priceDirection, setPriceDirection] = useState<"up" | "down">("up");
  const [entryPrice,     setEntryPrice]     = useState<number | null>(null);
  const [exitPrice,      setExitPrice]      = useState<number | null>(null);
  const [floatingPnL,    setFloatingPnL]    = useState(0);
  const [signal,         setSignal]         = useState<"BUY" | "SELL" | "WAIT">("WAIT");
  const [showDeposit,    setShowDeposit]    = useState(false);
  const [tradeMode,      setTradeMode]      = useState<"manual" | "auto">("manual");
  const [activeNav,      setActiveNav]      = useState<NavTab>("trade");
  const [digits,         setDigits]         = useState(
    Array.from({ length: 10 }, (_, i) => ({ digit: i, percent: 10 }))
  );
  const [lastDigit,      setLastDigit]      = useState<number | null>(null);
  const [history,   setHistory]   = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [liveFeed,  setLiveFeed]  = useState<FeedItem[]>([]);

  // running stats
  const wins    = history.filter(h => h.result === "WIN").length;
  const losses  = history.filter(h => h.result === "LOSS").length;
  const winRate = history.length ? Math.round((wins / history.length) * 100) : 0;
  const totalPnL = history.reduce((acc, t) =>
    acc + (t.result === "WIN" ? t.stake * 0.95 : -t.stake), 0);

  // ── Refs (stale-closure guard) ─────────────────────────────────────────────
  const isTradingRef   = useRef(isTrading);
  const entryPriceRef  = useRef(entryPrice);
  const stakeRef       = useRef(stake);
  const marketTrendRef = useRef(marketTrend);
  const balanceRef     = useRef(balance);
  const userIdRef      = useRef(userId);

  useEffect(() => { isTradingRef.current   = isTrading;  }, [isTrading]);
  useEffect(() => { entryPriceRef.current  = entryPrice; }, [entryPrice]);
  useEffect(() => { stakeRef.current       = stake;      }, [stake]);
  useEffect(() => { marketTrendRef.current = marketTrend;}, [marketTrend]);
  useEffect(() => { balanceRef.current     = balance;    }, [balance]);
  useEffect(() => { userIdRef.current      = userId;     }, [userId]);

  // ── Load balance from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    const loadBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBalanceLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (data) setBalance(data.balance);
      setBalanceLoading(false);
    };
    loadBalance();
  }, []);

  // ── Save balance to Supabase ───────────────────────────────────────────────
  const saveBalance = async (newBalance: number) => {
  const uid = userIdRef.current;
  if (!uid) return;
  const { error } = await supabase
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", uid);
};

  // ── Live tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const newLastDigit = Math.floor(Math.random() * 10);
      setLastDigit(newLastDigit);
      setDigits(Array.from({ length: 10 }, (_, i) => ({
        digit: i, percent: Math.floor(Math.random() * 10) + 5,
      })));

      const trend = Math.random() > 0.5 ? "bullish" : "bearish";
      setMarketTrend(trend as "bullish" | "bearish");

      const r = Math.random();
      setSignal(r > 0.66 ? "BUY" : r > 0.33 ? "SELL" : "WAIT");

      const names = ["Alex", "Mike", "Sarah", "Daniel", "Emma", "Chris", "Kevin", "Sophia"];
      const won   = Math.random() > 0.4;
      setLiveFeed(prev => [
        { id: Date.now(), user: names[Math.floor(Math.random() * names.length)], result: won ? "WIN" : "LOSS", amount: Math.floor(Math.random() * 500) + 20 },
        ...prev.slice(0, 5),
      ]);

      setPrice(prev => {
        const bullish  = marketTrendRef.current === "bullish";
        let   movement = bullish ? Math.random() * 4 : -(Math.random() * 4);
        if (Math.random() > 0.94) {
          movement += (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 20);
          setMessage({ text: "⚡ Volatility spike detected", type: "info" });
        }
        const next = Number((prev + movement).toFixed(2));
        setPriceDirection(movement >= 0 ? "up" : "down");
        if (isTradingRef.current && entryPriceRef.current !== null) {
          setFloatingPnL(Number(((next - entryPriceRef.current) * stakeRef.current).toFixed(2)));
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // ── Place trade ────────────────────────────────────────────────────────────
  const handleTrade = (type: "even" | "odd") => {
    if (isTrading) return;
    if (balance < stake) { setMessage({ text: "Insufficient balance", type: "info" }); return; }

    const newBalanceAfterStake = balance - stake;
    setIsTrading(true);
    setCountdown(3);
    setEntryPrice(price);
    setExitPrice(null);
    setBalance(newBalanceAfterStake);
    saveBalance(newBalanceAfterStake);
    setMessage({ text: `${type.toUpperCase()} position opened`, type: "info" });

    const newPos: Position = { id: Date.now(), type, entry: price, stake, status: "open" };
    setPositions(prev => [newPos, ...prev]);

    const timer = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);

    setTimeout(() => {
      const trend        = marketTrendRef.current;
      const evenDigits   = [0, 2, 4, 6, 8];
      const oddDigits    = [1, 3, 5, 7, 9];
      const winningDigit = trend === "bullish"
        ? evenDigits[Math.floor(Math.random() * 5)]
        : oddDigits[Math.floor(Math.random() * 5)];
      const isEven = winningDigit % 2 === 0;
      const won    = (type === "even" && isEven) || (type === "odd" && !isEven);

      if (won) {
        const winBalance = balanceRef.current + stakeRef.current * 1.95;
        setBalance(winBalance);
        saveBalance(winBalance);
        setMessage({ text: `🎉 WIN  —  Digit ${winningDigit}`, type: "win" });
      } else {
        setMessage({ text: `❌ LOSS  —  Digit ${winningDigit}`, type: "loss" });
        // balance already deducted above, just save current value
        saveBalance(balanceRef.current);
      }

      setHistory(prev => [
        { id: Date.now(), type, result: won ? "WIN" : "LOSS", digit: winningDigit, stake, time: now() },
        ...prev,
      ]);
      setExitPrice(price);
      setFloatingPnL(0);
      setPositions(prev => prev.map(p => p.id === newPos.id ? { ...p, status: "closed" } : p));
      setIsTrading(false);
    }, 3000);
  };

  // ── Stake helper ───────────────────────────────────────────────────────────
  const applyStake = (v: number) => { setStake(v); setCustomStake(""); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col max-w-md mx-auto relative">

      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">ApexOption</p>
          <h1 className="text-lg font-bold text-white leading-tight">
            Apex<span className="text-cyan-400">Option</span>
          </h1>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="text-xs text-zinc-500">Balance</p>
            <p className="text-xl font-bold font-mono text-emerald-400">
              {balanceLoading ? "..." : `$${fmt(balance)}`}
            </p>
          </div>
          <button
            onClick={() => setShowDeposit(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            + Deposit
          </button>
        </div>
      </header>

      {/* ── STATS STRIP ── */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        {[
          { label: "Win Rate", value: `${winRate}%`,  color: "text-emerald-400" },
          { label: "Trades",   value: history.length, color: "text-cyan-400"    },
          { label: "P&L",      value: `${totalPnL >= 0 ? "+" : ""}$${fmt(Math.abs(totalPnL))}`, color: totalPnL >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#0f1520] border border-[#1a2235] rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-sm font-bold mt-0.5 font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── MARKET TABS ── */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
        {["Even/Odd", "Matches/Differs", "Over/Under"].map((tab, i) => (
          <button key={tab} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
            i === 0
              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
              : "border-[#1a2235] text-zinc-500"
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── PRICE HEADER ── */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div>
          <p className="text-xs text-zinc-500">Volatility 10 Index</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-2xl font-bold font-mono tracking-tight transition-colors ${
              priceDirection === "up" ? "text-emerald-400" : "text-red-400"
            }`}>{fmt(price)}</span>
            {priceDirection === "up"
              ? <ChevronUp size={18} className="text-emerald-400" />
              : <ChevronDown size={18} className="text-red-400" />}
          </div>
        </div>

        <div className="flex gap-2">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${
            signal === "BUY"  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
            signal === "SELL" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
          }`}>
            <Zap size={11} />
            {signal}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${
            marketTrend === "bullish"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {marketTrend === "bullish" ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
            {marketTrend === "bullish" ? "BULL" : "BEAR"}
          </div>
        </div>
      </div>

      {/* ── CHART ── */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-[#1a2235] mb-3">
        <ChartArea />
      </div>

      {/* ── DIGIT RINGS ── */}
      {/* ── DIGIT RINGS ── */}
      <div className="px-4 mb-3">
        <div className="bg-[#0f1520] border border-[#1a2235] rounded-2xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Activity size={10}/> Last Digit Distribution
            {lastDigit !== null && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Last: {lastDigit}
              </span>
            )}
          </p>
          <div className="flex justify-between">
            {digits.map(item => {
              const isLast = item.digit === lastDigit;
              const r = 20;
              const circ = 2 * Math.PI * r;
              const offset = circ - (circ * item.percent) / 20;
              const color = isLast
                ? "#ffffff"
                : item.percent >= 12 ? "#22c55e"
                : item.percent <= 7 ? "#ef4444"
                : "#06b6d4";
              return (
                <div
                  key={item.digit}
                  className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                    isLast ? "scale-110" : "scale-100 opacity-70"
                  }`}
                >
                  <div className="relative w-11 h-11">
                    {/* Glow effect for last digit */}
                    {isLast && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: color, animationDuration: "1s" }}
                      />
                    )}
                    <svg width="44" height="44" className="-rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r={r} stroke="#1a2235" strokeWidth="4" fill="none"/>
                      <circle
                        cx="22" cy="22" r={r}
                        stroke={color}
                        strokeWidth={isLast ? 5 : 4}
                        fill="none"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-bold transition-all"
                      style={{ color: isLast ? "#ffffff" : undefined }}
                    >
                      {item.digit}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono transition-all"
                    style={{ color }}
                  >
                    {item.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ACTIVE TRADE CARD ── */}
      {isTrading && (
        <div className="mx-4 mb-3 bg-[#0f1520] border border-cyan-500/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10}/> Resolving
              </p>
              <div className="text-xs text-zinc-400 space-y-0.5">
                <div className="flex gap-2"><span className="text-zinc-600">Entry</span><span className="font-mono">{fmt(entryPrice ?? 0)}</span></div>
                <div className="flex gap-2"><span className="text-zinc-600">Now  </span><span className="font-mono">{fmt(price)}</span></div>
                <div className="flex gap-2">
                  <span className="text-zinc-600">P&L  </span>
                  <span className={`font-mono font-bold ${floatingPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {floatingPnL >= 0 ? "+" : ""}{fmt(floatingPnL)}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-cyan-500/40 flex items-center justify-center">
              <span className="text-3xl font-bold text-cyan-400">{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── LAST TRADE RESULT ── */}
      {exitPrice && entryPrice && !isTrading && message.text && (
        <div className={`mx-4 mb-3 rounded-2xl p-3 border text-sm font-semibold text-center ${
          message.type === "win"  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
          message.type === "loss" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                    "bg-zinc-800/50 border-zinc-700 text-zinc-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* ── TRADE CONTROLS ── */}
      <div className="px-4 mb-3 space-y-3">

        {/* Mode toggle */}
        <div className="flex bg-[#0f1520] border border-[#1a2235] rounded-xl overflow-hidden p-1 gap-1">
          {(["manual", "auto"] as const).map(m => (
            <button key={m} onClick={() => setTradeMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                tradeMode === m ? "bg-cyan-500 text-black" : "text-zinc-500"
              }`}>
              {m}
            </button>
          ))}
        </div>

        {/* Stake */}
        <div className="bg-[#0f1520] border border-[#1a2235] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Stake</p>
            <p className="text-2xl font-bold font-mono text-white">${fmt(stake)}</p>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[1, 5, 10, 25, 50].map(a => (
              <button key={a} onClick={() => applyStake(a)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  stake === a && !customStake
                    ? "bg-cyan-500 border-cyan-400 text-black"
                    : "bg-[#080c14] border-[#1a2235] text-zinc-400"
                }`}>
                ${a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Custom amount"
              value={customStake}
              onChange={e => setCustomStake(e.target.value)}
              className="flex-1 bg-[#080c14] border border-[#1a2235] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => { const v = parseFloat(customStake); if (!isNaN(v) && v > 0) applyStake(v); }}
              className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold"
            >
              Set
            </button>
          </div>
        </div>

        {/* EVEN / ODD buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleTrade("even")} disabled={isTrading}
            className={`relative overflow-hidden rounded-2xl p-5 disabled:opacity-40 transition-all active:scale-95 ${
              marketTrend === "bullish" ? "bg-emerald-500" : "bg-emerald-800/60 border border-emerald-700/40"
            }`}>
            <div className="relative z-10 text-left">
              <TrendingUp size={18} className="mb-2 opacity-80"/>
              <p className="text-2xl font-black">Even</p>
              <p className="text-xs opacity-70 mt-0.5 font-mono">{fmt(price)}</p>
              <p className="text-[10px] opacity-60 mt-1">Payout 95%</p>
            </div>
            {marketTrend === "bullish" && (
              <div className="absolute inset-0 bg-white/5 animate-pulse"/>
            )}
          </button>

          <button onClick={() => handleTrade("odd")} disabled={isTrading}
            className={`relative overflow-hidden rounded-2xl p-5 disabled:opacity-40 transition-all active:scale-95 ${
              marketTrend === "bearish" ? "bg-red-500" : "bg-red-900/60 border border-red-700/40"
            }`}>
            <div className="relative z-10 text-left">
              <TrendingDown size={18} className="mb-2 opacity-80"/>
              <p className="text-2xl font-black">Odd</p>
              <p className="text-xs opacity-70 mt-0.5 font-mono">{fmt(price)}</p>
              <p className="text-[10px] opacity-60 mt-1">Payout 95%</p>
            </div>
            {marketTrend === "bearish" && (
              <div className="absolute inset-0 bg-white/5 animate-pulse"/>
            )}
          </button>
        </div>
      </div>

      {/* ── OPEN POSITIONS ── */}
      {positions.filter(p => p.status === "open").length > 0 && (
        <div className="mx-4 mb-3 bg-[#0f1520] border border-[#1a2235] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a2235] flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Open Positions</p>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {positions.filter(p => p.status === "open").length} active
            </span>
          </div>
          {positions.filter(p => p.status === "open").map(pos => (
            <div key={pos.id} className="px-4 py-3 flex items-center justify-between border-b border-[#1a2235] last:border-0">
              <div>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                  pos.type === "even" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>{pos.type}</span>
                <p className="text-xs text-zinc-500 mt-1 font-mono">@ {fmt(pos.entry)}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold font-mono ${
                  (pos.type === "even" && price >= pos.entry) || (pos.type === "odd" && price < pos.entry)
                    ? "text-emerald-400" : "text-red-400"
                }`}>
                  {((pos.type === "even" && price >= pos.entry) || (pos.type === "odd" && price < pos.entry)) ? "+" : "-"}
                  ${(Math.abs(price - pos.entry) * 0.45).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500 font-mono">${fmt(pos.stake)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIVE FEED ── */}
      <div className="mx-4 mb-3 bg-[#0f1520] border border-[#1a2235] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a2235]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
            Live Traders
          </p>
        </div>
        {liveFeed.length === 0 ? (
          <p className="text-center text-zinc-600 text-xs py-4">Waiting for activity…</p>
        ) : liveFeed.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2235] last:border-0">
            <div>
              <p className="text-xs font-medium">{item.user}</p>
              <p className="text-[10px] text-zinc-600">Trade Closed</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-bold ${item.result === "WIN" ? "text-emerald-400" : "text-red-400"}`}>
                {item.result}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">${item.amount}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TRADE HISTORY ── */}
      <div className="mx-4 mb-24 bg-[#0f1520] border border-[#1a2235] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a2235] flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recent Trades</p>
          <span className="text-xs text-zinc-600">{history.length} total</span>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-zinc-600 text-xs py-8">No trades yet</p>
          ) : history.map(trade => (
            <div key={trade.id} className="flex items-center justify-between px-4 py-3 border-b border-[#1a2235] last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    trade.type === "even" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>{trade.type}</span>
                  <span className="text-[10px] text-zinc-600">Digit {trade.digit}</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-0.5">{trade.time}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${trade.result === "WIN" ? "text-emerald-400" : "text-red-400"}`}>
                  {trade.result === "WIN" ? `+$${fmt(trade.stake * 0.95)}` : `-$${fmt(trade.stake)}`}
                </p>
                <p className="text-[10px] text-zinc-600 font-mono">stake ${fmt(trade.stake)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0a0e18]/95 backdrop-blur border-t border-[#1a2235] flex justify-around py-3 px-2 z-50">
        {([
          { id: "trade",     Icon: HomeIcon,  label: "Trade"     },
          { id: "positions", Icon: Briefcase, label: "Positions" },
          { id: "history",   Icon: History,   label: "History"   },
          { id: "portfolio", Icon: BarChart2, label: "Portfolio" },
        ] as { id: NavTab; Icon: React.ElementType; label: string }[]).map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setActiveNav(id)}
            className={`flex flex-col items-center gap-1 px-3 transition-all ${
              activeNav === id ? "text-cyan-400" : "text-zinc-600"
            }`}>
            <Icon size={20}/>
            <span className="text-[10px] font-medium">{label}</span>
            {activeNav === id && <span className="w-1 h-1 rounded-full bg-cyan-400"/>}
          </button>
        ))}
      </nav>

      {/* ── DEPOSIT MODAL ── */}
      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onDeposit={(amount) => {
            const newBalance = balance + amount;
            setBalance(newBalance);
            saveBalance(newBalance);
            setShowDeposit(false);
          }}
        />
      )}

    </div>
  );
}
