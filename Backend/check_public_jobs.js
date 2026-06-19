import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/itzo folder/itzo/backend/.env' });
import { getPublicJobsService } from './src/modules/food/landing/services/career.service.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  try {
    const result = await getPublicJobsService({});
    console.log("Public jobs:", result.jobs.length);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}).catch(console.error);
