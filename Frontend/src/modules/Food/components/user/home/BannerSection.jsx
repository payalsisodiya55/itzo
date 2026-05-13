import React, { memo } from "react";
import { motion } from "framer-motion";
import { HeroBannerSkeleton } from "@food/components/ui/loading-skeletons";

const TypewriterText = ({ text, isActive, delay = 0 }) => {
  const words = text.split(" ");
  return (
    <span className="inline-flex flex-wrap gap-x-1 sm:gap-x-1.5">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split("").map((char, charIndex) => {
            const previousCharsCount = words.slice(0, wordIndex).join("").length + wordIndex;
            const absoluteIndex = previousCharsCount + charIndex;
            return (
              <motion.span
                key={`${char}-${charIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.05, delay: isActive ? delay + absoluteIndex * 0.03 : 0 }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
};
import OptimizedImage from "@food/components/OptimizedImage";

const BannerSection = memo(({
  showBannerSkeleton,
  heroBannerImages,
  heroBannersData,
  currentBannerIndex,
  setCurrentBannerIndex,
  heroShellRef,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  navigate,
  backendOrigin = "",
  hideOverlay = false
}) => {
  if (showBannerSkeleton) {
    return (
      <div className="h-full w-full">
        <HeroBannerSkeleton className="h-full w-full" />
      </div>
    );
  }

  if (!heroBannerImages || heroBannerImages.length === 0) return null;

  return (
    <div className="h-full w-full">
      <div
        ref={heroShellRef}
        data-home-hero-shell="true"
        className="relative w-full h-full overflow-hidden bg-transparent"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] w-[150%] h-full"
            />
          </div>
          {heroBannerImages.map((image, index) => {
            const bannerData = heroBannersData[index];
            const isVideo = bannerData?.type === 'video' || (typeof image === 'string' && image.toLowerCase().endsWith('.mp4'));
            const isActive = currentBannerIndex === index;

            return (
              <div
                key={`${index}-${image}`}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 2 : 1,
                  pointerEvents: "none",
                }}>
                {isVideo ? (
                  <video
                    src={image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                    style={{ filter: "brightness(0.95)" }}
                  />
                ) : (
                  <>
                    {!hideOverlay && (
                      <div className="relative h-full w-full flex items-center justify-between px-2 sm:px-6">
                        {/* Left Side: Text Content */}
                        <div className="relative z-10 flex flex-col justify-center h-full text-white w-[60%] sm:w-[65%] mt-2 pl-4 sm:pl-8">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] sm:text-xs font-black italic tracking-wider text-orange-200 uppercase flex items-center gap-1">
                              <TypewriterText text={bannerData?.title || "A SIX IS HIT! 🏏"} isActive={isActive} delay={0.1} />
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black leading-[1.1] mb-3 text-white uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                            <TypewriterText text={bannerData?.subtitle || "66% OFF FOR 10 MIN!"} isActive={isActive} delay={0.4} />
                          </h3>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={
                              isActive
                                ? { opacity: 1, scale: 1, y: [0, -4, 0, -2, 0] }
                                : { opacity: 0, scale: 0.8, y: 0 }
                            }
                            transition={{
                              opacity: { delay: 0.8, duration: 0.4 },
                              scale: { delay: 0.8, duration: 0.4, type: "spring" },
                              y: { delay: 1.5, duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.5 }
                            }}
                            className="w-fit"
                          >
                            <button className="bg-[#FE5502] hover:bg-[#E44D02] shadow-[0_4px_12px_rgba(254,85,2,0.5)] flex items-center gap-1 px-4 py-2 rounded-xl text-white font-bold transition-all transform hover:scale-105 active:scale-95">
                              {bannerData?.action || "Order Now"} <span className="font-black tracking-tighter">&gt;&gt;</span>
                            </button>
                          </motion.div>
                        </div>

                        {/* Right Side: Image Content */}
                        <motion.div
                          initial={{ opacity: 0, x: 20, scale: 0.9 }}
                          animate={{ opacity: currentBannerIndex === index ? 1 : 0, x: currentBannerIndex === index ? 0 : 20, scale: currentBannerIndex === index ? 1 : 0.9 }}
                          transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                          className="absolute right-0 bottom-0 h-[120%] w-[45%] sm:w-[40%] flex items-end justify-end pointer-events-none"
                        >
                          <img src={image} className="max-h-full w-auto object-contain object-bottom drop-shadow-2xl translate-y-2 sm:translate-y-4 translate-x-2 sm:translate-x-4" alt="Banner Graphic" />
                        </motion.div>
                      </div>
                    )}
                    <OptimizedImage
                      src={image}
                      alt={`Hero Banner ${index + 1}`}
                      className="h-full w-full object-cover"
                      priority={index === currentBannerIndex}
                      backendOrigin={backendOrigin}
                      draggable={false}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="absolute inset-0 z-20 h-full w-full border-0 p-0 bg-transparent text-left"
          onClick={() => {
            const bannerData = heroBannersData[currentBannerIndex];
            const linkedRestaurants = bannerData?.linkedRestaurants || [];
            if (linkedRestaurants.length > 0) {
              const firstRestaurant = linkedRestaurants[0];
              const restaurantSlug = firstRestaurant.slug || firstRestaurant.restaurantId || firstRestaurant._id;
              navigate(`/restaurants/${restaurantSlug}`);
            }
          }}
          aria-label={`Open hero banner ${currentBannerIndex + 1}`}
        />

        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 z-30 pointer-events-none">
          {heroBannerImages.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${currentBannerIndex === index ? "bg-white/80 w-4" : "bg-white/30 w-1"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default BannerSection;
