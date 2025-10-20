import React from 'react';
import Navbar from '../components/landing/Navbar';
import AboutSection from '../components/landing/AboutSection';
import Footer from '../components/landing/Footer';
import ThreeDBackground from '../components/landing/ThreeDBackground';
import { useTheme } from '../hooks/useTheme';

const AboutPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <ThreeDBackground />
      <div className="relative z-10">
        <Navbar />
        <AboutSection />
        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;
