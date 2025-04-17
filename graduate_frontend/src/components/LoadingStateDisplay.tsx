import React from "react";
import { Box, CircularProgress, Typography, Paper, alpha, useTheme } from "@mui/material";
import KitchenIcon from "@mui/icons-material/Kitchen";

interface LoadingStateDisplayProps {
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  text?: string;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large";
}

const LoadingStateDisplay: React.FC<LoadingStateDisplayProps> = ({
  color = "primary",
  text = "Loading...",
  icon,
  size = "medium",
}) => {
  const theme = useTheme();
  
  // Calculate sizes based on the size prop
  const getCircularProgressSize = () => {
    switch(size) {
      case "small": return 40;
      case "large": return 80;
      default: return 60;
    }
  };
  
  const getIconSize = () => {
    switch(size) {
      case "small": return 50;
      case "large": return 90;
      default: return 70;
    }
  };
  
  const getTextVariant = () => {
    switch(size) {
      case "small": return "body1";
      case "large": return "h5";
      default: return "h6";
    }
  };

  const colorValue = theme.palette[color].main;
  
  return (
    <Paper 
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 5,
        my: 4,
        backgroundColor: alpha(colorValue, 0.05),
        borderRadius: 2,
        border: `1px solid ${alpha(colorValue, 0.1)}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          mb: 2,
        }}
      >
        {icon && (
          <Box
            sx={{
              opacity: 0.2,
              fontSize: getIconSize(),
              color: colorValue,
              paddingBottom: "1.0rem",
            }}
          >
            {icon}
          </Box>
        )}
        <CircularProgress
          size={getCircularProgressSize()}
          thickness={4}
          color={color}
          sx={{
            position: "absolute",
          }}
        />
      </Box>
      
      <Typography 
        variant={getTextVariant()} 
        color="text.secondary" 
        sx={{ 
          mt: 2,
          fontWeight: "medium",
          color: alpha(colorValue, 0.8)
        }}
      >
        {text}
      </Typography>
    </Paper>
  );
};

export default LoadingStateDisplay;
