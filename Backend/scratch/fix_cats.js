import mongoose from 'mongoose';
import { QuickCategory } from '../src/modules/quick-commerce/models/category.model.js';

async function fixCategories() {
  const uri = "mongodb+srv://Appzeto:Appzeto123@cluster0.jkxcmhk.mongodb.net/Appzeto-Master-Product";
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const result = await QuickCategory.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true, status: 'active' } }
    );
    console.log('Updated categories:', result.modifiedCount);
    
    const count = await QuickCategory.countDocuments({ isActive: true });
    console.log('Total active categories now:', count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCategories();
