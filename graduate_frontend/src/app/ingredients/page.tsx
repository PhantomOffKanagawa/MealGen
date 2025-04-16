"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Box, CircularProgress, Snackbar, Alert,
  useTheme, alpha, Typography, Card, CardContent, Grid
} from '@mui/material';
import KitchenIcon from '@mui/icons-material/Kitchen';
import graphqlClient from '../../services/graphql';
import { 
  getAllIngredients, 
  createIngredient, 
  updateIngredient, 
  deleteIngredient,
  Ingredient,
  INGREDIENT_ADDED
} from '../../services/ingredientService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Column } from '@/components/DataTable';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useSubscription } from '@apollo/client';

// Fix for hydration issues - load these components only on client side
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });
const IngredientEditDialog = dynamic(
  () => import('@/components/ingredients/IngredientEditDialog'), 
  { ssr: false }
);

const defaultIngredient: Ingredient = {
  _id: '',
  userId: '',
  name: '',
  quantity: 0,
  unit: '',
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  price: 0
};

const IngredientsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>(defaultIngredient);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Use this to prevent rendering on server
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && isMounted) {
      fetchIngredients();
    }
  }, [loading, isMounted]);

  const fetchIngredients = async () => {
    try {
      setPageLoading(true);
      const data = await getAllIngredients(graphqlClient, user);
      setIngredients(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load ingredients. Please try again later.');
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpenForm = (ingredient?: Ingredient) => {
    if (ingredient) {
      setCurrentIngredient(ingredient);
      setIsEditing(true);
    } else {
      setCurrentIngredient({
        ...defaultIngredient,
        userId: user?._id || ''
      });
      setIsEditing(false);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleOpenDeleteDialog = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('macros.')) {
      const macroProperty = name.split('.')[1];
      setCurrentIngredient({
        ...currentIngredient,
        macros: {
          ...currentIngredient.macros,
          [macroProperty]: parseFloat(value) || 0
        }
      });
    } else if (name === 'quantity' || name === 'price') {
      setCurrentIngredient({
        ...currentIngredient,
        [name]: parseFloat(value) || 0
      });
    } else {
      setCurrentIngredient({
        ...currentIngredient,
        [name]: value
      });
    }
  };

  // Use the Apollo Client instance explicitly for the subscription
  const { data: subscriptionData } = useSubscription(INGREDIENT_ADDED, { client: graphqlClient });

  useEffect(() => {
    if (subscriptionData && subscriptionData.ingredientAdded) {
      console.log('New ingredient added via subscription:', subscriptionData.ingredientAdded);
      // fetchIngredients(); // or update the state accordingly
    }
  }, [subscriptionData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPageLoading(true);
      if (isEditing) {
        await updateIngredient(graphqlClient, currentIngredient._id, currentIngredient);
        setSnackbar({
          open: true,
          message: 'Ingredient updated successfully!',
          severity: 'success'
        });
      } else {
        const { _id, ...newIngredient } = currentIngredient;
        newIngredient.userId = user?._id || '';
        await createIngredient(graphqlClient, newIngredient);
        setSnackbar({
          open: true,
          message: 'Ingredient created successfully!',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchIngredients();
    } catch (err) {
      setSnackbar({
        open: true,
        message: isEditing 
          ? 'Failed to update ingredient. Please try again.' 
          : 'Failed to create ingredient. Please try again.',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setPageLoading(true);
      await deleteIngredient(graphqlClient, currentIngredient._id);
      setSnackbar({
        open: true,
        message: 'Ingredient deleted successfully!',
        severity: 'success'
      });
      handleCloseDeleteDialog();
      fetchIngredients();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete ingredient. Please try again.',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Define table columns with unique ids
  const columns: Column[] = [
    { 
      id: 'name', 
      label: 'Name',
      format: (value) => <span style={{ fontWeight: 'medium' }}>{value}</span>
    },
    { id: 'quantity', label: 'Quantity' },
    { id: 'unit', label: 'Unit' },
    { 
      id: 'macros.calories', 
      label: 'Calories',
      format: (value, row) => <span style={{ color: theme.palette.error.main }}>{row.macros.calories}</span>
    },
    { 
      id: 'macros.protein', 
      label: 'Protein (g)',
      format: (value, row) => <span style={{ color: theme.palette.info.main }}>{row.macros.protein}</span>
    },
    { 
      id: 'macros.carbs', 
      label: 'Carbs (g)',
      format: (value, row) => <span style={{ color: theme.palette.warning.main }}>{row.macros.carbs}</span>
    },
    { 
      id: 'macros.fat', 
      label: 'Fat (g)',
      format: (value, row) => <span style={{ color: '#FFA726' }}>{row.macros.fat}</span>
    },
    { 
      id: 'price', 
      label: 'Price',
      format: (value) => <span style={{ color: theme.palette.success.main, fontWeight: 'medium' }}>${value.toFixed(2)}</span>
    }
  ];

  if (!isMounted) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
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
          background: `linear-gradient(to right, ${alpha(theme.palette.success.dark, 0.9)}, ${alpha(theme.palette.success.main, 0.8)})`,
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
                  textShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.3)}`,
                }}
              >
                Manage Your Ingredients
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Track your food inventory, nutritional information, and costs in one place
              </Typography>
            </Grid>
            <Grid size={12} sx={{ textAlign: 'center' }}>
              <KitchenIcon sx={{ fontSize: 100, opacity: 0.9 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        <Box sx={{ position: 'relative', minHeight: '80vh' }}>
          <PageHeader 
            title="My Ingredients"
            icon={<KitchenIcon />}
            color="success"
            onAddNew={() => handleOpenForm()}
            addButtonText="Add New Ingredient"
          />
          
          {loading && pageLoading && !openForm && !openDeleteDialog ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          ) : ingredients.length === 0 ? (
            <Card sx={{ 
              my: 4, 
              boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <KitchenIcon sx={{ fontSize: 60, color: alpha(theme.palette.success.main, 0.6), mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Ingredients Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't added any ingredients to your inventory. Click "Add New Ingredient" to get started.
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
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
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
