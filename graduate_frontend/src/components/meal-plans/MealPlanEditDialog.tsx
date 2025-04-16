'use client';

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Box, Chip, Stack,
  Tabs, Tab, Divider
} from '@mui/material';
import { MealPlan, MealPlanItem } from '../../services/mealPlanService';
import { Ingredient } from '../../services/ingredientService';
import { Meal } from '../../services/mealService';

interface MealPlanEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  mealPlan: MealPlan;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateItems: (items: MealPlanItem[]) => void;
  isEditing: boolean;
  loading: boolean;
  ingredients: Ingredient[];
  meals: Meal[];
  availableGroups: string[];
  onAddGroup: (newGroup: string) => boolean;
  getItemName: (type: string, itemId: string) => string;
}

const MealPlanEditDialog: React.FC<MealPlanEditDialogProps> = ({
  open,
  onClose,
  onSubmit,
  mealPlan,
  onChange,
  onUpdateItems,
  isEditing,
  loading,
  ingredients,
  meals,
  availableGroups,
  onAddGroup,
  getItemName
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [currentItem, setCurrentItem] = useState<MealPlanItem>({
    type: 'ingredient',
    itemId: '',
    quantity: 1,
    group: 'General'
  });
  const [newGroup, setNewGroup] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentItem({
      ...currentItem,
      type: newValue === 0 ? 'ingredient' : 'meal',
      itemId: ''
    });
  };

  const handleItemChange = (name: string, value: string | number) => {
    setCurrentItem({
      ...currentItem,
      [name]: value
    });
  };

  const handleAddItem = () => {
    if (!currentItem.itemId || currentItem.quantity <= 0) {
      return;
    }

    // Check if the item already exists in the meal plan
    const itemExists = mealPlan.items.some(
      item => item.type === currentItem.type && item.itemId === currentItem.itemId && item.group === currentItem.group
    );

    if (itemExists) {
      return;
    }

    const updatedItems = [...mealPlan.items, currentItem];
    onUpdateItems(updatedItems);

    // Reset current item
    setCurrentItem({
      type: tabValue === 0 ? 'ingredient' : 'meal',
      itemId: '',
      quantity: 1,
      group: currentItem.group
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...mealPlan.items];
    updatedItems.splice(index, 1);
    onUpdateItems(updatedItems);
  };

  const handleUpdateItemQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = [...mealPlan.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: newQuantity
    };
    
    onUpdateItems(updatedItems);
  };

  const handleAddNewGroup = () => {
    if (onAddGroup(newGroup)) {
      setCurrentItem({...currentItem, group: newGroup});
      setNewGroup('');
    }
  };

  // Group items by their group property
  const groupedItems = mealPlan.items.reduce((acc, item) => {
    const group = item.group || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, MealPlanItem[]>);

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
                value={mealPlan.name}
                onChange={onChange}
                margin="normal"
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Add Items to Meal Plan
              </Typography>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="item type tabs">
                <Tab label="Ingredients" />
                <Tab label="Meals" />
              </Tabs>
            </Grid>
            
            <Grid size={5}>
              <FormControl fullWidth>
                <InputLabel>{tabValue === 0 ? 'Select Ingredient' : 'Select Meal'}</InputLabel>
                <Select
                  value={currentItem.itemId}
                  onChange={(e) => handleItemChange('itemId', e.target.value as string)}
                  label={tabValue === 0 ? 'Select Ingredient' : 'Select Meal'}
                >
                  {tabValue === 0 ? 
                    ingredients.map(ingredient => (
                      <MenuItem key={ingredient._id} value={ingredient._id}>
                        {ingredient.name}
                      </MenuItem>
                    )) : 
                    meals.map(meal => (
                      <MenuItem key={meal._id} value={meal._id}>
                        {meal.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={3}>
              <TextField
                type="number"
                label="Quantity"
                fullWidth
                value={currentItem.quantity}
                onChange={(e) => handleItemChange('quantity', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.1, step: "any" }}
              />
            </Grid>
            
            <Grid size={4}>
              <FormControl fullWidth>
                <InputLabel>Group</InputLabel>
                <Select
                  value={currentItem.group}
                  onChange={(e) => handleItemChange('group', e.target.value as string)}
                  label="Group"
                >
                  {availableGroups.map(group => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                  <MenuItem value="__new">
                    <em>Add New Group...</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {currentItem.group === '__new' && (
              <>
                <Grid size={9}>
                  <TextField
                    label="New Group Name"
                    fullWidth
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                  />
                </Grid>
                <Grid size={3}>
                  <Button
                    variant="outlined"
                    onClick={handleAddNewGroup}
                    fullWidth
                    sx={{ height: '100%' }}
                    disabled={!newGroup}
                  >
                    Add Group
                  </Button>
                </Grid>
              </>
            )}
            
            <Grid size={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddItem}
                disabled={!currentItem.itemId || currentItem.quantity <= 0}
                sx={{ mt: 1 }}
              >
                Add to Meal Plan
              </Button>
            </Grid>
            
            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Meal Plan Contents
              </Typography>
            </Grid>
            
            {Object.keys(groupedItems).length === 0 ? (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  No items added to the meal plan yet
                </Typography>
              </Grid>
            ) : (
              Object.entries(groupedItems).map(([group, items]) => (
                <Grid size={12} key={group}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {group}:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {items.map((item, index) => {
                        const itemIndex = mealPlan.items.findIndex(
                          i => i.itemId === item.itemId && i.type === item.type && i.group === item.group
                        );
                        return (
                          <Chip
                            key={`${item.type}-${item.itemId}-${index}`}
                            label={`${getItemName(item.type, item.itemId)} (${item.quantity})`}
                            onClick={() => {
                              const newQuantity = prompt('Enter new quantity:', item.quantity.toString());
                              if (newQuantity !== null) {
                                const parsed = parseFloat(newQuantity);
                                if (!isNaN(parsed) && parsed > 0) {
                                  handleUpdateItemQuantity(itemIndex, parsed);
                                }
                              }
                            }}
                            onDelete={() => handleRemoveItem(itemIndex)}
                            sx={{ margin: '4px' }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </Grid>
              ))
            )}
            
            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Calculated Nutrition Information
              </Typography>
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Calories"
                type="number"
                fullWidth
                disabled
                value={mealPlan.macros.calories.toFixed(0)}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Protein (g)"
                type="number"
                fullWidth
                disabled
                value={mealPlan.macros.protein.toFixed(1)}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Carbs (g)"
                type="number"
                fullWidth
                disabled
                value={mealPlan.macros.carbs.toFixed(1)}
              />
            </Grid>
            
            <Grid size={3}>
              <TextField
                label="Fat (g)"
                type="number"
                fullWidth
                disabled
                value={mealPlan.macros.fat.toFixed(1)}
              />
            </Grid>
            
            <Grid size={12}>
              <TextField
                label="Total Price"
                type="number"
                fullWidth
                disabled
                value={mealPlan.price.toFixed(2)}
                InputProps={{
                  startAdornment: <span>$</span>
                }}
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

export default MealPlanEditDialog;
