import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * @typedef {Object} Location
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} ActiveOrder
 * @property {string} orderId
 * @property {string} status
 * @property {Location} restaurantLocation
 * @property {Location} customerLocation
 * @property {number} orderAmount
 */

/**
 * useDeliveryStore - Professional Zustand store for Delivery V2
 * Handles Trip Lifecycle, Rider Status, and Admin Settings.
 */
export const useDeliveryStore = create(
  persist(
    (set, get) => ({
      // --- Rider Status ---
      isOnline: false,
      riderLocation: null, // { lat, lng }
      
      // --- Trip State ---
      activeOrder: null, // ActiveOrder | null
      tripStatus: 'IDLE', // 'IDLE' | 'PICKING_UP' | 'REACHED_PICKUP' | 'PICKED_UP' | 'DELIVERING' | 'REACHED_DROP' | 'COMPLETED'
      
      // --- Admin / Business Settings ---
      settings: {
        pickupRangeLimit: 500, // meters, fallback default
        deliveryRangeLimit: 500, // meters, fallback default
      },

      // --- Actions ---
      toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
      
      setOnline: (online) => set({ isOnline: online }),
      
      setRiderLocation: (location) => set({ riderLocation: location }),
      
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      setActiveOrder: (order) => set({ 
        activeOrder: order, 
        tripStatus: order ? 'PICKING_UP' : 'IDLE' 
      }),

      updateTripStatus: (status) => set({ tripStatus: status }),

      clearActiveOrder: () => set({ 
        activeOrder: null, 
        tripStatus: 'IDLE' 
      }),

      // --- Selectors / Computed Helper ---
      canAdvanceToPickup: () => {
        const { activeOrder, tripStatus } = get();
        return activeOrder && tripStatus === 'PICKING_UP';
      },

      canAdvanceToDeliver: () => {
        const { activeOrder, tripStatus } = get();
        return activeOrder && tripStatus === 'PICKED_UP';
      }
    }),
    {
      name: 'delivery-v2-online-pref',
      // ONLY persist the 'isOnline' state, ignoring orders/location to prevent dummy order bugs
      partialize: (state) => ({ isOnline: state.isOnline }),
    }
  )
);
