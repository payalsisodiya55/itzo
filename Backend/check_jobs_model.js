import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/itzo folder/itzo/backend/.env' });
import { Job } from './src/modules/food/admin/models/job.model.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  const jobs = await Job.find({}).sort({createdAt: -1});
  console.log("Found via Job model:", jobs.length);
  process.exit(0);
}).catch(console.error);
