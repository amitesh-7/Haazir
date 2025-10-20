import React from 'react';
import Navbar from '../components/landing/Navbar';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';
import ThreeDBackground from '../components/landing/ThreeDBackground';
import { useTheme } from '../hooks/useTheme';

const PricingPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <ThreeDBackground />
      <div className="relative z-10">
        <Navbar />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
};

export default PricingPage;
