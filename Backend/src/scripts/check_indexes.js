import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Appzeto-Master-Product';

async function checkIndexes() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('food_page_contents');
        
        const indexes = await collection.indexes();
        console.log('Current indexes on food_page_contents:');
        console.log(JSON.stringify(indexes, null, 2));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkIndexes();
