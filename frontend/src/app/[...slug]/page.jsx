import { redirect } from "next/navigation";

const toQueryString = (searchParams) => {
  const entries = Object.entries(searchParams || {}).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => [key, String(item)]);
    }
    if (value === undefined || value === null) {
      return [];
    }
    return [[key, String(value)]];
  });

  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : "";
};

export default async function LegacyListingRedirect({ params, searchParams }) {
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const path = (resolvedParams?.slug || [])
    .map((segment) => encodeURIComponent(String(segment || "")))
    .join("/");

  const query = toQueryString(resolvedSearchParams);

  if (!path) {
    redirect(`${webAppUrl}/${query}`);
  }

  redirect(`${webAppUrl}/${path}${query}`);
}



// frontend folder added