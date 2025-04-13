"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Typography, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Grid, CircularProgress, Snackbar, Alert,
  MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../context/AuthContext';
import graphqlClient from '../../services/graphql';
import { 
  getAllMealPlans, 
  createMealPlan, 
  updateMealPlan, 
  deleteMealPlan,
  MealPlan,
  MealPlanItem,
  MacroNutrients
} from '../../services/mealPlanService';
import { getAllIngredients, Ingredient } from '../../services/ingredientService';
import { getAllMeals, Meal } from '../../services/mealService';

// Fix for hydration issues - load these components only on client side
const ClientDialog = dynamic(() => Promise.resolve(Dialog), { ssr: false });
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meal-plan-tabpanel-${index}`}
      aria-labelledby={`meal-plan-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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

const MealPlansPage: React.FC = () => {
  const { user, loading } = useAuth();

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan>(defaultMealPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [currentItem, setCurrentItem] = useState<MealPlanItem>({
    type: 'ingredient',
    itemId: '',
    quantity: 1,
    group: 'General'
  });
  const [availableGroups, setAvailableGroups] = useState<string[]>(['General']);
  const [newGroup, setNewGroup] = useState('');
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
      fetchData();
    }
  }, [loading, isMounted]);

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

  const handleAddGroup = () => {
    if (newGroup && !availableGroups.includes(newGroup)) {
      setAvailableGroups([...availableGroups, newGroup]);
      setCurrentItem({...currentItem, group: newGroup});
      setNewGroup('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMealPlan({
      ...currentMealPlan,
      [name]: value
    });
  };

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

  const handleTypeChange = (type: 'ingredient' | 'meal') => {
    setCurrentItem({
      ...currentItem,
      type,
      itemId: '' // Reset selected item when type changes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  // Helper function to find item name by id
  const getItemName = (type: string, itemId: string) => {
    if (type === 'ingredient') {
      const ingredient = ingredients.find(i => i._id === itemId);
      return ingredient ? ingredient.name : 'Unknown';
    } else {
      const meal = meals.find(m => m._id === itemId);
      return meal ? meal.name : 'Unknown';
    }
  };

  const groupedItems = currentMealPlan.items.reduce((groups, item) => {
    const group = item.group || 'General';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, MealPlanItem[]>);

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
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Meal Plans
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ mb: 3 }}
        >
          Create New Meal Plan
        </Button>
        
        {loading && pageLoading && !openForm && !openDeleteDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : mealPlans.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any meal plans yet. Create your first one!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Calories</TableCell>
                  <TableCell>Protein (g)</TableCell>
                  <TableCell>Carbs (g)</TableCell>
                  <TableCell>Fat (g)</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mealPlans.map((mealPlan) => (
                  <TableRow key={mealPlan._id}>
                    <TableCell>{mealPlan.name}</TableCell>
                    <TableCell>{mealPlan.items.length}</TableCell>
                    <TableCell>{mealPlan.macros.calories.toFixed(0)}</TableCell>
                    <TableCell>{mealPlan.macros.protein.toFixed(1)}</TableCell>
                    <TableCell>{mealPlan.macros.carbs.toFixed(1)}</TableCell>
                    <TableCell>{mealPlan.macros.fat.toFixed(1)}</TableCell>
                    <TableCell>${mealPlan.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenForm(mealPlan)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(mealPlan)}
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

        {/* Create/Edit Meal Plan Form Dialog */}
        <ClientDialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditing ? 'Edit Meal Plan' : 'Create New Meal Plan'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    autoFocus
                    name="name"
                    label="Meal Plan Name"
                    fullWidth
                    required
                    value={currentMealPlan.name}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Add Items to Meal Plan
                  </Typography>
                  
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="item type tabs">
                    <Tab label="Ingredients" id="ingredients-tab" aria-controls="ingredients-panel" />
                    <Tab label="Meals" id="meals-tab" aria-controls="meals-panel" />
                  </Tabs>
                  
                  <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="ingredient-select-label">Select Ingredient</InputLabel>
                          <Select
                            labelId="ingredient-select-label"
                            name="itemId"
                            value={currentItem.itemId}
                            onChange={handleItemChange as any}
                            label="Select Ingredient"
                          >
                            <MenuItem value="">
                              <em>Select an ingredient</em>
                            </MenuItem>
                            {ingredients.map((ingredient) => (
                              <MenuItem key={ingredient._id} value={ingredient._id}>
                                {ingredient.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={12}>
                        <TextField
                          name="quantity"
                          label="Quantity"
                          type="number"
                          fullWidth
                          margin="normal"
                          value={currentItem.quantity}
                          onChange={handleItemChange as any}
                          inputProps={{ min: 0.1, step: 0.1 }}
                        />
                      </Grid>
                      
                      <Grid size={12}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="group-select-label">Group</InputLabel>
                          <Select
                            labelId="group-select-label"
                            name="group"
                            value={currentItem.group}
                            onChange={handleItemChange as any}
                            label="Group"
                          >
                            {availableGroups.map((group) => (
                              <MenuItem key={group} value={group}>
                                {group}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={12} container spacing={1}>
                        <Grid size={9}>
                          <TextField
                            label="New Group"
                            fullWidth
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                          />
                        </Grid>
                        <Grid size={3}>
                          <Button 
                            variant="contained" 
                            onClick={handleAddGroup}
                            sx={{ height: '100%', width: '100%' }}
                          >
                            Add Group
                          </Button>
                        </Grid>
                      </Grid>
                      
                      <Grid size={12}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => handleAddItem("ingredient")}
                          fullWidth
                          startIcon={<AddIcon />}
                          disabled={!currentItem.itemId || currentItem.quantity <= 0}
                        >
                          Add Ingredient
                        </Button>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  
                  <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="meal-select-label">Select Meal</InputLabel>
                          <Select
                            labelId="meal-select-label"
                            name="itemId"
                            value={currentItem.itemId}
                            onChange={handleItemChange as any}
                            label="Select Meal"
                          >
                            <MenuItem value="">
                              <em>Select a meal</em>
                            </MenuItem>
                            {meals.map((meal) => (
                              <MenuItem key={meal._id} value={meal._id}>
                                {meal.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={12}>
                        <TextField
                          name="quantity"
                          label="Quantity"
                          type="number"
                          fullWidth
                          margin="normal"
                          value={currentItem.quantity}
                          onChange={handleItemChange as any}
                          inputProps={{ min: 0.1, step: 0.1 }}
                        />
                      </Grid>
                      
                      <Grid size={12}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="group-select-label">Group</InputLabel>
                          <Select
                            labelId="group-select-label"
                            name="group"
                            value={currentItem.group}
                            onChange={handleItemChange as any}
                            label="Group"
                          >
                            {availableGroups.map((group) => (
                              <MenuItem key={group} value={group}>
                                {group}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={12} container spacing={1}>
                        <Grid size={9}>
                          <TextField
                            label="New Group"
                            fullWidth
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                          />
                        </Grid>
                        <Grid size={3}>
                          <Button 
                            variant="contained" 
                            onClick={handleAddGroup}
                            sx={{ height: '100%', width: '100%' }}
                          >
                            Add Group
                          </Button>
                        </Grid>
                      </Grid>
                      
                      <Grid size={12}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => handleAddItem("meal")}
                          fullWidth
                          startIcon={<AddIcon />}
                          disabled={!currentItem.itemId || currentItem.quantity <= 0}
                        >
                          Add Meal
                        </Button>
                      </Grid>
                    </Grid>
                  </TabPanel>
                </Grid>
                
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Current Items in Meal Plan
                  </Typography>
                  
                  {Object.keys(groupedItems).length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No items added to this meal plan yet.
                    </Alert>
                  ) : (
                    Object.entries(groupedItems).map(([group, items]) => (
                      <Box key={group} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
                            {group}
                          </Typography>
                          <Chip 
                            label={`${items.length} ${items.length === 1 ? 'item' : 'items'}`} 
                            size="small" 
                            color="primary" 
                          />
                        </Box>
                        
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Item</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.map((item, index) => {
                                const itemIndex = currentMealPlan.items.findIndex(i => 
                                  i.type === item.type && i.itemId === item.itemId && i.group === item.group
                                );
                                return (
                                  <TableRow key={`${item.type}-${item.itemId}-${index}`}>
                                    <TableCell>{item.type === 'ingredient' ? 'Ingredient' : 'Meal'}</TableCell>
                                    <TableCell>{getItemName(item.type, item.itemId)}</TableCell>
                                    <TableCell>
                                      <TextField 
                                        type="number"
                                        size="small"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const updatedItems = [...currentMealPlan.items];
                                          updatedItems[itemIndex] = {
                                            ...updatedItems[itemIndex],
                                            quantity: parseFloat(e.target.value) || 0
                                          };
                                          const updatedMacrosAndPrice = calculateMacrosAndPrice(updatedItems);
                                          setCurrentMealPlan({
                                            ...currentMealPlan,
                                            items: updatedItems,
                                            ...updatedMacrosAndPrice
                                          });
                                        }}
                                        inputProps={{ min: 0.1, step: 0.1 }}
                                        sx={{ width: '80px' }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={() => handleRemoveItem(itemIndex)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))
                  )}
                </Grid>
                
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Nutrition Summary
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Calories</TableCell>
                          <TableCell>Protein (g)</TableCell>
                          <TableCell>Carbs (g)</TableCell>
                          <TableCell>Fat (g)</TableCell>
                          <TableCell>Price ($)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{currentMealPlan.macros.calories.toFixed(0)}</TableCell>
                          <TableCell>{currentMealPlan.macros.protein.toFixed(1)}</TableCell>
                          <TableCell>{currentMealPlan.macros.carbs.toFixed(1)}</TableCell>
                          <TableCell>{currentMealPlan.macros.fat.toFixed(1)}</TableCell>
                          <TableCell>${currentMealPlan.price.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
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
            Are you sure you want to delete the meal plan "{currentMealPlan.name}"? 
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

export default MealPlansPage;
