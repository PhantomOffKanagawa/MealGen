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
import LoadingStateDisplay from "@/components/LoadingStateDisplay";
import KitchenIcon from "@mui/icons-material/Kitchen";
import graphqlClient, { CLIENT_ID } from "../../services/graphql";
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  Ingredient,
  INGREDIENT_UPDATED,
} from "../../services/ingredientService";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Column } from "@/components/DataTable";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { useSubscription } from "@apollo/client";

// Fix for hydration issues - load these components only on client side
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });
const IngredientEditDialog = dynamic(
  () => import("@/components/ingredients/IngredientEditDialog"),
  { ssr: false }
);

const defaultIngredient: Ingredient = {
  _id: "",
  userId: "",
  name: "",
  quantity: 0,
  unit: "",
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  price: 0,
};

const IngredientsPage: React.FC = () => {
  // Importing the useAuth hook to get user data and loading state
  const { user, loading } = useAuth();

  // Importing the theme for styling
  const theme = useTheme();

  // State variables for tracking user data
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>(defaultIngredient);

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
  const [isEditing, setIsEditing] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  // Use this to prevent rendering on server
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch ingredients when the component mounts or when loading state changes
  useEffect(() => {
    if (!loading && isMounted) {
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
        console.log("Received ingredient update from server:", ingredientUpdated);

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

  // Function to fetch all ingredients from the server
  const fetchIngredients = async () => {
    try {
      // Loading while fetching data
      setPageLoading(true);
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

  // Function to open the ingredient form dialog
  const handleOpenForm = (ingredient?: Ingredient) => {
    // If an ingredient is passed, "updating" ingredient
    if (ingredient) {
      setCurrentIngredient(ingredient);
      setIsEditing(true);
    } else {
      // If no ingredient is passed, "creating" new ingredient
      setCurrentIngredient({
        ...defaultIngredient,
        userId: user?._id || "",
      });
      setIsEditing(false);
    }
    // Open the form dialog
    setOpenForm(true);
  };

  // Function to close the ingredient form dialog
  const handleCloseForm = () => {
    setOpenForm(false);
  };

  // Function to open the delete confirmation dialog
  const handleOpenDeleteDialog = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setOpenDeleteDialog(true);
  };

  // Function to open the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Function to handle changes in the form inputs
  // Wrapped in useCallback to memoize the function and prevent unnecessary re-renders
  // Uses functional update form of setState to ensure it always has the latest state
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the name and value of the input that changed
    const { name, value } = e.target;

    // Update the currentIngredient state using the functional update form
    setCurrentIngredient(prevIngredient => {
      // If the input name starts with "macros.", update the nested macros object
      if (name.startsWith("macros.")) {
        // Extract the macro property name (e.g., "calories", "protein")
        const macroProperty = name.split(".")[1];
        // Return the new state object with updated macros
        return {
          ...prevIngredient,
          macros: {
            ...prevIngredient.macros,
            // Update the specific macro property, parsing the value to a float or defaulting to 0
            [macroProperty]: parseFloat(value) || 0,
          },
        };
      // If the input name is "quantity" or "price", update the corresponding property
      } else if (name === "quantity" || name === "price") {
        // Return the new state object with the updated numeric property
        return {
          ...prevIngredient,
          // Parse the value to a float or default to 0
          [name]: parseFloat(value) || 0,
        };
      // Otherwise, update a top-level property (e.g., "name", "unit")
      } else {
        // Return the new state object with the updated string property
        return {
          ...prevIngredient,
          [name]: value,
        };
      }
    });
  }, []); // Empty dependency array ensures the function is created only once

  // Function to handle form submission for creating or updating an ingredient
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    try {
      // Loading while submitting the form
      setPageLoading(true);
      // If the form is being submitted for editing an existing ingredient
      if (isEditing) {
        // Update the ingredient using the updateIngredient function
        await updateIngredient(
          graphqlClient,
          currentIngredient._id,
          user?._id || "",
          currentIngredient
        );
        // Show a success snackbar notification
        setSnackbar({
          open: true,
          message: "Ingredient updated successfully!",
          severity: "success",
        });
      } else {
        // If the form is being submitted for creating a new ingredient
        const { _id, ...newIngredient } = currentIngredient;
        // Set the ingredient's userId to the current user's ID
        newIngredient.userId = user?._id || "";
        // Create the new ingredient using the createIngredient function
        await createIngredient(graphqlClient, newIngredient);
        // Show a success snackbar notification
        setSnackbar({
          open: true,
          message: "Ingredient created successfully!",
          severity: "success",
        });
      }
      // When completed, reset the form state
      // Close the form dialog
      handleCloseForm();
      // Fetch the updated list of ingredients
      fetchIngredients();
    } catch (err) {
      // Handle any errors that occur during the submission
      setSnackbar({
        open: true,
        message: isEditing
          ? "Failed to update ingredient. Please try again."
          : "Failed to create ingredient. Please try again.",
        severity: "error",
      });
      console.error(err);
    } finally {
      // Set loading to false after submitting the form
      setPageLoading(false);
    }
  };

  // Function to handle ingredient deletion
  const handleDelete = async () => {
    try {
      // Loading while deleting the ingredient
      setPageLoading(true);
      // Delete the ingredient using the deleteIngredient function
      await deleteIngredient(
        graphqlClient,
        currentIngredient._id,
        user?._id || ""
      );
      // Show a success snackbar notification
      setSnackbar({
        open: true,
        message: "Ingredient deleted successfully!",
        severity: "success",
      });
      // Close the delete confirmation dialog
      handleCloseDeleteDialog();
      fetchIngredients();
    } catch (err) {
      // Handle any errors that occur during the deletion
      setSnackbar({
        open: true,
        message: "Failed to delete ingredient. Please try again.",
        severity: "error",
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  // Function to close the snackbar notification
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Define table columns with unique ids
  const columns: Column[] = [
    {
      id: "name",
      label: "Name",
      format: (value) => <span style={{ fontWeight: "medium" }}>{value}</span>,
    },
    { id: "quantity", label: "Quantity" },
    { id: "unit", label: "Unit" },
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
            theme.palette.success.dark,
            0.9
          )}, ${alpha(theme.palette.success.main, 0.8)})`,
          color: "white",
          py: { xs: 6, md: 8 },
          mb: 4,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.4)}`,
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
                Manage Your Ingredients
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Track your food inventory, nutritional information, and costs in
                one place
              </Typography>
            </Grid>
            <Grid size={12} sx={{ textAlign: "center" }}>
              <KitchenIcon sx={{ fontSize: 100, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        <Box sx={{ position: "relative", minHeight: "80vh" }}>
          <PageHeader
            title="My Ingredients"
            icon={<KitchenIcon />}
            color="success"
            onAddNew={() => handleOpenForm()}
            addButtonText="Add New Ingredient"
          />          {loading || pageLoading && !openForm && !openDeleteDialog ? (
            <LoadingStateDisplay 
              color="success"
              text="Loading ingredients..."
              icon={<KitchenIcon sx={{ fontSize: 40 }} />}
              size="large"
            />
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : ingredients.length === 0 ? (
            <Card
              sx={{
                my: 4,
                boxShadow: `0 8px 24px ${alpha(
                  theme.palette.success.main,
                  0.15
                )}`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <KitchenIcon
                  sx={{
                    fontSize: 60,
                    color: alpha(theme.palette.success.main, 0.6),
                    mb: 2,
                  }}
                />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Ingredients Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't added any ingredients to your inventory. Click
                  "Add New Ingredient" to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={ingredients}
              color="success"
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
              getRowId={(row) => row._id}
            />
          )}

          {/* Create/Edit Ingredient Form Dialog */}
          <IngredientEditDialog
            open={openForm}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            ingredient={currentIngredient}
            onChange={handleChange}
            isEditing={isEditing}
            loading={loading && pageLoading}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the ingredient "${currentIngredient.name}"? This action cannot be undone.`}
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

export default IngredientsPage;
