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
  ButtonGroup,
  useTheme,
  alpha
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
  const theme = useTheme();
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
  return (    <Card 
      ref={ref}
      sx={{
        margin: '8px',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        boxShadow: isDragging 
          ? `0 0 15px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.5)}` 
          : `0 2px 8px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.2)}`,
        cursor: 'grab',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        border: isIngredient 
          ? `1px solid ${alpha(theme.palette.success.main, 0.4)}` 
          : `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
        borderLeft: isIngredient 
          ? `4px solid ${theme.palette.success.main}` 
          : `4px solid ${theme.palette.secondary.main}`,
        color: isIngredient 
          ? theme.palette.success.main 
          : theme.palette.secondary.main,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          boxShadow: `inset 0 0 10px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.4)}`,
          pointerEvents: 'none'
        },
        '&:hover': {
          boxShadow: `0 4px 15px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.4)}`,
          transform: 'translateY(-2px)',
          '&::after': {
            opacity: 1
          }
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1}>          {image ? (
            <Avatar 
              src={image} 
              alt={name} 
              sx={{ 
                width: 40, 
                height: 40,
                boxShadow: `0 0 0 2px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.3)}`
              }} 
            />
          ) : (
            <Avatar 
              sx={{ 
                bgcolor: isIngredient 
                  ? alpha(theme.palette.success.main, 0.8) 
                  : alpha(theme.palette.secondary.main, 0.8), 
                width: 40, 
                height: 40,
                backdropFilter: 'blur(8px)'
              }}
            >
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
              </Typography>              {calories && (
                <Chip 
                  label={`${calories * itemQuantity} cal`} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    color: isIngredient ? theme.palette.success.main : theme.palette.secondary.main,
                    borderColor: isIngredient 
                      ? alpha(theme.palette.success.main, 0.5) 
                      : alpha(theme.palette.secondary.main, 0.5),
                    height: 20, 
                    fontSize: '0.65rem',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { 
                      backgroundColor: isIngredient 
                        ? alpha(theme.palette.success.main, 0.1) 
                        : alpha(theme.palette.secondary.main, 0.1) 
                    }
                  }} 
                />
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Quantity controls - only show for items in meal plans (not in stores) */}
        {showQuantityControls && (          <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Quantity:
            </Typography>
            <ButtonGroup 
              size="small" 
              variant="outlined" 
              color={isIngredient ? "success" : "secondary"}
              sx={{
                borderRadius: '8px',
                '& .MuiButtonGroup-grouped': {
                  border: isIngredient 
                    ? `1px solid ${alpha(theme.palette.success.main, 0.5)}` 
                    : `1px solid ${alpha(theme.palette.secondary.main, 0.5)}`
                }
              }}
            >              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(itemQuantity - 1)}
                disabled={itemQuantity <= 1}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  borderRadius: '4px',
                  border: `1px solid ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.5)}`,
                  boxShadow: `0 0 5px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.2)}`,
                  color: isIngredient ? theme.palette.success.main : theme.palette.secondary.main,
                  padding: 0,
                  '&:hover': {
                    backgroundColor: isIngredient 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : alpha(theme.palette.secondary.main, 0.15),
                    boxShadow: `0 0 8px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.4)}`
                  },
                  '&:disabled': {
                    opacity: 0.3,
                    boxShadow: 'none'
                  }
                }}
              >
                <RemoveIcon style={{ fontSize: '16px' }} />
              </IconButton>
              
              <TextField
                size="small"
                value={itemQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                inputProps={{ 
                  style: { 
                    width: '32px', 
                    padding: '2px 0px', 
                    textAlign: 'center',
                    color: isIngredient 
                      ? theme.palette.success.main 
                      : theme.palette.secondary.main,
                    fontWeight: 'bold'
                  },
                  min: 1,
                  max: 99
                }}
                sx={{
                  margin: '0 4px',
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: '4px',
                  border: `1px solid ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.5)}`,
                  boxShadow: `0 0 5px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.2)}`,
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    '& fieldset': { border: 'none' },
                    '&:hover': {
                      boxShadow: `0 0 8px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.4)}`
                    }
                  }
                }}
              />
              
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(itemQuantity + 1)}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  borderRadius: '4px',
                  border: `1px solid ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.5)}`,
                  boxShadow: `0 0 5px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.2)}`,
                  color: isIngredient ? theme.palette.success.main : theme.palette.secondary.main,
                  padding: 0,
                  '&:hover': {
                    backgroundColor: isIngredient 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : alpha(theme.palette.secondary.main, 0.15),
                    boxShadow: `0 0 8px ${alpha(isIngredient ? theme.palette.success.main : theme.palette.secondary.main, 0.4)}`
                  }
                }}
              >
                <AddIcon style={{ fontSize: '16px' }} />
              </IconButton>
            </ButtonGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}