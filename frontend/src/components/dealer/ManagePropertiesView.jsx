"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useBranchPropertyList from "@/hooks/useBranchPropertyList";
import PropertyListingCard from "@/components/PropertyListingCard";
import { getPropertyDetails } from "@/services/property.services";

const safeString = (value) => String(value ?? "").trim();

const normalizeBaseUrl = (value) => safeString(value).replace(/\/+$/, "");

const resolveMediaUrl = (value) => {
  const raw = safeString(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = normalizeBaseUrl(process.env.NEXT_PUBLIC_S3_BASE_URL);
  if (!base) return raw;

  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
};

const safeParseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  const text = safeString(value);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const pickFirstText = (...values) => {
  for (const value of values) {
    const text = safeString(value);
    if (text) return text;
  }
  return "";
};

const pickImages = (item) => {
  const resolved = new Set();
  const add = (url) => {
    const next = resolveMediaUrl(url);
    if (next) resolved.add(next);
  };

  add(item?.thumbnail);
  add(item?.thumbnail_url);
  add(item?.thumb);

  const candidates = [
    item?.images,
    item?.media,
    item?.gallery,
    item?.gallery_images,
    item?.photos,
    item?.pictures,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const urls = candidate
      .map((entry) => {
        if (!entry) return "";
        if (typeof entry === "string") return entry;
        return pickFirstText(entry.url, entry.image_url, entry.path, entry.location);
      })
      .filter(Boolean);
    urls.forEach(add);
  }

  return Array.from(resolved);
};

const buildSubtitle = (item) => {
  const location = safeParseJson(item?.location) || item?.location || {};
  const city = pickFirstText(location?.city, item?.city);
  const area = pickFirstText(location?.area, location?.areaName, item?.area);
  const state = pickFirstText(location?.state, item?.state);

  const parts = [city, area, state].map((x) => safeString(x)).filter(Boolean);
  return parts.join(" · ");
};

const getTitle = (item) =>
  pickFirstText(item?.property_title, item?.propertyTitle, item?.title, item?.name);

function MetricCard({ icon, label, value, tone }) {
  const toneClasses = {
    slate: "bg-[#f8fafc] text-[#64748b] border-[#eef0f4]",
    emerald: "bg-[#ecfdf3] text-[#027a48] border-[#abefc6]",
    rose: "bg-[#fff1f3] text-[#be123c] border-[#fecdd3]",
  };
  const Icon = icon;
  return (
    <div className="rounded-[16px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl border ${toneClasses[tone] || toneClasses.slate}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-[#1f2937]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#98a2b3]">{label}</p>
    </div>
  );
}

function LoadingGrid({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-[320px] animate-pulse rounded-[20px] border border-[#eef0f4] bg-white shadow-[0_8px_30px_rgb(15,23,42,0.04)]"
        >
          <div className="h-[220px] w-full rounded-t-[20px] bg-[#f1f5f9]" />
          <div className="p-5">
            <div className="h-4 w-2/3 rounded bg-[#f1f5f9]" />
            <div className="mt-3 h-3 w-1/2 rounded bg-[#f1f5f9]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManagePropertiesView({ onPostProperty }) {
  const [tab, setTab] = useState("active");
  const [activePage, setActivePage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const limit = 10;

  const active = useBranchPropertyList({ status: "active", page: activePage, limit });
  const expired = useBranchPropertyList({ status: "expired", page: expiredPage, limit });

  const totalActive = active.total ?? active.items.length;

  const handlePropertyClick = async (item) => {
    const propertyId = String(item?.property_id || item?.id || item?._id || "").trim();
    if (!propertyId) return;

    setIsLoadingDetails(true);
    setDetailsError("");
    setSelectedProperty(null);

    try {
      const details = await getPropertyDetails(propertyId);
      setSelectedProperty({ ...item, ...details });
    } catch (error) {
      const message = String(error?.message || error || "Failed to load property details");
      setDetailsError(message);
      console.error("Failed to load property details", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  const totalExpired = expired.total ?? expired.items.length;
  const totalAll = totalActive + totalExpired;

  const current = tab === "expired" ? expired : active;
  const page = tab === "expired" ? expiredPage : activePage;
  const setPage = tab === "expired" ? setExpiredPage : setActivePage;

  const maxPage = useMemo(() => {
    if (typeof current.total !== "number") return null;
    return Math.max(1, Math.ceil(current.total / limit));
  }, [current.total]);

  const canPrev = page > 1 && !current.loading;
  const canNext = useMemo(() => {
    if (current.loading) return false;
    if (typeof maxPage === "number") return page < maxPage;
    return Array.isArray(current.items) && current.items.length >= limit;
  }, [current.loading, current.items, maxPage, page]);

  const pageLabel = maxPage ? `${page} / ${maxPage}` : String(page);

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={CheckCircle2} label="Total Properties" value={totalAll} tone="slate" />
        <MetricCard icon={CheckCircle2} label="Active" value={totalActive} tone="emerald" />
        <MetricCard icon={Clock} label="Expired" value={totalExpired} tone="rose" />
      </section>

      <section className="rounded-[20px] border border-[#eef0f4] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1f2937]">Recently Posted Properties</h2>
            <p className="mt-1 text-sm text-[#98a2b3]">Active and expired listings for this branch.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-[#e6e8ee] bg-[#f8fafc] p-1">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === "active" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:bg-white/70"
                }`}
              >
                Active <span className="ml-2 rounded-full bg-[#ecfdf3] px-2 py-0.5 text-xs text-[#027a48]">{totalActive}</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("expired")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === "expired" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:bg-white/70"
                }`}
              >
                Expired <span className="ml-2 rounded-full bg-[#fff1f3] px-2 py-0.5 text-xs text-[#be123c]">{totalExpired}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => current.refresh()}
              disabled={current.loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#eef0f4] bg-white px-4 py-2 text-sm font-semibold text-[#475569] shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${current.loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => onPostProperty?.()}
              className="inline-flex items-center gap-2 rounded-full bg-[#0f62fe] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,98,254,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0353e9]"
            >
              <Plus className="h-4 w-4" />
              Post a Property
            </button>
          </div>
        </div>

        {current.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Unable to load properties</p>
                <p className="mt-1 text-sm opacity-90">{current.error}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => current.refresh()}
                className="rounded-xl bg-rose-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-950"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {current.loading ? (
          <div className="mt-7">
            <LoadingGrid />
          </div>
        ) : Array.isArray(current.items) && current.items.length ? (
          <div className="mt-7 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {current.items.map((item, idx) => {
                const title = getTitle(item) || `Property ${idx + 1}`;
                const subtitle = buildSubtitle(item);
                const images = pickImages(item);
                return (
                  <PropertyListingCard
                    key={item?.id || item?.property_id || item?._id || `${tab}-${idx}`}
                    images={images}
                    title={title}
                    subtitle={subtitle}
                    avatarInitial={title.charAt(0)}
                    onClick={() => handlePropertyClick(item)}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eef0f4] bg-[#f8fafc] px-4 py-3">
              <p className="text-sm font-semibold text-[#475569]">Page {pageLabel}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e6e8ee] bg-white px-3 py-2 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e6e8ee] bg-white px-3 py-2 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f4f7f9] text-[#a1abbd]">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[#111827]">
              {tab === "expired" ? "No expired properties" : "No active properties"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-[#6b7280]">
              {tab === "expired"
                ? "Once listings expire, they will show up here."
                : "Start posting by creating your first property listing. It only takes a few minutes."}
            </p>
            <button
              type="button"
              onClick={() => onPostProperty?.()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1e293b]"
            >
              <Plus className="h-4 w-4" />
              Post Your First Property
            </button>
          </div>
        )}
      </section>

      {/* Property Details Modal */}
      {(selectedProperty || isLoadingDetails || detailsError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eef0f4] bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-[#0f172a]">Property Details</h2>
              <button
                onClick={() => {
                  setSelectedProperty(null);
                  setDetailsError("");
                }}
                className="text-[#64748b] hover:text-[#0f172a] transition"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading State */}
            {isLoadingDetails && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-[#0f62fe] border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[#64748b] font-medium">Loading property details...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {detailsError && !isLoadingDetails && (
              <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-rose-900">Failed to Load Details</p>
                    <p className="text-sm text-rose-800 mt-1">{detailsError}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetailsError("");
                    setSelectedProperty(null);
                  }}
                  className="mt-4 w-full rounded-lg bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-950 transition"
                >
                  Close
                </button>
              </div>
            )}

            {/* Details Content */}
            {selectedProperty && !isLoadingDetails && !detailsError && (
              <div className="p-6 space-y-6">
                {/* Property Details Section */}
                {selectedProperty?.property_details && (
                  <>
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a] mb-4">Property Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-[#f8fafc] p-4">
                          <p className="text-xs font-semibold uppercase text-[#64748b]">Title</p>
                          <p className="mt-2 text-base font-semibold text-[#0f172a]">
                            {selectedProperty.property_details?.property_title || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#f8fafc] p-4">
                          <p className="text-xs font-semibold uppercase text-[#64748b]">Type</p>
                          <p className="mt-2 text-base font-semibold text-[#0f172a]">
                            {selectedProperty.property_details?.property_type_name || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#f8fafc] p-4">
                          <p className="text-xs font-semibold uppercase text-[#64748b]">Category</p>
                          <p className="mt-2 text-base font-semibold text-[#0f172a]">
                            {selectedProperty.property_details?.category_name || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#f8fafc] p-4">
                          <p className="text-xs font-semibold uppercase text-[#64748b]">Verified</p>
                          <p className="mt-2 text-base font-semibold text-[#0f172a]">
                            {selectedProperty.property_details?.is_verified ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Information */}
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a] mb-4">Price & Financial</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                          <p className="text-xs font-semibold uppercase text-blue-700">Price</p>
                          <p className="mt-2 text-xl font-bold text-blue-900">
                            ₹{Number(selectedProperty.property_details?.price || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                          <p className="text-xs font-semibold uppercase text-purple-700">Security Deposit</p>
                          <p className="mt-2 text-xl font-bold text-purple-900">
                            ₹{Number(selectedProperty.property_details?.security_deposit || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        {selectedProperty.property_details?.transaction_details?.monthly_rent > 0 && (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                            <p className="text-xs font-semibold uppercase text-emerald-700">Monthly Rent</p>
                            <p className="mt-2 text-xl font-bold text-emerald-900">
                              ₹{Number(selectedProperty.property_details.transaction_details.monthly_rent).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                        {selectedProperty.property_details?.transaction_details?.maintenance_charges && (
                          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                            <p className="text-xs font-semibold uppercase text-orange-700">Maintenance</p>
                            <p className="mt-2 text-xl font-bold text-orange-900">
                              ₹{Number(selectedProperty.property_details.transaction_details.maintenance_charges).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {selectedProperty.property_details?.location && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Location Details</h3>
                        <div className="rounded-lg bg-[#f8fafc] p-4 space-y-3">
                          {selectedProperty.property_details.location?.address_line_1 && (
                            <p className="text-sm"><span className="font-semibold text-[#64748b]">Address:</span> {selectedProperty.property_details.location.address_line_1}</p>
                          )}
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">City:</span> {selectedProperty.property_details.location?.city_name || "N/A"}</p>
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Area:</span> {selectedProperty.property_details.location?.area_name || "N/A"}</p>
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">State:</span> {selectedProperty.property_details.location?.state_name || "N/A"}</p>
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Pincode:</span> {selectedProperty.property_details.location?.pincode || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* Property Details */}
                    {selectedProperty.property_details?.details && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Property Specifications</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedProperty.property_details.details?.carpet_area && (
                            <div className="rounded-lg bg-[#f8fafc] p-4">
                              <p className="text-xs font-semibold uppercase text-[#64748b]">Carpet Area</p>
                              <p className="mt-2 text-base font-semibold text-[#0f172a]">
                                {selectedProperty.property_details.details.carpet_area} sqft
                              </p>
                            </div>
                          )}
                          {selectedProperty.property_details.details?.floor_no && (
                            <div className="rounded-lg bg-[#f8fafc] p-4">
                              <p className="text-xs font-semibold uppercase text-[#64748b]">Floor Number</p>
                              <p className="mt-2 text-base font-semibold text-[#0f172a]">
                                {selectedProperty.property_details.details.floor_no} of {selectedProperty.property_details.details.total_floors}
                              </p>
                            </div>
                          )}
                          {selectedProperty.property_details.details?.washrooms && (
                            <div className="rounded-lg bg-[#f8fafc] p-4">
                              <p className="text-xs font-semibold uppercase text-[#64748b]">Washrooms</p>
                              <p className="mt-2 text-base font-semibold text-[#0f172a]">
                                {selectedProperty.property_details.details.washrooms}
                              </p>
                            </div>
                          )}
                          {selectedProperty.property_details.details?.parking_spaces !== undefined && (
                            <div className="rounded-lg bg-[#f8fafc] p-4">
                              <p className="text-xs font-semibold uppercase text-[#64748b]">Parking Spaces</p>
                              <p className="mt-2 text-base font-semibold text-[#0f172a]">
                                {selectedProperty.property_details.details.parking_spaces}
                              </p>
                            </div>
                          )}
                          {selectedProperty.property_details.details?.lifts_count !== undefined && (
                            <div className="rounded-lg bg-[#f8fafc] p-4">
                              <p className="text-xs font-semibold uppercase text-[#64748b]">Lifts</p>
                              <p className="mt-2 text-base font-semibold text-[#0f172a]">
                                {selectedProperty.property_details.details.lifts_count}
                              </p>
                            </div>
                          )}
                          {selectedProperty.property_details.details?.furnishing === 1 && (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                              <p className="text-xs font-semibold uppercase text-amber-700">Furnishing</p>
                              <p className="mt-2 text-base font-semibold text-amber-900">Furnished</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Details */}
                    {selectedProperty.property_details?.contactDetails && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Contact Information</h3>
                        <div className="rounded-lg bg-[#f8fafc] p-4 space-y-3">
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Name:</span> {selectedProperty.property_details.contactDetails?.contact_name || "N/A"}</p>
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Phone:</span> {selectedProperty.property_details.contactDetails?.contact_phone || "N/A"}</p>
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Email:</span> {selectedProperty.property_details.contactDetails?.contact_email || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {selectedProperty.property_details?.amenities && selectedProperty.property_details.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.property_details.amenities.map((amenity, idx) => (
                            <span key={idx} className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-900">
                              ✓ {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Media */}
                    {selectedProperty.property_details?.media && selectedProperty.property_details.media.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Media</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedProperty.property_details.media.map((m, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-[#eef0f4]">
                              <p className="text-xs font-semibold bg-[#f8fafc] p-2 text-[#64748b]">{m.media_type}</p>
                              <p className="text-xs p-2 text-[#64748b]">{m.is_primary ? "Primary" : "Gallery"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a] mb-4">Timeline</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProperty.property_details?.created_at && (
                          <div className="rounded-lg bg-[#f8fafc] p-4">
                            <p className="text-xs font-semibold uppercase text-[#64748b]">Posted On</p>
                            <p className="mt-2 text-sm font-semibold text-[#0f172a]">
                              {new Date(selectedProperty.property_details.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {selectedProperty.property_details?.expires_at && (
                          <div className="rounded-lg bg-[#f8fafc] p-4">
                            <p className="text-xs font-semibold uppercase text-[#64748b]">Expires On</p>
                            <p className="mt-2 text-sm font-semibold text-[#0f172a]">
                              {new Date(selectedProperty.property_details.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property ID */}
                    {selectedProperty.property_details?.property_id && (
                      <div className="rounded-lg bg-slate-900 p-4 text-center">
                        <p className="text-xs font-semibold uppercase text-slate-400">Property ID</p>
                        <p className="mt-2 text-xs font-mono text-slate-200 break-all">{selectedProperty.property_details.property_id}</p>
                      </div>
                    )}

                    {/* Branch/Dealer Info */}
                    {selectedProperty.branch_details && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Dealer Information</h3>
                        <div className="rounded-lg bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 space-y-2">
                          <p className="text-sm"><span className="font-semibold text-[#64748b]">Dealer:</span> {selectedProperty.branch_details?.dealer_name || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
