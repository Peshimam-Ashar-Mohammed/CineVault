import { useEffect, useRef } from "react";

/**
 * Adds the `.visible` class to elements with `.reveal` class
 * when they scroll into view — driving the CSS staggered reveal animation.
 */
export function useScrollReveal(deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current || document;
    const els = root.querySelectorAll(".reveal:not(.visible)");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            // Stagger each card by 60ms
            setTimeout(() => e.target.classList.add("visible"), i * 60);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);

  return containerRef;
}
