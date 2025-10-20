import React from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useTheme } from '../../hooks/useTheme';
import { Target, Eye, Award, Users, Zap, Heart } from 'lucide-react';

// Import Lottie animation
import heroAnimationData from '../../assets/lottie/hero-animation.json';

const AboutSection: React.FC = () => {
  const { theme } = useTheme();

  const stats = [
    { label: 'Active Students', value: '2L+', icon: <Users className="w-6 h-6" /> },
    { label: 'Indian Institutions', value: '750+', icon: <Award className="w-6 h-6" /> },
    { label: 'States Covered', value: '28+', icon: <Heart className="w-6 h-6" /> },
    { label: 'Uptime', value: '99.9%', icon: <Zap className="w-6 h-6" /> },
  ];

  const values = [
    {
      title: 'Made for India',
      description: 'Built specifically for Indian educational institutions and their unique needs',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Student-Centric',
      description: 'Designed for Indian students, teachers, and administrative staff',
      icon: <Users className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Data Security',
      description: 'Compliant with Indian data protection laws and international standards',
      icon: <Award className="w-8 h-8" />,
      color: 'from-cyan-500 to-green-500',
    },
    {
      title: 'Local Support',
      description: 'Dedicated Indian support team available in Hindi and English',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-green-500 to-purple-500',
    },
  ];

  const timeline = [
    {
      year: '2020',
      title: 'The Beginning',
      description: 'Founded with a vision to revolutionize attendance management',
    },
    {
      year: '2021',
      title: 'AI Integration',
      description: 'Launched face recognition technology with 99% accuracy',
    },
    {
      year: '2022',
      title: 'Global Expansion',
      description: 'Expanded to 10+ countries with 100+ institutions',
    },
    {
      year: '2023',
      title: 'Smart Analytics',
      description: 'Introduced predictive analytics and automated insights',
    },
    {
      year: '2024',
      title: 'Industry Leader',
      description: '500+ institutions trust us with 50K+ active users',
    },
  ];

  const team = [
    {
      name: 'John Doe',
      role: 'CEO & Founder',
      image: '👨‍💼',
      bio: '15+ years in EdTech',
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      image: '👩‍💻',
      bio: 'AI & ML Expert',
    },
    {
      name: 'Mike Johnson',
      role: 'Head of Product',
      image: '👨‍🎨',
      bio: 'UX Design Specialist',
    },
    {
      name: 'Sarah Williams',
      role: 'Head of Customer Success',
      image: '👩‍🏫',
      bio: 'Educator Background',
    },
  ];

  return (
    <section className={`py-24 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Building the Future of
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Attendance Management
            </span>
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-12`}>
            We're on a mission to make attendance tracking effortless, accurate, and insightful for educational institutions worldwide.
          </p>

          {/* Lottie Hero Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <Lottie
              animationData={heroAnimationData}
              loop
              style={{ width: '100%', height: 'auto' }}
            />
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-2xl text-center ${
                theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {stat.icon}
              </div>
              <div className={`text-3xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`p-8 rounded-2xl ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'
            }`}
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br from-purple-500 to-blue-500`}>
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Our Mission
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              To empower educational institutions with intelligent, automated attendance systems that save time, reduce errors, and provide actionable insights for better student outcomes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`p-8 rounded-2xl ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'
            }`}
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br from-blue-500 to-cyan-500`}>
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Our Vision
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              To become the world's most trusted attendance management platform, making manual roll calls obsolete and transforming how institutions track and analyze student presence.
            </p>
          </motion.div>
        </div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <h2 className={`text-4xl font-bold text-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Our Core Values
          </h2>
          <p className={`text-lg text-center mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            The principles that guide everything we do
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`p-6 rounded-2xl ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-gradient-to-br ${value.color}`}>
                  {React.cloneElement(value.icon, { className: 'w-8 h-8 text-white' })}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {value.title}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <h2 className={`text-4xl font-bold text-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Our Journey
          </h2>
          <p className={`text-lg text-center mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            From a simple idea to a global platform
          </p>

          <div className="relative">
            {/* Vertical Line */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`} />

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className={`inline-block p-6 rounded-2xl ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                        {item.year}
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.5 }}
                      className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-4 border-gray-900"
                    />
                  </div>

                  <div className="w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className={`text-4xl font-bold text-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Meet Our Team
          </h2>
          <p className={`text-lg text-center mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            The passionate people behind Haazir
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`p-6 rounded-2xl text-center ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {member.name}
                </h3>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  {member.role}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`p-12 rounded-3xl text-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
              : 'bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-300'
          } backdrop-blur-xl`}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Join Us on This Journey
          </h2>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Be part of the attendance revolution. Start your free trial today!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
