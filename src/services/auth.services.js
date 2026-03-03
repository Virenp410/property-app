import api from "./api";

export const signupUser = async (payload) => {
  const response = await api.post("/v1/user/signup", payload);
  return response.data;
};

export const checkSeanebId = async (seaneb_id) => {
  const response = await api.post("/v1/seanebid/check", { seaneb_id });
  return response.data;
};
