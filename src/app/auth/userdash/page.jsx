"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { clearServerSession, clearSession } from "@/app/services/api";
import BackButton from "@/app/component/BackButton";
import ProfileDropdown from "@/app/component/ProfileDropdown";
import { getCookie, getJsonCookie, setCookie } from "@/app/services/cookieStore";
import { getCurrentUserProfile } from "@/app/services/user.services";
import { PRODUCT_KEY } from "@/app/services/productKey";

const getBusinessOwnerMobileKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `${cc}-${mobile}`;
};

const normalizeOwnerMobileKey = (value) =>
  String(value || "").replace(/\D/g, "").trim();
const USERDASH_SEEN_COOKIE = "userdash_seen";

export default function DashboardPage() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003"
  ).replace(/\/$/, "");
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [showBizPrompt, setShowBizPrompt] = useState(false);
  const [stateResolved, setStateResolved] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [profileInfo, setProfileInfo] = useState({ fullName: "-", seanebId: "-" });
  const productsFetchedRef = useRef(false);

  const getCurrentMobileOwnerKey = () => {
    const verified = getJsonCookie("verified_mobile");
    return getBusinessOwnerMobileKey(
      verified?.country_code,
      verified?.mobile_number
    );
  };

  const hasSkippedBusinessPromptForCurrentMobile = () => {
    const currentMobileOwnerKey = normalizeOwnerMobileKey(getCurrentMobileOwnerKey());
    const skippedCookie = String(getCookie("user_skipped_biz") || "").trim();
    if (!skippedCookie) return false;

    const legacySkipped =
      skippedCookie.toLowerCase() === "true" ||
      skippedCookie.toLowerCase() === "1" ||
      skippedCookie.toLowerCase() === "yes" ||
      skippedCookie.toLowerCase() === "y";

    if (legacySkipped) {
      // Legacy global skip value: only honor it when current mobile cannot be resolved.
      return !currentMobileOwnerKey;
    }

    const normalizedSkipped = normalizeOwnerMobileKey(skippedCookie);
    if (!normalizedSkipped || !currentMobileOwnerKey) return false;
    return normalizedSkipped === currentMobileOwnerKey;
  };

  const resolveDealerTarget = async () => {
    try {
      const result = await getCurrentUserProfile();
      const profileRegistered = result?.profile?.isBusinessRegistered === true;
      setHasBusinessProfile(profileRegistered);
      if (profileRegistered) {
        setCookie("dashboard_mode", "dealer", { days: 365 });
        return "/auth/dealerdash";
      }
      return "/auth/business-reg";
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      if ([401, 403].includes(status)) {
        setRedirecting(true);
        router.replace("/auth/login");
        return "";
      }
      return hasBusinessProfile ? "/auth/dealerdash" : "/auth/business-reg";
    }
  };

  useEffect(() => {
    let active = true;

    const initDashboardState = async () => {
      let hasBusiness = false;

      // Load profile details from DB source of truth via /v1/profile/me
      try {
        const result = await getCurrentUserProfile();
        if (!active) return;

        const fullName = String(
          result?.profile?.fullName || result?.displayName || ""
        ).trim();
        const seanebId = String(result?.profile?.seanebId || "").trim();
        setProfileInfo({
          fullName: fullName || "-",
          seanebId: seanebId || "-",
        });
        hasBusiness = result?.profile?.isBusinessRegistered === true;
        setHasBusinessProfile(hasBusiness);
      } catch (err) {
        const status = Number(err?.response?.status || 0);
        if (!active) return;
        if ([401, 403].includes(status)) {
          setRedirecting(true);
          router.replace("/auth/login");
          return;
        }
        setProfileInfo({ fullName: "-", seanebId: "-" });
        setHasBusinessProfile(false);
      }

      setCookie("dashboard_mode", "user", { days: 365 });
      const hasSeenDashboard = String(getCookie(USERDASH_SEEN_COOKIE) || "").trim() === "true";
      setCookie(USERDASH_SEEN_COOKIE, "true", { days: 365 });

      // Show onboarding popup only for first-time users without business.
      const shouldShowPrompt =
        !hasBusiness &&
        !hasSeenDashboard &&
        !hasSkippedBusinessPromptForCurrentMobile();

      if (!active) return;
      setShowBizPrompt(shouldShowPrompt);
      setStateResolved(true);
    };

    initDashboardState();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stateResolved) return;

    // Skip product fetch while user is on first-time chooser (business vs normal user).
    if (showBizPrompt) {
      setLoading(false);
      return;
    }

    if (productsFetchedRef.current) {
      setLoading(false);
      return;
    }

    productsFetchedRef.current = true;

    const fetchProducts = async () => {
      try {
        const res = await api.get("/v1/products", {
          params: { product_key: PRODUCT_KEY },
          headers: { "x-product-key": PRODUCT_KEY },
        });
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data?.products)
          ? data.data.products
          : [];
        setProducts(list);
      } catch (err) {
        if (err?.response?.status === 401) {
          setRedirecting(true);
          router.replace("/auth/login");
        } else {
          setError(err?.response?.data?.message || "Failed to load products");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router, showBizPrompt, stateResolved]);

  if (loading || redirecting) {
    return <div className="p-8 text-center text-[#6b7280]">Loading dashboard...</div>;
  }

  const handleSkipBusiness = () => {
    const currentMobileOwnerKey = getCurrentMobileOwnerKey();
    setRedirecting(true);
    setCookie("user_skipped_biz", currentMobileOwnerKey || "true", { days: 365 });
    setCookie("show_profile_nav", "true", { days: 365 });
    setCookie("dashboard_mode", "user", { days: 365 });
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/`;
    }
  };

  const goToHomePage = () => {
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/`;
    }
  };

  const handleLogout = async () => {
    setRedirecting(true);
    try {
      await clearServerSession();
    } catch {
      // best effort only
    }
    clearSession();
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.clear();
      } catch {
        // ignore storage access failures
      }
      window.location.href = `${webAppUrl}/`;
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] p-6 [@media(max-width:768px)]:p-4 [background:radial-gradient(1200px_500px_at_-10%_-20%,rgba(30,115,190,0.08),transparent_60%),radial-gradient(900px_360px_at_110%_-30%,rgba(2,40,89,0.09),transparent_65%),linear-gradient(180deg,#f4f7fb_0%,#edf2f8_100%)]">
      <div className="mx-auto w-full max-w-[1120px]">
        <BackButton
          className="mb-4 rounded-[10px] border-[#cfd9e5] bg-[var(--color-white)] text-[#1b2d42] shadow-[0_4px_14px_rgba(15,31,56,0.06)]"
          fallbackPath={`${webAppUrl}/`}
        />

        <div className="overflow-hidden rounded-[18px] border border-[#d7e1ec] bg-[var(--color-white)] shadow-[0_18px_44px_rgba(8,27,49,0.10),0_2px_0_rgba(255,255,255,0.9)_inset]">
          <div className="border-b border-b-[rgba(255,255,255,0.15)] px-8 py-6 [@media(max-width:768px)]:p-5 [background:linear-gradient(130deg,#022a5f_0%,#0f4f8a_55%,#1f77ba_100%)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-[1_1_320px]">
                <p className="m-0 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--color-border-default)]">
                  Seaneb User Console
                </p>
                <h1 className="m-0 mt-2 text-[44px] font-extrabold leading-[1.2] text-[var(--color-white)] [@media(max-width:1024px)]:text-[36px] [@media(max-width:768px)]:text-[30px]">
                  User Dashboard
                </h1>
                <p className="mb-0 mt-[10px] text-[14px] text-[var(--color-border-default)]">
                  Manage your account mode and explore available products.
                </p>
              </div>
              <ProfileDropdown
                fullName={profileInfo.fullName}
                seanebId={profileInfo.seanebId}
                onLogout={handleLogout}
              />
            </div>
          </div>

          <div className="grid gap-[18px] p-[18px] [@media(max-width:900px)]:gap-[14px] [@media(max-width:900px)]:p-[14px]">
            {showBizPrompt && (
              <div className="rounded-[14px] border border-[#bfdbfe] bg-[linear-gradient(180deg,var(--color-page-bg-soft)_0%,var(--color-white)_100%)] p-5 shadow-[0_6px_16px_rgba(12,34,61,0.04)] [@media(max-width:900px)]:rounded-[12px]">
                <div className="mb-[14px]">
                  <h2 className="m-0 text-[28px] font-bold text-[var(--color-text-primary)] [@media(max-width:768px)]:text-[24px]">
                    Choose Your Next Step
                  </h2>
                  <p className="mb-0 mt-[10px] text-[15px] text-[var(--color-text-muted)]">
                    Start as a buyer now, or register your business to unlock dealer tools.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 [@media(max-width:768px)]:grid-cols-1">
                  <button
                    type="button"
                    className="cursor-pointer rounded-[12px] border border-[var(--color-btn-primary-bg)] bg-[linear-gradient(180deg,var(--color-btn-secondary-hover)_0%,var(--color-white)_100%)] p-[14px] text-left transition-[border-color,box-shadow,transform] duration-200 ease-in-out hover:translate-y-[-1px] hover:border-[#94a3b8] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    onClick={() => {
                      setRedirecting(true);
                      router.replace("/auth/business-reg");
                    }}
                  >
                    <span className="block text-[16px] font-bold text-[var(--color-text-primary)]">
                      Register Business
                    </span>
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-[12px] border border-[var(--color-border-default)] bg-[var(--color-white)] p-[14px] text-left transition-[border-color,box-shadow,transform] duration-200 ease-in-out hover:translate-y-[-1px] hover:border-[#94a3b8] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    onClick={handleSkipBusiness}
                  >
                    <span className="block text-[16px] font-bold text-[var(--color-text-primary)]">
                      Skip and Go Home
                    </span>
                  </button>
                </div>
              </div>
            )}

            {!showBizPrompt && (
              <div className="rounded-[14px] border border-[#d4dfeb] bg-[linear-gradient(180deg,var(--color-white)_0%,#fbfdff_100%)] p-5 shadow-[0_6px_16px_rgba(12,34,61,0.04)] [@media(max-width:900px)]:rounded-[12px]">
                <h2 className="m-0 text-[28px] font-bold text-[var(--color-text-primary)] [@media(max-width:768px)]:text-[24px]">
                  Quick Actions
                </h2>
                <p className="mb-0 mt-[10px] text-[15px] text-[var(--color-text-muted)]">
                  {hasBusinessProfile
                    ? "Business found. You can move to dealer dashboard."
                    : "No business registration found. Complete business setup to access dealer dashboard."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 [@media(max-width:768px)]:flex-col">
                  <button
                    className="mt-4 cursor-pointer rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-surface-section)] px-4 py-[11px] text-[14px] font-bold text-[#1e293b] transition-[background-color,border-color] duration-200 ease-in-out hover:border-[#94a3b8] hover:bg-[var(--color-page-bg-alt)]"
                    onClick={goToHomePage}
                  >
                    Go to Home Page
                  </button>
                  <button
                    className="mt-4 min-h-10 cursor-pointer rounded-[10px] border border-[var(--color-btn-primary-bg)] bg-[linear-gradient(140deg,#0d5ebd_0%,#2c86dd_100%)] px-4 py-[11px] text-[14px] font-bold tracking-[0.01em] text-[var(--color-white)] shadow-[0_10px_20px_rgba(18,95,189,0.25)] transition-[transform,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:shadow-[0_14px_24px_rgba(18,95,189,0.30)]"
                    onClick={async () => {
                      const target = await resolveDealerTarget();
                      if (!target) return;
                      setRedirecting(true);
                      router.replace(target);
                    }}
                  >
                    {hasBusinessProfile
                      ? "Move to Dealer Dashboard"
                      : "Register Your Business"}
                  </button>
                </div>
              </div>
            )}

            {!showBizPrompt && (
              <div className="rounded-[14px] border border-[#d4dfeb] bg-[linear-gradient(180deg,var(--color-white)_0%,#fbfdff_100%)] p-5 shadow-[0_6px_16px_rgba(12,34,61,0.04)] [@media(max-width:900px)]:rounded-[12px]">
                <div className="mb-[14px] flex flex-wrap items-center justify-between gap-[10px]">
                  <h2 className="m-0 text-[28px] font-bold text-[var(--color-text-primary)] [@media(max-width:768px)]:text-[24px]">
                    Products
                  </h2>
                  <span className="rounded-full border border-[#c9def7] bg-[#e9f2ff] px-[10px] py-1 text-[12px] font-bold text-[#205fa6]">
                    {products.length} Available
                  </span>
                </div>

                {error && <p className="mb-3 mt-0 text-[14px] text-[#b91c1c]">{error}</p>}

                {products.length > 0 ? (
                  <div className="grid grid-cols-3 gap-[14px] [@media(max-width:1024px)]:grid-cols-2 [@media(max-width:768px)]:grid-cols-1">
                    {products.map((product) => (
                      <div
                        key={product.product_id}
                        className="rounded-[12px] border border-[#d7e3ef] bg-[var(--color-white)] px-4 py-[14px] transition-[border-color,box-shadow,transform] duration-200 ease-in-out shadow-[0_6px_16px_rgba(14,38,66,0.05)] hover:translate-y-[-1px] hover:border-[#9ec0e6] hover:shadow-[0_10px_22px_rgba(12,58,104,0.12)]"
                      >
                        <h3 className="m-0 text-[28px] font-bold leading-[1.2] text-[#0f2e54] [@media(max-width:768px)]:text-[24px]">
                          {product.product_name}
                        </h3>
                        <p className="mb-0 mt-2 text-[15px] text-[#587490]">
                          Key: {product.product_key}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  !error && <p className="mb-0 mt-[10px] text-[15px] text-[var(--color-text-muted)]">No products found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

