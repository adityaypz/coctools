"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/collections", label: "Collections" },
    { href: "/airdrops", label: "🎁 Airdrops" },
    { href: "/submit-airdrop", label: "📝 Submit Airdrop" },
    { href: "/submit-tool", label: "🛠️ Submit Tool" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black">
                        CT
                    </span>
                    <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        CocTools
                    </span>
                </Link>

                {/* Desktop nav */}
                <ul className="hidden md:flex items-center gap-1">
                    {NAV_ITEMS.map(({ href, label }) => {
                        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    {label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Mobile hamburger button */}
                <button
                    type="button"
                    onClick={() => setMobileOpen((prev) => !prev)}
                    className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </nav>

            {/* Mobile menu panel */}
            {mobileOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="md:hidden absolute left-0 right-0 top-16 z-50 border-b border-white/10 bg-gray-950/95 backdrop-blur-xl">
                        <ul className="flex flex-col gap-1 px-4 py-4">
                            {NAV_ITEMS.map(({ href, label }) => {
                                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${active
                                                ? "bg-white/10 text-white"
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </header>
    );
}
