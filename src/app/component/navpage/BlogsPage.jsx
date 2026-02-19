"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import blogsData from "@/app/jsondata/blogsPage.json";

const POSTS_PER_PAGE = 6;

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return blogsData.posts.filter((post) => {
      const categoryOk =
        activeCategory === "All" || post.category === activeCategory;
      const queryOk =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.category.toLowerCase().includes(query.toLowerCase());
      return categoryOk && queryOk;
    });
  }, [activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagePosts = filteredPosts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE
  );

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <main className="blogautos-page">
      <section className="blogautos-hero">
        <div className="blogautos-container">
          <h1>{blogsData.hero.title}</h1>
          <p>{blogsData.hero.subtitle}</p>
        </div>
      </section>

      <section className="blogautos-content">
        <div className="blogautos-container blogautos-layout">
          <div>
            <div className="blogautos-toolbar">
              <div className="blogautos-categories">
                {blogsData.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`blogautos-cat-btn ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <input
                className="blogautos-search"
                type="text"
                placeholder="Search posts..."
                value={query}
                onChange={handleSearchChange}
              />
            </div>

            <div className="blogautos-grid">
              {pagePosts.map((post) => (
                <article key={post.id} className="blogautos-card">
                  <div className="blogautos-card-image">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={360}
                      height={220}
                    />
                  </div>
                  <div className="blogautos-card-body">
                    <p className="blogautos-card-date">{post.date}</p>
                    <h3>{post.title}</h3>
                    <p className="blogautos-card-tag">{post.category}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="blogautos-pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Prev
              </button>
              <span>
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </div>
          </div>

          <aside className="blogautos-sidebar">
            <section className="blogautos-side-card">
              <h4>{blogsData.about.title}</h4>
              <p>{blogsData.about.description}</p>
            </section>

            <section className="blogautos-side-card">
              <h4>Follow Us</h4>
              <div className="blogautos-socials">
                {blogsData.social.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </section>

            <section className="blogautos-side-card">
              <h4>Tags</h4>
              <div className="blogautos-tags">
                {blogsData.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
