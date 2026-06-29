import React, { useState, useEffect } from 'react';
import { getCachedSettings, loadBusinessSettings } from '@common/utils/businessSettings';

const InstagramOriginal = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#paint0_linear)"/>
    <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80977 15.3801 9.21484 14.7852C8.61991 14.1902 8.22773 13.4229 8.09406 12.5922C7.9604 11.7616 8.09206 10.9099 8.47032 10.1584C8.84859 9.40685 9.45418 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87658 12.63 8C13.4789 8.12588 14.2648 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 6.5H17.51" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F58529"/>
        <stop offset="0.5" stopColor="#DD2A7B"/>
        <stop offset="1" stopColor="#8134AF"/>
      </linearGradient>
    </defs>
  </svg>
);

const YoutubeOriginal = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.54 6.42C22.4214 5.94523 22.1554 5.51865 21.7801 5.20455C21.4047 4.89045 20.9398 4.70568 20.45 4.68C18.6 4.5 12 4.5 12 4.5C12 4.5 5.4 4.5 3.55 4.68C3.06019 4.70568 2.59526 4.89045 2.21992 5.20455C1.84457 5.51865 1.5786 5.94523 1.46 6.42C1.22 8.24 1.22 12 1.22 12C1.22 12 1.22 15.76 1.46 17.58C1.5786 18.0548 1.84457 18.4814 2.21992 18.7955C2.59526 19.1095 3.06019 19.2943 3.55 19.32C5.4 19.5 12 19.5 12 19.5C12 19.5 18.6 19.5 20.45 19.32C20.9398 19.2943 21.4047 19.1095 21.7801 18.7955C22.1554 18.4814 22.4214 18.0548 22.54 17.58C22.78 15.76 22.78 12 22.78 12C22.78 12 22.78 8.24 22.54 6.42Z" fill="#FF0000"/>
    <path d="M9.75 15.02L15.5 12L9.75 8.98V15.02Z" fill="white"/>
  </svg>
);

const LinkedinOriginal = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452H16.891V14.881C16.891 13.554 16.868 11.848 15.044 11.848C13.201 11.848 12.918 13.287 12.918 14.786V20.452H9.362V9H12.776V10.561H12.825C13.3 9.66 14.463 8.712 16.182 8.712C19.774 8.712 20.447 11.074 20.447 14.167V20.452ZM5.337 7.433C4.195 7.433 3.275 6.51 3.275 5.37C3.275 4.232 4.195 3.309 5.337 3.309C6.474 3.309 7.4 4.232 7.4 5.37C7.4 6.51 6.474 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.225 0Z" fill="#0A66C2"/>
  </svg>
);

const FacebookOriginal = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.563H7.078V12.073H10.125V9.412C10.125 6.388 11.916 4.716 14.658 4.716C15.97 4.716 17.344 4.951 17.344 4.951V7.92H15.831C14.34 7.92 13.875 8.85 13.875 9.805V12.073H17.188L16.656 15.563H13.875V24C19.612 23.094 24 18.1 24 12.073Z" fill="#1877F2"/>
  </svg>
);

const TwitterOriginal = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.953 4.57009C23.0545 4.96569 22.1026 5.22683 21.128 5.34509C22.154 4.72834 22.9224 3.76113 23.287 2.60609C22.34 3.17009 21.286 3.58109 20.164 3.80609C19.4238 3.01469 18.4429 2.48951 17.3736 2.31259C16.3044 2.13567 15.2079 2.31674 14.2592 2.82768C13.3105 3.33862 12.5645 4.15084 12.14 5.13821C11.7155 6.12558 11.6368 7.23258 11.919 8.28509C9.97025 8.18731 8.06734 7.67664 6.34706 6.78957C4.62678 5.90251 3.13197 4.66016 1.973 3.15109C1.53051 3.91039 1.29871 4.78306 1.30001 5.67609C1.30001 7.31709 2.13601 8.76609 3.42501 9.62909C2.63784 9.60455 1.86873 9.39055 1.18601 9.00609V9.06609C1.1856 10.2033 1.58333 11.3039 2.31557 12.1855C3.04781 13.0671 4.07221 13.6767 5.22001 13.9151C4.48512 14.1166 3.71458 14.1458 2.96901 13.9991C3.28256 14.9754 3.90429 15.8202 4.74312 16.4093C5.58195 16.9984 6.59371 17.3005 7.63201 17.3191C5.89201 18.6836 3.75338 19.4239 1.53801 19.4201C1.14488 19.42 0.752392 19.3967 0.362015 19.3501C2.62885 20.8037 5.28189 21.5756 7.99401 21.5721C17.155 21.5721 22.164 13.9831 22.164 7.40409C22.164 7.18909 22.159 6.97309 22.149 6.76009C23.1235 6.05608 23.9573 5.19525 24.619 4.20509L23.953 4.57009Z" fill="#1DA1F2"/>
  </svg>
);
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
    { name: 'Linkedin', icon: LinkedinOriginal, url: settings?.socialLinkedinUrl || '#' },
    { name: 'Instagram', icon: InstagramOriginal, url: settings?.socialInstagramUrl || '#' },
    { name: 'Youtube', icon: YoutubeOriginal, url: settings?.socialYoutubeUrl || '#' },
    { name: 'Facebook', icon: FacebookOriginal, url: settings?.socialFacebookUrl || '#' },
    { name: 'Twitter', icon: TwitterOriginal, url: settings?.socialTwitterUrl || '#' },
  ];

  let logoImg = settings?.landingFooterLogo?.url || "/itzo-logo-transparent.png";
  if (logoImg.includes("itzo-logo.jpg")) logoImg = "/itzo-logo-transparent.png";
  const appStoreImg = settings?.landingAppStoreBadge?.url || "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg";
  const playStoreImg = settings?.landingPlayStoreBadge?.url || "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg";
  const playStoreUrl = settings?.playStoreLink || "#!";
  const appStoreUrl = settings?.appStoreLink || "#!";

  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Logo Area */}
        <div className="mb-10">
          <img src={logoImg} alt="ItzoFood Logo" className="h-12 md:h-16 w-auto object-contain rounded-xl" />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1 */}
          <div>
            <h3 className="font-medium text-black tracking-wide mb-4 text-[15px]">About ItzoFood</h3>
            <ul className="space-y-2.5 text-gray-600 text-[14px]">
              <li><a href="/about" className="hover:text-black transition-colors">Who We Are</a></li>
              <li><a href="/food/careers" className="hover:text-black transition-colors">Careers / Jobs</a></li>
              <li><a href="/contact" className="hover:text-black transition-colors">Contact Us</a></li>
              <li><a href="/hrms" className="hover:text-black transition-colors">HRMS Portal</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-medium text-black tracking-wide mb-4 text-[15px]">For Restaurants</h3>
            <ul className="space-y-2.5 text-gray-600 text-[14px]">
              <li><a href="/food/restaurant" className="hover:text-black transition-colors">Partner With Us</a></li>
              <li><a href="/food/restaurant" className="hover:text-black transition-colors">Apps For You</a></li>
              <li><a href="/consulting" className="hover:text-black transition-colors">Restaurant Consulting</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-medium text-black tracking-wide mb-4 text-[15px]">For Delivery Partners</h3>
            <ul className="space-y-2.5 text-gray-600 text-[14px]">
              <li><a href="/food/delivery" className="hover:text-black transition-colors">Partner With Us</a></li>
              <li><a href="/food/delivery" className="hover:text-black transition-colors">Apps For You</a></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-medium text-black tracking-wide mb-4 text-[15px]">Learn More</h3>
            <ul className="space-y-2.5 text-gray-600 text-[14px]">
              <li><a href="/profile/privacy" className="hover:text-black transition-colors">Privacy</a></li>
              <li><a href="/profile/privacy" className="hover:text-black transition-colors">Security</a></li>
              <li><a href="/profile/terms" className="hover:text-black transition-colors">Terms of Service</a></li>
              <li><a href="/support" className="hover:text-black transition-colors">Help & Support</a></li>
            </ul>
          </div>

          {/* Column 5: Social & App */}
          <div>
            <h3 className="font-medium text-black tracking-wide mb-4 text-[15px]">Social Links</h3>
            <div className="flex gap-4 mb-6">
              {socialLinks.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform flex items-center justify-center w-8 h-8"
                  aria-label={social.name}
                >
                  <social.icon />
                </a>
              ))}
            </div>
            
            <div className="flex flex-col gap-3 w-[140px]">
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                <img src={appStoreImg} alt="App Store" loading="lazy" decoding="async" className="cursor-pointer hover:opacity-80 transition-opacity w-full border border-gray-200 rounded-md" />
              </a>
              <a href={playStoreUrl} target="_blank" rel="noopener noreferrer">
                <img src={playStoreImg} alt="Google Play" loading="lazy" decoding="async" className="cursor-pointer hover:opacity-80 transition-opacity w-full border border-gray-200 rounded-md" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="border-t border-gray-200 pt-6 mt-2">
          <p className="text-gray-500 text-[13px] leading-relaxed">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners 2026 © ItzoFood Partners Private Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
