import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/itzo folder/itzo/backend/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  const jobs = await mongoose.connection.db.collection('jobs').find().sort({createdAt: -1}).toArray();
  console.log("Total jobs:", jobs.length);
  console.log("Jobs:");
  jobs.forEach(j => console.log(j._id, j.title, j.createdAt, j.status));
  process.exit(0);
}).catch(console.error);
