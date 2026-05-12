
import mongoose from 'mongoose';
import { QuickCategory } from '../src/modules/quick-commerce/models/category.model.js';
import { QuickProduct } from '../src/modules/quick-commerce/models/product.model.js';
import { Seller } from '../src/modules/quick-commerce/seller/models/seller.model.js';
import { config } from '../src/config/env.js';

async function run() {
  console.log('Connecting to DB...');
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to DB');

  const start = Date.now();
  
  const categoryCount = await QuickCategory.countDocuments();
  console.log(`Categories: ${categoryCount}`);

  const productCount = await QuickProduct.countDocuments();
  console.log(`Products: ${productCount}`);

  const sellerCount = await Seller.countDocuments();
  console.log(`Sellers: ${sellerCount}`);

  console.log(`Counts took ${Date.now() - start}ms`);

  const queryStart = Date.now();
  await QuickProduct.find({}).sort({ createdAt: -1 }).limit(18).lean();
  console.log(`Product query (sort by createdAt) took ${Date.now() - queryStart}ms`);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
