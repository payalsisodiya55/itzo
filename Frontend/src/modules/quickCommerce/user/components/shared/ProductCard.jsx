import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "@shared/components/ui/Toast";
import { useCartAnimation } from "../../context/CartAnimationContext";
import { resolveQuickImageUrl } from "../../utils/image";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";

import { motion, AnimatePresence } from "framer-motion";

import { getQuickProductPath } from "../../utils/routes";
import { useSettings } from "@core/context/SettingsContext";

const ScallopedBadge = ({ text, className }) => (
  <div className={cn("relative w-9 h-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_1px_3px_rgba(168,85,247,0.4)]">
      <path
        fill="#A364FF"
        d="M50 0 C 54 0, 56 4, 61 5 C 66 6, 70 2, 75 5 C 80 8, 81 14, 84 18 C 88 22, 94 23, 96 28 C 98 33, 94 38, 94 43 C 94 48, 98 52, 98 57 C 98 62, 94 66, 92 71 C 90 76, 92 82, 88 86 C 84 90, 78 89, 73 92 C 68 95, 66 100, 61 100 C 56 100, 53 96, 48 96 C 43 96, 40 100, 35 99 C 30 98, 28 92, 23 90 C 18 88, 12 89, 9 84 C 6 79, 10 74, 9 69 C 8 64, 2 61, 2 56 C 2 51, 6 47, 7 42 C 8 37, 4 31, 6 26 C 8 21, 14 20, 18 16 C 22 12, 24 6, 29 4 C 34 2, 38 6, 43 5 C 48 4, 49 0, 53 0"
      />
    </svg>
    <div className="relative z-10 text-white font-black flex flex-col items-center justify-center leading-none text-center">
      {text.includes('%') ? (
        <>
          <span className="text-[9px] leading-tight">{text.split(' ')[0]}</span>
          <span className="text-[6px] opacity-90 tracking-tighter uppercase">{text.split(' ')[1] || 'OFF'}</span>
        </>
      ) : (
        <span className="text-[8px] uppercase tracking-tighter">{text}</span>
      )}
    </div>
  </div>
);

const ProductCard = React.memo(
  ({ product, badge, className, compact = false, neutralBg = false, curvedInfo = false }) => {
    const navigate = useNavigate();
    const { toggleWishlist: toggleWishlistGlobal, isInWishlist } =
      useWishlist();
    const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
    const { showToast } = useToast();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();

    const [showHeartPopup, setShowHeartPopup] = React.useState(false);
    const imageRef = React.useRef(null);

    const getComparableProductId = React.useCallback(
      (value) => String(value ?? "").split("::")[0],
      [],
    );

    const cartItem = React.useMemo(
      () =>
        cart.find(
          (item) =>
            getComparableProductId(item.productId || item.itemId || item.id || item._id) ===
            getComparableProductId(product.id || product._id),
        ),
      [cart, getComparableProductId, product.id, product._id],
    );
    const quantity = cartItem ? cartItem.quantity : 0;
    const isWishlisted = isInWishlist(product.id || product._id);

    const handleProductClick = React.useCallback(
      () => {
        const productId = product.id || product._id;
        if (!productId) return;
        navigate(getQuickProductPath(productId), { state: { product } });
      },
      [navigate, product],
    );

    const toggleWishlist = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isWishlisted) {
          setShowHeartPopup(true);
          setTimeout(() => setShowHeartPopup(false), 1000);
        }

        toggleWishlistGlobal(product);
        showToast(
          isWishlisted
            ? `${product.name} removed from wishlist`
            : `${product.name} added to wishlist`,
          isWishlisted ? "info" : "success",
        );
      },
      [isWishlisted, toggleWishlistGlobal, product, showToast],
    );

    const handleAddToCart = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const stock = Number(product.stock ?? Infinity);
        if (stock <= 0) {
          showToast("This product is out of stock", "error");
          return;
        }
        if (imageRef.current) {
          const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
          animateAddToCart(
            imageRef.current.getBoundingClientRect(),
            resolvedSrc,
          );
        }
        addToCart(product);
      },
      [animateAddToCart, product, addToCart],
    );

    const handleIncrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const stock = Number(product.stock ?? Infinity);
        if (quantity >= stock) {
          showToast(`Only ${stock} in stock`, "error");
          return;
        }
        updateQuantity(product.id || product._id, 1);
      },
      [updateQuantity, product.id, product._id],
    );

    const handleDecrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (quantity === 1) {
          animateRemoveFromCart(product.image);
          removeFromCart(product.id || product._id);
        } else {
          updateQuantity(product.id || product._id, -1);
        }
      },
      [
        quantity,
        animateRemoveFromCart,
        product.image,
        removeFromCart,
        product.id,
        product._id,
        updateQuantity,
      ],
    );

    return (
      <div
        className={cn(
          "flex-shrink-0 w-full flex flex-col h-full cursor-pointer group bg-transparent",
          className,
        )}
        onClick={handleProductClick}>
        <div
          className={cn(
            "flex flex-col h-full w-full rounded-xl overflow-hidden transition-all duration-500 product-card-container premium-wave-shimmer",
            "bg-[#FFF5F5] border border-red-100/50 shadow-sm",
            "hover:shadow-md",
          )}>
          {/* Top Image Section */}
          <div className="relative overflow-hidden w-full h-[90px] md:h-[110px] p-1 md:p-2">
            {/* Badge (Professional Tag) */}
            {(badge || product.discount || product.originalPrice > product.price) && (
              <div className="absolute top-0.5 left-0.5 z-10">
                <ScallopedBadge
                  text={badge || product.discount || (product.originalPrice > product.price && product.originalPrice > 0
                    ? `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`
                    : null)}
                />
              </div>
            )}

            <button
              onClick={toggleWishlist}
              className="absolute top-1 right-1 z-10 w-6 h-6 md:w-8 md:h-8 bg-white/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center cursor-pointer hover:bg-white transition-all active:scale-90 border border-slate-100/50">
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}>
                <Heart
                  size={window.innerWidth < 768 ? 12 : 16}
                  className={cn(
                    isWishlisted ? "text-red-500 fill-red-500" : "text-slate-300 dark:text-slate-500 group-hover:text-slate-400 dark:group-hover:text-slate-300",
                  )}
                />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHeartPopup && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1, y: 0 }}
                  animate={{ scale: 2.5, opacity: 0, y: -60 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none text-red-500/30">
                  <Heart size={48} fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full h-full rounded-md overflow-hidden bg-white flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <img
                ref={imageRef}
                src={resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage}
                srcSet={getCloudinarySrcSet(product.image || product.mainImage)}
                sizes="(max-width: 768px) 150px, (max-width: 1024px) 200px, 250px"
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply p-0.5 md:p-1"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className={cn(
            "flex flex-col flex-1 px-1.5 py-1 space-y-0.5 bg-[#FFF5F5] border-t border-red-100/30 relative product-content-area transition-all duration-300",
          )}>
            <div className="space-y-0">
              <div className="flex items-center gap-1 text-[7.5px] md:text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                <Clock size={7} className="text-emerald-600" />
                <span>{product.deliveryTime || "10 MINS"}</span>
              </div>
              <h3 className="text-[11px] md:text-[12.5px] font-bold text-slate-900 line-clamp-1 leading-tight">
                {product.name}
              </h3>
              <p className="text-[8px] md:text-[10px] text-slate-400 font-semibold italic">
                {product.weight || "1 unit"}
              </p>
            </div>

            <div className="mt-auto flex items-center justify-between gap-1 pt-0.5 border-t border-slate-200/20">
              <div className="flex flex-col justify-center">
                <span className="text-[12.5px] md:text-[14px] font-black text-slate-900 leading-none">
                  ₹{Number(product.price || 0).toLocaleString()}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-[8.5px] md:text-[9.5px] text-slate-400 line-through font-bold leading-none mt-0.5">
                    ₹{Number(product.originalPrice || 0).toLocaleString()}
                  </span>
                )}
              </div>

              {quantity > 0 ? (
                <div className="flex items-center bg-[#cc2532] text-white rounded-lg md:rounded-xl shadow-md h-6 md:h-7.5 overflow-hidden ring-1 ring-[#cc2532]/20">
                  <button
                    onClick={handleDecrement}
                    className="w-6 md:w-7.5 h-full hover:bg-black/10 transition-colors flex items-center justify-center border-r border-white/10">
                    <Minus size={9} strokeWidth={4} />
                  </button>
                  <span className="text-[10px] md:text-[12px] font-black min-w-[14px] md:min-w-[18px] text-center px-1">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="w-6 md:w-7.5 h-full hover:bg-black/10 transition-colors flex items-center justify-center border-l border-white/10">
                    <Plus size={9} strokeWidth={4} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={cn(
                    "w-6 h-6 md:w-7.5 md:h-7.5 flex items-center justify-center bg-white border-[1px] border-[#cc2532] text-[#cc2532] rounded-lg md:rounded-xl shadow-sm transition-all duration-300 active:scale-95 font-bold",
                    "hover:bg-[#cc2532] hover:text-white"
                  )}>
                  <Plus size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ProductCard;
