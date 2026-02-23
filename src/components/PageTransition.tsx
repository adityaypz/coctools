"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const prevPath = useRef(pathname);

    useEffect(() => {
        // On route change, start hidden then fade in
        if (prevPath.current !== pathname) {
            setIsVisible(false);
            // Small delay to let the "hidden" state render, then fade in
            const timeout = setTimeout(() => setIsVisible(true), 30);
            prevPath.current = pathname;
            return () => clearTimeout(timeout);
        } else {
            // First load
            setIsVisible(true);
        }
    }, [pathname]);

    return (
        <div
            className={`page-transition ${isVisible ? "page-visible" : "page-hidden"}`}
        >
            {children}
        </div>
    );
}
