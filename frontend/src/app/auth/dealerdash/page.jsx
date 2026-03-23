"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useDealerDash } from "./_components/DealerDashContext";

const metricCards = [
  { title: "Live Inventory", value: "128", delta: "+8.4%", note: "12 fresh listings this week", points: "5,42 24,28 43,34 62,18 81,22 100,8" },
  { title: "Open Enquiries", value: "43", delta: "+12%", note: "7 high-intent buyers today", points: "5,45 24,35 43,38 62,22 81,26 100,12" },
  { title: "Conversion Rate", value: "18.6%", delta: "+2.1%", note: "Above last month benchmark", points: "5,40 24,44 43,28 62,24 81,20 100,10" },
  { title: "Monthly Revenue", value: "Rs 3.2L", delta: "+10.5%", note: "Renewals and boosts are up", points: "5,48 24,38 43,36 62,26 81,18 100,6" },
];

const inventoryRows = [
  { car: "Hyundai i20 Sportz", year: "2021", price: "Rs 6,80,000", status: "Live", kms: "25,000 km", leads: "12 leads", tone: "from-[var(--color-brand-secondary)] via-[var(--color-link-primary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(34,197,94,0.10)] text-[var(--color-success-strong)]" },
  { car: "Maruti Swift LXI", year: "2020", price: "Rs 5,25,000", status: "Featured", kms: "30,000 km", leads: "8 leads", tone: "from-[var(--color-btn-dealer-primary-end)] via-[var(--color-brand-secondary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(18,99,154,0.10)] text-[var(--color-brand-secondary)]" },
  { car: "Honda City ZX", year: "2018", price: "Rs 9,95,000", status: "Pending", kms: "45,000 km", leads: "5 leads", tone: "from-[var(--color-brand-primary)] via-[var(--color-link-primary)] to-[var(--color-dealer-hero-start)]", badge: "bg-[rgba(245,158,11,0.10)] text-[var(--color-warning)]" },
];

const enquiries = [
  { name: "Satish Kumar", channel: "WhatsApp", tag: "Hot", message: "Interested in the Hyundai i20. Can we schedule a test drive today?", time: "2 min ago" },
  { name: "Rahul Mehta", channel: "Phone", tag: "Qualified", message: "Need finance eligibility and the final on-road price for Swift LXI.", time: "18 min ago" },
  { name: "Anita Joseph", channel: "Email", tag: "Follow-up", message: "Asked for service history and exchange value on Honda City.", time: "42 min ago" },
];

const notifications = [
  { title: "Premium plan renewed", detail: "Your subscription has renewed successfully.", time: "8 min ago", tone: "emerald" },
  { title: "Listing performance spike", detail: "Hyundai i20 received 4 new saves in the last hour.", time: "22 min ago", tone: "sky" },
  { title: "Inventory action pending", detail: "Honda City documents need review before publishing.", time: "1 hour ago", tone: "amber" },
];

const planCards = [
  { name: "Premium Plan", usage: "40 / 80", sub: "180 days left", width: "50%" },
  { name: "Spotlight Boosts", usage: "12 / 20", sub: "Renews in 9 days", width: "60%" },
  { name: "Verified Leads", usage: "74 / 100", sub: "Resets monthly", width: "74%" },
];

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function SectionHeader({ label, title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
      </div>
      {action ? <button type="button" className="rounded-xl bg-white/90 px-3.5 py-2 text-sm font-medium text-[var(--color-text-muted-strong)] shadow-[0_10px_22px_rgba(148,163,184,0.12)] ring-1 ring-[var(--color-border-soft)] transition duration-300 hover:-translate-y-0.5 hover:bg-white">{action}</button> : null}
    </div>
  );
}

export default function DealerDashboardPage() {
  const currentDateLabel = useMemo(() => formatToday(), []);
  const { dealerName } = useDealerDash();

  return (
    <>
      <div className="rounded-[34px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(248,250,252,0.68)_100%)] p-5 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur-xl md:p-6">
        <section className="rounded-[30px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-dealer-hero-mid)_45%,var(--color-dealer-hero-end)_100%)] px-6 py-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.34)] md:px-7 md:py-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-dealer-subtitle)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                Dealer Operations
              </div>
              <h1 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] text-white md:text-[3rem]">
                Welcome back, {dealerName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/88 md:text-base">
                Manage listings, respond to buyers faster, and keep your revenue view clean from one place.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)]">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Date</p>
                <p className="mt-2 text-base font-medium text-slate-100">{currentDateLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.95fr)_340px]">
          <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_42%,var(--color-dealer-hero-end)_100%)] p-6 text-white shadow-[0_34px_90px_rgba(15,23,42,0.34)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-dealer-overlay-hero-1),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(147,197,253,0.14),transparent_24%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-dealer-subtitle)]">Performance overview</p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] md:text-[2.45rem]">Your dealership is pacing ahead this week.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200/88">Enquiry response time is down by 18%, and featured inventory is converting better than last month.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Response Time</p>
                    <p className="mt-3 text-[2rem] font-semibold leading-none">8m</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Qualified Leads</p>
                    <p className="mt-3 text-[2rem] font-semibold leading-none">27</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Inventory Health</p>
                    <p className="mt-3 text-[2rem] font-semibold leading-none">94%</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.82)_100%)] p-5 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Snapshot</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">Dealer command center</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_28px_rgba(148,163,184,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Follow-ups due</span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">Priority</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">09</p>
              </div>
              <div className="rounded-[24px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] p-4 text-white shadow-[0_18px_34px_rgba(15,23,42,0.22)]">
                <p className="text-sm text-[var(--color-text-dealer-subtitle)]">Plan health</p>
                <p className="mt-2 text-2xl font-semibold">Premium active</p>
                <p className="mt-2 max-w-[22rem] text-sm leading-6 text-slate-300 break-words">
                  Your dealer plan is active and 74 verified leads are still available.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {metricCards.map((card) => (
            <article key={card.title} className="rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.88)_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)]">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">{card.value}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">{card.delta}</span>
                <span className="text-xs text-slate-500">{card.note}</span>
              </div>
              <div className="mt-5 h-16 rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/50">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full">
                  <polyline fill="none" stroke="var(--color-btn-dealer-primary-start)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" points={card.points} />
                </svg>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
              <SectionHeader label="Listings" title="Inventory overview" action="Manage inventory" />
              <div className="overflow-hidden rounded-[24px] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/50">
                <div className="hidden grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr] gap-3 bg-slate-50/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 md:grid"><span>Vehicle</span><span>Price</span><span>Status</span><span>KMs</span><span>Leads</span></div>
                <div className="divide-y divide-slate-200/80">
                  {inventoryRows.map((row) => (
                    <article key={row.car} className="grid gap-4 px-4 py-4 transition duration-300 hover:bg-[rgba(18,99,154,0.05)] md:grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr] md:px-5">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${row.tone} shadow-lg shadow-slate-950/10`}>
                          <div className="absolute inset-x-2 top-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">{row.year}</div>
                          <div className="absolute bottom-2 left-2 right-2 h-6 rounded-[10px] border border-white/10 bg-slate-950/30" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 md:text-[15px]">{row.car}</p>
                          <p className="mt-1 text-sm text-slate-500">Recently optimized listing</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-slate-900">{row.price}</div>
                      <div className="flex items-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.badge}`}>{row.status}</span></div>
                      <div className="flex items-center text-sm text-slate-500">{row.kms}</div>
                      <div className="flex items-center text-sm font-medium text-slate-700">{row.leads}</div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
              <SectionHeader label="Revenue" title="Plans and performance" action="Manage plans" />
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[26px] bg-[linear-gradient(135deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] p-5 text-white shadow-[0_22px_44px_rgba(15,23,42,0.22)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Revenue trend</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Rs 7.5L</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">+14% YoY</span>
                  </div>
                  <div className="mt-6 flex h-40 items-end gap-3">
                    {[48, 78, 64, 96, 84, 122, 138].map((height) => (
                      <div key={height} className="flex-1 rounded-t-[18px] bg-[linear-gradient(180deg,var(--color-btn-dealer-primary-end)_0%,var(--color-btn-dealer-primary-start)_100%)]" style={{ height }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {planCards.map((plan) => (
                    <div key={plan.name} className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-[0_14px_28px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{plan.sub}</p>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{plan.usage}</span>
                      </div>
                      <div className="mt-4 h-2.5 rounded-full bg-slate-200">
                        <div className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--color-brand-primary)_0%,var(--color-brand-secondary)_100%)]" style={{ width: plan.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
              <SectionHeader label="Inbox" title="Latest enquiries" action="Open inbox" />
              <div className="space-y-4">
                {enquiries.map((item) => (
                  <article key={item.name} className="rounded-[24px] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 shadow-[0_14px_30px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(148,163,184,0.14)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">{item.name.charAt(0)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.channel}</p>
                          </div>
                          <span className="rounded-full bg-[rgba(18,99,154,0.10)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-secondary)]">{item.tag}</span>
                        </div>
                        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm shadow-slate-200/60">{item.message}</div>
                        <p className="mt-3 text-xs text-slate-400">{item.time}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
              <SectionHeader label="Alerts" title="Notifications" />
              <div className="space-y-3">
                {notifications.map((item) => (
                  <article key={item.title} className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_28px_rgba(148,163,184,0.1)] ring-1 ring-slate-200/50 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(148,163,184,0.14)]">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${item.tone === "emerald" ? "bg-emerald-500/12 text-emerald-700" : item.tone === "amber" ? "bg-amber-500/12 text-amber-700" : "bg-[rgba(18,99,154,0.12)] text-[var(--color-brand-secondary)]"}`}>
                        <span className="h-2.5 w-2.5 rounded-full bg-current" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)] ring-1 ring-white/70">
              <SectionHeader label="Recent activity" title="What changed today" />
              <div className="space-y-3">
                {["John's Car Hub upgraded to Premium Plan.", "Akash Singh shortlisted 2 listings from your inventory.", "A duplicate enquiry was auto-merged into Rahul Mehta's thread."].map((item) => (
                  <div key={item} className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-sm leading-6 text-slate-600 shadow-[0_12px_24px_rgba(148,163,184,0.08)] ring-1 ring-slate-200/50">{item}</div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <footer className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,var(--color-dealer-hero-start)_0%,var(--color-brand-primary)_100%)] px-6 py-8 text-white shadow-[0_24px_50px_rgba(15,23,42,0.28)] md:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Image src="/logo/white-logo-2.png" alt="SeaNeB Auto" width={140} height={44} className="h-auto w-[130px]" />
              <p className="mt-4 text-sm leading-7 text-slate-300">Dealer dashboard preview for SeaNeB Auto. Live inventory, enquiries, and plan tools will roll out here soon.</p>
            </div>
            <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">About</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>About</span><span>Partner</span><span>Contact</span></div></div>
            <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">Resources</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>Blog</span><span>Support</span><span>FAQs</span></div></div>
            <div><h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white">Status</h2><div className="mt-4 grid gap-2 text-sm text-slate-300"><span>Preview Dashboard</span><span>Features Coming Soon</span><span>SeaNeB Auto</span></div></div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-4 text-sm text-slate-300">Copyright 2026 SeaNeB Auto. All rights reserved.</div>
        </footer>
      </div>
    </>
  );
}
