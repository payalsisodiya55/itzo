import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertTriangle, Loader2, IndianRupee,
  HelpCircle, ChevronRight
} from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import { formatCurrency } from '@food/utils/currency';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

/**
 * PocketBalanceV2 - 1:1 Match with Old PocketBalance Page.
 * Features: Big Withdraw amount display, Withdraw button, and Detail rows.
 * Background: #f6e9dc
 * Font: Poppins
 */
export const PocketBalanceV2 = () => {
  const navigate = useNavigate();
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(true);
  const [walletState, setWalletState] = useState({
     pocketBalance: 0,
     weeklyEarnings: 0,
     totalBonus: 0,
     totalWithdrawn: 0,
     cashCollected: 0,
     deductions: 0,
     withdrawalLimit: 100,
     withdrawableAmount: 0,
     canWithdraw: false
  });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

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
        
        // Use wallet data from backend instead of non-existent profile.walletBalance
        const pocketBalance = Number(wallet.pocketBalance) || 0;
        const withdrawalLimit = Number(wallet.deliveryWithdrawalLimit) || 100;
        const withdrawableAmount = pocketBalance; // Backend pocketBalance is already the withdrawable amount

        setWalletState({
           pocketBalance: pocketBalance,
           weeklyEarnings: Number(summary.totalEarnings) || 0,
           totalBonus: Number(wallet.totalBonus) || 0,
           totalWithdrawn: Number(wallet.totalWithdrawn) || 0,
           cashCollected: Number(wallet.cashInHand) || 0,
           deductions: 0, // Mocked
           withdrawalLimit,
           withdrawableAmount,
           canWithdraw: withdrawableAmount >= withdrawalLimit
        });
      } catch (err) {
        toast.error('Failed to load pocket details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleWithdraw = async () => {
     // Simplified verification
     const profileRes = await deliveryAPI.getProfile();
     const profile = profileRes?.data?.data?.profile || {};
     const bank = profile?.documents?.bankDetails;
     
     if (!bank?.accountNumber) {
        toast.error("Please add bank details first");
        navigate("/food/delivery/profile/details");
        return;
     }

     setWithdrawSubmitting(true);
     try {
        const res = await deliveryAPI.createWithdrawalRequest({
           amount: walletState.withdrawableAmount,
           paymentMethod: 'bank_transfer'
        });
        if (res?.data?.success) {
           toast.success("Withdrawal request submitted");
           goBack();
        }
     } catch (err) {
        toast.error("Withdrawal failed");
     } finally {
        setWithdrawSubmitting(false);
     }
  };

  const DetailRow = ({ label, value, subLabel }) => (
     <div className="py-4 flex justify-between items-start border-b border-gray-100">
        <div className="flex-1 pr-4">
           <p className="text-sm font-semibold text-gray-800">{label}</p>
           {subLabel && <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{subLabel}</p>}
        </div>
        <p className="text-sm font-bold text-black">{value}</p>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#f6e9dc] font-poppins pb-32">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 px-4 py-4 safe-top flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg">
             <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 leading-none">Pocket balance</h1>
       </div>

       {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
             <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Balance...</p>
          </div>
       ) : (
          <>
             {/* Warning Banner */}
             {!walletState.canWithdraw && (
               <div className="bg-yellow-400 p-4 flex items-start gap-3 border-b border-yellow-500/10">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                     <p className="text-xs font-bold">Withdraw currently disabled</p>
                     <p className="text-[10px] font-medium opacity-80 leading-tight mt-1">
                        {walletState.withdrawableAmount <= 0 ? 'Withdrawable amount is ₹0' : `Minimum withdrawal requirement is ₹${walletState.withdrawalLimit}`}
                     </p>
                  </div>
               </div>
             )}

             {/* Top Withdraw Section */}
             <div className="bg-white p-8 mb-4 text-center border-b border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Withdrawable Amount</p>
                <h2 className="text-5xl font-black text-black mb-6 tracking-tighter">₹{walletState.withdrawableAmount.toFixed(0)}</h2>
                
                <button 
                  onClick={handleWithdraw}
                  disabled={!walletState.canWithdraw || withdrawSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                     walletState.canWithdraw 
                     ? 'bg-black text-white' 
                     : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } flex items-center justify-center gap-2`}
                >
                   {withdrawSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                   {withdrawSubmitting ? 'Processing...' : 'Withdraw'}
                </button>
             </div>

             {/* Details Section */}
             <div className="bg-gray-100/50 py-2 px-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pocket Details</p>
             </div>

             <div className="bg-white px-4">
                <DetailRow label="Earnings" value={formatCurrency(walletState.weeklyEarnings)} />
                <DetailRow label="Bonus" value={formatCurrency(walletState.totalBonus)} />
                <DetailRow label="Amount withdrawn" value={formatCurrency(walletState.totalWithdrawn)} />
                <DetailRow label="Cash collected" value={formatCurrency(walletState.cashCollected)} />
                <DetailRow label="Deductions" value={formatCurrency(walletState.deductions)} />
                <DetailRow label="Pocket balance" value={formatCurrency(walletState.pocketBalance)} />
                <DetailRow 
                   label="Min. withdrawal amount" 
                   value={formatCurrency(walletState.withdrawalLimit)} 
                   subLabel="Withdrawal allowed only when withdrawable amount reaches this limit."
                />
                <DetailRow label="Withdrawable amount" value={formatCurrency(walletState.withdrawableAmount)} />
             </div>
          </>
       )}
    </div>
  );
};
