import mongoose from 'mongoose';
import { FoodRestaurant } from './src/modules/food/restaurant/models/restaurant.model.js';
import dotenv from 'dotenv';
dotenv.config();

const checkNonVeg = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const restros = await FoodRestaurant.find({ pureVegRestaurant: false }).select('restaurantName pureVegRestaurant');
        console.log(`Found ${restros.length} non-veg restaurants`);
        if (restros.length > 0) {
            console.log(restros.map(r => r.restaurantName).join(', '));
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

checkNonVeg();
