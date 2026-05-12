import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, IndianRupee, ArrowRight,
  ShieldCheck, AlertTriangle, HelpCircle,
  Receipt, FileText, LayoutGrid, X, ChevronRight,
  Sparkles, Loader2, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import { formatCurrency } from '@food/utils/currency';
import { initRazorpayPayment } from "@food/utils/razorpay";
import { getCompanyNameAsync } from "@common/utils/businessSettings";

/**
 * PocketV2 - 1:1 Match with Old PocketPage UI.
 * Background: #f6e9dc
 * Font: Poppins
 */
export const PocketV2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [walletState, setWalletState] = useState({
    totalBalance: 0,
    cashInHand: 0,
    availableCashLimit: 0,
    totalCashLimit: 0,
    weeklyEarnings: 0,
    weeklyOrders: 0,
    payoutAmount: 0,
    payoutPeriod: 'Current Week',
    totalBonus: 0,
    bankDetailsFilled: false
  });

  const [activeOffer, setActiveOffer] = useState({
    targetAmount: 0,
    targetOrders: 0,
    currentOrders: 0,
    currentEarnings: 0,
    validTill: '',
    isLive: false
  });

  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, earningsRes, walletRes] = await Promise.all([
          deliveryAPI.getProfile(),
          deliveryAPI.getEarnings({ period: 'week' }),
          deliveryAPI.getWallet()
        ]);

        const profile = profileRes?.data?.data?.profile || {};
        const summary = earningsRes?.data?.data?.summary || {};
        const wallet = walletRes?.data?.data?.wallet || {};
        const activeAddonsRes = await deliveryAPI.getActiveEarningAddons().catch(() => null);
        const activeOfferPayload =
          activeAddonsRes?.data?.data?.activeOffer ||
          activeAddonsRes?.data?.activeOffer ||
          null;
        
        const bankDetails = profile?.documents?.bankDetails;
        const isFilled = !!(bankDetails?.accountNumber);

        setWalletState({
          totalBalance: Number(wallet.pocketBalance) || 0,
          cashInHand: Number(wallet.cashInHand) || 0,
          availableCashLimit: Number(wallet.availableCashLimit) || 0,
          totalCashLimit: Number(wallet.totalCashLimit) || 0,
          weeklyEarnings: Number(summary.totalEarnings) || 0,
          weeklyOrders: Number(summary.totalOrders) || 0,
          payoutAmount: Number(wallet.lastPayout?.amount || wallet.totalWithdrawn || 0),
          payoutPeriod: wallet.lastPayout ? new Date(wallet.lastPayout.date).toLocaleDateString() : 'No recent payout',
          totalBonus: Number(wallet.totalBonus) || 0,
          bankDetailsFilled: isFilled
        });

        setActiveOffer({
           targetAmount: Number(activeOfferPayload?.targetAmount) || 0,
           targetOrders: Number(activeOfferPayload?.targetOrders) || 0,
           currentOrders: Number(activeOfferPayload?.currentOrders) || 0,
           currentEarnings: Number(activeOfferPayload?.currentEarnings) || 0,
           validTill: activeOfferPayload?.validTill || '',
           isLive: Boolean(activeOfferPayload)
        });

      } catch (err) {
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amt) || amt < 1) {
      toast.error("Enter a valid amount (minimum ₹1)");
      return;
    }
    
    if (amt > walletState.cashInHand) {
       toast.error(`Deposit amount cannot exceed cash in hand (₹${walletState.cashInHand})`);
       return;
    }

    try {
      setDepositing(true);
      const orderRes = await deliveryAPI.createDepositOrder(amt);
      const data = orderRes?.data?.data;
      const rp = data?.razorpay;
      
      if (!rp?.orderId) {
        toast.error("Payment initialization failed");
        setDepositing(false);
        return;
      }

      const profileRes = await deliveryAPI.getProfile();
      const profile = profileRes?.data?.data?.profile || {};
      const companyName = await getCompanyNameAsync();

      await initRazorpayPayment({
        key: rp.key,
        amount: rp.amount,
        currency: rp.currency || "INR",
        order_id: rp.orderId,
        name: companyName,
        description: `Cash limit deposit - ₹${amt}`,
        prefill: { 
           name: profile.name, 
           email: profile.email, 
           contact: profile.phone 
        },
        handler: async (res) => {
          try {
            const verifyRes = await deliveryAPI.verifyDepositPayment({
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              amount: amt
            });
            if (verifyRes?.data?.success) {
              toast.success("Deposit successful");
              setShowDepositPopup(false);
              setDepositAmount("");
              // Refresh data
              window.location.reload();
            }
          } catch (err) {
            toast.error("Verification failed");
          } finally {
            setDepositing(false);
          }
        },
        onError: () => setDepositing(false),
        onClose: () => setDepositing(false)
      });
    } catch (err) {
      setDepositing(false);
      toast.error("Deposit failed to start");
    }
  };

  const ordersProgress = activeOffer.targetOrders > 0 ? Math.min(activeOffer.currentOrders / activeOffer.targetOrders, 1) : 0;
  const earningsProgress = activeOffer.targetAmount > 0 ? Math.min(activeOffer.currentEarnings / activeOffer.targetAmount, 1) : 0;
  const hasActiveOffer = activeOffer.isLive && (activeOffer.targetAmount > 0 || activeOffer.targetOrders > 0);

  const formatOfferValidTill = (validTill) => {
    if (!validTill) return '';
    const parsed = new Date(validTill);
    if (Number.isNaN(parsed.getTime())) return String(validTill);
    return parsed.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const formatDate = (d) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f6e9dc] flex flex-col items-center justify-center font-poppins">
       <div className="w-10 h-10 border-4 border-[#ff8100] border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-xs font-semibold text-gray-500">Loading Pocket...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6e9dc] pb-32 font-poppins">
       
       {/* 0. Header */}
       <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-[100] safe-top">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff8100] border border-orange-100">
                <Wallet className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-xl font-black text-gray-950 uppercase tracking-tighter">Pocket History</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Earnings & Wallet Hub</p>
             </div>
          </div>
       </div>
       {/* 1. BANK DETAILS BANNER */}
       {!walletState.bankDetailsFilled && (
         <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3 border-b border-yellow-500/20">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg">
               <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-bold text-black mb-0.5">Submit bank details</h3>
               <p className="text-xs text-black/80 font-medium">PAN & bank details required for payouts</p>
            </div>
            <button 
              onClick={() => navigate('/food/delivery/profile/details')}
              className="bg-yellow-300 text-black px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm"
            >
               Submit
            </button>
         </div>
       )}

       <div className="px-4 py-6 bg-gray-100">
          
          {/* 2. WEEKLY EARNINGS CARD */}
          <div 
            onClick={() => navigate('/food/delivery/pocket/details')}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center mb-5 transition-all active:scale-[0.98]"
          >
             <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-2">Earnings: {getCurrentWeekRange()}</p>
             <h2 className="text-4xl font-black text-black tracking-tighter">
                ₹{walletState.weeklyEarnings.toFixed(0)}
             </h2>
          </div>

          {/* 3. EARNINGS GUARANTEE - API DRIVEN (NO STATIC VALUES) */}
          {hasActiveOffer && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
             <div className="bg-black p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white leading-none mb-1">Earnings Guarantee</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valid till {formatOfferValidTill(activeOffer.validTill)}</span>
                     {activeOffer.isLive && (
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                       </div>
                     )}
                  </div>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/5">
                   <p className="text-lg font-black text-white leading-none mb-0.5">₹{activeOffer.targetAmount}</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">{activeOffer.targetOrders} orders</p>
                </div>
             </div>

             <div className="p-8 pb-10 flex items-center justify-around gap-8">
                {/* Orders Circle */}
                <div className="flex flex-col items-center">
                   <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                         <motion.circle 
                            cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="8" strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: ordersProgress }} transition={{ duration: 1.5, ease: "easeOut" }}
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-xl font-black text-black leading-none">{activeOffer.currentOrders}</span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">of {activeOffer.targetOrders}</span>
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">Orders Done</p>
                </div>

                {/* Earnings Circle */}
                <div className="flex flex-col items-center">
                   <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                         <motion.circle 
                            cx="50" cy="50" r="45" fill="none" stroke="#ff8100" strokeWidth="8" strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: earningsProgress }} transition={{ duration: 1.5, ease: "easeOut" }}
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                         <span className="text-base font-black text-black leading-none truncate">₹{activeOffer.currentEarnings}</span>
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">Earned Yet</p>
                </div>
             </div>
          </div>
          )}

          {/* 4. POCKET ACTION BUTTONS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
             <button 
                onClick={() => navigate('/food/delivery/pocket/balance')}
                className="w-full p-5 border-b border-gray-50 flex items-center justify-between active:bg-gray-50"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-black border border-gray-100">
                      <Wallet className="w-6 h-6" />
                   </div>
                   <div>
                      <span className="text-sm font-bold text-gray-800 block">Pocket balance</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Withdrawal Hub</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-base font-black text-black">₹{walletState.totalBalance.toFixed(2)}</span>
                   <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
             </button>

             <button 
                onClick={() => navigate('/food/delivery/pocket/cash-limit')}
                className="w-full p-5 border-b border-gray-50 flex items-center justify-between active:bg-gray-50"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-black border border-gray-100">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div>
                      <span className="text-sm font-bold text-gray-800 block">Available cash limit</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Spend Control</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-base font-black text-black">₹{walletState.availableCashLimit.toFixed(2)}</span>
                   <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
             </button>

             <div className="p-5">
                <button 
                   onClick={() => setShowDepositPopup(true)}
                   className="w-full py-4 bg-[#ff8100] hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                   Deposit Cash
                </button>
             </div>
          </div>

          {/* 5. MORE SERVICES - Vertical List */}
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate('/food/delivery/pocket/payout')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50">
                   <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
                      <IndianRupee className="w-5 h-5" />
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Last Payout</p>
                   <p className="text-xl font-black text-black leading-none mb-1">₹{walletState.payoutAmount}</p>
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Prev Week Info</p>
                </div>

                <div onClick={() => navigate('/food/delivery/pocket/limit-settlement')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 flex flex-col justify-between">
                   <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#ff8100] mb-4 border border-orange-100">
                      <Receipt className="w-5 h-5" />
                   </div>
                   <p className="text-sm font-bold text-gray-800 leading-tight">Limit Settlement</p>
                </div>
             </div>

             {/* Referral Bonus Row */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-all" onClick={() => navigate('/food/delivery/pocket/balance')}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 border border-green-100">
                      <Gift className="w-6 h-6" />
                   </div>
                   <div>
                      <span className="text-sm font-bold text-gray-800 block">Referral Bonus</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Earned Rewards</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-green-600">+{formatCurrency(walletState.totalBonus)}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate('/food/delivery/pocket/deductions')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 flex flex-col justify-between">
                   <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4 border border-red-100">
                      <FileText className="w-5 h-5" />
                   </div>
                   <p className="text-sm font-bold text-gray-800 leading-tight">Deduction List</p>
                </div>

                <div onClick={() => navigate('/food/delivery/pocket/details')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 flex flex-col justify-between">
                   <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 border border-purple-100">
                      <LayoutGrid className="w-5 h-5" />
                   </div>
                   <p className="text-sm font-bold text-gray-800 leading-tight">Pocket statement</p>
                </div>
             </div>
          </div>
       </div>

       {/* DEPOSIT MODAL - RESTORED 1:1 */}
       <AnimatePresence>
          {showDepositPopup && (
             <div className="fixed inset-0 z-[1000] flex items-end">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDepositPopup(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <motion.div 
                   drag="y"
                   dragConstraints={{ top: 0, bottom: 0 }}
                   dragElastic={0.1}
                   onDragEnd={(e, info) => {
                      if (info.offset.y > 100) setShowDepositPopup(false);
                   }}
                   initial={{ y: '100%' }} 
                   animate={{ y: 0 }} 
                   exit={{ y: '100%' }} 
                   transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                   className="relative w-full bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl"
                >
                   <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
                   
                   <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-orange-100 text-[#ff8100]">
                         <IndianRupee className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black text-black mb-1">Deposit Cash</h3>
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Settle Hand Dues</p>
                   </div>
                   
                   <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-xs font-bold text-gray-400 uppercase">Cash in your hand</span>
                         <span className="text-base font-black text-black">₹{walletState.cashInHand}</span>
                      </div>
                      <div className="relative">
                         <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input 
                            type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter amount to deposit"
                            className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-xl font-bold focus:border-[#ff8100] focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                         />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-3 text-center uppercase tracking-tight">Minimum deposit ₹1 • Instant limit update</p>
                   </div>
                   
                   <div className="space-y-3">
                      <button 
                         onClick={handleDeposit}
                         disabled={depositing}
                         className="w-full py-5 bg-[#ff8100] text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:shadow-none"
                      >
                         {depositing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                         {depositing ? 'Securely Processing...' : 'Proceed to Pay'}
                      </button>
                      <button onClick={() => setShowDepositPopup(false)} className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest">Maybe Later</button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

       {/* Icon Helper for Navigation Drawer */}
       <div className="hidden">
          <ChevronRight />
       </div>
    </div>
  );
};

export default PocketV2;
