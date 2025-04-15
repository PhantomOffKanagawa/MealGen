"use client";

import React, { useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { Column } from '@/components/dnd/Column';
import { Item } from '@/components/dnd/Item';
import { Typography, Container, Box, AppBar, Toolbar, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
// import '@/app/dnd/styles.css';

// Mock data for ingredients and meals
const mockIngredients: ItemData[] = [
  { id: 'i1', name: 'Chicken Breast', type: 'ingredient', calories: 165 },
  { id: 'i2', name: 'Brown Rice', type: 'ingredient', calories: 215 },
  { id: 'i3', name: 'Broccoli', type: 'ingredient', calories: 55 },
  { id: 'i4', name: 'Sweet Potato', type: 'ingredient', calories: 115 },
  { id: 'i5', name: 'Salmon', type: 'ingredient', calories: 206 },
  { id: 'i6', name: 'Quinoa', type: 'ingredient', calories: 222 },
];

const mockMeals: ItemData[] = [
  { id: 'm1', name: 'Chicken Rice Bowl', type: 'meal', calories: 450 },
  { id: 'm2', name: 'Salmon Salad', type: 'meal', calories: 380 },
  { id: 'm3', name: 'Vegetarian Stir Fry', type: 'meal', calories: 320 },
];

// Create mappings from ID to full item data
interface ItemData {
  id: string;
  name: string;
  type: 'ingredient' | 'meal';
  calories: number;
  image?: string;
}

// Column data interface
interface ColumnData {
  id: string;
  title: string;
  type: 'ingredient-store' | 'meal-store' | 'meal-plan';
  isFixed: boolean;
}

// Create item data mapping
const itemsData: { [key: string]: ItemData } = {};
[...mockIngredients, ...mockMeals].forEach(item => {
  itemsData[item.id] = item;
});

// Create column data mapping
const columnsData: { [key: string]: ColumnData } = {
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
  'breakfast': {
    id: 'breakfast',
    title: 'Breakfast',
    type: 'meal-plan',
    isFixed: false
  },
  'lunch': {
    id: 'lunch',
    title: 'Lunch',
    type: 'meal-plan',
    isFixed: false
  },
  'dinner': {
    id: 'dinner',
    title: 'Dinner',
    type: 'meal-plan',
    isFixed: false
  }
};

interface ItemsState {
  [key: string]: string[];
}

export default function App() {
  // Structure to hold item IDs for each column
  const [items, setItems] = useState<ItemsState>({
    'ingredients-store': mockIngredients.map(i => i.id),
    'meals-store': mockMeals.map(m => m.id),
    'breakfast': [],
    'lunch': [],
    'dinner': [],
  });
  
  // Store column data
  const [columns, setColumns] = useState(columnsData);
  
  // Track column order (all columns, including fixed ones)
  const [columnOrder, setColumnOrder] = useState(['ingredients-store', 'meals-store']);
  
  // Track meal plan column order (draggable columns only)
  const [mealPlanOrder, setMealPlanOrder] = useState(['breakfast', 'lunch', 'dinner']);

  const calculateTotalCalories = (columnId: string) => {
    return items[columnId]?.reduce((total, itemId) => {
      return total + (itemsData[itemId]?.calories || 0);
    }, 0) || 0;
  };

  const getColumnTitle = (columnId: string) => {
    if (!columns[columnId]) return columnId;
    
    // For meal plan columns, show calories
    if (columns[columnId].type === 'meal-plan') {
      return `${columns[columnId].title} (${calculateTotalCalories(columnId)} cal)`;
    }
    
    // For stores, just use the title
    return columns[columnId].title;
  };

  const getColumnType = (columnId: string) => {
    return columns[columnId]?.type || 'meal-plan';
  };
  
  // Check if a column is a fixed store (ingredients or meals)
  const isFixedStore = (columnId: string) => {
    return columns[columnId]?.isFixed || false;
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
    const groupItems = [...items[groupId]];
    
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

  const saveMealPlan = () => {
    const mealPlanData: { [key: string]: ItemData[] } = {};
    mealPlanOrder.forEach(groupId => {
      mealPlanData[columns[groupId].title] = items[groupId].map(id => itemsData[id]);
    });
    
    console.log('Saving meal plan:', mealPlanData);
    alert('Meal plan saved!');
  };

  return (
    <>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meal Plan Designer
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<SaveIcon />}
            onClick={saveMealPlan}
          >
            Save Plan
          </Button>
          <Button 
            color="inherit" 
            startIcon={<AddIcon />}
            onClick={addNewGroup}
          >
            Add Group
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Design Your Meal Plan
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Drag ingredients and meals from the right into your meal plan groups on the left. Groups can be renamed by clicking their title.
        </Typography>
        
        <DragDropProvider
          onDragOver={(event) => {
            const { source } = event.operation;
            
            // Handle column reordering if the source is a column
            if (source && source.type === 'column') {
              // Only allow reordering non-fixed columns
              const columnId = source.id;
              // if (!columns[columnId]?.isFixed) {
                setMealPlanOrder((order) => move(order, event));
                return;
              // }
              return;
            }
            
            // Handle item reordering if passed restrictions
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
            {/* Left side - Movable meal plan groups */}
            <Box 
              sx={{
                flex: '1 1 auto',
                display: 'flex', 
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                Your Meal Plan Groups
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
                  {items[columnId].map((id, index) => {
                    const itemData = itemsData[id];
                    return (
                      <Item 
                        key={id} 
                        id={id} 
                        index={index} 
                        column={columnId}
                        name={itemData.name}
                        type={itemData.type as 'ingredient' | 'meal'}
                        calories={itemData.calories}
                        image={itemData.image}
                      />
                    );
                  })}
                </Column>
              ))}
            </Box>
            
            {/* Right side - Fixed stores (ingredients and meals) */}
            <Box 
              sx={{
                flex: '0 0 320px',
                display: 'flex', 
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                Ingredient & Meal Stores
              </Typography>
              {columnOrder.map((columnId, index) => (
                <Column 
                  key={columnId} 
                  id={columnId} 
                  index={index} 
                  title={getColumnTitle(columnId)}
                  type={columns[columnId].type}
                >
                  {items[columnId].map((id, index) => {
                    const itemData = itemsData[id];
                    return (
                      <Item 
                        key={id} 
                        id={id} 
                        index={index} 
                        column={columnId}
                        name={itemData.name}
                        type={itemData.type as 'ingredient' | 'meal'}
                        calories={itemData.calories}
                        image={itemData.image}
                      />
                    );
                  })}
                </Column>
              ))}
            </Box>
          </Box>
        </DragDropProvider>
      </Container>
    </>
  );
}
