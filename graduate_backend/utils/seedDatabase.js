// Seed database with dummy data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../mongodb/UserModel');
const Ingredient = require('../mongodb/IngredientModel');
const Meal = require('../mongodb/MealModel');
const MealPlan = require('../mongodb/MealPlanModel');
const { mongodb_url, clear_data } = require('./env');

// Common ingredients data that can be used for seeding
const getCommonIngredients = () => [
  {
    name: 'Chicken Breast',
    quantity: 6,
    unit: 'oz',
    macros: { calories: 120, protein: 26, carbs: 0, fat: 3 },
    price: 1.99
  },
  {
    name: 'Rice',
    quantity: 1,
    unit: 'cup',
    macros: { calories: 200, protein: 4, carbs: 45, fat: 0 },
    price: 0.5
  },
  {
    name: 'Broccoli',
    quantity: 1,
    unit: 'cup',
    macros: { calories: 55, protein: 3, carbs: 10, fat: 0 },
    price: 1.5
  },
  {
    name: 'Olive Oil',
    quantity: 1,
    unit: 'tbsp',
    macros: { calories: 120, protein: 0, carbs: 0, fat: 14 },
    price: 0.3
  },
  {
    name: 'Eggs',
    quantity: 1,
    unit: 'unit',
    macros: { calories: 70, protein: 6, carbs: 0, fat: 5 },
    price: 0.25
  },
  {
    name: 'Spinach',
    quantity: 1,
    unit: 'cup',
    macros: { calories: 7, protein: 1, carbs: 1, fat: 0 },
    price: 1.0
  },
  {
    name: 'Salmon',
    quantity: 1,
    unit: 'fillet',
    macros: { calories: 200, protein: 22, carbs: 0, fat: 12 },
    price: 4.99
  }
];

// Create seed data for a single user
async function createSeedDataForUser(userId) {
  try {
    console.log(`Creating seed data for user ${userId}`);
    
    // Get common ingredients
    const commonIngredients = getCommonIngredients();
    
    // Create ingredients for the user
    const createdIngredients = [];
    for (const ingredient of commonIngredients) {
      const createdIngredient = await Ingredient.create({
        ...ingredient,
        userId
      });
      createdIngredients.push(createdIngredient);
    }
    
    // Get references to specific ingredients
    const chickenIngredient = createdIngredients.find(ing => ing.name === 'Chicken Breast');
    const riceIngredient = createdIngredients.find(ing => ing.name === 'Rice');
    const broccoliIngredient = createdIngredients.find(ing => ing.name === 'Broccoli');
    const oilIngredient = createdIngredients.find(ing => ing.name === 'Olive Oil');
    const eggIngredient = createdIngredients.find(ing => ing.name === 'Eggs');
    const spinachIngredient = createdIngredients.find(ing => ing.name === 'Spinach');
    const salmonIngredient = createdIngredients.find(ing => ing.name === 'Salmon');
    
    // Create user's meals
    const userMeals = [];
    
    // Create a chicken and rice meal
    if (chickenIngredient && riceIngredient && broccoliIngredient && oilIngredient) {
      const chickenRiceMeal = await Meal.create({
        userId,
        name: 'Chicken Rice Bowl',
        ingredients: [
          { ingredientId: chickenIngredient._id, quantity: 0.5 },
          { ingredientId: riceIngredient._id, quantity: 1 },
          { ingredientId: broccoliIngredient._id, quantity: 1 },
          { ingredientId: oilIngredient._id, quantity: 0.5 }
        ],
        macros: {
          calories: 120 * 0.5 + 200 * 1 + 55 * 1 + 120 * 0.5,
          protein: 26 * 0.5 + 4 * 1 + 3 * 1 + 0 * 0.5,
          carbs: 0 * 0.5 + 45 * 1 + 10 * 1 + 0 * 0.5,
          fat: 3 * 0.5 + 0 * 1 + 0 * 1 + 14 * 0.5
        },
        price: 1.99 * 0.5 + 0.5 * 1 + 1.5 * 1 + 0.3 * 0.5
      });
      userMeals.push(chickenRiceMeal);
    }
    
    // Create an egg breakfast
    if (eggIngredient && spinachIngredient && oilIngredient) {
      const eggBreakfast = await Meal.create({
        userId,
        name: 'Spinach Omelette',
        ingredients: [
          { ingredientId: eggIngredient._id, quantity: 2 },
          { ingredientId: spinachIngredient._id, quantity: 1 },
          { ingredientId: oilIngredient._id, quantity: 0.5 }
        ],
        macros: {
          calories: 70 * 2 + 7 * 1 + 120 * 0.5,
          protein: 6 * 2 + 1 * 1 + 0 * 0.5,
          carbs: 0 * 2 + 1 * 1 + 0 * 0.5,
          fat: 5 * 2 + 0 * 1 + 14 * 0.5
        },
        price: 0.25 * 2 + 1.0 * 1 + 0.3 * 0.5
      });
      userMeals.push(eggBreakfast);
    }
    
    // Create a salmon dinner
    if (salmonIngredient && riceIngredient && broccoliIngredient && oilIngredient) {
      const salmonDinner = await Meal.create({
        userId,
        name: 'Salmon Dinner',
        ingredients: [
          { ingredientId: salmonIngredient._id, quantity: 1 },
          { ingredientId: riceIngredient._id, quantity: 0.5 },
          { ingredientId: broccoliIngredient._id, quantity: 1 },
          { ingredientId: oilIngredient._id, quantity: 0.5 }
        ],
        macros: {
          calories: 200 * 1 + 200 * 0.5 + 55 * 1 + 120 * 0.5,
          protein: 22 * 1 + 4 * 0.5 + 3 * 1 + 0 * 0.5,
          carbs: 0 * 1 + 45 * 0.5 + 10 * 1 + 0 * 0.5,
          fat: 12 * 1 + 0 * 0.5 + 0 * 1 + 14 * 0.5
        },
        price: 4.99 * 1 + 0.5 * 0.5 + 1.5 * 1 + 0.3 * 0.5
      });
      userMeals.push(salmonDinner);
    }
    
    // Create meal plans
    if (userMeals.length > 0 && createdIngredients.length > 0) {
      // Create a weekly meal plan
      const mealItems = userMeals.map(meal => ({
        type: 'meal',
        itemId: meal._id,
        quantity: 1,
        group: 'Meals'
      }));

      const ingredientItems = [
        {
          type: 'ingredient',
          itemId: chickenIngredient._id,
          quantity: 2,
          group: 'Proteins'
        },
        {
          type: 'ingredient',
          itemId: riceIngredient._id,
          quantity: 3,
          group: 'Carbs'
        },
        {
          type: 'ingredient',
          itemId: broccoliIngredient._id,
          quantity: 2,
          group: 'Vegetables'
        }
      ];

      await MealPlan.create({
        userId,
        name: 'Weekly Meal Plan',
        items: [...mealItems, ...ingredientItems],
        macros: {
          calories: 1947,
          protein: 130,
          carbs: 243.5,
          fat: 50.5
        },
        price: 20.16
      });

      // Create a weight loss meal plan
      const spinachOmelette = userMeals.find(m => m.name === 'Spinach Omelette');
      if (spinachOmelette) {
        await MealPlan.create({
          userId,
          name: 'Weight Loss Plan',
          items: [
            {
              type: 'meal',
              itemId: spinachOmelette._id,
              quantity: 1,
              group: 'Breakfast'
            },
            {
              type: 'ingredient',
              itemId: salmonIngredient._id,
              quantity: 1,
              group: 'Dinner'
            },
            {
              type: 'ingredient',
              itemId: spinachIngredient._id,
              quantity: 2,
              group: 'Vegetables'
            }
          ],
          macros: {
            calories: 421,
            protein: 130,
            carbs: 3,
            fat: 29
          },
          price: 8.64
        });
      }
    }
    
    console.log(`Seed data created for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error(`Error creating seed data for user ${userId}:`, error);
    return false;
  }
}

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongodb_url);
    console.log('Connected to MongoDB for seeding');

    if (clear_data) {
        console.log('Clearing existing data...');
        // Clear existing data
        await User.deleteMany({});
        await Ingredient.deleteMany({});
        await Meal.deleteMany({});
        await MealPlan.deleteMany({});
        console.log('Cleared existing data');
    }
    
    // Create test users
    
    // Don't hash the password here, let the model's pre-save middleware do it
    const password = 'password123';

    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password,
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password,
        age: 28,
        role: 'user'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password,
        role: 'admin'
      }
    ]);    console.log('Created users:', users.map(user => user.name));

    // Create seed data for each user
    for (const user of users) {
      await createSeedDataForUser(user._id);
    }
    
    console.log('Created all seed data for users');

    console.log('Created meal plans');
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  createSeedDataForUser,
  getCommonIngredients
};
