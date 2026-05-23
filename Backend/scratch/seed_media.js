import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const sharedMediaSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, trim: true },
        tags: { type: [String], default: [] },
        category: { type: String, trim: true, default: '' },
        isGlobal: { type: Boolean, default: false, index: true },
        restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRestaurant', index: true, default: null }
    },
    {
        collection: 'shared_media',
        timestamps: true
    }
);

const SharedMedia = mongoose.models.SharedMedia || mongoose.model('SharedMedia', sharedMediaSchema, 'shared_media');

const dummyData = [
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000000/appzeto/pizza_temp1.jpg',
    tags: ['pizza', 'veg', 'margherita', 'cheese'],
    category: 'Pizza',
    isGlobal: true
  },
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000001/appzeto/pizza_temp2.jpg',
    tags: ['pizza', 'non-veg', 'pepperoni'],
    category: 'Pizza',
    isGlobal: true
  },
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000002/appzeto/burger_temp1.jpg',
    tags: ['burger', 'veg', 'cheese'],
    category: 'Burger',
    isGlobal: true
  },
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000003/appzeto/burger_temp2.jpg',
    tags: ['burger', 'non-veg', 'chicken'],
    category: 'Burger',
    isGlobal: true
  },
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000004/appzeto/dessert_temp1.jpg',
    tags: ['desserts', 'chocolate', 'cake'],
    category: 'Desserts',
    isGlobal: true
  },
  {
    url: 'https://res.cloudinary.com/dm6dbsbfx/image/upload/v1700000005/appzeto/beverage_temp1.jpg',
    tags: ['beverages', 'cola', 'cold'],
    category: 'Beverages',
    isGlobal: true
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }
  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected. Clearing old global shared media...');
  await SharedMedia.deleteMany({ isGlobal: true });
  console.log('Inserting new template data...');
  await SharedMedia.insertMany(dummyData);
  console.log('Data seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
