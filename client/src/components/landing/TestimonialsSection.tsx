import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface Testimonial {
  name: string;
  role: string;
  institution: string;
  content: string;
  rating: number;
  avatar: string;
  location: string;
}

const TestimonialsSection: React.FC = () => {
  const { theme } = useTheme();

  const testimonials: Testimonial[] = [
    {
      name: "Dr. Priya Sharma",
      role: "Principal",
      institution: "Delhi Public School, Gurgaon",
      location: "Haryana",
      content: "Haazir has completely transformed our attendance management. The face recognition technology is accurate and the real-time analytics help us track student engagement patterns effectively.",
      rating: 5,
      avatar: "👩‍🏫"
    },
    {
      name: "Prof. Rajesh Kumar",
      role: "HOD Computer Science",
      institution: "IIT Bombay",
      location: "Maharashtra",
      content: "As an IIT, we needed a robust system that could handle large student populations. Haazir's scalability and accuracy are impressive. The API integration was seamless.",
      rating: 5,
      avatar: "👨‍💼"
    },
    {
      name: "Ms. Anjali Mehta",
      role: "Academic Coordinator",
      institution: "St. Xavier's College",
      location: "Mumbai",
      content: "The mobile app is fantastic! Students love the QR code feature, and teachers find the interface intuitive. Our attendance accuracy has improved by 95%.",
      rating: 5,
      avatar: "👩‍💻"
    },
    {
      name: "Dr. Suresh Reddy",
      role: "Director",
      institution: "Osmania University",
      location: "Telangana",
      content: "Managing attendance for 25,000+ students was a nightmare. Haazir's bulk management features and detailed analytics have made it effortless. Highly recommended!",
      rating: 5,
      avatar: "👨‍🏫"
    },
    {
      name: "Mrs. Kavitha Nair",
      role: "Vice Principal",
      institution: "Kendriya Vidyalaya",
      location: "Kerala",
      content: "The automated reports save us hours every week. Parents appreciate the real-time notifications, and the system is so reliable. Worth every rupee!",
      rating: 5,
      avatar: "👩‍🏫"
    },
    {
      name: "Prof. Arjun Singh",
      role: "Dean Academics",
      institution: "Amity University",
      location: "Noida",
      content: "From small coaching centers to universities, Haazir scales beautifully. The customer support team understands Indian education system perfectly.",
      rating: 5,
      avatar: "👨‍🎓"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-4 h-4 text-orange-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              Trusted by 750+ Indian Institutions
            </span>
          </motion.div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            What Indian Educators Say
          </h2>
          <p className={`text-lg md:text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            From schools in small towns to premier institutes like IITs, see why institutions across India trust Haazir
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className={`relative p-6 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white border border-gray-200'
              } shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Quote Icon */}
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500'
              }`}>
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className={`text-sm md:text-base mb-6 leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">{testimonial.avatar}</div>
                <div>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {testimonial.name}
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testimonial.role}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                    {testimonial.institution}, {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Join thousands of satisfied institutions across India
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;