"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import partnerData from "@/app/jsondata/partnerPage.json";

export default function PartnerPage() {
  const [activeMarket, setActiveMarket] = useState(partnerData.pricing.marketTabs[0]);

  const activePlans = useMemo(() => {
    return partnerData.pricing.marketPlans[activeMarket] || [];
  }, [activeMarket]);

  return (
    <main className="partnerautos-page">
      <section className="partnerautos-hero">
        <div className="partnerautos-container">
          <h1>{partnerData.hero.title}</h1>
          <p>{partnerData.hero.subtitle}</p>
        </div>
      </section>

      <section className="partnerautos-intro">
        <div className="partnerautos-container">
          <h2>{partnerData.intro.title}</h2>
          {partnerData.intro.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </section>

      <section className="partnerautos-pricing">
        <div className="partnerautos-container">
          <div className="partnerautos-head">
            <h2>{partnerData.pricing.title}</h2>
            <p>{partnerData.pricing.subtitle}</p>
          </div>

          <div className="partnerautos-pricing-tabs" aria-label="Market regions">
            {partnerData.pricing.marketTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`partnerautos-pricing-tab ${activeMarket === tab ? "active" : ""}`}
                onClick={() => setActiveMarket(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="partnerautos-plan-grid">
            {activePlans.map((plan) => (
              <article
                key={`${activeMarket}-${plan.name}`}
                className={`partnerautos-plan-card ${
                  plan.recommended ? "recommended" : ""
                }`}
              >
                {plan.recommended && <span className="partnerautos-badge">Popular</span>}
                <h3>{plan.name}</h3>
                <div className="partnerautos-plan-price">
                  <strong>{plan.price}</strong>
                  <span>{plan.billing}</span>
                </div>
                <p>{plan.desc}</p>
                <button type="button">{plan.cta}</button>
                <ul className="partnerautos-plan-features">
                  {plan.includedFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                  {plan.excludedFeatures?.map((feature) => (
                    <li key={feature} className="excluded">
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="partnerautos-plan-meta">{plan.footerText}</div>
              </article>
            ))}
          </div>
          <p className="partnerautos-pricing-note">{partnerData.pricing.note}</p>
        </div>
      </section>

      <section className="partnerautos-benefits">
        <div className="partnerautos-container partnerautos-benefit-layout">
          <div>
            <h2>{partnerData.benefits.title}</h2>
            <ul>
              {partnerData.benefits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href={partnerData.benefits.ctaHref} className="partnerautos-features-link">
              {partnerData.benefits.ctaLabel}
            </Link>
          </div>

          <div className="partnerautos-benefit-image">
            <Image
              src={partnerData.benefits.image}
              alt="Partner benefits"
              width={560}
              height={380}
            />
          </div>
        </div>
      </section>

      <section className="partnerautos-steps">
        <div className="partnerautos-container">
          <div className="partnerautos-head">
            <h2>{partnerData.steps.title}</h2>
          </div>
          <div className="partnerautos-step-grid">
            {partnerData.steps.items.map((step, index) => (
              <div key={step} className="partnerautos-step-card">
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="partnerautos-faq">
        <div className="partnerautos-container">
          <div className="partnerautos-head">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="partnerautos-faq-list">
            {partnerData.faq.map((item) => (
              <details key={item.q} className="partnerautos-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="partnerautos-cta">
        <div className="partnerautos-container partnerautos-cta-row">
          <h3>{partnerData.cta.title}</h3>
          <button type="button">{partnerData.cta.button}</button>
        </div>
      </section>
    </main>
  );
}
