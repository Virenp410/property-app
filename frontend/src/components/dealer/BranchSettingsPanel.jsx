/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteGalleryItem,
  getBranchGallery,
  updateBranchDetails,
  updateGalleryItem,
  uploadBranchGalleryImages,
} from "@/services/business.services";
import OtpInput from "@/components/OtpInput";
import api from "@/lib/auth/apiClient";
import { PRODUCT_KEY } from "@/lib/productKey";

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
  if (!path) {
    console.log("[buildGalleryImageUrl] Empty path provided");
    return "";
  }
  if (/^https?:\/\//i.test(path)) {
    // Add cache-buster for absolute URLs
    const sep = path.includes("?") ? "&" : "?";
    const finalUrl = `${path}${sep}v=${Date.now()}`;
    console.log("[buildGalleryImageUrl] Absolute URL:", { input: path, output: finalUrl });
    return finalUrl;
  }

  const baseUrl = safeText(process.env.NEXT_PUBLIC_S3_BASE_URL || process.env.NEXT_PUBLIC_MS3_S3_BASE_URL || "").replace(/\/$/, "");
  if (baseUrl) {
    const url = `${baseUrl}/${path.replace(/^\/+/, "")}`;
    const sep = url.includes("?") ? "&" : "?";
    const finalUrl = `${url}${sep}v=${Date.now()}`;
    console.log("[buildGalleryImageUrl] S3 URL:", { baseUrl, input: path, output: finalUrl });
    return finalUrl;
  }
  console.log("[buildGalleryImageUrl] No S3 URL configured, returning relative path");
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

export default function BranchSettingsPanel({ activeBranch, profile, branchId, onBranchUpdate }) {
  const [settingsTab, setSettingsTab] = useState("profile"); // profile | gallery

  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [togglingId, setTogglingId] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
	  const [editForm, setEditForm] = useState({
	    primary_number: "",
	    country_code: "+91",
	    whatsapp_number: "",
	    whatsapp_country_code: "+91",
	    business_email: "",
	  });
	  const [inlineOtp, setInlineOtp] = useState({
	    primary_number: { status: "idle", value: "", error: "", via: "sms", resetKey: 0 },
	    whatsapp_number: { status: "idle", value: "", error: "", via: "whatsapp", resetKey: 0 },
	    business_email: { status: "idle", value: "", error: "", via: null, resetKey: 0 },
	  });
  const [otpTarget, setOtpTarget] = useState({
    primary_number: null,
    whatsapp_number: null,
    business_email: null,
  });
  const [otpDeliveryModal, setOtpDeliveryModal] = useState({ open: false, field: null });
  const [branchLogoFile, setBranchLogoFile] = useState(null);
	  const [branchLogoPreview, setBranchLogoPreview] = useState("");

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
    // If id is 'primary', it's likely a placeholder. We should try to find a real UUID from the profile instead.
    if (!id || id === "primary") {
       const profileId = safeText(profile?.branchId);
       return (profileId && profileId !== "primary") ? profileId : "";
    }
    return id;
  }, [activeBranch?.id, branchId, profile?.branchId]);

  const defaultEditForm = useMemo(() => ({
    primary_number: primaryMobile || "",
    country_code: primaryCountry ? `+${primaryCountry.replace(/^\+/, "")}` : "+91",
    whatsapp_number: whatsappNumber || "",
    whatsapp_country_code: whatsappCountry ? `+${whatsappCountry.replace(/^\+/, "")}` : "+91",
    business_email: businessEmail || "",
  }), [primaryMobile, primaryCountry, whatsappNumber, whatsappCountry, businessEmail]);

	  useEffect(() => {
	    if (!isEditing) {
	      setEditForm(defaultEditForm);
	      setBranchLogoFile(null);
	      setBranchLogoPreview("");
	      setFormError("");
	      setFormSuccess("");
	    }
	  }, [defaultEditForm, isEditing]);

	  const getLoggedInMobileContext = useCallback(() => {
	    const mobileNumber = safeText(
	      profile?.primary_number ||
	        profile?.primaryNumber ||
	        profile?.mobile_number ||
	        profile?.mobileNumber ||
	        profile?.mobile
	    );
	    const countryCodeRaw = safeText(
	      profile?.country_code ||
	        profile?.countryCode ||
	        profile?.mobile_country_code ||
	        profile?.mobileCountryCode
	    );

	    return {
	      mobileNumber,
	      countryCode: countryCodeRaw.replace(/^\+/, ""),
	    };
	  }, [profile]);

	  const loggedInPhoneLabel = useMemo(() => {
	    const ctx = getLoggedInMobileContext();
	    const cc = safeText(ctx.countryCode || safeText(editForm.country_code).replace(/^\+/, ""));
	    const num = safeText(ctx.mobileNumber || editForm.primary_number);
	    if (!cc && !num) return "";
	    return `${cc ? `+${cc}` : ""} ${num}`.trim();
	  }, [editForm.country_code, editForm.primary_number, getLoggedInMobileContext]);

  const openOtpDeliveryModal = (field) => {
    setOtpDeliveryModal({ open: true, field });
  };

  const closeOtpDeliveryModal = () => {
    setOtpDeliveryModal({ open: false, field: null });
  };

  const handleSelectOtpDelivery = (via) => {
    const field = otpDeliveryModal.field || "primary_number";
    if (!field) {
      closeOtpDeliveryModal();
      return;
    }
    handleSendInlineOtp(field, via);
    closeOtpDeliveryModal();
  };

  const getOtpTargetData = (field) => {
    const target = otpTarget[field];
    if (!target) {
      // Fallback to form data if no response meta
      if (field === "business_email") {
        return { email: editForm.business_email };
      }
      const isWhatsapp = field === "whatsapp_number";
      const cc = String(isWhatsapp ? editForm.whatsapp_country_code : editForm.country_code || "91").replace(/^\+/, "");
      const mobile = isWhatsapp ? editForm.whatsapp_number : safeText(profile?.mobile_number || profile?.primary_number || editForm.primary_number);
      return { country_code: cc, mobile_number: mobile };
    }

    // Always use response meta when available
    if (field === "business_email") {
      return { email: target.email };
    }
    return {
      country_code: String(target.country_code || "91").replace(/^\+/, ""),
      mobile_number: String(target.mobile_number || "").trim(),
    };
  };

  const getOtpTargetLabel = (field) => {
    const target = otpTarget[field];

    // Always use response meta when available
    if (target) {
      if (field === "business_email") {
        return target.email || "";
      }
      const cc = target.country_code ? `+${String(target.country_code).replace(/^\+/, "")}` : "";
      return `${cc ? `${cc} ` : ""}${target.mobile_number}`.trim();
    }

    // Fallback to form data if no response meta
    if (field === "business_email") {
      return editForm.business_email;
    }
    if (field === "primary_number") {
      return loggedInPhoneLabel || `${editForm.country_code} ${editForm.primary_number}`.trim();
    }
    if (field === "whatsapp_number") {
      return `${editForm.whatsapp_country_code} ${editForm.whatsapp_number}`.trim();
    }
    return "";
  };

  useEffect(() => {
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

  const getCurrentBranchLogoUrl = () => {
    const logoPath = pickFirst(branchRaw, [
      "branch_logo",
      "branchLogo",
      "logo",
      "logo_url",
      "s3_path",
      "bucket_path",
    ]);
    const builtUrl = buildGalleryImageUrl(logoPath);
    console.log("[BranchSettings] getCurrentBranchLogoUrl:", { logoPath, builtUrl, branchRawKeys: Object.keys(branchRaw || {}).slice(0, 15) });
    return builtUrl;
  };

	  const handleEditChange = (key, value) => {
	    setFormError("");
	    setFormSuccess("");
	    setEditForm((prev) => ({ ...prev, [key]: value }));
	    const fieldName = key.includes('country_code') ? key.replace('_country_code', '_number').replace('country_code', 'primary_number') : key;
	    if (['primary_number', 'whatsapp_number', 'business_email'].includes(fieldName)) {
	      setInlineOtp((prev) => ({
	        ...prev,
	        [fieldName]: {
	          ...(prev[fieldName] || {}),
	          status: "idle",
	          value: "",
	          error: "",
	          resetKey: Number(prev?.[fieldName]?.resetKey || 0) + 1,
	          via:
	            fieldName === "primary_number"
	              ? "sms"
	              : fieldName === "whatsapp_number"
	                ? "whatsapp"
	                : null,
	        },
	      }));
	    }
	  };

  const handleChooseLogoFile = (file) => {
    setBranchLogoFile(file || null);
    setFormError("");
    setFormSuccess("");
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBranchLogoPreview(previewUrl);
    } else {
      setBranchLogoPreview("");
    }
  };

  useEffect(() => {
    return () => {
      if (branchLogoPreview) {
        URL.revokeObjectURL(branchLogoPreview);
      }
    };
  }, [branchLogoPreview]);

	  const handleCancelEdit = () => {
	    setIsEditing(false);
	    setBranchLogoFile(null);
	    setBranchLogoPreview("");
	    setFormError("");
	    setFormSuccess("");
	    setInlineOtp({
	      primary_number: { status: "idle", value: "", error: "", via: "sms", resetKey: 0 },
	      whatsapp_number: { status: "idle", value: "", error: "", via: "whatsapp", resetKey: 0 },
	      business_email: { status: "idle", value: "", error: "", via: null, resetKey: 0 },
	    });
    setOtpTarget({ primary_number: null, whatsapp_number: null, business_email: null });
  };

  const openOtpFlowFromPayload = (payload, opts = {}) => {
    const data = payload || {};
    const typesRaw = data.required_otps || data.required_otp_types || data.otp_types || ["mobile"];
    const missingTypes = Array.isArray(typesRaw) ? typesRaw : [typesRaw];
    const assumeVerifiedFields = opts?.assumeVerifiedFields || {};

    const isAssumedVerified = (field) => Boolean(assumeVerifiedFields?.[field]);
    const isFieldVerified = (field) => {
      if (isAssumedVerified(field)) return true;
      if (field === "primary_number") return inlineOtp.primary_number.status === "verified";
      if (field === "whatsapp_number") return inlineOtp.whatsapp_number.status === "verified";
      if (field === "business_email") return inlineOtp.business_email.status === "verified";
      return false;
		    };

		    // If the backend says OTP is still required, reset the local "Verified" UI for those types.
		    // This prevents the confusing state: "✓ Verified" while showing "OTP required".
		    const requiredFields = new Set();
		    missingTypes.forEach((type) => {
		      const t = String(type || "").toLowerCase();
		      if (t.includes("mobile") || t.includes("primary")) requiredFields.add("primary_number");
		      if (t.includes("whatsapp")) requiredFields.add("whatsapp_number");
		      if (t.includes("email")) requiredFields.add("business_email");
		    });
		    if (requiredFields.size > 0) {
		      setInlineOtp((prev) => {
		        const next = { ...prev };
		        if (requiredFields.has("primary_number")) {
		          next.primary_number = {
		            ...(prev.primary_number || {}),
		            status: "idle",
		            value: "",
		            error: "",
		            via: prev?.primary_number?.via || "sms",
		            resetKey: Number(prev?.primary_number?.resetKey || 0) + 1,
		          };
		        }
		        if (requiredFields.has("whatsapp_number")) {
		          next.whatsapp_number = {
		            ...(prev.whatsapp_number || {}),
		            status: "idle",
		            value: "",
		            error: "",
		            via: "whatsapp",
		            resetKey: Number(prev?.whatsapp_number?.resetKey || 0) + 1,
		          };
		        }
		        if (requiredFields.has("business_email")) {
		          next.business_email = {
		            ...(prev.business_email || {}),
		            status: "idle",
		            value: "",
		            error: "",
		            via: null,
		            resetKey: Number(prev?.business_email?.resetKey || 0) + 1,
		          };
		        }
		        return next;
		      });
		    }

      const parseMetaEntry = (entry) => {
        if (!entry || typeof entry !== "object") return null;
        const type = String(entry.type || entry.identifier_type || "").toLowerCase();
        const mobile_number = String(entry.mobile_number || entry.mobileNumber || entry.mobile || "").trim();
        const country_code = String(entry.country_code || entry.countryCode || entry.country || "").replace(/^\+/, "").trim();
        const email = String(entry.email || entry.email_address || entry.emailAddress || "").trim();
        return { type, mobile_number, country_code, email, purpose: entry.purpose ?? entry.purpose_id ?? null };
      };

      const nextOtpTarget = { ...otpTarget };
      const metaItems = Array.isArray(data.meta) ? data.meta : data.meta ? [data.meta] : [];
      metaItems.forEach((entry) => {
        const meta = parseMetaEntry(entry);
        if (!meta) return;
        if (meta.type.includes("whatsapp")) {
          nextOtpTarget.whatsapp_number = meta;
        } else if (meta.type.includes("email")) {
          nextOtpTarget.business_email = meta;
        } else if (meta.mobile_number) {
          nextOtpTarget.primary_number = meta;
        }
      });
      if (metaItems.length > 0) {
        setOtpTarget(nextOtpTarget);
      }
      const stillReq = missingTypes.filter((type) => {
        const t = String(type).toLowerCase();
        if (t.includes("mobile") || t.includes("primary")) return !isFieldVerified("primary_number");
        if (t.includes("whatsapp")) return !isFieldVerified("whatsapp_number");
        if (t.includes("email")) return !isFieldVerified("business_email");
        return true;
      });

      const formatTypeLabel = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes("email")) return "Email";
        if (t.includes("whatsapp")) return "WhatsApp";
        if (t.includes("mobile") || t.includes("primary")) return "Mobile";
        return String(type || "OTP");
      };

      if (stillReq.length > 0) {
        const labels = [...new Set(stillReq.map(formatTypeLabel))].filter(Boolean);
        setFormError(
          `OTP verification required (${labels.join(", ")}). Please verify using the Verify buttons next to the changed fields, then click Save Changes again.`
        );
        return;
      }

      const labels = [...new Set(missingTypes.map(formatTypeLabel))].filter(Boolean);
      setFormError(
        `OTP verification required (${labels.join(", ")}). Please verify using the Verify buttons next to the changed fields, then click Save Changes again.`
      );
      return;
    };

  const handleSaveDetails = async (opts = {}) => {
    if (!resolvedBranchId) {
      setFormError("Branch ID is missing.");
      return;
    }

    setSaving(true);
    setFormError("");
    setFormSuccess("");

    try {
      // Build payload with only changed fields
      const payload = {
        branchId: resolvedBranchId,
      };

      // Only add contact fields if they changed
      if (editForm.primary_number !== primaryMobile) {
        payload.primary_number = String(editForm.primary_number || "").trim();
        payload.country_code = String(editForm.country_code || "").trim().replace('+', '');
      }
      if (editForm.whatsapp_number !== whatsappNumber) {
        payload.whatsapp_country_code = String(editForm.whatsapp_country_code || "").trim().replace('+', '');
        payload.whatsapp_number = String(editForm.whatsapp_number || "").trim();
      }
      if (editForm.business_email !== businessEmail) {
        payload.business_email = String(editForm.business_email || "").trim();
      }

      console.log("[BranchSettings] Payload being sent:", { payload, hasLogo: !!branchLogoFile });

	      const response = await updateBranchDetails({ ...payload, branch_logo: branchLogoFile });
	      const responsePayload = response?.data ?? response ?? {};

	      console.log("[BranchSettings] FULL API Response structure:");
	      console.log(JSON.stringify(response, null, 2));
	      console.log("[BranchSettings] Response Payload:", responsePayload);
	      console.log("[BranchSettings] Logo fields in response:", { 
	        'data.branch_logo': responsePayload?.data?.branch_logo,
	        'branch_logo': responsePayload?.branch_logo,
	        'data.logo': responsePayload?.data?.logo,
	        'logo': responsePayload?.logo,
	        'data': Object.keys(responsePayload?.data || {}),
	        'meta': responsePayload?.meta
	      });

	      // API can return OTP requirement with HTTP 200.
	      // Check if only logo was changed
	      const hasLogoFile = !!branchLogoFile;
	      const didNumberChange = editForm.primary_number !== primaryMobile;
	      const didWhatsappChange = editForm.whatsapp_number !== whatsappNumber;
	      const didEmailChange = editForm.business_email !== businessEmail;
	      
	      const isLogoOnlyChange = hasLogoFile && !didNumberChange && !didWhatsappChange && !didEmailChange;

	      console.log("[BranchSettings] Change analysis:", { hasLogoFile, didNumberChange, didWhatsappChange, didEmailChange, isLogoOnlyChange });

	      if (responsePayload?.otp_required) {
	        // For logo-only changes, bypass OTP requirement entirely
	        if (isLogoOnlyChange) {
	          console.log("[BranchSettings] Logo-only change - OTP bypassed, proceeding with save");
	          setFormSuccess(responsePayload?.message || "Branch updated successfully.");
	          setFormError("");
	          if (onBranchUpdate) {
	            onBranchUpdate(responsePayload?.data || responsePayload);
	          }
	          setTimeout(() => {
	            setIsEditing(false);
	            setBranchLogoFile(null);
	            setBranchLogoPreview("");
	            setInlineOtp({
	              primary_number: { status: "idle", value: "", error: "", via: "sms", resetKey: 0 },
	              whatsapp_number: { status: "idle", value: "", error: "", via: "whatsapp", resetKey: 0 },
	              business_email: { status: "idle", value: "", error: "", via: null, resetKey: 0 },
	            });
            setOtpTarget({ primary_number: null, whatsapp_number: null, business_email: null });
          }, 1500);
          return;
        }

        openOtpFlowFromPayload(responsePayload, opts);
        return;
      }

      setFormSuccess(responsePayload?.message || "Branch updated successfully.");
      setFormError("");
      if (onBranchUpdate) {
        onBranchUpdate(responsePayload?.data || responsePayload);
      }
      setTimeout(() => {
        setIsEditing(false);
        setBranchLogoFile(null);
        setBranchLogoPreview("");
        setInlineOtp({
          primary_number: { status: "idle", value: "", error: "", via: "sms", resetKey: 0 },
          whatsapp_number: { status: "idle", value: "", error: "", via: "whatsapp", resetKey: 0 },
          business_email: { status: "idle", value: "", error: "", via: null, resetKey: 0 },
        });
        setOtpTarget({ primary_number: null, whatsapp_number: null, business_email: null });
      }, 1500);
    } catch (err) {
      const data = err?.response?.data || {};
      if (data?.otp_required) {
        openOtpFlowFromPayload(data, opts);
      } else {
        setFormError(extractErrorMessage(err));
      }
      console.warn("[BranchSettings] Update branch details failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendInlineOtp = async (field, viaOverride = null) => {
    try {
      const resolvedVia =
        field === "primary_number"
          ? viaOverride || "sms"
          : field === "whatsapp_number"
          ? "whatsapp"
          : null;

      setInlineOtp((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field] || {}),
          status: "sending",
          error: "",
          value: "",
          resetKey: Number(prev?.[field]?.resetKey || 0) + 1,
          via: resolvedVia ?? prev?.[field]?.via ?? null,
        },
      }));

      if (field === 'business_email') {
        await api.post("/v1/auth/email/send-otp", {
          email: editForm.business_email,
          purpose: 5,
          product_key: PRODUCT_KEY,
        });
      } else {
        const targetData = getOtpTargetData(field);
        const isMobile = field === "primary_number";
        const via = isMobile ? resolvedVia || "sms" : "whatsapp";
        const identifierType = 0;
        const cc = String(targetData.country_code || "").replace(/^\+/, "");
        const num = String(targetData.mobile_number || "").trim();

        await api.post("/v1/otp/send-otp", {
          identifier_type: identifierType,
          country_code: cc,
          mobile_number: num,
          purpose: 5,
          via,
          product_key: PRODUCT_KEY,
        });
      }

	      setInlineOtp((prev) => ({
	        ...prev,
	        [field]: { ...(prev[field] || {}), status: "sent", error: "" },
	      }));
	    } catch (error) {
	      setInlineOtp((prev) => ({
	        ...prev,
	        [field]: {
	          ...(prev[field] || {}),
	          status: "idle",
	          error: extractErrorMessage(error) || "Failed to send OTP.",
	        },
	      }));
	    }
	  };

  const handleVerifyInlineOtp = async (field) => {
    const otpValue = inlineOtp[field]?.value;
    if (!otpValue || otpValue.length < 4) return;

    try {
      setInlineOtp((prev) => ({
        ...prev,
        [field]: { ...(prev[field] || {}), status: "verifying", error: "" },
      }));

      if (field === 'business_email') {
        await api.post("/v1/auth/email/verify-otp", {
          email: editForm.business_email,
          purpose: 5,
          otp: otpValue,
          product_key: PRODUCT_KEY,
        });
      } else {
        const targetData = getOtpTargetData(field);
        const isMobile = field === "primary_number";
        const via = isMobile ? inlineOtp.primary_number?.via || "sms" : "whatsapp";
        const identifierType = 0;
        const cc = String(targetData.country_code || "").replace(/^\+/, "");
        const num = String(targetData.mobile_number || "").trim();

        await api.post("/v1/otp/verify-otp", {
          identifier_type: identifierType,
          country_code: cc,
          mobile_number: num,
          purpose: 5,
          otp: otpValue,
          product_key: PRODUCT_KEY,
        });
      }

      setInlineOtp((prev) => ({
        ...prev,
        [field]: { ...(prev[field] || {}), status: "verified", error: "" },
      }));
      setFormError("");
      setFormSuccess("");

      const isPrimaryChanged =
        editForm.primary_number !== defaultEditForm.primary_number ||
        editForm.country_code !== defaultEditForm.country_code;
      const isWhatsappChanged =
        editForm.whatsapp_number !== defaultEditForm.whatsapp_number ||
        editForm.whatsapp_country_code !== defaultEditForm.whatsapp_country_code;
      const isEmailChanged = editForm.business_email !== defaultEditForm.business_email;

      const willBeVerified = (key) => (key === field ? true : inlineOtp[key]?.status === "verified");
      const allRequiredVerified =
        (!isPrimaryChanged || willBeVerified("primary_number")) &&
        (!isWhatsappChanged || willBeVerified("whatsapp_number")) &&
        (!isEmailChanged || willBeVerified("business_email"));

      // Backend expects: send OTP -> verify OTP -> call update again (purpose=5).
      // Auto-save only when all changed fields are verified.
      if (allRequiredVerified) {
        setTimeout(() => {
          handleSaveDetails({ assumeVerifiedFields: { [field]: true } });
        }, 0);
      }
    } catch (error) {
      setInlineOtp((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field] || {}),
          status: "sent",
          error: extractErrorMessage(error) || "Failed to verify OTP.",
        },
      }));
    }
  };

  const renderInlineVerifyLegacy = (field, phoneWithCode) => {
    const isChanged = field === 'primary_number'
      ? (editForm.primary_number !== defaultEditForm.primary_number || editForm.country_code !== defaultEditForm.country_code)
      : field === 'whatsapp_number'
      ? (editForm.whatsapp_number !== defaultEditForm.whatsapp_number || editForm.whatsapp_country_code !== defaultEditForm.whatsapp_country_code)
      : (editForm.business_email !== defaultEditForm.business_email);
    const state = inlineOtp[field] || { status: 'idle', value: '', error: '' };

    if (!isChanged) return null;
    if (state.status !== 'sent' && state.status !== 'verifying' && state.status !== 'verified') return null;
    if (state.status === 'verified') return null;

    return (
      <div className="mt-4 rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 col-span-full">
        <div className="flex items-start gap-5">
          <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cbd5e1] bg-white text-[#0f172a] shadow-sm">
            {field === 'business_email' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h4 className="text-[17px] font-bold text-[#0f172a]">
                    {field === 'business_email' ? 'Verify your email' : 'Verification required'}
                </h4>
                <p className="mt-1 text-[14px] leading-relaxed text-[#475467]">
                    Please enter the 4-digit security code sent to <span className="font-bold text-[#0f172a]">{phoneWithCode}</span>
                </p>
              </div>
              <div className="text-[12px] font-bold text-[#0f62fe] bg-[#0f62fe]/5 border border-[#0f62fe]/10 px-4 py-2 rounded-xl flex items-center gap-2.5 self-start">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f62fe] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f62fe]"></span>
                </span>
                Waiting for code...
	                    </div>
	                    {inlineOtp.primary_number.status === "idle" && inlineOtp.primary_number.error ? (
	                      <p className="mt-2 text-[12px] font-semibold text-rose-600">
	                        {inlineOtp.primary_number.error}
	                      </p>
	                    ) : null}
	                  </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                maxLength="4"
                value={state.value}
                onChange={(e) => {
	                  const val = e.target.value.replace(/\D/g, '');
                  setInlineOtp(prev => ({ ...prev, [field]: { ...prev[field], value: val } }));
                }}
                placeholder="0000"
                className="w-32 rounded-xl border-2 border-[#cbd5e1] bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-[#0f172a] shadow-sm outline-none transition focus:border-[#0f62fe] focus:ring-4 focus:ring-[#0f62fe]/10"
              />
              <button
                type="button"
                disabled={state.value.length < 4 || state.status === 'verifying'}
                onClick={() => handleVerifyInlineOtp(field)}
                className="flex items-center gap-2 rounded-xl bg-[#64748b] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#475467] disabled:opacity-50"
              >
                {state.status === 'verifying' ? 'Verifying...' : 'Confirm Code ✓'}
              </button>
            </div>
            {state.error && <p className="mt-3 text-[13px] font-semibold text-rose-600">{state.error}</p>}
	                    </div>
	                    {inlineOtp.whatsapp_number.status === "idle" && inlineOtp.whatsapp_number.error ? (
	                      <p className="mt-2 text-[12px] font-semibold text-rose-600">
	                        {inlineOtp.whatsapp_number.error}
	                      </p>
	                    ) : null}
	                    </div>
	                    {inlineOtp.business_email.status === "idle" && inlineOtp.business_email.error ? (
	                      <p className="mt-2 text-[12px] font-semibold text-rose-600">
	                        {inlineOtp.business_email.error}
	                      </p>
	                    ) : null}
	                  </div>
    );
	  };

	  const renderInlineVerify = (field, phoneWithCode) => {
	    const isChanged =
	      field === "primary_number"
	        ? editForm.primary_number !== defaultEditForm.primary_number ||
	          editForm.country_code !== defaultEditForm.country_code
	        : field === "whatsapp_number"
	          ? editForm.whatsapp_number !== defaultEditForm.whatsapp_number ||
	            editForm.whatsapp_country_code !== defaultEditForm.whatsapp_country_code
	          : editForm.business_email !== defaultEditForm.business_email;

	    const state = inlineOtp[field] || {
	      status: "idle",
	      value: "",
	      error: "",
	      resetKey: 0,
	    };

	    if (!isChanged) return null;
	    if (state.status !== "sent" && state.status !== "verifying") return null;

	    return (
	      <div className="mt-4 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 col-span-full">
	        <div className="flex flex-col gap-2">
	          <p className="text-[13px] font-semibold text-[#0f172a]">Enter OTP</p>
	          <p className="text-[12.5px] text-[#64748b]">
	            OTP sent to <span className="font-semibold text-[#0f172a]">{phoneWithCode}</span>
	          </p>
	        </div>

	        <OtpInput
	          length={4}
	          resetKey={state.resetKey}
	          onComplete={(otp) =>
	            setInlineOtp((prev) => ({
	              ...prev,
	              [field]: { ...(prev[field] || {}), value: String(otp || "") },
	            }))
	          }
	          wrapperClassName="my-4 justify-start"
	          inputClassName="[-webkit-text-security:none] [text-security:none]"
	        />

	        <div className="flex flex-wrap items-center gap-3">
	          <button
	            type="button"
	            disabled={String(state.value || "").length !== 4 || state.status === "verifying"}
	            onClick={() => handleVerifyInlineOtp(field)}
	            className="rounded-2xl bg-[#0f172a] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#0d1320] disabled:cursor-not-allowed disabled:bg-[#e2e8f0] disabled:text-[#94a3b8]"
	          >
	            {state.status === "verifying" ? "Verifying..." : "Verify OTP"}
	          </button>

	          <button
	            type="button"
	            disabled={state.status === "verifying"}
	            onClick={() => {
	              if (field === "primary_number") {
	                openOtpDeliveryModal("primary_number");
	                return;
	              }
	              handleSendInlineOtp(field);
	            }}
	            className="rounded-2xl border border-[#eef0f4] bg-white px-6 py-3 text-[13px] font-semibold text-[#0f172a] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
	          >
	            Resend OTP
	          </button>
	        </div>

	        {state.error ? (
	          <p className="mt-3 text-[13px] font-semibold text-rose-600">{state.error}</p>
	        ) : null}
	      </div>
	    );
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
		        {otpDeliveryModal.open ? (
		          <div
		            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4 backdrop-blur-sm"
		            onClick={closeOtpDeliveryModal}
		          >
		            <div
		              className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl"
		              onClick={(e) => e.stopPropagation()}
		            >
		              <div className="flex items-center justify-between gap-3">
		                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
		                  Select delivery method
		                </p>
		                <button
		                  type="button"
		                  onClick={closeOtpDeliveryModal}
		                  className="grid h-10 w-10 place-items-center rounded-2xl border border-[#eef0f4] bg-white text-[#0f172a] hover:bg-[#f8fafc] transition"
		                  aria-label="Close"
		                >
		                  ×
		                </button>
		              </div>

		              <div className="mt-6 grid gap-4 md:grid-cols-2">
		                <button
		                  type="button"
		                  onClick={() => handleSelectOtpDelivery("sms")}
		                  className="flex w-full items-center gap-4 rounded-3xl border border-[#eef0f4] bg-white p-5 text-left shadow-sm transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
		                >
		                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f1f5f9] text-[#0f172a]">
		                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		                      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
		                    </svg>
		                  </div>
		                  <div className="min-w-0">
		                    <p className="text-[15px] font-semibold text-[#0f172a]">SMS Message</p>
		                    <p className="mt-0.5 text-[12.5px] text-[#64748b]">Standard text rates apply</p>
		                  </div>
		                </button>

		                <button
		                  type="button"
		                  onClick={() => handleSelectOtpDelivery("whatsapp")}
		                  className="flex w-full items-center gap-4 rounded-3xl border border-[#eef0f4] bg-white p-5 text-left shadow-sm transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
		                >
		                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
		                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.16a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
		                    </svg>
		                  </div>
		                  <div className="min-w-0">
		                    <p className="text-[15px] font-semibold text-[#0f172a]">WhatsApp</p>
		                    <p className="mt-0.5 text-[12.5px] text-[#64748b]">Faster delivery</p>
		                  </div>
		                </button>
		              </div>
		            </div>
		          </div>
		        ) : null}
	
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
	                    Manage your branch contact details — OTP verification is required for contact changes.
	                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                  } else {
                    setIsEditing(true);
                    setFormError("");
                    setFormSuccess("");
                  }
                }}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  isEditing
                    ? "border-[#e2e8f0] bg-white text-[#475467]"
                    : "border-[#eef0f4] bg-[#f8fafc] text-[#0f172a] hover:bg-white"
                }`}
              >
                {isEditing ? "Cancel" : "Edit Details"}
              </button>
            </div>

            {formError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {formError}
              </div>
            ) : null}

            {formSuccess ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {formSuccess}
              </div>
            ) : null}

            {isEditing ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                    <label className="text-xs font-semibold text-[#64748b]" htmlFor="branch-primary-number">
                      Primary Mobile Number
                    </label>
                    <div className="relative mt-2">
                        <input
                        id="branch-primary-number"
                        value={editForm.primary_number}
                        onChange={(e) => handleEditChange("primary_number", e.target.value)}
                        className={`w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#0f62fe] ${inlineOtp.primary_number.status !== 'idle' || (editForm.primary_number !== defaultEditForm.primary_number && editForm.primary_number) ? 'pr-28' : ''}`}
                        placeholder="9876543210"
                        />
	                        {(editForm.primary_number !== defaultEditForm.primary_number || editForm.country_code !== defaultEditForm.country_code) && inlineOtp.primary_number.status === 'idle' && editForm.primary_number && (
	                          <button
	                            type="button"
	                            onClick={() => openOtpDeliveryModal("primary_number")}
	                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl bg-[#0f172a] px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#1e293b]"
	                          >
	                            Verify
	                          </button>
	                        )}
                        {inlineOtp.primary_number.status === 'sending' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748b]">Sending...</span>
                        )}
                        {(inlineOtp.primary_number.status === 'sent' || inlineOtp.primary_number.status === 'verifying') && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0f62fe] bg-[#eff6ff] px-2 py-1 rounded-md flex items-center gap-1.5 uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0f62fe] animate-pulse"></span>
                                OTP SENT
                            </span>
                        )}
                        {inlineOtp.primary_number.status === 'verified' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                    <label className="text-xs font-semibold text-[#64748b]" htmlFor="branch-country-code">
                      Country Code
                    </label>
                    <input
                      id="branch-country-code"
                      value={editForm.country_code}
                      onChange={(e) => handleEditChange("country_code", e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#0f62fe]"
                      placeholder="+91"
                    />
                  </div>
                  {renderInlineVerify('primary_number', getOtpTargetLabel('primary_number'))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                    <label className="text-xs font-semibold text-[#64748b]" htmlFor="branch-whatsapp-number">
                      WhatsApp Number
                    </label>
                    <div className="relative mt-2">
                        <input
                        id="branch-whatsapp-number"
                        value={editForm.whatsapp_number}
                        onChange={(e) => handleEditChange("whatsapp_number", e.target.value)}
                        className={`w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#0f62fe] ${inlineOtp.whatsapp_number.status !== 'idle' || (editForm.whatsapp_number !== defaultEditForm.whatsapp_number && editForm.whatsapp_number) ? 'pr-28' : ''}`}
                        placeholder="7874638498"
                        />
                        {(editForm.whatsapp_number !== defaultEditForm.whatsapp_number || editForm.whatsapp_country_code !== defaultEditForm.whatsapp_country_code) && inlineOtp.whatsapp_number.status === 'idle' && editForm.whatsapp_number && (
	                            <button type="button" onClick={() => handleSendInlineOtp('whatsapp_number')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl bg-[#0f172a] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1e293b]">
	                                Verify
	                            </button>
	                        )}
                        {inlineOtp.whatsapp_number.status === 'sending' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748b]">Sending...</span>
                        )}
                        {(inlineOtp.whatsapp_number.status === 'sent' || inlineOtp.whatsapp_number.status === 'verifying') && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0f62fe] bg-[#eff6ff] px-2 py-1 rounded-md flex items-center gap-1.5 uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0f62fe] animate-pulse"></span>
                                OTP SENT
                            </span>
                        )}
                        {inlineOtp.whatsapp_number.status === 'verified' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                    <label className="text-xs font-semibold text-[#64748b]" htmlFor="branch-whatsapp-country-code">
                      WhatsApp Country Code
                    </label>
                    <input
                      id="branch-whatsapp-country-code"
                      value={editForm.whatsapp_country_code}
                      onChange={(e) => handleEditChange("whatsapp_country_code", e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#0f62fe]"
                      placeholder="+91"
                    />
                  </div>
                  {renderInlineVerify('whatsapp_number', getOtpTargetLabel('whatsapp_number'))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#64748b]" htmlFor="branch-business-email">
                      Business Email
                    </label>
                    <div className="relative mt-2">
                        <input
                        id="branch-business-email"
                        value={editForm.business_email}
                        onChange={(e) => handleEditChange("business_email", e.target.value)}
                        className={`w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#0f62fe] ${inlineOtp.business_email.status !== 'idle' || (editForm.business_email !== defaultEditForm.business_email && editForm.business_email) ? 'pr-28' : ''}`}
                        placeholder="branch@example.com"
                        />
                        {editForm.business_email !== defaultEditForm.business_email && inlineOtp.business_email.status === 'idle' && editForm.business_email && (
	                            <button type="button" onClick={() => handleSendInlineOtp('business_email')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl bg-[#0f172a] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1e293b]">
	                                Verify
	                            </button>
	                        )}
                        {inlineOtp.business_email.status === 'sending' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748b]">Sending...</span>
                        )}
                        {(inlineOtp.business_email.status === 'sent' || inlineOtp.business_email.status === 'verifying') && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0f62fe] bg-[#eff6ff] px-2 py-1 rounded-md flex items-center gap-1.5 uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0f62fe] animate-pulse"></span>
                                OTP SENT
                            </span>
                        )}
                        {inlineOtp.business_email.status === 'verified' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                  </div>
                  {renderInlineVerify('business_email', getOtpTargetLabel('business_email'))}
                </div>

                <div className="rounded-3xl border border-[#eef0f4] bg-[#fbfcfe] p-5">
                  <p className="text-xs font-semibold text-[#64748b]">Branch Logo</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="branch-logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleChooseLogoFile(e.target.files?.[0] || null)}
                      className="w-full rounded-3xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none"
                    />
                    <div className="min-w-0 text-sm text-[#64748b]">
                      {branchLogoPreview ? (
                        <span>Preview selected logo</span>
                      ) : getCurrentBranchLogoUrl() ? (
                        <span>Current logo will remain unless you choose a new file.</span>
                      ) : (
                        <span>No logo selected.</span>
                      )}
                    </div>
                  </div>
                  {branchLogoPreview ? (
                    <div className="mt-4 max-w-45 overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white">
                      <img src={branchLogoPreview} alt="Logo preview" className="h-24 w-full object-cover" />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveDetails}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      saving
                        ? "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                        : "bg-[#0f172a] text-white hover:bg-[#0d1320]"
                    }`}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCancelEdit}
                    className="rounded-2xl border border-[#eef0f4] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {!isEditing ? (
              <>
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
              </>
            ) : null}
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
                      <div className="aspect-4/3 bg-slate-100">
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
