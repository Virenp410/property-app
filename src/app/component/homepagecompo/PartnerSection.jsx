"use client";

import partnerData from "@/app/jsondata/partnerSection.json";

export default function PartnerSection() {
  return (
    <section className="partner-section">
      <div className="container partner-content">
        <div className="partner-text">
          <h3>{partnerData.title}</h3>
        </div>
        <button className="partner-btn">{partnerData.buttonText}</button>
      </div>
    </section>
  );
}
