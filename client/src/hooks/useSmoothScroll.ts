import { useCallback } from "react";
import { useLenis } from "../contexts/LenisContext";

export const useSmoothScroll = () => {
  const { lenis } = useLenis();

  const scrollTo = useCallback(
    (
      target: string | number | HTMLElement,
      options?: { offset?: number; duration?: number }
    ) => {
      if (!lenis) return;

      if (typeof target === "string") {
        // Scroll to element with selector
        const element = document.querySelector(target);
        if (element) {
          lenis.scrollTo(element as HTMLElement, {
            offset: options?.offset || 0,
            duration: options?.duration,
          });
        }
      } else {
        // Scroll to position or element
        lenis.scrollTo(target, {
          offset: options?.offset || 0,
          duration: options?.duration,
        });
      }
    },
    [lenis]
  );

  const scrollToTop = useCallback(
    (options?: { duration?: number }) => {
      if (!lenis) return;
      lenis.scrollTo(0, { duration: options?.duration || 1 });
    },
    [lenis]
  );

  const stop = useCallback(() => {
    if (!lenis) return;
    lenis.stop();
  }, [lenis]);

  const start = useCallback(() => {
    if (!lenis) return;
    lenis.start();
  }, [lenis]);

  return { scrollTo, scrollToTop, stop, start, lenis };
};
