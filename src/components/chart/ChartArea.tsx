"use client";

import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef } from "react";

export default function ChartArea() {
  // FIX: type the ref properly so TypeScript doesn't complain about .clientWidth
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0f1a" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 420,
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1d2333" },
      timeScale: {
        borderColor: "#1d2333",
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Use addSeries(CandlestickSeries, ...) — compatible with lightweight-charts v5+
    // which is what Next.js 16 / Turbopack resolves. addCandlestickSeries() is v3 API.
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Build initial 40-candle history
    const now = Math.floor(Date.now() / 1000);
    const data: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[] = [];

    let lastClose = 9664;

    for (let i = 0; i < 40; i++) {
      const open = lastClose;
      const close = open + (Math.random() - 0.5) * 12;
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;

      // FIX: space candles 5 s apart anchored to a fixed `now` so timestamps
      // are guaranteed unique and strictly ascending (no duplicate-time errors).
      data.push({
        time: now - (40 - i) * 5,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });

      lastClose = close;
    }

    candleSeries.setData(data);
    chart.timeScale().fitContent();

    // FIX: track the last candle timestamp explicitly so each new candle
    // always gets a timestamp strictly greater than the previous one,
    // even if two interval ticks fire within the same second.
    let lastCandleTime = data[data.length - 1].time;

    const interval = setInterval(() => {
      const last = data[data.length - 1];
      const open = last.close;
      const close = open + (Math.random() - 0.5) * 10;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;

      // FIX: ensure strictly increasing time — never reuse or go backwards
      const nextTime = Math.max(Math.floor(Date.now() / 1000), lastCandleTime + 1);
      lastCandleTime = nextTime;

      const candle = {
        time: nextTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      };

      data.push(candle);
      if (data.length > 60) data.shift();

      candleSeries.setData(data);
      chart.timeScale().scrollToRealTime();
    }, 2000);

    // Responsive resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full bg-[#0b0f1a]">
      {/* CHART HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1d2333]">
        <div>
          <div className="text-sm text-zinc-500">EUR/USD</div>
          <div className="text-xl font-bold text-white">Live Market</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* CHART CANVAS */}
      <div ref={chartContainerRef} className="w-full" />

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-[#1d2333] flex items-center justify-between text-sm">
        <div className="text-zinc-500">Candlestick Chart</div>
        <div className="text-emerald-400">Real-Time Simulation</div>
      </div>
    </div>
  );
}
