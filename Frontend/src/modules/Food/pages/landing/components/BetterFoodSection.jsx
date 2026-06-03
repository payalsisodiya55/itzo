import React from 'react';
import { Store, MapPin, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCachedSettings, loadBusinessSettings } from '@common/utils/businessSettings';

const BetterFoodSection = React.memo(function BetterFoodSection() {
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      let currentSettings = getCachedSettings();
      if (!currentSettings) {
        currentSettings = await loadBusinessSettings();
      }
      if (mounted) {
        setSettings(currentSettings);
      }
    };
    fetchSettings();
    
    const handleUpdate = (e) => {
      if (mounted) {
        setSettings(e?.detail || getCachedSettings());
      }
    };
    window.addEventListener('businessSettingsUpdated', handleUpdate);
    return () => { 
      mounted = false; 
      window.removeEventListener('businessSettingsUpdated', handleUpdate);
    };
  }, []);

  const pizzaImg = settings?.landingPizzaImage?.url || "https://freepngimg.com/thumb/pizza/35-pizza-png-image.png";
  const tomatoImg = settings?.landingTomatoImage?.url || "https://freepngimg.com/thumb/tomato/22-tomato-png-image.png";

  return (
    <div className="relative w-full bg-white py-20 md:py-28 overflow-hidden">
      
      {/* Decorative Circles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top left large circle */}
        <div className="absolute -top-[400px] -left-[200px] w-[800px] h-[800px] rounded-full border-[1.5px] border-rose-200/50" />
        {/* Top left small circle */}
        <div className="absolute -top-[200px] -left-[100px] w-[400px] h-[400px] rounded-full border-[1.5px] border-rose-200/50" />
        {/* Right side large circle */}
        <div className="absolute -top-[100px] -right-[300px] w-[900px] h-[900px] rounded-full border-[1.5px] border-rose-200/50" />
        {/* Right side small circle */}
        <div className="absolute top-[100px] -right-[150px] w-[400px] h-[400px] rounded-full border-[1.5px] border-rose-200/50" />
      </div>

      {/* Floating Images (using generic transparent food images) */}
      <motion.img 
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        viewport={{ once: true }}
        src={pizzaImg}
        alt="Pizza"
        className="absolute right-[-2%] md:right-[5%] top-[45%] md:top-[40%] w-48 md:w-[350px] object-contain drop-shadow-2xl rotate-12 hidden sm:block"
      />
      
      {/* Small Tomatoes */}
      <img src={tomatoImg} alt="Tomato" className="absolute top-[15%] right-[25%] w-10 md:w-12 opacity-90 rotate-45 hidden md:block drop-shadow-lg" />
      <img src={tomatoImg} alt="Tomato" className="absolute bottom-[25%] left-[20%] w-8 md:w-10 opacity-90 -rotate-45 hidden md:block drop-shadow-lg" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[40px] md:text-[64px] font-bold text-[#f43f5e] text-center leading-tight mb-6 md:mb-8"
        >
          Better food for<br/>more people
        </motion.h2>

        {/* Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-[22px] text-slate-500 text-center max-w-[650px] mb-16 md:mb-24 leading-relaxed font-medium px-4"
        >
          For over a decade, we've enabled our customers to discover new tastes, delivered right to their doorstep
        </motion.p>

        {/* Stats Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[950px] bg-white rounded-3xl md:rounded-[3rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative z-20"
        >
          {/* Stat 1 */}
          <div className="flex items-center gap-5 w-full md:w-1/3 justify-center md:justify-start">
            <div className="flex flex-col items-start min-w-[120px]">
              <span className="text-3xl md:text-[32px] font-extrabold text-slate-800 leading-none">1000+</span>
              <span className="text-slate-500 font-medium mt-1">restaurants</span>
            </div>
            <Store className="w-12 h-12 text-slate-800 flex-shrink-0 opacity-90" strokeWidth={1.5} />
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200" />

          {/* Stat 2 */}
          <div className="flex items-center gap-5 w-full md:w-1/3 justify-center">
            <div className="flex flex-col items-start min-w-[80px]">
              <span className="text-3xl md:text-[32px] font-extrabold text-slate-800 leading-none">100+</span>
              <span className="text-slate-500 font-medium mt-1">cities</span>
            </div>
            <MapPin className="w-12 h-12 text-rose-500 fill-rose-500/10 flex-shrink-0" strokeWidth={1.5} />
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200" />

          {/* Stat 3 */}
          <div className="flex items-center gap-5 w-full md:w-1/3 justify-center md:justify-end">
            <div className="flex flex-col items-start min-w-[130px]">
              <span className="text-3xl md:text-[32px] font-extrabold text-slate-800 leading-none">1 Lakh+</span>
              <span className="text-slate-500 font-medium mt-1">orders delivered</span>
            </div>
            <ShoppingBag className="w-12 h-12 text-slate-800 flex-shrink-0 opacity-90" strokeWidth={1.5} />
          </div>

        </motion.div>
      </div>
    </div>
  );
});

export default BetterFoodSection;
