import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"
import BottomNavbar from "@food/components/restaurant/BottomNavbar"
import MenuOverlay from "@food/components/restaurant/MenuOverlay"
import { 
  Wallet, 
  DollarSign, 
  Hand, 
  SlidersHorizontal,
  Home,
  ShoppingBag,
  Store,
  Menu,
  Clock,
  CheckCircle,
  TrendingUp,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Card, CardContent } from "@food/components/ui/card"
import { Input } from "@food/components/ui/input"
import { 
  getWalletState, 
  calculateBalances, 
  createWithdrawRequest,
  setBalanceAdjusted,
  getBalanceAdjusted,
  getTransactionsByType
} from "@food/utils/walletState"
import { formatCurrency } from "@food/utils/currency"

export default function WalletPage() {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState("withdraw")
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [isBalanceAdjusted, setIsBalanceAdjusted] = useState(getBalanceAdjusted())
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Get wallet state and calculate balances
  const [walletState, setWalletState] = useState(() => getWalletState())
  const balances = calculateBalances(walletState)
  
  const paymentMethods = [
    "Bank Transfer",
    "PayPal",
    "Stripe",
    "Credit Card",
    "Debit Card"
  ]
  
  // Get transactions based on active tab and filters
  const getFilteredTransactions = () => {
    let filtered = activeTab === "withdraw" 
      ? getTransactionsByType("withdrawal")
      : getTransactionsByType("payment")
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus)
    }
    
    return filtered
  }
  
  const transactions = getFilteredTransactions()

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Refresh wallet state when it updates
  useEffect(() => {
    const refreshWalletState = () => {
      setWalletState(getWalletState())
    }

    refreshWalletState()

    // Listen for wallet state updates
    window.addEventListener('walletStateUpdated', refreshWalletState)

    return () => {
      window.removeEventListener('walletStateUpdated', refreshWalletState)
    }
  }, [])

  // Close payment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPaymentDropdown && !event.target.closest('.payment-dropdown-container')) {
        setShowPaymentDropdown(false)
      }
      if (showFilterModal && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterModal(false)
      }
    }

    if (showPaymentDropdown || showFilterModal) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showPaymentDropdown, showFilterModal])


  return (
    <div className="min-h-screen bg-[#f6e9dc] overflow-x-hidden">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6 overflow-x-visible">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
          Wallet
        </h1>

        {/* Withdrawal Balance Card - Orange */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#ff8100] rounded-xl p-4 md:p-6 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm md:text-base mb-1">Withdrawal Balance</p>
                <p className="text-white text-2xl md:text-3xl font-bold">{formatCurrency(balances.withdrawalBalance)}</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="bg-white text-[#ff8100] hover:bg-white/90 font-semibold px-4 py-2 md:px-6 md:py-3 rounded-lg"
              onClick={() => {
                setWithdrawAmount(balances.withdrawalBalance.toString())
                setShowWithdrawModal(true)
              }}
            >
              Withdraw
            </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Balance Unadjusted Card - Light Red */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={isBalanceAdjusted ? "bg-[#FE5502]/10 border-2 border-[#FE5502]/20 rounded-xl p-4 md:p-6 mb-4 shadow-md" : "bg-[#ffebee] rounded-xl p-4 md:p-6 mb-4 shadow-md"}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={isBalanceAdjusted ? "bg-[#FE5502]/20 rounded-lg p-3" : "bg-red-200/50 rounded-lg p-3"}>
                <DollarSign className={isBalanceAdjusted ? "w-6 h-6 md:w-8 md:h-8 text-[#FE5502]" : "w-6 h-6 md:w-8 md:h-8 text-red-700"} />
              </div>
              <div>
                <p className="text-gray-800 text-sm md:text-base mb-1 font-medium">{isBalanceAdjusted ? "Balance Adjusted" : "Balance Unadjusted"}</p>
                <p className="text-gray-900 text-2xl md:text-3xl font-bold">{formatCurrency(balances.balanceUnadjusted)}</p>
              </div>
            </div>
            {!isBalanceAdjusted && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline"
              className="bg-[#ffebee] border-red-300 text-red-700 hover:bg-red-100 font-semibold px-4 py-2 md:px-6 md:py-3 rounded-lg"
                  onClick={() => setShowAdjustModal(true)}
            >
              Adjust
            </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Current Balances - Five Cards in Horizontal Scroll */}
        <div className="mb-4 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:scrollbar-default md:overflow-x-visible">
          <div className="flex gap-2 min-w-max md:grid md:grid-cols-5 md:min-w-0 md:gap-4 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex-shrink-0 w-[95px] md:w-auto flex"
            >
              <Card className="bg-white shadow-md border-0 py-0 gap-0 h-full w-full">
                <CardContent className="p-2 relative flex flex-col px-2 h-full justify-between">
                  <div className="absolute right-1 top-1 opacity-10">
                    <Hand className="w-6 h-6 md:w-8 md:h-8 text-[#FE5502]" />
                  </div>
                  <p className="text-gray-600 text-[9px] md:text-xs mb-0.5 leading-tight">Cash in Hand</p>
                  <p className="text-gray-900 text-xs md:text-sm font-bold">{formatCurrency(balances.cashInHand)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex-shrink-0 w-[95px] md:w-auto flex"
            >
              <Card className="bg-white shadow-md border-0 py-0 gap-0 h-full w-full">
                <CardContent className="p-2 relative flex flex-col px-2 h-full justify-between">
                  <div className="absolute right-1 top-1 opacity-10">
                    <Wallet className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                  </div>
                  <p className="text-gray-600 text-[9px] md:text-xs mb-0.5 leading-tight">Withdrawable Balance</p>
                  <p className="text-gray-900 text-xs md:text-sm font-bold">{formatCurrency(balances.withdrawalBalance)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="flex-shrink-0 w-[95px] md:w-auto flex"
            >
              <Card className="bg-white shadow-md border-0 py-0 gap-0 h-full w-full">
                <CardContent className="p-2 relative flex flex-col px-2 h-full justify-between">
                  <div className="absolute right-1 top-1 opacity-10">
                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
                  </div>
                  <p className="text-gray-600 text-[9px] md:text-xs mb-0.5 leading-tight">Pending Withdraw</p>
                  <p className="text-gray-900 text-xs md:text-sm font-bold">{formatCurrency(balances.pendingWithdraw)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="flex-shrink-0 w-[95px] md:w-auto flex"
            >
              <Card className="bg-white shadow-md border-0 py-0 gap-0 h-full w-full">
                <CardContent className="p-2 relative flex flex-col px-2 h-full justify-between">
                  <div className="absolute right-1 top-1 opacity-10">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-[#FE5502]" />
                  </div>
                  <p className="text-gray-600 text-[9px] md:text-xs mb-0.5 leading-tight">Already Withdraw</p>
                  <p className="text-gray-900 text-xs md:text-sm font-bold">{formatCurrency(balances.alreadyWithdraw)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex-shrink-0 w-[95px] md:w-auto flex"
            >
              <Card className="bg-white shadow-md border-0 py-0 gap-0 h-full w-full">
                <CardContent className="p-2 relative flex flex-col px-2 h-full justify-between">
                  <div className="absolute right-1 top-1 opacity-10">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-600 text-[9px] md:text-xs mb-0.5 leading-tight">Total Earning</p>
                  <p className="text-gray-900 text-xs md:text-sm font-bold">{formatCurrency(balances.totalEarning)}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Transaction History Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className=" w-full bg-white rounded-xl p-4 md:p-6 shadow-md"
        >
          <div className="w-100%">
            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b border-gray-200 ">
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`pb-3 px-2 text-sm md:text-base font-medium transition-colors relative ${
                  activeTab === "withdraw"
                    ? "text-[#ff8100]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Withdraw Request
                {activeTab === "withdraw" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff8100]"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                className={`pb-3 px-2 text-sm md:text-base font-medium transition-colors relative ${
                  activeTab === "payment"
                    ? "text-[#ff8100]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Payment History
                {activeTab === "payment" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff8100]"
                  />
                )}
              </button>
            </div>

            {/* Transaction History Header */}
            <div className="flex items-center justify-between mb-4 relative">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Transaction History</h2>
              <div className="relative filter-dropdown-container">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                  onClick={() => setShowFilterModal(!showFilterModal)}
              >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filter
              </Button>
                
                {/* Filter Dropdown */}
                <AnimatePresence>
                  {showFilterModal && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]"
                    >
                      <div className="py-1">
                        {["All", "Pending", "Approved", "Denied"].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              const statusMap = {
                                "All": "all",
                                "Pending": "Pending",
                                "Approved": "Completed",
                                "Denied": "Failed"
                              }
                              setFilterStatus(statusMap[option])
                              setShowFilterModal(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              (option === "All" && filterStatus === "all") ||
                              (option === "Pending" && filterStatus === "Pending") ||
                              (option === "Approved" && filterStatus === "Completed") ||
                              (option === "Denied" && filterStatus === "Failed")
                                ? "text-[#ff8100] font-medium bg-[#ff8100]/5"
                                : "text-gray-700"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold text-base md:text-lg mb-1">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-gray-600 text-sm md:text-base">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs md:text-sm font-medium px-3 py-1 rounded-full mb-2 ${
                      transaction.status === "Pending" 
                        ? "bg-blue-100 text-blue-700"
                        : transaction.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {transaction.status}
                    </span>
                    <p className="text-gray-500 text-xs md:text-sm">
                      {transaction.date}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Withdraw Request Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Withdraw Request
                </h2>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
          </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <p className="text-gray-600 text-sm md:text-base mb-6">
                  Secure and simple way to withdraw your earning
                </p>

                {/* Withdraw Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm md:text-base font-medium text-gray-900 mb-2">
                    Enter Withdraw Amount (?) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full border-gray-300 focus:border-[#ff8100] focus:ring-[#ff8100]"
                    placeholder="0.00"
                  />
                </div>

                {/* Payment Method Dropdown */}
                <div className="mb-6 relative payment-dropdown-container">
                  <label className="block text-sm md:text-base font-medium text-gray-900 mb-2">
                    Select Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
          <button 
                      type="button"
                      onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:border-[#ff8100] focus:ring-1 focus:ring-[#ff8100]"
          >
                      <span className={selectedPaymentMethod ? "text-gray-900" : "text-gray-400"}>
                        {selectedPaymentMethod || "Select payment method"}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showPaymentDropdown ? 'rotate-180' : ''}`} />
          </button>
                    
                    {showPaymentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {paymentMethods.map((method) => (
          <button 
                            key={method}
                            type="button"
                            onClick={() => {
                              setSelectedPaymentMethod(method)
                              setShowPaymentDropdown(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <span className="text-gray-900 text-sm md:text-base">{method}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <div className="px-6 pb-6 pt-4 border-t border-gray-200">
                <Button
                  className="w-full bg-[#ff8100] hover:bg-[#e67300] text-white font-semibold py-3 rounded-lg text-base md:text-lg"
                  onClick={() => {
                    if (withdrawAmount && selectedPaymentMethod) {
                      const amount = parseFloat(withdrawAmount)
                      if (amount > 0 && amount <= balances.withdrawalBalance) {
                        // Create withdraw request
                        createWithdrawRequest(amount, selectedPaymentMethod)
                        setShowWithdrawModal(false)
                        // Reset form
                        setWithdrawAmount("")
                        setSelectedPaymentMethod("")
                        // Refresh wallet state
                        setWalletState(getWalletState())
                      }
                    }
                  }}
                  disabled={!withdrawAmount || !selectedPaymentMethod}
                >
                  Send Request
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Adjustment Modal */}
      <AnimatePresence>
        {showAdjustModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowAdjustModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">
                Cash Adjustment
              </h2>
              <p className="text-gray-600 text-sm md:text-base mb-6 text-center leading-relaxed">
                To adjust your Cash in Hand balance and Withdrawable Amount please click 'OK' to confirm the adjustments
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 font-semibold px-4 py-2 md:px-6 md:py-3 rounded-lg"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#ff8100] hover:bg-[#e67300] text-white font-semibold px-4 py-2 md:px-6 md:py-3 rounded-lg"
                  onClick={() => {
                    setIsBalanceAdjusted(true)
                    setBalanceAdjusted(true)
                    setShowAdjustModal(false)
                  }}
                >
                  Ok
                </Button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar - Mobile Only (Hide when withdraw modal is open) */}
      {!showWithdrawModal && (
        <BottomNavbar onMenuClick={() => setShowMenu(true)} />
      )}
      
      {/* Menu Overlay */}
      <MenuOverlay showMenu={showMenu} setShowMenu={setShowMenu} />
    </div>
  )
}

