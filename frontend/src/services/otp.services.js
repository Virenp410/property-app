import api from "./api";
import { PRODUCT_KEY } from "@/lib/productKey";
import { getJsonCookie } from "./cookieStore";

/*  MOBILE OTP  */

export const sendOtp = (ctx) => {
  const productKey = String(ctx?.product_key || PRODUCT_KEY).trim();
  return api.post(
    "/v1/otp/send-otp",
    {
      identifier_type: ctx.identifier_type,
      country_code: ctx.country_code,
      mobile_number: ctx.mobile_number,
      purpose: ctx.purpose,
      via: ctx.via,
      product_key: productKey,
    },
    { withCredentials: false }
  );
};

export const verifyOtp = ({ otp }) => {
  if (typeof window === "undefined") {
    throw new Error("Session not available");
  }

  const ctx = getJsonCookie("otp_context");
  if (!ctx) {
    throw new Error("OTP context missing. Please request OTP again.");
  }

  const productKey = String(ctx?.product_key || PRODUCT_KEY).trim();

  return api.post(
    "/v1/otp/verify-otp",
    {
      identifier_type: ctx.identifier_type,
      country_code: ctx.country_code,
      mobile_number: ctx.mobile_number,
      otp,
      purpose: ctx.purpose,
      product_key: productKey,
    },
    { withCredentials: false }
  );
};

/* EMAIL OTP */

export const sendEmailOtp = ({ email, purpose = 1 }) => {
  return api.post(
    "/v1/auth/email/send-otp",
    {
      email,
      purpose,
      product_key: PRODUCT_KEY,
    },
    { withCredentials: false }
  );
};

export const verifyEmailOtp = ({ email, otp, purpose = 1 }) => {
  return api.post(
    "/v1/auth/email/verify-otp",
    {
      email,
      otp,
      purpose,
      product_key: PRODUCT_KEY,
    },
    { withCredentials: false }
  );
};

