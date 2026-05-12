import { useState, useCallback } from 'react';

export const useDiningState = () => {
  const [heroSearch, setHeroSearch] = useState("");
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('sort');
  const [sortBy, setSortBy] = useState(null);
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [selectedBankOffer, setSelectedBankOffer] = useState(null);

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) next.delete(filterId);
      else next.add(filterId);
      return next;
    });
  }, []);

  return {
    heroSearch, setHeroSearch,
    currentRestaurantIndex, setCurrentRestaurantIndex,
    activeFilters, setActiveFilters, toggleFilter,
    isFilterOpen, setIsFilterOpen,
    activeFilterTab, setActiveFilterTab,
    sortBy, setSortBy,
    selectedCuisine, setSelectedCuisine,
    selectedBankOffer, setSelectedBankOffer
  };
};
