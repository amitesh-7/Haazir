import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

const GlobalBackground: React.FC = () => {
  const { theme } = useTheme();

  // Animated gradient background
  const gradientStyles = theme === 'dark'
    ? 'bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900'
    : 'bg-gradient-to-b from-blue-50 via-indigo-50 to-blue-50';

  return (
    <div className={`fixed inset-0 -z-10 ${gradientStyles}`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              theme === 'dark' ? 'bg-purple-500/20' : 'bg-indigo-500/20'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GlobalBackground;
