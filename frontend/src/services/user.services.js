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

const toBool = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return false;
  if (text === "true") return true;
  if (text === "1") return true;
  if (text === "yes") return true;
  return false;
};

const extractUserProfile = (payload) => {
  const user = readProfileSource(payload);
  const business = user.business || {};

  const fullName = toTitleCase(user.full_name || user.fullName || user.name || "");
  const displayName = toTitleCase(user.display_name || fullName || "") || "Profile";

  const branchId = String(
    business.branch_id ||
      business.branchId ||
      user.branch_id ||
      user.branchId ||
      user?.current_branch?.branch_id ||
      user?.currentBranch?.branchId ||
      user?.branch?.branch_id ||
      user?.branch?.id ||
      ""
  ).trim();

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
    branchId,
    isBusinessRegistered: toBool(
      user.is_business_registered ??
        user.isBusinessRegistered ??
        business.is_business_registered ??
        business.isBusinessRegistered ??
        business.is_registered ??
        business.isRegistered
    ),
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

const readBusinessesSource = (payload) => payload?.data || payload || {};

const safeString = (value) => String(value || "").trim();

const pickFirstString = (obj, keys) => {
  if (!obj || !Array.isArray(keys)) return "";
  for (const key of keys) {
    const value = safeString(obj[key]);
    if (value) return value;
  }
  return "";
};

export const getUserBusinessesWithBranches = async () => {
  const productKey = getActiveProductKey();

  const response = await api.get("/v1/profile/businesses", {
    params: { _t: Date.now() },
    headers: { "x-product-key": productKey },
  });

  return response.data || {};
};

export const mapBusinessesToBranches = (payload) => {
  // Dig through layers to find the actual data object
  const unwrap = (obj) => obj?.data || obj;
  const layer1 = unwrap(payload);   // strips first .data wrapper (axios / {success, data})
  const layer2 = unwrap(layer1);    // strips second .data wrapper if double-wrapped

  // Find branches — try multiple known locations
  let branches = [];

  // Case 1: Branches array directly on the data object (flat structure from Swagger spec)
  //   { data: { user_id, Branches: [...] } }
  const findBranchesArray = (obj) =>
    Array.isArray(obj?.Branches) ? obj.Branches
    : Array.isArray(obj?.branches) ? obj.branches
    : null;

  branches = findBranchesArray(layer2) || findBranchesArray(layer1) || findBranchesArray(payload) || [];

  // Case 2: data is itself an array of business objects, each with nested branches
  //   { data: [ { business_id, branches: [...] } ] }
  if (branches.length === 0 && Array.isArray(layer1)) {
    branches = layer1.flatMap((biz) => {
      const bizBranches = biz?.Branches || biz?.branches || [];
      if (!Array.isArray(bizBranches)) return [];
      return bizBranches.map((branch) => ({
        ...branch,
        Business: branch?.Business || {
          business_id: safeString(biz?.business_id),
          business_name: safeString(biz?.business_name),
          display_name: safeString(biz?.display_name),
          business_status: biz?.business_status,
        },
      }));
    });
  }

  if (!Array.isArray(branches) || branches.length === 0) return [];

  return branches.map((branch) => {
    const location = branch?.location || {};
    const business = branch?.Business || {};
    const role = branch?.UserBranches?.[0]?.Role?.role_name;

    const city = safeString(location?.city);
    const area = safeString(location?.area);
    const pincode = safeString(location?.pincode);

    const displaySub = [city, area].filter(Boolean).join(" \u00B7 ");

    const logo = pickFirstString(branch, [
      "branch_logo",
      "logo",
      "logo_url",
      "s3_path",
      "bucket_path",
      "photo",
      "photo_url",
      "picture",
      "picture_url",
    ]);
    
    if (logo) {
      console.log("[mapBusinessesToBranches] Branch logo found:", { branchId: branch?.branch_id, logoValue: logo, branchKeys: Object.keys(branch || {}).slice(0, 15) });
    }

    return {
      id: safeString(branch?.branch_id) || safeString(branch?.id),
      name:
        safeString(business?.display_name) ||
        safeString(branch?.branch_name) ||
        safeString(business?.business_name) ||
        "Branch",
      city,
      subtitle: displaySub,
      pincode,
      logo,
      isDefault: branch?.is_default_branch === true,
      branchStatus: Number(branch?.branch_status || 0),
      onboardingStatus: Number(branch?.onboarding_status || 0),
      businessId: safeString(business?.business_id),
      businessName: safeString(business?.business_name),
      businessStatus: Number(business?.business_status || 0),
      role: safeString(role),
      raw: branch,
    };
  });
};
