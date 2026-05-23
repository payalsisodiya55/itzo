import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { FoodUser } from '../src/core/users/user.model.js';
import { FoodUserContact } from '../src/modules/food/user/models/userContact.model.js';
import {
    importUserContacts,
    updatePermissionStatus,
    getCustomerContactsForAdmin
} from '../src/modules/food/user/services/userContact.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

async function run() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB URI:", uri.replace(/:([^@]+)@/, ':****@'));
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    // 1. Setup Test User
    let testUser = await FoodUser.findOne({ phone: "9999900000" });
    if (!testUser) {
        testUser = await FoodUser.create({
            phone: "9999900000",
            name: "Integration Test User",
            isVerified: true
        });
    }

    const userId = testUser._id;

    const resetUser = async () => {
        await FoodUser.findByIdAndUpdate(userId, {
            $set: {
                isContactSynced: false,
                contactPermissionStatus: "PENDING"
            }
        });
        await FoodUserContact.deleteMany({ userId });
    };

    console.log("\n=== RESETTING DATABASE FOR INTEGRATION TESTS ===");
    await resetUser();
    console.log("Database reset complete.");

    // TEST CASE 1: Chunk Upload Failure / Midway Fail
    console.log("\n--- Test Case 1: Chunk 1 Sync (isLastChunk = false) ---");
    const chunk1 = [
        { name: "John Dad", phone: "98765-43210" },
        { name: "Sister", phone: "09123456789" }
    ];
    const res1 = await importUserContacts(userId, chunk1, false);
    assert(res1.count === 2, "Should parse and queue 2 valid normalized contacts");

    const user1 = await FoodUser.findById(userId).lean();
    assert(user1.isContactSynced === false, "User isContactSynced must remain false");
    assert(user1.contactPermissionStatus === "PENDING", "User contactPermissionStatus must remain PENDING");

    const contactsInDb1 = await FoodUserContact.find({ userId }).lean();
    assert(contactsInDb1.length === 2, "Should write exactly 2 contact documents");
    assert(contactsInDb1.some(c => c.contactName === "John Dad" && c.normalizedNumber === "+919876543210"), "John Dad normalized correctly to +919876543210");
    assert(contactsInDb1.some(c => c.contactName === "Sister" && c.normalizedNumber === "+919123456789"), "Sister normalized correctly to +919123456789");

    // TEST CASE 2: Resume / Duplicate retry (Idempotence)
    console.log("\n--- Test Case 2: Retry same chunk (Idempotency check) ---");
    const res2 = await importUserContacts(userId, chunk1, false);
    assert(res2.count === 2, "Should report 2 processed items");
    
    const contactsInDb2 = await FoodUserContact.find({ userId }).lean();
    assert(contactsInDb2.length === 2, "Database count remains 2 (no duplicate entries created)");

    // TEST CASE 3: Complete sync upload (Last chunk)
    console.log("\n--- Test Case 3: Final Chunk (isLastChunk = true) ---");
    const chunk2 = [
        { name: "Boss Office", phone: "+91 99988 77766" },
        { name: "Sister", phone: "9123456789" } // Duplicate number in a new chunk (should update name if changed)
    ];
    const res3 = await importUserContacts(userId, chunk2, true);
    assert(res3.count === 2, "Processed 2 items");

    const user3 = await FoodUser.findById(userId).lean();
    assert(user3.isContactSynced === true, "User isContactSynced set to true upon last chunk completion");
    assert(user3.contactPermissionStatus === "ALLOWED", "User contactPermissionStatus updated to ALLOWED");

    const contactsInDb3 = await FoodUserContact.find({ userId }).lean();
    assert(contactsInDb3.length === 3, "Database holds exactly 3 unique contact records");

    // TEST CASE 4: Permission status transitions (DENIED & SKIPPED)
    console.log("\n--- Test Case 4: Manual status transitions ---");
    await updatePermissionStatus(userId, "DENIED");
    const user4a = await FoodUser.findById(userId).lean();
    assert(user4a.contactPermissionStatus === "DENIED", "Successfully patched status to DENIED");

    await updatePermissionStatus(userId, "SKIPPED");
    const user4b = await FoodUser.findById(userId).lean();
    assert(user4b.contactPermissionStatus === "SKIPPED", "Successfully patched status to SKIPPED");

    // TEST CASE 5: Admin fetch query pagination
    console.log("\n--- Test Case 5: Admin pagination queries ---");
    const paginated1 = await getCustomerContactsForAdmin(userId, { page: 1, limit: 2 });
    assert(paginated1.contacts.length === 2, "Admin page 1 limit 2 returns 2 contacts");
    assert(paginated1.total === 3, "Admin total count reports 3");
    assert(paginated1.page === 1, "Page is 1");
    assert(paginated1.limit === 2, "Limit is 2");

    const paginated2 = await getCustomerContactsForAdmin(userId, { page: 2, limit: 2 });
    assert(paginated2.contacts.length === 1, "Admin page 2 limit 2 returns the remaining 1 contact");
    assert(paginated2.total === 3, "Admin total count still reports 3");

    // 6. Cleanup mock test user data
    console.log("\n=== CLEANING UP INTEGRATION TEST DATA ===");
    await FoodUserContact.deleteMany({ userId });
    await FoodUser.deleteOne({ _id: userId });
    console.log("Cleanup complete.");

    await mongoose.disconnect();
    console.log("\nDisconnected from database. Integration tests finished!");

    console.log(`\n=== TESTS SUMMARY ===`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

run().catch(err => {
    console.error("Error during script execution:", err);
    mongoose.disconnect();
    process.exit(1);
});
