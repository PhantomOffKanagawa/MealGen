'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, useTheme } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

export default function Header() {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const theme = useTheme();

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <AppBar position="static" elevation={1} sx={{ 
            backgroundColor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`
        }}>
            <Container maxWidth="lg">
                <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantMenuIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                        <Typography
                            variant="h6"
                            noWrap
                            component={Link}
                            href="/"
                            sx={{
                                mr: 2,
                                display: { xs: 'none', md: 'flex' },
                                fontWeight: 700,
                                color: 'primary.main',
                                textDecoration: 'none',
                            }}
                        >
                            MealGen
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            component={Link}
                            href="/"
                            sx={{ 
                                color: 'text.primary',
                                fontWeight: isActive('/') ? 'bold' : 'normal',
                                borderBottom: isActive('/') ? '2px solid' : 'none',
                                borderRadius: 0,
                                '&:hover': { backgroundColor: 'transparent', borderBottom: '2px solid' }
                            }}
                        >
                            Home
                        </Button>

                        {user && (
                            <>
                                <Button
                                    component={Link}
                                    href="/ingredients"
                                    sx={{ 
                                        color: 'text.primary',
                                        fontWeight: isActive('/ingredients') ? 'bold' : 'normal',
                                        borderBottom: isActive('/ingredients') ? '2px solid' : 'none',
                                        borderRadius: 0,
                                        '&:hover': { backgroundColor: 'transparent', borderBottom: '2px solid' }
                                    }}
                                >
                                    Ingredients
                                </Button>
                                <Button
                                    component={Link}
                                    href="/meals"
                                    sx={{ 
                                        color: 'text.primary',
                                        fontWeight: isActive('/meals') ? 'bold' : 'normal',
                                        borderBottom: isActive('/meals') ? '2px solid' : 'none',
                                        borderRadius: 0,
                                        '&:hover': { backgroundColor: 'transparent', borderBottom: '2px solid' }
                                    }}
                                >
                                    Meals
                                </Button>
                                <Button
                                    component={Link}
                                    href="/meal-plans"
                                    sx={{ 
                                        color: 'text.primary',
                                        fontWeight: isActive('/meal-plans') ? 'bold' : 'normal',
                                        borderBottom: isActive('/meal-plans') ? '2px solid' : 'none',
                                        borderRadius: 0,
                                        '&:hover': { backgroundColor: 'transparent', borderBottom: '2px solid' }
                                    }}
                                >
                                    Meal Plans
                                </Button>
                            </>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {loading ? (
                            <Typography variant="body2">Loading...</Typography>
                        ) : user ? (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        {user.name}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        size="small"
                                        onClick={logout}
                                    >
                                        Logout
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                href="/auth"
                            >
                                Login / Register
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
