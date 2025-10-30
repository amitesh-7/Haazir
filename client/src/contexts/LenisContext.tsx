import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import Lenis from "@studio-freight/lenis";

interface LenisContextType {
  lenis: Lenis | null;
}

const LenisContext = createContext<LenisContextType>({ lenis: null });

export const useLenis = () => {
  const context = useContext(LenisContext);
  if (!context) {
    throw new Error("useLenis must be used within LenisProvider");
  }
  return context;
};

interface LenisProviderProps {
  children: ReactNode;
  options?: {
    duration?: number;
    easing?: (t: number) => number;
    smoothWheel?: boolean;
    smoothTouch?: boolean;
    touchMultiplier?: number;
  };
}

export const LenisProvider: React.FC<LenisProviderProps> = ({
  children,
  options = {},
}) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: options.duration || 1.2,
      easing:
        options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      smoothWheel:
        options.smoothWheel !== undefined ? options.smoothWheel : true,
      smoothTouch:
        options.smoothTouch !== undefined ? options.smoothTouch : false,
      touchMultiplier: options.touchMultiplier || 2,
      infinite: false,
      ...options,
    });

    lenisRef.current = lenis;

    // Request animation frame loop
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [options]);

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </LenisContext.Provider>
  );
};
