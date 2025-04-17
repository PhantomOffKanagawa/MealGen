"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
  Box,
  Divider,
} from "@mui/material";
import KitchenIcon from "@mui/icons-material/Kitchen";
import { Ingredient } from "../../services/ingredientService";

interface IngredientEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  ingredient: Ingredient;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  loading: boolean;
}

const IngredientEditDialog: React.FC<IngredientEditDialogProps> = ({
  open,
  onClose,
  onSubmit,
  ingredient,
  onChange,
  isEditing,
  loading,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          backgroundColor: "black",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.success.main,
        }}
      >
        <KitchenIcon />
        {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
      </DialogTitle>

      <Divider
        sx={{
          mb: 1,
          borderColor: alpha(theme.palette.success.main, 0.2),
        }}
      />

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                autoFocus
                name="name"
                label="Ingredient Name"
                fullWidth
                required
                value={ingredient.name}
                onChange={onChange}
                variant="outlined"
                color="success"
                InputProps={{
                  sx: {
                    borderRadius: 1,
                        color: theme.palette.success.main,
                  },
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                fullWidth
                value={ingredient.quantity}
                onChange={onChange}
                variant="outlined"
                color="success"
                inputProps={{
                  min: 0,
                  sx: {
                    borderRadius: 1,
                        color: theme.palette.success.main,
                  },
                  step: "any",
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                name="unit"
                label="Unit"
                fullWidth
                required
                value={ingredient.unit}
                onChange={onChange}
                variant="outlined"
                color="success"
                InputProps={{
                  sx: {
                    borderRadius: 1,
                        color: theme.palette.success.main,
                  },
                }}
              />
            </Grid>{" "}
            <Grid size={12}>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.success.light, 0.08),
                  p: 2,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    color: theme.palette.success.dark,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <KitchenIcon fontSize="small" />
                  Nutritional Information
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={6}>
                    <TextField
                      name="macros.calories"
                      label="Calories"
                      type="number"
                      fullWidth
                      required
                      value={ingredient.macros.calories}
                      onChange={onChange}
                      variant="outlined"
                      color="success"
                      InputProps={{
                        sx: { borderRadius: 1,
                        color: theme.palette.success.main },
                      }}
                      inputProps={{ min: 0, step: "any" }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      name="macros.protein"
                      label="Protein (g)"
                      type="number"
                      fullWidth
                      required
                      value={ingredient.macros.protein}
                      onChange={onChange}
                      variant="outlined"
                      color="success"
                      InputProps={{
                        sx: { borderRadius: 1,
                        color: theme.palette.success.main },
                      }}
                      inputProps={{ min: 0, step: "any" }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      name="macros.carbs"
                      label="Carbs (g)"
                      type="number"
                      fullWidth
                      required
                      value={ingredient.macros.carbs}
                      onChange={onChange}
                      variant="outlined"
                      color="success"
                      InputProps={{
                        sx: { borderRadius: 1,
                        color: theme.palette.success.main },
                      }}
                      inputProps={{ min: 0, step: "any" }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      name="macros.fat"
                      label="Fat (g)"
                      type="number"
                      fullWidth
                      required
                      value={ingredient.macros.fat}
                      onChange={onChange}
                      variant="outlined"
                      color="success"
                      InputProps={{
                        sx: { borderRadius: 1,
                        color: theme.palette.success.main },
                      }}
                      inputProps={{ min: 0, step: "any" }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid size={12}>
              <TextField
                name="price"
                label="Price ($)"
                type="number"
                fullWidth
                value={ingredient.price}
                onChange={onChange}
                variant="outlined"
                color="success"
                InputProps={{
                  sx: { borderRadius: 1,
                        color: theme.palette.success.main },
                }}
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
          </Grid>{" "}
        </DialogContent>
        <Divider
          sx={{
            mt: 2,
            borderColor: alpha(theme.palette.success.main, 0.1),
          }}
        />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 1,
              px: 3,
              color: theme.palette.text.secondary,
              borderColor: alpha(theme.palette.divider, 0.5),
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading}
            sx={{
              borderRadius: 1,
              px: 3,
              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isEditing ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IngredientEditDialog;
