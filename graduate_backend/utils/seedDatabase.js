// Seed database with dummy data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../mongodb/UserModel');
const Ingredient = require('../mongodb/IngredientModel');
const Meal = require('../mongodb/MealModel');
const MealPlan = require('../mongodb/MealPlanModel');
const { mongodb_url, clear_data } = require('./env');

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
    ]);

    console.log('Created users:', users.map(user => user.name));

    // Create ingredients for each user
    const commonIngredients = [
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

    const ingredients = [];

    // Create ingredients for each user
    for (const user of users) {
      for (const ingredient of commonIngredients) {
        const createdIngredient = await Ingredient.create({
          ...ingredient,
          userId: user._id
        });
        ingredients.push(createdIngredient);
      }
    }

    console.log(`Created ${ingredients.length} ingredients`);

    // Create meals for each user
    for (const user of users) {
      const userIngredients = ingredients.filter(ing => ing.userId.toString() === user._id.toString());

      // Create a chicken and rice meal
      const chickenIngredient = userIngredients.find(ing => ing.name === 'Chicken Breast');
      const riceIngredient = userIngredients.find(ing => ing.name === 'Rice');
      const broccoliIngredient = userIngredients.find(ing => ing.name === 'Broccoli');
      const oilIngredient = userIngredients.find(ing => ing.name === 'Olive Oil');

      if (chickenIngredient && riceIngredient && broccoliIngredient && oilIngredient) {
        await Meal.create({
          userId: user._id,
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
      }

      // Create an egg breakfast
      const eggIngredient = userIngredients.find(ing => ing.name === 'Eggs');
      const spinachIngredient = userIngredients.find(ing => ing.name === 'Spinach');
      
      if (eggIngredient && spinachIngredient && oilIngredient) {
        await Meal.create({
          userId: user._id,
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
      }

      // Create a salmon dinner
      const salmonIngredient = userIngredients.find(ing => ing.name === 'Salmon');
      
      if (salmonIngredient && riceIngredient && broccoliIngredient && oilIngredient) {
        await Meal.create({
          userId: user._id,
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
      }
    }

    console.log('Created meals');

    // Create meal plans
    for (const user of users) {
      // Get user's meals
      const userMeals = await Meal.find({ userId: user._id });
      
      // Get user's ingredients
      const userIngredients = await Ingredient.find({ userId: user._id });

      if (userMeals.length > 0 && userIngredients.length > 0) {        const mealItems = userMeals.map(meal => ({
          type: 'meal',
          itemId: meal._id,
          quantity: 1,
          group: 'Meals'
        }));

        const ingredientItems = [
          {
            type: 'ingredient',
            itemId: userIngredients.find(i => i.name === 'Chicken Breast')._id,
            quantity: 2,
            group: 'Proteins'
          },
          {
            type: 'ingredient',
            itemId: userIngredients.find(i => i.name === 'Rice')._id,
            quantity: 3,
            group: 'Carbs'
          },
          {
            type: 'ingredient',
            itemId: userIngredients.find(i => i.name === 'Broccoli')._id,
            quantity: 2,
            group: 'Vegetables'
          }
        ];

        await MealPlan.create({
          userId: user._id,
          name: 'Weekly Meal Plan',
          items: [...mealItems, ...ingredientItems],
          macros: {
            calories: 2000,
            protein: 120,
            carbs: 250,
            fat: 65
          }
        });

        // Create a second meal plan
        await MealPlan.create({
          userId: user._id,
          name: 'Weight Loss Plan',          items: [
            {
              type: 'meal',
              itemId: userMeals.find(m => m.name === 'Spinach Omelette')._id,
              quantity: 1,
              group: 'Breakfast'
            },
            {
              type: 'ingredient',
              itemId: userIngredients.find(i => i.name === 'Salmon')._id,
              quantity: 1,
              group: 'Dinner'
            },
            {
              type: 'ingredient',
              itemId: userIngredients.find(i => i.name === 'Spinach')._id,
              quantity: 2,
              group: 'Vegetables'
            }
          ],
          macros: {
            calories: 1500,
            protein: 100,
            carbs: 120,
            fat: 50
          }
        });
      }
    }

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

module.exports = seedDatabase;
