// "use client";

// import Image from "next/image";
// import { useMemo } from "react";
// import { useDealerDash } from "./_components/DealerDashContext";

// const metricCards = [
//   { title: "Live Inventory", value: "128", delta: "+8.4%", note: "12 fresh listings this week", points: "5,42 24,28 43,34 62,18 81,22 100,8" },
//   { title: "Open Enquiries", value: "43", delta: "+12%", note: "7 high-intent buyers today", points: "5,45 24,35 43,38 62,22 81,26 100,12" },
//   { title: "Conversion Rate", value: "18.6%", delta: "+2.1%", note: "Above last month benchmark", points: "5,40 24,44 43,28 62,24 81,20 100,10" },
//   { title: "Monthly Revenue", value: "Rs 3.2L", delta: "+10.5%", note: "Renewals and boosts are up", points: "5,48 24,38 43,36 62,26 81,18 100,6" },
// ];

// const inventoryRows = [
//   { car: "Hyundai i20 Sportz", year: "2021", price: "Rs 6,80,000", status: "Live", kms: "25,000 km", leads: "12 leads", tone: "from-[var(--color-brand-secondary)] via-[var(--color-link-primary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(34,197,94,0.10)] text-[var(--color-success-strong)]" },
//   { car: "Maruti Swift LXI", year: "2020", price: "Rs 5,25,000", status: "Featured", kms: "30,000 km", leads: "8 leads", tone: "from-[var(--color-btn-dealer-primary-end)] via-[var(--color-brand-secondary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(18,99,154,0.10)] text-[var(--color-brand-secondary)]" },
//   { car: "Honda City ZX", year: "2018", price: "Rs 9,95,000", status: "Pending", kms: "45,000 km", leads: "5 leads", tone: "from-[var(--color-brand-primary)] via-[var(--color-link-primary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(245,158,11,0.10)] text-[var(--color-warning)]" },
// ];

// const enquiries = [
//   { name: "Satish Kumar", channel: "WhatsApp", tag: "Hot", message: "Interested in the Hyundai i20. Can we schedule a test drive today?", time: "2 min ago" },
//   { name: "Rahul Mehta", channel: "Phone", tag: "Qualified", message: "Need finance eligibility and the final on-road price for Swift LXI.", time: "18 min ago" },
//   { name: "Anita Joseph", channel: "Email", tag: "Follow-up", message: "Asked for service history and exchange value on Honda City.", time: "42 min ago" },
// ];

// const notifications = [
//   { title: "Premium plan renewed", detail: "Your subscription has renewed successfully.", time: "8 min ago", tone: "emerald" },
//   { title: "Listing performance spike", detail: "Hyundai i20 received 4 new saves in the last hour.", time: "22 min ago", tone: "sky" },
//   { title: "Inventory action pending", detail: "Honda City documents need review before publishing.", time: "1 hour ago", tone: "amber" },
// ];

// const planCards = [
//   { name: "Premium Plan", usage: "40 / 80", sub: "180 days left", width: "50%" },
//   { name: "Spotlight Boosts", usage: "12 / 20", sub: "Renews in 9 days", width: "60%" },
//   { name: "Verified Leads", usage: "74 / 100", sub: "Resets monthly", width: "74%" },
// ];

// function formatToday() {
//   return new Intl.DateTimeFormat("en-US", {
//     weekday: "long",
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//   }).format(new Date());
// }

// function SectionHeader({ label, title, action }) {
//   return (
//     <div className="mb-5 flex items-center justify-between gap-3">
//       <div>
//         <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
//         <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
//       </div>
//       {action ? <button type="button" className="rounded-xl bg-white/90 px-3.5 py-2 text-sm font-medium text-[var(--color-text-muted-strong)] shadow-[0_10px_22px_rgba(148,163,184,0.12)] ring-1 ring-[var(--color-border-soft)] transition duration-300 hover:-translate-y-0.5 hover:bg-white">{action}</button> : null}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setCookie } from "@/services/cookieStore";
import {
  getCurrentUserProfile,
  getUserBusinessesWithBranches,
  mapBusinessesToBranches,
} from "@/services/user.services";
import { getBranchGallery } from "@/services/business.services";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
import { resolveWebSsoRedirectUrl } from "@/services/sso.services";
import { logout } from "@/lib/auth/authService";
import ProfileDropdown from "@/components/ProfileDropdown";
import AppTopbar from "@/components/AppTopbar";
import BranchSettingsPanel from "@/components/dealer/BranchSettingsPanel";

export default function DealerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");
  const [profileResolved, setProfileResolved] = useState(false);
  const [dealerAllowed, setDealerAllowed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

  const handleGoHome = async () => {
    const homeTarget = await resolveWebSsoRedirectUrl({ webAppUrl });
    let homeOrigin = "";
    try {
      homeOrigin = new URL(homeTarget).origin;
    } catch {
      homeOrigin = "";
    }

    const handedOff = notifyParentAndClose({
      status: "dealer_home",
      returnTo: homeTarget,
      returnOrigin: homeOrigin,
    });
    if (handedOff) return;

    if (typeof window !== "undefined") {
      window.location.href = homeTarget;
    }
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const result = await getCurrentUserProfile();
        if (!active) return;

        const userProfile = result?.profile;
        if (!userProfile) {
          setDealerAllowed(false);
          router.replace("/auth/login");
          return;
        }

        const profileRegistered = userProfile.isBusinessRegistered === true;
        if (!profileRegistered) {
          setDealerAllowed(false);
          router.replace("/auth/business-reg");
          return;
        }

        setProfile(userProfile);
        setDealerAllowed(true);
        setCookie("dashboard_mode", "dealer", { days: 365 });
      } catch {
        if (!active) return;
        setDealerAllowed(false);
        router.replace("/auth/login");
        return;
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URL(window.location.href);
    const hadReturnTo = current.searchParams.has("return_to");
    const hadReturnOrigin = current.searchParams.has("return_origin");
    if (!hadReturnTo && !hadReturnOrigin) return;

    current.searchParams.delete("return_to");
    current.searchParams.delete("return_origin");
    const nextUrl = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    const tab = String(searchParams?.get("tab") || "").trim().toLowerCase();
    if (tab === "settings") {
      setActiveTab("settings");
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = String(window.localStorage?.getItem("seaneb_active_branch_id") || "").trim();
    if (stored) setActiveBranchId(stored);
  }, []);

  useEffect(() => {
    if (!profileResolved || !dealerAllowed) return;
    if (!profile) return;

    let active = true;
    setBranches([
      {
        id: profile?.branchId || "primary",
        name: profile?.businessName || "SeaNeB Property",
        city: profile?.hometown || "Delhi",
        subtitle: profile?.hometown || "Delhi",
      },
    ]);

    const load = async () => {
      try {
        const payload = await getUserBusinessesWithBranches();
        if (!active) return;

        const mapped = mapBusinessesToBranches(payload);
        setBranches(mapped);

        let storedId = "";
        if (typeof window !== "undefined") {
          storedId = String(window.localStorage?.getItem("seaneb_active_branch_id") || "").trim();
        }
        const profileBranchId = String(profile?.branchId || "").trim();

        const findExistingId = (value) =>
          value && mapped.some((item) => item?.id === value) ? value : "";

        const preferredId =
          findExistingId(storedId) ||
          findExistingId(profileBranchId) ||
          mapped.find((item) => item?.isDefault)?.id ||
          mapped[0]?.id ||
          "";

        if (preferredId) {
          setActiveBranchId(preferredId);
          if (typeof window !== "undefined") {
            window.localStorage?.setItem("seaneb_active_branch_id", preferredId);
          }
        }
      } catch (err) {
        if (!active) return;
        console.error("[DealerDash] Failed to fetch businesses:", err);
        setBranches([]);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [dealerAllowed, profile, profileResolved]);

	  const activeBranch =
	    branches.find((item) => item?.id === activeBranchId) ||
	    branches.find((item) => item?.isDefault) ||
	    branches[0] ||
	    null;

	  const normalizedActiveBranchId =
	    activeBranchId && activeBranchId !== "primary" ? activeBranchId : "";

	  const galleryBranchId =
	    normalizedActiveBranchId ||
	    profile?.branchId ||
	    (activeBranch?.id && activeBranch?.id !== "primary" ? activeBranch?.id : "") ||
	    "";

  const buildGalleryImageUrl = (imagePath) => {
    const path = String(imagePath || "").trim();
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = String(process.env.NEXT_PUBLIC_S3_BASE_URL || "").trim().replace(/\/$/, "");
    if (baseUrl) return `${baseUrl}/${path.replace(/^\/+/, "")}`;
    return path.startsWith("/") ? path : `/${path}`;
  };

  useEffect(() => {
    if (!galleryBranchId) {
      setGalleryImages([]);
      return;
    }

    let active = true;
    const normalizeImagePath = (item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();

      const activeFlag =
        item?.is_active ?? item?.isActive ?? item?.active ?? item?.is_active_flag ?? undefined;
      if (activeFlag === false || activeFlag === 0 || String(activeFlag).trim() === "0") {
        return "";
      }

      const path = String(
        item?.image ||
          item?.imageUrl ||
          item?.image_url ||
          item?.gallery_image ||
          item?.gallery_image_url ||
          item?.url ||
          item?.path ||
          item?.file_path ||
          item?.filePath ||
          item?.fileUrl ||
          item?.fileURL ||
          item?.file_name ||
          item?.fileName ||
          item?.s3_path ||
          item?.bucket_path ||
          item?.photo ||
          item?.photo_url ||
          item?.picture ||
          item?.picture_url ||
          item?.media ||
          item?.media_url ||
          item?.file ||
          ""
      ).trim();
      if (path) return path;
      return String(
        item?.data?.image ||
          item?.data?.imageUrl ||
          item?.data?.url ||
          item?.data?.path ||
          item?.data?.file_path ||
          item?.data?.fileUrl ||
          ""
      ).trim();
    };

    const loadGallery = async () => {
      try {
        const items = await getBranchGallery(galleryBranchId);
        if (!active) return;

        setGalleryImages(
          (Array.isArray(items) ? items : [])
            .map(normalizeImagePath)
            .filter(Boolean)
        );
      } catch (err) {
        if (!active) return;
        console.error("[DealerDash] Failed to load branch gallery:", err);
        setGalleryImages([]);
      }
    };

    loadGallery();
    return () => {
      active = false;
    };
  }, [galleryBranchId, galleryRefreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event) => {
      const branchId = String(event?.detail?.branchId || "").trim();
      if (branchId && galleryBranchId && branchId !== galleryBranchId) return;
      setGalleryRefreshKey(Date.now());
    };

    window.addEventListener("seaneb_branch_gallery_changed", handler);
    return () => window.removeEventListener("seaneb_branch_gallery_changed", handler);
  }, [galleryBranchId]);

  if (!profileResolved || !dealerAllowed) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        Loading dealer dashboard...
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const handleMyAccount = () => {
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/dashboard`;
    }
  };

	    const handleSwitchProfile = () => {
	    setCookie("dashboard_mode", "dealer", { days: 365 });
	    router.replace("/auth/dealerdash");
	  };

		  const handleGoSettings = () => {
		    setActiveTab("settings");
		  };

	  return (
	    <div className="min-h-screen bg-[#f6f7fb]">
	      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] flex-col gap-4 border-r border-[#eef0f4] bg-white px-4 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:flex">
          <div className="rounded-[18px] border border-[#eef0f4] bg-[#f9fafc] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
            <div className="relative h-24 overflow-hidden rounded-2xl border border-dashed border-[#e3e7ee] bg-white/70">
              {galleryImages.length > 0 ? (
                <div className="absolute inset-0 flex items-center overflow-hidden p-1">
                  <style>
                    {`
                      @keyframes auto-scroll-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(calc(-50% - 0.25rem)); }
                      }
                      .animate-scroll-left {
                        animation: auto-scroll-left 20s linear infinite;
                      }
                      .animate-scroll-left:hover {
                        animation-play-state: paused;
                      }
                    `}
                  </style>
                  <div className="flex h-full w-max animate-scroll-left gap-1">
                    {[...galleryImages, ...galleryImages, ...galleryImages].map((imagePath, idx) => {
                      const imageUrl = buildGalleryImageUrl(imagePath);
                      return (
                        <div key={idx} className="h-full w-[88px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={`Branch gallery ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 px-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                  <div>No branch gallery images</div>
                  {galleryBranchId ? <div className="mt-1 text-[10px] normal-case text-[#64748b]">Branch ID: {galleryBranchId}</div> : null}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-[#C9A24D] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(201,162,77,0.35)]">
                {activeBranch?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeBranch.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  (activeBranch?.name || "SB").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "SB"
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1f2937]">{activeBranch?.name || activeBranch?.businessName || "Your Business"}</p>
                <p className="text-xs text-[#98a2b3]">{activeBranch?.subtitle || activeBranch?.city || ""}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium text-[#98a2b3]">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "dashboard"
                  ? "bg-[#0f172a] text-white shadow-[0_14px_24px_rgba(15,23,42,0.22)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "dashboard"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                DB
              </span>
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage_properties")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "manage_properties"
                  ? "bg-[#0f172a] text-white shadow-[0_14px_24px_rgba(15,23,42,0.22)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "manage_properties"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                MP
              </span>
              Manage Properties
            </button>
            <button type="button" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-[#f7f8fc]">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#e6e8ee] text-xs text-[#98a2b3]">PL</span>
              Post Property
            </button>
            <button type="button" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-[#f7f8fc]">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#e6e8ee] text-xs text-[#98a2b3]">PN</span>
              Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("credits")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "credits"
                  ? "bg-[#0f172a] text-white shadow-[0_14px_24px_rgba(15,23,42,0.22)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "credits"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                CR
              </span>
              Credits
            </button>
            <button type="button" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-[#f7f8fc]">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#e6e8ee] text-xs text-[#98a2b3]">CL</span>
              Clients
            </button>
		            <button
		              type="button"
		              onClick={handleGoSettings}
		              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
		                activeTab === "settings"
		                  ? "bg-[#0f172a] text-white shadow-[0_14px_24px_rgba(15,23,42,0.22)]"
		                  : "hover:bg-[#f7f8fc]"
		              }`}
		            >
		              <span
		                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
		                  activeTab === "settings"
		                    ? "bg-white/10"
		                    : "border border-[#e6e8ee] text-[#98a2b3]"
		                }`}
		              >
		                ST
		              </span>
		              Settings
		            </button>
            <button type="button" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-[#f7f8fc]">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#e6e8ee] text-xs text-[#98a2b3]">SV</span>
              Saved Clients
            </button>
          </div>

          <div className="mt-auto rounded-2xl border border-[#eef0f4] bg-[#f9fafc] px-4 py-3 text-xs text-[#98a2b3]">
            <button
              type="button"
              onClick={handleGoHome}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eef0f4] bg-white px-3 py-2 text-sm font-semibold text-[#475467]"
            >
              Go to Home
              <span className="text-xs">HM</span>
            </button>
          </div>
	        </aside>

	        <div className="flex-1 px-6 py-6">
	          <header>
	            <AppTopbar
	              branches={branches}
	              activeBranch={activeBranch}
	              onBranchChange={(nextId) => {
	                const id = String(nextId || "").trim();
	                if (!id) return;
	                setActiveBranchId(id);
	                if (typeof window !== "undefined") {
	                  window.localStorage?.setItem("seaneb_active_branch_id", id);
	                }
	              }}
	              onRegisterNewBusiness={() => router.push("/auth/business-reg")}
	              searchValue={searchQuery}
	              onSearchChange={setSearchQuery}
	              rightSlot={
	                <div className="flex items-center gap-3">
	                  <button
	                    type="button"
	                    onClick={handleGoHome}
	                    className="inline-flex min-h-[46px] items-center gap-2 rounded-[14px] border border-[#eef2f7] bg-white px-4 text-[14px] font-semibold text-[#334155] shadow-[0_10px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#dbeafe]"
	                  >
	                    <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[#0f172a] text-[11px] font-bold text-white">
	                      HM
	                    </span>
	                    Home
	                  </button>
	                  <div className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-[#eef2f7] bg-white text-xs font-semibold text-[#98a2b3] shadow-[0_10px_18px_rgba(15,23,42,0.06)]">
	                    NT
	                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
	                  </div>
	                  <ProfileDropdown
	                    fullName={profile?.fullName || profile?.displayName}
	                    seanebId={profile?.seanebId}
	                    onAccount={handleMyAccount}
	                    onSwitchProfile={handleSwitchProfile}
	                    onLogout={handleLogout}
	                  />
	                </div>
	              }
	            />
	          </header>

	          {activeTab === "dashboard" && (
	            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="mt-6">
                <h1 className="text-2xl font-semibold text-[#1f2937]">Dashboard</h1>
                <p className="mt-1 text-sm text-[#98a2b3]">Welcome back! Here&apos;s your property overview.</p>
              </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              { title: "Total Properties Posted", tone: "#C9A24D" },
              { title: "Active Listings", tone: "#4ade80" },
              { title: "Total Enquiries", tone: "#8b5cf6" },
              { title: "Shortlisted Clients", tone: "#f59e0b" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[18px] border border-[#eef0f4] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <p className="text-xl font-semibold text-[#1f2937]">0</p>
                <p className="mt-1 text-sm text-[#98a2b3]">{item.title}</p>
                <div className="mt-6 h-[2px] w-full rounded-full bg-[#f1f3f8]">
                  <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: item.tone }} />
                </div>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-[20px] border border-[#eef0f4] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1f2937]">Applications This Week</p>
                  <p className="text-xs text-[#98a2b3]">Daily breakdown of received enquiries</p>
                </div>
                <p className="text-xl font-semibold text-[#1f2937]">0</p>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-3 text-center text-xs text-[#98a2b3]">
                {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <div className="h-24 w-9 rounded-full bg-[#f5f6fa]" />
                    {day}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#eef0f4] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold text-[#1f2937]">Lead Funnel</p>
              <p className="text-xs text-[#98a2b3]">From enquiry to deal</p>
              <div className="mt-5 space-y-4 text-sm text-[#475467]">
                {["Enquiries", "Screened", "Shortlisted", "Closed"].map((step) => (
                  <div key={step}>
                    <div className="flex items-center justify-between">
                      <span>{step}</span>
                      <span className="font-semibold text-[#1f2937]">0</span>
                    </div>
                    <div className="mt-2 h-[6px] w-full rounded-full bg-[#f1f3f8]">
                      <div className="h-full w-1/3 rounded-full bg-[#C9A24D]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[#eef0f4] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1f2937]">Top Performing Properties</p>
                <p className="text-xs text-[#98a2b3]">By enquiries</p>
              </div>
              <div className="mt-10 flex h-32 items-center justify-center text-sm text-[#c0c6d4]">
                No property data yet
              </div>
            </div>

            <div className="rounded-[20px] border border-[#eef0f4] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1f2937]">Recent Activity</p>
                <span className="h-2 w-2 rounded-full bg-[#e6e8ee]" />
              </div>
              <div className="mt-10 flex h-32 items-center justify-center text-sm text-[#c0c6d4]">
                No recent activity
              </div>
            </div>
            </section>
            </div>
          )}

          {activeTab === "manage_properties" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="mt-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-[#1f2937]">Properties</h1>
                  <p className="mt-1 text-sm text-[#98a2b3]">Manage Your Properties</p>
                </div>
                <button type="button" className="flex items-center justify-center gap-2 rounded-full bg-[#0f62fe] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,98,254,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0353e9]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
                  Post a Property
                </button>
              </section>

              <section className="mt-6 rounded-[20px] border border-[#eef0f4] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <h2 className="text-base font-semibold text-[#1f2937]">Recently Posted Properties</h2>
                <div className="flex h-[320px] flex-col items-center justify-center text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f4f7f9] text-[#a1abbd]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#111827]">No properties posted yet</h3>
                  <p className="mt-2 max-w-md text-sm text-[#6b7280]">
                    Start posting by creating your first property listing. It only takes a few minutes.
                  </p>
                  <button type="button" className="mt-6 rounded-xl bg-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1e293b]">
                    Post Your First Property
                  </button>
                </div>
              </section>

              <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-[16px] border border-[#eef0f4] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f0f5ff] text-[#0f62fe]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1f2937]">0</p>
                    <p className="text-xs font-semibold text-[#98a2b3]">Total Properties</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-[16px] border border-[#eef0f4] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#edfcf2] text-[#12b76a]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1f2937]">0</p>
                    <p className="text-xs font-semibold text-[#98a2b3]">Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-[16px] border border-[#eef0f4] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fef3f2] text-[#f04438]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1f2937]">0</p>
                    <p className="text-xs font-semibold text-[#98a2b3]">Expired</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-[16px] border border-[#eef0f4] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4f3ff] text-[#7a5af8]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1f2937]">0</p>
                    <p className="text-xs font-semibold text-[#98a2b3]">Total Applications</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "credits" && (
	            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {/* Top Metrics Row */}
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#f0f9ff] text-[#0ea5e9]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
                  </div>
                  <p className="text-2xl font-bold text-[#1f2937]">0</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Available</p>
                  <p className="mt-1 text-xs text-[#98a2b3]">Credits ready to use</p>
                </div>
                <div className="rounded-[16px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V5.942c0-.754-.726-1.294-1.453-1.096V5.942a60.114 60.114 0 00-15.797 2.101c-.503.136-.837.59-.837 1.107v9.711c0 .517.334.97.837 1.107v9.711zM11.25 17.25h1.5A1.5 1.5 0 0014.25 15.75v-1.5A1.5 1.5 0 0012.75 12.75h-1.5a1.5 1.5 0 01-1.5-1.5h1.5zm-1.5-1.5a3 3 0 016 0" /></svg>
                  </div>
                  <p className="text-2xl font-bold text-[#1f2937]">0</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Purchased</p>
                  <p className="mt-1 text-xs text-[#98a2b3]">Total credits bought</p>
                </div>
                <div className="rounded-[16px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#fff7ed] text-[#f97316]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
                  </div>
                  <p className="text-2xl font-bold text-[#1f2937]">0</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#98a2b3]">Used</p>
                  <p className="mt-1 text-xs text-[#98a2b3]">Credits spent on property posts</p>
                </div>
              </section>

              {/* Transaction History Card */}
              <section className="rounded-[20px] border border-[#eef0f4] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f2937]">Transaction History</h2>
                    <p className="mt-1 text-sm text-[#98a2b3]">All credit activity</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#eef0f4] bg-white px-4 py-2 text-sm font-medium text-[#475467] shadow-sm">
                    All Types
                    <svg className="h-4 w-4 text-[#98a2b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </div>

                <div className="flex h-[320px] flex-col items-center justify-center text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#f8fafc] text-[#cbd5e1]">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[#111827]">No transactions yet</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Purchase credits to see your transaction history here.
                  </p>
                  <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1e293b]">
                    Browse Plans
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </button>
                </div>
              </section>

              {/* How Credits Work */}
              <section className="rounded-[20px] bg-[#0f172a] p-8 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <h2 className="text-base font-semibold">How Credits Work</h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  <div className="flex gap-4">
                    <div className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">1 Credit = 1 Property Post</p>
                      <p className="mt-1 text-sm text-slate-400">Each credit lets you publish one property listing on the platform.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Instant Activation</p>
                      <p className="mt-1 text-sm text-slate-400">Credits are added to your balance immediately after successful payment.</p>
                    </div>
                  </div>
                </div>
              </section>
	            </div>
	          )}

	          {activeTab === "settings" && (
	            <BranchSettingsPanel
	              activeBranch={activeBranch}
	              profile={profile}
	              branchId={galleryBranchId}
	            />
	          )}
	        </div>
	      </div>
	    </div>
	  );
	}

// export default function DealerDashboardPage() {
//   const currentDateLabel = useMemo(() => formatToday(), []);
//   const { dealerName } = useDealerDash();

//   return (
//     <>
//       <div className="rounded-[34px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(248,250,252,0.68)_100%)] p-5 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur-xl md:p-6">
//         <section className="rounded-[30px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-dealer-hero-mid)_45%,var(--color-dealer-hero-end)_100%)] px-6 py-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.34)] md:px-7 md:py-7">
//           <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
//             <div>
//               <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-dealer-subtitle)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
//                 Dealer Operations
//               </div>
//               <h1 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] text-white md:text-[3rem]">
//                 Welcome back, {dealerName}
//               </h1>
//               <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/88 md:text-base">
//                 Manage listings, respond to buyers faster, and keep your revenue view clean from one place.
//               </p>
//             </div>
//             <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)]">
//               <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
//                 <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Date</p>
//                 <p className="mt-2 text-base font-medium text-slate-100">{currentDateLabel}</p>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.95fr)_340px]">
//           <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_42%,var(--color-dealer-hero-end)_100%)] p-6 text-white shadow-[0_34px_90px_rgba(15,23,42,0.34)]">
//             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-dealer-overlay-hero-1),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(147,197,253,0.14),transparent_24%)]" />
//               <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
//                 <div>
//                   <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-dealer-subtitle)]">Performance overview</p>
//                   <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] md:text-[2.45rem]">Your dealership is pacing ahead this week.</h2>
//                   <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200/88">Enquiry response time is down by 18%, and featured inventory is converting better than last month.</p>
//                 </div>
//                 <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
//                   <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
//                     <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Response Time</p>
//                     <p className="mt-3 text-[2rem] font-semibold leading-none">8m</p>
//                   </div>
//                   <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
//                     <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Qualified Leads</p>
//                     <p className="mt-3 text-[2rem] font-semibold leading-none">27</p>
//                   </div>
//                   <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
//                     <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Inventory Health</p>
//                     <p className="mt-3 text-[2rem] font-semibold leading-none">94%</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.82)_100%)] p-5 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//             <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Snapshot</p>
//             <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">Dealer command center</h3>
//             <div className="mt-5 space-y-4">
//               <div className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_28px_rgba(148,163,184,0.12)]">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-medium text-slate-500">Follow-ups due</span>
//                   <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">Priority</span>
//                 </div>
//                 <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">09</p>
//               </div>
//               <div className="rounded-[24px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] p-4 text-white shadow-[0_18px_34px_rgba(15,23,42,0.22)]">
//                 <p className="text-sm text-[var(--color-text-dealer-subtitle)]">Plan health</p>
//                 <p className="mt-2 text-2xl font-semibold">Premium active</p>
//                 <p className="mt-2 max-w-[22rem] text-sm leading-6 text-slate-300 break-words">
//                   Your dealer plan is active and 74 verified leads are still available.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="mt-7 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
//           {metricCards.map((card) => (
//             <article key={card.title} className="rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.88)_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)]">
//               <p className="text-sm font-medium text-slate-500">{card.title}</p>
//               <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">{card.value}</p>
//               <div className="mt-4 flex items-center justify-between gap-3">
//                 <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">{card.delta}</span>
//                 <span className="text-xs text-slate-500">{card.note}</span>
//               </div>
//               <div className="mt-5 h-16 rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/50">
//                 <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full">
//                   <polyline fill="none" stroke="var(--color-btn-dealer-primary-start)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" points={card.points} />
//                 </svg>
//               </div>
//             </article>
//           ))}
//         </section>

//         <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
//           <div className="space-y-6">
//             <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//               <SectionHeader label="Listings" title="Inventory overview" action="Manage inventory" />
//               <div className="overflow-hidden rounded-[24px] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/50">
//                 <div className="hidden grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr] gap-3 bg-slate-50/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:grid"><span>Vehicle</span><span>Price</span><span>Status</span><span>KMs</span><span>Leads</span></div>
//                 <div className="divide-y divide-slate-200/80">
//                   {inventoryRows.map((row) => (
//                     <article key={row.car} className="grid gap-4 px-4 py-4 transition duration-300 hover:bg-[rgba(18,99,154,0.05)] md:grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr] md:px-5">
//                       <div className="flex min-w-0 items-center gap-4">
//                         <div className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${row.tone} shadow-lg shadow-slate-950/10`}>
//                           <div className="absolute inset-x-2 top-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">{row.year}</div>
//                           <div className="absolute bottom-2 left-2 right-2 h-6 rounded-[10px] border border-white/10 bg-slate-950/30" />
//                         </div>
//                         <div className="min-w-0">
//                           <p className="truncate text-sm font-semibold text-slate-950 md:text-[15px]">{row.car}</p>
//                           <p className="mt-1 text-sm text-slate-500">Recently optimized listing</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center text-sm font-semibold text-slate-900">{row.price}</div>
//                       <div className="flex items-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.badge}`}>{row.status}</span></div>
//                       <div className="flex items-center text-sm text-slate-500">{row.kms}</div>
//                       <div className="flex items-center text-sm font-medium text-slate-700">{row.leads}</div>
//                     </article>
//                   ))}
//                 </div>
//               </div>
//             </section>

//             <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//               <SectionHeader label="Revenue" title="Plans and performance" action="Manage plans" />
//               <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
//                 <div className="rounded-[26px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] p-5 text-white shadow-[0_22px_44px_rgba(15,23,42,0.22)]">
//                   <div className="flex items-center justify-between gap-3">
//                     <div>
//                       <p className="text-sm text-slate-400">Revenue trend</p>
//                       <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Rs 7.5L</p>
//                     </div>
//                     <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">+14% YoY</span>
//                   </div>
//                   <div className="mt-6 flex h-40 items-end gap-3">
//                     {[48, 78, 64, 96, 84, 122, 138].map((height) => (
//                       <div key={height} className="flex-1 rounded-t-[18px] bg-[linear-gradient(180deg,var(--color-btn-dealer-primary-end)_0%,var(--color-btn-dealer-primary-start)_100%)]" style={{ height }} />
//                     ))}
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   {planCards.map((plan) => (
//                     <div key={plan.name} className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-[0_14px_28px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50">
//                       <div className="flex items-center justify-between gap-3">
//                         <div>
//                           <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
//                           <p className="mt-1 text-xs text-slate-500">{plan.sub}</p>
//                         </div>
//                         <span className="text-sm font-medium text-slate-700">{plan.usage}</span>
//                       </div>
//                       <div className="mt-4 h-2.5 rounded-full bg-slate-200">
//                         <div className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--color-brand-primary)_0%,var(--color-brand-secondary)_100%)]" style={{ width: plan.width }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </section>
//           </div>

//           <div className="space-y-6">
//             <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//               <SectionHeader label="Inbox" title="Latest enquiries" action="Open inbox" />
//               <div className="space-y-4">
//                 {enquiries.map((item) => (
//                   <article key={item.name} className="rounded-[24px] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 shadow-[0_14px_30px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(148,163,184,0.14)]">
//                     <div className="flex items-start gap-3">
//                       <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">{item.name.charAt(0)}</div>
//                       <div className="min-w-0 flex-1">
//                         <div className="flex flex-wrap items-center justify-between gap-2">
//                           <div>
//                             <p className="text-sm font-semibold text-slate-950">{item.name}</p>
//                             <p className="text-xs text-slate-400">{item.channel}</p>
//                           </div>
//                           <span className="rounded-full bg-[rgba(18,99,154,0.10)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-secondary)]">{item.tag}</span>
//                         </div>
//                         <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm shadow-slate-200/60">{item.message}</div>
//                         <p className="mt-3 text-xs text-slate-400">{item.time}</p>
//                       </div>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             </section>

//             <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//               <SectionHeader label="Alerts" title="Notifications" />
//               <div className="space-y-3">
//                 {notifications.map((item) => (
//                   <article key={item.title} className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_28px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(148,163,184,0.14)]">
//                     <div className="flex items-start gap-3">
//                       <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${item.tone === "emerald" ? "bg-emerald-500/12 text-emerald-700" : item.tone === "amber" ? "bg-amber-500/12 text-amber-700" : "bg-[rgba(18,99,154,0.12)] text-[var(--color-brand-secondary)]"}`}>
//                         <span className="h-2.5 w-2.5 rounded-full bg-current" />
//                       </span>
//                       <div className="min-w-0 flex-1">
//                         <div className="flex items-start justify-between gap-3">
//                           <p className="text-sm font-semibold text-slate-900">{item.title}</p>
//                           <span className="text-xs text-slate-400">{item.time}</span>
//                         </div>
//                         <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
//                       </div>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             </section>

//             <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
//               <SectionHeader label="Recent activity" title="What changed today" />
//               <div className="space-y-3">
//                 {["John's Car Hub upgraded to Premium Plan.", "Akash Singh shortlisted 2 listings from your inventory.", "A duplicate enquiry was auto-merged into Rahul Mehta's thread."].map((item) => (
//                   <div key={item} className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-sm leading-6 text-slate-600 shadow-[0_12px_24px_rgba(148,163,184,0.08)] ring-1 ring-slate-200/50">{item}</div>
//                 ))}
//               </div>
//             </section>
//           </div>
//         </section>

//         <footer className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] px-6 py-8 text-white shadow-[0_24px_50px_rgba(15,23,42,0.28)] md:px-8">
//           <div className="grid gap-8 md:grid-cols-4">
//             <div>
//               <Image src="/logo/white-logo-2.png" alt="SeaNeB Auto" width={140} height={44} className="h-auto w-[130px]" />
//               <p className="mt-4 text-sm leading-7 text-slate-300">Dealer dashboard preview for SeaNeB Auto. Live inventory, enquiries, and plan tools will roll out here soon.</p>
//             </div>
//             <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">About</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>About</span><span>Partner</span><span>Contact</span></div></div>
//             <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">Resources</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>Blog</span><span>Support</span><span>FAQs</span></div></div>
//             <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">Status</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>Preview Dashboard</span><span>Features Coming Soon</span><span>SeaNeB Auto</span></div></div>
//           </div>
//           <div className="mt-8 border-t border-white/10 pt-4 text-sm text-slate-300">Copyright 2026 SeaNeB Auto. All rights reserved.</div>
//         </footer>
//       </div>
//     </>
//   );
// }
