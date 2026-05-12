import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const checkDB = async () => {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB');
    
    const products = await mongoose.connection.db.collection('quick_products').find({ isActive: true }).toArray();
    console.log('Active Products count:', products.length);
    if(products.length > 0) {
        console.log('First product categoryId:', products[0].categoryId);
    }
    
    const categories = await mongoose.connection.db.collection('quick_categories').find({ isActive: true }).toArray();
    console.log('Active Categories count:', categories.length);
    if(categories.length > 0) {
        console.log('First category _id:', categories[0]._id);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
