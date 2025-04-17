/**
 * Meal Plans Page
 *
 * Main page component for managing meal plans. Allows users to view, create,
 * edit, and delete meal plans. Meal plans can contain ingredients and meals
 * that are organized into groups, with automatic calculation of nutritional
 * information and price.
 */
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Container,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import graphqlClient, { CLIENT_ID } from "../../services/graphql";
import {
  getAllMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  MealPlan,
  MealPlanItem,
  MEAL_PLAN_UPDATED,
} from "../../services/mealPlanService";
import {
  getAllIngredients,
  Ingredient,
  INGREDIENT_UPDATED,
} from "../../services/ingredientService";
import { getAllMeals, Meal, MEAL_UPDATED } from "../../services/mealService";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Column } from "@/components/DataTable";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import DragDropMealPlanForm from "@/components/dnd/DragDropMealPlanForm";
import { useSubscription } from "@apollo/client";

// Fix for hydration issues - load these components only on client side
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });
const MealPlanEditDialog = dynamic(
  () => import("@/components/meal-plans/MealPlanEditDialog"),
  { ssr: false }
);

/** Default meal plan structure for creating new plans */
const defaultMealPlan: MealPlan = {
  _id: "",
  userId: "",
  name: "",
  items: [],
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  price: 0,
};

const MealPlansPage: React.FC = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  // State for meal plans and related data
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state management
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] =
    useState<MealPlan>(defaultMealPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>(["General"]);

  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // Live Update state
  const [updatePending, setUpdatePending] = useState(false);

  // Client-side rendering guard
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && isMounted && user) {
      fetchData();
    }
  }, [loading, isMounted, user]);

  // Set up subscription for real-time ingredient updates
  useSubscription(INGREDIENT_UPDATED, {
    // Explicitly provide the client instance
    client: graphqlClient,
    // Need users ID to subscribe to updates
    skip: !user?._id,
    // Pass the user ID to the subscription
    variables: { userId: user?._id },
    // On receiving data from the subscription
    onData: ({ data }) => {
      // Get the updated ingredient from the subscription data
      const { ingredientUpdated } = data?.data || {};

      // Ensure ingredientUpdated is defined and update wasn't from this window
      if (ingredientUpdated && ingredientUpdated.sourceClientId !== CLIENT_ID) {
        // Log the received update for debugging
        console.log(
          "Received ingredient update from server:",
          ingredientUpdated
        );

        // Fetch the latest ingredients data after receiving an update
        fetchIngredients();

        // Show a snackbar notification to the user
        setSnackbar({
          open: true,
          message: "Ingredient data was updated",
          severity: "info",
        });
      }
    },
  });

  useSubscription(MEAL_UPDATED, {
    // Explicitly provide the client instance
    client: graphqlClient,
    // Need users ID to subscribe to updates
    skip: !user?._id,
    // Pass the user ID to the subscription
    variables: { userId: user?._id },
    // On receiving data from the subscription
    onData: ({ data }) => {
      console.log(data);
      // Get the updated meal from the subscription data
      const { mealUpdated } = data?.data || {};

      // Ensure mealUpdated is defined and update wasn't from this window
      if (mealUpdated && mealUpdated.sourceClientId !== CLIENT_ID) {
        // Log the received update for debugging
        console.log("Received meal update from server:", mealUpdated);

        // Fetch the latest meals data after receiving an update
        fetchMeals();

        // Show a snackbar notification to the user
        setSnackbar({
          open: true,
          message: "Meal data was updated",
          severity: "info",
        });
      }
    },
  });

  useSubscription(MEAL_PLAN_UPDATED, {
    // Explicitly provide the client instance
    client: graphqlClient,
    // Need users ID to subscribe to updates
    skip: !user?._id,
    // Pass the user ID to the subscription
    variables: { userId: user?._id },
    // On receiving data from the subscription
    onData: ({ data }) => {
      console.log("MEAL PLAN UPDATE");
      console.log(data);

      // Get the updated meal from the subscription data
      const { mealPlanUpdated } = data?.data || {};

      // Ensure mealPlanUpdated is defined and update wasn't from this window
      if (mealPlanUpdated && mealPlanUpdated.sourceClientId !== CLIENT_ID) {
        // Log the received update for debugging
        console.log("Received meal plan update from server:", mealPlanUpdated);

        // Fetch the latest meals data after receiving an update
        fetchData();
        
        if (mealPlanUpdated && mealPlanUpdated.mealPlanUpdated._id == currentMealPlan._id) {
          const updatedMealPlan = mealPlanUpdated.mealPlanUpdated;
          console.log("Updated meal plan:", updatedMealPlan);
          setCurrentMealPlan(updatedMealPlan);
          setUpdatePending(true);
        }

        // Show a snackbar notification to the user
        setSnackbar({
          open: true,
          message: "Meal plan data was updated",
          severity: "info",
        });
      }
    },
  });

  // Function to fetch all meals from the server
  const fetchMeals = async () => {
    try {
      // Loading while fetching data
      setPageLoading(true);
      // Try to get all meals and set them in state
      const data = await getAllMeals(graphqlClient, user);
      setMeals(data || []);
      setError(null);
    } catch (err) {
      // Handle any errors that occur during the fetch
      setError("Failed to load meals. Please try again later.");
      console.error(err);
    } finally {
      // Set loading to false after fetching data
      setPageLoading(false);
    }
  };

  // Function to fetch all ingredients from the server
  const fetchIngredients = async () => {
    try {
      // Try to get all ingredients and set them in state
      const data = await getAllIngredients(graphqlClient, user);
      setIngredients(data || []);
      setError(null);
    } catch (err) {
      // Handle any errors that occur during the fetch
      setError("Failed to load ingredients. Please try again later.");
      console.error(err);
    } finally {
      // Set loading to false after fetching data
      setPageLoading(false);
    }
  };

  /**
   * Fetches all required data: meal plans, ingredients, and meals
   * Also extracts unique group names from existing meal plans
   */
  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [mealPlansData, ingredientsData, mealsData] = await Promise.all([
        getAllMealPlans(graphqlClient, user),
        getAllIngredients(graphqlClient, user),
        getAllMeals(graphqlClient, user),
      ]);

      setMealPlans(mealPlansData || []);
      setIngredients(ingredientsData || []);
      setMeals(mealsData || []);

      // Extract all unique groups from existing meal plans
      if (mealPlansData && mealPlansData.length > 0) {
        const groups = new Set<string>(["General"]);
        mealPlansData.forEach((plan: { items: any[] }) => {
          plan.items.forEach((item) => {
            if (item.group) groups.add(item.group);
          });
        });
        setAvailableGroups(Array.from(groups));
      }

      setError(null);
    } catch (err) {
      setError("Failed to load data. Please try again later.");
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpenForm = (mealPlan?: MealPlan) => {
    if (mealPlan) {
      setCurrentMealPlan(mealPlan);
      setIsEditing(true);
    } else {
      setCurrentMealPlan({
        ...defaultMealPlan,
        userId: user?._id || "",
      });
      setIsEditing(false);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleOpenDeleteDialog = (mealPlan: MealPlan) => {
    setCurrentMealPlan(mealPlan);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMealPlan({
      ...currentMealPlan,
      [name]: value,
    });
  };

  /**
   * Updates the meal plan with a new set of items and recalculates nutrition
   */
  const handleUpdateItems = (items: MealPlanItem[]) => {
    const updatedMacrosAndPrice = calculateMacrosAndPrice(items);

    setCurrentMealPlan({
      ...currentMealPlan,
      items: items,
      ...updatedMacrosAndPrice,
    });
  };

  /**
   * Calculates macronutrients and price based on the items in the meal plan
   */
  const calculateMacrosAndPrice = (items: MealPlanItem[]) => {
    const initialValues = {
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      price: 0,
    };

    return items.reduce((acc, item) => {
      if (item.type === "ingredient") {
        const ingredient = ingredients.find((i) => i._id === item.itemId);
        if (ingredient) {
          acc.macros.calories += ingredient.macros.calories * item.quantity;
          acc.macros.protein += ingredient.macros.protein * item.quantity;
          acc.macros.carbs += ingredient.macros.carbs * item.quantity;
          acc.macros.fat += ingredient.macros.fat * item.quantity;
          acc.price += ingredient.price * item.quantity;
        }
      } else if (item.type === "meal") {
        const meal = meals.find((m) => m._id === item.itemId);
        if (meal) {
          acc.macros.calories += meal.macros.calories * item.quantity;
          acc.macros.protein += meal.macros.protein * item.quantity;
          acc.macros.carbs += meal.macros.carbs * item.quantity;
          acc.macros.fat += meal.macros.fat * item.quantity;
          acc.price += meal.price * item.quantity;
        }
      }
      return acc;
    }, initialValues);
  };

  /**
   * Adds a new group to the available groups
   */
  const handleAddGroup = (newGroup: string) => {
    if (newGroup && !availableGroups.includes(newGroup)) {
      setAvailableGroups([...availableGroups, newGroup]);
      return true;
    }
    return false;
  };

  /**
   * Submits the meal plan form for creation or update
   */
  const handleSubmit = async (close: Boolean) => {
    // Validate form
    if (!currentMealPlan.name) {
      setSnackbar({
        open: true,
        message: "Please provide a name for the meal plan",
        severity: "error",
      });
      return;
    }

    try {
      setPageLoading(true);
      if (isEditing) {
        await updateMealPlan(
          graphqlClient,
          currentMealPlan._id,
          user?._id || "",
          currentMealPlan
        );
        setSnackbar({
          open: true,
          message: "Meal plan updated successfully!",
          severity: "success",
        });
      } else {
        const { _id, ...newMealPlan } = currentMealPlan;
        newMealPlan.userId = user?._id || "";
        const response = await createMealPlan(graphqlClient, newMealPlan);
        setSnackbar({
          open: true,
          message: "Meal plan created successfully!",
          severity: "success",
        });

        // If close is false, change the state to editing
        if (!close) {
          setIsEditing(true);
          setCurrentMealPlan(response);
        }
      }
      if (close) {
        handleCloseForm();
      }
        fetchData(); // Refresh the data
    } catch (err) {
      setSnackbar({
        open: true,
        message: isEditing
          ? "Failed to update meal plan. Please try again."
          : "Failed to create meal plan. Please try again.",
        severity: "error",
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  /**
   * Deletes the current meal plan
   */
  const handleDelete = async () => {
    try {
      setPageLoading(true);
      await deleteMealPlan(graphqlClient, currentMealPlan._id, user?._id || "");
      setSnackbar({
        open: true,
        message: "Meal plan deleted successfully!",
        severity: "success",
      });
      handleCloseDeleteDialog();
      fetchData(); // Refresh the data
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete meal plan. Please try again.",
        severity: "error",
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  /**
   * Helper function to find item name by id
   */
  const getItemName = (type: string, itemId: string) => {
    if (type === "ingredient") {
      const ingredient = ingredients.find((i) => i._id === itemId);
      return ingredient ? ingredient.name : "Unknown";
    } else {
      const meal = meals.find((m) => m._id === itemId);
      return meal ? meal.name : "Unknown";
    }
  };

  // Define table columns with unique ids
  const columns: Column[] = [
    {
      id: "name",
      label: "Name",
      format: (value) => <span style={{ fontWeight: "medium" }}>{value}</span>,
    },
    {
      id: "items",
      label: "Items",
      format: (value) => value.length,
    },
    {
      id: "macros.calories",
      label: "Calories",
      format: (value, row) => (
        <span style={{ color: theme.palette.error.main }}>
          {row.macros.calories.toFixed(0)}
        </span>
      ),
    },
    {
      id: "macros.protein",
      label: "Protein (g)",
      format: (value, row) => (
        <span style={{ color: theme.palette.info.main }}>
          {row.macros.protein.toFixed(1)}
        </span>
      ),
    },
    {
      id: "macros.carbs",
      label: "Carbs (g)",
      format: (value, row) => (
        <span style={{ color: theme.palette.warning.main }}>
          {row.macros.carbs.toFixed(1)}
        </span>
      ),
    },
    {
      id: "macros.fat",
      label: "Fat (g)",
      format: (value, row) => (
        <span style={{ color: "#FFA726" }}>{row.macros.fat.toFixed(1)}</span>
      ),
    },
    {
      id: "price",
      label: "Price",
      format: (value) => (
        <span
          style={{ color: theme.palette.success.main, fontWeight: "medium" }}
        >
          ${value.toFixed(2)}
        </span>
      ),
    },
  ];

  if (!isMounted) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${alpha(
            theme.palette.primary.dark,
            0.9
          )}, ${alpha(theme.palette.primary.main, 0.8)})`,
          color: "white",
          py: { xs: 6, md: 8 },
          mb: 4,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid size={12}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight="bold"
                sx={{
                  textShadow: `0 2px 10px ${alpha(
                    theme.palette.common.black,
                    0.3
                  )}`,
                }}
              >
                Plan Your Meals
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Organize ingredients and meals into comprehensive meal plans
              </Typography>
            </Grid>
            <Grid size={12} sx={{ textAlign: "center" }}>
              <RestaurantMenuIcon sx={{ fontSize: 100, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        <Box sx={{ position: "relative", minHeight: "80vh" }}>
          <PageHeader
            title="My Meal Plans"
            icon={<RestaurantMenuIcon />}
            color="primary"
            onAddNew={() => handleOpenForm()}
            addButtonText="Create New Meal Plan"
          />

          {loading && pageLoading && !openForm && !openDeleteDialog ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : mealPlans.length === 0 ? (
            <Card
              sx={{
                my: 4,
                boxShadow: `0 8px 24px ${alpha(
                  theme.palette.primary.main,
                  0.15
                )}`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <RestaurantMenuIcon
                  sx={{
                    fontSize: 60,
                    color: alpha(theme.palette.primary.main, 0.6),
                    mb: 2,
                  }}
                />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Meal Plans Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't created any meal plans yet. Click "Create New Meal
                  Plan" to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={mealPlans}
              color="primary"
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
              getRowId={(row) => row._id}
            />
          )}

          {/* Create/Edit Meal Plan Form Dialog */}
          <DragDropMealPlanForm
            open={openForm}
            isEditing={isEditing}
            loading={loading && pageLoading}
            currentMealPlan={currentMealPlan}
            ingredients={ingredients}
            meals={meals}
            updatePending={updatePending}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            onMealPlanChange={handleChange}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the meal plan "${currentMealPlan.name}"? This action cannot be undone.`}
            loading={loading && pageLoading}
          />

          {/* Snackbar for notifications */}
          <ClientSnackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </ClientSnackbar>
        </Box>
      </Container>
    </>
  );
};

export default MealPlansPage;
