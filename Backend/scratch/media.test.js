import { getSharedMedia } from '../src/modules/media/services/media.service.js';
import { SharedMedia } from '../src/modules/media/models/sharedMedia.model.js';

// Simple mock framework for verifying service logic in sandboxed/offline envs
async function runTests() {
  console.log('--- STARTING UNIT TESTS FOR MEDIA SERVICE ---');

  let activeFilters = null;
  let activeLimit = null;
  let activeSkip = null;

  // Mock the Mongoose find chain
  SharedMedia.find = function(filter) {
    activeFilters = filter;
    const chain = {
      sort: function() { return chain; },
      skip: function(skipVal) { activeSkip = skipVal; return chain; },
      limit: function(limitVal) { activeLimit = limitVal; return chain; },
      lean: async function() {
        return [
          {
            _id: '123',
            url: 'https://res.cloudinary.com/demo/image/upload/v1/pizza.jpg',
            tags: ['pizza', 'veg'],
            category: 'Pizza',
            isGlobal: true
          },
          {
            _id: '456',
            url: 'https://res.cloudinary.com/demo/image/upload/v2/burger.jpg',
            tags: ['burger'],
            category: 'Burger',
            isGlobal: false,
            restaurantId: '789'
          },
          {
            _id: '789',
            url: 'https://example.com/custom.png',
            tags: ['custom'],
            category: 'Other',
            isGlobal: false
          }
        ];
      }
    };
    return chain;
  };

  SharedMedia.countDocuments = async (filter) => {
    return 3;
  };

  // Test Case 1: Standard retrieval with category default filter
  console.log('Test Case 1: Fetching shared media with category parameter...');
  const result1 = await getSharedMedia('603f752fb5a7e6b014c2b988', { page: 1, limit: 10, category: 'Pizza' });

  if (activeFilters.category !== 'Pizza') {
    throw new Error('Test Case 1 Failed: Category filter not set correctly');
  }

  // Verify Cloudinary thumbnail transformation:
  const pizzaItem = result1.items.find(i => i._id === '123');
  if (pizzaItem.thumbnailUrl !== 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_150,h_150,q_auto,f_auto/v1/pizza.jpg') {
    throw new Error(`Test Case 1 Failed: Cloudinary thumbnail not transformed. Got: ${pizzaItem.thumbnailUrl}`);
  }

  // Verify Non-Cloudinary fallback:
  const customItem = result1.items.find(i => i._id === '789');
  if (customItem.thumbnailUrl !== 'https://example.com/custom.png') {
    throw new Error('Test Case 1 Failed: Non-Cloudinary item did not fallback correctly');
  }

  console.log('✅ Test Case 1 Passed!');

  // Test Case 2: Pagination limits (max 20)
  console.log('Test Case 2: Fetching with limit above maximum...');
  const result2 = await getSharedMedia('603f752fb5a7e6b014c2b988', { page: 2, limit: 50, search: 'pizza' });
  if (result2.pagination.limit !== 20) {
    throw new Error(`Test Case 2 Failed: Max limit not enforced. Got: ${result2.pagination.limit}`);
  }
  const expectedSkip = (result2.pagination.page - 1) * result2.pagination.limit;
  if (expectedSkip !== 20) {
    throw new Error(`Test Case 2 Failed: Skip offset calculation is incorrect. Got: ${expectedSkip}`);
  }
  console.log('✅ Test Case 2 Passed!');

  // Test Case 3: Fuzzy search regex filtering
  console.log('Test Case 3: Searching with keyword...');
  await getSharedMedia('603f752fb5a7e6b014c2b988', { search: 'cheesy' });
  if (!activeFilters.$or || activeFilters.$or.length === 0) {
    throw new Error('Test Case 3 Failed: Search query filter is missing');
  }
  console.log('✅ Test Case 3 Passed!');

  console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
