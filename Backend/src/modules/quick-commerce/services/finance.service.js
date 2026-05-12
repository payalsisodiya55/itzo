import { QuickOrder } from "../models/order.model.js";
import { SellerOrder } from "../seller/models/sellerOrder.model.js";
import { SellerTransaction } from "../seller/models/sellerTransaction.model.js";
import { FoodDeliveryWallet } from "../../food/delivery/models/deliveryWallet.model.js";
import { FoodDeliveryWithdrawal } from "../../food/delivery/models/foodDeliveryWithdrawal.model.js";
import { FoodDeliveryCashDeposit } from "../../food/delivery/models/foodDeliveryCashDeposit.model.js";
import { FoodDeliveryPartner } from "../../food/delivery/models/deliveryPartner.model.js";
import { FoodOrder } from "../../food/orders/models/order.model.js";
import { getBalance, getTransactionsByEntity } from "../../../core/payments/transaction.service.js";
import { getDeliveryCashLimitSettings } from "../../food/admin/services/admin.service.js";
import { getDeliveryPartnerWalletEnhanced } from "../../food/delivery/services/deliveryFinance.service.js";

const ACTIVE_ORDER_FILTER = {
  orderType: { $in: ["quick", "mixed"] },
  orderStatus: {
    $nin: ["cancelled", "cancelled_by_user", "cancelled_by_restaurant", "cancelled_by_admin"],
  },
};
const DELIVERED_ORDER_FILTER = {
  $or: [
    { orderStatus: "delivered" },
    { workflowStatus: "DELIVERED" },
    { "deliveryState.currentPhase": { $in: ["delivered", "completed"] } },
  ],
};

const num = (value) => Number(value || 0);
const titleStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "processed") return "Settled";
  if (normalized === "rejected" || normalized === "failed") return "Rejected";
  if (normalized === "processing") return "Processing";
  return "Pending";
};

const sellerStatusFilter = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized || normalized === "all") return {};
  if (normalized === "pending") return { status: { $in: ["Pending", "Processing"] } };
  if (normalized === "settled" || normalized === "approved") return { status: "Settled" };
  if (normalized === "rejected" || normalized === "failed") return { status: "Rejected" };
  return { status: normalized.charAt(0).toUpperCase() + normalized.slice(1) };
};

const deliveryStatusFilter = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized || normalized === "all") return {};
  if (normalized === "settled") return { status: "approved" };
  if (normalized === "processing") return { status: "pending" };
  return { status: normalized };
};

export async function getQuickCommerceFinanceSummary() {
  const onlinePaidStatuses = ["paid", "authorized", "captured", "settled"];
  const onlineMethods = ["razorpay", "razorpay_qr", "wallet"];
  const codMethods = ["cash", "cod", "cash_on_delivery"];
  const onlineMethodExpr = {
    $in: [{ $toLower: { $ifNull: ["$payment.method", ""] } }, onlineMethods],
  };
  const onlinePaidStatusExpr = {
    $in: [{ $toLower: { $ifNull: ["$payment.status", ""] } }, onlinePaidStatuses],
  };
  const codMethodExpr = {
    $in: [{ $toLower: { $ifNull: ["$payment.method", ""] } }, codMethods],
  };
  const sellerReceivableExpr = {
    $max: [
      0,
      { $ifNull: ["$pricing.receivable", 0] },
      {
        $subtract: [
          { $ifNull: ["$pricing.subtotal", 0] },
          { $ifNull: ["$pricing.commission", 0] },
        ],
      },
    ],
  };
  const sellerEarningPerOrderExpr = {
    $max: [
      0,
      {
        $subtract: [
          { $ifNull: ["$pricing.subtotal", 0] },
          { $ifNull: ["$pricing.restaurantCommission", 0] },
        ],
      },
    ],
  };
  const deliveryEarningPerOrderExpr = {
    $max: [0, { $ifNull: ["$riderEarning", 0] }],
  };
  const payableAmountExpr = {
    $let: {
      vars: {
        amountDue: { $ifNull: ["$payment.amountDue", 0] },
        payableAmount: { $ifNull: ["$payableAmount", 0] },
        totalAmount: { $ifNull: ["$totalAmount", 0] },
        amount: { $ifNull: ["$amount", 0] },
        total: { $ifNull: ["$total", 0] },
        pricingTotal: { $ifNull: ["$pricing.total", 0] },
        platformFee: { $ifNull: ["$pricing.platformFee", 0] },
      },
      in: {
        $max: [
          0,
          "$$amountDue",
          "$$payableAmount",
          "$$totalAmount",
          "$$amount",
          "$$total",
          {
            $add: [
              "$$pricingTotal",
              {
                $cond: [{ $gt: ["$$platformFee", 0] }, "$$platformFee", 0],
              },
            ],
          },
        ],
      },
    },
  };
  const adminEarningPerOrderExpr = {
    $max: [
      0,
      {
        $subtract: [
          payableAmountExpr,
          {
            $add: [sellerEarningPerOrderExpr, deliveryEarningPerOrderExpr],
          },
        ],
      },
    ],
  };

  const [
    adminWallet,
    onlineAgg,
    codAgg,
    walletFloatAgg,
    sellerReceivableAgg,
    sellerSettledWithdrawalAgg,
    deliveryPendingAgg,
    adminProfitAgg,
  ] = await Promise.all([
    getBalance("admin", "platform"),
    QuickOrder.aggregate([
      {
        $match: {
          ...ACTIVE_ORDER_FILTER,
          ...DELIVERED_ORDER_FILTER,
          $expr: {
            $and: [onlineMethodExpr, onlinePaidStatusExpr],
          },
        },
      },
      {
        $group: { _id: null, total: { $sum: payableAmountExpr } },
      },
    ]),
    QuickOrder.aggregate([
      {
        $match: {
          ...ACTIVE_ORDER_FILTER,
          ...DELIVERED_ORDER_FILTER,
          $expr: codMethodExpr,
        },
      },
      {
        $group: { _id: null, total: { $sum: payableAmountExpr } },
      },
    ]),
    FoodDeliveryWallet.aggregate([
      { $group: { _id: null, float: { $sum: { $ifNull: ["$cashInHand", 0] } } } },
    ]),
    SellerOrder.aggregate([
      {
        $match: {
          orderType: { $in: ["quick", "mixed"] },
          status: "delivered",
        },
      },
      {
        $group: { _id: null, total: { $sum: sellerReceivableExpr } },
      },
    ]),
    SellerTransaction.aggregate([
      {
        $match: {
          type: "Withdrawal",
          status: "Settled",
        },
      },
      {
        $group: { _id: null, total: { $sum: { $abs: { $ifNull: ["$amount", 0] } } } },
      },
    ]),
    FoodDeliveryWithdrawal.aggregate([
      { $match: { status: { $in: ["pending", "processing"] } } },
      {
        $group: { _id: null, total: { $sum: { $abs: { $ifNull: ["$amount", 0] } } } },
      },
    ]),
    QuickOrder.aggregate([
      { $match: { ...ACTIVE_ORDER_FILTER, ...DELIVERED_ORDER_FILTER } },
      {
        $group: { _id: null, total: { $sum: adminEarningPerOrderExpr } },
      },
    ]),
  ]);

  const totalOnline = num(onlineAgg?.[0]?.total);
  const totalCodCollected = num(codAgg?.[0]?.total);
  const walletFloat = num(walletFloatAgg?.[0]?.float);
  const sellerReceivable = num(sellerReceivableAgg?.[0]?.total);
  const sellerSettledWithdrawals = num(sellerSettledWithdrawalAgg?.[0]?.total);

  return {
    totalPlatformEarning: totalOnline + totalCodCollected,
    totalAdminEarning: num(adminProfitAgg?.[0]?.total),
    availableBalance: num(adminWallet?.availableBalance),
    // COD float should represent COD cash collected by riders.
    // Prefer tracked rider wallet cash, but never under-report compared to delivered COD collections.
    systemFloatCOD: Math.max(walletFloat, totalCodCollected),
    // Owed to sellers = delivered net receivable (subtotal - commission) minus settled withdrawals.
    sellerPendingPayouts: Math.max(0, sellerReceivable - sellerSettledWithdrawals),
    deliveryPendingPayouts: num(deliveryPendingAgg?.[0]?.total),
  };
}

export async function getQuickCommerceFinanceLedger({ page = 1, limit = 25 } = {}) {
  const res = await getTransactionsByEntity("admin", "platform", { page, limit });
  const items = (res.transactions || []).map((txn) => ({
    _id: txn._id,
    transactionId: txn._id,
    reference: txn.paymentId || txn.orderId || txn._id,
    type: txn.category || txn.type,
    direction: txn.type === "debit" ? "DEBIT" : "CREDIT",
    amount: num(txn.amount),
    status: String(txn.status || "completed").toUpperCase(),
    description: txn.description || "",
    paymentMode: txn.module || "food",
    actorType: txn.entityType || "SYSTEM",
    createdAt: txn.createdAt,
  }));

  return {
    items,
    total: res.total,
    page: res.page,
    limit: res.limit,
    totalPages: res.totalPages,
  };
}

export async function getQuickCommerceFinancePayouts({
  seller,
  status,
  page = 1,
  limit = 100,
} = {}) {
  const normalizedStatus = String(status || "").toUpperCase();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
  const skip = (safePage - 1) * safeLimit;

  if (seller) {
    const statusFilter = normalizedStatus
      ? normalizedStatus === "PENDING"
        ? { status: { $in: ["Pending", "Processing"] } }
        : { status: normalizedStatus }
      : { status: { $in: ["Pending", "Processing"] } };

    const [items, total] = await Promise.all([
      SellerTransaction.find({ type: "Withdrawal", ...statusFilter })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      SellerTransaction.countDocuments({ type: "Withdrawal", ...statusFilter }),
    ]);

    return {
      items: (items || []).map((t) => ({
        _id: t._id,
        id: t._id,
        ownerType: "SELLER",
        sellerId: t.sellerId,
        amount: Math.abs(num(t.amount)),
        status: t.status,
        reference: t.reference || "",
        orderId: t.orderId || "",
        createdAt: t.createdAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  const deliveryStatusFilter = normalizedStatus
    ? { status: normalizedStatus.toLowerCase() }
    : { status: { $in: ["pending", "processing"] } };

  const [items, total] = await Promise.all([
    FoodDeliveryWithdrawal.find(deliveryStatusFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    FoodDeliveryWithdrawal.countDocuments(deliveryStatusFilter),
  ]);

  return {
    items: (items || []).map((t) => ({
      _id: t._id,
      id: t._id,
      ownerType: "DELIVERY_PARTNER",
      deliveryPartnerId: t.deliveryPartnerId,
      amount: Math.abs(num(t.amount)),
      status: t.status,
      reference: t.reference || "",
      createdAt: t.createdAt,
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getQuickCommerceSellerWithdrawals({
  page = 1,
  limit = 25,
  status,
  search,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const skip = (safePage - 1) * safeLimit;
  const filter = {
    type: "Withdrawal",
    ...sellerStatusFilter(status),
  };

  const term = String(search || "").trim();
  if (term) {
    filter.$or = [
      { reference: { $regex: term, $options: "i" } },
      { orderId: { $regex: term, $options: "i" } },
      { customer: { $regex: term, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    SellerTransaction.find(filter)
      .populate("sellerId", "name shopName phone phoneLast10 email bankInfo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    SellerTransaction.countDocuments(filter),
  ]);

  return {
    items: (items || []).map((item) => {
      const seller = item.sellerId || {};
      return {
        ...item,
        _id: item._id,
        id: item._id,
        ownerType: "SELLER",
        amount: Math.abs(num(item.amount)),
        status: item.status || "Pending",
        paymentMethod: item.paymentMethod || "bank_transfer",
        user: {
          _id: seller._id,
          name: seller.name || "Seller",
          shopName: seller.shopName || seller.name || "Seller",
          phone: seller.phoneLast10 || seller.phone || "",
          email: seller.email || "",
        },
        bankDetails: item.bankDetails || {
          bankName: seller.bankInfo?.bankName || "",
          accountHolderName: seller.bankInfo?.accountHolderName || "",
          accountNumberLast4: String(seller.bankInfo?.accountNumber || "").slice(-4),
          ifscCode: seller.bankInfo?.ifscCode || "",
          upiId: seller.bankInfo?.upiId || "",
        },
        sellerId: seller._id || item.sellerId,
      };
    }),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getQuickCommerceDeliveryWithdrawals({
  page = 1,
  limit = 25,
  status,
  search,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const skip = (safePage - 1) * safeLimit;
  const filter = deliveryStatusFilter(status);

  const term = String(search || "").trim();
  if (term && !Number.isNaN(Number(term))) {
    filter.amount = Number(term);
  }

  const [items, total] = await Promise.all([
    FoodDeliveryWithdrawal.find(filter)
      .populate("deliveryPartnerId", "name phone email profilePartnerId bankName bankAccountHolderName bankAccountNumber bankIfscCode upiId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    FoodDeliveryWithdrawal.countDocuments(filter),
  ]);

  return {
    items: (items || []).map((item) => {
      const partner = item.deliveryPartnerId || {};
      return {
        ...item,
        _id: item._id,
        id: item._id,
        ownerType: "DELIVERY_PARTNER",
        amount: Math.abs(num(item.amount)),
        status: titleStatus(item.status),
        reference: item.transactionId || item.reference || "",
        paymentMethod: item.paymentMethod || "bank_transfer",
        user: {
          _id: partner._id,
          name: partner.name || "Delivery Partner",
          shopName: partner.name || "Delivery Partner",
          phone: partner.phone || "",
          email: partner.email || "",
        },
        bankDetails: {
          bankName: item.bankDetails?.bankName || partner.bankName || "",
          accountHolderName:
            item.bankDetails?.accountHolderName || partner.bankAccountHolderName || "",
          accountNumberLast4: String(
            item.bankDetails?.accountNumber || partner.bankAccountNumber || "",
          ).slice(-4),
          ifscCode: item.bankDetails?.ifscCode || partner.bankIfscCode || "",
          upiId: item.upiId || partner.upiId || "",
        },
        deliveryPartnerId: partner._id || item.deliveryPartnerId,
      };
    }),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getQuickCommerceDeliveryCashBalances({
  page = 1,
  limit = 25,
  search = "",
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const skip = (safePage - 1) * safeLimit;
  const searchTerm = String(search || "").trim();
  const partnerFilter = { status: "approved" };
  if (searchTerm) {
    partnerFilter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const [{ deliveryCashLimit }, partners, total] = await Promise.all([
    getDeliveryCashLimitSettings(),
    FoodDeliveryPartner.find(partnerFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    FoodDeliveryPartner.countDocuments(partnerFilter),
  ]);

  const limitAmount = Math.max(1, Number(deliveryCashLimit || 0) || 5000);
  const items = await Promise.all(
    (partners || []).map(async (partner) => {
      const [wallet, deliveredOrders, pendingOrders, lastSettlement] = await Promise.all([
        getDeliveryPartnerWalletEnhanced(partner._id),
        FoodOrder.countDocuments({
          "dispatch.deliveryPartnerId": partner._id,
          orderStatus: "delivered",
        }),
        FoodOrder.countDocuments({
          "dispatch.deliveryPartnerId": partner._id,
          orderStatus: {
            $nin: [
              "delivered",
              "cancelled",
              "cancelled_by_user",
              "cancelled_by_restaurant",
              "cancelled_by_admin",
            ],
          },
        }),
        FoodDeliveryCashDeposit.findOne({
          deliveryPartnerId: partner._id,
          status: "Completed",
        })
          .sort({ createdAt: -1 })
          .select("createdAt")
          .lean(),
      ]);

      const currentCash = Math.max(0, Number(wallet?.cashInHand || 0));
      const ratio = currentCash / limitAmount;
      const status = ratio >= 1 ? "critical" : ratio >= 0.75 ? "warning" : "safe";

      return {
        id: String(partner._id),
        name: partner.name || "Delivery Partner",
        avatar: partner.profilePhoto || "",
        currentCash,
        limit: limitAmount,
        status,
        lastSettlement: lastSettlement?.createdAt || "Never",
        totalOrders: Number(deliveredOrders || 0),
        pendingOrders: Number(pendingOrders || 0),
      };
    }),
  );

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getQuickCommerceCashSettlementHistory({
  page = 1,
  limit = 25,
  search = "",
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const skip = (safePage - 1) * safeLimit;
  const searchTerm = String(search || "").trim();
  const filter = { status: "Completed" };

  const [rows, total] = await Promise.all([
    FoodDeliveryCashDeposit.find(filter)
      .populate("deliveryPartnerId", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    FoodDeliveryCashDeposit.countDocuments(filter),
  ]);

  const items = (rows || [])
    .filter((row) => {
      if (!searchTerm) return true;
      const riderName = String(row.deliveryPartnerId?.name || "").toLowerCase();
      const rowId = String(row._id || "").toLowerCase();
      const phone = String(row.deliveryPartnerId?.phone || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return riderName.includes(term) || rowId.includes(term) || phone.includes(term);
    })
    .map((row) => ({
      id: String(row._id),
      rider: row.deliveryPartnerId?.name || "Delivery Partner",
      amount: Math.max(0, Number(row.amount || 0)),
      method: row.paymentMethod || "cash",
      date: row.createdAt,
    }));

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getQuickCommerceRiderCashDetails(riderId, { limit = 50 } = {}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const wallet = await getDeliveryPartnerWalletEnhanced(riderId);
  const ledger = Array.isArray(wallet?.transactions) ? wallet.transactions : [];
  return ledger.slice(0, safeLimit).map((item) => ({
    id: item.id,
    reference: item.orderId || item.id,
    amount: Math.abs(num(item.amount)),
    createdAt: item.createdAt || item.date,
    type: item.type,
    status: item.status,
  }));
}

export async function settleQuickCommerceRiderCash({
  riderId,
  amount,
  method = "cash",
  adminId = null,
} = {}) {
  const normalizedRiderId = String(riderId || "").trim();
  const settleAmount = Math.max(0, Number(amount || 0));
  if (!normalizedRiderId) throw new Error("riderId is required");
  if (!settleAmount) throw new Error("Valid amount is required");

  const wallet = await getDeliveryPartnerWalletEnhanced(normalizedRiderId);
  if (settleAmount > Number(wallet?.cashInHand || 0)) {
    throw new Error("Settlement amount exceeds rider cash in hand");
  }

  const created = await FoodDeliveryCashDeposit.create({
    deliveryPartnerId: normalizedRiderId,
    amount: settleAmount,
    paymentMethod: ["cash", "upi", "bank_transfer", "razorpay"].includes(String(method))
      ? String(method)
      : "cash",
    status: "Completed",
    adminId: adminId || undefined,
    adminNote: "Quick-commerce cash settlement",
    razorpayOrderId: `qc_settle_${Date.now()}`,
  });

  return {
    id: created._id,
    riderId: normalizedRiderId,
    amount: settleAmount,
    method: created.paymentMethod,
    status: created.status,
    createdAt: created.createdAt,
  };
}

export async function updateQuickCommerceWithdrawalStatus(
  withdrawalId,
  { status, adminNote = "", rejectionReason = "", transactionId = "" } = {},
) {
  const normalized = String(status || "").trim().toLowerCase();
  const isApprove = ["settled", "approved", "processed"].includes(normalized);
  const isReject = ["rejected", "failed", "denied"].includes(normalized);

  if (!isApprove && !isReject) {
    throw new Error("Status must be Settled or Rejected");
  }

  const sellerWithdrawal = await SellerTransaction.findOne({
    _id: withdrawalId,
    type: "Withdrawal",
  });

  if (sellerWithdrawal) {
    if (!["Pending", "Processing"].includes(String(sellerWithdrawal.status || ""))) {
      throw new Error(`Withdrawal is already ${sellerWithdrawal.status}`);
    }

    sellerWithdrawal.status = isApprove ? "Settled" : "Rejected";
    sellerWithdrawal.adminNote = String(adminNote || "").trim();
    sellerWithdrawal.reason = isReject
      ? String(rejectionReason || adminNote || "Rejected by admin").trim()
      : "";
    sellerWithdrawal.processedAt = new Date();
    if (transactionId) sellerWithdrawal.orderId = String(transactionId).trim();
    await sellerWithdrawal.save();

    return {
      ownerType: "SELLER",
      withdrawal: sellerWithdrawal.toObject(),
    };
  }

  const deliveryWithdrawal = await FoodDeliveryWithdrawal.findById(withdrawalId);
  if (deliveryWithdrawal) {
    if (deliveryWithdrawal.status !== "pending") {
      throw new Error(`Withdrawal is already ${deliveryWithdrawal.status}`);
    }

    deliveryWithdrawal.status = isApprove ? "approved" : "rejected";
    deliveryWithdrawal.adminNote = String(adminNote || "").trim();
    deliveryWithdrawal.rejectionReason = isReject
      ? String(rejectionReason || adminNote || "Rejected by admin").trim()
      : "";
    deliveryWithdrawal.transactionId = String(transactionId || "").trim();
    deliveryWithdrawal.processedAt = new Date();
    await deliveryWithdrawal.save();

    return {
      ownerType: "DELIVERY_PARTNER",
      withdrawal: deliveryWithdrawal.toObject(),
    };
  }

  throw new Error("Withdrawal request not found");
}
