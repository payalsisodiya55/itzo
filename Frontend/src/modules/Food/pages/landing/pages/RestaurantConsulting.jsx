import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import FooterSection from '../components/FooterSection';
import { motion } from 'framer-motion';

export default function RestaurantConsulting() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Restaurant Consulting</h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Supercharge your restaurant's growth with our data-driven insights, operational expertise, and dedicated consulting services.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-2xl mb-6">📈</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Growth Strategy</h3>
            <p className="text-slate-600">Leverage our platform data to identify new market opportunities, optimize your menu, and price effectively.</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl mb-6">⚙️</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Operational Efficiency</h3>
            <p className="text-slate-600">Streamline your kitchen workflows and delivery handoffs to maximize order throughput and minimize delays.</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">🎯</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Marketing & Reach</h3>
            <p className="text-slate-600">Design targeted ad campaigns and promotions to acquire new customers and build brand loyalty.</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to scale your business?</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of successful restaurants that have transformed their delivery business with our expert consulting.
          </p>
          <a href="/food/restaurant" className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-full transition-colors text-lg">
            Become a Partner
          </a>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
