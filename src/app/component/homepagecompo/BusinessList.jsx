"use client";

import Link from "next/link";

export default function BusinessList({ businesses }) {
  if (!businesses || businesses.length === 0) {
    return (
      <div className="empty-state">
        <p>No car dealers found for this location</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h2>Available Car Dealers ({businesses.length})</h2>
      <div className="items-grid-business">
        {businesses.map((business) => (
          <Link
            key={business.slug}
            href={`/${business.slug}`}
            className="business-card"
          >
            <h3>{business.name}</h3>

            <div className="rating-section">
              <span className="star">★</span>
              <span className="rating-text">
                {business.rating} ({business.reviews} reviews)
              </span>
            </div>

            <p className="business-info">
              <span className="icon">📍</span>
              {business.address}
            </p>

            <p className="business-info">
              <span className="icon">📞</span>
              {business.phone}
            </p>

            <p className="business-description">{business.description}</p>

            {business.features?.length ? (
              <div className="features-list">
                <ul>
                  {business.features.slice(0, 2).map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="cta-section">View Details →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
