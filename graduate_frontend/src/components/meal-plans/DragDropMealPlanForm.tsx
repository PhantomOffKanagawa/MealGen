"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  Button, 
  TextField,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import NutritionTracker from '@/components/dnd/NutritionTracker';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { MealPlan, MealPlanItem } from '@/services/mealPlanService';
import { Ingredient } from '@/services/ingredientService';
import { Meal } from '@/services/mealService';
import { Column } from '@/components/dnd/Column';
import { Item } from '@/components/dnd/Item';

interface DragDropMealPlanFormProps {
  open: boolean;
  isEditing: boolean;
  loading: boolean;
  currentMealPlan: MealPlan;
  ingredients: Ingredient[];
  meals: Meal[];
  onClose: () => void;
  onSubmit: () => void;
  onMealPlanChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DragDropMealPlanForm: React.FC<DragDropMealPlanFormProps> = ({
  open,
  isEditing,
  loading,
  currentMealPlan,
  ingredients,
  meals,
  onClose,
  onSubmit,
  onMealPlanChange,
}) => {
  // Memoize the mapped items to prevent recreating them on every render
  const { ingredientItems, mealItems, itemsData } = useMemo(() => {
    // Convert ingredients and meals to the format expected by the DnD components
    const ingredientItems = ingredients.map(ing => ({
      id: ing._id,
      name: ing.name,
      type: 'ingredient' as const,
      calories: ing.macros?.calories || 0,
      price: ing.price || 0,
      macros: ing.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }));

    const mealItems = meals.map(meal => ({
      id: meal._id,
      name: meal.name,
      type: 'meal' as const,
      calories: meal.macros?.calories || 0,
      price: meal.price || 0,
      macros: meal.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }));

    // Create a mapping of all items for easy lookup
    const itemsData: { [key: string]: any } = {};
    [...ingredientItems, ...mealItems].forEach(item => {
      itemsData[item.id] = item;
    });

    return { ingredientItems, mealItems, itemsData };
  }, [ingredients, meals]);

  // Default column structures
  const defaultColumns = useMemo(() => ({
    'ingredients-store': {
      id: 'ingredients-store',
      title: 'Ingredients',
      type: 'ingredient-store',
      isFixed: true
    },
    'meals-store': {
      id: 'meals-store',
      title: 'Meals',
      type: 'meal-store',
      isFixed: true
    },
  }), []);
  
  // Default item collections
  const defaultItems = useMemo(() => ({
    'ingredients-store': ingredientItems.map(i => i.id),
    'meals-store': mealItems.map(m => m.id),
  }), [ingredientItems, mealItems]);

  // State to track if initial setup is done
  const [initialized, setInitialized] = useState(false);
  
  // Structure to hold item IDs for each column
  const [items, setItems] = useState(defaultItems);
  
  // Store column data
  const [columns, setColumns] = useState(defaultColumns);
    // Column orders
  const [storeColumnOrder] = useState(['ingredients-store', 'meals-store']);
  const [mealPlanOrder, setMealPlanOrder] = useState<string[]>([]);

  // Name for the meal plan
  const [mealPlanName, setMealPlanName] = useState('');
  
  // Flag to track dialog opening to prevent multiple initializations
  const [previouslyOpen, setPreviouslyOpen] = useState(false);
  
  // Track item quantities for meal plan items
  const [itemQuantities, setItemQuantities] = useState<{[itemId: string]: number}>({});
  
  // Track total nutrition for display in the summary
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    price: 0
  });
  
  // Initialize form with meal plan data when opened
  useEffect(() => {
    // Only run this effect when the dialog opens (from closed to open)
    // or when key dependencies change while dialog is open
    if (open && currentMealPlan) {
      if (!previouslyOpen || !initialized) {
        // Set the meal plan name
        setMealPlanName(currentMealPlan.name);
        
        // Get unique groups from current meal plan
        const uniqueGroups = new Set<string>();
        currentMealPlan.items.forEach(item => {
          uniqueGroups.add(item.group || 'General');
        });

        // Create new columns and items structures (don't modify existing state)
        const newColumns = { ...defaultColumns };
        const newItems = {
          'ingredients-store': [...defaultItems['ingredients-store']],
          'meals-store': [...defaultItems['meals-store']],
        };
        
        const groupOrder: string[] = [];

        // Set up groups and distribute items
        uniqueGroups.forEach(group => {
          const groupId = `group-${group.replace(/\s+/g, '-').toLowerCase()}`;
          groupOrder.push(groupId);
          
          newColumns[groupId] = {
            id: groupId,
            title: group,
            type: 'meal-plan',
            isFixed: false
          };
          
          // Collect all items for this group
          const groupItemIds = currentMealPlan.items
            .filter(item => (item.group || 'General') === group)
            .map(item => item.itemId);
            
          newItems[groupId] = groupItemIds;
          
          // Remove these items from the stores
          if (groupItemIds.length > 0) {
            newItems['ingredients-store'] = newItems['ingredients-store']
              .filter(id => !groupItemIds.includes(id));
            newItems['meals-store'] = newItems['meals-store']
              .filter(id => !groupItemIds.includes(id));
          }
        });

        // Update state in one batch without causing circular updates
        setColumns(newColumns);
        setItems(newItems);
        setMealPlanOrder(groupOrder);
        setInitialized(true);
      }
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setInitialized(false);
    }
    
    // Update the previouslyOpen tracking variable
    setPreviouslyOpen(open);
    
  }, [open, currentMealPlan, defaultColumns, defaultItems, initialized]);
  
  // Recalculate nutrition whenever items or quantities change
  useEffect(() => {
    if (initialized) {
      calculateTotalNutrition();
    }
  }, [items, itemQuantities, mealPlanOrder]);

  // Handle quantity changes for items
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
    
    // Recalculate nutrition after quantity change
    calculateTotalNutrition();
  };
  
  // Calculate total calories and macros for a group
  const calculateGroupNutrition = (groupId: string) => {
    return items[groupId]?.reduce((total, itemId) => {
      const item = itemsData[itemId];
      const quantity = itemQuantities[itemId] || 1;
      
      if (item) {
        return {
          calories: total.calories + ((item.macros?.calories || 0) * quantity),
          protein: total.protein + ((item.macros?.protein || 0) * quantity),
          carbs: total.carbs + ((item.macros?.carbs || 0) * quantity),
          fat: total.fat + ((item.macros?.fat || 0) * quantity)
        };
      }
      return total;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  };

  // Calculate total price for a group
  const calculateGroupPrice = (groupId: string) => {
    return items[groupId]?.reduce((total, itemId) => {
      const item = itemsData[itemId];
      const quantity = itemQuantities[itemId] || 1;
      return total + ((item?.price || 0) * quantity);
    }, 0) || 0;
  };
  
  // Calculate total nutrition for all meal plan groups
  const calculateTotalNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalPrice = 0;
    
    mealPlanOrder.forEach(groupId => {
      const nutrition = calculateGroupNutrition(groupId);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
      totalPrice += calculateGroupPrice(groupId);
    });
    
    setTotalNutrition({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      price: totalPrice
    });
  };

  // Format column title with nutritional info
  const getColumnTitle = (columnId: string) => {
    if (!columns[columnId]) return columnId;
    
    // For meal plan columns, show calories
    if (columns[columnId].type === 'meal-plan') {
      const calories = calculateGroupNutrition(columnId).calories;
      return `${columns[columnId].title} (${calories} cal)`;
    }
    
    // For stores, just use the title
    return columns[columnId].title;
  };
  
  // Add a new meal plan group
  const addNewGroup = () => {
    const groupId = `group-${Date.now()}`;
    
    // Add empty list to items state
    setItems(prev => ({
      ...prev,
      [groupId]: []
    }));
    
    // Add new column data
    setColumns(prev => ({
      ...prev,
      [groupId]: {
        id: groupId,
        title: 'New Group',
        type: 'meal-plan',
        isFixed: false
      }
    }));
    
    // Add to meal plan order
    setMealPlanOrder(prev => [...prev, groupId]);
  };
  
  // Remove a meal plan group
  const removeGroup = (groupId: string) => {
    // Get the items from the group being deleted
    const groupItems = [...(items[groupId] || [])];
    
    // Create a copy of the current items state
    const updatedItems = { ...items };
    
    // Return items to their respective stores based on type
    groupItems.forEach(itemId => {
      const itemType = itemsData[itemId]?.type;
      if (itemType === 'ingredient') {
        updatedItems['ingredients-store'] = [...updatedItems['ingredients-store'], itemId];
      } else if (itemType === 'meal') {
        updatedItems['meals-store'] = [...updatedItems['meals-store'], itemId];
      }
    });
    
    // Remove the deleted group from items
    const { [groupId]: removedGroup, ...remainingItems } = updatedItems;
    setItems(remainingItems);
    
    // Remove from columns data
    const { [groupId]: removedColumn, ...remainingColumns } = columns;
    setColumns(remainingColumns);
    
    // Remove from meal plan order
    setMealPlanOrder(prev => prev.filter(id => id !== groupId));
  };
  
  // Handle group name change
  const handleGroupNameChange = (groupId: string, newName: string) => {
    setColumns(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        title: newName
      }
    }));
  };

  // Convert the drag-drop state back to the MealPlan format expected by the API
  const saveMealPlan = () => {
    // Update the current meal plan name from the text field
    currentMealPlan.name = mealPlanName;
    
    // Create items array from the groups
    const updatedItems: MealPlanItem[] = [];
    
    mealPlanOrder.forEach(groupId => {
      const groupName = columns[groupId].title;
      
      items[groupId].forEach(itemId => {
        const item = itemsData[itemId];
        if (item) {
          updatedItems.push({
            type: item.type,
            itemId: itemId,
            quantity: itemQuantities[itemId] || 1, // Use tracked quantity or default to 1
            group: groupName
          });
        }
      });
    });
    
    // Update meal plan items
    currentMealPlan.items = updatedItems;
    
    // Use the already calculated nutrition values from our tracker
    currentMealPlan.macros = {
      calories: totalNutrition.calories,
      protein: totalNutrition.protein,
      carbs: totalNutrition.carbs,
      fat: totalNutrition.fat
    };
    currentMealPlan.price = totalNutrition.price;
    
    // Call the parent onSubmit to save the meal plan
    onSubmit();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: 'background.default' }
      }}
    >
      <AppBar position="static" sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {isEditing ? 'Edit Meal Plan' : 'Create New Meal Plan'}
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<AddIcon />}
            onClick={addNewGroup}
          >
            Add Group
          </Button>
          <Button 
            color="inherit" 
            startIcon={<SaveIcon />}
            onClick={saveMealPlan}
            disabled={loading}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 3 }}>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          name="name"
          label="Meal Plan Name"
          type="text"
          fullWidth
          variant="outlined"
          value={mealPlanName}
          onChange={(e) => setMealPlanName(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        {/* Nutrition Tracker Summary */}
        <NutritionTracker nutrition={totalNutrition} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DragDropProvider
            onDragOver={(event) => {
              const { source } = event.operation;
              
              // Handle column reordering if the source is a column
              if (source && source.type === 'column') {
                // Only allow reordering non-fixed columns
                const columnId = source.id;
                if (!columns[columnId]?.isFixed) {
                  setMealPlanOrder((order) => move(order, event));
                  return;
                }
                return;
              }
              
              // Handle item reordering
              setItems((items) => move(items, event));
            }}
          >
            <Box 
              sx={{
                display: 'flex',
                gap: 4,
                justifyContent: 'space-between'
              }}
            >
              {/* Left side - Meal plan groups */}
              <Box 
                sx={{
                  flex: '1 1 auto',
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                  Meal Plan Groups
                </Typography>
                {mealPlanOrder.map((columnId, index) => (
                  <Column 
                    key={columnId} 
                    id={columnId} 
                    index={index} 
                    title={getColumnTitle(columnId)}
                    type={columns[columnId].type}
                    onTitleChange={handleGroupNameChange}
                    onDelete={removeGroup}
                  >
                    {items[columnId]?.map((id, index) => {
                      const itemData = itemsData[id];
                      return itemData ? (
                        <Item 
                          key={id} 
                          id={id} 
                          index={index} 
                          column={columnId}
                          name={itemData.name}
                          type={itemData.type}
                          calories={itemData.macros?.calories}
                          quantity={itemQuantities[id] || 1}
                          onQuantityChange={handleQuantityChange}
                        />
                      ) : null;
                    })}
                  </Column>
                ))}
              </Box>
              
              {/* Right side - Ingredients and Meals stores */}
              <Box 
                sx={{
                  flex: '0 0 320px',
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                  Available Items
                </Typography>
                {storeColumnOrder.map((columnId, index) => (
                  <Column 
                    key={columnId} 
                    id={columnId} 
                    index={index} 
                    title={getColumnTitle(columnId)}
                    type={columns[columnId].type}
                  >
                    {items[columnId]?.map((id, index) => {
                      const itemData = itemsData[id];
                      return itemData ? (
                        <Item 
                          key={id} 
                          id={id} 
                          index={index} 
                          column={columnId}
                          name={itemData.name}
                          type={itemData.type}
                          calories={itemData.macros?.calories}
                          quantity={itemQuantities[id] || 1}
                          onQuantityChange={handleQuantityChange}
                        />
                      ) : null;
                    })}
                  </Column>
                ))}
              </Box>
            </Box>
          </DragDropProvider>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={saveMealPlan} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          Save Meal Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DragDropMealPlanForm;
