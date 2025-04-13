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
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
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
          background: "linear-gradient(to right, #4A5568, #2D3748)",
          color: "white",
          py: { xs: 8, md: 12 },
          textAlign: "center",
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
              >
                Smart Meal Planning for Better Health
              </Typography>
              <Typography variant="h6" paragraph>
                Combine ingredients into balanced meals that meet your
                nutritional goals and budget
              </Typography>

              {user ? (
                <Box
                  sx={{
                    mt: 4,
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  <Button
                    component={Link}
                    href="/ingredients"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ px: 4 }}
                  >
                    Manage Ingredients
                  </Button>
                  <Button
                    component={Link}
                    href="/meals"
                    variant="outlined"
                    color="inherit"
                    size="large"
                    sx={{
                      px: 4,
                      borderColor: "white",
                      "&:hover": {
                        borderColor: "white",
                        bgcolor: "rgba(255,255,255,0.1)",
                      },
                    }}
                  >
                    Create Meals
                  </Button>
                </Box>
              ) : (
                <Button
                  component={Link}
                  href="/auth"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 4, px: 4 }}
                >
                  Get Started
                </Button>
              )}
            </Grid>
            {!isMobile && (
              <Grid size={6}>
                <Box
                  sx={{
                    position: "relative",
                    height: 400,
                    width: "100%",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <RestaurantMenuIcon
                    sx={{
                      fontSize: "280px",
                      opacity: 0.8,
                      maxWidth: "100%",
                    }}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            align="center"
            sx={{ mb: 6 }}
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
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                  <FastfoodIcon color="primary" sx={{ fontSize: 60 }} />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Typography gutterBottom variant="h6" component="h3">
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
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                  <RestaurantMenuIcon color="primary" sx={{ fontSize: 60 }} />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Typography gutterBottom variant="h6" component="h3">
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
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                  <FitnessCenterIcon color="primary" sx={{ fontSize: 60 }} />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Typography gutterBottom variant="h6" component="h3">
                    Track Nutrition
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor calories, protein, carbs, and fat for balanced
                    nutrition
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
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                  <MonetizationOnIcon color="primary" sx={{ fontSize: 60 }} />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Typography gutterBottom variant="h6" component="h3">
                    Manage Costs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep track of meal costs and optimize your food budget
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Get Started Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              bgcolor: "background.paper",
              p: 5,
              borderRadius: 4,
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              textAlign: "center",
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
              Join NutriPlan today and take control of your nutrition and food
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
                sx={{ px: 4 }}
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
                sx={{ px: 4 }}
              >
                Get Started Now
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            {new Date().getFullYear()} Meal Plan Generator. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
}
