"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  loading: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.25)}`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.error.main,
        }}
      >
        <DeleteOutlineIcon />
        {title}
      </DialogTitle>

      <Divider sx={{ borderColor: alpha(theme.palette.error.main, 0.2) }} />

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "start",
            gap: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.error.light, 0.08),
            border: `1px solid ${alpha(theme.palette.error.light, 0.2)}`,
          }}
        >
          <WarningAmberIcon color="error" sx={{ mt: 0.5 }} />
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.5) }} />

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
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 1,
            px: 3,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
