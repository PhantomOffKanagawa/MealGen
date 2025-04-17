'use client';

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Box, Chip, Stack,
  alpha, useTheme, Divider
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
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
  const theme = useTheme();
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: theme.palette.primary.main
      }}>
        <LocalDiningIcon />
        {isEditing ? 'Edit Meal' : 'Add New Meal'}
      </DialogTitle>
      
      <Divider sx={{ 
        mb: 1, 
        borderColor: alpha(theme.palette.primary.main, 0.2) 
      }} />
      
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 2 }}>          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                autoFocus
                name="name"
                label="Meal Name"
                fullWidth
                required
                value={meal.name}
                onChange={onChange}
                variant="outlined"
                color="primary"
                InputProps={{
                  sx: {
                    borderRadius: 1,
                    color: theme.palette.primary.main
                  }
                }}
              />
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ 
                bgcolor: alpha(theme.palette.primary.light, 0.08),
                p: 2, 
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom 
                  sx={{ 
                    color: theme.palette.primary.dark,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <ShoppingBasketIcon fontSize="small" />
                  Ingredients
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={5}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel sx={{ color: theme.palette.info.main }}>
                        Select Ingredient
                      </InputLabel>
                      <Select
                        value={selectedIngredientId}
                        onChange={(e) => setSelectedIngredientId(e.target.value as string)}
                        label="Select Ingredient"
                        color="info"
                        sx={{ 
                          borderRadius: 1,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.info.main, 0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.info.main,
                          }
                        }}
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
                      variant="outlined"
                      color="info"
                      InputProps={{
                        sx: { borderRadius: 1 }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={3}>
                    <Button
                      variant="contained"
                      onClick={handleAddClick}
                      fullWidth
                      sx={{ 
                        height: '100%', 
                        borderRadius: 1,
                        backgroundColor: theme.palette.info.main,
                        '&:hover': {
                          backgroundColor: theme.palette.info.dark,
                        },
                        boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`
                      }}
                      disabled={!selectedIngredientId || selectedQuantity <= 0}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
              <Grid size={12}>
              <Box sx={{ 
                mt: 2, 
                mb: 2, 
                p: 2, 
                borderRadius: 1,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.4)}`,
                backgroundColor: alpha(theme.palette.info.light, 0.03)
              }}>
                <Typography 
                  variant="subtitle2" 
                  gutterBottom
                  sx={{ 
                    color: theme.palette.info.dark,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <RestaurantIcon fontSize="small" />
                  Current Ingredients:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
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
                        sx={{ 
                          margin: '4px',
                          borderRadius: '4px',
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.dark,
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.info.main,
                            '&:hover': {
                              color: theme.palette.error.main,
                            }
                          }
                        }}
                      />
                    ))
                  )}
                </Stack>
              </Box>
            </Grid>
              <Grid size={12}>
              <Box sx={{ 
                mt: 2,
                bgcolor: alpha(theme.palette.warning.light, 0.08),
                p: 2, 
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
              }}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom 
                  sx={{ 
                    color: theme.palette.warning.dark,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <LocalDiningIcon fontSize="small" />
                  Calculated Nutrition Information
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={3}>
                    <TextField
                      label="Calories"
                      type="number"
                      fullWidth
                      disabled
                      value={meal.macros.calories}
                      variant="outlined"
                      color="error"
                      InputProps={{
                        sx: { 
                          borderRadius: 1,
                          color: theme.palette.error.main,
                          '& .Mui-disabled': {
                            color: theme.palette.error.main,
                            opacity: 0.7,
                            WebkitTextFillColor: `${theme.palette.error.main} !important`
                          }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={3}>
                    <TextField
                      label="Protein (g)"
                      type="number"
                      fullWidth
                      disabled
                      value={meal.macros.protein}
                      variant="outlined"
                      color="info"
                      InputProps={{
                        sx: { 
                          borderRadius: 1,
                          color: theme.palette.info.main,
                          '& .Mui-disabled': {
                            color: theme.palette.info.main,
                            opacity: 0.7,
                            WebkitTextFillColor: `${theme.palette.info.main} !important`
                          }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={3}>
                    <TextField
                      label="Carbs (g)"
                      type="number"
                      fullWidth
                      disabled
                      value={meal.macros.carbs}
                      variant="outlined"
                      color="warning"
                      InputProps={{
                        sx: { 
                          borderRadius: 1,
                          color: theme.palette.warning.main,
                          '& .Mui-disabled': {
                            color: theme.palette.warning.main,
                            opacity: 0.7,
                            WebkitTextFillColor: `${theme.palette.warning.main} !important`
                          }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={3}>
                    <TextField
                      label="Fat (g)"
                      type="number"
                      fullWidth
                      disabled
                      value={meal.macros.fat}
                      variant="outlined"
                      color="warning"
                      InputProps={{
                        sx: { 
                          borderRadius: 1,
                          color: '#FFA726',
                          '& .Mui-disabled': {
                            color: '#FFA726',
                            opacity: 0.7,
                            WebkitTextFillColor: '#FFA726 !important'
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid size={12} sx={{ mt: 2 }}>
              <TextField
                label="Total Price ($)"
                type="number"
                fullWidth
                disabled
                value={meal.price}
                variant="outlined"
                color="success"
                InputProps={{
                  sx: { 
                    borderRadius: 1,
                    color: theme.palette.success.main,
                    '& .Mui-disabled': {
                      color: theme.palette.success.main,
                      opacity: 0.7,
                      WebkitTextFillColor: `${theme.palette.success.main} !important`
                    }
                  }
                }}
              />
            </Grid>
          </Grid>        </DialogContent>
        <Divider sx={{ 
          mt: 2,
          borderColor: alpha(theme.palette.primary.main, 0.1) 
        }} />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={onClose} 
            variant="outlined" 
            color="inherit"
            sx={{ 
              borderRadius: 1,
              px: 3,
              color: theme.palette.text.secondary,
              borderColor: alpha(theme.palette.divider, 0.5)
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
            sx={{ 
              borderRadius: 1, 
              px: 3,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MealEditDialog;
