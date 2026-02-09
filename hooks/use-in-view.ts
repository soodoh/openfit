import { useCallback, useRef, useState } from "react";

export function useInView(options?: IntersectionObserverInit): {
  ref: React.RefCallback<HTMLElement>;
  inView: boolean;
} {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setInView(entry.isIntersecting);
          },
          { rootMargin: "200px", ...options },
        );
        observer.observe(node);
        observerRef.current = observer;
      } else {
        setInView(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.rootMargin, options?.threshold, options?.root],
  );

  return { ref, inView };
}
