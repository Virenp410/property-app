import api from "./api";
import { PRODUCT_KEY } from "./productKey";

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const joinName = (first, last) => {
  const full = `${String(first || "").trim()} ${String(last || "").trim()}`.trim();
  return toTitleCase(full);
};

const pickUserObject = (payload) => {
  if (!payload) return null;
  if (payload.user && typeof payload.user === "object") return payload.user;
  if (payload.data && typeof payload.data === "object") {
    if (payload.data.user && typeof payload.data.user === "object") return payload.data.user;
    return payload.data;
  }
  if (payload.result && typeof payload.result === "object") {
    if (payload.result.user && typeof payload.result.user === "object") return payload.result.user;
    return payload.result;
  }
  return payload;
};

const asObject = (value) =>
  value && typeof value === "object" ? value : {};

const firstItem = (value) =>
  Array.isArray(value) && value.length > 0 ? value[0] : null;

const extractNestedObject = (source, key) => {
  const obj = asObject(source);
  const direct = obj?.[key];
  if (direct && typeof direct === "object") return direct;
  return null;
};

const pickFirstString = (sources, keys) => {
  for (const source of sources) {
    const obj = asObject(source);
    for (const key of keys) {
      const value = String(obj?.[key] || "").trim();
      if (value) return value;
    }
  }
  return "";
};

const parseBooleanLike = (value) => {
  if (value === true || value === false) return value;
  if (value === 1) return true;
  if (value === 0) return false;

  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return null;
};

const resolveBooleanState = (sources, keys) => {
  let sawFalse = false;
  for (const source of sources) {
    const obj = asObject(source);
    for (const key of keys) {
      const parsed = parseBooleanLike(obj?.[key]);
      if (parsed === true) return true;
      if (parsed === false) sawFalse = true;
    }
  }
  return sawFalse ? false : null;
};

const BUSINESS_ID_KEYS = [
  "business_id",
  "businessId",
  "branch_id",
  "branchId",
  "default_branch_id",
  "defaultBranchId",
  "organization_id",
  "organizationId",
  "seaneb_id",
  "seanebId",
];

const hasAnyIdentifier = (source) => {
  const obj = asObject(source);
  for (const key of BUSINESS_ID_KEYS) {
    const value = String(obj?.[key] || "").trim();
    if (value) return true;
  }
  return false;
};

const hasRegisteredBusinessRecord = (sources) => {
  const nestedKeys = ["business", "business_profile", "businessProfile", "default_business", "defaultBusiness"];
  const listKeys = ["businesses", "branches"];

  for (const source of sources) {
    if (hasAnyIdentifier(source)) return true;

    const obj = asObject(source);

    for (const nestedKey of nestedKeys) {
      if (hasAnyIdentifier(obj?.[nestedKey])) return true;
    }

    for (const listKey of listKeys) {
      const list = obj?.[listKey];
      if (Array.isArray(list) && list.some((item) => hasAnyIdentifier(item))) {
        return true;
      }
    }
  }

  return false;
};

const extractDisplayName = (payload) => {
  const user = pickUserObject(payload) || {};
  const full = toTitleCase(
    user.full_name ||
      user.name ||
      user.user_name ||
      user.username ||
      user.display_name ||
      ""
  );
  if (full) return full;

  const firstLast = joinName(user.first_name || user.firstName, user.last_name || user.lastName);
  if (firstLast) return firstLast;

  const email = String(user.email || "").trim();
  if (email.includes("@")) return toTitleCase(email.split("@")[0]);

  return "";
};

const extractUserProfile = (payload) => {
  const user = pickUserObject(payload) || {};
  const payloadData = asObject(payload?.data);
  const payloadResult = asObject(payload?.result);
  const userBusiness = extractNestedObject(user, "business");
  const userBusinessProfile = extractNestedObject(user, "business_profile") || extractNestedObject(user, "businessProfile");
  const payloadBusiness = extractNestedObject(payload, "business");
  const payloadBusinessProfile = extractNestedObject(payload, "business_profile") || extractNestedObject(payload, "businessProfile");
  const dataBusiness = extractNestedObject(payloadData, "business");
  const dataBusinessProfile = extractNestedObject(payloadData, "business_profile") || extractNestedObject(payloadData, "businessProfile");
  const resultBusiness = extractNestedObject(payloadResult, "business");
  const resultBusinessProfile = extractNestedObject(payloadResult, "business_profile") || extractNestedObject(payloadResult, "businessProfile");

  const userBusinessesFirst = firstItem(user?.businesses);
  const payloadBusinessesFirst = firstItem(payload?.businesses);
  const dataBusinessesFirst = firstItem(payloadData?.businesses);
  const resultBusinessesFirst = firstItem(payloadResult?.businesses);

  const userBranchesFirst = firstItem(user?.branches);
  const payloadBranchesFirst = firstItem(payload?.branches);
  const dataBranchesFirst = firstItem(payloadData?.branches);
  const resultBranchesFirst = firstItem(payloadResult?.branches);

  const businessSources = [
    user,
    userBusiness,
    userBusinessProfile,
    user?.default_business,
    user?.defaultBusiness,
    payloadBusiness,
    payloadBusinessProfile,
    payload?.default_business,
    payload?.defaultBusiness,
    dataBusiness,
    dataBusinessProfile,
    payloadData?.default_business,
    payloadData?.defaultBusiness,
    resultBusiness,
    resultBusinessProfile,
    payloadResult?.default_business,
    payloadResult?.defaultBusiness,
    userBusinessesFirst,
    payloadBusinessesFirst,
    dataBusinessesFirst,
    resultBusinessesFirst,
    userBranchesFirst,
    payloadBranchesFirst,
    dataBranchesFirst,
    resultBranchesFirst,
  ];

  const fullName = toTitleCase(
    user.full_name ||
      user.fullName ||
      user.name ||
      user.display_name ||
      ""
  );
  const seanebId = String(
    user.seaneb_id ||
      user.seanebId ||
      user.user_id ||
      user.userId ||
      ""
  ).trim();
  const firstName = String(user.first_name || user.firstName || "").trim();
  const lastName = String(user.last_name || user.lastName || "").trim();
  const displayName = extractDisplayName(payload);
  const email = String(user.email || "").trim();
  const phoneNumber = String(
    user.phone_number ||
      user.phoneNumber ||
      user.mobile_number ||
      user.mobileNumber ||
      user.mobile ||
      user.phone ||
      user.contact_number ||
      user.contactNumber ||
      ""
  ).trim();
  const gender = String(user.gender || "").trim();
  const dob = String(user.dob || user.date_of_birth || user.birth_date || "").trim();
  const hometown = String(
    user.hometown ||
      user.city_name ||
      user.city ||
      user.location ||
      user.place_name ||
      user.place ||
      ""
  ).trim();
  const profilePhoto = String(
    user.profile_photo ||
      user.profilePhoto ||
      user.avatar ||
      user.avatar_url ||
      ""
  ).trim();

  const businessName = pickFirstString(businessSources, [
    "business_name",
    "businessName",
    "display_name",
    "displayName",
    "trade_name",
    "tradeName",
    "legal_name",
    "legalName",
    "company_name",
    "companyName",
    "name",
    "biz_name",
  ]);

  const branchId = pickFirstString(businessSources, [
    "branch_id",
    "branchId",
    "default_branch_id",
    "defaultBranchId",
    "seaneb_id",
    "seanebId",
    "branch_code",
    "branchCode",
    "id",
  ]);

  const businessId = pickFirstString(businessSources, [
    "business_id",
    "businessId",
    "organization_id",
    "organizationId",
    "id",
    "biz_id",
  ]);

  const explicitBusinessRegistration = resolveBooleanState(businessSources, [
    "is_business_registered",
    "business_registered",
    "isBusinessRegistered",
    "registered_business",
    "is_business_user",
  ]);

  const inferredBusinessRegistration =
    Boolean(businessId) || Boolean(branchId) || hasRegisteredBusinessRecord(businessSources);

  const isBusinessRegistered =
    explicitBusinessRegistration === true
      ? true
      : explicitBusinessRegistration === false
      ? false
      : inferredBusinessRegistration;

  return {
    displayName,
    fullName: fullName || displayName,
    seanebId,
    firstName: toTitleCase(firstName),
    lastName: toTitleCase(lastName),
    email,
    phoneNumber,
    gender: toTitleCase(gender),
    dob,
    hometown: toTitleCase(hometown),
    profilePhoto,
    businessName,
    branchId,
    businessId,
    isBusinessRegistered,
  };
};

const PROFILE_ENDPOINTS = [
  process.env.NEXT_PUBLIC_USER_PROFILE_ENDPOINT || "",
  "/v1/profile/me",
].filter(Boolean);

export const getCurrentUserProfile = async () => {
  let lastError = null;

  for (const endpoint of PROFILE_ENDPOINTS) {
    try {
      const res = await api.get(endpoint, {
        params: {
          _t: Date.now(),
        },
        headers: {
          "x-product-key": PRODUCT_KEY,
        },
      });
      const payload = res?.data || {};
      const profile = extractUserProfile(payload);
      if (profile.displayName || profile.seanebId) {
        return { displayName: profile.displayName, payload, profile };
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error("Unable to load user profile");
};

