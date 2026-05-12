import { useState, useCallback, useEffect } from 'react';
import { diningAPI } from "@food/api";
import api from "@food/api";

export const useDiningData = (location) => {
  const [categories, setCategories] = useState([]);
  const [limelightItems, setLimelightItems] = useState([]);
  const [mustTryItems, setMustTryItems] = useState([]);
  const [restaurantList, setRestaurantList] = useState([]);
  const [bankOfferItems, setBankOfferItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diningHeroBanner, setDiningHeroBanner] = useState(null);

  const fetchDiningData = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, limes, tries, rests, offers, hero] = await Promise.all([
        diningAPI.getCategories(),
        diningAPI.getOfferBanners(),
        diningAPI.getStories(),
        diningAPI.getRestaurants(location?.city ? { city: location.city } : {}),
        diningAPI.getBankOffers(),
        api.get('/food/hero-banners/dining/public').catch(() => ({ data: { success: false } }))
      ]);

      if (cats.data?.success) setCategories(cats.data.data);
      if (limes.data?.success) setLimelightItems(limes.data.data);
      if (tries.data?.success) setMustTryItems(tries.data.data);
      if (rests.data?.success) setRestaurantList(rests.data.data);
      if (offers.data?.success) setBankOfferItems(offers.data.data);
      
      if (hero.data?.success && hero.data.data.banners?.length > 0) {
        setDiningHeroBanner(hero.data.data.banners[0]?.imageUrl || null);
      }
    } finally {
      setLoading(false);
    }
  }, [location?.city]);

  useEffect(() => {
    fetchDiningData();
  }, [fetchDiningData]);

  return {
    categories, limelightItems, mustTryItems, restaurantList, bankOfferItems,
    loading, diningHeroBanner
  };
};
