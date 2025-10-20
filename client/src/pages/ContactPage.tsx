import React from 'react';
import Navbar from '../components/landing/Navbar';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';
import ThreeDBackground from '../components/landing/ThreeDBackground';
import { useTheme } from '../hooks/useTheme';

const ContactPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <ThreeDBackground />
      <div className="relative z-10">
        <Navbar />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
};

export default ContactPage;
