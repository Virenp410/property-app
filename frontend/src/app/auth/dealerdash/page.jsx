"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "../../services/cookieStore";
import { getCurrentUserProfile } from "../../services/user.services";

export default function DealerDashboardPage() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003"
  ).replace(/\/$/, "");
  const [profileResolved, setProfileResolved] = useState(false);
  const [dealerAllowed, setDealerAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const result = await getCurrentUserProfile();
        if (!active) return;

        const profileRegistered = result?.profile?.isBusinessRegistered === true;
        if (!profileRegistered) {
          setDealerAllowed(false);
          router.replace("/auth/business-reg");
          return;
        }

        setDealerAllowed(true);
        setCookie("dashboard_mode", "dealer", { days: 365 });
      } catch (err) {
        if (!active) return;
        setDealerAllowed(false);
        const status = Number(err?.response?.status || 0);
        if ([401, 403].includes(status)) {
          router.replace("/auth/login");
          return;
        }
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

  if (!profileResolved || !dealerAllowed) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        Loading dealer dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 [@media(max-width:768px)]:p-4 [background:radial-gradient(980px_420px_at_-10%_-20%,rgba(16,73,164,0.24),transparent_64%),radial-gradient(820px_340px_at_110%_-18%,rgba(27,122,230,0.18),transparent_66%),linear-gradient(180deg,#dee8f5_0%,#d6e2f2_100%)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="rounded-[20px] border border-[#2e5e9f] bg-[linear-gradient(135deg,#103d79_0%,#18539f_58%,#2669bd_100%)] p-3.5 shadow-[0_20px_40px_rgba(12,37,76,0.30)] [@media(max-width:768px)]:rounded-[16px] [@media(max-width:768px)]:p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.12)] px-4 text-sm font-semibold text-[var(--color-white)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8dd8ff] shadow-[0_0_0_5px_rgba(141,216,255,0.2)]" />
              Mode: Dealer
            </span>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#7ba7dd] bg-[linear-gradient(180deg,#ffffff_0%,#edf5ff_100%)] px-4 text-sm font-semibold text-[#17467f] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:border-[#6a9bd8] hover:bg-[#e6f1ff] hover:shadow-[0_10px_18px_rgba(8,30,62,0.24)]"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = `${webAppUrl}/`;
                }
              }}
            >
              Go to Home Page
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-[#c1d4ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,251,255,0.96)_100%)] shadow-[0_26px_50px_rgba(12,35,70,0.18)] [@media(max-width:768px)]:rounded-[18px]">
          <div className="grid min-h-[520px] place-items-center px-6 py-10 [@media(max-width:768px)]:min-h-[340px] [@media(max-width:768px)]:px-4">
            <div className="inline-flex flex-col items-center rounded-[22px] border border-[#d0def0] bg-[linear-gradient(180deg,#ffffff_0%,#f4faff_100%)] px-8 py-6 text-center shadow-[0_14px_30px_rgba(15,42,85,0.10)] [@media(max-width:768px)]:px-6 [@media(max-width:768px)]:py-5">
              <span className="mb-3 block h-[3px] w-16 rounded-full bg-[linear-gradient(90deg,#2a77d4_0%,#89c6ff_100%)]" />
              <p className="m-0 text-[21px] font-semibold tracking-[0.01em] text-[#13396f] [@media(max-width:768px)]:text-[17px]">
                Features coming soon only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
