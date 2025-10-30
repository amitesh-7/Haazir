import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";

const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();
  const { scrollToTop } = useSmoothScroll();

  useEffect(() => {
    // Scroll to top with a smooth animation when route changes
    scrollToTop({ duration: 0.5 });
  }, [pathname, scrollToTop]);

  return null;
};

export default ScrollToTopOnRouteChange;
