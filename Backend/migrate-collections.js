/**
 * Migration Script: Copy ALL data from old collections to new ones, then DROP old collections.
 * Only affects food_* collections.
 * 
 * Usage: node migrate-collections.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const MIGRATIONS = [
    { old: 'food_herobanners',              new: 'food_hero_banners' },
    { old: 'food_under250banners',          new: 'food_under250_banners' },
    { old: 'food_diningbanners',            new: 'food_dining_banners' },
    { old: 'food_gourmetrestaurants',       new: 'food_gourmet_restaurants' },
    { old: 'food_exploreicons',             new: 'food_explore_icons' },
    { old: 'food_userwallets',              new: 'food_user_wallets' },
    { old: 'food_supporttickets',           new: 'food_support_tickets' },
    { old: 'food_restaurantwallets',        new: 'food_restaurant_wallets' },
    { old: 'food_restaurantmenus',          new: 'food_restaurant_menus' },
    { old: 'food_restaurantwithdrawals',    new: 'food_restaurant_withdrawals' },
    { old: 'food_restaurantsupporttickets', new: 'food_restaurant_support_tickets' },
    { old: 'food_diningrestaurants',        new: 'food_dining_restaurants' },
    { old: 'food_deliverypartners',         new: 'food_delivery_partners' },
    { old: 'food_deliverywallets',          new: 'food_delivery_wallets' },
    { old: 'food_deliverycashdeposits',     new: 'food_delivery_cash_deposits' },
    { old: 'food_deliverywithdrawals',      new: 'food_delivery_withdrawals' },
    { old: 'food_deliverysupporttickets',   new: 'food_delivery_support_tickets' },
    { old: 'food_adminwallets',             new: 'food_admin_wallets' },
    { old: 'food_earningaddons',            new: 'food_earning_addons' },
    { old: 'food_earningaddonhistories',    new: 'food_earning_addon_history' },
    { old: 'food_deliverycashlimits',       new: 'food_delivery_cash_limits' },
    { old: 'food_deliverycommissionrules',  new: 'food_delivery_commission_rules' },
    { old: 'food_deliverybonus_transactions', new: 'food_delivery_bonus_transactions' },
    { old: 'food_deliveryemergencyhelps',   new: 'food_delivery_emergency_help' },
    { old: 'food_feedbackexperiences',      new: 'food_feedback_experiences' },
    { old: 'food_offerusages',              new: 'food_offer_usages' },
    { old: 'food_pagecontents',             new: 'food_page_contents' },
    { old: 'food_referrallogs',             new: 'food_referral_logs' },
    { old: 'food_safetyemergencyreports',   new: 'food_safety_emergency_reports' },
    { old: 'food_restaurantcommissions',    new: 'food_restaurant_commissions' },
];

async function migrate() {
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    console.log(`📦 Found ${existingCollections.length} collections in database.\n`);

    let totalCopied = 0;
    let totalDropped = 0;

    for (const { old: oldName, new: newName } of MIGRATIONS) {
        // Check if old collection exists
        if (!existingCollections.includes(oldName)) {
            console.log(`⏭️  "${oldName}" does not exist — skip.`);
            continue;
        }

        const oldCol = db.collection(oldName);
        const newCol = db.collection(newName);

        const oldDocs = await oldCol.find({}).toArray();
        const oldCount = oldDocs.length;

        if (oldCount > 0) {
            // Get existing _ids in new collection to avoid duplicates
            const existingIds = new Set(
                (await newCol.find({}, { projection: { _id: 1 } }).toArray())
                    .map(d => d._id.toString())
            );

            const docsToInsert = oldDocs.filter(d => !existingIds.has(d._id.toString()));

            if (docsToInsert.length > 0) {
                await newCol.insertMany(docsToInsert);
                console.log(`✅ COPIED: "${oldName}" → "${newName}": ${docsToInsert.length} docs copied.`);
                totalCopied += docsToInsert.length;
            } else {
                console.log(`✅ "${oldName}" → "${newName}": All ${oldCount} docs already in new collection.`);
            }
        } else {
            console.log(`📭 "${oldName}" is empty (0 docs).`);
        }

        // Verify new collection has all the data before dropping
        const newCount = await newCol.countDocuments();
        if (newCount >= oldCount) {
            await oldCol.drop();
            console.log(`🗑️  DROPPED: "${oldName}" (had ${oldCount} docs, new has ${newCount} docs).`);
            totalDropped++;
        } else {
            console.log(`⚠️  NOT dropping "${oldName}" — new collection count (${newCount}) < old (${oldCount}).`);
        }
    }

    console.log(`\n🎉 Done! Copied: ${totalCopied} docs | Dropped: ${totalDropped} old collections.`);

    await client.close();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
