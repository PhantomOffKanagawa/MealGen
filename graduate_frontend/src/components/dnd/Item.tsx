import React, { useState, useEffect } from 'react';
import {useSortable} from '@dnd-kit/react/sortable';
import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Box, 
  Avatar, 
  IconButton, 
  TextField,
  ButtonGroup
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface ItemProps {
  id: string;
  index: number;
  column: string;
  type: 'ingredient' | 'meal';
  name: string;
  calories?: number;
  image?: string;
  quantity?: number;
  onQuantityChange?: (id: string, quantity: number) => void;
}

export function Item({ id, index, column, type, name, calories, image, quantity = 1, onQuantityChange }: ItemProps) {
  const {ref, isDragging} = useSortable({
    id,
    index,
    type: 'item',
    accept: 'item',
    group: column
  });
  
  // Local quantity state that syncs with props
  const [itemQuantity, setItemQuantity] = useState(quantity);
  
  // Show quantity controls only for items in meal plan columns, not in stores
  const showQuantityControls = !['ingredients-store', 'meals-store'].includes(column);
  
  const isIngredient = type === 'ingredient';
  
  // Update local state when prop changes
  useEffect(() => {
    setItemQuantity(quantity);
  }, [quantity]);
  
  // Handle quantity changes
  const handleQuantityChange = (newQuantity: number) => {
    // Prevent negative quantities
    if (newQuantity <= 0) newQuantity = 1;
    
    setItemQuantity(newQuantity);
    if (onQuantityChange) {
      onQuantityChange(id, newQuantity);
    }
  };

  return (
    <Card 
      ref={ref}
      sx={{
        margin: '8px',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s',
        boxShadow: isDragging ? '0 0 10px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'grab',
        backgroundColor: isIngredient ? '#f5fbf1' : '#f8f4ff',
        borderLeft: isIngredient ? '4px solid #66bb6a' : '4px solid #7e57c2',
        color: isIngredient ? '#66bb6a' : '#7e57c2',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1}>
          {image ? (
            <Avatar src={image} alt={name} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar sx={{ bgcolor: isIngredient ? '#66bb6a' : '#7e57c2', width: 40, height: 40 }}>
              {isIngredient ? <KitchenIcon /> : <RestaurantIcon />}
            </Avatar>
          )}
          <Box flexGrow={1}>
            <Typography variant="body1" fontWeight="medium">
              {name}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {isIngredient ? 'Ingredient' : 'Meal'}
              </Typography>
              {calories && (
                <Chip 
                  label={`${calories * itemQuantity} cal`} 
                  size="small" 
                  variant="outlined"
                  sx={{ color: isIngredient ? '#66bb6a' : '#7e57c2', height: 20, fontSize: '0.65rem' }} 
                />
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Quantity controls - only show for items in meal plans (not in stores) */}
        {showQuantityControls && (
          <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Quantity:
            </Typography>
            <ButtonGroup size="small" variant="outlined" color={isIngredient ? "success" : "secondary"}>
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(itemQuantity - 1)}
                disabled={itemQuantity <= 1}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              
              <TextField
                size="small"
                value={itemQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                inputProps={{ 
                  style: { width: '40px', padding: '2px 4px', textAlign: 'center' },
                  min: 1,
                  max: 99
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { border: 'none' },
                  }
                }}
              />
              
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(itemQuantity + 1)}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </ButtonGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}