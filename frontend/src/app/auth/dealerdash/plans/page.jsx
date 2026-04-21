"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPropertyPlans,
  createPaymentOrder,
  verifyPropertyPayment,
} from "@/services/business.services";
import { CheckCircle2, Crown, Sparkles, Loader2, Info } from "lucide-react";
import { getCashfreeClient } from "@/lib/payments/cashfreeClient";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getPropertyPlans();
        if (!active) return;
        console.log("[PlansPage] API Response:", response);
        setPlans(Array.isArray(response) ? response : []);
      } catch (err) {
        if (!active) return;
        
        // Detailed error logic to help debug buffering vs network issues
        let errorMessage = "Unable to load plans. Please try again later.";
        
        if (err?.response?.status === 401) {
           errorMessage = "Authentication failed. Please login again to view plans.";
        } else if (err?.response?.data?.message) {
           errorMessage = err.response.data.message;
        } else if (err?.message) {
           errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("Failed to fetch plans:", err);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    // If there is no token at all, maybe don't fetch and just display error?
    // But apiClient might be able to use the refresh token, so let's call it anyway.
    loadPlans();

    return () => {
      active = false;
    };
  }, []);

  const handleGetStarted = async (plan) => {
    try {
      const planId = plan.plan_id || plan.id;
      if (!planId) {
        alert("Plan ID not found");
        return;
      }

      setProcessingPlanId(planId);
      const response = await createPaymentOrder(planId);
      console.log("[PlansPage] Payment Order Response:", response);

      const sessionId =
        response?.payment_session_id ||
        response?.session_id ||
        response?.sessionId ||
        response?.data?.payment_session_id ||
        response?.data?.session_id;
      const orderId =
        response?.order_id ||
        response?.orderId ||
        response?.data?.order_id ||
        response?.data?.orderId ||
        "";
      if (!sessionId) {
        alert("Failed to create payment session");
        setProcessingPlanId(null);
        return;
      }

      const cashfree = await getCashfreeClient({
        mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
      });
      if (!cashfree) {
        alert("Payment gateway is not available. Please try again.");
        setProcessingPlanId(null);
        return;
      }

      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_modal",
        onSuccess: async (e) => {
          console.log("[PlansPage] Payment Success:", e);

          // Best-effort verification (backend/webhook-driven envs may not expose a verify endpoint).
          await verifyPropertyPayment({
            orderId:
              String(orderId || "").trim() ||
              String(e?.order?.orderId || e?.order_id || e?.orderId || "").trim(),
            paymentSessionId: sessionId,
          });

          setProcessingPlanId(null);
          router.replace("/auth/dealerdash?tab=dashboard&paymentSuccess=true");
        },
        onFailure: (e) => {
          console.error("[PlansPage] Payment Failed:", e);
          setProcessingPlanId(null);
          alert("Payment failed. Please try again.");
        },
        onClose: () => {
          console.log("[PlansPage] Checkout closed");
          setProcessingPlanId(null);
        },
      });
    } catch (err) {
      console.error("[PlansPage] Failed to create payment order:", err);
      alert(err?.response?.data?.message || "Failed to process payment. Please try again.");
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-[#faf9f7] via-[#f5f3f0] to-[#faf9f7] p-6 lg:p-10 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C9A24D]/10 to-[#D4AE57]/10 px-4 py-1.5 text-sm font-semibold text-[#C9A24D] shadow-sm mb-6 ring-1 ring-[#C9A24D]/20">
            <Sparkles className="h-4 w-4" />
            <span>Premium Plans</span>
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight sm:text-6xl leading-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A24D] to-[#D4AE57]">Perfect Plan</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-600 leading-relaxed">
            Boost your real estate business with premium plans designed to maximize your reach and engagement with tailored features for property dealers.
          </p>
        </div>

        {/* State Handling */}
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-[#C9A24D]/20 animate-pulse"></div>
              <Loader2 className="h-10 w-10 animate-spin text-[#C9A24D] relative z-10" />
            </div>
            <p className="text-sm font-medium text-slate-500 animate-pulse">Fetching latest plans...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center shadow-sm">
            <div className="rounded-full bg-red-100 p-3">
              <Info className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-900">Oops! Something went wrong</p>
            <p className="max-w-md text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-red-500/30 transition-all hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50">
            <div className="rounded-full bg-slate-100 p-4">
              <Crown className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No active plans found</h3>
            <p className="max-w-md text-slate-500">
              There are currently no property subscription plans configured for your account. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 items-stretch">
            {plans.map((plan, index) => {
              const name = String(plan.plan_name || plan.name || plan.title || plan.display_name || "Basic Plan").trim();
              const price = String(plan.plan_price || plan.price || plan.amount || plan.cost || plan.fee || "").trim();
              const subtitle = String(plan.description || plan.summary || plan.details || plan.caption || "Premium plan for your business.").trim();
              const validity = String(plan.duration || plan.validity || plan.tenure || plan.term || "").trim();
              const propertyLimit = plan.property_limit || plan.max_properties || plan.properties || "";
              const features = Array.isArray(plan.features) && plan.features.length > 0
                ? plan.features
                : plan.benefits || plan.features_list || plan.items || ["Priority Support", "Email Notifications", "Analytics Dashboard", "Custom Branding"];
              
              const isPopular = index === 1 || (index === 0 && plans.length === 1);
              const borderStyle = isPopular ? "border-2 border-[#C9A24D] ring-4 ring-[#C9A24D]/10 shadow-2xl shadow-[#C9A24D]/20" : "border-2 border-[#eef0f4] hover:border-[#C9A24D]/50 shadow-lg hover:shadow-xl";
              const bgStyle = "bg-white";

              return (
                <div
                  key={`${name}-${index}`}
                  className={`group relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${bgStyle} ${borderStyle}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#C9A24D] to-[#D4AE57] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#C9A24D]/50">
                      ⭐ Most Popular
                    </div>
                  )}

                  <div className="mb-6 border-b border-slate-200 pb-6">
                    <h3 className="text-2xl font-bold text-slate-900">{name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 min-h-[50px]">{subtitle}</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C9A24D] to-[#D4AE57]">
                        {price ? `₹${price}` : "—"}
                      </span>
                      {price && <span className="text-sm font-semibold text-slate-600 pb-2">/plan</span>}
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {validity && (
                      <div className="inline-flex items-center rounded-lg bg-[#C9A24D]/10 px-3 py-1.5 text-xs font-semibold text-[#C9A24D]">
                        Validity: {validity}
                      </div>
                    )}
                    {propertyLimit && (
                      <div className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        Properties: {String(propertyLimit)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <p className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Features included</p>
                    <ul className="space-y-3">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${isPopular ? 'text-[#C9A24D]' : 'text-[#C9A24D]/70'}`} />
                          <span className="text-sm text-slate-600">{String(feature || "").trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGetStarted(plan)}
                    disabled={processingPlanId === (plan.plan_id || plan.id)}
                    className={`mt-auto w-full rounded-xl py-4 px-6 font-bold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isPopular 
                        ? "bg-gradient-to-r from-[#C9A24D] to-[#D4AE57] text-white shadow-lg shadow-[#C9A24D]/40 hover:shadow-[#C9A24D]/60 hover:-translate-y-1 focus:ring-[#C9A24D] disabled:hover:-translate-y-0" 
                        : "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:shadow-lg hover:shadow-slate-900/30 hover:-translate-y-1 focus:ring-slate-900 disabled:hover:-translate-y-0"
                    }`}
                  >
                    {processingPlanId === (plan.plan_id || plan.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Get Started"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


