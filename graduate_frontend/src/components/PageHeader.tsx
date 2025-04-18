"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  alpha,
  Button,
  SvgIconProps,
  Typography,
  useTheme
} from "@mui/material";
import React from "react";

interface PageHeaderProps {
  title: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  onAddNew?: () => void;
  addButtonText?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  color,
  onAddNew,
  addButtonText = "Add New",
}) => {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: "bold",
          color: theme.palette[color].main,
          textShadow: `0 0 15px ${alpha(theme.palette[color].main, 0.4)}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -8,
            left: 0,
            width: "60px",
            height: "3px",
            background: `linear-gradient(90deg, ${theme.palette[color].main}, ${alpha(theme.palette[color].main, 0.2)})`,
            borderRadius: "2px",
            boxShadow: `0 0 10px ${alpha(theme.palette[color].main, 0.7)}`,
          },
        }}
      >
        {React.cloneElement(icon as React.ReactElement<SvgIconProps>, {
          fontSize: "large",
          sx: {
            filter: `drop-shadow(0 0 8px ${alpha(theme.palette[color].main, 0.7)})`,
          },
        })}
        {title}
      </Typography>

      {onAddNew && (
        <Button
          variant="contained"
          color={color}
          startIcon={<AddIcon />}
          onClick={onAddNew}
          sx={{
            mb: 4,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: "medium",
            boxShadow: `0 0 15px ${alpha(theme.palette[color].main, 0.4)}`,
            background: `linear-gradient(45deg, ${alpha(theme.palette[color].dark, 0.95)}, ${alpha(theme.palette[color].main, 0.85)})`,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: `0 0 25px ${alpha(theme.palette[color].main, 0.6)}`,
              transform: "translateY(-2px)",
            },
          }}
        >
          {addButtonText}
        </Button>
      )}
    </>
  );
};

export default PageHeader;
