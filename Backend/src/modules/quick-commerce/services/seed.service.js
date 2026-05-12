import { QuickCategory } from '../models/category.model.js';
import { QuickProduct } from '../models/product.model.js';

const categoriesSeed = [
  {
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2022-09/44889.png',
    accentColor: '#66bb6a',
    sortOrder: 1,
  },
  {
    name: 'Dairy, Bread & Eggs',
    slug: 'dairy-bread-eggs',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2022-09/44910.png',
    accentColor: '#f7ca4d',
    sortOrder: 2,
  },
  {
    name: 'Cold Drinks & Juices',
    slug: 'cold-drinks-juices',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2023-01/44907.png',
    accentColor: '#80deea',
    sortOrder: 3,
  },
  {
    name: 'Snacks & Munchies',
    slug: 'snacks-munchies',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2023-01/44908.png',
    accentColor: '#ffcc80',
    sortOrder: 4,
  },
  {
    name: 'Bakery & Biscuits',
    slug: 'bakery-biscuits',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2022-09/44901.png',
    accentColor: '#bcaaa4',
    sortOrder: 5,
  },
  {
    name: 'Instant & Frozen Food',
    slug: 'instant-frozen-food',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout_item/2022-09/44917.png',
    accentColor: '#a5d6a7',
    sortOrder: 6,
  },
];

const productSeeds = [
  {
    name: 'Fresh Bananas Robusta',
    slug: 'fresh-bananas-robusta',
    categorySlug: 'fruits-vegetables',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/494a.jpg',
    price: 39,
    mrp: 49,
    unit: '1 kg',
    badge: 'Bestseller',
  },
  {
    name: 'Farm Fresh Tomato',
    slug: 'farm-fresh-tomato',
    categorySlug: 'fruits-vegetables',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/299a.jpg',
    price: 32,
    mrp: 40,
    unit: '500 g',
    badge: 'Fresh',
  },
  {
    name: 'Amul Taaza Toned Milk',
    slug: 'amul-taaza-toned-milk',
    categorySlug: 'dairy-bread-eggs',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/10012a.jpg',
    price: 32,
    mrp: 34,
    unit: '500 ml',
    badge: 'Daily',
  },
  {
    name: 'Country Delight Paneer',
    slug: 'country-delight-paneer',
    categorySlug: 'dairy-bread-eggs',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/482436a.jpg',
    price: 105,
    mrp: 120,
    unit: '200 g',
    badge: 'Popular',
  },
  {
    name: 'Coca Cola Soft Drink',
    slug: 'coca-cola-soft-drink',
    categorySlug: 'cold-drinks-juices',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/1210a.jpg',
    price: 40,
    mrp: 45,
    unit: '750 ml',
    badge: 'Chilled',
  },
  {
    name: 'Tropicana Mixed Fruit Juice',
    slug: 'tropicana-mixed-fruit-juice',
    categorySlug: 'cold-drinks-juices',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/117234a.jpg',
    price: 120,
    mrp: 135,
    unit: '1 L',
    badge: 'No Added Color',
  },
  {
    name: 'Lay\'s Classic Salted Chips',
    slug: 'lays-classic-salted-chips',
    categorySlug: 'snacks-munchies',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/123a.jpg',
    price: 20,
    mrp: 25,
    unit: '52 g',
    badge: 'Crunchy',
  },
  {
    name: 'Haldiram\'s Aloo Bhujia',
    slug: 'haldirams-aloo-bhujia',
    categorySlug: 'snacks-munchies',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/352019a.jpg',
    price: 55,
    mrp: 65,
    unit: '150 g',
    badge: 'Top Pick',
  },
  {
    name: 'Britannia Good Day Cashew',
    slug: 'britannia-good-day-cashew',
    categorySlug: 'bakery-biscuits',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/136a.jpg',
    price: 35,
    mrp: 40,
    unit: '200 g',
    badge: 'Tea Time',
  },
  {
    name: 'Harvest Gold White Bread',
    slug: 'harvest-gold-white-bread',
    categorySlug: 'bakery-biscuits',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/17349a.jpg',
    price: 45,
    mrp: 50,
    unit: '400 g',
    badge: 'Soft',
  },
  {
    name: 'McCain French Fries',
    slug: 'mccain-french-fries',
    categorySlug: 'instant-frozen-food',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/5169a.jpg',
    price: 135,
    mrp: 160,
    unit: '420 g',
    badge: 'Frozen',
  },
  {
    name: 'ITC Yippee Noodles',
    slug: 'itc-yippee-noodles',
    categorySlug: 'instant-frozen-food',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=300/app/images/products/sliding_image/456675a.jpg',
    price: 76,
    mrp: 85,
    unit: '280 g',
    badge: 'Instant',
  },
];

let isSeedingVerified = false;
let seedingPromise = null;

export const ensureQuickCommerceSeedData = async () => {
  if (isSeedingVerified) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const existingCategories = await QuickCategory.countDocuments();
      const existingProducts = await QuickProduct.countDocuments();

      if (existingCategories > 0 && existingProducts > 0) {
        isSeedingVerified = true;
        return;
      }

    let categories = await QuickCategory.find({}).lean();

    if (existingCategories === 0) {
      await QuickCategory.insertMany(categoriesSeed);
      categories = await QuickCategory.find({}).lean();
    }

    if (existingProducts === 0) {
      const categoryBySlug = categories.reduce((acc, category) => {
        acc[category.slug] = category;
        return acc;
      }, {});

      const products = productSeeds
        .map((product) => {
          const category = categoryBySlug[product.categorySlug];
          if (!category) return null;
          return {
            name: product.name,
            slug: product.slug,
            image: product.image,
            categoryId: category._id,
            price: product.price,
            mrp: product.mrp,
            unit: product.unit,
            deliveryTime: '10 mins',
            badge: product.badge,
            rating: 4.2,
            isActive: true,
          };
        })
        .filter(Boolean);

      if (products.length > 0) {
        await QuickProduct.insertMany(products);
      }
      isSeedingVerified = true;
      }
    } catch (err) {
      console.error('Quick Commerce seeding failed:', err);
    } finally {
      seedingPromise = null;
    }
  })();

  return seedingPromise;
};
