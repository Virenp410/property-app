"use client";

import servicesData from "@/app/jsondata/servicesPage.json";

export default function ServicesPage() {
  return (
    <main className="servicesautos-page">
      <section className="servicesautos-hero">
        <div className="servicesautos-container">
          <span className="servicesautos-badge">{servicesData.intro.badge}</span>
          <h1>{servicesData.hero.title}</h1>
          <p>{servicesData.hero.subtitle}</p>
          <p className="servicesautos-description">{servicesData.intro.description}</p>
        </div>
      </section>

      <section className="servicesautos-segments">
        <div className="servicesautos-container servicesautos-segment-grid">
          {servicesData.segments.map((segment) => (
            <article key={segment.title} className="servicesautos-segment-card">
              <h2>{segment.title}</h2>
              <ul>
                {segment.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="servicesautos-features">
        <div className="servicesautos-container">
          <div className="servicesautos-feature-grid">
            {servicesData.featureColumns.map((column) => (
              <article key={column.title} className="servicesautos-feature-column">
                <h3>{column.title}</h3>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="servicesautos-faq">
        <div className="servicesautos-container servicesautos-faq-grid">
          <div>
            <h2>Frequently Asked Questions</h2>
            <p>Clear answers to common platform and onboarding questions.</p>
          </div>
          <div className="servicesautos-faq-list">
            {servicesData.faq.map((item) => (
              <details key={item.q} className="servicesautos-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="servicesautos-cta">
        <div className="servicesautos-container servicesautos-cta-row">
          <div>
            <h3>{servicesData.cta.title}</h3>
            <p>{servicesData.cta.subtitle}</p>
          </div>
          <button type="button">{servicesData.cta.button}</button>
        </div>
      </section>
    </main>
  );
}
