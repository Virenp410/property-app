import api from "./api";

const toText = (value) => String(value || "").trim();

const normalizeCity = (city) => ({
  city_name: toText(city.city_name || city.name),
  state_name: toText(city.state_name || city.state),
  country_name: toText(city.country_name || city.country),
  place_id: toText(city.place_id || city.city_id || city.id),
});

export const getCities = async (input) => {
  const query = toText(input);
  if (query.length < 2) return [];

  const response = await api.get("/v1/autocomplete-cities", {
    params: { input: query },
  });

  const list = response.data?.cities || [];
  return list.map(normalizeCity).filter((item) => item.city_name);
};
