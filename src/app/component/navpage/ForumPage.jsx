"use client";

import { useMemo, useState } from "react";
import forumData from "@/app/jsondata/forumPage.json";

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const visibleThreads = useMemo(() => {
    if (activeCategory === "All") return forumData.threads;
    return forumData.threads.filter((thread) => thread.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="forumautos-page">
      <section className="forumautos-hero">
        <div className="forumautos-container">
          <h1>{forumData.hero.title}</h1>
          <p>{forumData.hero.subtitle}</p>

          <div className="forumautos-stats">
            {forumData.stats.map((item) => (
              <div key={item.label} className="forumautos-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="forumautos-main">
        <div className="forumautos-container forumautos-layout">
          <div className="forumautos-left">
            <div className="forumautos-cats">
              {forumData.categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`forumautos-cat-btn ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="forumautos-list">
              {visibleThreads.map((thread) => (
                <article key={thread.title} className="forumautos-thread">
                  <div className="forumautos-thread-head">
                    <h3>{thread.title}</h3>
                    <span>{thread.category}</span>
                  </div>
                  <p>Started by {thread.author}</p>
                  <div className="forumautos-thread-meta">
                    <span>{thread.replies} replies</span>
                    <span>{thread.views} views</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="forumautos-right">
            <div className="forumautos-side-card">
              <h4>Forum Guidelines</h4>
              <ul>
                {forumData.guidelines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="forumautos-side-card">
              <h4>Need Help Fast?</h4>
              <p>
                Use clear thread titles and include details like location, vehicle
                type, and expected outcome for faster community responses.
              </p>
              <button type="button">Create New Topic</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
