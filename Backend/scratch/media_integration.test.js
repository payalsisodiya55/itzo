import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SharedMedia } from '../src/modules/media/models/sharedMedia.model.js';
import { saveToSharedMedia, getSharedMedia } from '../src/modules/media/services/media.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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
    if (!uri) {
        console.error('MONGODB_URI not found in env');
        process.exit(1);
    }
    console.log("Connecting to database...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const testRestaurantId = new mongoose.Types.ObjectId();

    console.log("\n=== RESETTING TEST SHARED MEDIA RECORDS ===");
    await SharedMedia.deleteMany({ restaurantId: testRestaurantId });
    console.log("Database reset complete.");

    // Case 1: Initial upload / save to shared media
    console.log("\n--- Case 1: Save unique image for food item ---");
    const item1 = await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_original.jpg",
        name: "Tandoori Pizza",
        category: "Pizza",
        restaurantId: testRestaurantId
    });

    assert(item1 !== null, "Should return saved shared media document");
    assert(item1.normalizedName === "pizza", "Should normalize food name 'Tandoori Pizza' to 'pizza'");
    assert(item1.reuseCount === 1, "Initial save should set reuseCount to 1");

    // Case 2: Duplicate protection & reuseCount increment
    console.log("\n--- Case 2: Save duplicate image (Duplicate Protection) ---");
    const item2 = await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_original.jpg",
        name: "Tandoori Pizza",
        category: "Pizza",
        restaurantId: testRestaurantId
    });

    assert(item2 !== null, "Should return document");
    assert(item2._id.toString() === item1._id.toString(), "Should return the same document ID");
    
    // Retrieve from DB to verify reuseCount updated in DB
    const dbItem2 = await SharedMedia.findById(item1._id);
    assert(dbItem2.reuseCount === 2, `Should increment reuseCount of original document. Expected 2, got: ${dbItem2.reuseCount}`);

    const countAfterDup = await SharedMedia.countDocuments({ restaurantId: testRestaurantId, normalizedName: "pizza" });
    assert(countAfterDup === 1, `Should not insert a new document. Total count expected 1, got: ${countAfterDup}`);

    // Case 3: Sliding window per-food limit (Max 5 recent images per restaurant per normalized food type)
    console.log("\n--- Case 3: Enforcing Max 5 Limit per Restaurant / Food Type ---");
    // We already have 1 image ("pizza_original.jpg"). Let's add 5 more distinct images for "pizza"
    for (let i = 1; i <= 5; i++) {
        await saveToSharedMedia({
            url: `https://res.cloudinary.com/demo/image/upload/v1/pizza_new_${i}.jpg`,
            name: `Pizza Variant ${i}`,
            category: "Pizza",
            restaurantId: testRestaurantId
        });
        // Introduce small delay to ensure distinct createdAt timestamps
        await new Promise(r => setTimeout(r, 100));
    }

    const countAfterLimit = await SharedMedia.countDocuments({ restaurantId: testRestaurantId, normalizedName: "pizza" });
    assert(countAfterLimit === 5, `Total images should be capped at 5. Got: ${countAfterLimit}`);

    // Verify the oldest one ("pizza_original.jpg") was deleted
    const oldestInDb = await SharedMedia.findOne({
        restaurantId: testRestaurantId,
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_original.jpg"
    });
    assert(oldestInDb === null, "Oldest image should be deleted to respect sliding window of 5");

    // Case 4: Suggestion Quality and Priority Sorting
    console.log("\n--- Case 4: Suggestion Quality and Prioritization ---");
    // Seed some other items to test keyword match vs category match
    // 1. Exact keyword match
    await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/cheesy_fries.jpg",
        name: "Super Cheesy Fries",
        category: "Sides",
        restaurantId: testRestaurantId
    });
    // 2. Normalized name match
    await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/french_fries.jpg",
        name: "French Fries",
        category: "Sides",
        restaurantId: testRestaurantId
    });

    const searchResults = await getSharedMedia(testRestaurantId, { search: "cheesy fries" });
    assert(searchResults.items.length > 0, "Should return results matching search query");
    
    // First result should be exact keyword match ("Super Cheesy Fries")
    assert(searchResults.items[0].keywords.includes("cheesy fries"), `First result should be keyword match. Got name: ${searchResults.items[0].normalizedName}`);
    
    // Case 5: Silence check & validation bounds
    console.log("\n--- Case 5: Silence check & Empty queries ---");
    const emptyResult = await getSharedMedia(testRestaurantId, { search: "" });
    assert(emptyResult.items.length === 0, "Empty search should return empty items array");

    // Cleanup
    console.log("\n=== CLEANING UP INTEGRATION TEST DATA ===");
    await SharedMedia.deleteMany({ restaurantId: testRestaurantId });
    console.log("Cleanup complete.");

    await mongoose.disconnect();
    console.log("\nDisconnected. All integration test checks completed!");
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);

    if (failed > 0) process.exit(1);
    process.exit(0);
}

run().catch(err => {
    console.error("Test failure:", err);
    mongoose.disconnect();
    process.exit(1);
});
