"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import aboutData from "@/app/jsondata/aboutPage.json";
import styles from "./AboutPage.module.css";

export default function AboutPage() {
  const [summary, secondarySummary] = aboutData.hero.paragraphs;
  const pickSection = (heading) => aboutData.sections.find((section) => section.heading === heading);
  const focusSections = [
    pickSection("Why Seaneb Autos Was Created"),
    pickSection("A Complete Used Vehicle Marketplace  Not Just Cars"),
    pickSection("How We're Different from Traditional Platforms"),
    pickSection("Sell Used Vehicles Online with Confidence"),
  ].filter(Boolean);
  const focusHeadings = new Set(focusSections.map((section) => section.heading));
  const remainingSections = (aboutData.sections || []).filter((section) => !focusHeadings.has(section.heading));
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const activeInsight = remainingSections[activeInsightIndex] || null;
  const activeInsightBullets =
    (activeInsight?.bullets?.length || 0) +
    (activeInsight?.subBullets?.length || 0) +
    (activeInsight?.pillars?.length || 0);
  const categories = aboutData.sections[1]?.bullets ?? [];
  const trustPoints = [
    { title: "Transparent Pricing", icon: "TP" },
    { title: "Verified Listings", icon: "VL" },
    { title: "RC Transfer Assistance", icon: "RC" },
    { title: "All Vehicle Categories", icon: "AV" },
  ];
  const visualPoints = [
    {
      tag: "Coverage",
      title: "Built for every vehicle segment",
      description: "From personal mobility to business and heavy-duty use cases, one marketplace covers them all.",
    },
    {
      tag: "Discovery",
      title: "Category-first discovery",
      description: "Users can quickly browse by type and shortlist options with clearer comparisons.",
    },
    {
      tag: "Trust",
      title: "Verification and readiness checks",
      description: "Quality-focused listings start with better validation and clearer condition visibility.",
    },
    {
      tag: "Speed",
      title: "Digital-first buying and selling",
      description: "List, discover and connect faster with a simple online vehicle marketplace flow.",
    },
  ];
  const teamMembers = [
    {
      name: "Rahul Mehta",
      role: "Marketplace Operations Lead",
      bio: "Drives listing quality, seller onboarding and trust-focused operations across categories.",
    },
    {
      name: "Nisha Verma",
      role: "Customer Success Manager",
      bio: "Helps buyers and sellers with smoother communication, support clarity and issue resolution.",
    },
    {
      name: "Aman Kulkarni",
      role: "Documentation Specialist",
      bio: "Supports RC transfer workflows and ownership handover guidance for safer transactions.",
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <p className={styles.kicker}>About SeaNeB Autos</p>
              <h1>{aboutData.hero.title}</h1>
              <p>{summary}</p>
              <p>{secondarySummary}</p>
              <div className={styles.featureTiles} aria-label="Core values">
                {trustPoints.map((point) => (
                  <article key={point.title} className={styles.featureTile}>
                    <span aria-hidden="true" className={styles.featureIcon}>
                      {point.icon}
                    </span>
                    <p>{point.title}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className={styles.heroImageCard}>
              <Image
                src="/about/img1.jpg"
                alt="Classic red car from SeaNeB marketplace"
                width={1280}
                height={720}
                className={styles.heroImage}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <h3>Trust-first experience</h3>
              <p>Designed to reduce fraud, price confusion and documentation gaps in used vehicle deals.</p>
            </article>
            <article className={styles.statCard}>
              <h3>Multiple categories</h3>
              <p>Cars, bikes, trucks, buses, EVs and commercial vehicles all on one platform.</p>
            </article>
            <article className={styles.statCard}>
              <h3>End-to-end support</h3>
              <p>From listing and buyer matching to RC transfer and ownership clarity.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div>
              <p className={styles.kicker}>How We Work</p>
              <h2>Professional marketplace with real-world support</h2>
              <p>
                SeaNeB Autos combines digital convenience with practical guidance so buyers and sellers can transact with
                confidence.
              </p>
              <ul className={styles.categoryList}>
                {categories.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.storyImageCard}>
              <Image
                src="/about/img2.jpg"
                alt="Online used vehicle listing and digital buying experience"
                width={612}
                height={408}
                className={styles.storyImage}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.visualSection}>
        <div className={styles.container}>
          <div className={styles.visualGrid}>
            <article className={`${styles.visualCard} ${styles.visualCardSingle}`}>
              <div className={styles.visualCardLayout}>
                <div className={styles.visualImagesColumn}>
                  <Image
                    src="/about/image19.jpeg"
                    alt="Buyer and seller discussing a vehicle in showroom"
                    width={1280}
                    height={720}
                    className={`${styles.visualImage} ${styles.visualImageCoverCenter} ${styles.visualHeroImage}`}
                  />
                </div>
                <div className={styles.visualPointsGrid}>
                  {visualPoints.map((point) => (
                    <article key={point.tag} className={styles.visualPointCard}>
                      <span className={styles.visualTag}>{point.tag}</span>
                      <h3>{point.title}</h3>
                      <p>{point.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.sections}>
        <div className={styles.container}>
          <header className={styles.sectionsHeader}>
            <p className={styles.kicker}>Why SeaNeB Autos</p>
            <h2>Clarity, trust and category depth built into one platform</h2>
          </header>
          <div className={styles.sectionGrid}>
            {focusSections.map((section) => (
              <details key={section.heading} className={styles.sectionAccordionItem}>
                <summary>
                  <span>{section.heading}</span>
                  <span className={styles.sectionPlus} aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className={styles.sectionAccordionContent}>
                  {section.paragraphs?.[0] ? <p>{section.paragraphs[0]}</p> : null}
                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.slice(0, 5).map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.extendedSection}>
        <div className={styles.container}>
          <header className={styles.sectionsHeader}>
            <p className={styles.kicker}>More About SeaNeB</p>
            <h2>Built like a modern marketplace with trust at the core</h2>
          </header>
          <div className={styles.insightLayout}>
            <aside className={styles.insightNav} aria-label="About section topics">
              {remainingSections.map((section, index) => (
                <button
                  key={section.heading}
                  type="button"
                  className={`${styles.insightNavItem} ${index === activeInsightIndex ? styles.insightNavItemActive : ""}`}
                  onClick={() => setActiveInsightIndex(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{section.heading}</span>
                  <span>{section.paragraphs?.[0] || "Explore this section in detail."}</span>
                </button>
              ))}
            </aside>
            {activeInsight ? (
              <article className={styles.insightPanel}>
                <div className={styles.insightPanelHead}>
                  <h3>{activeInsight.heading}</h3>
                  <span>Market Insight</span>
                </div>
                <p className={styles.insightMeta}>
                  Section {activeInsightIndex + 1} of {remainingSections.length} • Key points: {activeInsightBullets}
                </p>
                {activeInsight.paragraphs?.slice(0, 2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {activeInsight.bullets?.length ? (
                  <ul className={activeInsight.bullets.length > 6 ? styles.insightListTwoCol : ""}>
                    {activeInsight.bullets.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {activeInsight.subheading ? <p>{activeInsight.subheading}</p> : null}
                {activeInsight.subBullets?.length ? (
                  <ul className={activeInsight.subBullets.length > 6 ? styles.insightListTwoCol : ""}>
                    {activeInsight.subBullets.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {activeInsight.pillars?.length ? (
                  <ul className={activeInsight.pillars.length > 4 ? styles.insightListTwoCol : ""}>
                    {activeInsight.pillars.map((pillar) => (
                      <li key={pillar.title}>
                        <strong>{pillar.title}:</strong> {pillar.description}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {activeInsight.footer ? <p>{activeInsight.footer}</p> : null}
                {activeInsight.heading === "Our Team" ? (
                  <div className={styles.teamGrid}>
                    {teamMembers.map((member) => (
                      <article key={member.name} className={styles.teamCard}>
                        <span className={styles.teamAvatar} aria-hidden="true">
                          {member.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <div>
                          <h4>{member.name}</h4>
                          <p className={styles.teamRole}>{member.role}</p>
                          <p>{member.bio}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div>
              <p className={styles.ctaKicker}>Get Started</p>
              <h2>Buy or sell used vehicles online with confidence</h2>
              <p>SeaNeB Autos is building a transparent and reliable marketplace for every vehicle category in India.</p>
            </div>
            <Link href="/solution" className={styles.ctaButton}>
              Explore Platform
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}










