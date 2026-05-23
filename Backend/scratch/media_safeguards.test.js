import { saveToSharedMedia, getSharedMedia } from '../src/modules/media/services/media.service.js';
import { SharedMedia } from '../src/modules/media/models/sharedMedia.model.js';
import mongoose from 'mongoose';

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

async function runTests() {
    console.log('--- STARTING SAFEGUARDS UNIT TESTS ---');

    const testRestaurantId = '603f752fb5a7e6b014c2b988';

    // Mock countDocuments, findOne, create, deleteOne, find, save
    let mockDb = [];
    let saveCalled = false;
    let deleteCalled = false;

    SharedMedia.findOne = function(filter) {
        if (filter.url) {
            // Duplicate check: return found item or null
            const found = mockDb.find(item => 
                String(item.restaurantId) === String(filter.restaurantId) &&
                item.normalizedName === filter.normalizedName &&
                item.url === filter.url
            );
            if (found) {
                return {
                    ...found,
                    save: async function() {
                        saveCalled = true;
                        found.reuseCount = (found.reuseCount || 1) + 1;
                        return found;
                    }
                };
            }
            return null;
        }
        
        // Return query chain thenable for limit oldest findOne().sort() check
        const chain = {
            sort: function(sortObj) {
                return chain;
            },
            then: function(resolve) {
                const matching = mockDb.filter(item => 
                    String(item.restaurantId) === String(filter.restaurantId) &&
                    item.normalizedName === filter.normalizedName
                );
                matching.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                resolve(matching[0] || null);
            }
        };
        return chain;
    };

    SharedMedia.countDocuments = async function(filter) {
        return mockDb.filter(item => 
            String(item.restaurantId) === String(filter.restaurantId) &&
            item.normalizedName === filter.normalizedName
        ).length;
    };

    SharedMedia.create = async function(doc) {
        const newDoc = {
            _id: 'new_id_' + Math.random(),
            reuseCount: 1,
            createdAt: new Date(),
            ...doc
        };
        mockDb.push(newDoc);
        return newDoc;
    };

    SharedMedia.deleteOne = async function(filter) {
        deleteCalled = true;
        mockDb = mockDb.filter(item => item._id !== filter._id);
        return { deletedCount: 1 };
    };

    // Case 1: Initial upload / save to shared media
    console.log('\nTesting Case 1: Initial save of unique image');
    mockDb = [];
    saveCalled = false;
    const res1 = await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_original.jpg",
        name: "Tandoori Pizza",
        category: "Pizza",
        restaurantId: testRestaurantId
    });
    assert(res1 !== null, "Should return saved document");
    assert(res1.normalizedName === "pizza", "Should normalize food name to 'pizza'");
    assert(mockDb.length === 1, "Should insert record in db");
    assert(res1.reuseCount === 1, "Should set default reuseCount to 1");

    // Case 2: Duplicate Protection (saving duplicate increments reuseCount instead of creating new)
    console.log('\nTesting Case 2: Saving duplicate image (Duplicate Protection)');
    saveCalled = false;
    const res2 = await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_original.jpg",
        name: "Tandoori Pizza",
        category: "Pizza",
        restaurantId: testRestaurantId
    });
    assert(saveCalled === true, "Should trigger save on existing document instead of create");
    assert(mockDb.length === 1, "Should skip new insertion (database count remains 1)");
    assert(mockDb[0].reuseCount === 2, `Should increment reuseCount. Expected 2, got: ${mockDb[0].reuseCount}`);

    // Case 3: Per-food Image Limit (Max 5 recent templates per restaurant per food type)
    console.log('\nTesting Case 3: Sliding window limits (Max 5 images per food type)');
    // Seed mockDb with 5 distinct pizza images
    mockDb = [];
    for (let i = 1; i <= 5; i++) {
        mockDb.push({
            _id: `id_${i}`,
            url: `https://res.cloudinary.com/demo/image/upload/v1/pizza_new_${i}.jpg`,
            normalizedName: "pizza",
            restaurantId: new mongoose.Types.ObjectId(testRestaurantId),
            reuseCount: 1,
            createdAt: new Date(Date.now() + i * 1000)
        });
    }

    deleteCalled = false;
    const res3 = await saveToSharedMedia({
        url: "https://res.cloudinary.com/demo/image/upload/v1/pizza_new_6.jpg",
        name: "Veggie Pizza",
        category: "Pizza",
        restaurantId: testRestaurantId
    });
    assert(deleteCalled === true, "Should call deleteOne to remove the oldest record");
    assert(mockDb.length === 5, `Should enforce max 5 limit (db length remains 5). Got: ${mockDb.length}`);

    // Case 4: Suggestion Quality and Priority Sorting
    console.log('\nTesting Case 4: Suggestion quality sorting and priority checks');
    // Setup query find mock returning different match weights
    SharedMedia.find = function(filter) {
        const chain = {
            lean: async function() {
                return [
                    {
                        _id: 'item_keyword',
                        url: 'https://example.com/keyword.jpg',
                        keywords: ['pepperoni', 'pizza'],
                        normalizedName: 'pizza',
                        category: 'Pizza',
                        reuseCount: 1,
                        createdAt: new Date(2000)
                    },
                    {
                        _id: 'item_frequent',
                        url: 'https://example.com/frequent.jpg',
                        keywords: ['pizza'],
                        normalizedName: 'pizza',
                        category: 'Pizza',
                        reuseCount: 10, // Higher reuse
                        createdAt: new Date(1000)
                    },
                    {
                        _id: 'item_latest',
                        url: 'https://example.com/latest.jpg',
                        keywords: ['pizza'],
                        normalizedName: 'pizza',
                        category: 'Pizza',
                        reuseCount: 1,
                        createdAt: new Date(3000) // Latest
                    }
                ];
            }
        };
        return chain;
    };

    const suggestions = await getSharedMedia(testRestaurantId, { search: "pepperoni" });
    assert(suggestions.items.length > 0, "Should return results matching search query");
    
    // First element should be the exact keyword match ('item_keyword')
    assert(suggestions.items[0]._id === 'item_keyword', `First result should be keyword match. Got: ${suggestions.items[0]._id}`);

    // Now search for "pizza" (all match keywords). We expect order:
    // 1. Highest reuseCount ('item_frequent' with 10)
    // 2. Latest ('item_latest' with 3000 timestamp)
    // 3. Oldest ('item_keyword' with 2000 timestamp)
    const pizzaSuggestions = await getSharedMedia(testRestaurantId, { search: "pizza" });
    assert(pizzaSuggestions.items[0]._id === 'item_frequent', `Priority sorting: highest reuseCount should come first. Got: ${pizzaSuggestions.items[0]._id}`);
    assert(pizzaSuggestions.items[1]._id === 'item_latest', `Priority sorting fallback: latest createdAt should come second. Got: ${pizzaSuggestions.items[1]._id}`);
    assert(pizzaSuggestions.items[2]._id === 'item_keyword', `Priority sorting fallback: oldest createdAt should come last. Got: ${pizzaSuggestions.items[2]._id}`);

    console.log(`\n=== SAFEGUARDS TEST SUMMARY ===`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);

    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
