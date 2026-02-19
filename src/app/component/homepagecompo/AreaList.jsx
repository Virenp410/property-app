"use client";

import Link from "next/link";

export default function AreaList({ areas, country }) {
  if (!areas || areas.length === 0) {
    return (
      <div className="empty-state">
        <p>No areas found in this city</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h2>Select Area ({areas.length})</h2>
      <div className="items-grid">
        {areas.map((area) => (
          <Link
            key={area.slug}
            href={`/${country}/${area.slug}`}
            className="list-card"
          >
            <h3>{area.name}</h3>
            <p>{area.count} dealers available</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
