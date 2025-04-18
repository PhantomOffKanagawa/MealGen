/**
 * ItemFormTabs Component
 *
 * A tabbed interface that allows users to add ingredients or meals to a meal plan.
 * Provides fields for selecting items, quantities, and organizing them into groups.
 */
import React from "react";
import {
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Ingredient } from "../../services/ingredientService";
import { Meal } from "../../services/mealService";
import { MealPlanItem } from "../../services/mealPlanService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meal-plan-tabpanel-${index}`}
      aria-labelledby={`meal-plan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ItemFormTabsProps {
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  ingredients: Ingredient[];
  meals: Meal[];
  currentItem: MealPlanItem;
  onItemChange: (
    e: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => void;
  availableGroups: string[];
  newGroup: string;
  onNewGroupChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddGroup: () => void;
  onAddItem: (type: "ingredient" | "meal") => void;
}

const ItemFormTabs: React.FC<ItemFormTabsProps> = ({
  tabValue,
  onTabChange,
  ingredients,
  meals,
  currentItem,
  onItemChange,
  availableGroups,
  newGroup,
  onNewGroupChange,
  onAddGroup,
  onAddItem,
}) => {
  // Common group selection and new group fields for both tabs
  const renderGroupSelectionFields = () => (
    <>
      <Grid size={12}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="group-select-label">Group</InputLabel>
          <Select
            labelId="group-select-label"
            name="group"
            value={currentItem.group}
            onChange={onItemChange as any}
            label="Group"
          >
            {availableGroups.map((group) => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={12} container spacing={1}>
        <Grid size={9}>
          <TextField
            label="New Group"
            fullWidth
            value={newGroup}
            onChange={onNewGroupChange}
          />
        </Grid>
        <Grid size={3}>
          <Button
            variant="contained"
            onClick={onAddGroup}
            sx={{ height: "100%", width: "100%" }}
          >
            Add Group
          </Button>
        </Grid>
      </Grid>
    </>
  );

  return (
    <>
      <Tabs value={tabValue} onChange={onTabChange} aria-label="item type tabs">
        <Tab
          label="Ingredients"
          id="ingredients-tab"
          aria-controls="ingredients-panel"
        />
        <Tab label="Meals" id="meals-tab" aria-controls="meals-panel" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="ingredient-select-label">
                Select Ingredient
              </InputLabel>
              <Select
                labelId="ingredient-select-label"
                name="itemId"
                value={currentItem.itemId}
                onChange={onItemChange as any}
                label="Select Ingredient"
              >
                <MenuItem value="">
                  <em>Select an ingredient</em>
                </MenuItem>
                {ingredients.map((ingredient) => (
                  <MenuItem key={ingredient._id} value={ingredient._id}>
                    {ingredient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              margin="normal"
              value={currentItem.quantity}
              onChange={onItemChange as any}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Grid>

          {renderGroupSelectionFields()}

          <Grid size={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onAddItem("ingredient")}
              fullWidth
              startIcon={<AddIcon />}
              disabled={!currentItem.itemId || currentItem.quantity <= 0}
            >
              Add Ingredient
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="meal-select-label">Select Meal</InputLabel>
              <Select
                labelId="meal-select-label"
                name="itemId"
                value={currentItem.itemId}
                onChange={onItemChange as any}
                label="Select Meal"
              >
                <MenuItem value="">
                  <em>Select a meal</em>
                </MenuItem>
                {meals.map((meal) => (
                  <MenuItem key={meal._id} value={meal._id}>
                    {meal.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              margin="normal"
              value={currentItem.quantity}
              onChange={onItemChange as any}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Grid>

          {renderGroupSelectionFields()}

          <Grid size={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onAddItem("meal")}
              fullWidth
              startIcon={<AddIcon />}
              disabled={!currentItem.itemId || currentItem.quantity <= 0}
            >
              Add Meal
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </>
  );
};

export default ItemFormTabs;
