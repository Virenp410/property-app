"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearServerSession, clearSession } from "@/app/services/api";
import BackButton from "@/app/component/BackButton";
import ProfileDropdown from "@/app/component/ProfileDropdown";
import { setCookie } from "@/app/services/cookieStore";
import { getCurrentUserProfile } from "@/app/services/user.services";

export default function DealerDashboardPage() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const [profileInfo, setProfileInfo] = useState({ fullName: "-", seanebId: "-" });
  const [businessInfo, setBusinessInfo] = useState({
    branchId: "Pending",
  });
  const [profileResolved, setProfileResolved] = useState(false);
  const [dealerAllowed, setDealerAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
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

        const profileRegistered = result?.profile?.isBusinessRegistered === true;
        if (!profileRegistered) {
          setDealerAllowed(false);
          router.replace("/auth/business-reg");
          return;
        }

        setDealerAllowed(true);
        setCookie("dashboard_mode", "dealer", { days: 365 });
        setBusinessInfo({
          branchId: String(result?.profile?.branchId || "").trim() || "Pending",
        });
      } catch (err) {
        if (!active) return;
        setDealerAllowed(false);
        const status = Number(err?.response?.status || 0);
        if ([401, 403].includes(status)) {
          router.replace("/auth/login");
          return;
        }
        setProfileInfo({ fullName: "-", seanebId: "-" });
      } finally {
        if (active) {
          setProfileResolved(true);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
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

  if (!profileResolved || !dealerAllowed) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        Loading dealer dashboard...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 [@media(max-width:768px)]:p-4 [background:radial-gradient(1000px_420px_at_-10%_-20%,var(--color-dealer-overlay-page-1),transparent_62%),radial-gradient(820px_320px_at_110%_-20%,var(--color-dealer-overlay-page-2),transparent_65%),linear-gradient(180deg,var(--color-page-bg-dealer-start)_0%,var(--color-page-bg-dealer-end)_100%)]"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <BackButton className="mb-4" fallbackPath="/auth/userdash" />

        <div className="overflow-hidden rounded-[20px] border border-[var(--color-border-dealer-card)] bg-[var(--color-white)] shadow-[0_20px_45px_rgba(10,28,52,0.12),0_2px_0_rgba(255,255,255,0.85)_inset]">
          <div
            className="border-b border-b-[var(--color-dealer-hero-border)] px-8 py-[26px] [@media(max-width:768px)]:p-5 [background:radial-gradient(420px_180px_at_100%_-10%,var(--color-dealer-overlay-hero-1),transparent_70%),linear-gradient(130deg,var(--color-dealer-hero-start)_0%,var(--color-dealer-hero-mid)_56%,var(--color-dealer-hero-end)_100%)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-[1_1_320px]">
                <p className="m-0 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--color-border-default)]">
                  Seaneb Dealer Console
                </p>
                <h1 className="m-0 mt-2 text-[clamp(34px,4vw,48px)] font-extrabold leading-[1.2] text-[var(--color-white)] [@media(max-width:1024px)]:text-[36px] [@media(max-width:768px)]:text-[30px]">
                  Dealer Dashboard
                </h1>
                <p className="mb-0 mt-[10px] text-[15px] text-[var(--color-text-dealer-subtitle)]">
                  Manage your business profile and dealer operations from one place.
                </p>
              </div>
              <ProfileDropdown
                fullName={profileInfo.fullName}
                seanebId={profileInfo.seanebId}
                onLogout={handleLogout}
              />
            </div>
          </div>

          <div className="px-8 pb-8 pt-6 [@media(max-width:768px)]:p-5">
            <div className="grid grid-cols-2 gap-4 [@media(max-width:768px)]:grid-cols-1">
              <div className="rounded-[14px] border border-[var(--color-border-dealer-metric)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-page-bg-soft)_100%)] p-[18px] shadow-[0_6px_16px_rgba(11,33,56,0.05)]">
                <p className="m-0 text-[12px] uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                  Branch ID
                </p>
                <p className="mb-0 mt-2 text-[clamp(32px,3vw,42px)] font-bold tracking-[-0.02em] text-[var(--color-text-primary)] [@media(max-width:768px)]:text-[28px]">
                  {businessInfo.branchId}
                </p>
              </div>

              <div className="rounded-[14px] border border-[var(--color-border-dealer-metric)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-page-bg-soft)_100%)] p-[18px] shadow-[0_6px_16px_rgba(11,33,56,0.05)]">
                <p className="m-0 text-[12px] uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                  Account Mode
                </p>
                <p className="mb-0 mt-2 text-[clamp(32px,3vw,42px)] font-bold tracking-[-0.02em] text-[var(--color-text-primary)] [@media(max-width:768px)]:text-[28px]">
                  Dealer
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <div className="rounded-[14px] border border-[var(--color-border-dealer-panel)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-dealer-panel-end)_100%)] px-[22px] py-5 shadow-[0_8px_18px_rgba(12,34,61,0.04)]">
                <h2 className="m-0 text-[16px] font-bold text-[var(--color-text-primary)]">
                  Quick Actions
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-3 [@media(max-width:768px)]:grid-cols-1">
                  <button
                    type="button"
                    className="cursor-pointer rounded-[12px] border border-[var(--color-border-dealer-action-primary)] bg-[linear-gradient(140deg,var(--color-btn-dealer-primary-start)_0%,var(--color-btn-dealer-primary-end)_100%)] px-[14px] pb-3 pt-[14px] text-left text-[14px] font-bold text-[var(--color-white)] shadow-[0_12px_22px_rgba(16,101,191,0.28)] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:bg-[linear-gradient(140deg,var(--color-btn-dealer-primary-hover-start)_0%,var(--color-btn-dealer-primary-hover-end)_100%)] hover:shadow-[0_16px_26px_rgba(16,101,191,0.32)] [@media(max-width:768px)]:min-h-0"
                    onClick={() => router.push("/auth/business-reg")}
                  >
                    <span className="block text-[15px] font-bold leading-[1.28]">
                      Edit Business Profile
                    </span>
                  </button>

                  <button
                    type="button"
                    className="cursor-pointer rounded-[12px] border border-[var(--color-border-dealer-action-ghost)] bg-[var(--color-page-bg-soft)] px-[14px] pb-3 pt-[14px] text-left text-[14px] font-bold text-[var(--color-text-dealer-ghost-action)] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:bg-[var(--color-btn-dealer-ghost-hover)] hover:shadow-[0_8px_14px_rgba(27,62,95,0.12)] [@media(max-width:768px)]:min-h-0"
                    onClick={() => {
                      setCookie("dashboard_mode", "user", { days: 365 });
                      router.push("/auth/userdash");
                    }}
                  >
                    <span className="block text-[15px] font-bold leading-[1.28]">
                      Switch to User Dashboard
                    </span>
                  </button>

                  <button
                    type="button"
                    className="cursor-pointer rounded-[12px] border border-[var(--color-border-dealer-action-ghost)] bg-[var(--color-page-bg-soft)] px-[14px] pb-3 pt-[14px] text-left text-[14px] font-bold text-[var(--color-text-dealer-ghost-action)] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:bg-[var(--color-btn-dealer-ghost-hover)] hover:shadow-[0_8px_14px_rgba(27,62,95,0.12)] [@media(max-width:768px)]:min-h-0"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.href = `${webAppUrl}/`;
                      }
                    }}
                  >
                    <span className="block text-[15px] font-bold leading-[1.28]">
                      Go to Home Page
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
