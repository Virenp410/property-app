"use client";

import Link from "next/link";

export default function StateList({ states, country, countryName }) {
  if (!states || states.length === 0) {
    return (
      <div className="empty-state">
        <p>No states found</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h2>Select State ({states.length})</h2>
      <div className="items-grid">
        {states.map((state) => (
          <Link
            key={state.slug || state.routeSlug}
            href={`/${country}/${state.routeSlug || state.slug}`}
            className="list-card"
          >
            <h3>{state.name}</h3>
            <p>Click to view cities</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
