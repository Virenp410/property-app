import api from "./api";

// SIGNUP (NO SESSION HERE)
export const signupUser = async (payload) => {
  const res = await api.post("/v1/user/signup", payload);
  return res.data;
};

// CHECK SeaNeB ID
export const checkSeanebId = async (seaneb_id) => {
  const res = await api.post("/v1/seanebid/check", {
    seaneb_id,
  });
  return res.data;
};



