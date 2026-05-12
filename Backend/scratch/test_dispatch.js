import 'dotenv/config';
import mongoose from 'mongoose';
import { FoodOrder } from '../src/modules/food/orders/models/order.model.js';
import { Seller } from '../src/modules/quick-commerce/seller/models/seller.model.js';
import { triggerQuickOrderDispatch, listNearbyOnlineDeliveryPartnersByCoords } from '../src/modules/quick-commerce/services/quickOrder.service.js';
import { logger } from '../src/utils/logger.js';

async function runTest() {
  try {
    console.log('--- Quick Commerce Dispatch Test ---');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orderMongoId = '69fafdcffcd17bb2d4085890';
    const order = await FoodOrder.findById(orderMongoId).lean();
    
    if (!order) {
      console.error('❌ Test order not found. Please update orderMongoId in the script.');
      process.exit(1);
    }
    console.log(`✅ Found Order: ${order.orderId} (Status: ${order.orderStatus})`);

    // Mock sellerId - we need a real seller ID linked to QC orders. 
    // Usually found in order.items[0].sourceId
    const sellerId = order.items?.[0]?.sourceId || order.restaurantId;
    console.log(`🔍 Checking Seller ID: ${sellerId}`);

    const seller = await Seller.findById(sellerId).lean();
    if (!seller) {
       // Try to find ANY seller if this one fails
       const anySeller = await Seller.findOne().lean();
       console.log('⚠️ Original seller not found, using fallback seller:', anySeller?._id);
       // We'll proceed with anySeller for distance testing
    }

    // Test Coordinate Extraction
    const { getOrderAddressPoint, getSellerLocation } = await import('../src/modules/quick-commerce/services/quickOrder.service.js');
    const origin = getOrderAddressPoint(order);
    console.log('📍 Extracted Origin (Order Location):', origin);

    if (!origin) {
      console.error('❌ Failed to extract coordinates from order.');
    } else {
      console.log('📡 Searching for nearby partners within 15km...');
      const partners = await listNearbyOnlineDeliveryPartnersByCoords(origin, { maxKm: 15 });
      console.log(`👥 Found ${partners.length} online partners nearby.`);
      
      partners.forEach((p, i) => {
        console.log(`   ${i+1}. Partner: ${p.name || p.partnerId} | Distance: ${p.distanceKm?.toFixed(2)} km | Status: ${p.status}`);
      });

      if (partners.length === 0) {
        console.log('⚠️ No online partners found in range. Check if any riders are ONLINE in the DB.');
      } else {
        console.log('🚀 Triggering actual dispatch (Socket/FCM)...');
        // Note: This will attempt to emit sockets. If io is not initialized, it will log a warning but continue.
        await triggerQuickOrderDispatch(orderMongoId, sellerId || anySeller?._id);
        console.log('✅ Dispatch trigger execution complete. Check server logs for [QuickDispatch] output.');
      }
    }

    await mongoose.disconnect();
    console.log('--- Test Finished ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
