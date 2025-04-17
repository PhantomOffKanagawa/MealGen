import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  TextField,
  ButtonGroup,
  Stack,
  Tooltip,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import KitchenIcon from "@mui/icons-material/Kitchen";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GrainIcon from "@mui/icons-material/Grain";
import OpacityIcon from "@mui/icons-material/Opacity";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface ItemProps {
  id: string;
  index: number;
  column: string;
  type: "ingredient" | "meal";
  name: string;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    calories?: number;
  };
  price?: number;
  image?: string;
  quantity?: number;
  unitQuantity?: number;
  unit?: string;
  onQuantityChange?: (id: string, quantity: number) => void;
}

export function Item({
  id,
  index,
  column,
  type,
  name,
  macros,
  price,
  image,
  quantity = 1,
  unitQuantity = 1,
  unit = "g",
  onQuantityChange,
}: ItemProps) {
  const theme = useTheme();
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "item",
    accept: "item",
    group: column,
  });

  // Local quantity state that syncs with props
  const [itemQuantity, setItemQuantity] = useState(quantity);

  // Show quantity controls only for items in meal plan columns, not in stores
  const showQuantityControls = !["ingredients-store", "meals-store"].includes(
    column
  );

  const isIngredient = type === "ingredient";
  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setItemQuantity(quantity);
  }, [quantity]);

  // Debounced quantity change notification
  const debouncedNotifyChange = useCallback(
    (newQuantity: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (onQuantityChange) {
          onQuantityChange(id, newQuantity);
        }
        debounceTimerRef.current = null;
      }, 300); // 300ms debounce
    },
    [id, onQuantityChange]
  );

  // Handle quantity changes
  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      // Prevent negative quantities
      if (newQuantity <= 0) newQuantity = 1;

      // Update local state immediately for responsive UI
      setItemQuantity(newQuantity);

      // Notify parent with debounce
      debouncedNotifyChange(newQuantity);
    },
    [debouncedNotifyChange]
  );
  return (
    <Card
      ref={ref}
      sx={{
        margin: "8px",
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? "scale(1.05)" : "scale(1)",
        transition: "all 0.3s ease",
        boxShadow: isDragging
          ? `0 0 15px ${alpha(
              isIngredient
                ? theme.palette.success.main
                : theme.palette.secondary.main,
              0.5
            )}`
          : `0 2px 8px ${alpha(
              isIngredient
                ? theme.palette.success.main
                : theme.palette.secondary.main,
              0.2
            )}`,
        cursor: "grab",
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(8px)",
        border: isIngredient
          ? `1px solid ${alpha(theme.palette.success.main, 0.4)}`
          : `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
        borderLeft: isIngredient
          ? `4px solid ${theme.palette.success.main}`
          : `4px solid ${theme.palette.secondary.main}`,
        color: isIngredient
          ? theme.palette.success.main
          : theme.palette.secondary.main,
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          opacity: 0,
          transition: "opacity 0.3s ease",
          boxShadow: `inset 0 0 10px ${alpha(
            isIngredient
              ? theme.palette.success.main
              : theme.palette.secondary.main,
            0.4
          )}`,
          pointerEvents: "none",
        },
        "&:hover": {
          boxShadow: `0 4px 15px ${alpha(
            isIngredient
              ? theme.palette.success.main
              : theme.palette.secondary.main,
            0.4
          )}`,
          transform: "translateY(-2px)",
          "&::after": {
            opacity: 1,
          },
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Main info row - sleek one-line design */}{" "}
        <Box
          display="flex"
          alignItems="flex-start"
          width="100%"
          flexDirection={
            ["ingredients-store", "meals-store"].includes(column)
              ? "column"
              : "row"
          }
        >
          {/* Top row with image, name, and type - always displayed */}
          <Box display="flex" width="100%" alignItems="center">
            {/* Item image/icon - smaller and more compact */}
            {image ? (
              <Avatar
                src={image}
                alt={name}
                sx={{
                  width: 32,
                  height: 32,
                  boxShadow: `0 0 0 2px ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.3
                  )}`,
                  mr: 1.5,
                }}
              />
            ) : (
              <Avatar
                sx={{
                  bgcolor: isIngredient
                    ? alpha(theme.palette.success.main, 0.8)
                    : alpha(theme.palette.secondary.main, 0.8),
                  width: 32,
                  height: 32,
                  backdropFilter: "blur(8px)",
                  mr: 1.5,
                }}
              >
                {isIngredient ? (
                  <KitchenIcon fontSize="small" />
                ) : (
                  <RestaurantIcon fontSize="small" />
                )}
              </Avatar>
            )}
            {/* Item details - name and type */}
            <Box flexGrow={1} mr={1}>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {name}
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem" }}
                >
                  {isIngredient ? "Ingredient" : "Meal"}
                </Typography>
                {type == "ingredient" && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem", ml: 0.5 }}
                >
                  • {unitQuantity * itemQuantity} {unit}
                </Typography>
                )}
              </Box>
            </Box>{" "}
            {/* No nutrition data in top row for store items */}
            {!["ingredients-store", "meals-store"].includes(column) && (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  border: `1px solid ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.2
                  )}`,
                  borderRadius: 1,
                  p: 0.5,
                  backgroundColor: alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.05
                  ),
                }}
              >
                {/* Calories */}
                {macros?.calories != undefined && (
                  <Tooltip title="Calories" arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocalFireDepartmentIcon
                        sx={{ fontSize: 16, color: theme.palette.error.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 0.25,
                          fontWeight: "medium",
                          fontSize: "0.65rem",
                        }}
                      >
                        {(macros?.calories * itemQuantity).toFixed(0)}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {/* Protein */}
                {macros?.protein != undefined && (
                  <Tooltip title="Protein" arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <FitnessCenterIcon
                        sx={{ fontSize: 16, color: theme.palette.info.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 0.25,
                          fontWeight: "medium",
                          fontSize: "0.65rem",
                        }}
                      >
                        {(macros.protein * itemQuantity).toFixed(1)}g
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {/* Carbs */}
                {macros?.carbs != undefined && (
                  <Tooltip title="Carbs" arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <GrainIcon
                        sx={{ fontSize: 16, color: theme.palette.warning.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 0.25,
                          fontWeight: "medium",
                          fontSize: "0.65rem",
                        }}
                      >
                        {(macros.carbs * itemQuantity).toFixed(1)}g
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {/* Fat */}
                {macros?.fat != undefined && (
                  <Tooltip title="Fat" arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <OpacityIcon sx={{ fontSize: 16, color: "#FFA726" }} />
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 0.25,
                          fontWeight: "medium",
                          fontSize: "0.65rem",
                        }}
                      >
                        {(macros.fat * itemQuantity).toFixed(1)}g
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {/* Price */}
                {price != undefined && (
                  <Tooltip title="Price" arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <AttachMoneyIcon
                        sx={{ fontSize: 16, color: theme.palette.success.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 0.25,
                          fontWeight: "medium",
                          fontSize: "0.65rem",
                        }}
                      >
                        {(price * itemQuantity).toFixed(2)}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </Stack>
            )}
          </Box>

          {/* Nutrition data on new row for store items */}
          {["ingredients-store", "meals-store"].includes(column) && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                border: `1px solid ${alpha(
                  isIngredient
                    ? theme.palette.success.main
                    : theme.palette.secondary.main,
                  0.2
                )}`,
                borderRadius: 1,
                p: 0.5,
                mt: 1,
                width: "100%",
                justifyContent: "center",
                backgroundColor: alpha(
                  isIngredient
                    ? theme.palette.success.main
                    : theme.palette.secondary.main,
                  0.05
                ),
              }}
            >
              {/* Calories */}
              {macros?.calories != undefined && (
                <Tooltip title="Calories" arrow placement="top">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocalFireDepartmentIcon
                      sx={{ fontSize: 16, color: theme.palette.error.main }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.25,
                        fontWeight: "medium",
                        fontSize: "0.65rem",
                      }}
                    >
                      {(macros.calories * itemQuantity).toFixed(0)}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {/* Protein */}
              {macros?.protein != undefined && (
                <Tooltip title="Protein" arrow placement="top">
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <FitnessCenterIcon
                      sx={{ fontSize: 16, color: theme.palette.info.main }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.25,
                        fontWeight: "medium",
                        fontSize: "0.65rem",
                      }}
                    >
                      {(macros.protein * itemQuantity).toFixed(1)}g
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {/* Carbs */}
              {macros?.carbs != undefined && (
                <Tooltip title="Carbs" arrow placement="top">
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <GrainIcon
                      sx={{ fontSize: 16, color: theme.palette.warning.main }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.25,
                        fontWeight: "medium",
                        fontSize: "0.65rem",
                      }}
                    >
                      {(macros.carbs * itemQuantity).toFixed(1)}g
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {/* Fat */}
              {macros?.fat != undefined && (
                <Tooltip title="Fat" arrow placement="top">
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <OpacityIcon sx={{ fontSize: 16, color: "#FFA726" }} />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.25,
                        fontWeight: "medium",
                        fontSize: "0.65rem",
                      }}
                    >
                      {(macros.fat * itemQuantity).toFixed(1)}g
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {/* Price */}
              {price != undefined && (
                <Tooltip title="Price" arrow placement="top">
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <AttachMoneyIcon
                      sx={{ fontSize: 16, color: theme.palette.success.main }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 0.25,
                        fontWeight: "medium",
                        fontSize: "0.65rem",
                      }}
                    >
                      {(price * itemQuantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>
        {/* Quantity controls - compact version, only show for items in meal plans */}
        {showQuantityControls && (
          <Box
            mt={1}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <ButtonGroup
              size="small"
              variant="outlined"
              color={isIngredient ? "success" : "secondary"}
              sx={{
                borderRadius: "8px",
                "& .MuiButtonGroup-grouped": {
                  border: isIngredient
                    ? `1px solid ${alpha(theme.palette.success.main, 0.5)}`
                    : `1px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
                },
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(itemQuantity - 1)}
                disabled={itemQuantity <= 1}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: "blur(8px)",
                  width: "24px",
                  height: "24px",
                  minWidth: "24px",
                  borderRadius: "4px",
                  border: `1px solid ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.5
                  )}`,
                  boxShadow: `0 0 5px ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.2
                  )}`,
                  color: isIngredient
                    ? theme.palette.success.main
                    : theme.palette.secondary.main,
                  padding: 0,
                  "&:hover": {
                    backgroundColor: isIngredient
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.secondary.main, 0.15),
                    boxShadow: `0 0 8px ${alpha(
                      isIngredient
                        ? theme.palette.success.main
                        : theme.palette.secondary.main,
                      0.4
                    )}`,
                  },
                  "&:disabled": {
                    opacity: 0.3,
                    boxShadow: "none",
                  },
                }}
              >
                <RemoveIcon style={{ fontSize: "14px" }} />
              </IconButton>

              <TextField
                size="small"
                value={itemQuantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value) || 1)
                }
                inputProps={{
                  style: {
                    width: "28px",
                    padding: "1px 0px",
                    textAlign: "center",
                    color: isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                  },
                  min: 1,
                  max: 99,
                }}
                sx={{
                  margin: "0 2px",
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: "4px",
                  border: `1px solid ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.5
                  )}`,
                  boxShadow: `0 0 5px ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.2
                  )}`,
                  "& .MuiOutlinedInput-root": {
                    height: "24px",
                    "& fieldset": { border: "none" },
                    "&:hover": {
                      boxShadow: `0 0 8px ${alpha(
                        isIngredient
                          ? theme.palette.success.main
                          : theme.palette.secondary.main,
                        0.4
                      )}`,
                    },
                  },
                }}
              />

              <IconButton
                size="small"
                onClick={() => handleQuantityChange(itemQuantity + 1)}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: "blur(8px)",
                  width: "24px",
                  height: "24px",
                  minWidth: "24px",
                  borderRadius: "4px",
                  border: `1px solid ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.5
                  )}`,
                  boxShadow: `0 0 5px ${alpha(
                    isIngredient
                      ? theme.palette.success.main
                      : theme.palette.secondary.main,
                    0.2
                  )}`,
                  color: isIngredient
                    ? theme.palette.success.main
                    : theme.palette.secondary.main,
                  padding: 0,
                  "&:hover": {
                    backgroundColor: isIngredient
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.secondary.main, 0.15),
                    boxShadow: `0 0 8px ${alpha(
                      isIngredient
                        ? theme.palette.success.main
                        : theme.palette.secondary.main,
                      0.4
                    )}`,
                  },
                }}
              >
                <AddIcon style={{ fontSize: "14px" }} />
              </IconButton>
            </ButtonGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
