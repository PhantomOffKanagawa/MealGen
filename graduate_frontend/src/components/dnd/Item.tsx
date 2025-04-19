import { useSortable } from "@dnd-kit/react/sortable";
import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GrainIcon from "@mui/icons-material/Grain";
import KitchenIcon from "@mui/icons-material/Kitchen";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import OpacityIcon from "@mui/icons-material/Opacity";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import {
  alpha,
  Avatar,
  Box,
  ButtonGroup,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Interface for the Item component props
 */
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

/**
 * Nutrition info item with icon and value
 */
interface NutritionItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  marginLeft?: number;
}

const NutritionItem = ({
  icon,
  value,
  label,
  marginLeft = 0,
}: NutritionItemProps) => (
  <Tooltip title={label} arrow placement="top">
    <Box sx={{ display: "flex", alignItems: "center", ml: marginLeft }}>
      {icon}
      <Typography
        variant="caption"
        sx={{
          ml: 0.25,
          fontWeight: "medium",
          fontSize: "0.65rem",
        }}
      >
        {value}
      </Typography>
    </Box>
  </Tooltip>
);

/**
 * Draggable Item component for ingredients and meals
 */
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
    type: type,
    accept: ["ingredient", "meal", "item"],
    group: column,
  });

  // Local quantity state that syncs with props
  const [itemQuantity, setItemQuantity] = useState(quantity);

  // Show quantity controls only for items in meal plan columns, not in stores
  const isInStore = ["ingredients-store", "meals-store"].includes(column);
  const showQuantityControls = !isInStore;
  const isIngredient = type === "ingredient";

  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setItemQuantity(quantity);
  }, [quantity]);

  /**
   * Card styling based on component state
   */
  const cardStyles = useMemo(
    () => ({
      margin: "8px",
      opacity: isDragging ? 0.7 : 1,
      transform: isDragging ? "none" : "scale(1)",
      transition: isDragging ? "opacity 0.2s ease" : "all 0.3s ease",
      boxShadow: isDragging
        ? `0 8px 20px ${alpha(
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
      cursor: isDragging ? "grabbing" : "grab",
      zIndex: isDragging ? 1300 : 1,
      backgroundColor: alpha(
        theme.palette.background.paper,
        isDragging ? 0.9 : 0.8
      ),
      backdropFilter: "blur(8px)",
      border: isIngredient
        ? `1px solid ${alpha(theme.palette.success.main, isDragging ? 0.6 : 0.4)}`
        : `1px solid ${alpha(theme.palette.secondary.main, isDragging ? 0.6 : 0.4)}`,
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
        opacity: isDragging ? 0.2 : 0,
        transition: isDragging ? "none" : "opacity 0.3s ease",
        boxShadow: `inset 0 0 10px ${alpha(
          isIngredient
            ? theme.palette.success.main
            : theme.palette.secondary.main,
          0.4
        )}`,
        pointerEvents: "none",
      },
      "&:hover": !isDragging
        ? {
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
          }
        : {},
    }),
    [isDragging, isIngredient, theme.palette]
  );

  /**
   * Styling for the nutrition info container
   */
  const nutritionContainerStyle = useMemo(
    () => ({
      border: `1px solid ${alpha(
        isIngredient
          ? theme.palette.success.main
          : theme.palette.secondary.main,
        0.2
      )}`,
      borderRadius: 1,
      p: 0.5,
      ...(isInStore && { mt: 1, width: "100%", justifyContent: "center" }),
      backgroundColor: alpha(
        isIngredient
          ? theme.palette.success.main
          : theme.palette.secondary.main,
        0.05
      ),
    }),
    [isIngredient, isInStore, theme.palette]
  );

  /**
   * Debounced quantity change notification
   */
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

  /**
   * Handle quantity changes
   */
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

  /**
   * Render nutrition information
   */
  const renderNutritionInfo = () => (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={nutritionContainerStyle}
    >
      {macros?.calories !== undefined && (
        <NutritionItem
          icon={
            <LocalFireDepartmentIcon
              sx={{ fontSize: 16, color: theme.palette.error.main }}
            />
          }
          value={(macros.calories * itemQuantity).toFixed(0)}
          label="Calories"
        />
      )}

      {macros?.protein !== undefined && (
        <NutritionItem
          icon={
            <FitnessCenterIcon
              sx={{ fontSize: 16, color: theme.palette.info.main }}
            />
          }
          value={`${(macros.protein * itemQuantity).toFixed(1)}g`}
          label="Protein"
          marginLeft={1}
        />
      )}

      {macros?.carbs !== undefined && (
        <NutritionItem
          icon={
            <GrainIcon
              sx={{ fontSize: 16, color: theme.palette.warning.main }}
            />
          }
          value={`${(macros.carbs * itemQuantity).toFixed(1)}g`}
          label="Carbs"
          marginLeft={1}
        />
      )}

      {macros?.fat !== undefined && (
        <NutritionItem
          icon={<OpacityIcon sx={{ fontSize: 16, color: "#FFA726" }} />}
          value={`${(macros.fat * itemQuantity).toFixed(1)}g`}
          label="Fat"
          marginLeft={1}
        />
      )}

      {price !== undefined && (
        <NutritionItem
          icon={
            <AttachMoneyIcon
              sx={{ fontSize: 16, color: theme.palette.success.main }}
            />
          }
          value={(price * itemQuantity).toFixed(2)}
          label="Price"
          marginLeft={1}
        />
      )}
    </Stack>
  );

  /**
   * Render quantity controls
   */
  const renderQuantityControls = () => {
    if (!showQuantityControls) return null;

    const buttonStyle = {
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
    };

    return (
      <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center">
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
              ...buttonStyle,
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
              ...buttonStyle,
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
    );
  };

  /**
   * Render avatar or icon for the item
   */
  const renderAvatar = () => {
    if (image) {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <Card ref={ref} sx={cardStyles}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          display="flex"
          alignItems="flex-start"
          width="100%"
          flexDirection={isInStore ? "column" : "row"}
        >
          {/* Top row with image, name, and type */}
          <Box display="flex" width="100%" alignItems="center">
            {renderAvatar()}

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
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem", ml: 0.5 }}
                >
                  • {unitQuantity * itemQuantity} {unit}
                </Typography>
              </Box>
            </Box>

            {/* Show nutrition in top row for meal plan items */}
            {!isInStore && renderNutritionInfo()}
          </Box>

          {/* Show nutrition on new row for store items */}
          {isInStore && renderNutritionInfo()}
        </Box>

        {/* Quantity controls */}
        {renderQuantityControls()}
      </CardContent>
    </Card>
  );
}
