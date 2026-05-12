import mongoose from 'mongoose';
import { QuickCategory } from './src/modules/quick-commerce/models/category.model.js';

const toCategory = (category) => ({
  id: category._id,
  _id: category._id,
  name: category.name,
  slug: category.slug,
  image: category.image,
  accentColor: category.accentColor,
  description: category.description || '',
  type: category.type || 'header',
  status: category.status || (category.isActive ? 'active' : 'inactive'),
  parentId: category.parentId || null,
  iconId: category.iconId || '',
  adminCommission: Number(category.adminCommission || 0),
  handlingFees: Number(category.handlingFees || 0),
  headerColor: category.headerColor || category.accentColor,
  sortOrder: category.sortOrder,
  isActive: category.isActive,
  approvalStatus: category.approvalStatus || 'approved',
  approvedAt: category.approvedAt || null,
});

const buildCategoryTree = (categories) => {
  const byId = new Map();
  const roots = [];

  categories.forEach((category) => {
    byId.set(String(category._id), { ...toCategory(category), children: [] });
  });

  byId.forEach((category) => {
    const parentId = category.parentId ? String(category.parentId) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(category);
    } else {
      roots.push(category);
    }
  });

  return roots;
};

async function testApiLogic() {
  try {
    await mongoose.connect('mongodb+srv://Appzeto:Appzeto123@cluster0.jkxcmhk.mongodb.net/Appzeto-Master-Product');
    const categories = await QuickCategory.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
    
    let fullTree = buildCategoryTree(categories);
    const type = 'header';
    if (type) {
        fullTree = fullTree.filter(root => root.type === String(type));
    }
    
    console.log('Tree Roots Count:', fullTree.length);
    fullTree.forEach(root => {
        console.log(`- ${root.name} (${root._id})`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

testApiLogic();
