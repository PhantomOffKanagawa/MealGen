const mongoose = require("mongoose");

const MealIngredientSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false },
);

const MealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  ingredients: [MealIngredientSchema],
  macros: {
    calories: {
      type: Number,
      min: 0,
      max: 10000,
      required: true,
    },
    protein: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    carbs: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    fat: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
  },
  price: {
    type: Number,
    min: 0,
  },
});

MealSchema.index({ userId: 1, name: 1 }, { unique: true });

const Meal = mongoose.model("Meal", MealSchema);
module.exports = Meal;
