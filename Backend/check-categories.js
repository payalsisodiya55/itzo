import { connectDB, disconnectDB } from "./src/config/db.js";
import { QuickCategory } from "./src/modules/quick-commerce/models/category.model.js";

const run = async () => {
  await connectDB();
  try {
    const categories = await QuickCategory.find({}).lean();
    console.log(JSON.stringify(categories, null, 2));
  } finally {
    await disconnectDB();
  }
};

run().catch(console.error);
