const mongoose = require("mongoose");

const MealPlanItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ingredient", "meal"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    group: {
      type: String,
      default: "General",
    },
  },
  { _id: false },
);

const MealPlanSchema = new mongoose.Schema({
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
  items: [MealPlanItemSchema],
  macros: {
    calories: {
      type: Number,
      min: 0,
      max: 10000,
      default: 0,
    },
    protein: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
    carbs: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
    fat: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
  },
  price: {
    type: Number,
    min: 0,
    default: 0,
  },
});

MealPlanSchema.index({ userId: 1, name: 1 }, { unique: true });

const MealPlan = mongoose.model("MealPlan", MealPlanSchema);
module.exports = MealPlan;
