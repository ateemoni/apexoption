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

// FIX #6: Guard against missing env var
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

function CheckoutForm({
  amount,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  amount: number;
  clientSecret: string;         // FIX #1: received from parent, not fetched again
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

    // FIX #1: No second fetch — use the clientSecret already passed in
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
      {/* FIX #8: appearance belongs in <Elements> options, not repeated here */}
      <div className="bg-[#0a0e18] border border-[#1a2235] rounded-xl p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {/* FIX #9: added hover state */}
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-[#1a2235] text-zinc-400 text-sm font-semibold hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="flex-1 py-3 rounded-xl bg-cyan-500 text-black text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
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
  const [intentError, setIntentError] = useState(""); // FIX #5
  // FIX #3: store confirmed amount separately so success screen is always accurate
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleContinue = async () => {
    if (!finalAmount || finalAmount < 1) return;
    setLoadingIntent(true);
    setIntentError("");

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const { clientSecret: cs, error } = await res.json();

      if (error) {
        // FIX #5: show the error instead of silently returning
        setIntentError(error);
        setLoadingIntent(false);
        return;
      }

      // FIX #3: lock in the amount before moving to pay step
      setConfirmedAmount(finalAmount);
      setClientSecret(cs);
      setStep("pay");
    } catch {
      setIntentError("Network error. Please try again.");
    } finally {
      setLoadingIntent(false);
    }
  };

  // FIX #7: don't call onDeposit here — call it when user dismisses success screen
  const handleSuccess = () => {
    setStep("success");
  };

  const handleClose = () => {
    // If deposit succeeded, update balance on close
    if (step === "success") {
      onDeposit(confirmedAmount);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md bg-[#0f1520] border border-[#1a2235] rounded-t-3xl p-6 pb-10 overflow-y-auto max-h-[90vh]">

        {/* Header */}
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
                {step === "select"
                  ? "Choose an amount"
                  : step === "pay"
                  ? "Enter payment details"
                  : "Funds added to your balance"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            <X size={14} className="text-zinc-400" />
          </button>
        </div>

        {/* Step: Select amount */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom(""); }}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    amount === a && !custom
                      ? "bg-cyan-500 border-cyan-400 text-black"
                      : "bg-[#080c14] border-[#1a2235] text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                placeholder="Custom amount"
                value={custom}
                min={1}
                onChange={(e) => setCustom(e.target.value)}
                className="w-full bg-[#080c14] border border-[#1a2235] rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
              />
              {/* FIX #4: minimum hint */}
              {custom && parseFloat(custom) < 1 && (
                <p className="text-[10px] text-red-400 mt-1 ml-1">Minimum deposit is $1.00</p>
              )}
            </div>

            <div className="bg-[#080c14] border border-[#1a2235] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">You will deposit</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ${(finalAmount || 0).toFixed(2)}
              </span>
            </div>

            {/* FIX #5: show API error */}
            {intentError && (
              <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {intentError}
              </p>
            )}

            <button
              onClick={handleContinue}
              disabled={!finalAmount || finalAmount < 1 || loadingIntent}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loadingIntent ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        )}

        {/* Step: Payment */}
        {step === "pay" && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
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
          >
            {/* FIX #1: pass clientSecret down, no second fetch */}
            <CheckoutForm
              amount={confirmedAmount}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={() => setStep("select")}
            />
          </Elements>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <span className="text-3xl">🎉</span>
            </div>
            <div>
              {/* FIX #3: uses confirmedAmount, not potentially-stale finalAmount */}
              <p className="text-2xl font-bold text-emerald-400 font-mono">+${confirmedAmount.toFixed(2)}</p>
              <p className="text-sm text-zinc-400 mt-1">Added to your balance</p>
            </div>
            {/* FIX #7: balance updated here on dismiss */}
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-colors"
            >
              Start Trading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

