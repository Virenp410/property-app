import api from "./api";

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
  const isBusinessRegistered =
    user.is_business_registered === true ||
    user.business_registered === true ||
    user.isBusinessRegistered === true;

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
    isBusinessRegistered,
  };
};

const PRODUCT_KEY = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "auto").trim();
const PROFILE_ENDPOINTS = [
  process.env.NEXT_PUBLIC_USER_PROFILE_ENDPOINT || "",
  "/v1/profile/me",
].filter(Boolean);

export const getCurrentUserProfile = async () => {
  let lastError = null;

  for (const endpoint of PROFILE_ENDPOINTS) {
    try {
      const res = await api.get(endpoint, {
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
