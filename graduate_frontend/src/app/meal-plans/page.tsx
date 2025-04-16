/**
 * Meal Plans Page
 * 
 * Main page component for managing meal plans. Allows users to view, create, 
 * edit, and delete meal plans. Meal plans can contain ingredients and meals
 * that are organized into groups, with automatic calculation of nutritional 
 * information and price.
 */
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, CircularProgress,
  Paper, useTheme, alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useAuth } from '../../context/AuthContext';
import graphqlClient from '../../services/graphql';
import { 
  getAllMealPlans, 
  createMealPlan, 
  updateMealPlan, 
  deleteMealPlan,
  MealPlan,
  MealPlanItem
} from '../../services/mealPlanService';
import { getAllIngredients, Ingredient } from '../../services/ingredientService';
import { getAllMeals, Meal } from '../../services/mealService';

// Import the component files we created
import MealPlanTable from '../../components/meal-plans/MealPlanTable';
import DeleteConfirmationDialog from '../../components/meal-plans/DeleteConfirmationDialog';
import NotificationSnackbar from '../../components/meal-plans/NotificationSnackbar';
import MealPlanForm from '@/components/meal-plans/MealPlanForm';
import DragDropMealPlanForm from '@/components/dnd/DragDropMealPlanForm';

/** Default meal plan structure for creating new plans */
const defaultMealPlan: MealPlan = {
  _id: '',
  userId: '',
  name: '',
  items: [],
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  price: 0
};

/**
 * MealPlansPage Component
 * 
 * Main container component for the meal plans feature.
 * Manages state and data fetching for all child components.
 * Features a modern neon UI design with glow effects.
 */
const MealPlansPage: React.FC = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  // State for meal plans and related data
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state management
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan>(defaultMealPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // State for adding new items to a meal plan
  const [currentItem, setCurrentItem] = useState<MealPlanItem>({
    type: 'ingredient',
    itemId: '',
    quantity: 1,
    group: 'General'
  });
  const [availableGroups, setAvailableGroups] = useState<string[]>(['General']);
  const [newGroup, setNewGroup] = useState('');
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Client-side rendering guard
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && isMounted && user) {
      fetchData();
    }
  }, [loading, isMounted, user]);

  /**
   * Fetches all required data: meal plans, ingredients, and meals
   * Also extracts unique group names from existing meal plans
   */
  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [mealPlansData, ingredientsData, mealsData] = await Promise.all([
        getAllMealPlans(graphqlClient, user),
        getAllIngredients(graphqlClient, user),
        getAllMeals(graphqlClient, user)
      ]);
      
      setMealPlans(mealPlansData || []);
      setIngredients(ingredientsData || []);
      setMeals(mealsData || []);
      
      // Extract all unique groups from existing meal plans
      if (mealPlansData && mealPlansData.length > 0) {
        const groups = new Set<string>(['General']);
        mealPlansData.forEach((plan: { items: any[]; }) => {
          plan.items.forEach(item => {
            if (item.group) groups.add(item.group);
          });
        });
        setAvailableGroups(Array.from(groups));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  /**
   * Opens the meal plan form dialog
   * If a meal plan is provided, enters edit mode; otherwise, create mode
   */
  const handleOpenForm = (mealPlan?: MealPlan) => {
    if (mealPlan) {
      setCurrentMealPlan(mealPlan);
      setIsEditing(true);
    } else {
      setCurrentMealPlan({
        ...defaultMealPlan,
        userId: user?._id || ''
      });
      setIsEditing(false);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleOpenDeleteDialog = (mealPlan: MealPlan) => {
    setCurrentMealPlan(mealPlan);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  /**
   * Adds an item (ingredient or meal) to the current meal plan
   * Validates the selection and updates macros and price
   */
  const handleAddItem = (type: "meal" | "ingredient") => {
    // Update the current item type
    setCurrentItem({
      ...currentItem,
      type: type,
    });

    // Validate item selection
    if (!currentItem.itemId) {
      setSnackbar({
        open: true,
        message: 'Please select an item to add',
        severity: 'error'
      });
      return;
    }

    // Check if the item already exists in the meal plan
    const itemExists = currentMealPlan.items.some(
      item => item.type === currentItem.type && item.itemId === currentItem.itemId
    );

    if (itemExists) {
      setSnackbar({
        open: true,
        message: `This ${currentItem.type} is already in your meal plan`,
        severity: 'error'
      });
      return;
    }

    // Add the new item to the meal plan
    const updatedItems = [...currentMealPlan.items, currentItem];
    
    // Calculate updated macros and price
    const updatedMacrosAndPrice = calculateMacrosAndPrice(updatedItems);
    
    setCurrentMealPlan({
      ...currentMealPlan,
      items: updatedItems,
      ...updatedMacrosAndPrice
    });

    // Reset the current item form
    setCurrentItem({
      type: 'ingredient',
      itemId: '',
      quantity: 1,
      group: 'General'
    });
  };

  /**
   * Removes an item from the current meal plan
   * Recalculates macros and price afterward
   */
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...currentMealPlan.items];
    updatedItems.splice(index, 1);
    
    // Calculate updated macros and price
    const updatedMacrosAndPrice = calculateMacrosAndPrice(updatedItems);
    
    setCurrentMealPlan({
      ...currentMealPlan,
      items: updatedItems,
      ...updatedMacrosAndPrice
    });
  };

  /**
   * Updates the quantity of an item in the current meal plan
   * Recalculates macros and price afterward
   */
  const handleUpdateItemQuantity = (itemIndex: number, newQuantity: number) => {
    const updatedItems = [...currentMealPlan.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: newQuantity
    };
    
    const updatedMacrosAndPrice = calculateMacrosAndPrice(updatedItems);
    
    setCurrentMealPlan({
      ...currentMealPlan,
      items: updatedItems,
      ...updatedMacrosAndPrice
    });
  };

  /**
   * Calculates macronutrients and price based on the items in the meal plan
   */
  const calculateMacrosAndPrice = (items: MealPlanItem[]) => {
    const initialValues = {
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      price: 0
    };
    
    return items.reduce((acc, item) => {
      if (item.type === 'ingredient') {
        const ingredient = ingredients.find(i => i._id === item.itemId);
        if (ingredient) {
          acc.macros.calories += (ingredient.macros.calories * item.quantity);
          acc.macros.protein += (ingredient.macros.protein * item.quantity);
          acc.macros.carbs += (ingredient.macros.carbs * item.quantity);
          acc.macros.fat += (ingredient.macros.fat * item.quantity);
          acc.price += (ingredient.price * item.quantity);
        }
      } else if (item.type === 'meal') {
        const meal = meals.find(m => m._id === item.itemId);
        if (meal) {
          acc.macros.calories += (meal.macros.calories * item.quantity);
          acc.macros.protein += (meal.macros.protein * item.quantity);
          acc.macros.carbs += (meal.macros.carbs * item.quantity);
          acc.macros.fat += (meal.macros.fat * item.quantity);
          acc.price += (meal.price * item.quantity);
        }
      }
      return acc;
    }, initialValues);
  };

  /**
   * Adds a new group to the available groups list
   * Updates the current item to use the new group
   */
  const handleAddGroup = () => {
    if (newGroup && !availableGroups.includes(newGroup)) {
      setAvailableGroups([...availableGroups, newGroup]);
      setCurrentItem({...currentItem, group: newGroup});
      setNewGroup('');
    }
  };

  /**
   * Handles changes to the meal plan name field
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMealPlan({
      ...currentMealPlan,
      [name]: value
    });
  };

  /**
   * Handles changes to the current item form fields
   */
  const handleItemChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      // Parse quantity to number to avoid GraphQL type errors
      if (name === 'quantity') {
        setCurrentItem({
          ...currentItem,
          [name]: parseFloat(value as string) || 0
        });
      } else {
        setCurrentItem({
          ...currentItem,
          [name]: value
        });
      }
    }
  };

  /**
   * Submits the meal plan form for creation or update
   */
  const handleSubmit = async () => {    
    // Validate form
    if (!currentMealPlan.name) {
      setSnackbar({
        open: true,
        message: 'Please provide a name for the meal plan',
        severity: 'error'
      });
      return;
    }

    try {
      setPageLoading(true);
      if (isEditing) {
        await updateMealPlan(graphqlClient, currentMealPlan._id, currentMealPlan);
        setSnackbar({
          open: true,
          message: 'Meal plan updated successfully!',
          severity: 'success'
        });
      } else {
        const { _id, ...newMealPlan } = currentMealPlan;
        newMealPlan.userId = user?._id || '';
        await createMealPlan(graphqlClient, newMealPlan);
        setSnackbar({
          open: true,
          message: 'Meal plan created successfully!',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchData(); // Refresh the data
    } catch (err) {
      setSnackbar({
        open: true,
        message: isEditing 
          ? 'Failed to update meal plan. Please try again.' 
          : 'Failed to create meal plan. Please try again.',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  /**
   * Deletes the current meal plan
   */
  const handleDelete = async () => {
    try {
      setPageLoading(true);
      await deleteMealPlan(graphqlClient, currentMealPlan._id);
      setSnackbar({
        open: true,
        message: 'Meal plan deleted successfully!',
        severity: 'success'
      });
      handleCloseDeleteDialog();
      fetchData(); // Refresh the data
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete meal plan. Please try again.',
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

  /**
   * Helper function to find item name by id
   */
  const getItemName = (type: string, itemId: string) => {
    if (type === 'ingredient') {
      const ingredient = ingredients.find(i => i._id === itemId);
      return ingredient ? ingredient.name : 'Unknown';
    } else {
      const meal = meals.find(m => m._id === itemId);
      return meal ? meal.name : 'Unknown';
    }
  };

  if (!isMounted) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }  return (
    <Container maxWidth="lg">      <Box 
        sx={{ 
          my: 4,
          position: 'relative',
          minHeight: '80vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(25, 118, 210, 0.08), transparent 70%), radial-gradient(circle at 80% 80%, rgba(66, 66, 255, 0.05), transparent 50%)',
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
            color: theme.palette.primary.main,
            textShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
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
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.2)})`,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.7)}`
            }
          }}
        >
          <RestaurantMenuIcon 
            fontSize="large" 
            sx={{
              filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.7)})`
            }}
          />
          My Meal Plans
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ 
            mb: 4,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 'medium',
            boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.85)})`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 0 25px ${alpha(theme.palette.primary.main, 0.6)}`,
              transform: 'translateY(-2px)'
            }
          }}
        >
          Create New Meal Plan
        </Button>
        
        {/* Display meal plans table */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            position: 'relative',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 2,
              padding: '1px',
              background: `linear-gradient(90deg, 
                ${alpha(theme.palette.primary.main, 0.7)}, 
                ${alpha(theme.palette.secondary.main, 0.7)}, 
                ${alpha(theme.palette.success.main, 0.7)})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none'
            }
          }}
        >
          <MealPlanTable 
            loading={loading && pageLoading && !openForm && !openDeleteDialog}
            error={error}
            mealPlans={mealPlans}
            onEdit={handleOpenForm}
            onDelete={handleOpenDeleteDialog}
          />
        </Paper>        {/* Create/Edit Meal Plan Form Dialog */}
        <DragDropMealPlanForm
          open={openForm}
          isEditing={isEditing}
          loading={loading && pageLoading}
          currentMealPlan={currentMealPlan}
          ingredients={ingredients}
          meals={meals}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          onMealPlanChange={handleChange}
        />

        {/* Delete Confirmation Dialog with neon styling */}
        <DeleteConfirmationDialog
          open={openDeleteDialog}
          mealPlan={currentMealPlan}
          loading={loading && pageLoading}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDelete}
        />

        {/* Enhanced Notifications with glow effects */}
        <NotificationSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </Box>
    </Container>
  );
};

export default MealPlansPage;
