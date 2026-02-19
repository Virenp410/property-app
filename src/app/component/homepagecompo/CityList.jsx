"use client";

import Link from "next/link";

export default function CityList({ cities, country, state }) {
  if (!cities || cities.length === 0) {
    return (
      <div className="empty-state">
        <p>No cities found in this state</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h2>Select City ({cities.length})</h2>
      <div className="items-grid">
        {cities.map((city) => (
          <Link
            key={city.slug || city.routeSlug}
            href={`/${country}/${city.routeSlug || city.slug}`}
            className="list-card"
          >
            <h3>{city.name}</h3>
            <p>Click to view areas</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
