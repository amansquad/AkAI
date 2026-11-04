'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has entered the viewport (plus rootMargin), and
 * stays true after — so a theme grid with 100+ live-preview canvases only
 * ever mounts the ones the user has actually scrolled to.
 */
export function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
