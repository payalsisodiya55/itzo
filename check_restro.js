const mongoose = require('mongoose');
require('dotenv').config({path: './Backend/.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Restaurant = require('./Backend/src/modules/food/restaurant/models/Restaurant');
  const rest = await Restaurant.findOne({ 'settings.vegMode': { $ne: 'pure' } });
  if (rest) {
    console.log('Found Non-Veg Restro: ' + rest.restaurantName);
  } else {
    console.log('No non-veg restro found.');
  }
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
