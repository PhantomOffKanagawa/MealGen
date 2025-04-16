import React from 'react';
import {
  Box, Paper, Typography, Grid, Divider
} from '@mui/material';

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
}

interface NutritionTrackerProps {
  nutrition: NutritionSummary;
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ nutrition }) => {
  const formatNumber = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Meal Plan Nutrition Summary
      </Typography>
      <Divider sx={{ my: 1 }} />
      
      <Grid container spacing={2}>
        <Grid size={12} >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h4" fontWeight="bold" color="error">
              {formatNumber(nutrition.calories)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calories
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={4} >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatNumber(nutrition.protein)}g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Protein
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={4} >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#FFA726' }}>
              {formatNumber(nutrition.carbs)}g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carbs
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={4} >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#66BB6A' }}>
              {formatNumber(nutrition.fat)}g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fat
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={12}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              ${formatNumber(nutrition.price)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Price
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NutritionTracker;
