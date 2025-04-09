const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
    },
    quantity: {
        type: Number,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
        maxlength: 10,
        // enum: ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'oz', 'lb']  
    },
    macros: {
        calories: {
            type: Number,
            min: 0,
            max: 10000,
            required: true
        },
        protein: {
            type: Number,
            min: 0,
            max: 500,
            required: true
        },
        fat: {
            type: Number,
            min: 0,
            max: 500,
            required: true
        },
        carbs: {
            type: Number,
            min: 0,
            max: 500,
            required: true
        }
    },
    price: {
        type: Number,
        min: 0,
    },
});


const Ingredient = mongoose.model('Ingredient', IngredientSchema);
module.exports = Ingredient;