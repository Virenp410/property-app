/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteGalleryItem,
  getBranchGallery,
  updateGalleryItem,
  uploadBranchGalleryImages,
} from "@/services/business.services";

const safeText = (value) => String(value || "").trim();

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const getFileExtension = (name) => {
  const base = safeText(name).toLowerCase();
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx + 1);
};

const isSupportedImageFile = (file) => {
  if (!file) return false;
  const type = safeText(file.type).toLowerCase();
  if (type && ALLOWED_IMAGE_MIME_TYPES.has(type)) return true;
  const ext = getFileExtension(file.name);
  return ext ? ALLOWED_IMAGE_EXTENSIONS.has(ext) : false;
};

const extractErrorMessage = (err) => {
  const data = err?.response?.data || err?.data || {};
  const direct =
    safeText(data?.error?.message) ||
    safeText(data?.message) ||
    safeText(err?.message);
  if (!direct) return "Something went wrong.";
  const status = Number(err?.response?.status || 0);
  return status ? `${direct} (HTTP ${status})` : direct;
};

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    const value = safeText(obj?.[key]);
    if (value) return value;
  }
  return "";
};

const isLikelyUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    safeText(value)
  );

const buildGalleryImageUrl = (imagePath) => {
  const path = safeText(imagePath);
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = safeText(process.env.NEXT_PUBLIC_S3_BASE_URL).replace(/\/$/, "");
  if (baseUrl) return `${baseUrl}/${path.replace(/^\/+/, "")}`;
  return path.startsWith("/") ? path : `/${path}`;
};

const normalizeGalleryItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    const url = safeText(item);
    return url ? { id: url, url } : null;
  }

  const id =
    pickFirst(item, ["gallery_id", "galleryId", "id", "uuid", "media_id", "mediaId"]) ||
    "";
  const url =
    pickFirst(item, [
      "image",
      "imageUrl",
      "image_url",
      "gallery_image",
      "gallery_image_url",
      "url",
      "path",
      "file_path",
      "filePath",
      "s3_path",
      "bucket_path",
      "photo",
      "photo_url",
      "picture",
      "picture_url",
      "media",
      "media_url",
      "file",
    ]) ||
    pickFirst(item?.data, ["image", "imageUrl", "url", "path", "file_path"]) ||
    "";

  if (!id && !url) return null;

  return {
    id: id || url,
    url,
    raw: item,
    isActive:
      item?.is_active === true ||
      item?.isActive === true ||
      Number(item?.is_active ?? item?.isActive ?? 1) === 1,
  };
};

export default function BranchSettingsPanel({ activeBranch, profile, branchId }) {
  const [settingsTab, setSettingsTab] = useState("profile"); // profile | gallery

  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [togglingId, setTogglingId] = useState("");

  const branchRaw = activeBranch?.raw || {};
  const businessRaw = branchRaw?.Business || {};

  const branchName =
    safeText(businessRaw?.display_name) ||
    safeText(branchRaw?.branch_name) ||
    safeText(businessRaw?.business_name) ||
    safeText(activeBranch?.name) ||
    "Branch";

  const city = safeText(branchRaw?.location?.city) || safeText(activeBranch?.city);

  const primaryMobile = pickFirst(branchRaw, ["primary_number", "primaryNumber"]);
  const primaryCountry = pickFirst(branchRaw, ["country_code", "countryCode"]) || "91";
  const whatsappNumber = pickFirst(branchRaw, ["whatsapp_number", "whatsappNumber"]);
  const whatsappCountry =
    pickFirst(branchRaw, ["whatsapp_country_code", "whatsappCountryCode"]) ||
    primaryCountry ||
    "91";

  const businessEmail = pickFirst(branchRaw, ["business_email", "businessEmail"]);
  const website = pickFirst(branchRaw, ["website", "site_url", "siteUrl"]);
  const seanebId = pickFirst(branchRaw, ["seaneb_id", "seanebId"]);

  const address = pickFirst(branchRaw?.location, ["address", "full_address", "fullAddress"]);

  const gstin =
    pickFirst(branchRaw, ["gstin", "gst_number", "gstNumber", "gstin_number"]) ||
    pickFirst(branchRaw?.legal, ["gstin"]);
  const pan =
    pickFirst(branchRaw, ["pan", "pan_number", "panNumber"]) ||
    pickFirst(branchRaw?.legal, ["pan"]);

  const resolvedBranchId = useMemo(() => {
    const id = safeText(branchId) || safeText(profile?.branchId) || safeText(activeBranch?.id);
    return id && id !== "primary" ? id : "";
  }, [activeBranch?.id, branchId, profile?.branchId]);

  useEffect(() => {
    if (!resolvedBranchId) {
      setGalleryItems([]);
      return;
    }

    let active = true;
    const load = async () => {
      setGalleryLoading(true);
      setGalleryError("");
      try {
        const items = await getBranchGallery(resolvedBranchId);
        if (!active) return;
        setGalleryItems(
          (Array.isArray(items) ? items : [])
            .map(normalizeGalleryItem)
            .filter(Boolean)
        );
      } catch (err) {
        if (!active) return;
        console.warn("[BranchSettings] Failed to load gallery:", err);
        setGalleryError(extractErrorMessage(err));
        setGalleryItems([]);
      } finally {
        if (!active) return;
        setGalleryLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [resolvedBranchId]);

  const handleDelete = async (id) => {
    const galleryId = safeText(id);
    if (!galleryId || !isLikelyUuid(galleryId)) return;

    setGalleryError("");
    try {
      await deleteGalleryItem({ galleryId });
      const items = await getBranchGallery(resolvedBranchId);
      setGalleryItems(
        (Array.isArray(items) ? items : [])
          .map(normalizeGalleryItem)
          .filter(Boolean)
      );
    } catch (err) {
      console.warn("[BranchSettings] Delete gallery failed:", err);
      setGalleryError(extractErrorMessage(err));
    }
  };

  const handleToggleActive = async (id, nextValue) => {
    const galleryId = safeText(id);
    if (!galleryId || !isLikelyUuid(galleryId)) return;

    setTogglingId(galleryId);
    setGalleryError("");
    try {
      await updateGalleryItem({
        galleryId,
        payload: { is_active: nextValue, isActive: nextValue, is_active_flag: nextValue ? 1 : 0 },
      });
      const items = await getBranchGallery(resolvedBranchId);
      setGalleryItems(
        (Array.isArray(items) ? items : [])
          .map(normalizeGalleryItem)
          .filter(Boolean)
      );
    } catch (err) {
      console.warn("[BranchSettings] Toggle gallery status failed:", err);
      setGalleryError(extractErrorMessage(err));
    } finally {
      setTogglingId("");
    }
  };

  const handleUpload = async () => {
    if (!resolvedBranchId) return;
    if (!selectedFiles.length) return;

    const files = selectedFiles.filter(isSupportedImageFile).slice(0, 10);
    if (!files.length) {
      setGalleryError("Unsupported image format. Upload JPG, PNG, or WebP only.");
      return;
    }
    setUploading(true);
    setGalleryError("");
    try {
      await uploadBranchGalleryImages({ branchId: resolvedBranchId, files });
      setSelectedFiles([]);
      const items = await getBranchGallery(resolvedBranchId);
      setGalleryItems(
        (Array.isArray(items) ? items : [])
          .map(normalizeGalleryItem)
          .filter(Boolean)
      );
    } catch (err) {
      console.warn("[BranchSettings] Upload gallery failed:", err);
      setGalleryError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const totalImages = galleryItems.length;
  const activeImages = galleryItems.filter((item) => item?.isActive !== false).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Branch Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Manage details for {branchName}
        </h1>
      </section>

      <section className="mt-6 rounded-[18px] border border-[#eef0f4] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-[#f8fafc] p-2">
          <button
            type="button"
            onClick={() => setSettingsTab("profile")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              settingsTab === "profile"
                ? "bg-white text-[#0f172a] shadow-[0_10px_18px_rgba(15,23,42,0.08)]"
                : "text-[#94a3b8] hover:bg-white/70"
            }`}
          >
            Business Profile
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab("gallery")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              settingsTab === "gallery"
                ? "bg-white text-[#0f172a] shadow-[0_10px_18px_rgba(15,23,42,0.08)]"
                : "text-[#94a3b8] hover:bg-white/70"
            }`}
          >
            Gallery
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#cbd5e1]"
            title="Coming soon"
          >
            Billing & Invoices
          </button>
        </div>

        {settingsTab === "profile" ? (
          <div className="mt-6 rounded-3xl border border-[#eef0f4] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f1f5f9] text-xs font-bold text-[#64748b]">
                  BP
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#0f172a]">
                    Branch Identity & Contact
                  </h2>
                  <p className="text-[12px] font-medium text-[#94a3b8]">
                    Read-only details from business profile API.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="rounded-2xl border border-[#eef0f4] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#cbd5e1]"
                title="Edit API not wired yet"
              >
                Edit Details
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                <p className="text-xs font-semibold text-[#64748b]">Primary Mobile Number</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                  +{primaryCountry} {primaryMobile || "Not provided"}
                </p>
              </div>
              <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                <p className="text-xs font-semibold text-[#64748b]">WhatsApp Number</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                  +{whatsappCountry} {whatsappNumber || "Not provided"}
                </p>
              </div>
              <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                <p className="text-xs font-semibold text-[#64748b]">Business Email</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                  {businessEmail || "Not provided"}
                </p>
              </div>
              <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                <p className="text-xs font-semibold text-[#64748b]">Website</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                  {website || "Not provided"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Business Details
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">Business Name</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {safeText(businessRaw?.business_name) || "Not provided"}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">Display Name</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {safeText(businessRaw?.display_name) || branchName || "Not provided"}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">SeaNeB ID</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {seanebId || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Branch Location
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">Address</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {address || "Not provided"}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">City</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {city || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Legal & Identification
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">GSTIN</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {gstin || "Not provided"}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#eef0f4] bg-white p-5">
                  <p className="text-xs font-semibold text-[#64748b]">PAN</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                    {pan || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {settingsTab === "gallery" ? (
          <div className="mt-6 rounded-3xl border border-[#eef0f4] p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f1f5f9] text-[#64748b]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 7.2C4 6.0799 4 5.51984 4.21799 5.09202C4.40973 4.71569 4.71569 4.40973 5.09202 4.21799C5.51984 4 6.0799 4 7.2 4H16.8C17.9201 4 18.4802 4 18.908 4.21799C19.2843 4.40973 19.5903 4.71569 19.782 5.09202C20 5.51984 20 6.0799 20 7.2V16.8C20 17.9201 20 18.4802 19.782 18.908C19.5903 19.2843 19.2843 19.5903 18.908 19.782C18.4802 20 17.9201 20 16.8 20H7.2C6.0799 20 5.51984 20 5.09202 19.782C4.71569 19.5903 4.40973 19.2843 4.21799 18.908C4 18.4802 4 17.9201 4 16.8V7.2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4.5 18L10.5 12.5C11.1667 11.8333 12.4 10.9 13.5 12.5L16 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.5 13.5L15.5 12.5C16.1667 11.8333 17.4 10.9 18.5 12.5L20 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-[#0f172a]">Business Gallery</h2>
                <p className="mt-1 text-[12px] font-medium text-[#94a3b8]">
                  {totalImages} image(s) · {activeImages} active
                  {galleryLoading ? " · loading..." : ""}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <input
                id="branch-gallery-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const nonEmpty = files.filter((file) => Number(file?.size || 0) > 0);
                  const supported = nonEmpty.filter(isSupportedImageFile);
                  const rejected = nonEmpty.length - supported.length;
                  setSelectedFiles(supported);
                  if (rejected > 0) {
                    setGalleryError("Some files were ignored (only JPG, PNG, WebP supported).");
                  }
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  const el = typeof document !== "undefined"
                    ? document.getElementById("branch-gallery-upload")
                    : null;
                  if (el && typeof el.click === "function") el.click();
                }}
                className="group w-full rounded-[26px] border-2 border-dashed border-[#b9d4ff] bg-[#f7fbff] px-6 py-10 text-center transition hover:bg-[#f2f8ff]"
              >
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf2ff] text-[#0f62fe] shadow-[0_10px_22px_rgba(15,98,254,0.18)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-4 text-[15px] font-semibold text-[#0f62fe]">
                  Click to upload images
                </div>
                <div className="mt-1 text-[12px] font-medium text-[#94a3b8]">
                  JPG, PNG, WebP
                </div>
                {selectedFiles.length ? (
                  <div className="mt-3 text-[12px] font-semibold text-[#0f172a]">
                    {selectedFiles.length} file(s) selected ·{" "}
                    <span className="text-[#0f62fe]">Upload now</span>
                  </div>
                ) : null}
              </button>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFiles.length || uploading}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    !selectedFiles.length || uploading
                      ? "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                      : "bg-[#0f172a] text-white hover:opacity-95"
                  }`}
                >
                  {uploading ? "Uploading..." : "Upload Selected"}
                </button>
              </div>
            </div>

            {galleryError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {galleryError}
              </div>
            ) : null}

            {galleryItems.length === 0 && !galleryLoading ? (
              <div className="mt-6 rounded-3xl border border-dashed border-[#e3e7ee] bg-[#fbfcfe] p-10 text-center">
                <p className="text-sm font-semibold text-[#0f172a]">No images yet</p>
                <p className="mt-1 text-xs font-medium text-[#94a3b8]">
                  Upload JPG/PNG/WebP images to show them in your gallery.
                </p>
              </div>
            ) : null}

            {galleryItems.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {galleryItems.map((item) => {
                  const imageUrl = buildGalleryImageUrl(item?.url);
                  const canDelete = isLikelyUuid(item?.id);
                  const isBusy = togglingId && togglingId === safeText(item?.id);
                  return (
                    <div
                      key={item?.id}
                      className="group relative overflow-hidden rounded-3xl border border-[#eef0f4] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    >
                      <div className="aspect-[4/3] bg-slate-100">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-[#94a3b8]">
                            No preview
                          </div>
                        )}
                      </div>
                      {item?.isActive === false ? (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white shadow-sm">Hidden</span>
                        </div>
                      ) : null}
                      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-end gap-2 p-3 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item?.id, !(item?.isActive !== false))}
                          disabled={!canDelete || isBusy}
                          className={`grid h-10 w-10 place-items-center rounded-2xl shadow-[0_10px_18px_rgba(15,23,42,0.12)] ring-1 ring-white/60 ${
                            !canDelete || isBusy
                              ? "cursor-not-allowed bg-white/70 text-[#cbd5e1]"
                              : "bg-white/95 text-[#475467] hover:bg-white"
                          }`}
                          title={item?.isActive !== false ? "Disable" : "Enable"}
                        >
                          {item?.isActive !== false ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 12C4.5 7 8 4.5 12 4.5C16 4.5 19.5 7 22 12C19.5 17 16 19.5 12 19.5C8 19.5 4.5 17 2 12Z" stroke="currentColor" strokeWidth="1.7" />
                              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.7" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                              <path d="M2 12C4.5 7 8 4.5 12 4.5C16 4.5 19.5 7 22 12C21.2 13.7 20.3 15 19.3 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                              <path d="M7.1 7.3C5.4 8.6 3.9 10.3 2 12C4.5 17 8 19.5 12 19.5C13.7 19.5 15.3 19 16.8 18.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item?.id)}
                          disabled={!canDelete || isBusy}
                          className={`grid h-10 w-10 place-items-center rounded-2xl shadow-[0_10px_18px_rgba(15,23,42,0.12)] ring-1 ring-white/60 ${
                            canDelete && !isBusy
                              ? "bg-white/95 text-rose-600 hover:bg-white"
                              : "cursor-not-allowed bg-white/70 text-[#cbd5e1]"
                          }`}
                          title="Delete"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M10 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M6 7L7 20H17L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!resolvedBranchId ? (
              <div className="mt-4 text-xs font-semibold text-[#94a3b8]">
                Missing branch id.
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
