"use client";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  UTCTimestamp,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Volatility index configs ──────────────────────────────────────────────────
const INDICES = [
  {
    id: "V10",
    label: "Volatility 10",
    short: "V10",
    basePrice: 9664,
    volatility: 6,
    tickSpeed: 2000,
    color: "#06b6d4",
  },
  {
    id: "V25",
    label: "Volatility 25",
    short: "V25",
    basePrice: 4821,
    volatility: 15,
    tickSpeed: 1500,
    color: "#a855f7",
  },
  {
    id: "V50",
    label: "Volatility 50",
    short: "V50",
    basePrice: 2347,
    volatility: 28,
    tickSpeed: 1200,
    color: "#f59e0b",
  },
];

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Props = {
  onPriceChange?: (price: number) => void;
  selectedIndex?: string;
};

export default function ChartArea({ onPriceChange, selectedIndex }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const dataRef = useRef<Candle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCandleTimeRef = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(INDICES[0].basePrice);
  const [priceDirection, setPriceDirection] = useState<"up" | "down">("up");
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  const [crosshairTime, setCrosshairTime] = useState<string | null>(null);

  const activeConfig = INDICES[activeIndex];

  // ── Generate initial candles ───────────────────────────────────────────────
  const generateCandles = useCallback((config: typeof INDICES[0]): Candle[] => {
    const now = Math.floor(Date.now() / 1000);
    const candles: Candle[] = [];
    let lastClose = config.basePrice;
    for (let i = 0; i < 50; i++) {
      const open = lastClose;
      const close = open + (Math.random() - 0.5) * config.volatility * 2;
      const high = Math.max(open, close) + Math.random() * config.volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * config.volatility * 0.5;
      candles.push({
        time: (now - (50 - i) * 5) as UTCTimestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });
      lastClose = close;
    }
    return candles;
  }, []);

  // ── Init or reinit chart ───────────────────────────────────────────────────
  const initChart = useCallback((config: typeof INDICES[0]) => {
    if (!chartContainerRef.current) return;

    // Destroy old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0f1a" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: config.color,
          width: 1,
          style: 3,
          labelBackgroundColor: config.color,
        },
        horzLine: {
          color: config.color,
          width: 1,
          style: 3,
          labelBackgroundColor: config.color,
        },
      },
      rightPriceScale: {
        borderColor: "#1d2333",
        textColor: "#6b7280",
      },
      timeScale: {
        borderColor: "#1d2333",
        timeVisible: true,
        secondsVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const candles = generateCandles(config);
    dataRef.current = candles;
    candleSeries.setData(candles);
    chart.timeScale().fitContent();

    const lastCandle = candles[candles.length - 1];
    lastCandleTimeRef.current = lastCandle.time as number;
    setCurrentPrice(lastCandle.close);
    onPriceChange?.(lastCandle.close);

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (param.point && param.time) {
        const price = param.seriesData.get(candleSeries);
        if (price && "close" in price) {
          setCrosshairPrice((price as Candle).close);
        }
        const t = new Date((param.time as number) * 1000);
        setCrosshairTime(
          t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } else {
        setCrosshairPrice(null);
        setCrosshairTime(null);
      }
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Live tick
    const tick = setInterval(() => {
      const data = dataRef.current;
      const last = data[data.length - 1];
      const open = last.close;
      const close = open + (Math.random() - 0.5) * config.volatility * 2;
      const high = Math.max(open, close) + Math.random() * config.volatility * 0.4;
      const low = Math.min(open, close) - Math.random() * config.volatility * 0.4;

      const nowSec = Math.floor(Date.now() / 1000);
      const nextTime = Math.max(nowSec, lastCandleTimeRef.current + 1) as UTCTimestamp;
      lastCandleTimeRef.current = nextTime as number;

      const candle: Candle = {
        time: nextTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      };

      data.push(candle);
      if (data.length > 80) data.shift();
      seriesRef.current?.setData(data);
      chartRef.current?.timeScale().scrollToRealTime();

      setPriceDirection(close >= open ? "up" : "down");
      setCurrentPrice(Number(close.toFixed(2)));
      onPriceChange?.(Number(close.toFixed(2)));
    }, config.tickSpeed);

    intervalRef.current = tick;
  }, [generateCandles, onPriceChange]);

  // Init on mount
  useEffect(() => {
    initChart(INDICES[activeIndex]);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (chartRef.current) chartRef.current.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Switch index
  const switchIndex = (idx: number) => {
    setActiveIndex(idx);
    initChart(INDICES[idx]);
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full bg-[#0b0f1a]">

      {/* ── Header ── */}
      <div className="px-4 pt-3 pb-2 border-b border-[#1d2333]">

        {/* Index tabs */}
        <div className="flex gap-1.5 mb-3">
          {INDICES.map((idx, i) => (
            <button
              key={idx.id}
              onClick={() => switchIndex(i)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeIndex === i
                  ? "text-black border-transparent"
                  : "bg-transparent border-[#1d2333] text-zinc-500 hover:text-zinc-300"
              }`}
              style={activeIndex === i ? { backgroundColor: idx.color, borderColor: idx.color } : {}}
            >
              {idx.short}
            </button>
          ))}
        </div>

        {/* Price display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">
              {activeConfig.label}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold font-mono tracking-tight transition-colors ${
                  priceDirection === "up" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {fmt(currentPrice)}
              </span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  priceDirection === "up"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {priceDirection === "up" ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {/* Crosshair info */}
          <div className="text-right">
            {crosshairPrice ? (
              <div>
                <p className="text-xs font-mono" style={{ color: activeConfig.color }}>
                  {fmt(crosshairPrice)}
                </p>
                <p className="text-[10px] text-zinc-600">{crosshairTime}</p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full" />

        {/* Live price line label */}
        <div
          className="absolute right-0 flex items-center gap-1 pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: activeConfig.color }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 border-t border-[#1d2333] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {INDICES.map((idx, i) => (
            <div key={idx.id} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: idx.color, opacity: activeIndex === i ? 1 : 0.3 }}
              />
              <span
                className="text-[10px] font-mono"
                style={{ color: activeIndex === i ? idx.color : "#4b5563" }}
              >
                {idx.short}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">Candlestick</span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px]" style={{ color: activeConfig.color }}>
            Real-Time
          </span>
        </div>
      </div>
    </div>
  );
}
