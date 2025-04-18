/**
 * GroupedItemsList Component
 *
 * Displays meal plan items grouped by their category with the ability
 * to edit quantities or remove items from the meal plan.
 */
import React from "react";
import {
  Box,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { MealPlanItem } from "../../services/mealPlanService";

interface GroupedItemsListProps {
  groupedItems: Record<string, MealPlanItem[]>;
  onUpdateQuantity: (itemIndex: number, newQuantity: number) => void;
  onRemoveItem: (itemIndex: number) => void;
  getItemName: (type: string, itemId: string) => string;
  getItemIndex: (item: MealPlanItem) => number;
}

const GroupedItemsList: React.FC<GroupedItemsListProps> = ({
  groupedItems,
  onUpdateQuantity,
  onRemoveItem,
  getItemName,
  getItemIndex,
}) => {
  if (Object.keys(groupedItems).length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No items added to this meal plan yet.
      </Alert>
    );
  }

  return (
    <>
      {Object.entries(groupedItems).map(([group, items]) => (
        <Box key={group} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
              {group}
            </Typography>
            <Chip
              label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
              size="small"
              color="primary"
            />
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => {
                  const itemIndex = getItemIndex(item);
                  return (
                    <TableRow key={`${item.type}-${item.itemId}-${index}`}>
                      <TableCell>
                        {item.type === "ingredient" ? "Ingredient" : "Meal"}
                      </TableCell>
                      <TableCell>
                        {getItemName(item.type, item.itemId)}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            onUpdateQuantity(
                              itemIndex,
                              parseFloat(e.target.value) || 0,
                            );
                          }}
                          inputProps={{ min: 0.1, step: 0.1 }}
                          sx={{ width: "80px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveItem(itemIndex)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </>
  );
};

export default GroupedItemsList;
