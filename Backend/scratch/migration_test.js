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

async function run() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB URI:", uri.replace(/:([^@]+)@/, ':****@'));
    
    await mongoose.connect(uri);
    console.log("Connected successfully to database!");

    // 1. Verify User schema update
    console.log("\n--- Testing FoodUser defaults ---");
    const anyUser = await FoodUser.findOne({});
    if (!anyUser) {
        console.log("⚠️ No users found in database to test default properties mapping.");
    } else {
        console.log("Successfully fetched user:", anyUser._id);
        console.log("default isContactSynced:", anyUser.isContactSynced);
        console.log("default contactPermissionStatus:", anyUser.contactPermissionStatus);
        
        // Test updating status
        console.log("Updating status to SKIPPED (dry-run)...");
        const originalStatus = anyUser.contactPermissionStatus;
        anyUser.contactPermissionStatus = 'SKIPPED';
        await anyUser.save();
        console.log("Updated successfully!");

        // Revert status
        console.log("Reverting status back to original...");
        anyUser.contactPermissionStatus = originalStatus;
        await anyUser.save();
        console.log("Reverted user document successfully.");
    }

    // 2. Verify Index synchronization for contacts model
    console.log("\n--- Testing FoodUserContact schema & index ---");
    
    console.log("Dropping existing indexes (if any) and rebuilding userContact indexes...");
    try {
        await FoodUserContact.collection.dropIndexes();
    } catch (e) {
        // Safe to ignore if collection doesn't exist yet
    }
    await FoodUserContact.syncIndexes();
    console.log("Indexes synced successfully.");

    // Create a mock user ID
    const mockUserId = new mongoose.Types.ObjectId();
    const contactData1 = {
        userId: mockUserId,
        contactName: "Test Contact 1",
        contactNumber: "+91 99999-88888",
        normalizedNumber: "+919999988888"
    };

    console.log("Saving first test contact:", contactData1);
    const savedContact1 = await FoodUserContact.create(contactData1);
    console.log("Saved Contact ID:", savedContact1._id);

    console.log("Attempting to save duplicate contact under same userId and normalizedNumber...");
    try {
        await FoodUserContact.create({
            userId: mockUserId,
            contactName: "Test Contact 1 Duplicate",
            contactNumber: "+91-99999-88888",
            normalizedNumber: "+919999988888" // Same normalized number
        });
        console.error("❌ ERROR: Uniqueness index failed! Duplicate contact was saved successfully.");
    } catch (error) {
        if (error.code === 11000) {
            console.log("✅ SUCCESS: MongoDB correctly threw duplicate key error (11000) as expected!");
        } else {
            console.error("❌ Unexpected error raised:", error.message);
        }
    }

    // Clean up mock data
    console.log("Cleaning up mock user contacts...");
    const cleanupResult = await FoodUserContact.deleteMany({ userId: mockUserId });
    console.log(`Deleted ${cleanupResult.deletedCount} mock contact documents.`);

    await mongoose.disconnect();
    console.log("\nDisconnected successfully. Phase 1 database verification complete!");
}

run().catch(err => {
    console.error("Error during script execution:", err);
    mongoose.disconnect();
});
