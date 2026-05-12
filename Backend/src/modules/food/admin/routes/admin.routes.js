import express from 'express';
import { AuthError } from '../../../../core/auth/errors.js';
import * as adminController from '../controllers/admin.controller.js';
import * as foodApprovalController from '../controllers/foodApproval.controller.js';
import * as addonsApprovalController from '../controllers/addonsApproval.controller.js';

import * as feedbackExperienceController from '../controllers/feedbackExperience.controller.js';
import * as notificationBroadcastController from '../controllers/notificationBroadcast.controller.js';
import * as diningAdminController from '../../dining/controllers/diningAdmin.controller.js';
import * as orderController from '../../orders/controllers/order.controller.js';
import { getAdminPageController, upsertAdminPageController } from '../controllers/pageContent.controller.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();


const requireAdmin = (req, _res, next) => {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        return next(new AuthError('Admin access required'));
    }
    return next();
};

router.use(requireAdmin);

// ----- Broadcast Notifications -----
router.post('/notifications/broadcast', notificationBroadcastController.createBroadcastNotificationController);
router.get('/notifications/broadcast', notificationBroadcastController.getBroadcastNotificationsController);
router.delete('/notifications/broadcast/:id', notificationBroadcastController.deleteBroadcastNotificationController);

// ----- Customers -----
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/status', adminController.updateCustomerStatus);
router.patch('/customers/:id/cod-access', adminController.updateCustomerCodAccess);
router.patch('/customers/cod-access/bulk', adminController.bulkUpdateCustomersCodAccess);

// ----- Safety / Emergency Reports -----
router.get('/safety-emergency-reports', adminController.getSafetyEmergencyReports);
router.put('/safety-emergency-reports/:id/status', adminController.updateSafetyEmergencyStatus);
router.put('/safety-emergency-reports/:id/priority', adminController.updateSafetyEmergencyPriority);
router.delete('/safety-emergency-reports/:id', adminController.deleteSafetyEmergencyReport);

// ----- Support Tickets (users) -----
router.get('/support-tickets', adminController.getSupportTicketsController);
router.patch('/support-tickets/:id', adminController.updateSupportTicketController);
router.get('/global-search', adminController.globalSearch);
router.get('/restaurants/complaints', adminController.getRestaurantComplaints);
router.patch('/restaurants/complaints/:id', adminController.updateRestaurantComplaint);

// ----- Restaurants -----
router.get('/restaurants', adminController.getRestaurants);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/reports/restaurants', adminController.getRestaurantReport);
router.get('/reports/transactions', adminController.getTransactionReport);
router.get('/reports/tax', adminController.getTaxReport);
router.get('/reports/tax/:id', adminController.getTaxReportDetail);
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.get('/restaurants/reviews', adminController.getRestaurantReviews);
router.get('/restaurants/:id', adminController.getRestaurantById);
router.get('/restaurants/:id/analytics', adminController.getRestaurantAnalytics);
router.get('/restaurants/:id/menu', adminController.getRestaurantMenuById);
router.post('/restaurants', adminController.createRestaurant);
router.patch('/restaurants/:id', adminController.updateRestaurantById);
router.patch('/restaurants/:id/status', adminController.updateRestaurantStatus);
router.patch('/restaurants/:id/location', adminController.updateRestaurantLocation);
router.patch('/restaurants/:id/menu', adminController.updateRestaurantMenuById);
router.patch('/restaurants/:id/approve', adminController.approveRestaurant);
router.patch('/restaurants/:id/reject', adminController.rejectRestaurant);

// ----- Restaurant Commission -----
router.get('/restaurant-commissions/bootstrap', adminController.getRestaurantCommissionBootstrap);
router.get('/restaurant-commissions', adminController.getRestaurantCommissions);
router.post('/restaurant-commissions', adminController.createRestaurantCommission);
router.get('/restaurant-commissions/:id', adminController.getRestaurantCommissionById);
router.patch('/restaurant-commissions/:id', adminController.updateRestaurantCommission);
router.delete('/restaurant-commissions/:id', adminController.deleteRestaurantCommission);
router.patch('/restaurant-commissions/:id/toggle', adminController.toggleRestaurantCommissionStatus);

// ----- Categories -----
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.patch('/categories/:id/toggle', adminController.toggleCategoryStatus);
router.patch('/categories/:id/approve', adminController.approveCategory);
router.patch('/categories/:id/reject', adminController.rejectCategory);
router.patch('/categories/:id/make-global', adminController.makeCategoryGlobal);

// ----- Restaurant Add-ons Approval -----
router.get('/addons', addonsApprovalController.getRestaurantAddons);
router.patch('/addons/:id', addonsApprovalController.updateRestaurantAddon);
router.patch('/addons/:id/approve', addonsApprovalController.approveRestaurantAddon);
router.patch('/addons/:id/reject', addonsApprovalController.rejectRestaurantAddon);

// ----- Foods -----
router.get('/foods', adminController.getFoods);
router.post('/foods', adminController.createFood);
router.patch('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);
// Food approval queue (pending items created by restaurants)
router.get('/foods/pending-approvals', foodApprovalController.getPendingFoodApprovals);
router.patch('/foods/:id/approve', foodApprovalController.approveFoodItemController);
router.patch('/foods/:id/reject', foodApprovalController.rejectFoodItemController);

// ----- Offers & Coupons -----
router.get('/offers', adminController.getAllOffers);
router.post('/offers', adminController.createAdminOffer);
router.patch('/offers/:id/cart-visibility', adminController.updateAdminOfferCartVisibility);
router.delete('/offers/:id', adminController.deleteAdminOffer);

// ----- Feedback Experience (Admin) -----
router.get('/feedback-experiences', feedbackExperienceController.getFeedbackExperiences);
router.delete('/feedback-experiences/:id', feedbackExperienceController.deleteFeedbackExperience);

// ----- Fee Settings -----
router.get('/fee-settings', adminController.getFeeSettings);
router.put('/fee-settings', adminController.createOrUpdateFeeSettings);

// ----- Referral Settings -----
router.get('/referral-settings', adminController.getReferralSettings);
router.put('/referral-settings', adminController.createOrUpdateReferralSettings);


// ----- Delivery Cash Limit -----
router.get('/delivery-cash-limit', adminController.getDeliveryCashLimit);
router.patch('/delivery-cash-limit', adminController.updateDeliveryCashLimit);

// ----- Delivery Emergency Help -----
router.get('/delivery-emergency-help', adminController.getEmergencyHelp);
router.put('/delivery-emergency-help', adminController.createOrUpdateEmergencyHelp);

// ----- Withdrawals (admin) -----
router.get('/withdrawals', adminController.getWithdrawals);
router.patch('/withdrawals/:id', adminController.updateWithdrawalStatus);
router.get('/delivery/withdrawals', adminController.getDeliveryWithdrawals);
router.patch('/delivery/withdrawals/:id', adminController.updateDeliveryWithdrawalStatus);
router.get('/delivery/cash-limit-settlements', adminController.getCashLimitSettlements);

// ----- Delivery partners & general -----
router.get('/delivery/join-requests', adminController.getDeliveryJoinRequests);
router.get('/delivery/wallets', adminController.getDeliveryWallets);
router.patch('/delivery/wallets', adminController.updateDeliveryBoyWallet);
router.get('/delivery/bonus-transactions', adminController.getDeliveryPartnerBonusTransactions);
router.get('/delivery/earnings', adminController.getDeliveryEarnings);
router.post('/delivery/bonus', adminController.addDeliveryPartnerBonus);
router.get('/delivery/commission-rules', adminController.getDeliveryCommissionRules);
router.post('/delivery/commission-rules', adminController.createDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id', adminController.updateDeliveryCommissionRule);
router.delete('/delivery/commission-rules/:id', adminController.deleteDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id/status', adminController.toggleDeliveryCommissionRuleStatus);
router.get('/delivery/reviews', adminController.getDeliverymanReviews);
router.get('/contact-messages', adminController.getContactMessages);
router.get('/delivery/earning-addons', adminController.getEarningAddons);
router.post('/delivery/earning-addons', adminController.createEarningAddon);
router.patch('/delivery/earning-addons/:id', adminController.updateEarningAddon);
router.delete('/delivery/earning-addons/:id', adminController.deleteEarningAddon);
router.patch('/delivery/earning-addons/:id/status', adminController.toggleEarningAddonStatus);
router.get('/delivery/earning-addon-history', adminController.getEarningAddonHistory);
router.post('/delivery/earning-addon-history/:id/credit', adminController.creditEarningToWallet);
router.post('/delivery/earning-addon-history/:id/cancel', adminController.cancelEarningAddonHistory);
router.post('/delivery/earning-addon-completions/check', adminController.checkEarningAddonCompletions);
router.get('/delivery/support-tickets/stats', adminController.getSupportTicketStats);
router.get('/delivery/support-tickets', adminController.getSupportTickets);
router.patch('/delivery/support-tickets/:id', adminController.updateSupportTicket);
router.get('/delivery/partners', adminController.getDeliveryPartners);
router.get('/delivery/:id', adminController.getDeliveryPartnerById);
router.patch('/delivery/:id/approve', adminController.approveDeliveryPartner);
router.patch('/delivery/:id/reject', adminController.rejectDeliveryPartner);
router.patch('/delivery/:id/active-status', adminController.updateDeliveryPartnerActiveStatus);

// ----- Zones -----
router.get('/zones', adminController.getZones);
router.get('/zones/:id', adminController.getZoneById);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

// ----- Dining -----
router.get('/dining/categories', diningAdminController.getDiningCategories);
router.post('/dining/categories', diningAdminController.createDiningCategory);
router.patch('/dining/categories/:id', diningAdminController.updateDiningCategory);
router.delete('/dining/categories/:id', diningAdminController.deleteDiningCategory);
router.get('/dining/restaurants', diningAdminController.getDiningRestaurants);
router.patch('/dining/restaurants/:restaurantId', diningAdminController.updateDiningRestaurant);

// ----- Orders -----
router.get('/orders', orderController.listOrdersAdminController);
router.get('/orders/:orderId', orderController.getOrderByIdAdminController);
router.post('/orders/:orderId/refund', adminController.processRefund);
router.delete('/orders/:orderId', orderController.deleteOrderAdminController);

// ----- CMS Pages (About + legal) -----
router.get('/pages-social-media/:key', getAdminPageController);
router.put('/pages-social-media/:key', upsertAdminPageController);

router.get('/sidebar-badges', adminController.getSidebarBadges);
router.get('/notifications/fssai-expired', adminController.getExpiredFssaiNotifications);

export default router;
