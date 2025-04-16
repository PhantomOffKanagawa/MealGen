"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Container, Typography, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Grid, CircularProgress, Snackbar, Alert,
  useTheme, alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KitchenIcon from '@mui/icons-material/Kitchen';
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
      <Box 
        sx={{ 
          my: 4,
          position: 'relative',
          minHeight: '80vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.08), transparent 70%), radial-gradient(circle at 30% 80%, rgba(76, 175, 80, 0.05), transparent 50%)',
            pointerEvents: 'none',
            zIndex: -1
          }
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.success.main,
            textShadow: `0 0 15px ${alpha(theme.palette.success.main, 0.4)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 3,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '60px',
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.success.main}, ${alpha(theme.palette.success.main, 0.2)})`,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.7)}`
            }
          }}
        >
          <KitchenIcon 
            fontSize="large" 
            sx={{
              filter: `drop-shadow(0 0 8px ${alpha(theme.palette.success.main, 0.7)})`
            }}
          />
          My Ingredients
        </Typography>
        
        <Button 
          variant="contained" 
          color="success" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ 
            mb: 4,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 'medium',
            boxShadow: `0 0 15px ${alpha(theme.palette.success.main, 0.4)}`,
            background: `linear-gradient(45deg, ${alpha(theme.palette.success.dark, 0.95)}, ${alpha(theme.palette.success.main, 0.85)})`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 0 25px ${alpha(theme.palette.success.main, 0.6)}`,
              transform: 'translateY(-2px)'
            }
          }}
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
          </Alert>        ) : (
          <TableContainer 
            component={Paper}
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              position: 'relative',
              transition: 'all 0.3s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '12px',
                padding: '1px',
                background: `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.6)}, transparent, ${alpha(theme.palette.success.main, 0.6)})`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none'
              },
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.25)}`,
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: `linear-gradient(90deg, ${alpha(theme.palette.success.dark, 0.15)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  '& .MuiTableCell-head': { 
                    fontWeight: 'bold',
                    color: theme.palette.success.dark,
                    borderBottom: `2px solid ${alpha(theme.palette.success.light, 0.3)}`,
                    py: 1.5
                  }
                }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Calories</TableCell>
                  <TableCell>Protein (g)</TableCell>
                  <TableCell>Carbs (g)</TableCell>
                  <TableCell>Fat (g)</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients.map((ingredient, index) => (
                  <TableRow 
                    key={ingredient._id}
                    sx={{
                      background: index % 2 === 0 ? 'transparent' : alpha(theme.palette.success.light, 0.03),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: alpha(theme.palette.success.light, 0.07),
                        boxShadow: `inset 0 0 15px ${alpha(theme.palette.success.main, 0.05)}`,
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>{ingredient.name}</TableCell>
                    <TableCell>{ingredient.quantity}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell sx={{ color: theme.palette.error.main }}>{ingredient.macros.calories}</TableCell>
                    <TableCell sx={{ color: theme.palette.info.main }}>{ingredient.macros.protein}</TableCell>
                    <TableCell sx={{ color: theme.palette.warning.main }}>{ingredient.macros.carbs}</TableCell>
                    <TableCell sx={{ color: '#FFA726' }}>{ingredient.macros.fat}</TableCell>
                    <TableCell sx={{ color: theme.palette.success.main, fontWeight: 'medium' }}>
                      ${ingredient.price.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="success" 
                        onClick={() => handleOpenForm(ingredient)}
                        aria-label="edit"
                        size="small"
                        sx={{
                          boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.2)}`,
                          mr: 1,
                          '&:hover': {
                            background: alpha(theme.palette.success.main, 0.1),
                            boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.4)}`,
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(ingredient)}
                        aria-label="delete"
                        size="small"
                        sx={{
                          boxShadow: `0 0 8px ${alpha(theme.palette.error.main, 0.2)}`,
                          '&:hover': {
                            background: alpha(theme.palette.error.main, 0.1),
                            boxShadow: `0 0 12px ${alpha(theme.palette.error.main, 0.4)}`,
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
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
