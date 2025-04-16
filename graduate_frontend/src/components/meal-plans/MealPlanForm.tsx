/**
 * MealPlanForm Component
 * 
 * A form for creating or editing meal plans. Includes fields for the meal plan name,
 * tabs for adding ingredients and meals, and displays current items and nutrition summary.
 */
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, CircularProgress,
  Box
} from '@mui/material';
import { MealPlan, MealPlanItem } from '../../services/mealPlanService';
import { Ingredient } from '../../services/ingredientService';
import { Meal } from '../../services/mealService';
import ItemFormTabs from './ItemFormTabs';
import GroupedItemsList from './GroupedItemsList';
import NutritionSummary from './NutritionSummary';

interface MealPlanFormProps {
  open: boolean;
  isEditing: boolean;
  loading: boolean;
  currentMealPlan: MealPlan;
  currentItem: MealPlanItem;
  tabValue: number;
  ingredients: Ingredient[];
  meals: Meal[];
  availableGroups: string[];
  newGroup: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onMealPlanChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onItemChange: (e: React.ChangeEvent<{ name?: string; value: unknown }>) => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onAddItem: (type: 'ingredient' | 'meal') => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemQuantity: (itemIndex: number, newQuantity: number) => void;
  onNewGroupChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddGroup: () => void;
  getItemName: (type: string, itemId: string) => string;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({
  open,
  isEditing,
  loading,
  currentMealPlan,
  currentItem,
  tabValue,
  ingredients,
  meals,
  availableGroups,
  newGroup,
  onClose,
  onSubmit,
  onMealPlanChange,
  onItemChange,
  onTabChange,
  onAddItem,
  onRemoveItem,
  onUpdateItemQuantity,
  onNewGroupChange,
  onAddGroup,
  getItemName
}) => {
  // Group items by their group property
  const groupedItems = currentMealPlan.items.reduce((groups, item) => {
    const group = item.group || 'General';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, MealPlanItem[]>);

  // Helper function to find item index in the meal plan items array
  const getItemIndex = (item: MealPlanItem) => {
    return currentMealPlan.items.findIndex(i => 
      i.type === item.type && i.itemId === item.itemId && i.group === item.group
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Meal Plan' : 'Create New Meal Plan'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
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
                onChange={onMealPlanChange}
                margin="normal"
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Add Items to Meal Plan
              </Typography>
              
              <ItemFormTabs
                tabValue={tabValue}
                onTabChange={onTabChange}
                ingredients={ingredients}
                meals={meals}
                currentItem={currentItem}
                onItemChange={onItemChange}
                availableGroups={availableGroups}
                newGroup={newGroup}
                onNewGroupChange={onNewGroupChange}
                onAddGroup={onAddGroup}
                onAddItem={onAddItem}
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Current Items in Meal Plan
              </Typography>
              
              <GroupedItemsList
                groupedItems={groupedItems}
                getItemName={getItemName}
                getItemIndex={getItemIndex}
                onUpdateQuantity={onUpdateItemQuantity}
                onRemoveItem={onRemoveItem}
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Nutrition Summary
              </Typography>
              <NutritionSummary 
                macros={currentMealPlan.macros} 
                price={currentMealPlan.price} 
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

export default MealPlanForm;
