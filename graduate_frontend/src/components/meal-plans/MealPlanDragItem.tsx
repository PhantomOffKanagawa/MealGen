/**
 * MealPlanDragItem Component
 * 
 * A draggable item used in the meal plan drag-and-drop interface.
 * Represents ingredients or meals that can be dragged between groups.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Card, CardContent, Typography, Box, Avatar, 
  TextField, InputAdornment 
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface MealPlanDragItemProps {
  id: string;
  index: number;
  column: string;
  name: string;
  type: 'ingredient' | 'meal';
  calories?: number;
  quantity?: number;
  onQuantityChange?: (newQuantity: number) => void;
}

const MealPlanDragItem: React.FC<MealPlanDragItemProps> = ({ 
  id, 
  index, 
  column, 
  name, 
  type, 
  calories = 0,
  quantity = 1,
  onQuantityChange
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({
    id,
    data: {
      index,
      type: 'item',
      group: column
    }
  });
  
  // Apply the transform styles from dnd-kit
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isIngredient = type === 'ingredient';
  const isInStore = column === 'ingredients-store' || column === 'meals-store';
  
  // Calculate total calories based on quantity
  const totalCalories = calories * quantity;

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value) || 0;
    if (onQuantityChange && newQuantity > 0) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        transition: transition || 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: isIngredient ? 'success.light' : 'primary.light',
              mr: 1.5
            }}
          >
            {isIngredient ? <KitchenIcon /> : <RestaurantIcon />}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap title={name}>
              {name}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <LocalFireDepartmentIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
              {totalCalories.toFixed(0)} calories
            </Typography>
          </Box>
          
          {/* Only show quantity field if item is in a meal plan group (not store) */}
          {!isInStore && onQuantityChange && (
            <TextField
              type="number"
              size="small"
              value={quantity}
              onChange={handleQuantityChange}
              onClick={(e) => e.stopPropagation()}
              inputProps={{ 
                min: 0.1, 
                step: 0.1,
                style: { padding: '2px 8px', fontSize: '0.85rem', width: '50px' } 
              }}
              variant="outlined"
              sx={{ ml: 1, width: '70px' }}
              InputProps={{
                endAdornment: isIngredient ? (
                  <InputAdornment position="end">
                    <Typography variant="caption">
                      {quantity === 1 ? 'unit' : 'units'}
                    </Typography>
                  </InputAdornment>
                ) : null
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MealPlanDragItem;
