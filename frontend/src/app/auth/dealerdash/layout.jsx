// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import { ChevronLeft } from "lucide-react";
// import { setCookie } from "@/services/cookieStore";
// import { getCurrentUserProfile } from "@/services/user.services";
// import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
// import { resolveWebSsoRedirectUrl } from "@/services/sso.services";
// import { DealerDashProvider } from "./_components/DealerDashContext";

// const sidebarItems = [
//   ["dashboard", "Dashboard", "grid", "/auth/dealerdash"],
//   ["inventory", "Inventory", "car", "/auth/dealerdash/inventory"],
//   ["enquiries", "Enquiries", "chat", "/auth/dealerdash/enquiries"],
//   ["plans", "Plans", "layers", "/auth/dealerdash/plans"],
//   ["customers", "Customers", "users", "/auth/dealerdash/customers"],
//   ["reports", "Reports", "chart", "/auth/dealerdash/reports"],
// ];

// function Icon({ type, className = "h-5 w-5" }) {
//   const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", className };
//   if (type === "grid") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>;
//   if (type === "car") return <svg {...common}><path d="M5 15.5h14l-1.4-4.4a2 2 0 0 0-1.9-1.4H8.3a2 2 0 0 0-1.9 1.4z" /><path d="M4 15.5h16v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="7.5" cy="17.5" r="1" fill="currentColor" stroke="none" /><circle cx="16.5" cy="17.5" r="1" fill="currentColor" stroke="none" /></svg>;
//   if (type === "chat") return <svg {...common}><path d="M6 8a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4.5L8 20v-4H10a4 4 0 0 1-4-4z" /></svg>;
//   if (type === "layers") return <svg {...common}><path d="M12 4 4 8l8 4 8-4z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>;
//   if (type === "users") return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6.5 19a5.5 5.5 0 0 1 11 0" /><path d="M18 8a2.5 2.5 0 1 1 0 5" /></svg>;
//   if (type === "chart") return <svg {...common}><path d="M4 19.5h16" /><path d="M7 16v-4" /><path d="M12 16V7" /><path d="M17 16v-7" /></svg>;
//   if (type === "bolt") return <svg {...common}><path d="M13 2 6 13h5l-1 9 8-12h-5z" /></svg>;
//   if (type === "plus") return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
//   return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
// }

// function isActive(pathname, href) {
//   if (href === "/auth/dealerdash") return pathname === href;
//   return pathname === href || pathname.startsWith(`${href}/`);
// }

// export default function DealerDashLayout({ children }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const webAppUrl = String(
//     process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
//   ).replace(/\/$/, "");
//   const [profileResolved, setProfileResolved] = useState(false);
//   const [dealerAllowed, setDealerAllowed] = useState(false);
//   const [collapsed, setCollapsed] = useState(false);
//   const [dealerName, setDealerName] = useState("Dealer Dashboard");

//   const handleGoHome = async () => {
//     const homeTarget = await resolveWebSsoRedirectUrl({ webAppUrl });
//     let homeOrigin = "";
//     try {
//       homeOrigin = new URL(homeTarget).origin;
//     } catch {
//       homeOrigin = "";
//     }
//     const handedOff = notifyParentAndClose({
//       status: "dealer_home",
//       returnTo: homeTarget,
//       returnOrigin: homeOrigin,
//     });
//     if (handedOff) return;

//     if (typeof window !== "undefined") {
//       window.location.href = homeTarget;
//     }
//   };

//   useEffect(() => {
//     let active = true;

//     const loadDashboard = async () => {
//       try {
//         const result = await getCurrentUserProfile();
//         if (!active) return;

//         const profile = result?.profile;
//         if (!profile) {
//           setDealerAllowed(false);
//           router.replace("/auth/login");
//           return;
//         }

//         if (profile.isBusinessRegistered !== true) {
//           setDealerAllowed(false);
//           router.replace("/auth/business-reg");
//           return;
//         }

//         setDealerName(profile.businessName || profile.displayName || "Dealer Dashboard");
//         setDealerAllowed(true);
//         setCookie("dashboard_mode", "dealer", { days: 365 });
//       } catch {
//         if (!active) return;
//         setDealerAllowed(false);
//         router.replace("/auth/login");
//       } finally {
//         if (active) setProfileResolved(true);
//       }
//     };

//     loadDashboard();
//     return () => {
//       active = false;
//     };
//   }, [router]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const current = new URL(window.location.href);
//     if (!current.searchParams.has("return_to") && !current.searchParams.has("return_origin")) return;
//     current.searchParams.delete("return_to");
//     current.searchParams.delete("return_origin");
//     window.history.replaceState({}, "", `${current.pathname}${current.search}${current.hash}`);
//   }, []);

//   if (!profileResolved || !dealerAllowed) {
//     return (
//       <div className="min-h-screen bg-slate-950 px-6 py-10 text-center text-sm text-slate-300">
//         Loading dealer dashboard...
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-dealer-overlay-page-1),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(18,99,154,0.12),transparent_22%),radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.84),transparent_48%),linear-gradient(180deg,var(--color-page-bg-soft)_0%,var(--color-page-bg-dealer-start)_48%,var(--color-page-bg-dealer-end)_100%)]">
//       <div className="mx-auto h-full max-w-[1600px] px-4 pt-4 md:px-5 lg:px-6">
//         <header className="sticky top-4 z-30 rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(248,250,252,0.76)_100%)] px-6 py-4 shadow-[0_18px_50px_rgba(148,163,184,0.16)] backdrop-blur-xl">
//           <div className="flex flex-wrap items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <Image
//                 src="/logo/white-logo-3.svg"
//                 alt="SeaNeB Auto"
//                 width={138}
//                 height={42}
//                 className="h-auto w-[126px]"
//                 priority
//               />
//               <span className="hidden rounded-full bg-[var(--color-brand-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white md:inline-flex">
//                 Dealer Dashboard
//               </span>
//             </div>
//             <div className="flex flex-wrap items-center gap-3">
//               <button
//                 type="button"
//                 onClick={handleGoHome}
//                 className="rounded-2xl bg-white/90 px-4 py-3 text-sm font-medium text-[var(--color-text-muted-strong)] shadow-[0_10px_24px_rgba(148,163,184,0.16)] ring-1 ring-[var(--color-border-soft)] transition duration-300 hover:-translate-y-0.5 hover:bg-white"
//               >
//                 Back to home
//               </button>
//               <button
//                 type="button"
//                 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--color-btn-dealer-primary-start)_0%,var(--color-btn-dealer-primary-end)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01]"
//               >
//                 <Icon type="plus" className="h-4 w-4" />
//                 Add car
//               </button>
//             </div>
//           </div>
//         </header>

//         <div className="relative h-[calc(100vh-7.5rem)] py-6">
//           <aside className={`${collapsed ? "w-[92px]" : "w-[286px]"} fixed left-[max(1.5rem,calc((100vw-min(100vw,1600px))/2+1.5rem))] top-[7.5rem] hidden h-[calc(100vh-9rem)] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,var(--color-dealer-hero-start)_0%,#082754_52%,var(--color-brand-primary)_100%)] shadow-[0_32px_90px_rgba(15,23,42,0.42)] ring-1 ring-[var(--color-border-brand-soft)]/20 backdrop-blur-xl lg:block`}>
//             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-dealer-overlay-hero-1),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(18,99,154,0.18),transparent_28%)]" />
//             <div className="relative flex h-full flex-col overflow-y-auto p-4">
//               <div className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
//                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
//                   <Image
//                     src="/favicon.png"
//                     alt="SeaNeB Auto"
//                     width={36}
//                     height={36}
//                     className="h-9 w-9 rounded-lg object-contain"
//                     priority
//                   />
//                 </div>
//                 {!collapsed ? (
//                   <div>
//                     <p className="text-sm font-semibold text-white">SeaNeB Dealer</p>
//                     <p className="text-xs text-slate-300">Premium workspace</p>
//                   </div>
//                 ) : null}
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setCollapsed((prev) => !prev)}
//                 className={`mt-6 flex h-11 items-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-medium text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:bg-white/[0.1] hover:text-white ${collapsed ? "justify-center" : "justify-between px-4"}`}
//               >
//                 {!collapsed ? <span>Collapse</span> : null}
//                 <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
//               </button>

//               <nav className="mt-7 space-y-2.5">
//                 {sidebarItems.map(([id, label, icon, href]) => {
//                   const active = isActive(pathname, href);
//                   return (
//                     <Link
//                       key={id}
//                       href={href}
//                       className={`group relative flex w-full items-center gap-3.5 rounded-2xl py-3 text-left transition-all duration-300 ${collapsed ? "justify-center px-0" : "px-3.5"} ${active ? "bg-[linear-gradient(90deg,rgba(18,99,154,0.28),rgba(255,255,255,0.08))] text-white shadow-[0_14px_30px_rgba(15,23,42,0.24)] ring-1 ring-[var(--color-border-brand-soft)]/20" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
//                     >
//                       <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full transition duration-300 ${active ? "bg-[var(--color-border-brand-soft)] shadow-[0_0_18px_rgba(147,197,253,0.85)]" : "bg-transparent group-hover:bg-white/20"}`} />
//                       <span className={`flex h-10 w-10 items-center justify-center rounded-xl border transition duration-300 ${active ? "border-[var(--color-border-brand-soft)]/10 bg-[rgba(147,197,253,0.10)] text-[var(--color-border-brand-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "border-white/5 bg-white/[0.03] group-hover:border-white/10 group-hover:bg-white/[0.08] group-hover:scale-105"}`}>
//                         <Icon type={icon} />
//                       </span>
//                       {!collapsed ? <span className="text-sm font-medium">{label}</span> : null}
//                     </Link>
//                   );
//                 })}
//               </nav>

//               <div className="mt-auto rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(147,197,253,0.14)] text-[var(--color-border-brand-soft)] ring-1 ring-[var(--color-border-brand-soft)]/10">
//                     <Icon type="bolt" />
//                   </div>
//                   {!collapsed ? (
//                     <div>
//                       <p className="text-sm font-semibold text-white">Boost visibility</p>
//                       <p className="text-xs leading-5 text-slate-300">Promote top listings for stronger lead flow.</p>
//                     </div>
//                   ) : null}
//                 </div>
//               </div>
//             </div>
//           </aside>

//           <main className={`${collapsed ? "lg:ml-[116px]" : "lg:ml-[310px]"} h-full min-w-0 overflow-y-auto pr-1 transition-[margin] duration-300`}>
//             <DealerDashProvider value={{ dealerName }}>
//               {children}
//             </DealerDashProvider>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

export default function DealerDashLayout({ children }) {
  return children;
}
