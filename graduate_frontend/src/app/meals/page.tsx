"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Box, CircularProgress, Snackbar, Alert,
  useTheme, alpha, Typography, Card, CardContent, Grid
} from '@mui/material';
import FastfoodIcon from '@mui/icons-material/Fastfood';
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
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Column } from '@/components/DataTable';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

// Fix for hydration issues - load these components only on client side
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });
const MealEditDialog = dynamic(
  () => import('@/components/meals/MealEditDialog'), 
  { ssr: false }
);

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
  const { user, loading } = useAuth();
  const theme = useTheme();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal>(defaultMeal);
  const [isEditing, setIsEditing] = useState(false);
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

  const handleAddIngredient = (ingredientId: string, quantity: number) => {
    if (!ingredientId || quantity <= 0) return;
    
    // Check if ingredient already exists in meal
    const existingIngredientIndex = currentMeal.ingredients.findIndex(
      (item) => item.ingredientId === ingredientId
    );
    
    let updatedIngredients;
    
    if (existingIngredientIndex >= 0) {
      // Update the quantity of the existing ingredient
      updatedIngredients = [...currentMeal.ingredients];
      updatedIngredients[existingIngredientIndex] = {
        ...updatedIngredients[existingIngredientIndex],
        quantity: quantity
      };
    } else {
      // Add new ingredient to the meal
      updatedIngredients = [
        ...currentMeal.ingredients,
        { ingredientId, quantity }
      ];
    }
    
    // Calculate macros and price based on ingredients
    const updatedMeal = calculateMealNutrition(updatedIngredients);
    
    setCurrentMeal(updatedMeal);
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
        totalPrice += (ingredient.price || 0) * (mealIngredient.quantity);
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

  // Define table columns with unique ids
  const columns: Column[] = [
    { 
      id: 'name', 
      label: 'Name',
      format: (value) => <span style={{ fontWeight: 'medium' }}>{value}</span>
    },
    { 
      id: 'ingredients', 
      label: 'Number of Ingredients',
      format: (value) => value.length
    },
    { 
      id: 'macros.calories', 
      label: 'Calories',
      format: (value, row) => <span style={{ color: theme.palette.error.main }}>{row.macros.calories}</span>
    },
    { 
      id: 'macros.protein', 
      label: 'Protein (g)',
      format: (value, row) => <span style={{ color: theme.palette.info.main }}>{row.macros.protein}</span>
    },
    { 
      id: 'macros.carbs', 
      label: 'Carbs (g)',
      format: (value, row) => <span style={{ color: theme.palette.warning.main }}>{row.macros.carbs}</span>
    },
    { 
      id: 'macros.fat', 
      label: 'Fat (g)',
      format: (value, row) => <span style={{ color: '#FFA726' }}>{row.macros.fat}</span>
    },
    { 
      id: 'price', 
      label: 'Price',
      format: (value) => <span style={{ color: theme.palette.success.main, fontWeight: 'medium' }}>${value.toFixed(2)}</span>
    }
  ];

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
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${alpha(theme.palette.secondary.dark, 0.9)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
          color: "white",
          py: { xs: 6, md: 8 },
          mb: 4,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid size={12}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight="bold"
                sx={{
                  textShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.3)}`,
                }}
              >
                Create Your Meals
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Combine ingredients into balanced meals with automatic nutrition tracking
              </Typography>
            </Grid>
            <Grid size={12} sx={{ textAlign: 'center' }}>
              <FastfoodIcon sx={{ fontSize: 100, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        <Box sx={{ position: 'relative', minHeight: '80vh' }}>
          <PageHeader 
            title="My Meals"
            icon={<FastfoodIcon />}
            color="secondary"
            onAddNew={() => handleOpenForm()}
            addButtonText="Create New Meal"
          />
          
          {loading && pageLoading && !openForm && !openDeleteDialog ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          ) : meals.length === 0 ? (
            <Card sx={{ 
              my: 4, 
              boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <FastfoodIcon sx={{ fontSize: 60, color: alpha(theme.palette.secondary.main, 0.6), mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Meals Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't created any meals yet. Click "Create New Meal" to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <DataTable 
              columns={columns}
              data={meals}
              color="secondary"
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
              getRowId={(row) => row._id}
            />
          )}

          {/* Create/Edit Meal Form Dialog */}
          <MealEditDialog
            open={openForm}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            meal={currentMeal}
            onChange={handleChange}
            isEditing={isEditing}
            loading={loading && pageLoading}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the meal "${currentMeal.name}"? This action cannot be undone.`}
            loading={loading && pageLoading}
          />

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
    </>
  );
};

export default MealsPage;
