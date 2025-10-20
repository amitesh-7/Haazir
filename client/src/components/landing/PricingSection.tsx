import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import Lottie from 'lottie-react';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, indianPricingTiers } from '../../utils/currency';

// Import Lottie animations
import securityShieldData from '../../assets/lottie/security-shield-icon.json';
import analyticsData from '../../assets/lottie/analytics-icon.json';
import multiUserData from '../../assets/lottie/multi-user-icon.json';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  lottieData: any;
  buttonText: string;
}

const PricingSection: React.FC = () => {
  const { theme } = useTheme();
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      name: 'Starter',
      price: isAnnual ? formatCurrency(indianPricingTiers.starter.yearly) : formatCurrency(indianPricingTiers.starter.monthly),
      period: isAnnual ? '/year' : '/month',
      description: 'Perfect for small schools and coaching centers getting started',
      lottieData: securityShieldData,
      buttonText: 'Start Free Trial',
      features: [
        { text: 'Up to 100 students', included: true },
        { text: 'Basic attendance tracking', included: true },
        { text: 'QR code scanning', included: true },
        { text: 'Email support', included: true },
        { text: 'Basic reports', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'Face recognition', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'API access', included: false },
        { text: 'Custom branding', included: false },
      ],
    },
    {
      name: 'Professional',
      price: isAnnual ? formatCurrency(indianPricingTiers.professional.yearly) : formatCurrency(indianPricingTiers.professional.monthly),
      period: isAnnual ? '/year' : '/month',
      description: 'For growing institutions and universities with advanced needs',
      lottieData: analyticsData,
      buttonText: 'Get Started',
      highlighted: true,
      features: [
        { text: 'Up to 1,000 students', included: true },
        { text: 'Advanced attendance tracking', included: true },
        { text: 'QR + Face recognition', included: true },
        { text: 'Priority support (24/7)', included: true },
        { text: 'Advanced reports & analytics', included: true },
        { text: 'Mobile app + Desktop', included: true },
        { text: 'AI-powered insights', included: true },
        { text: 'Custom workflows', included: true },
        { text: 'API access', included: true },
        { text: 'Custom branding', included: false },
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large universities and educational institutions with custom requirements',
      lottieData: multiUserData,
      buttonText: 'Contact Sales',
      features: [
        { text: 'Unlimited students', included: true },
        { text: 'All Professional features', included: true },
        { text: 'Multi-campus support', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'White-label solution', included: true },
        { text: 'On-premise deployment', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Training & onboarding', included: true },
        { text: 'Custom development', included: true },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section className={`py-24 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              Simple, Transparent Pricing
            </span>
          </motion.div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Choose Your Perfect Plan
          </h2>
          <p className={`text-lg md:text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Affordable pricing for Indian educational institutions. Start free and scale as you grow.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isAnnual ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? 'bg-gradient-to-r from-purple-500 to-blue-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ x: isAnnual ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Annual
            </span>
            {isAnnual && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full"
              >
                Save ₹4,800
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
        >
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              whileHover={{ y: -10 }}
              className={`relative rounded-2xl p-6 md:p-8 ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-2xl shadow-purple-500/30 md:scale-105'
                  : theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white border border-gray-200'
              } ${tier.highlighted ? 'ring-4 ring-purple-500/20' : ''}`}
            >
              {tier.highlighted && (
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  ⭐ Most Popular
                </motion.div>
              )}

              {/* Lottie Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  tier.highlighted ? 'bg-white/20' : theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'
                }`}>
                  <Lottie
                    animationData={tier.lottieData}
                    loop
                    style={{ width: 48, height: 48 }}
                  />
                </div>
              </div>

              {/* Plan Name */}
              <h3 className={`text-2xl font-bold mb-2 text-center ${
                tier.highlighted ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {tier.name}
              </h3>

              {/* Description */}
              <p className={`text-sm mb-6 text-center ${
                tier.highlighted ? 'text-white/80' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {tier.description}
              </p>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-bold ${
                    tier.highlighted ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`text-lg ${
                      tier.highlighted ? 'text-white/80' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 px-6 rounded-xl font-semibold mb-8 transition-all ${
                  tier.highlighted
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : theme === 'dark'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                }`}
              >
                {tier.buttonText}
              </motion.button>

              {/* Features List */}
              <div className="space-y-4">
                {tier.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: featureIndex * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    {feature.included ? (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        tier.highlighted ? 'bg-white/20' : theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                      }`}>
                        <Check className={`w-3 h-3 ${
                          tier.highlighted ? 'text-white' : 'text-green-500'
                        }`} />
                      </div>
                    ) : (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <X className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                    <span className={`text-sm ${
                      feature.included
                        ? tier.highlighted
                          ? 'text-white'
                          : theme === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-700'
                        : theme === 'dark'
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mt-16 text-center p-8 rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Need Help Choosing the Right Plan?
          </h3>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Our team understands Indian educational institutions and can help you find the perfect solution.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl font-semibold ${
              theme === 'dark'
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            Schedule Free Consultation
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
