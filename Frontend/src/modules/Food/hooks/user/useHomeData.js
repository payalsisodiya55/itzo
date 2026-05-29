import { useState, useCallback, useEffect, useMemo } from 'react';
import { restaurantAPI } from "@food/api";
import { normalizeImageUrl, extractImages, calculateDistance, slugify } from "@food/utils/common";

// Global cache to avoid refetching identical restaurant menus across navigation
const menuMetaCache = new Map();

export const useHomeData = (location, zoneId) => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [landingCategories, setLandingCategories] = useState([]);
  const [exploreMoreItems, setExploreMoreItems] = useState([]);
  const [exploreMoreHeading, setExploreMoreHeading] = useState("Explore More");
  
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [heroBannerImages, setHeroBannerImages] = useState([]);
  const [heroBannersData, setHeroBannersData] = useState([]);

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantsData, setRestaurantsData] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  
  const [menuCategories, setMenuCategories] = useState([]);
  const [loadingMenuCategories, setLoadingMenuCategories] = useState(false);
  const [restaurantDietMeta, setRestaurantDietMeta] = useState({});

  // Old backend endpoints (hero banners / landing config) are not used anymore.
  // Keep UI stable by setting safe defaults once.
  const initLandingConfig = useCallback(() => {
    setLoadingConfig(true);
    setLandingCategories([]);
    setExploreMoreItems([]);
    setExploreMoreHeading("Explore More");
    setRecommendedRestaurants([]);
    setLoadingConfig(false);
  }, []);

  const initBanners = useCallback(() => {
    setLoadingBanners(true);
    setHeroBannersData([]);
    setHeroBannerImages([]);
    setLoadingBanners(false);
  }, []);

  const fetchRestaurants = useCallback(async (filters = {}) => {
    try {
      setLoadingRestaurants(true);
      const params = {
        _ts: Date.now(),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.cuisine && { cuisine: filters.cuisine }),
        ...(zoneId && { zoneId })
      };
      const res = await restaurantAPI.getRestaurants(params);
      if (res.data?.success) {
        const raw = res.data.data.restaurants || [];
        const userLat = location?.latitude;
        const userLng = location?.longitude;

        const transformed = raw.map(r => {
          const rLoc = r.location;
          const rLat = rLoc?.latitude || (rLoc?.coordinates?.[1]);
          const rLng = rLoc?.longitude || (rLoc?.coordinates?.[0]);
          
          let distInKm = calculateDistance(userLat, userLng, rLat, rLng);
          const coverImgs = extractImages(r.coverImages);
          const menuImgs = extractImages(r.menuImages);
          const profileImgs = extractImages(r.profileImage || r.image);
          const allImgs = Array.from(new Set([...coverImgs, ...menuImgs, ...profileImgs]));

          return {
            ...r,
            id: r.restaurantId || r._id,
            mongoId: r._id,
            distanceInKm: distInKm,
            image: allImgs[0] || "",
            images: allImgs,
            rating: r.rating || 4.5,
            cuisine: r.cuisines?.[0] || "Multi-cuisine"
          };
        });
        setRestaurantsData(transformed);
      }
    } finally {
      setLoadingRestaurants(false);
    }
  }, [location, zoneId]);

  const fetchMenuMeta = useCallback(() => {
    if (!restaurantsData.length) return () => {};
    
    // Use controlled concurrency (CHUNK_SIZE = 5)
    const CHUNK_SIZE = 5;
    const restaurantsToProcess = restaurantsData.slice(0, 50);
    
    setLoadingMenuCategories(true);
    let isCancelled = false;

    const executeProgressiveFetch = async () => {
      for (let i = 0; i < restaurantsToProcess.length; i += CHUNK_SIZE) {
        if (isCancelled) break;
        
        const chunk = restaurantsToProcess.slice(i, i + CHUNK_SIZE);
        
        const chunkResponses = await Promise.all(
          chunk.map(async (r) => {
            if (menuMetaCache.has(r.id)) {
              return { id: r.id, menu: menuMetaCache.get(r.id) };
            }
            try {
              const res = await restaurantAPI.getMenuByRestaurantId(r.id);
              const menu = res?.data?.data?.menu;
              if (menu) {
                menuMetaCache.set(r.id, menu);
              }
              return { id: r.id, menu };
            } catch {
              return { id: r.id, menu: null };
            }
          })
        );
        
        if (isCancelled) break;

        const newDietMeta = {};
        const newCategories = [];
        
        chunkResponses.forEach(({ id, menu }) => {
          let hasVeg = false, hasNonVeg = false;
          const sections = menu?.sections || [];
          sections.forEach(s => {
            const items = s.items || [];
            items.forEach(item => {
              const type = String(item.foodType || "").toLowerCase();
              if (type === "veg") hasVeg = true;
              if (type.includes("non")) hasNonVeg = true;
            });
            const slug = slugify(s.name);
            if (slug) {
              newCategories.push({
                id: slug, name: s.name, slug, label: s.name,
                image: items[0]?.image ? normalizeImageUrl(items[0].image) : ""
              });
            }
          });
          newDietMeta[id] = { hasVeg, hasNonVeg, isPureVeg: hasVeg && !hasNonVeg };
        });

        // Progressively update state for immediate perceived performance
        setRestaurantDietMeta(prev => ({ ...prev, ...newDietMeta }));

        setMenuCategories(prev => {
          const prevMap = new Map(prev.map(c => [c.slug, c]));
          newCategories.forEach(c => {
            if (!prevMap.has(c.slug)) {
              prevMap.set(c.slug, c);
            }
          });
          return Array.from(prevMap.values());
        });
      }

      if (!isCancelled) {
        setLoadingMenuCategories(false);
      }
    };

    executeProgressiveFetch();

    // Cancellation safety on unmount
    return () => {
      isCancelled = true;
    };
  }, [restaurantsData]);

  useEffect(() => {
    initLandingConfig();
    initBanners();
  }, [initLandingConfig, initBanners]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const cleanup = fetchMenuMeta();
    return cleanup;
  }, [fetchMenuMeta]);

  return {
    loadingConfig, landingCategories, exploreMoreItems, exploreMoreHeading, recommendedRestaurants,
    loadingBanners, heroBannerImages, heroBannersData,
    loadingRestaurants, restaurantsData, setRestaurantsData,
    loadingMenuCategories, menuCategories, restaurantDietMeta,
    fetchRestaurants
  };
};
