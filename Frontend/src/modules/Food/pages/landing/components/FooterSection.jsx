import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { getCachedSettings, loadBusinessSettings } from '@common/utils/businessSettings';

const FooterSection = React.memo(function FooterSection() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
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

  const socialLinks = [
    { name: 'Linkedin', icon: Linkedin, url: settings?.socialLinkedinUrl || '#' },
    { name: 'Instagram', icon: Instagram, url: settings?.socialInstagramUrl || '#' },
    { name: 'Youtube', icon: Youtube, url: settings?.socialYoutubeUrl || '#' },
    { name: 'Facebook', icon: Facebook, url: settings?.socialFacebookUrl || '#' },
    { name: 'X / Twitter', icon: Twitter, url: settings?.socialTwitterUrl || '#' },
  ];

  const logoImg = settings?.landingFooterLogo?.url || "/itzo-logo.jpg";
  const appStoreImg = settings?.landingAppStoreBadge?.url || "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg";
  const playStoreImg = settings?.landingPlayStoreBadge?.url || "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg";
  const playStoreUrl = settings?.playStoreLink || "#!";
  const appStoreUrl = settings?.appStoreLink || "#!";

  return (
    <footer className="bg-black pt-16 pb-8 border-t border-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Logo Area */}
        <div className="mb-10">
          <img src={logoImg} alt="ItzoFood Logo" className="h-12 md:h-16 w-auto object-contain rounded-xl" />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1 */}
          <div>
            <h3 className="font-medium text-white tracking-wide mb-4 text-[15px]">About ItzoFood</h3>
            <ul className="space-y-2.5 text-gray-400 text-[14px]">
              <li><a href="/about" className="hover:text-white transition-colors">Who We Are</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-medium text-white tracking-wide mb-4 text-[15px]">For Restaurants</h3>
            <ul className="space-y-2.5 text-gray-400 text-[14px]">
              <li><a href="/food/restaurant" className="hover:text-white transition-colors">Partner With Us</a></li>
              <li><a href="/food/restaurant" className="hover:text-white transition-colors">Apps For You</a></li>
              <li><a href="/consulting" className="hover:text-white transition-colors">Restaurant Consulting</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-medium text-white tracking-wide mb-4 text-[15px]">For Delivery Partners</h3>
            <ul className="space-y-2.5 text-gray-400 text-[14px]">
              <li><a href="/food/delivery" className="hover:text-white transition-colors">Partner With Us</a></li>
              <li><a href="/food/delivery" className="hover:text-white transition-colors">Apps For You</a></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-medium text-white tracking-wide mb-4 text-[15px]">Learn More</h3>
            <ul className="space-y-2.5 text-gray-400 text-[14px]">
              <li><a href="/profile/privacy" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="/profile/privacy" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="/profile/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/support" className="hover:text-white transition-colors">Help & Support</a></li>
            </ul>
          </div>

          {/* Column 5: Social & App */}
          <div>
            <h3 className="font-medium text-white tracking-wide mb-4 text-[15px]">Social Links</h3>
            <div className="flex gap-2.5 mb-6">
              {socialLinks.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-black rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center w-7 h-7"
                  aria-label={social.name}
                >
                  <social.icon size={16} strokeWidth={2} className="text-black" />
                </a>
              ))}
            </div>
            
            <div className="flex flex-col gap-3 w-[140px]">
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                <img src={appStoreImg} alt="App Store" loading="lazy" decoding="async" className="cursor-pointer hover:opacity-80 transition-opacity w-full border border-gray-700 rounded-md" />
              </a>
              <a href={playStoreUrl} target="_blank" rel="noopener noreferrer">
                <img src={playStoreImg} alt="Google Play" loading="lazy" decoding="async" className="cursor-pointer hover:opacity-80 transition-opacity w-full border border-gray-700 rounded-md" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="border-t border-gray-800 pt-6 mt-2">
          <p className="text-gray-500 text-[13px] leading-relaxed">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners 2026 © ItzoFood™ Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
