import mongoose from 'mongoose';
import { QuickCategory } from '../src/modules/quick-commerce/models/category.model.js';

async function checkCategories() {
  const uri = "mongodb+srv://Appzeto:Appzeto123@cluster0.jkxcmhk.mongodb.net/Appzeto-Master-Product";
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const count = await QuickCategory.countDocuments();
    console.log('Total categories in quick_categories collection:', count);
    
    const all = await QuickCategory.find().lean();
    console.log('Categories list:');
    all.forEach(c => {
        console.log(`- ${c.name} (${c.slug}) | type: ${c.type} | active: ${c.isActive} | parent: ${c.parentId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();
