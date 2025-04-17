"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import FastfoodIcon from "@mui/icons-material/Fastfood";
import graphqlClient, { CLIENT_ID } from "../../services/graphql";
import { useSubscription, gql } from "@apollo/client";
import {
  getAllMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  Meal,
  MealIngredient,
  MEAL_UPDATED,
} from "../../services/mealService";
import {
  getAllIngredients,
  Ingredient,
  INGREDIENT_UPDATED,
} from "../../services/ingredientService";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Column } from "@/components/DataTable";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import LoadingStateDisplay from "@/components/LoadingStateDisplay";

// Fix for hydration issues - load these components only on client side
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });
const MealEditDialog = dynamic(
  () => import("@/components/meals/MealEditDialog"),
  { ssr: false }
);

const defaultMeal: Meal = {
  _id: "",
  userId: "",
  name: "",
  ingredients: [],
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  price: 0,
};

const MealsPage: React.FC = () => {
  // Importing the useAuth hook to get user data and loading state
  const { user, loading } = useAuth();

  // Importing the theme for styling
  const theme = useTheme();

  // State variables for tracking user data
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // State variables for managing loading, error, and dialog states
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  // State variables for managing editing data and state
  const [currentMeal, setCurrentMeal] = useState<Meal>(defaultMeal);
  const [isEditing, setIsEditing] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  // Use this to prevent rendering on server
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch meals and ingredients when the component mounts or when loading state changes
  useEffect(() => {
    if (!loading && isMounted) {
      fetchMeals();
      fetchIngredients();
    }
  }, [loading, isMounted]);

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

  // Function to open the meal form dialog
  const handleOpenForm = (meal?: Meal) => {
    // If a meal is passed, "updating" meal
    if (meal) {
      setCurrentMeal(meal);
      setIsEditing(true);
    } else {
      // If no meal is passed, "creating" new meal
      setCurrentMeal({
        ...defaultMeal,
        userId: user?._id || "",
      });
      setIsEditing(false);
    }
    // Open the form dialog
    setOpenForm(true);
  };

  // Function to close the meal form dialog
  const handleCloseForm = () => {
    setOpenForm(false);
  };

  // Function to open the delete confirmation dialog
  const handleOpenDeleteDialog = (meal: Meal) => {
    setCurrentMeal(meal);
    setOpenDeleteDialog(true);
  };

  // Function to close the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Function to handle changes in the form inputs
  // Wrapped in useCallback to memoize the function and prevent unnecessary re-renders
  // Uses functional update form of setState to ensure it always has the latest state
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the name and value of the input that changed
    const { name, value } = e.target;

    // Update the currentMeal state using the functional update form
    setCurrentMeal((prevMeal) => {
      // If the input name starts with "macros.", update the nested macros object
      if (name.startsWith("macros.")) {
        // Extract the macro property name (e.g., "calories", "protein")
        const macroProperty = name.split(".")[1];
        // Return the new state object with updated macros
        return {
          ...prevMeal,
          macros: {
            ...prevMeal.macros,
            // Update the specific macro property, parsing the value to a float or defaulting to 0
            [macroProperty]: parseFloat(value) || 0,
          },
        };
        // If the input name is "quantity" or "price", update the corresponding property
      } else if (name === "quantity" || name === "price") {
        // Return the new state object with the updated numeric property
        return {
          ...prevMeal,
          // Parse the value to a float or default to 0
          [name]: parseFloat(value) || 0,
        };
        // Otherwise, update a top-level property (e.g., "name", "unit")
      } else {
        // Return the new state object with the updated string property
        return {
          ...prevMeal,
          [name]: value,
        };
      }
    });
  }, []); // Empty dependency array ensures the function is created only once

  // Function to handle adding or updating an ingredient in the meal
  // Takes the ingredient ID and quantity as parameters
  const handleAddIngredient = (ingredientId: string, quantity: number) => {
    // If no ingredient ID or invalid quantity, return early
    if (!ingredientId || quantity <= 0) return;

    // Check if ingredient already exists in meal
    const existingIngredientIndex = currentMeal.ingredients.findIndex(
      // Find the index of the ingredient with the same ID
      (item) => item.ingredientId === ingredientId
    );

    // Initialize updatedIngredients variable
    let updatedIngredients;

    // If ingredient already exists, update its quantity
    if (existingIngredientIndex >= 0) {
      // Update the quantity of the existing ingredient
      updatedIngredients = [...currentMeal.ingredients];
      updatedIngredients[existingIngredientIndex] = {
        ...updatedIngredients[existingIngredientIndex],
        quantity: quantity,
      };
    } else {
      // Add new ingredient to the meal
      updatedIngredients = [
        ...currentMeal.ingredients,
        { ingredientId, quantity },
      ];
    }

    // Calculate macros and price based on ingredients
    const updatedMeal = calculateMealNutrition(updatedIngredients);

    setCurrentMeal(updatedMeal);
  };

  // Function to handle removing an ingredient from the meal
  // Takes the ingredient ID as a parameter
  const handleRemoveIngredient = (ingredientId: string) => {
    // Remove the ingredient with the specified ID from the meal
    const updatedIngredients = currentMeal.ingredients.filter(
      (item) => item.ingredientId !== ingredientId
    );

    // Calculate macros and price based on ingredients
    const updatedMeal = calculateMealNutrition(updatedIngredients);

    setCurrentMeal(updatedMeal);
  };

  // Function to calculate the total nutrition and price of the meal based on its ingredients
  // Takes an array of meal ingredients as a parameter
  const calculateMealNutrition = (mealIngredients: MealIngredient[]): Meal => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalPrice = 0;

    // Iterate through each ingredient in the meal
    mealIngredients.forEach((mealIngredient) => {
      // Find the corresponding ingredient in the ingredients list
      const ingredient = ingredients.find(
        (i) => i._id === mealIngredient.ingredientId
      );

      // If the ingredient is found, calculate its contribution to the meal's nutrition
      if (ingredient) {
        // Calculate proportionally based on quantity
        const ratio = mealIngredient.quantity;
        totalCalories += ingredient.macros.calories * ratio;
        totalProtein += ingredient.macros.protein * ratio;
        totalCarbs += ingredient.macros.carbs * ratio;
        totalFat += ingredient.macros.fat * ratio;
        totalPrice += (ingredient.price || 0) * mealIngredient.quantity;
      }
    });

    // Return the updated meal object with calculated macros and price
    return {
      ...currentMeal,
      ingredients: mealIngredients,
      macros: {
        calories: parseFloat(totalCalories.toFixed(2)),
        protein: parseFloat(totalProtein.toFixed(2)),
        carbs: parseFloat(totalCarbs.toFixed(2)),
        fat: parseFloat(totalFat.toFixed(2)),
      },
      price: parseFloat(totalPrice.toFixed(2)),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPageLoading(true);
      if (isEditing) {
        await updateMeal(
          graphqlClient,
          currentMeal._id,
          user?._id || "",
          currentMeal
        );
        setSnackbar({
          open: true,
          message: "Meal updated successfully!",
          severity: "success",
        });
      } else {
        const { _id, ...newMeal } = currentMeal;
        newMeal.userId = user?._id || "";
        await createMeal(graphqlClient, newMeal);
        setSnackbar({
          open: true,
          message: "Meal created successfully!",
          severity: "success",
        });
      }
      handleCloseForm();
      fetchMeals();
    } catch (err) {
      setSnackbar({
        open: true,
        message: isEditing
          ? "Failed to update meal. Please try again."
          : "Failed to create meal. Please try again.",
        severity: "error",
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setPageLoading(true);
      await deleteMeal(graphqlClient, currentMeal._id, user?._id || "");
      setSnackbar({
        open: true,
        message: "Meal deleted successfully!",
        severity: "success",
      });
      handleCloseDeleteDialog();
      fetchMeals();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete meal. Please try again.",
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

  const getIngredientNameById = (id: string): string => {
    const ingredient = ingredients.find((i) => i._id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  // Define table columns with unique ids
  const columns: Column[] = [
    {
      id: "name",
      label: "Name",
      format: (value) => <span style={{ fontWeight: "medium" }}>{value}</span>,
    },
    {
      id: "ingredients",
      label: "Number of Ingredients",
      format: (value) => value.length,
    },
    {
      id: "macros.calories",
      label: "Calories",
      format: (value, row) => (
        <span style={{ color: theme.palette.error.main }}>
          {row.macros.calories}
        </span>
      ),
    },
    {
      id: "macros.protein",
      label: "Protein (g)",
      format: (value, row) => (
        <span style={{ color: theme.palette.info.main }}>
          {row.macros.protein}
        </span>
      ),
    },
    {
      id: "macros.carbs",
      label: "Carbs (g)",
      format: (value, row) => (
        <span style={{ color: theme.palette.warning.main }}>
          {row.macros.carbs}
        </span>
      ),
    },
    {
      id: "macros.fat",
      label: "Fat (g)",
      format: (value, row) => (
        <span style={{ color: "#FFA726" }}>{row.macros.fat}</span>
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

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${alpha(
            theme.palette.secondary.dark,
            0.9
          )}, ${alpha(theme.palette.secondary.main, 0.8)})`,
          color: "white",
          py: { xs: 6, md: 8 },
          mb: 4,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
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
                Create Your Meals
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Combine ingredients into balanced meals with automatic nutrition
                tracking
              </Typography>
            </Grid>
            <Grid size={12} sx={{ textAlign: "center" }}>
              <FastfoodIcon sx={{ fontSize: 100, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        <Box sx={{ position: "relative", minHeight: "80vh" }}>
          <PageHeader
            title="My Meals"
            icon={<FastfoodIcon />}
            color="secondary"
            onAddNew={() => handleOpenForm()}
            addButtonText="Create New Meal"
          />

          {loading || pageLoading && !openForm && !openDeleteDialog ? (
            <LoadingStateDisplay 
              color="secondary"
              text="Loading meals..."
              icon={<FastfoodIcon sx={{ fontSize: 40 }} />}
              size="large"
            />
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : meals.length === 0 ? (
            <Card
              sx={{
                my: 4,
                boxShadow: `0 8px 24px ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <FastfoodIcon
                  sx={{
                    fontSize: 60,
                    color: alpha(theme.palette.secondary.main, 0.6),
                    mb: 2,
                  }}
                />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Meals Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't created any meals yet. Click "Create New Meal" to
                  get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={meals}
              color="secondary"
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
              getRowId={(row) => row._id}
            />
          )}

          {/* Create/Edit Meal Form Dialog */}
          <MealEditDialog
            open={openForm}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            meal={currentMeal}
            onChange={handleChange}
            isEditing={isEditing}
            loading={loading && pageLoading}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the meal "${currentMeal.name}"? This action cannot be undone.`}
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

export default MealsPage;
