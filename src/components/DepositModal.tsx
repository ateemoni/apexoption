"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X, Wallet, ChevronRight } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

function CheckoutForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number;
  onSuccess: (amount: number) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "An error occurred");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const { clientSecret, error: apiError } = await res.json();
    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess(amount);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0a0e18] border border-[#1a2235] rounded-xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#06b6d4",
                colorBackground: "#0a0e18",
                colorText: "#ffffff",
                colorDanger: "#ef4444",
                borderRadius: "10px",
              },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-[#1a2235] text-zinc-400 text-sm font-semibold"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="flex-1 py-3 rounded-xl bg-cyan-500 text-black text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>Pay ${amount.toFixed(2)} <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DepositModal({
  onClose,
  onDeposit,
}: {
  onClose: () => void;
  onDeposit: (amount: number) => void;
}) {
  const [step, setStep] = useState<"select" | "pay" | "success">("select");
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleContinue = async () => {
    if (!finalAmount || finalAmount < 1) return;
    setLoadingIntent(true);
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount }),
    });
    const { clientSecret: cs, error } = await res.json();
    setLoadingIntent(false);
    if (error) return;
    setClientSecret(cs);
    setStep("pay");
  };

  const handleSuccess = (paid: number) => {
    onDeposit(paid);
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#0f1520] border border-[#1a2235] rounded-t-3xl p-6 pb-10">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Wallet size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {step === "success" ? "Deposit Successful!" : "Deposit Funds"}
              </h2>
              <p className="text-[10px] text-zinc-500">
                {step === "select" ? "Choose an amount" : step === "pay" ? "Enter payment details" : "Funds added to your balance"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
            <X size={14} className="text-zinc-400" />
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    amount === a && !custom
                      ? "bg-cyan-500 border-cyan-400 text-black"
                      : "bg-[#080c14] border-[#1a2235] text-zinc-400"
                  }`}>
                  ${a}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Custom amount"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full bg-[#080c14] border border-[#1a2235] rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
            />

            <div className="bg-[#080c14] border border-[#1a2235] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">You will deposit</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ${(finalAmount || 0).toFixed(2)}
              </span>
            </div>

            <button onClick={handleContinue}
              disabled={!finalAmount || finalAmount < 1 || loadingIntent}
              className="w-full py-3.5 rounded-xl bg-cyan-500 text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loadingIntent
                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <>Continue <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {step === "pay" && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              amount={finalAmount}
              onSuccess={handleSuccess}
              onCancel={() => setStep("select")}
            />
          </Elements>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <span className="text-3xl">🎉</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">+${finalAmount.toFixed(2)}</p>
              <p className="text-sm text-zinc-400 mt-1">Added to your balance</p>
            </div>
            <button onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-cyan-500 text-black font-bold text-sm">
              Start Trading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
