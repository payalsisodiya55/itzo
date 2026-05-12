import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://Appzeto:Appzeto123@cluster0.jkxcmhk.mongodb.net/Appzeto-Master-Product';

async function dropIndex() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('food_page_contents');
        
        // Try to drop the key_1 index if it exists
        try {
            await collection.dropIndex('key_1');
            console.log('Successfully dropped index: key_1');
        } catch (e) {
            if (e.code === 27) {
                console.log('Index key_1 not found, it might already be dropped.');
            } else {
                throw e;
            }
        }
        
        const indexes = await collection.indexes();
        console.log('Remaining indexes on food_page_contents:');
        console.log(JSON.stringify(indexes, null, 2));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

dropIndex();
