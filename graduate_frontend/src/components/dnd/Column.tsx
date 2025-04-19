import { CollisionPriority } from "@dnd-kit/abstract";
import { useSortable } from "@dnd-kit/react/sortable";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import KitchenIcon from "@mui/icons-material/Kitchen";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import {
  alpha,
  Box,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";

interface ColumnProps {
  children: React.ReactNode;
  id: string;
  index: number;
  title: string;
  type: "ingredient-store" | "meal-store" | "meal-plan";
  onTitleChange?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export function Column({
  children,
  id,
  index,
  title,
  type,
  onTitleChange,
  onDelete,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const theme = useTheme();

  const isFixedStore = type === "ingredient-store" || type === "meal-store";
  
  const [handleRef, setHandleRef] = useState<HTMLElement | null>(null);

  const { ref } = useSortable({
    id,
    index,
    type: "column",
    collisionPriority: CollisionPriority.Low,
    // accept: getAcceptedItemTypes(),
    accept: ["ingredient", "meal", "column", "item"],
    // disabled: isFixedStore,
    handle: isFixedStore ? handleRef : null,
  });

  const getColumnIcon = () => {
    switch (type) {
      case "ingredient-store":
        return <KitchenIcon />;
      case "meal-store":
        return <FastfoodIcon />;
      case "meal-plan":
        return <RestaurantMenuIcon />;
      default:
        return null;
    }
  };
  const getColumnColor = () => {
    switch (type) {
      case "ingredient-store":
        return theme.palette.success.main;
      case "meal-store":
        return theme.palette.secondary.main;
      case "meal-plan":
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Handle saving the edit
  const handleSaveTitle = () => {
    setIsEditing(false);
    if (onTitleChange && editTitle.trim()) {
      onTitleChange(id, editTitle);
    }
  };

  // Handle starting the edit
  const handleStartEdit = () => {
    if (!isFixedStore) {
      setIsEditing(true);
      setEditTitle(title.split(" (")[0]); // Remove the calorie count when editing
    }
  };

  // Handle keyboard input for edit field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(title);
    }
  };

  return (
    <Paper
      ref={ref}
      elevation={3}
      sx={{
        width: "100%",
        minHeight: isFixedStore ? 400 : 250,
        maxHeight: isFixedStore ? 500 : "auto",
        margin: "10px 0",
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderRadius: 2,
        overflow: "hidden",
        cursor: isFixedStore ? "default" : "move",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${alpha(getColumnColor(), 0.4)}`,
        transition: "all 0.3s ease-in-out",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 2,
          pointerEvents: "none",
          boxShadow: `0 0 15px ${alpha(getColumnColor(), 0.3)}`,
          opacity: 0,
          transition: "opacity 0.3s ease-in-out",
        },
        "&:hover": {
          boxShadow: `0 6px 20px ${alpha(getColumnColor(), 0.25)}`,
          "&::after": {
            opacity: 1,
          },
        },
      }}
    >
      {" "}
      <Box
        ref={(el) => {
          setHandleRef(el as HTMLElement | null);
        }}
        sx={{
          bgcolor: getColumnColor(),
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          position: "relative",
          boxShadow: `0 0 15px ${alpha(getColumnColor(), 0.7)}`,
          borderBottom: `1px solid ${alpha(getColumnColor(), 0.8)}`,
          backdropFilter: "blur(8px)",
        }}
        onClick={!isEditing && !isFixedStore ? handleStartEdit : undefined}
      >
        {getColumnIcon()}

        {isEditing ? (
          <>
            <TextField
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
              variant="filled"
              sx={{
                flexGrow: 1,
                input: {
                  color: "white",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                },
                "& .MuiFilledInput-root": {
                  backgroundColor: alpha(theme.palette.common.white, 0.15),
                  backdropFilter: "blur(4px)",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.25),
                  },
                  "&.Mui-focused": {
                    backgroundColor: alpha(theme.palette.common.white, 0.25),
                  },
                },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: "white",
                },
              }}
            />
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSaveTitle}
              sx={{ ml: 1 }}
            >
              <CheckIcon />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {!isFixedStore && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Edit name">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={handleStartEdit}
                    sx={{
                      opacity: 0.7,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onDelete && (
                  <Tooltip title="Delete group">
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => {
                        if (
                          confirm(`Are you sure you want to delete this group?`)
                        ) {
                          onDelete(id);
                        }
                      }}
                      sx={{
                        opacity: 0.7,
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
      <Divider />
      <Box
        sx={{
          p: 2,
          flexGrow: 1,
          minHeight: isFixedStore ? 320 : 180,
          overflowY: "auto",
        }}
      >
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <Box
            sx={{
              height: "100%",
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: 1,
              p: 2,
              color: "text.secondary",
              textAlign: "center",
              backgroundColor: alpha(theme.palette.background.default, 0.4),
            }}
          >
            <Typography variant="body2">
              {type === "ingredient-store"
                ? "Drop ingredients here"
                : type === "meal-store"
                  ? "Drop meals here"
                  : "Drop meals or ingredients here"}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
