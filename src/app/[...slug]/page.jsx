import { notFound } from "next/navigation";
import Link from "next/link";

import { businesses } from "@/app/data/businesses";
import Navbar from "@/app/component/homepagecompo/Navbar";
import Footer from "@/app/component/homepagecompo/Footer";
import StateList from "@/app/component/homepagecompo/StateList";
import CityList from "@/app/component/homepagecompo/CityList";
import BusinessList from "@/app/component/homepagecompo/BusinessList";
import BackButton from "@/app/component/BackButton";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
const PRODUCT_KEY = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "auto").trim() || "auto";
const LOCATION_API_ROOT = String(process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev.seaneb.com/api").replace(/\/$/, "");
const LOCATION_API_BASE = `${LOCATION_API_ROOT}/v1/location/${PRODUCT_KEY}`;

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createMeta = ({ title, description, path }) => ({
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
});

function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

async function fetchLocation(path) {
  try {
    const res = await fetch(`${LOCATION_API_BASE}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.success && Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}

const mapCountry = (item) => ({
  code: String(item?.country_slug || "").toLowerCase(),
  name: String(item?.country_name || "").trim(),
});

const mapState = (item) => {
  const apiSlug = String(item?.state_slug || "").toLowerCase();
  const name = String(item?.state_name || "").trim();
  return { slug: apiSlug, name, routeSlug: slugify(name) };
};

const mapCity = (item, stateSlug) => {
  const citySlug = String(item?.city_slug || "").toLowerCase();
  const routeSlug = citySlug.endsWith(`-${stateSlug}`) ? citySlug : `${citySlug}-${stateSlug}`;
  return { slug: citySlug, name: String(item?.city_name || "").trim(), routeSlug };
};

const mapBusiness = (item) => ({
  slug: String(item?.seaneb_id || item?.business_id || "").toLowerCase() || slugify(item?.display_name || "business"),
  name: String(item?.display_name || item?.business_name || "Business").trim(),
  rating: String(item?.rating || "N/A"),
  reviews: Number(item?.review_count || 0),
  address: String(item?.address || "Address not available"),
  phone: String(item?.phone || "Not available"),
  description: String(item?.description || "Business details are available on request."),
  features: Array.isArray(item?.features) ? item.features : [],
});

async function getCountries() {
  return (await fetchLocation("/countries")).map(mapCountry).filter((c) => c.code);
}

async function getStates(countrySlug) {
  return (await fetchLocation(`/${countrySlug}/states`)).map(mapState).filter((s) => s.slug);
}

async function getCities(countrySlug, stateSlug) {
  return (await fetchLocation(`/${countrySlug}/${stateSlug}/cities`))
    .map((row) => mapCity(row, stateSlug))
    .filter((c) => c.slug);
}

async function getCityBusinesses(countrySlug, stateSlug, citySlug) {
  return (await fetchLocation(`/${countrySlug}/${stateSlug}/${citySlug}/businesses`)).map(mapBusiness);
}

async function findBusinessBySlugFromApi(businessSlug) {
  const countries = await getCountries();
  for (const country of countries) {
    const states = await getStates(country.code);
    for (const state of states) {
      const cities = await getCities(country.code, state.slug);
      for (const city of cities) {
        const cityBusinesses = await getCityBusinesses(country.code, state.slug, city.slug);
        const match = cityBusinesses.find((item) => item.slug === businessSlug);
        if (match) return match;
      }
    }
  }
  return null;
}

async function resolveStateByRoute(countrySlug, routeStateSlug) {
  const stateRows = await getStates(countrySlug);
  const state = stateRows.find((s) => s.routeSlug === routeStateSlug || s.slug === routeStateSlug);
  return state || null;
}

async function resolveCityByRoute(countrySlug, routeCitySlug) {
  const states = await getStates(countrySlug);
  if (!states.length) return null;

  const suffix = routeCitySlug.split("-").pop();
  const preferredState = states.find((s) => s.slug === suffix);
  const queue = preferredState ? [preferredState, ...states.filter((s) => s.slug !== suffix)] : states;

  for (const state of queue) {
    const cities = await getCities(countrySlug, state.slug);
    const city = cities.find((c) => c.routeSlug === routeCitySlug || c.slug === routeCitySlug);
    if (city) return { state, city };
  }
  return null;
}

function findBusinessBySlug(businessSlug) {
  for (const areaSlug of Object.keys(businesses)) {
    const found = (businesses[areaSlug] || []).find((b) => b.slug === businessSlug);
    if (found) return found;
  }
  return null;
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = (resolved?.slug || []).map((s) => String(s).toLowerCase());
  if (!slug.length) return createMeta({ title: "SeaNeB Autos", description: "Find verified dealers.", path: "/" });

  if (slug.length === 1) {
    const [first] = slug;
    const countries = await getCountries();
    const country = countries.find((c) => c.code === first);
    if (country) return createMeta({ title: `Pre-owned Cars in ${country.name}`, description: `Browse dealers in ${country.name}.`, path: `/${first}` });
    const business = findBusinessBySlug(first);
    if (business) return createMeta({ title: business.name, description: business.description, path: `/${first}` });
    return {};
  }

  if (slug.length === 2) {
    const [countrySlug, second] = slug;
    const state = await resolveStateByRoute(countrySlug, second);
    if (state) return createMeta({ title: `Used Cars in ${state.name}`, description: `Explore dealers in ${state.name}.`, path: `/${countrySlug}/${second}` });
    const cityCtx = await resolveCityByRoute(countrySlug, second);
    if (cityCtx) return createMeta({ title: `Car Dealers in ${cityCtx.city.name}`, description: `Browse dealers in ${cityCtx.city.name}.`, path: `/${countrySlug}/${second}` });
  }

  return createMeta({ title: "SeaNeB Autos", description: "Find verified dealers.", path: `/${slug.join("/")}` });
}

export default async function DynamicPage({ params }) {
  const resolved = await params;
  const slug = (resolved?.slug || []).map((s) => String(s).toLowerCase());
  if (!slug.length) return notFound();

  if (slug.length === 1) {
    const [first] = slug;
    const countries = await getCountries();
    const country = countries.find((c) => c.code === first);
    if (country) return <CountryPage country={country} />;
    const business = findBusinessBySlug(first);
    if (business) return <BusinessDetailPage business={business} />;
    const apiBusiness = await findBusinessBySlugFromApi(first);
    if (apiBusiness) return <BusinessDetailPage business={apiBusiness} />;
    return notFound();
  }

  const [countrySlug, second] = slug;
  const countries = await getCountries();
  const country = countries.find((c) => c.code === countrySlug);
  if (!country) return notFound();

  const state = await resolveStateByRoute(countrySlug, second);
  if (state) return <StatePage country={country} state={state} />;

  const cityCtx = await resolveCityByRoute(countrySlug, second);
  if (cityCtx) return <CityPage country={country} state={cityCtx.state} city={cityCtx.city} />;

  return notFound();
}

async function CountryPage({ country }) {
  const stateList = await getStates(country.code);
  if (!stateList.length) return notFound();

  return (
    <>
      <Navbar />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `Pre-owned Cars in ${country.name}`, url: `${SITE_URL}/${country.code}` }} />
      <div className="dynamic-page">
        <div className="breadcrumb-container">
          <BackButton className="breadcrumb-back-btn" fallbackPath="/" />
          <Link href="/">Home</Link> / <span>{country.name}</span>
        </div>
        <div className="page-header">
          <h1>Find Quality Pre-owned Cars in {country.name}</h1>
          <p>Select a state to browse available second-hand vehicles</p>
        </div>
        <StateList states={stateList} country={country.code} countryName={country.name} />
      </div>
      <Footer />
    </>
  );
}

async function StatePage({ country, state }) {
  const cityList = await getCities(country.code, state.slug);
  if (!cityList.length) return notFound();

  return (
    <>
      <Navbar />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `Used Cars in ${state.name}`, url: `${SITE_URL}/${country.code}/${state.routeSlug}` }} />
      <div className="dynamic-page">
        <div className="breadcrumb-container">
          <BackButton className="breadcrumb-back-btn" fallbackPath={`/${country.code}`} />
          <Link href="/">Home</Link> / <Link href={`/${country.code}`}>{country.name}</Link> / <span>{state.name}</span>
        </div>
        <div className="page-header">
          <h1>Pre-owned Cars Available in {state.name}</h1>
          <p>Select a city to find verified dealers</p>
        </div>
        <CityList cities={cityList} country={country.code} state={state.slug} />
      </div>
      <Footer />
    </>
  );
}

async function CityPage({ country, state, city }) {
  const businessList = await getCityBusinesses(country.code, state.slug, city.slug);
  if (!businessList.length) return notFound();

  return (
    <>
      <Navbar />
      <div className="dynamic-page">
        <div className="breadcrumb-container">
          <BackButton className="breadcrumb-back-btn" fallbackPath={`/${country.code}/${state.routeSlug}`} />
          <Link href="/">Home</Link> / <Link href={`/${country.code}`}>{country.name}</Link> / <span>{city.name}</span>
        </div>
        <div className="page-header">
          <h1>Car Dealers in {city.name}</h1>
          <p>Browse our trusted car dealers in this city</p>
        </div>
        <BusinessList businesses={businessList} country={country.code} state={state.slug} city={city.slug} />
      </div>
      <Footer />
    </>
  );
}

function BusinessDetailPage({ business }) {
  return (
    <>
      <Navbar />
      <div className="dynamic-page">
        <div className="breadcrumb-container">
          <BackButton className="breadcrumb-back-btn" fallbackPath="/" />
          <Link href="/">Home</Link> / <span>{business.name}</span>
        </div>
        <div className="business-detail-header">
          <h1>{business.name}</h1>
          <div className="business-detail-rating">
            <span className="rating-pill">★ {business.rating}</span>
            <span className="rating-reviews">{business.reviews} reviews</span>
          </div>
          <p className="business-description">{business.description}</p>
        </div>
        <div className="business-detail-content">
          <h2>Dealer Overview</h2>
          <div className="business-meta-grid">
            <div className="meta-card">
              <span className="meta-label">Address</span>
              <p>{business.address}</p>
            </div>
            <div className="meta-card">
              <span className="meta-label">Phone</span>
              <p>{business.phone}</p>
            </div>
          </div>
          <h3>Why Choose Us</h3>
          <ul className="features-list">
            {(business.features || []).map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
