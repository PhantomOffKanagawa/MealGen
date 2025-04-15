import React from 'react';
import {useSortable} from '@dnd-kit/react/sortable';
import { Card, CardContent, Typography, Chip, Box, Avatar } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';

interface ItemProps {
  id: string;
  index: number;
  column: string;
  type: 'ingredient' | 'meal';
  name: string;
  calories?: number;
  image?: string;
}

export function Item({ id, index, column, type, name, calories, image }: ItemProps) {
  const {ref, isDragging} = useSortable({
    id,
    index,
    type: 'item',
    accept: 'item',
    group: column
  });

  const isIngredient = type === 'ingredient';

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
                  label={`${calories} cal`} 
                  size="small" 
                  variant="outlined"
                  sx={{ color: isIngredient ? '#66bb6a' : '#7e57c2', height: 20, fontSize: '0.65rem' }} 
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}