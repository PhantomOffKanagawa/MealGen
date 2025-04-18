/**
 * NutritionTracker Component
 *
 * Displays a stylish summary of nutritional information including calories,
 * macronutrients, and price with neon styling to match the Column and Item components.
 */
import React from "react";
import { Box, Paper, Grid, Typography, useTheme, alpha } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EggAltIcon from "@mui/icons-material/EggAlt";
import GrainIcon from "@mui/icons-material/Grain";
import OilBarrelIcon from "@mui/icons-material/OilBarrel";
import PaidIcon from "@mui/icons-material/Paid";

interface NutritionTrackerProps {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    price: number;
  };
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ nutrition }) => {
  const theme = useTheme();

  // Calculate percentage of macronutrients (for visual representation)
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  const proteinPercentage =
    totalMacros > 0 ? (nutrition.protein / totalMacros) * 100 : 0;
  const carbsPercentage =
    totalMacros > 0 ? (nutrition.carbs / totalMacros) * 100 : 0;
  const fatPercentage =
    totalMacros > 0 ? (nutrition.fat / totalMacros) * 100 : 0;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "relative",
        p: 3,
        mb: 3,
        borderRadius: 4,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(8px)",
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: 2,
          padding: "1px",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        },
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          color: theme.palette.primary.main,
          textShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        Nutrition Summary
      </Typography>

      <Grid container spacing={2}>
        {/* Calories */}
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.3),
              border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
              "&:hover": {
                boxShadow: `0 0 15px ${alpha(theme.palette.error.main, 0.3)}`,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LocalFireDepartmentIcon
                color="error"
                sx={{
                  fontSize: 28,
                  filter: `drop-shadow(0 0 5px ${alpha(theme.palette.error.main, 0.6)})`,
                }}
              />
              <Typography variant="subtitle1">Calories</Typography>
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: theme.palette.error.main,
                textShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.5)}`,
              }}
            >
              {Math.round(nutrition.calories)}
            </Typography>
          </Box>
        </Grid>

        {/* Macro distribution */}
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              p: 2,
              height: "100%",
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.3),
              border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
              "&:hover": {
                boxShadow: `0 0 15px ${alpha(theme.palette.info.main, 0.3)}`,
              },
            }}
          >
            <Typography variant="subtitle2" mb={1}>
              Macro Distribution
            </Typography>

            <Box
              sx={{
                display: "flex",
                height: 12,
                borderRadius: 6,
                overflow: "hidden",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: `${proteinPercentage}%`,
                  bgcolor: "var(--theme-color-protein)",
                  boxShadow: `0 0 10px var(--theme-color-protein)`,
                }}
              />
              <Box
                sx={{
                  width: `${carbsPercentage}%`,
                  bgcolor: "var(--theme-color-carbs)",
                  boxShadow: `0 0 10px var(--theme-color-carbs)`,
                }}
              />
              <Box
                sx={{
                  width: `${fatPercentage}%`,
                  bgcolor: "var(--theme-color-fat)",
                  boxShadow: `0 0 10px var(--theme-color-fat)`,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <EggAltIcon
                  sx={{
                    color: "var(--theme-color-protein)",
                    fontSize: 16,
                    filter: `drop-shadow(0 0 3px var(--theme-color-protein))`,
                  }}
                />
                <Typography variant="caption">
                  {nutrition.protein.toFixed(1)}g
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <GrainIcon
                  sx={{
                    color: "var(--theme-color-carbs)",
                    fontSize: 16,
                    filter: `drop-shadow(0 0 3px var(--theme-color-carbs))`,
                  }}
                />
                <Typography variant="caption">
                  {nutrition.carbs.toFixed(1)}g
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <OilBarrelIcon
                  sx={{
                    color: "var(--theme-color-fat)",
                    fontSize: 16,
                    filter: `drop-shadow(0 0 3px var(--theme-color-fat))`,
                  }}
                />
                <Typography variant="caption">
                  {nutrition.fat.toFixed(1)}g
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Price */}
        <Grid size={12}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.3),
              border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
              "&:hover": {
                boxShadow: `0 0 15px ${alpha(theme.palette.success.main, 0.3)}`,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <PaidIcon
                color="success"
                sx={{
                  fontSize: 28,
                  filter: `drop-shadow(0 0 5px ${alpha(theme.palette.success.main, 0.6)})`,
                }}
              />
              <Typography variant="subtitle1">Total Price</Typography>
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: theme.palette.success.main,
                textShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.5)}`,
              }}
            >
              ${nutrition.price.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NutritionTracker;
