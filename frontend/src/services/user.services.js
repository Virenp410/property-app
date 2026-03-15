import api from "@/lib/auth/apiClient";
import { getActiveProductKey } from "@/lib/productKey";

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const readProfileSource = (payload) => payload?.data || payload || {};

const extractUserProfile = (payload) => {
  const user = readProfileSource(payload);
  const business = user.business || {};

  const fullName = toTitleCase(user.full_name || user.fullName || user.name || "");
  const displayName = toTitleCase(user.display_name || fullName || "") || "Profile";

  return {
    displayName,
    fullName: fullName || displayName,
    seanebId: String(user.seaneb_id || user.seanebId || user.user_id || "").trim(),
    firstName: toTitleCase(user.first_name || user.firstName || ""),
    lastName: toTitleCase(user.last_name || user.lastName || ""),
    email: String(user.email || "").trim(),
    phoneNumber: String(user.phone_number || user.phoneNumber || user.mobile_number || "").trim(),
    gender: toTitleCase(user.gender || ""),
    dob: String(user.dob || "").trim(),
    hometown: toTitleCase(user.hometown || user.city_name || user.city || ""),
    profilePhoto: String(user.profile_photo || user.profilePhoto || user.avatar || "").trim(),
    businessName: String(business.business_name || business.businessName || "").trim(),
    businessId: String(business.business_id || business.businessId || "").trim(),
    branchId: String(business.branch_id || business.branchId || "").trim(),
    isBusinessRegistered: user.is_business_registered === true || user.isBusinessRegistered === true,
  };
};

export const getCurrentUserProfile = async () => {
  const productKey = getActiveProductKey();

  const response = await api.get("/v1/profile/me", {
    params: { _t: Date.now() },
    headers: { "x-product-key": productKey },
  });

  const payload = response.data || {};
  const profile = extractUserProfile(payload);

  return {
    displayName: profile.displayName,
    payload,
    profile,
  };
};
