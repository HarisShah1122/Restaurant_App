const { FoodPlace, sequelize } = require('./src/models/restaurant');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
  await sequelize.sync({ force: false }); 
  const cuisines = ['Indian', 'Seafood', 'Chinese', 'Pakistani', 'Fast Food', 'Mediterranean', 'Cafe', 'Middle Eastern', 'Italian', 'Japanese'];
  const locations = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Quetta', 'Peshawar', 'Faisalabad'];
  const imageBase = '/images/';
  const imageNames = ['restaurant1.png', 'restaurant2.png', 'restaurant3.png', 'restaurant4.png', 'restaurant5.png'];

  const restaurants = [];
  for (let i = 0; i < 20000; i++) {
    const numImages = Math.floor(Math.random() * 3) + 1; 
    const images = Array.from({ length: numImages }, () => `${imageBase}${imageNames[Math.floor(Math.random() * imageNames.length)]}`);
    restaurants.push({
      id: uuidv4(),
      name: `Restaurant_${i + 1}`,
      cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      rating: (Math.random() * 2.5 + 2.5).toFixed(1), 
      images: images
    });
  }

  try {
    await FoodPlace.bulkCreate(restaurants, { batchSize: 1000 }); 
    console.log('Database seeded with 20,000 restaurants!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
};

seedData().catch(err => console.error(err));