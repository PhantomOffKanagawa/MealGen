"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Typography, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Grid, CircularProgress, Snackbar, Alert,
  MenuItem, Select, FormControl, InputLabel, Chip, Stack,
  useTheme, alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import graphqlClient from '../../services/graphql';
import { 
  getAllMeals, 
  createMeal, 
  updateMeal, 
  deleteMeal,
  Meal,
  MealIngredient
} from '../../services/mealService';
import {
  getAllIngredients,
  Ingredient
} from '../../services/ingredientService';
import { useAuth } from '../../context/AuthContext';

// Fix for hydration issues - load these components only on client side
const ClientDialog = dynamic(() => Promise.resolve(Dialog), { ssr: false });
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });

const defaultMeal: Meal = {
  _id: '',
  userId: '',
  name: '',
  ingredients: [],
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  price: 0
};

const MealsPage: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const theme = useTheme();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal>(defaultMeal);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Use this to prevent rendering on server
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && isMounted) {
      fetchMeals();
      fetchIngredients();
    }
  }, [loading, isMounted]);

  const fetchMeals = async () => {
    try {
      setPageLoading(true);
      const data = await getAllMeals(graphqlClient, user);
      setMeals(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load meals. Please try again later.');
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const data = await getAllIngredients(graphqlClient, user);
      setIngredients(data || []);
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    }
  };

  const handleOpenForm = (meal?: Meal) => {
    if (meal) {
      setCurrentMeal(meal);
      setIsEditing(true);
    } else {
      setCurrentMeal({
        ...defaultMeal,
        userId: user?._id || ''
      });
      setIsEditing(false);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleOpenDeleteDialog = (meal: Meal) => {
    setCurrentMeal(meal);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setCurrentMeal({
      ...currentMeal,
      [name]: value
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredientId || selectedQuantity <= 0) return;
    
    // Check if ingredient already exists in meal
    const existingIngredientIndex = currentMeal.ingredients.findIndex(
      (item) => item.ingredientId === selectedIngredientId
    );
    
    let updatedIngredients;
    
    if (existingIngredientIndex >= 0) {
      // Update the quantity of the existing ingredient
      updatedIngredients = [...currentMeal.ingredients];
      updatedIngredients[existingIngredientIndex] = {
        ...updatedIngredients[existingIngredientIndex],
        quantity: selectedQuantity
      };
    } else {
      // Add new ingredient to the meal
      updatedIngredients = [
        ...currentMeal.ingredients,
        { ingredientId: selectedIngredientId, quantity: selectedQuantity }
      ];
    }
    
    // Calculate macros and price based on ingredients
    const updatedMeal = calculateMealNutrition(updatedIngredients);
    
    setCurrentMeal(updatedMeal);
    setSelectedIngredientId('');
    setSelectedQuantity(1);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    const updatedIngredients = currentMeal.ingredients.filter(
      (item) => item.ingredientId !== ingredientId
    );
    
    // Calculate macros and price based on ingredients
    const updatedMeal = calculateMealNutrition(updatedIngredients);
    
    setCurrentMeal(updatedMeal);
  };

  const calculateMealNutrition = (mealIngredients: MealIngredient[]): Meal => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalPrice = 0;
    
    mealIngredients.forEach(mealIngredient => {
      const ingredient = ingredients.find(i => i._id === mealIngredient.ingredientId);
      if (ingredient) {
        // Calculate proportionally based on quantity
        const ratio = mealIngredient.quantity;
        totalCalories += ingredient.macros.calories * ratio;
        totalProtein += ingredient.macros.protein * ratio;
        totalCarbs += ingredient.macros.carbs * ratio;
        totalFat += ingredient.macros.fat * ratio;
        totalPrice += (ingredient.price || 0) * (mealIngredient.quantity / ingredient.quantity);
      }
    });
    
    return {
      ...currentMeal,
      ingredients: mealIngredients,
      macros: {
        calories: parseFloat(totalCalories.toFixed(2)),
        protein: parseFloat(totalProtein.toFixed(2)),
        carbs: parseFloat(totalCarbs.toFixed(2)),
        fat: parseFloat(totalFat.toFixed(2))
      },
      price: parseFloat(totalPrice.toFixed(2))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPageLoading(true);
      if (isEditing) {
        await updateMeal(graphqlClient, currentMeal._id, currentMeal);
        setSnackbar({
          open: true,
          message: 'Meal updated successfully!',
          severity: 'success'
        });
      } else {
        const { _id, ...newMeal } = currentMeal;
        newMeal.userId = user?._id || '';
        await createMeal(graphqlClient, newMeal);
        setSnackbar({
          open: true,
          message: 'Meal created successfully!',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchMeals();
    } catch (err) {
      setSnackbar({
        open: true,
        message: isEditing 
          ? 'Failed to update meal. Please try again.' 
          : 'Failed to create meal. Please try again.',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setPageLoading(true);
      await deleteMeal(graphqlClient, currentMeal._id);
      setSnackbar({
        open: true,
        message: 'Meal deleted successfully!',
        severity: 'success'
      });
      handleCloseDeleteDialog();
      fetchMeals();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete meal. Please try again.',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getIngredientNameById = (id: string): string => {
    const ingredient = ingredients.find(i => i._id === id);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  if (!isMounted) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  return (
    <Container>
      <Box 
        sx={{ 
          my: 4,
          position: 'relative',
          minHeight: '80vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(156, 39, 176, 0.08), transparent 70%), radial-gradient(circle at 70% 80%, rgba(156, 39, 176, 0.05), transparent 50%)',
            pointerEvents: 'none',
            zIndex: -1
          }
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.secondary.main,
            textShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.4)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 3,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '60px',
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${alpha(theme.palette.secondary.main, 0.2)})`,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.7)}`
            }
          }}
        >
          <FastfoodIcon 
            fontSize="large" 
            sx={{
              filter: `drop-shadow(0 0 8px ${alpha(theme.palette.secondary.main, 0.7)})`
            }}
          />
          My Meals
        </Typography>
        
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ 
            mb: 4,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 'medium',
            boxShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.4)}`,
            background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.dark, 0.95)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 0 25px ${alpha(theme.palette.secondary.main, 0.6)}`,
              transform: 'translateY(-2px)'
            }
          }}
        >
          Add New Meal
        </Button>
        
        {loading && pageLoading && !openForm && !openDeleteDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : meals.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any meals yet. Create your first one!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Number of Ingredients</TableCell>
                  <TableCell>Calories</TableCell>
                  <TableCell>Protein (g)</TableCell>
                  <TableCell>Carbs (g)</TableCell>
                  <TableCell>Fat (g)</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meals.map((meal) => (
                  <TableRow key={meal._id}>
                    <TableCell>{meal.name}</TableCell>
                    <TableCell>{meal.ingredients.length}</TableCell>
                    <TableCell>{meal.macros.calories}</TableCell>
                    <TableCell>{meal.macros.protein}</TableCell>
                    <TableCell>{meal.macros.carbs}</TableCell>
                    <TableCell>{meal.macros.fat}</TableCell>
                    <TableCell>${meal.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenForm(meal)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(meal)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create/Edit Meal Form Dialog */}
        <ClientDialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditing ? 'Edit Meal' : 'Add New Meal'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    autoFocus
                    name="name"
                    label="Meal Name"
                    fullWidth
                    required
                    value={currentMeal.name}
                    onChange={handleChange}
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
                    onClick={handleAddIngredient}
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
                      {currentMeal.ingredients.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No ingredients added yet
                        </Typography>
                      ) : (
                        currentMeal.ingredients.map((item) => (
                          <Chip
                            key={item.ingredientId}
                            label={`${getIngredientNameById(item.ingredientId)} (${item.quantity})`}
                            onClick={() => {
                                setSelectedIngredientId(item.ingredientId);
                                setSelectedQuantity(item.quantity);
                            }}
                            onDelete={() => handleRemoveIngredient(item.ingredientId)}
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
                    value={currentMeal.macros.calories}
                  />
                </Grid>
                
                <Grid size={3}>
                  <TextField
                    label="Protein (g)"
                    type="number"
                    fullWidth
                    disabled
                    value={currentMeal.macros.protein}
                  />
                </Grid>
                
                <Grid size={3}>
                  <TextField
                    label="Carbs (g)"
                    type="number"
                    fullWidth
                    disabled
                    value={currentMeal.macros.carbs}
                  />
                </Grid>
                
                <Grid size={3}>
                  <TextField
                    label="Fat (g)"
                    type="number"
                    fullWidth
                    disabled
                    value={currentMeal.macros.fat}
                  />
                </Grid>
                
                <Grid size={12}>
                  <TextField
                    label="Total Price"
                    type="number"
                    fullWidth
                    disabled
                    value={currentMeal.price}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseForm}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading && pageLoading}
              >
                {(loading && pageLoading) ? <CircularProgress size={24} /> : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </ClientDialog>

        {/* Delete Confirmation Dialog */}
        <ClientDialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            Are you sure you want to delete the meal "{currentMeal.name}"? 
            This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={loading && pageLoading}
            >
              {(loading && pageLoading) ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </ClientDialog>

        {/* Snackbar for notifications */}
        <ClientSnackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </ClientSnackbar>
      </Box>
    </Container>
  );
};

export default MealsPage;
