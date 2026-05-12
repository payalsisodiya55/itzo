import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const fixStock = async () => {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB');
    
    // Using raw collection name to avoid model issues
    const result = await mongoose.connection.db.collection('quick_products').updateMany(
      {},
      { $set: { stock: 100, isActive: true, status: 'active' } }
    );
    
    console.log(`Updated ${result.modifiedCount} products`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixStock();
