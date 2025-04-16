'use client';

import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Typography, CircularProgress
} from '@mui/material';
import { Ingredient } from '../../services/ingredientService';

interface IngredientEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  ingredient: Ingredient;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  loading: boolean;
}

const IngredientEditDialog: React.FC<IngredientEditDialogProps> = ({
  open,
  onClose,
  onSubmit,
  ingredient,
  onChange,
  isEditing,
  loading
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                autoFocus
                name="name"
                label="Ingredient Name"
                fullWidth
                required
                value={ingredient.name}
                onChange={onChange}
                margin="normal"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                fullWidth
                value={ingredient.quantity}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="unit"
                label="Unit"
                fullWidth
                required
                value={ingredient.unit}
                onChange={onChange}
                margin="normal"
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Nutritional Information (per 100g/ml)
              </Typography>
            </Grid>
            <Grid size={6}>
              <TextField
                name="macros.calories"
                label="Calories"
                type="number"
                fullWidth
                required
                value={ingredient.macros.calories}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="macros.protein"
                label="Protein (g)"
                type="number"
                fullWidth
                required
                value={ingredient.macros.protein}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="macros.carbs"
                label="Carbs (g)"
                type="number"
                fullWidth
                required
                value={ingredient.macros.carbs}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="macros.fat"
                label="Fat (g)"
                type="number"
                fullWidth
                required
                value={ingredient.macros.fat}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                name="price"
                label="Price"
                type="number"
                fullWidth
                value={ingredient.price}
                onChange={onChange}
                margin="normal"
                inputProps={{ min: 0, step: "any" }}
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

export default IngredientEditDialog;
