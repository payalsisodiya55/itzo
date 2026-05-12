import React, { useState, useMemo } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import {
    HiOutlineMapPin,
    HiOutlineBuildingOffice2,
    HiOutlineMagnifyingGlass,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineChevronRight,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineInformationCircle,
    HiOutlineXMark
} from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SellerLocations = () => {
    // Mock Data for All Active Sellers
    const [sellers] = useState([
        {
            id: 's1',
            shopName: 'Fresh Mart Superstore',
            category: 'Grocery',
            location: 'Mumbai, Maharashtra',
            coords: { lat: 19.0760, lng: 72.8777 },
            serviceRadius: 5,
            activeOrders: 12,
            performance: 'High'
        },
        {
            id: 's2',
            shopName: 'Tech Zone Electronics',
            category: 'Electronics',
            location: 'Bangalore, Karnataka',
            coords: { lat: 12.9716, lng: 77.5946 },
            serviceRadius: 12,
            activeOrders: 4,
            performance: 'Stable'
        },
        {
            id: 's3',
            shopName: 'Organic Greens Co.',
            category: 'Fruits & Veggies',
            location: 'Delhi, NCR',
            coords: { lat: 28.6139, lng: 77.2090 },
            serviceRadius: 10,
            activeOrders: 28,
            performance: 'Peak'
        },
        {
            id: 's4',
            shopName: 'Dairy Pure Farms',
            category: 'Dairy',
            location: 'Pune, Maharashtra',
            coords: { lat: 18.5204, lng: 73.8567 },
            serviceRadius: 8,
            activeOrders: 15,
            performance: 'High'
        },
        {
            id: 's5',
            shopName: 'Green Valley',
            category: 'Grocery',
            location: 'Mumbai, MH',
            coords: { lat: 19.1, lng: 72.9 },
            serviceRadius: 4,
            activeOrders: 8,
            performance: 'Stable'
        },
        {
            id: 's6',
            shopName: 'Pantry Plus',
            category: 'Grocery',
            location: 'Mumbai, MH',
            coords: { lat: 19.2, lng: 72.85 },
            serviceRadius: 6,
            activeOrders: 20,
            performance: 'High'
        },
        {
            id: 's7',
            shopName: 'Quick Mart',
            category: 'Grocery',
            location: 'Mumbai, MH',
            coords: { lat: 19.15, lng: 72.8 },
            serviceRadius: 3,
            activeOrders: 5,
            performance: 'Stable'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [mapView, setMapView] = useState('coverage'); // coverage or density
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isIntelOpen, setIsIntelOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        category: 'all',
        minRadius: 0
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1200);
    };

    const filteredSellers = useMemo(() => {
        return sellers.filter(s => {
            const matchesSearch = s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterOptions.category === 'all' || s.category === filterOptions.category;
            const matchesRadius = s.serviceRadius >= filterOptions.minRadius;
            return matchesSearch && matchesCategory && matchesRadius;
        });
    }, [sellers, searchTerm, filterOptions]);

    const stats = useMemo(() => ({
        totalCoverage: sellers.reduce((acc, s) => acc + s.serviceRadius, 0),
        cities: [...new Set(sellers.map(s => s.location.split(',')[0]))].length,
        avgRadius: (sellers.reduce((acc, s) => acc + s.serviceRadius, 0) / sellers.length).toFixed(1)
    }), [sellers]);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 px-1">
                <div>
                    <h1 className="ds-h1 flex items-center gap-2">
                        Delivery Map
                        <Badge variant="primary" className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase">Live Coverage</Badge>
                    </h1>
                    <p className="ds-description mt-0.5">Global view of seller service areas and delivery reach.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setMapView('coverage')}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                mapView === 'coverage' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            COVERAGE
                        </button>
                        <button
                            onClick={() => setMapView('density')}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                mapView === 'density' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            DENSITY
                        </button>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            "p-2.5 bg-white ring-1 ring-slate-200 rounded-xl shadow-sm transition-all active:scale-95",
                            isRefreshing ? "text-primary ring-primary/20" : "text-slate-400 hover:text-primary"
                        )}
                    >
                        <HiOutlineArrowPath className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left Sidebar: Seller Selection */}
                <div className="lg:w-80 flex flex-col gap-4 min-h-0 h-full">
                    <Card className="flex-1 flex flex-col border-none shadow-xl ring-1 ring-slate-100 rounded-xl overflow-hidden bg-white hover:bg-white/95 transition-all">
                        <div className="p-5 border-b border-slate-50 space-y-4">
                            <div className="relative group">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Find store or city..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between px-1 relative">
                                <span className="ds-label">Active Nodes ({filteredSellers.length})</span>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        showFilters ? "bg-slate-900 text-white" : "text-slate-400 hover:text-primary hover:bg-slate-50"
                                    )}
                                >
                                    <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                                </button>

                                {showFilters && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                                <select
                                                    value={filterOptions.category}
                                                    onChange={(e) => setFilterOptions({ ...filterOptions, category: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none"
                                                >
                                                    <option value="all">All Categories</option>
                                                    <option>Grocery</option>
                                                    <option>Electronics</option>
                                                    <option>Dairy</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min Radius</label>
                                                    <span className="text-[10px] font-bold text-primary">{filterOptions.minRadius}km</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="15"
                                                    value={filterOptions.minRadius}
                                                    onChange={(e) => setFilterOptions({ ...filterOptions, minRadius: parseInt(e.target.value) })}
                                                    className="w-full accent-primary h-1 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setFilterOptions({ category: 'all', minRadius: 0 })}
                                                className="w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                RESET
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className="overflow-y-auto overscroll-contain touch-pan-y px-1 pb-10"
                            style={{ height: '400px', display: 'block' }}
                            tabIndex={0}
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-2">
                                {filteredSellers.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedSeller(s)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                                            selectedSeller?.id === s.id
                                                ? "bg-slate-900 text-white shadow-xl translate-x-1"
                                                : "hover:bg-slate-50 text-slate-700"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                selectedSeller?.id === s.id ? "bg-white/10" : "bg-primary/5 text-primary"
                                            )}>
                                                <HiOutlineBuildingOffice2 className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold truncate tracking-tight">{s.shopName}</p>
                                                <p className={cn(
                                                    "text-[10px] font-medium truncate mt-0.5 opacity-60",
                                                    selectedSeller?.id === s.id ? "text-white" : "text-slate-500"
                                                )}>{s.location}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                                                        selectedSeller?.id === s.id ? "bg-white/20" : "bg-emerald-50 text-emerald-600"
                                                    )}>{s.serviceRadius}km Reach</span>
                                                    <span className={cn(
                                                        "text-[8px] font-bold uppercase",
                                                        selectedSeller?.id === s.id ? "text-white/60" : "text-slate-400"
                                                    )}>{s.activeOrders} orders</span>
                                                </div>
                                            </div>
                                            <HiOutlineChevronRight className={cn(
                                                "h-4 w-4 mt-1 transition-transform",
                                                selectedSeller?.id === s.id ? "translate-x-1 opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                </div>

                {/* Right Area: Interactive Map */}
                <Card className="flex-1 border-none shadow-2xl ring-1 ring-slate-200 rounded-2xl overflow-hidden bg-slate-100 relative group">
                    {/* Map Placeholder with Rich Styling */}
                    <div className="absolute inset-0 grayscale-[0.3] contrast-[1.1] opacity-40 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 via-transparent to-primary/5" />

                    {/* Real Iframe Content (Placeholder logic) */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {/* Interactive Nodes Representation */}
                        <div className="relative w-full h-full">
                            {filteredSellers.map(s => (
                                <motion.div
                                    key={s.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute"
                                    style={{
                                        left: `${30 + (s.coords.lng % 40)}%`,
                                        top: `${20 + (s.coords.lat % 50)}%`
                                    }}
                                >
                                    {/* Service Area Circle */}
                                    <div
                                        className={cn(
                                            "rounded-full border-2 transition-all duration-700 flex items-center justify-center relative",
                                            selectedSeller?.id === s.id
                                                ? "bg-primary/20 border-primary/40 shadow-[0_0_50px_rgba(var(--primary),0.3)] animate-pulse"
                                                : mapView === 'density'
                                                    ? s.activeOrders > 20 ? "bg-rose-500/20 border-rose-500/40" : "bg-emerald-500/20 border-emerald-500/40"
                                                    : "bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10"
                                        )}
                                        style={{
                                            width: `${s.serviceRadius * 25}px`,
                                            height: `${s.serviceRadius * 25}px`
                                        }}
                                    >
                                        {/* Store Marker */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setSelectedSeller(s); }}
                                            className={cn(
                                                "h-8 w-8 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl transition-all hover:scale-125 hover:-translate-y-1 relative z-10",
                                                selectedSeller?.id === s.id ? "bg-primary text-white scale-125" : "bg-white text-slate-900"
                                            )}
                                        >
                                            <HiOutlineBuildingOffice2 className="h-4 w-4" />
                                            {/* Order Count Label */}
                                            {s.activeOrders > 15 && (
                                                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold border-2 border-white ring-2 ring-rose-500/20">
                                                    !
                                                </span>
                                            )}
                                        </div>

                                        {/* Radial Wave Effect for Highly Active Stores */}
                                        {s.activeOrders > 20 && (
                                            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-20" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Floating Info Overlay (Bottom Right) */}
                    <AnimatePresence>
                        {selectedSeller && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, x: -20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, y: -20, x: -20 }}
                                className="absolute top-4 left-8 w-80 z-20"
                            >
                                <Card className="border-none shadow-[0_32px_64px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/50 p-6 rounded-xl bg-white/95 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <button onClick={() => setSelectedSeller(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                            <HiOutlineXMark className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <HiOutlineBuildingOffice2 className="h-7 w-7" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="admin-h4 truncate tracking-tight">{selectedSeller.shopName}</h4>
                                            <p className="ds-label text-primary mt-0.5">{selectedSeller.category}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-3 rounded-2xl">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Radius</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedSeller.serviceRadius} Kilometers</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-2xl">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Live Orders</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedSeller.activeOrders} Deliveries</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-1">
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2",
                                                selectedSeller.performance === 'Peak' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                                                {selectedSeller.performance} Performance
                                            </div>
                                            <button
                                                onClick={() => setIsIntelOpen(true)}
                                                className="flex-1 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                                            >
                                                VIEW NODE INTEL
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Node Intel Modal */}
                    <AnimatePresence>
                        {isIntelOpen && selectedSeller && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl"
                                    onClick={() => setIsIntelOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    className="w-full max-w-lg relative z-[210] bg-white rounded-2xl p-5 shadow-2xl"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                            <HiOutlineBuildingOffice2 className="h-10 w-10" />
                                        </div>
                                        <h3 className="ds-h2">{selectedSeller.shopName}</h3>
                                        <p className="ds-description">Delivery & Performance Report</p>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Coverage Health</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-lg font-bold text-slate-900">Optimal</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Peak Load</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <HiOutlineArrowPath className="h-4 w-4 text-primary animate-spin-slow" />
                                                    <span className="text-lg font-bold text-slate-900">{selectedSeller.activeOrders * 3}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-900 rounded-xl text-left space-y-4">
                                            <div className="flex justify-between items-center text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                                <span>Real-time Alerts</span>
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            </div>
                                            <p className="text-xs text-white font-medium leading-relaxed">
                                                Node is currently handling {selectedSeller.activeOrders} deliveries within the {selectedSeller.serviceRadius}km radius. Service quality is rated as <b>{selectedSeller.performance}</b>.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setIsIntelOpen(false)}
                                            className="w-full py-4 bg-slate-100 font-bold text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                                        >
                                            CLOSE REPORT
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Map Legend (Top Right) */}
                    <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                        <div className="bg-white/90 backdrop-blur px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight tracking-widest">Global Sync Active</span>
                        </div>
                    </div>

                    {/* Map Tips (Bottom Left) */}
                    <div className="absolute bottom-6 left-6 z-10">
                        <div className="bg-slate-900/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 border border-white/10 group cursor-help transition-all hover:bg-slate-900/20">
                            <HiOutlineInformationCircle className="h-4 w-4 text-slate-600" />
                            <p className="text-[10px] font-bold text-slate-700 tracking-tight leading-none">
                                Circles represent the exact delivery range for each partner store.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SellerLocations;
