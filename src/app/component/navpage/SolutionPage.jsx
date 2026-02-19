import Image from "next/image";
import solutionData from "@/app/jsondata/solutionPage.json";

export default function SolutionPage() {
  return (
    <main className="solutionautos-page">
      <section className="solutionautos-hero">
        <div className="solutionautos-container">
          <h1>{solutionData.hero.title}</h1>
          <p>{solutionData.hero.subtitle}</p>
        </div>
      </section>

      <section className="solutionautos-overview">
        <div className="solutionautos-container solutionautos-overview-grid">
          <div className="solutionautos-device-card">
            <Image
              src={solutionData.overview.image.src}
              alt={solutionData.overview.image.alt}
              width={solutionData.overview.image.width}
              height={solutionData.overview.image.height}
              className="solutionautos-device-image"
              priority
            />
          </div>

          <div className="solutionautos-overview-text">
            <h2>{solutionData.overview.title}</h2>
            <p>{solutionData.overview.description}</p>
            <ul>
              {solutionData.overview.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="solutionautos-benefits">
        <div className="solutionautos-container solutionautos-benefits-grid">
          <div className="solutionautos-benefits-left">
            <h2>{solutionData.benefits.title}</h2>
            <p>{solutionData.benefits.description}</p>
            <div className="solutionautos-benefit-list">
              {solutionData.benefits.items.map((item, index) => (
                <div key={item} className="solutionautos-benefit-item">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="solutionautos-benefits-art">
            <div className="solutionautos-art-bubble" />
            <Image
              src={solutionData.benefits.image.src}
              alt={solutionData.benefits.image.alt}
              width={solutionData.benefits.image.width}
              height={solutionData.benefits.image.height}
              className="solutionautos-art-image"
            />
          </div>
        </div>
      </section>

      <section className="solutionautos-audience">
        <div className="solutionautos-container">
          <div className="solutionautos-section-head">
            <h2>{solutionData.audience.title}</h2>
            <p>{solutionData.audience.subtitle}</p>
          </div>

          <div className="solutionautos-audience-grid">
            {solutionData.audience.cards.map((card) => (
              <article key={card.title} className="solutionautos-audience-card">
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="solutionautos-features">
        <div className="solutionautos-container solutionautos-features-grid">
          <div className="solutionautos-table-card">
            <h3>{solutionData.features.title}</h3>
            <table>
              <thead>
                <tr>
                  <th>{solutionData.features.columns[0]}</th>
                  <th>{solutionData.features.columns[1]}</th>
                </tr>
              </thead>
              <tbody>
                {solutionData.features.rows.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="solutionautos-phone-card">
            <Image
              src={solutionData.features.phoneImage.src}
              alt={solutionData.features.phoneImage.alt}
              width={solutionData.features.phoneImage.width}
              height={solutionData.features.phoneImage.height}
              className="solutionautos-phone-image"
            />
          </div>
        </div>
      </section>

      <section className="solutionautos-faq">
        <div className="solutionautos-container">
          <div className="solutionautos-faq-head">
            <h2>{solutionData.faq.title}</h2>
            <p>{solutionData.faq.subtitle}</p>
          </div>

          <div className="solutionautos-faq-list">
            {solutionData.faq.items.map((item) => (
              <details key={item.q} className="solutionautos-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="solutionautos-cta">
        <div className="solutionautos-container solutionautos-cta-grid">
          <div>
            <h3>{solutionData.cta.title}</h3>
            <p>{solutionData.cta.subtitle}</p>
          </div>
          <button type="button">{solutionData.cta.buttonText}</button>
        </div>
      </section>
    </main>
  );
}
