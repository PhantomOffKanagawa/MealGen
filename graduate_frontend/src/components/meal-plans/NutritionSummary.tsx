/**
 * NutritionSummary Component
 * 
 * Displays a summary table of nutritional information for a meal plan,
 * including calories, macronutrients, and price.
 */
import React from 'react';
import {
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Paper
} from '@mui/material';
import { MacroNutrients } from '../../services/mealPlanService';

interface NutritionSummaryProps {
  macros: MacroNutrients;
  price: number;
}

const NutritionSummary: React.FC<NutritionSummaryProps> = ({ macros, price }) => {
  return (
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
            <TableCell>{macros.calories.toFixed(0)}</TableCell>
            <TableCell>{macros.protein.toFixed(1)}</TableCell>
            <TableCell>{macros.carbs.toFixed(1)}</TableCell>
            <TableCell>{macros.fat.toFixed(1)}</TableCell>
            <TableCell>${price.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NutritionSummary;
