import { useCallback, useRef, useState } from "react";
export function useInView(options?: IntersectionObserverInit): {
    ref: React.RefCallback<HTMLElement>;
    inView: boolean;
} {
    const [inView, setInView] = useState(false);
    const observerRef = useRef<IntersectionObserver | undefined>(null);
    const root = options?.root;
    const rootMargin = options?.rootMargin ?? "200px";
    const threshold = options?.threshold;
    const ref = useCallback((node: HTMLElement | undefined) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (node) {
            const observer = new IntersectionObserver(([entry]) => {
                setInView(entry.isIntersecting);
            }, { root, rootMargin, threshold });
            observer.observe(node);
            observerRef.current = observer;
        }
        else {
            setInView(false);
        }
    }, [root, rootMargin, threshold]);
    return { ref, inView };
}
export default useInView;
