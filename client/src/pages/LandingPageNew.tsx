import React, { Suspense } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Stats from '../components/landing/Stats';
import Footer from '../components/landing/Footer';
import ThreeDBackground from '../components/landing/ThreeDBackground';
import { 
  TestimonialsSection, 
  LazyLoadingSpinner,
  LazyErrorBoundary,
  usePerformanceMonitoring 
} from '../utils/performance';

const LandingPageNew: React.FC = () => {
  // Monitor performance metrics
  usePerformanceMonitoring();

  return (
    <div className="min-h-screen transition-colors duration-300 relative">
      {/* 3D Animated Background */}
      <ThreeDBackground />
      
      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <Stats />
        
        {/* Testimonials - Lazy loaded for better performance */}
        <LazyErrorBoundary>
          <Suspense fallback={<LazyLoadingSpinner />}>
            <TestimonialsSection />
          </Suspense>
        </LazyErrorBoundary>
        
        <Footer />
      </div>
    </div>
  );
};

export default LandingPageNew;
