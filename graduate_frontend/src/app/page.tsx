"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function Home() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.85)})`,
          color: "white",
          py: { xs: 8, md: 12 },
          mb: 4,
          borderRadius: { xs: 0, md: 2 },
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            <Grid size={12}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                fontWeight="bold"
                sx={{
                  textShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.3)}`,
                }}
              >
                Smart Meal Planning for Better Health
              </Typography>
              <Typography variant="h6" paragraph sx={{ opacity: 0.9 }}>
                Combine ingredients into balanced meals that meet your
                nutritional goals and budget
              </Typography>
              {!isMobile && (
                <Grid size={12}>
                  <Box
                    sx={{
                      position: "relative",
                      height: 300,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <RestaurantMenuIcon
                      sx={{
                        fontSize: "280px",
                        opacity: 0.9,
                        filter: `drop-shadow(0 0 20px ${alpha(theme.palette.common.white, 0.3)})`,
                      }}
                    />
                  </Box>
                </Grid>
              )}
              <Grid container spacing={2} justifyContent="center">
                {user ? (
                  <Box
                    sx={{
                      mt: 4,
                      display: "flex",
                      gap: 2,
                      justifyContent: { xs: "center", md: "flex-start" },
                      flexWrap: { xs: "wrap", sm: "nowrap" },
                    }}
                  >
                    <Button
                      component={Link}
                      href="/ingredients"
                      variant="contained"
                      color="success"
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: "medium",
                        boxShadow: `0 0 15px ${alpha(theme.palette.success.main, 0.4)}`,
                        background: `linear-gradient(45deg, ${alpha(theme.palette.success.dark, 0.95)}, ${alpha(theme.palette.success.main, 0.85)})`,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: `0 0 25px ${alpha(theme.palette.success.main, 0.6)}`,
                          transform: "translateY(-2px)",
                        },
                      }}
                      startIcon={<KitchenIcon />}
                    >
                      Manage Ingredients
                    </Button>
                    <Button
                      component={Link}
                      href="/meals"
                      variant="contained"
                      color="secondary"
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: "medium",
                        boxShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.4)}`,
                        background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.dark, 0.95)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: `0 0 25px ${alpha(theme.palette.secondary.main, 0.6)}`,
                          transform: "translateY(-2px)",
                        },
                      }}
                      startIcon={<FastfoodIcon />}
                    >
                      Create Meals
                    </Button>
                    <Button
                      component={Link}
                      href="/meal-plans"
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: "medium",
                        boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.85)})`,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: `0 0 25px ${alpha(theme.palette.primary.main, 0.6)}`,
                          transform: "translateY(-2px)",
                        },
                      }}
                      startIcon={<RestaurantMenuIcon />}
                    >
                      Plan Meals
                    </Button>
                  </Box>
                ) : (
                  <Button
                    component={Link}
                    href="/auth"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{
                      mt: 4,
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: "medium",
                      boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                      background: `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.85)})`,
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(8px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.7)}`,
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          align="center"
          sx={{
            mb: 6,
            fontWeight: "bold",
            color: theme.palette.text.primary,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60px",
              height: "4px",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.4)})`,
              borderRadius: "2px",
              boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
            },
          }}
        >
          How MealGen Works
        </Typography>

        <Grid container spacing={4}>
          <Grid size={12}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: 3,
                  padding: "1px",
                  background: `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.6)}, transparent, ${alpha(theme.palette.success.main, 0.6)})`,
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.25)}`,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                <KitchenIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.success.main,
                    filter: `drop-shadow(0 0 8px ${alpha(theme.palette.success.main, 0.6)})`,
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                >
                  Add Ingredients
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a catalog of ingredients with nutritional information
                  and prices
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: 3,
                  padding: "1px",
                  background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.light, 0.6)}, transparent, ${alpha(theme.palette.secondary.main, 0.6)})`,
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 28px ${alpha(theme.palette.secondary.main, 0.25)}`,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                <FastfoodIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.secondary.main,
                    filter: `drop-shadow(0 0 8px ${alpha(theme.palette.secondary.main, 0.6)})`,
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                >
                  Create Meals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Combine ingredients into meals with automatic nutrition
                  calculation
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: 3,
                  padding: "1px",
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.6)}, transparent, ${alpha(theme.palette.primary.main, 0.6)})`,
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                <RestaurantMenuIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.primary.main,
                    filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.6)})`,
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                >
                  Plan Meals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Organize meals into balanced plans for the week
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: 3,
                  padding: "1px",
                  background: `linear-gradient(45deg, ${alpha(theme.palette.info.light, 0.6)}, transparent, ${alpha(theme.palette.info.main, 0.6)})`,
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.25)}`,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                <FitnessCenterIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.info.main,
                    filter: `drop-shadow(0 0 8px ${alpha(theme.palette.info.main, 0.6)})`,
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                >
                  Track Nutrition
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor calories, protein, carbs, and fat for balanced
                  nutrition
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Get Started Section */}
        <Box sx={{ py: 8 }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              p: 5,
              borderRadius: 4,
              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
              textAlign: "center",
              backdropFilter: "blur(10px)",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: 4,
                padding: "1px",
                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.6)}, ${alpha(theme.palette.secondary.light, 0.6)}, ${alpha(theme.palette.success.light, 0.6)})`,
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              },
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              fontWeight="bold"
            >
              Ready to start planning smarter meals?
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
              Join MealGen today and take control of your nutrition and food
              budget.
            </Typography>

            {user ? (
              <Button
                component={Link}
                href="/meals"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "medium",
                  boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.6)}`,
                    transform: "translateY(-3px)",
                  },
                }}
              >
                Go to Meals
              </Button>
            ) : (
              <Button
                component={Link}
                href="/auth"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "medium",
                  boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.6)}`,
                    transform: "translateY(-3px)",
                  },
                }}
              >
                Get Started Now
              </Button>
            )}
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          mt: 4,
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            {new Date().getFullYear()} MealGen. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
}
