import api from "./api";

const toText = (value) => String(value || "").trim();

const normalizeCityRecord = (item) => {
  const cityName = toText(item?.city_name || item?.name || item?.label);
  if (!cityName) return null;

  const stateName = toText(item?.state_name || item?.state || item?.stateName);
  const countryName = toText(item?.country_name || item?.country || item?.countryName);
  const placeId = toText(item?.place_id || item?.city_id || item?.id || item?.placeId);

  return {
    city_name: cityName,
    state_name: stateName,
    country_name: countryName,
    place_id: placeId || cityName.toLowerCase().replace(/\s+/g, "-"),
  };
};

const extractCityList = (payload) => {
  const list =
    (Array.isArray(payload?.cities) && payload.cities) ||
    (Array.isArray(payload?.data?.cities) && payload.data.cities) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.results) && payload.results) ||
    [];

  return list.map(normalizeCityRecord).filter(Boolean);
};

const shouldThrowImmediately = (status) => [400, 401, 403].includes(Number(status || 0));

export const getCities = async (input) => {
  const query = toText(input);
  if (query.length < 2) return [];

  let autocompleteError = null;
  try {
    const res = await api.get("/v1/autocomplete-cities", {
      params: { input: query },
    });

    const autoCities = extractCityList(res?.data);
    if (autoCities.length) return autoCities;
  } catch (err) {
    const status = Number(err?.response?.status || 0);
    if (shouldThrowImmediately(status)) throw err;
    autocompleteError = err;
  }

  try {
    const res = await api.get("/v1/cities", {
      params: {
        search: query,
        limit: 20,
      },
    });

    const allCities = extractCityList(res?.data);
    const lowerQuery = query.toLowerCase();

    return allCities
      .filter((city) => city.city_name.toLowerCase().includes(lowerQuery))
      .slice(0, 20);
  } catch (err) {
    const status = Number(err?.response?.status || 0);
    if ([500, 502, 503, 504].includes(status)) return [];
    if (autocompleteError && !status) throw autocompleteError;
    throw err;
  }
};

