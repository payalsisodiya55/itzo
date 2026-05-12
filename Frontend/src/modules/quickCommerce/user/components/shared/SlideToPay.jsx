import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Check, ChevronsRight } from 'lucide-react';

const SlideToPay = ({
    onSuccess,
    amount,
    isLoading = false,
    disabled = false,
    text = "Slide to Pay"
}) => {
    const [isCompleted, setIsCompleted] = useState(false);
    const controls = useAnimation();
    const x = useMotionValue(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [sliderWidth, setSliderWidth] = useState(56); // Width of the sliding circle

    // Maximum drag distance
    const maxDrag = Math.max(0, containerWidth - sliderWidth - 8); // 8px padding

    // Transform x to background opacity or color if needed
    const opacity = useTransform(x, [0, maxDrag], [1, 0]);
    const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
    const shimmerOpacity = useTransform(x, [0, maxDrag * 0.3], [1, 0]);

    // Rotation transform based on drag position
    const rotate = useTransform(x, [0, maxDrag], [0, 360]);
    // Opacity for the arrows to fade out as it completes
    const arrowsOpacity = useTransform(x, [0, maxDrag * 0.8], [1, 0]);
    // Opacity for the checkmark to fade in
    const checkOpacity = useTransform(x, [maxDrag * 0.5, maxDrag], [0, 1]);

    // Background fill progress
    const fillWidth = useTransform(x, [0, maxDrag], [0, containerWidth]);

    const handleDragEnd = async () => {
        const currentX = x.get();
        if (currentX >= maxDrag * 0.9) {
            setIsCompleted(true);
            controls.start({ x: maxDrag });
            if (onSuccess) {
                try {
                    await onSuccess();
                } finally {
                    setIsCompleted(false);
                    controls.start({ x: 0 });
                }
            } else {
                setIsCompleted(false);
                controls.start({ x: 0 });
            }
        } else {
            controls.start({ x: 0 });
        }
    };

    useEffect(() => {
        if (isLoading) {
            // Loading state if handled externally
        }
    }, [isLoading]);


    return (
        <div
            className="relative h-16 w-full rounded-full overflow-hidden select-none touch-none bg-linear-to-r from-[#0c831f] via-[#16a34a] to-[#0c831f] shadow-[0_18px_45px_rgba(4,120,87,0.35)] border border-white/10"
            ref={(el) => el && setContainerWidth(el.offsetWidth)}
        >
            {/* Progress Fill */}
            <motion.div
                className="absolute inset-y-0 left-0 bg-white/15"
                style={{ width: fillWidth }}
            />

            {/* Shimmer Effect Background (continuous sweep) */}
            <motion.div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ opacity: shimmerOpacity }}
            >
                <motion.div
                    className="absolute inset-y-0 -inset-x-1 bg-linear-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* Text Label */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                style={{ opacity: textOpacity }}
            >
                <span className="text-white font-black text-sm md:text-[13px] tracking-[0.25em] uppercase flex items-center gap-2">
                    {text} <span className="text-white/40">|</span> <span className="text-emerald-50 font-extrabold">₹{amount}</span>
                </span>

                <div className="absolute right-4 animate-pulse text-white/70">
                    <ChevronsRight size={20} />
                </div>
            </motion.div>

            {/* Success State Text */}
            {isCompleted && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                    <span className="text-white font-black text-lg tracking-wide uppercase flex items-center gap-2">
                        Processing <span className="animate-pulse">...</span>
                    </span>
                </motion.div>
            )}

            {/* Draggable Circle */}
            <motion.div
                className="absolute left-1 top-1 bottom-1 w-14 h-14 bg-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shadow-[0_6px_18px_rgba(15,118,110,0.35)] border border-emerald-100"
                drag={!isCompleted && !isLoading ? "x" : false}
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x }}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
            >
                {isLoading || isCompleted ? (
                    <motion.div
                        className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                ) : (
                    <motion.div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ rotate }}
                    >
                        <motion.div className="text-[#0c831f]" style={{ opacity: arrowsOpacity }}>
                            <ChevronRight size={28} strokeWidth={3} />
                        </motion.div>
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center text-[#0c831f]"
                            style={{ opacity: checkOpacity }}
                        >
                            <Check size={24} strokeWidth={3} />
                        </motion.div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default SlideToPay;
