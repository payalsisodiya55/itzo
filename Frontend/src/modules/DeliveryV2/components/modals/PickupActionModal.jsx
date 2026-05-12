import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, MapPin, Phone, 
  ChevronDown, ChevronUp, Package, 
  Navigation, CheckCircle2, Camera, Loader2, Image as ImageIcon
} from 'lucide-react';
import { ActionSlider } from '@/modules/DeliveryV2/components/ui/ActionSlider';
import { uploadAPI } from '@food/api';
import { toast } from 'sonner';
import { openCamera } from "@food/utils/imageUploadUtils";
import { isMixedOrder, normalizePickupPoints } from '@/modules/DeliveryV2/utils/orderRouting';

/**
 * PickupActionModal - Unified White/Green Theme with Slider Actions.
 * Includes Bill Upload feature prior to pickup.
 */
export const PickupActionModal = ({ 
  order, 
  status, 
  isWithinRange, 
  distanceToTarget,
  eta,
  onReachedPickup, 
  onPickedUp,
  onMinimize
}) => {
  const [showItems, setShowItems] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [billImageUploaded, setBillImageUploaded] = useState(false);
  const [billImageUrl, setBillImageUrl] = useState(null);
  const cameraInputRef = useRef(null);

  if (!order) return null;

  const handleBillImageSelect = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingBill(true);
    try {
      const res = await uploadAPI.uploadMedia(file, { folder: 'appzeto/delivery/bills' });
      if (res?.data?.success && res?.data?.data) {
        setBillImageUrl(res.data.data.url || res.data.data.secure_url);
        setBillImageUploaded(true);
        // toast.success('Bill image uploaded!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      toast.error('Failed to upload bill image');
      setBillImageUploaded(false);
      setBillImageUrl(null);
    } finally {
      setIsUploadingBill(false);
    }
  };

  const handleTakeCameraPhoto = () => {
    openCamera({
      onSelectFile: (file) => handleBillImageSelect(file),
      fileNamePrefix: `bill-${order.orderId || order._id}`
    })
  }

  const handlePickFromGallery = () => {
    cameraInputRef.current?.click()
  }

  const isAtPickup = status === 'REACHED_PICKUP';
  const isQuickOrder = String(order?.orderType || order?.serviceType || order?.type || '').trim().toLowerCase() === 'quick';
  const restaurantName = isQuickOrder
    ? order?.storeName || order?.sellerName || order?.seller?.shopName || order?.seller?.name || 'Seller store'
    : order?.restaurantName || order?.restaurant_name || order?.restaurantId?.restaurantName || order?.restaurantId?.name || 'Restaurant';
  const restaurantAddress = isQuickOrder
    ? order?.storeAddress || order?.sellerAddress || order?.seller?.location?.address || order?.seller?.location?.formattedAddress || 'Address not available'
    : order?.restaurantAddress || order?.restaurant_address || order?.restaurantLocation?.address || 'Address not available';
  const restaurantPhone = isQuickOrder
    ? order?.storePhone || order?.sellerPhone || order?.seller?.phone || ''
    : order?.restaurantPhone || order?.restaurant_phone || order?.restaurantId?.phone || '';
  const items = order.items || [];
  const restaurantLogo = isQuickOrder
    ? order?.storeImage || order?.seller?.logo || order?.seller?.image || order?.seller?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'
    : order?.restaurantImage || order?.restaurant?.logo || order?.restaurant?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png';
  const pickupPoints = normalizePickupPoints(order);
  const mixedOrder = isMixedOrder(order);
  const pickupStops = pickupPoints.length
    ? pickupPoints
    : [
        {
          id: 'food:primary',
          pickupType: isQuickOrder ? 'quick' : 'food',
          sourceName: restaurantName,
          address: restaurantAddress,
          phone: restaurantPhone,
        },
      ];
  const primaryStop = pickupStops[0] || null;
  const primaryPickupType = primaryStop?.pickupType === 'quick' ? 'quick' : 'food';
  const primaryName = primaryStop?.sourceName || restaurantName;
  const primaryAddress = primaryStop?.address || restaurantAddress;
  const primaryPhone = primaryStop?.phone || restaurantPhone;
  const primaryDestinationLabel = primaryPickupType === 'quick' ? 'Store' : 'Restaurant';

  return (
    <div className="absolute inset-x-0 bottom-0 z-[110] p-0 sm:p-2 sm:mb-2 flex items-end justify-center">
      {/* Background Dim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 -z-10"
      />

      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="w-full max-w-lg bg-white rounded-t-[2rem] shadow-[0_-15px_40px_rgba(0,0,0,0.2)] p-4 pb-8"
      >
        {/* Handle / Minimize */}
        <div className="w-full flex justify-center pb-4 pt-1">
          <button onClick={onMinimize} className="p-1 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex flex-col items-center">
             <ChevronDown className="w-6 h-6 text-gray-400 stroke-[3]" />
          </button>
        </div>

        {/* Restaurant Header */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-50">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden border border-gray-100">
              <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-gray-950 text-xl font-bold">{primaryName}</h3>
              {mixedOrder && (
                <div className="mt-2 inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                  Mixed Order
                </div>
              )}
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1.5">
                {isAtPickup ? (
                  <span className="text-green-600">Reached Location √</span>
                ) : (
                  <span className="text-orange-500">
                    {(distanceToTarget / 1000).toFixed(1)} km • {eta || '--'} min to {primaryDestinationLabel}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {primaryPhone && (
              <button
                onClick={() => window.location.href = `tel:${primaryPhone}`}
                className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100"
              >
                <Phone className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryAddress)}`, '_blank')}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          {pickupStops.map((pickup, index) => {
            const isQuickStore = pickup.pickupType === 'quick';
            const label = isQuickStore ? 'Store Pickup' : 'Restaurant Pickup';
            const accentClasses = isQuickStore
              ? 'text-orange-600 bg-orange-50 border-orange-100'
              : 'text-green-600 bg-green-50 border-green-100';

            return (
              <div
                key={pickup.id || `${pickup.pickupType}-${index}`}
                className="rounded-xl border border-gray-100 bg-gray-50/80 p-3"
              >
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${accentClasses}`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pickupStops.length > 1 ? `${label} ${index + 1}` : label}</span>
                </div>
                <p className="mt-3 text-base font-bold text-gray-950">{pickup.sourceName || (isQuickStore ? 'Seller store' : 'Restaurant')}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">{pickup.address || 'Address not available'}</p>
              </div>
            );
          })}
        </div>

        {/* Action Sliders */}
        <div className="space-y-4">
          {!isAtPickup ? (
            <div>
              <p className={`text-center text-[10px] font-bold uppercase tracking-widest mb-3 transition-colors ${
                isWithinRange ? 'text-green-600' : 'text-orange-500 animate-pulse'
              }`}>
                {isWithinRange ? 'Ready - Swipe to confirm arrival' : 'Get closer to pickup point'}
              </p>
              <ActionSlider 
                key="action-reach"
                label="Slide to Reach" 
                successLabel="Reached!"
                disabled={!isWithinRange}
                onConfirm={onReachedPickup}
                color="bg-green-600"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-3 w-full">
                 {!billImageUploaded && !isUploadingBill && (
                   <>
                      <button
                        onClick={handleTakeCameraPhoto}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-900 text-white font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Camera</span>
                      </button>
                      <button
                        onClick={handlePickFromGallery}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span>Gallery</span>
                      </button>
                   </>
                 )}

                 {isUploadingBill && (
                    <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-xs uppercase tracking-widest">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span>Uploading...</span>
                    </div>
                 )}

                 {billImageUploaded && (
                    <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-100 text-green-700 font-bold text-xs uppercase tracking-widest">
                       <CheckCircle2 className="w-4 h-4" />
                       <span>Bill Uploaded</span>
                    </div>
                 )}

                 <input
                   ref={cameraInputRef}
                   type="file"
                   accept="image/*"
                   onChange={(e) => handleBillImageSelect(e.target.files[0])}
                   className="hidden"
                 />
              </div>

              <div>
                <p className={`text-center text-[10px] font-bold uppercase tracking-widest mb-3 ${billImageUploaded ? 'text-green-600' : 'text-gray-400'}`}>
                  {billImageUploaded ? "Check the restaurant logo - Swipe to pick up" : "Capture bill to unlock swipe"}
                </p>
                <ActionSlider 
                  key="action-pickup"
                  label="Slide to Pick Up" 
                  successLabel="Picked Up!"
                  disabled={!billImageUploaded}
                  onConfirm={() => onPickedUp(billImageUrl)}
                  color="bg-orange-500"
                />
              </div>
            </div>
          )}

          {/* Delivery Instructions (User Note) */}
          {order?.note && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-3 items-start">
              <ChefHat className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">User Instructions</p>
                <p className="text-sm font-bold text-gray-800 leading-snug">"{order.note}"</p>
              </div>
            </div>
          )}

          {/* Collapsible Order Summary */}
          <button 
            onClick={() => setShowItems(!showItems)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 text-gray-900 font-bold text-xs uppercase tracking-widest">
              <Package className="w-5 h-5 text-gray-400" />
              <span>Order Details ({items.length || 0})</span>
            </div>
            {showItems ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {showItems && (
            <div className="overflow-hidden space-y-2 px-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 text-sm font-bold">{item.name || 'Item Name'}</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg text-xs">x{item.quantity || 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PickupActionModal;
