"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const theme = useTheme();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const routeColorTranslation: { [key: string]: string } = {
    "/": theme.palette.primary.main,
    "/ingredients": theme.palette.success.main,
    "/meals": theme.palette.secondary.main,
    "/meal-plans": theme.palette.primary.main,
    "/auth": theme.palette.primary.main,
  };

  const getRouteColor = () =>
    routeColorTranslation[pathname] || theme.palette.text.primary;

  return (
    <AppBar
      position="static"
      elevation={3}
      sx={{
        background: `linear-gradient(to bottom, ${alpha(
          theme.palette.background.paper,
          0.95,
        )}, ${alpha(theme.palette.background.paper, 0.9)})`,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${alpha(getRouteColor(), 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(getRouteColor(), 0.2)}`,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderBottom: "1px solid transparent",
          background: `linear-gradient(90deg, ${alpha(
            getRouteColor(),
            0,
          )}, ${alpha(getRouteColor(), 0.6)}, ${alpha(getRouteColor(), 0)})`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.5,
        },
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <RestaurantMenuIcon
              sx={{
                display: { xs: "none", md: "flex" },
                mr: 1,
                color: getRouteColor(),
                filter: `drop-shadow(0 0 6px ${alpha(getRouteColor(), 0.7)})`,
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                color: getRouteColor(),
                textDecoration: "none",
                textShadow: `0 0 10px ${alpha(getRouteColor(), 0.6)}`,
                letterSpacing: "0.5px",
                transition: "all 0.2s ease",
                "&:hover": {
                  textShadow: `0 0 15px ${alpha(getRouteColor(), 0.8)}`,
                },
              }}
            >
              MealGen
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!(!user && loading) && (
              <Button
                component={Link}
                href="/"
                sx={{
                  color: isActive("/") ? getRouteColor() : "text.primary",
                  fontWeight: isActive("/") ? "bold" : "medium",
                  borderRadius: 0,
                  position: "relative",
                  overflow: "hidden",
                  padding: "6px 12px",
                  transition: "all 0.3s ease",
                  textShadow: isActive("/")
                    ? `0 0 8px ${alpha(getRouteColor(), 0.6)}`
                    : "none",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "2px",
                    backgroundColor: isActive("/")
                      ? getRouteColor()
                      : "transparent",
                    boxShadow: isActive("/")
                      ? `0 0 10px ${alpha(getRouteColor(), 0.8)}`
                      : "none",
                    transition: "all 0.3s ease",
                  },
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: getRouteColor(),
                    "&::after": {
                      backgroundColor: getRouteColor(),
                      boxShadow: `0 0 10px ${alpha(getRouteColor(), 0.8)}`,
                    },
                  },
                }}
              >
                Home
              </Button>
            )}

            {user && (
              <>
                <Button
                  component={Link}
                  href="/ingredients"
                  sx={{
                    color: isActive("/ingredients")
                      ? theme.palette.success.main
                      : "text.primary",
                    fontWeight: isActive("/ingredients") ? "bold" : "medium",
                    borderRadius: 0,
                    position: "relative",
                    overflow: "hidden",
                    padding: "6px 12px",
                    transition: "all 0.3s ease",
                    textShadow: isActive("/ingredients")
                      ? `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`
                      : "none",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      backgroundColor: isActive("/ingredients")
                        ? theme.palette.success.main
                        : "transparent",
                      boxShadow: isActive("/ingredients")
                        ? `0 0 10px ${alpha(theme.palette.success.main, 0.8)}`
                        : "none",
                      transition: "all 0.3s ease",
                    },
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: theme.palette.success.main,
                      "&::after": {
                        backgroundColor: theme.palette.success.main,
                        boxShadow: `0 0 10px ${alpha(
                          theme.palette.success.main,
                          0.8,
                        )}`,
                      },
                    },
                  }}
                >
                  Ingredients
                </Button>
                <Button
                  component={Link}
                  href="/meals"
                  sx={{
                    color: isActive("/meals")
                      ? theme.palette.secondary.main
                      : "text.primary",
                    fontWeight: isActive("/meals") ? "bold" : "medium",
                    borderRadius: 0,
                    position: "relative",
                    overflow: "hidden",
                    padding: "6px 12px",
                    transition: "all 0.3s ease",
                    textShadow: isActive("/meals")
                      ? `0 0 8px ${alpha(theme.palette.secondary.main, 0.6)}`
                      : "none",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      backgroundColor: isActive("/meals")
                        ? theme.palette.secondary.main
                        : "transparent",
                      boxShadow: isActive("/meals")
                        ? `0 0 10px ${alpha(theme.palette.secondary.main, 0.8)}`
                        : "none",
                      transition: "all 0.3s ease",
                    },
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: theme.palette.secondary.main,
                      "&::after": {
                        backgroundColor: theme.palette.secondary.main,
                        boxShadow: `0 0 10px ${alpha(
                          theme.palette.secondary.main,
                          0.8,
                        )}`,
                      },
                    },
                  }}
                >
                  Meals
                </Button>
                <Button
                  component={Link}
                  href="/meal-plans"
                  sx={{
                    color: isActive("/meal-plans")
                      ? getRouteColor()
                      : "text.primary",
                    fontWeight: isActive("/meal-plans") ? "bold" : "medium",
                    borderRadius: 0,
                    position: "relative",
                    overflow: "hidden",
                    padding: "6px 12px",
                    transition: "all 0.3s ease",
                    textShadow: isActive("/meal-plans")
                      ? `0 0 8px ${alpha(getRouteColor(), 0.6)}`
                      : "none",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      backgroundColor: isActive("/meal-plans")
                        ? getRouteColor()
                        : "transparent",
                      boxShadow: isActive("/meal-plans")
                        ? `0 0 10px ${alpha(getRouteColor(), 0.8)}`
                        : "none",
                      transition: "all 0.3s ease",
                    },
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: getRouteColor(),
                      "&::after": {
                        backgroundColor: getRouteColor(),
                        boxShadow: `0 0 10px ${alpha(getRouteColor(), 0.8)}`,
                      },
                    },
                  }}
                >
                  Meal Plans
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                minWidth: 220,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {loading ? (
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href="/auth"
                  sx={{
                    width: "100%",
                    borderRadius: 4,
                    px: 2.5,
                    py: 0.75,
                    backgroundColor: alpha(getRouteColor(), 0.9),
                    backdropFilter: "blur(10px)",
                    boxShadow: `0 4px 12px ${alpha(getRouteColor(), 0.4)}`,
                    border: `1px solid ${alpha(getRouteColor(), 0.6)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: getRouteColor(),
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 15px ${alpha(getRouteColor(), 0.6)}`,
                    },
                  }}
                  disabled
                >
                  Loading
                </Button>
              ) : user ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 0.75,
                    px: 1.5,
                    borderRadius: 6,
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.4,
                    ),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha(getRouteColor(), 0.2)}`,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: alpha(getRouteColor(), 0.9),
                      boxShadow: `0 0 10px ${alpha(getRouteColor(), 0.5)}`,
                      border: `2px solid ${alpha(
                        theme.palette.common.white,
                        0.8,
                      )}`,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      display: { xs: "none", sm: "block" },
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 80,
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={logout}
                    sx={{
                      borderRadius: 4,
                      border: `1px solid ${alpha(
                        theme.palette.error.main,
                        0.3,
                      )}`,
                      color: theme.palette.error.main,
                      transition: "all 0.3s ease",
                      minWidth: 70,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        borderColor: theme.palette.error.main,
                        boxShadow: `0 0 10px ${alpha(
                          theme.palette.error.main,
                          0.4,
                        )}`,
                      },
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 0.75,
                    px: 1.5,
                    borderRadius: 6,
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.4,
                    ),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha(getRouteColor(), 0.2)}`,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: alpha(getRouteColor(), 0.9),
                      boxShadow: `0 0 10px ${alpha(getRouteColor(), 0.5)}`,
                      border: `2px solid ${alpha(
                        theme.palette.common.white,
                        0.8,
                      )}`,
                    }}
                  ></Avatar>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    type="link"
                    href="/auth"
                    sx={{
                      borderRadius: 4,
                      border: `1px solid ${alpha(getRouteColor(), 0.3)}`,
                      color: getRouteColor(),
                      transition: "all 0.3s ease",
                      minWidth: 70,
                      "&:hover": {
                        backgroundColor: alpha(getRouteColor(), 0.1),
                        borderColor: getRouteColor(),
                        boxShadow: `0 0 10px ${alpha(getRouteColor(), 0.4)}`,
                      },
                    }}
                  >
                    Login / Register
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
