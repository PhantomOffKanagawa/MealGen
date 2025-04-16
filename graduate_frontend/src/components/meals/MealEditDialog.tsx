'use client';

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Box, Chip, Stack
} from '@mui/material';
import { Meal, MealIngredient } from '../../services/mealService';
import { Ingredient } from '../../services/ingredientService';

interface MealEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  meal: Meal;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  loading: boolean;
  ingredients: Ingredient[];
  onAddIngredient: (ingredientId: string, quantity: number) => void;
  onRemoveIngredient: (ingredientId: string) => void;
}

const MealEditDialog: React.FC<MealEditDialogProps> = ({
  open,
  onClose,
  onSubmit,
  meal,
  onChange,
  isEditing,
  loading,
  ingredients,
  onAddIngredient,
  onRemoveIngredient
}) => {
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const handleAddClick = () => {
    if (selectedIngredientId && selectedQuantity > 0) {
      onAddIngredient(selectedIngredientId, selectedQuantity);
      setSelectedIngredientId('');
      setSelectedQuantity(1);
    }
  };

  const getIngredientNameById = (id: string): string => {
    const ingredient = ingredients.find(i => i._id === id);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Meal' : 'Add New Meal'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                autoFocus
                name="name"
                label="Meal Name"
                fullWidth
                required
                value={meal.name}
                onChange={onChange}
                margin="normal"
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                Ingredients
              </Typography>
            </Grid>
            
            <Grid size={5}>
              <FormControl fullWidth>
                <InputLabel>Select Ingredient</InputLabel>
                <Select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value as string)}
                  label="Select Ingredient"
                >
                  {ingredients.map(ingredient => (
                    <MenuItem key={ingredient._id} value={ingredient._id}>
                      {ingredient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={4}>
              <TextField
                type="number"
                label="Quantity"
                fullWidth
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            
            <Grid size={3}>
              <Button
                variant="contained"
                onClick={handleAddClick}
                fullWidth
                sx={{ height: '100%' }}
                disabled={!selectedIngredientId || selectedQuantity <= 0}
              >
                Add
              </Button>
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Ingredients:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {meal.ingredients.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No ingredients added yet
                    </Typography>
                  ) : (
                    meal.ingredients.map((item) => (
                      <Chip
                        key={item.ingredientId}
                        label={`${getIngredientNameById(item.ingredientId)} (${item.quantity})`}
                        onClick={() => {
                          setSelectedIngredientId(item.ingredientId);
                          setSelectedQuantity(item.quantity);
                        }}
                        onDelete={() => onRemoveIngredient(item.ingredientId)}
                        sx={{ margin: '4px' }}
                      />
                    ))
                  )}
                </Stack>
              </Box>
            </Grid>
            
            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                Calculated Nutrition Information
              </Typography>
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Calories"
                type="number"
                fullWidth
                disabled
                value={meal.macros.calories}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Protein (g)"
                type="number"
                fullWidth
                disabled
                value={meal.macros.protein}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Carbs (g)"
                type="number"
                fullWidth
                disabled
                value={meal.macros.carbs}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Fat (g)"
                type="number"
                fullWidth
                disabled
                value={meal.macros.fat}
              />
            </Grid>
            
            <Grid size={12}>
              <TextField
                label="Total Price"
                type="number"
                fullWidth
                disabled
                value={meal.price}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MealEditDialog;
