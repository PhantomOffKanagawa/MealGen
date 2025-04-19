"use client";

import { Column } from "@/components/dnd/Column";
import { Item } from "@/components/dnd/Item";
import NutritionTracker from "@/components/meal-plans/NutritionTracker";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import {
  alpha,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Ingredient } from "../../services/ingredientService";
import { MealPlan, MealPlanItem } from "../../services/mealPlanService";
import { Meal } from "../../services/mealService";

interface ColumnData {
  id: string;
  title: string;
  type: "ingredient-store" | "meal-store" | "meal-plan";
  isFixed: boolean;
}

interface ItemsState {
  [key: string]: string[];
}

interface ColumnsState {
  [key: string]: ColumnData;
}

interface ItemQuantities {
  [key: string]: number;
}

interface DragDropMealPlanFormProps {
  open: boolean;
  isEditing: boolean;
  loading: boolean;
  currentMealPlan: MealPlan;
  ingredients: Ingredient[];
  meals: Meal[];
  updatePending: boolean;
  onClose: () => void;
  onSubmit: (close: boolean) => void;
  onMealPlanChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DragDropMealPlanForm: React.FC<DragDropMealPlanFormProps> = ({
  open,
  isEditing,
  loading,
  currentMealPlan,
  ingredients,
  meals,
  updatePending,
  onClose,
  onSubmit,
  onMealPlanChange,
}) => {
  // State for live edit mode toggle
  const [liveEditMode, setLiveEditMode] = useState(false);
  // State to track changes for live edit mode
  const [savingLiveEdit, setSavingLiveEdit] = useState(false);

  // Memoize the mapped items to prevent recreating them on every render
  const { ingredientItems, mealItems, itemsData } = useMemo(() => {
    // Convert ingredients and meals to the format expected by the DnD components
    const ingredientItems = ingredients.map((ing) => ({
      id: ing._id,
      name: ing.name,
      type: "ingredient" as const,
      price: ing.price || 0,
      macros: ing.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      quantity: ing.quantity || 1,
      unit: ing.unit || "g",
    }));

    const mealItems = meals.map((meal) => ({
      id: meal._id,
      name: meal.name,
      type: "meal" as const,
      price: meal.price || 0,
      macros: meal.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    }));

    // Create a mapping of all items for easy lookup
    const itemsData: { [key: string]: any } = {};
    [...ingredientItems, ...mealItems].forEach((item) => {
      itemsData[item.id] = item;
    });

    return { ingredientItems, mealItems, itemsData };
  }, [ingredients, meals]);

  // Default column structures
  const defaultColumns: ColumnsState = useMemo(
    () => ({
      "ingredients-store": {
        id: "ingredients-store",
        title: "Ingredients",
        type: "ingredient-store" as const,
        isFixed: true,
      },
      "meals-store": {
        id: "meals-store",
        title: "Meals",
        type: "meal-store" as const,
        isFixed: true,
      },
    }),
    [],
  );

  // Default item collections
  const defaultItems = useMemo(
    () => ({
      "ingredients-store": ingredientItems.map((i) => i.id),
      "meals-store": mealItems.map((m) => m.id),
    }),
    [ingredientItems, mealItems],
  );

  // State to track if initial setup is done
  const [initialized, setInitialized] = useState(false);

  // Structure to hold item IDs for each column
  const [items, setItems] = useState<ItemsState>(defaultItems);

  // Store column data
  const [columns, setColumns] = useState<ColumnsState>(defaultColumns);
  // Column orders
  const [storeColumnOrder] = useState(["ingredients-store", "meals-store"]);
  const [mealPlanOrder, setMealPlanOrder] = useState<string[]>([]);

  // Name for the meal plan
  const [mealPlanName, setMealPlanName] = useState("");

  // Flag to track dialog opening to prevent multiple initializations
  const [previouslyOpen, setPreviouslyOpen] = useState(false);

  // Track item quantities for meal plan items
  const [itemQuantities, setItemQuantities] = useState<ItemQuantities>({});

  // Track total nutrition for display in the summary
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    price: 0,
  });

  // Use a ref for tracking the need to recalculate nutrition
  const needsNutritionUpdate = useRef(false);
  
  // Initialize form with meal plan data when opened
  useEffect(() => {
    // Only run this effect when the dialog opens (from closed to open)
    // or when key dependencies change while dialog is open
    if (open && currentMealPlan) {
      if (updatePending || !previouslyOpen || !initialized) {
        // Set the meal plan name
        setMealPlanName(currentMealPlan.name);

        // Get unique groups from current meal plan
        const uniqueGroups = new Set<string>();
        const newItemQuantities: ItemQuantities = {};

        if (Object.keys(currentMealPlan.items).length === 0) {
          // Initialize items and columns if not already done
          const defaultGroups = ["Breakfast", "Lunch", "Dinner"];
          defaultGroups.forEach((group) => {
            uniqueGroups.add(group);
          });
        } else {
          currentMealPlan.items.forEach((item) => {
            uniqueGroups.add(item.group || "General");

            if (item?.itemId && item?.quantity) {
              newItemQuantities[item?.itemId] = item?.quantity || 1;
            }
          });
        }

        // Create new columns and items structures (don't modify existing state)
        const newColumns = { ...defaultColumns };
        const newItems: { [key: string]: string[] } = {
          "ingredients-store": [...defaultItems["ingredients-store"]],
          "meals-store": [...defaultItems["meals-store"]],
        };

        const groupOrder: string[] = [];

        // Set up groups and distribute items
        uniqueGroups.forEach((group) => {
          const groupId = `group-${group.replace(/\s+/g, "-").toLowerCase()}`;
          groupOrder.push(groupId);

          newColumns[groupId] = {
            id: groupId,
            title: group,
            type: "meal-plan",
            isFixed: false,
          };

          // Collect all items for this group
          const groupItemIds = currentMealPlan.items
            .filter((item) => (item.group || "General") === group)
            .map((item) => item.itemId);

          newItems[groupId] = groupItemIds;

          // Remove these items from the stores
          if (groupItemIds.length > 0) {
            newItems["ingredients-store"] = newItems[
              "ingredients-store"
            ].filter((id) => !groupItemIds.includes(id));
            newItems["meals-store"] = newItems["meals-store"].filter(
              (id) => !groupItemIds.includes(id),
            );
          }
        });

        // Update state in one batch without causing circular updates
        setColumns(newColumns);
        setItems(newItems);
        setMealPlanOrder(groupOrder);
        setItemQuantities(newItemQuantities);
        setInitialized(true);
        
        // Mark for nutrition update after state is set
        needsNutritionUpdate.current = true;
      }
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setInitialized(false);
    }

    // Update the previouslyOpen tracking variable
    setPreviouslyOpen(open);
  }, [open, currentMealPlan, defaultColumns, defaultItems, initialized, updatePending]);

  // Listen for new ingredients coming from websocket updates - with reduced dependencies
  useEffect(() => {
    if (!initialized || !open) return;
    
    // Get all ingredient IDs currently in meal plan groups
    const inUseIngredientIds = new Set<string>();
    mealPlanOrder.forEach((groupId) => {
      if (items[groupId]) {
        items[groupId].forEach((itemId) => {
          if (itemsData[itemId]?.type === "ingredient") {
            inUseIngredientIds.add(itemId);
          }
        });
      }
    });

    // Get current ingredient store IDs
    const currentIngredientStoreIds = new Set(
      items["ingredients-store"] || [],
    );

    // Find new ingredient IDs that aren't in the store or in use
    const newIngredientIds = ingredientItems
      .map((ing) => ing.id)
      .filter(
        (id) =>
          !currentIngredientStoreIds.has(id) && !inUseIngredientIds.has(id),
      );

    // If we have new ingredients, update the ingredients store
    if (newIngredientIds.length > 0) {
      console.log("Adding new ingredients to store:", newIngredientIds);
      setItems((prev) => ({
        ...prev,
        "ingredients-store": [
          ...prev["ingredients-store"],
          ...newIngredientIds,
        ],
      }));
    }
  }, [ingredients, initialized, open, items, mealPlanOrder, itemsData, ingredientItems]);

  // Listen for new meals coming from websocket updates - with reduced dependencies
  useEffect(() => {
    if (!initialized || !open) return;
    
    // Get all meal IDs currently in meal plan groups
    const inUseMealIds = new Set<string>();
    mealPlanOrder.forEach((groupId) => {
      if (items[groupId]) {
        items[groupId].forEach((itemId) => {
          if (itemsData[itemId]?.type === "meal") {
            inUseMealIds.add(itemId);
          }
        });
      }
    });

    // Get current meal store IDs
    const currentMealStoreIds = new Set(items["meals-store"] || []);

    // Find new meal IDs that aren't in the store or in use
    const newMealIds = mealItems
      .map((meal) => meal.id)
      .filter((id) => !currentMealStoreIds.has(id) && !inUseMealIds.has(id));

    // If we have new meals, update the meals store
    if (newMealIds.length > 0) {
      console.log("Adding new meals to store:", newMealIds);
      setItems((prev) => ({
        ...prev,
        "meals-store": [...prev["meals-store"], ...newMealIds],
      }));
    }
  }, [meals, initialized, open, items, mealPlanOrder, itemsData, mealItems]);

  // Memoized function to calculate nutrition for a group - prevents recalculation unless dependencies change
  const calculateGroupNutrition = useCallback((groupId: string) => {
    return (
      items[groupId]?.reduce(
        (total, itemId) => {
          const item = itemsData[itemId];
          const quantity = itemQuantities[itemId] || 1;

          if (item) {
            return {
              calories:
                total.calories + (item.macros?.calories || 0) * quantity,
              protein: total.protein + (item.macros?.protein || 0) * quantity,
              carbs: total.carbs + (item.macros?.carbs || 0) * quantity,
              fat: total.fat + (item.macros?.fat || 0) * quantity,
            };
          }
          return total;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items, itemQuantities, itemsData]);

  // Memoized function to calculate price for a group
  const calculateGroupPrice = useCallback((groupId: string) => {
    return (
      items[groupId]?.reduce((total, itemId) => {
        const item = itemsData[itemId];
        const quantity = itemQuantities[itemId] || 1;
        return total + (item?.price || 0) * quantity;
      }, 0) || 0
    );
  }, [items, itemQuantities, itemsData]);

  // Better optimized total nutrition calculation
  const calculateTotalNutrition = useCallback(() => {
    // Reset flag since we're calculating now
    needsNutritionUpdate.current = false;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalPrice = 0;

    mealPlanOrder.forEach((groupId) => {
      const nutrition = calculateGroupNutrition(groupId);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
      totalPrice += calculateGroupPrice(groupId);
    });

    setTotalNutrition({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      price: totalPrice,
    });
  }, [mealPlanOrder, calculateGroupNutrition, calculateGroupPrice]);

  // More efficient nutrition calculation - only runs when needed
  useEffect(() => {
    if (initialized && needsNutritionUpdate.current) {
      // Use requestAnimationFrame to batch the calculation with browser's render cycle
      const timerId = requestAnimationFrame(() => {
        calculateTotalNutrition();
      });
      
      return () => cancelAnimationFrame(timerId);
    }
  }, [items, itemQuantities, mealPlanOrder, ingredients, meals, initialized, calculateTotalNutrition]);

  // Helper to check if meal plan state has changed
  const hasMealPlanChanged = useCallback(() => {
    // Compare meal plan name
    if (currentMealPlan.name !== mealPlanName) return true;

    // Compare items
    const updatedItems: MealPlanItem[] = [];
    mealPlanOrder.forEach((groupId) => {
      const groupName = columns[groupId].title;
      items[groupId].forEach((itemId) => {
        const item = itemsData[itemId];
        if (item) {
          updatedItems.push({
            type: item.type,
            itemId: itemId,
            quantity: itemQuantities[itemId] || 1,
            group: groupName,
          });
        }
      });
    });

    // Compare lengths
    if (updatedItems.length !== currentMealPlan.items.length) return true;

    // Compare each item
    for (let i = 0; i < updatedItems.length; i++) {
      const a = updatedItems[i];
      const b = currentMealPlan.items[i];
      if (
        a.type !== b.type ||
        a.itemId !== b.itemId ||
        a.quantity !== b.quantity ||
        a.group !== b.group
      ) {
        return true;
      }
    }

    // Compare macros and price
    if (
      currentMealPlan.macros?.calories !== totalNutrition.calories ||
      currentMealPlan.macros?.protein !== totalNutrition.protein ||
      currentMealPlan.macros?.carbs !== totalNutrition.carbs ||
      currentMealPlan.macros?.fat !== totalNutrition.fat ||
      currentMealPlan.price !== totalNutrition.price
    ) {
      return true;
    }

    return false;
  }, [
    currentMealPlan,
    mealPlanName,
    mealPlanOrder,
    columns,
    items,
    itemsData,
    itemQuantities,
    totalNutrition,
  ]);

  // Create debounced function for live editing
  const debouncedSave = useCallback(
    debounce(() => {
      if (
        liveEditMode &&
        initialized &&
        !savingLiveEdit &&
        hasMealPlanChanged()
      ) {
        setSavingLiveEdit(true);

        // Generate the meal plan data in the same format as regular save
        const updatedItems: MealPlanItem[] = [];
        mealPlanOrder.forEach((groupId) => {
          const groupName = columns[groupId].title;
          items[groupId].forEach((itemId) => {
            const item = itemsData[itemId];
            if (item) {
              updatedItems.push({
                type: item.type,
                itemId: itemId,
                quantity: itemQuantities[itemId] || 1,
                group: groupName,
              });
            }
          });
        });

        // Update meal plan object
        currentMealPlan.name = mealPlanName;
        currentMealPlan.items = updatedItems;
        currentMealPlan.macros = {
          calories: totalNutrition.calories,
          protein: totalNutrition.protein,
          carbs: totalNutrition.carbs,
          fat: totalNutrition.fat,
        };
        currentMealPlan.price = totalNutrition.price;

        // Call onSubmit to save to database
        onSubmit(false);

        // Reset saving state
        setTimeout(() => setSavingLiveEdit(false), 500);
      }
    }, 1500), // 1.5 second delay before saving
    [
      liveEditMode,
      items,
      itemQuantities,
      mealPlanOrder,
      columns,
      itemsData,
      mealPlanName,
      totalNutrition,
      currentMealPlan,
      onSubmit,
      initialized,
      savingLiveEdit,
      hasMealPlanChanged,
    ],
  );

  // Effect to trigger auto-save when changes are made and live edit is on
  useEffect(() => {
    if (liveEditMode && initialized) {
      debouncedSave();
    }

    // Clean up the debounce on unmount
    return () => {
      debouncedSave.cancel();
    };
  }, [
    liveEditMode,
    items,
    itemQuantities,
    mealPlanOrder,
    columns,
    mealPlanName,
    totalNutrition,
    debouncedSave,
    initialized,
  ]);

  // Handle quantity changes for items
  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
    
    // Mark for nutrition update
    needsNutritionUpdate.current = true;
  }, []);

  // Format column title with nutritional info
  const getColumnTitle = useCallback((columnId: string) => {
    if (!columns[columnId]) return columnId;

    // For meal plan columns, show calories
    if (columns[columnId].type === "meal-plan") {
      const calories = calculateGroupNutrition(columnId).calories;
      return `${columns[columnId].title} (${calories} cal)`;
    }

    // For stores, just use the title
    return columns[columnId].title;
  }, [columns, calculateGroupNutrition]);

  // Add a new meal plan group
  const addNewGroup = useCallback(() => {
    const groupId = `group-${Date.now()}`;

    // Add empty list to items state
    setItems((prev) => ({
      ...prev,
      [groupId]: [],
    }));

    // Add new column data
    setColumns((prev) => ({
      ...prev,
      [groupId]: {
        id: groupId,
        title: "New Group",
        type: "meal-plan",
        isFixed: false,
      },
    }));

    // Add to meal plan order
    setMealPlanOrder((prev) => [...prev, groupId]);
  }, []);

  // Remove a meal plan group
  const removeGroup = useCallback((groupId: string) => {
    // Get the items from the group being deleted
    const groupItems = [...(items[groupId] || [])];

    // Create a copy of the current items state
    const updatedItems = { ...items };

    // Return items to their respective stores based on type
    groupItems.forEach((itemId) => {
      const itemType = itemsData[itemId]?.type;
      if (itemType === "ingredient") {
        updatedItems["ingredients-store"] = [
          ...updatedItems["ingredients-store"],
          itemId,
        ];
      } else if (itemType === "meal") {
        updatedItems["meals-store"] = [...updatedItems["meals-store"], itemId];
      }
    });

    // Remove the deleted group from items
    const { [groupId]: removedGroup, ...remainingItems } = updatedItems;
    setItems(remainingItems);

    // Remove from columns data
    const { [groupId]: removedColumn, ...remainingColumns } = columns;
    setColumns(remainingColumns);

    // Remove from meal plan order
    setMealPlanOrder((prev) => prev.filter((id) => id !== groupId));
    
    // Mark for nutrition update
    needsNutritionUpdate.current = true;
  }, [items, itemsData, columns]);

  // Handle group name change
  const handleGroupNameChange = useCallback((groupId: string, newName: string) => {
    setColumns((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        title: newName,
      },
    }));
  }, []);

  // Convert the drag-drop state back to the MealPlan format expected by the API
  const saveMealPlan = useCallback(() => {
    // Update the current meal plan name from the text field
    currentMealPlan.name = mealPlanName;

    // Create items array from the groups
    const updatedItems: MealPlanItem[] = [];

    mealPlanOrder.forEach((groupId) => {
      const groupName = columns[groupId].title;

      items[groupId].forEach((itemId) => {
        const item = itemsData[itemId];
        if (item) {
          updatedItems.push({
            type: item.type,
            itemId: itemId,
            quantity: itemQuantities[itemId] || 1, // Use tracked quantity or default to 1
            group: groupName,
          });
        }
      });
    });

    // Update meal plan items
    currentMealPlan.items = updatedItems;

    // Use the already calculated nutrition values from our tracker
    currentMealPlan.macros = {
      calories: totalNutrition.calories,
      protein: totalNutrition.protein,
      carbs: totalNutrition.carbs,
      fat: totalNutrition.fat,
    };
    currentMealPlan.price = totalNutrition.price;

    // Call the parent onSubmit to save the meal plan
    onSubmit(true);
  }, [currentMealPlan, mealPlanName, mealPlanOrder, columns, items, itemsData, itemQuantities, totalNutrition, onSubmit]);

  // Handler for drag end - only update state when drag is complete
  const handleDragOver = useCallback((event: any) => {
    const { source, target } = event.operation;
    
    // No target means the drop was canceled
    if (!source || !target) return;
    
    // Handle column reordering if the source is a column
    if (source.type === "column") {
      // Only allow reordering non-fixed columns
      const columnId = source.id;
      if (!columns[columnId]?.isFixed) {
        setMealPlanOrder((order) => move(order, event));
        needsNutritionUpdate.current = true; // Mark for nutrition update
      }
      return;
    }
    
    // Handle item movement
    if (source.type === "ingredient" || source.type === "meal") {
      let targetColumnID = target.id;
      
      // Get the correct target column ID from the sortable group if needed
      if (target.sortable?.group && target.sortable?.droppable?.type !== "column") {
        targetColumnID = target.sortable.group;
      }
      
      // Prevent wrong type movements
      if (source.type === "ingredient" && targetColumnID === "meals-store") return;
      if (source.type === "meal" && targetColumnID === "ingredients-store") return;
      
      // Only update state once when drag is complete
      setItems(items => move(items, event));
      needsNutritionUpdate.current = true; // Mark for nutrition update
    }
  }, [columns, items]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "background.default",
            backgroundImage:
              "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), radial-gradient(circle at 50% 0%, rgba(45, 55, 72, 0.3), rgba(17, 24, 39, 0.4))",
            backgroundAttachment: "fixed",
          },
        }}
      >
        <AppBar
          position="static"
          sx={{
            position: "relative",
            background: (theme) =>
              `linear-gradient(90deg, ${alpha(
                theme.palette.primary.dark,
                0.95,
              )}, ${alpha(theme.palette.primary.main, 0.9)})`,
            boxShadow: (theme) =>
              `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.common.white, 0.15),
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              sx={{
                ml: 2,
                flex: 1,
                fontWeight: "bold",
                textShadow: (theme) =>
                  `0 0 10px ${alpha(theme.palette.common.white, 0.4)}`,
              }}
              variant="h6"
              component="div"
            >
              {isEditing ? "Edit Meal Plan" : "Create New Meal Plan"}
            </Typography>{" "}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                height: 48, // Ensures consistent height for all controls
                minHeight: 48,
              }}
            >
              <Button
                color="inherit"
                startIcon={<AddIcon />}
                onClick={addNewGroup}
                sx={{
                  mr: 1.5,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  height: 40,
                  minWidth: 110,
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.common.white, 0.2),
                    boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Add Group
              </Button>
              <Tooltip
                title={
                  liveEditMode
                    ? "Changes are automatically saved"
                    : "Toggle to enable automatic saving"
                }
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={liveEditMode}
                      onChange={(e) => setLiveEditMode(e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "white",
                          "&:hover": {
                            backgroundColor: alpha("#fff", 0.1),
                          },
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: alpha("#fff", 0.5),
                          },
                        "& .MuiSwitch-track": {
                          backgroundColor: alpha("#fff", 0.3),
                        },
                        "& .MuiSwitch-thumb": {
                          boxShadow: "0 0 8px rgba(255, 255, 255, 0.3)",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      Live Edit
                    </Typography>
                  }
                  sx={{
                    mr: 0,
                    borderRadius: 2,
                    px: 2,
                    height: 40,
                    minWidth: 110,
                    bgcolor: liveEditMode
                      ? (theme) => alpha(theme.palette.success.main, 0.4)
                      : (theme) => alpha(theme.palette.common.white, 0.1),
                    backdropFilter: "blur(8px)",
                    border: liveEditMode
                      ? "1px solid rgba(76, 175, 80, 0.5)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                  }}
                />
              </Tooltip>
              <Button
                color="inherit"
                startIcon={<SaveIcon />}
                onClick={saveMealPlan}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  bgcolor: (theme) => alpha(theme.palette.common.white, 0.2),
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.15)",
                  height: 40,
                  minWidth: 110,
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.common.white, 0.3),
                    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: (theme) => alpha(theme.palette.common.white, 0.05),
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {liveEditMode ? "Save & Close" : "Save"}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <DialogContent
          sx={{
            p: 3,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Meal Plan Name"
            type="text"
            fullWidth
            variant="outlined"
            value={mealPlanName}
            onChange={(e) => setMealPlanName(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(8px)",
                "& fieldset": {
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.4),
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.6),
                },
                "&.Mui-focused fieldset": {
                  borderColor: (theme) => theme.palette.primary.main,
                  boxShadow: (theme) =>
                    `0 0 10px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              },
              "& .MuiInputLabel-root": {
                color: "text.secondary",
                "&.Mui-focused": {
                  color: "primary.main",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "1.1rem",
                fontWeight: 500,
              },
            }}
          />

          {/* Nutrition Tracker Summary */}
          <NutritionTracker nutrition={totalNutrition} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DragDropProvider 
              onDragOver={handleDragOver}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  justifyContent: "space-between",
                }}
              >
                {/* Left side - Meal plan groups */}
                <Box
                  sx={{
                    flex: "1 1 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                    Meal Plan Groups
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
                      {items[columnId]?.map((id, index) => {
                        const itemData = itemsData[id];
                        return itemData ? (
                          <Item
                            key={id}
                            id={id}
                            index={index}
                            column={columnId}
                            name={itemData.name}
                            type={itemData.type}
                            quantity={itemQuantities[id] || 1}
                            macros={itemData.macros}
                            price={itemData.price}
                            unitQuantity={itemData.quantity}
                            unit={itemData.unit}
                            onQuantityChange={handleQuantityChange}
                          />
                        ) : null;
                      })}
                    </Column>
                  ))}
                </Box>

                {/* Right side - Ingredients and Meals stores */}
                <Box
                  sx={{
                    flex: "0 0 320px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
                    Available Items
                  </Typography>
                  {storeColumnOrder.map((columnId, index) => (
                    <Column
                      key={columnId}
                      id={columnId}
                      index={index}
                      title={getColumnTitle(columnId)}
                      type={columns[columnId].type}
                    >
                      {items[columnId]?.map((id, index) => {
                        const itemData = itemsData[id];
                        return itemData ? (
                          <Item
                            key={id}
                            id={id}
                            index={index}
                            column={columnId}
                            name={itemData.name}
                            type={itemData.type}
                            quantity={itemQuantities[id] || 1}
                            macros={itemData.macros}
                            price={itemData.price}
                            unitQuantity={itemData.quantity}
                            unit={itemData.unit}
                            onQuantityChange={handleQuantityChange}
                          />
                        ) : null;
                      })}
                    </Column>
                  ))}
                </Box>
              </Box>
            </DragDropProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DragDropMealPlanForm;
