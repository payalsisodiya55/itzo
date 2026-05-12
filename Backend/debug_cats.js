import mongoose from 'mongoose';
import { QuickCategory } from './src/modules/quick-commerce/models/category.model.js';

async function debug() {
  try {
    await mongoose.connect('mongodb+srv://Appzeto:Appzeto123@cluster0.jkxcmhk.mongodb.net/Appzeto-Master-Product');
    const all = await QuickCategory.find({}).lean();
    console.log(`Total Categories: ${all.length}`);
    
    const rootCount = all.filter(c => !c.parentId).length;
    console.log(`Root Categories: ${rootCount}`);
    
    const headerRoots = all.filter(c => !c.parentId && (c.type === 'header' || !c.type)).length;
    console.log(`Header Root Categories (including default): ${headerRoots}`);

    console.log('--- Root Category List ---');
    all.filter(c => !c.parentId || String(c.parentId).trim() === '').forEach(c => {
        console.log(`- ${c.name} (Type: ${c.type || 'default'}, ParentId: ${c.parentId}, Approval: ${c.approvalStatus})`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
