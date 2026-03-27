"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-card)] px-4 text-center">
            {/* 
                The user requested to hide the header and footer specifically for the 404 page.
                Since the layout wraps this component, we use a style tag to forcibly hide them 
                only when this component is rendered. 
            */}
            <style dangerouslySetInnerHTML={{
                __html: `
                header, footer {
                    display: none !important;
                }
            `}} />

            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[var(--brand-primary)]/20 blur-[100px] rounded-full"></div>
                <h1 className="relative text-9xl font-bold text-[var(--text-primary)] tracking-tighter">
                    404
                </h1>
            </div>

            <h2 className="mb-6 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                Page not found
            </h2>

            <p className="mb-10 text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
            </p>

            <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-hover)] hover:scale-105 hover:shadow-xl hover:shadow-[var(--brand-primary)]/30"
            >
                Back to Home
            </Link>
        </div>
    );
}
