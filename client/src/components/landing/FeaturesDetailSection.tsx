import React from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useTheme } from '../../hooks/useTheme';
import { Sparkles, Zap, Shield, Clock, TrendingUp, Users } from 'lucide-react';

// Import Lottie animations
import faceRecognitionData from '../../assets/lottie/face-recogniiton-icon.json';
import analyticsData from '../../assets/lottie/analytics-icon.json';
import multiUserData from '../../assets/lottie/multi-user-icon.json';
import securityData from '../../assets/lottie/security-shield-icon.json';
import attendanceCheckData from '../../assets/lottie/attendence-check.json';
import reportAutoData from '../../assets/lottie/report-auto.json';

interface Feature {
  title: string;
  description: string;
  longDescription: string;
  lottieData: any;
  icon: React.ReactNode;
  benefits: string[];
  stats?: { label: string; value: string }[];
}

const FeaturesDetailSection: React.FC = () => {
  const { theme } = useTheme();

  const features: Feature[] = [
    {
      title: 'AI-Powered Face Recognition',
      description: 'Lightning-fast attendance with 99.9% accuracy',
      longDescription: 'Our advanced AI system uses cutting-edge facial recognition technology to identify students in milliseconds. No more manual roll calls or proxy attendance issues.',
      lottieData: faceRecognitionData,
      icon: <Sparkles className="w-6 h-6" />,
      benefits: [
        'Instant identification in < 0.5 seconds',
        '99.9% accuracy even in poor lighting',
        'Works with masks and accessories',
        'Privacy-first encrypted storage',
        'No expensive hardware required',
      ],
      stats: [
        { label: 'Recognition Speed', value: '< 0.5s' },
        { label: 'Accuracy Rate', value: '99.9%' },
        { label: 'Students/Minute', value: '120+' },
      ],
    },
    {
      title: 'Real-Time Analytics Dashboard',
      description: 'Get instant insights into attendance patterns',
      longDescription: 'Make data-driven decisions with comprehensive analytics. Track trends, identify at-risk students, and generate reports in seconds.',
      lottieData: analyticsData,
      icon: <TrendingUp className="w-6 h-6" />,
      benefits: [
        'Live attendance monitoring',
        'Predictive analytics for intervention',
        'Custom report generation',
        'Export to Excel/PDF instantly',
        'Visual trend analysis',
      ],
      stats: [
        { label: 'Report Types', value: '15+' },
        { label: 'Data Points', value: '50+' },
        { label: 'Update Frequency', value: 'Real-time' },
      ],
    },
    {
      title: 'Multi-Role Access Control',
      description: 'Perfect permissions for every user type',
      longDescription: 'Students, teachers, coordinators, and admins each get tailored interfaces with exactly the features they need. Nothing more, nothing less.',
      lottieData: multiUserData,
      icon: <Users className="w-6 h-6" />,
      benefits: [
        'Role-based dashboards',
        'Granular permission control',
        'Easy user management',
        'Bulk operations support',
        'Audit trail for all actions',
      ],
      stats: [
        { label: 'User Roles', value: '4+' },
        { label: 'Permission Levels', value: '20+' },
        { label: 'Concurrent Users', value: 'Unlimited' },
      ],
    },
    {
      title: 'Bank-Grade Security',
      description: 'Your data is protected with military-grade encryption',
      longDescription: 'We take security seriously. All data is encrypted end-to-end, with regular security audits and compliance with international standards.',
      lottieData: securityData,
      icon: <Shield className="w-6 h-6" />,
      benefits: [
        'AES-256 encryption',
        'GDPR & FERPA compliant',
        'Regular security audits',
        'Two-factor authentication',
        'Automatic backups',
      ],
      stats: [
        { label: 'Encryption', value: 'AES-256' },
        { label: 'Uptime', value: '99.9%' },
        { label: 'Backup Frequency', value: 'Hourly' },
      ],
    },
    {
      title: 'Smart Attendance Tracking',
      description: 'Multiple methods for maximum flexibility',
      longDescription: 'Choose from QR codes, face recognition, manual entry, or GPS-based check-ins. Perfect for any classroom setup or remote learning.',
      lottieData: attendanceCheckData,
      icon: <Zap className="w-6 h-6" />,
      benefits: [
        'QR code generation',
        'Face recognition scanning',
        'Manual override options',
        'GPS-based attendance',
        'Offline mode support',
      ],
      stats: [
        { label: 'Methods', value: '4+' },
        { label: 'Speed', value: '< 3s' },
        { label: 'Offline Mode', value: 'Yes' },
      ],
    },
    {
      title: 'Automated Report Generation',
      description: 'Professional reports in one click',
      longDescription: 'Generate comprehensive attendance reports, grade sheets, and analytics with a single click. Schedule automatic reports to be sent via email.',
      lottieData: reportAutoData,
      icon: <Clock className="w-6 h-6" />,
      benefits: [
        'One-click report generation',
        'Customizable templates',
        'Scheduled email delivery',
        'Export to multiple formats',
        'Branded reports',
      ],
      stats: [
        { label: 'Report Templates', value: '10+' },
        { label: 'Export Formats', value: '5+' },
        { label: 'Generation Time', value: '< 5s' },
      ],
    },
  ];

  return (
    <section className={`py-24 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              Powerful Features
            </span>
          </motion.div>

          <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              In One Platform
            </span>
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            From AI-powered face recognition to automated reports, Haazir has everything you need to modernize your attendance management.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="space-y-32">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content Side */}
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <motion.div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 ${
                    theme === 'dark' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {feature.icon}
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                    Feature #{index + 1}
                  </span>
                </motion.div>

                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h2>
                <p className={`text-xl mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
                <p className={`mb-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                  {feature.longDescription}
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-8">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <motion.div
                      key={benefitIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: benefitIndex * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                      }`}>
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: benefitIndex * 0.1 + 0.2 }}
                        >
                          ✓
                        </motion.div>
                      </div>
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                {feature.stats && (
                  <div className="grid grid-cols-3 gap-4">
                    {feature.stats.map((stat, statIndex) => (
                      <motion.div
                        key={statIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: statIndex * 0.1 }}
                        className={`p-4 rounded-xl text-center ${
                          theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className={`text-2xl font-bold mb-1 ${
                          theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                        }`}>
                          {stat.value}
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lottie Animation Side */}
              <motion.div
                className={index % 2 === 1 ? 'lg:order-1' : ''}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-12 rounded-3xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20'
                    : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'
                } backdrop-blur-xl`}>
                  <Lottie
                    animationData={feature.lottieData}
                    loop
                    style={{ width: '100%', height: 'auto', maxWidth: 400, margin: '0 auto' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mt-32 p-12 rounded-3xl text-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
              : 'bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-300'
          } backdrop-blur-xl`}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ready to Transform Your Institution?
          </h2>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Join thousands of institutions already using Haazir to modernize their attendance management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 rounded-xl font-semibold ${
                theme === 'dark'
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Schedule Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesDetailSection;
