"use client";

import countriesData from "@/app/jsondata/countriesSection.json";

export default function CountriesSection() {
  return (
    <section className="countries-section">
      <div className="container">
        <h2 className="text-2xl font-bold">{countriesData.title}</h2>
        <p className="font-light text-sm mt-1">{countriesData.subtitle}</p>

        <div className="country-list mt-4">
          {countriesData.countries.map((country) => (
            <div key={country} className="country-item">
              {country}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
