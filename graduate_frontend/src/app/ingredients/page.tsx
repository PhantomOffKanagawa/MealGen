"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Typography, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Grid, CircularProgress, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import graphqlClient from '../../services/graphql';
import { 
  getAllIngredients, 
  createIngredient, 
  updateIngredient, 
  deleteIngredient,
  Ingredient 
} from '../../services/ingredientService';
import { useAuth } from '../../context/AuthContext';

// Fix for hydration issues - load these components only on client side
const ClientDialog = dynamic(() => Promise.resolve(Dialog), { ssr: false });
const ClientSnackbar = dynamic(() => Promise.resolve(Snackbar), { ssr: false });

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
  const { user, logout, loading } = useAuth();

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
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Ingredients
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ mb: 3 }}
        >
          Add New Ingredient
        </Button>
        
        {loading && pageLoading && !openForm && !openDeleteDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : ingredients.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any ingredients yet. Create your first one!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Calories</TableCell>
                  <TableCell>Protein (g)</TableCell>
                  <TableCell>Carbs (g)</TableCell>
                  <TableCell>Fat (g)</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient._id}>
                    <TableCell>{ingredient.name}</TableCell>
                    <TableCell>{ingredient.quantity}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell>{ingredient.macros.calories}</TableCell>
                    <TableCell>{ingredient.macros.protein}</TableCell>
                    <TableCell>{ingredient.macros.carbs}</TableCell>
                    <TableCell>{ingredient.macros.fat}</TableCell>
                    <TableCell>${ingredient.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenForm(ingredient)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(ingredient)}
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
        )}

        {/* Create/Edit Ingredient Form Dialog */}
        <ClientDialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid>
                  <TextField
                    autoFocus
                    name="name"
                    label="Ingredient Name"
                    fullWidth
                    required
                    value={currentIngredient.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid>
                  <TextField
                    name="quantity"
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={currentIngredient.quantity}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
                <Grid>
                  <TextField
                    name="unit"
                    label="Unit"
                    fullWidth
                    required
                    value={currentIngredient.unit}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                    Nutritional Information (per 100g/ml)
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <TextField
                    name="macros.calories"
                    label="Calories"
                    type="number"
                    fullWidth
                    required
                    value={currentIngredient.macros.calories}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    name="macros.protein"
                    label="Protein (g)"
                    type="number"
                    fullWidth
                    required
                    value={currentIngredient.macros.protein}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    name="macros.carbs"
                    label="Carbs (g)"
                    type="number"
                    fullWidth
                    required
                    value={currentIngredient.macros.carbs}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
                <Grid>
                  <TextField
                    name="macros.fat"
                    label="Fat (g)"
                    type="number"
                    fullWidth
                    required
                    value={currentIngredient.macros.fat}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    name="price"
                    label="Price"
                    type="number"
                    fullWidth
                    value={currentIngredient.price}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseForm}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading && pageLoading}
              >
                {(loading && pageLoading) ? <CircularProgress size={24} /> : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </ClientDialog>

        {/* Delete Confirmation Dialog */}
        <ClientDialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            Are you sure you want to delete the ingredient "{currentIngredient.name}"? 
            This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={loading && pageLoading}
            >
              {(loading && pageLoading) ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </ClientDialog>

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
  );
};

export default IngredientsPage;
