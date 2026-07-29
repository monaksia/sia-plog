import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — IntersectionObserver-based scroll entrance animation.
 * Adds `.visible` class to all `.reveal` descendants when they enter the viewport.
 *
 * @param {object} [options]
 * @param {number} [options.threshold=0.15] — visibility ratio to trigger
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] — trigger margin
 * @returns {React.RefObject} — attach to the container element
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once visible, stop observing this element
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    // Observe all .reveal elements inside the container
    const reveals = el.querySelectorAll('.reveal');
    reveals.forEach((r) => observer.observe(r));

    // Also observe children added later (e.g., after data loads)
    const mutationObserver = new MutationObserver(() => {
      const newReveals = el.querySelectorAll('.reveal:not([data-observed])');
      newReveals.forEach((r) => {
        r.setAttribute('data-observed', '');
        observer.observe(r);
      });
    });

    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [threshold, rootMargin]);

  return ref;
}

/**
 * Quick single-element reveal using IntersectionObserver.
 * @param {React.RefObject} ref — element ref
 * @param {number} [threshold=0.2]
 */
export function useElementReveal(ref, threshold = 0.2) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
}
