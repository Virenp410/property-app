import api from "./api";

export const getCities = async (input) => {
  if (!input || input.length < 2) return [];

  try {
    const res = await api.get("/v1/autocomplete-cities", {
      params: {
        input,
      },
    });

    if (res.data?.success && Array.isArray(res.data.cities)) {
      return res.data.cities;
    }

    return [];
  } catch (err) {
    const status = Number(err?.response?.status || 0);
    if ([500, 502, 503, 504].includes(status)) {
      return [];
    }
    throw err;
  }
};

