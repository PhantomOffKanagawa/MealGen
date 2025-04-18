/**
 * MealPlanTable Component
 *
 * Displays a table of meal plans with their nutritional information and provides
 * actions to edit or delete them.
 */
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { MealPlan } from "../../services/mealPlanService";

interface MealPlanTableProps {
  loading: boolean;
  error: string | null;
  mealPlans: MealPlan[];
  onEdit: (mealPlan: MealPlan) => void;
  onDelete: (mealPlan: MealPlan) => void;
}

const MealPlanTable: React.FC<MealPlanTableProps> = ({
  loading,
  error,
  mealPlans,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        You don&apos;t have any meal plans yet. Create your first one!
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Calories</TableCell>
            <TableCell>Protein (g)</TableCell>
            <TableCell>Carbs (g)</TableCell>
            <TableCell>Fat (g)</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mealPlans.map((mealPlan) => (
            <TableRow key={mealPlan._id}>
              <TableCell>{mealPlan.name}</TableCell>
              <TableCell>{mealPlan.items.length}</TableCell>
              <TableCell>{mealPlan.macros.calories.toFixed(0)}</TableCell>
              <TableCell>{mealPlan.macros.protein.toFixed(1)}</TableCell>
              <TableCell>{mealPlan.macros.carbs.toFixed(1)}</TableCell>
              <TableCell>{mealPlan.macros.fat.toFixed(1)}</TableCell>
              <TableCell>${mealPlan.price.toFixed(2)}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => onEdit(mealPlan)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => onDelete(mealPlan)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MealPlanTable;
