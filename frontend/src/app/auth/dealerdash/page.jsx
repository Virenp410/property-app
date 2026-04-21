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
import { getBranchGallery, getPropertyCredits, getPropertyCounts } from "@/services/business.services";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
import { resolveWebSsoRedirectUrl } from "@/services/sso.services";
import { logout } from "@/lib/auth/authService";
import ProfileDropdown from "@/components/ProfileDropdown";
import AppTopbar from "@/components/AppTopbar";
import BranchSettingsPanel from "@/components/dealer/BranchSettingsPanel";
import ImageCarousel from "@/components/ImageCarousel";
import PostPropertyForm from "@/components/feature/property/PostPropertyForm";
import ManagePropertiesView from "@/components/dealer/ManagePropertiesView";
import PlansPage from "./plans/page";

export default function DealerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_APP_URL ?? ""
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
  const [creditsData, setCreditsData] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsError, setCreditsError] = useState("");
  const [propertyCounts, setPropertyCounts] = useState(null);
  const [propertyCountsLoading, setPropertyCountsLoading] = useState(false);

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
    const allowedTabs = new Set([
      "dashboard",
      "manage_properties",
      "post_property",
      "plans",
      "credits",
      "leads",
      "settings",
    ]);

    if (allowedTabs.has(tab)) {
      setActiveTab(tab);
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

  // Fetch credits whenever the credits tab is active and we have a branchId
  useEffect(() => {
    if (activeTab !== "credits") return;
    if (!galleryBranchId) return;
    if (creditsData || creditsLoading) return;

    let cancelled = false;
    setCreditsLoading(true);
    setCreditsError("");
    getPropertyCredits(galleryBranchId)
      .then((data) => { if (!cancelled) setCreditsData(data); })
      .catch((err) => { if (!cancelled) setCreditsError(err?.response?.data?.error?.message || err?.message || "Failed to load credits."); })
      .finally(() => { if (!cancelled) setCreditsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, galleryBranchId]);

  // Fetch property counts whenever the dashboard tab is active
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    if (propertyCounts || propertyCountsLoading) return;

    let cancelled = false;
    setPropertyCountsLoading(true);
    getPropertyCounts()
      .then((data) => { if (!cancelled) setPropertyCounts(data); })
      .catch((err) => { if (!cancelled) console.error("Failed to load property counts:", err); })
      .finally(() => { if (!cancelled) setPropertyCountsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const buildGalleryImageUrl = (imagePath) => {
    const path = String(imagePath || "").trim();
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = String(process.env.NEXT_PUBLIC_S3_BASE_URL || process.env.NEXT_PUBLIC_MS3_S3_BASE_URL || "").trim().replace(/\/$/, "");
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
          {/* ── Branch Hero Card ── */}
          <div className="relative overflow-hidden rounded-[22px] border border-[#eef0f4] shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
            {/* Tall Carousel */}
            <div className="relative h-48 w-full bg-gradient-to-br from-[#e8dfc8] to-[#d5c9a8]">
              {galleryImages.length > 0 ? (
                <ImageCarousel
                  images={galleryImages.map(img => buildGalleryImageUrl(img))}
                  className="h-full w-full"
                  autoPlay={true}
                  autoPlayInterval={3500}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/30 backdrop-blur-sm">
                    <svg className="h-7 w-7 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-white/70">Add gallery images</p>
                </div>
              )}
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

              {/* Branch info overlaid at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-4 pb-4 pt-10">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#C9A24D] text-sm font-bold text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)] ring-2 ring-white/30">
                  {activeBranch?.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={buildGalleryImageUrl(activeBranch.logo)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (activeBranch?.name || "SB").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "SB"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white drop-shadow-md">{activeBranch?.name || activeBranch?.businessName || "Your Business"}</p>
                  <p className="text-[11px] text-white/70">{activeBranch?.subtitle || activeBranch?.city || "Add your city"}</p>
                </div>
              </div>
            </div>

            {/* Verified / quick stats strip */}
            <div className="flex items-center justify-between bg-white px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-[11px] font-semibold text-[#15803d]">Branch Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#FBF6EA] px-2.5 py-0.5 text-[11px] font-bold text-[#C9A24D]">
                  {galleryImages.length} photos
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium text-[#98a2b3]">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "dashboard"
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
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
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
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
            <button
              type="button"
              onClick={() => setActiveTab("post_property")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "post_property"
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "post_property"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                PL
              </span>
              Post Property
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "plans"
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "plans"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                PN
              </span>
              Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("credits")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "credits"
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
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
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${
                activeTab === "leads"
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
                  : "hover:bg-[#f7f8fc]"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                  activeTab === "leads"
                    ? "bg-white/10"
                    : "border border-[#e6e8ee] text-[#98a2b3]"
                }`}
              >
                LD
              </span>
              Leads
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
                  ? "bg-[#C9A24D] text-white shadow-[0_14px_24px_rgba(201,162,77,0.25)]"
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
              { title: "Total Properties Posted", key: "total" },
              { title: "Active Listings", key: "active" },
              { title: "Total Enquiries", tone: "#C9A24D" },
              { title: "Shortlisted Clients", tone: "#C9A24D" },
            ].map((item) => {
              const countValue = item.key ? (propertyCounts?.[item.key] ?? 0) : 0;
              return (
                <div
                  key={item.title}
                  className="rounded-[18px] border border-[#eef0f4] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-xl font-semibold text-[#1f2937]">{countValue}</p>
                  <p className="mt-1 text-sm text-[#98a2b3]">{item.title}</p>
                  <div className="mt-6 h-[2px] w-full rounded-full bg-[#f1f3f8]">
                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: item.tone || "#C9A24D" }} />
                  </div>
                </div>
              );
            })}
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
	                <button
                    type="button"
                    onClick={() => setActiveTab("post_property")}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#0f62fe] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,98,254,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0353e9]"
                  >
	                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
	                  Post a Property
	                </button>
	              </section>


                <ManagePropertiesView
                  onPostProperty={() => setActiveTab("post_property")}
                />
	            </div>
	          )}

          {activeTab === "leads" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="mt-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-[#1f2937]">Leads</h1>
                  <p className="mt-1 text-sm text-[#98a2b3]">Track and manage incoming seller and buyer leads.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="rounded-full border border-[#eef0f4] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm transition hover:bg-[#f8fafc]"
                >
                  Back to Dashboard
                </button>
              </section>

              <section className="mt-6 rounded-[20px] border border-[#eef0f4] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col items-center justify-center gap-4 text-center text-[#475467]">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eff6ff] text-[#0f62fe]">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-9 4h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-[#111827]">Lead flow is empty</h2>
                  <p className="max-w-xl text-sm text-[#6b7280]">
                    Leads will appear here once buyers or sellers start contacting your listings. Use this view to quickly check status and follow up.
                  </p>
                </div>
              </section>
            </div>
          )}



          {activeTab === "post_property" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-[#1f2937]">Post a Property</h1>
                    <p className="mt-1 text-sm text-[#98a2b3]">Fill in the details to list your property on SeaNeb Realty.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage_properties")}
                    className="flex items-center gap-2 rounded-xl border border-[#eef0f4] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm transition hover:bg-[#f8fafc]"
                  >
                    ← Back to Properties
                  </button>
                </div>
                <PostPropertyForm />
              </section>
            </div>
          )}

          {activeTab === "plans" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PlansPage />
            </div>
          )}

          {activeTab === "credits" && (() => {
            const cd = creditsData || { available: 0, purchased: 0, used: 0, transactions: [] };
            return (
	            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {/* Top Metrics Row */}
              <section className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Available", sub: "Credits ready to use", value: cd.available, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Purchased", sub: "Total credits bought", value: cd.purchased, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Used", sub: "Credits spent on posts", value: cd.used, color: "text-amber-600", bg: "bg-[#FBF6EA]" },
                ].map(({ label, sub, value, color, bg }) => (
                  <div key={label} className="rounded-[16px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${bg} ${color}`}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>
                    </div>
                    {creditsLoading ? (
                      <div className="h-8 w-16 animate-pulse rounded-lg bg-[#f1f5f9]" />
                    ) : (
                      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                    )}
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#98a2b3]">{label}</p>
                    <p className="mt-1 text-xs text-[#98a2b3]">{sub}</p>
                  </div>
                ))}
              </section>

              {/* Error banner */}
              {creditsError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  {creditsError}
                  <button onClick={() => { setCreditsError(""); setCreditsData(null); }} className="ml-auto underline">Retry</button>
                </div>
              )}

              {/* Transaction History Card */}
              <section className="rounded-[20px] border border-[#eef0f4] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f2937]">Transaction History</h2>
                    <p className="mt-1 text-sm text-[#98a2b3]">All credit activity</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#eef0f4] bg-white px-4 py-2 text-sm font-medium text-[#475467] shadow-sm">
                    All Types
                    <svg className="h-4 w-4 text-[#98a2b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </div>

                {creditsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-[#f1f5f9]" />
                    ))}
                  </div>
                ) : cd.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#f1f5f9]">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#98a2b3]">Type</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#98a2b3]">Credits</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#98a2b3]">Date</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[#98a2b3]">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8fafc]">
                        {cd.transactions.map((tx, i) => {
                          const isTopup = (tx.type || "").toLowerCase().includes("top") || Number(tx.credits ?? tx.amount ?? 0) > 0;
                          return (
                            <tr key={tx.id || i} className="transition hover:bg-[#f8fafc]">
                              <td className="py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isTopup ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {isTopup ? "+ Topup" : "− Used"}
                                </span>
                              </td>
                              <td className={`py-3 font-semibold ${ isTopup ? "text-green-600" : "text-amber-600" }`}>
                                {isTopup ? "+" : "−"}{Math.abs(tx.credits ?? tx.amount ?? 0)}
                              </td>
                              <td className="py-3 text-[#6b7280]">
                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="py-3 text-[#98a2b3]">{tx.note || tx.description || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex h-[280px] flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#f8fafc] text-[#cbd5e1]">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-[#111827]">No transactions yet</h3>
                    <p className="mt-1 text-sm text-[#6b7280]">Purchase credits to see your transaction history here.</p>
                    <button type="button" onClick={() => setActiveTab("plans")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1e293b]">
                      Browse Plans
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </button>
                  </div>
                )}
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
            );
          })()}

	          {activeTab === "settings" && (
	            <BranchSettingsPanel
	              activeBranch={activeBranch}
	              profile={profile}
	              branchId={galleryBranchId}
	              onBranchUpdate={async (data) => {
	                // Perform a full refresh from server to ensure data integrity
	                try {
	                  const payload = await getUserBusinessesWithBranches();
	                  const mapped = mapBusinessesToBranches(payload);
	                  console.log("[DealerDash] Branch update refresh complete, mapped branches:", mapped.map(b => ({ id: b.id, name: b.name, logo: b.logo })));
	                  setBranches(mapped);
	                } catch (err) {
	                  console.error("[DealerDash] Refresh after branch update failed:", err);
	                }
	              }}
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
