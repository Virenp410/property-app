"use client";

import Link from "next/link";

export default function CountryList({ countries }) {
  if (!countries || countries.length === 0) {
    return (
      <div className="empty-state">
        <p>No countries available</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h2>Select Your Country ({countries.length})</h2>
      <div className="items-grid">
        {countries.map((country) => (
          <Link
            key={country.code}
            href={`/${country.code}`}
            className="list-card"
          >
            <h3>{country.name}</h3>
            <p>Click to view states</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
