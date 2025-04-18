'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Alert,
    Paper,
    alpha,
    useTheme,
    Divider,
    CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import { theme } from '@/utils/theme';

export default function AuthPage() {
    const theme = useTheme();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number | undefined>(undefined);
    const [formError, setFormError] = useState('');
    const { login, register, error, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!name) {
                    setFormError('Name is required');
                    return;
                }
                await register(name, email, password, age);
            }
            if (pathname == "/auth") {
                router.push('/');
            }
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        }
    };

    const routeColorTranslation: { [key: string]: { main: string; dark: string } } = {
        '/': theme.palette.primary,
        '/ingredients': theme.palette.success,
        '/meals': theme.palette.secondary,
        '/meal-plans': theme.palette.primary,
        '/auth': theme.palette.primary,
    };

    const routeColor = routeColorTranslation[pathname] || theme.palette.primary;

    return (
        <>
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${alpha(routeColor.dark, 0.9)}, ${alpha(routeColor.main, 0.85)})`,
                py: 8,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: `0 8px 32px ${alpha(routeColor.main, 0.2)}`,
                        border: `1px solid ${alpha(routeColor.main, 0.1)}`,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{
                        width: '100%',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        color: routeColor.main
                    }}>
                        <PersonIcon fontSize="large" />
                        <Typography
                            component="h1"
                            variant="h5"
                            sx={{ 
                                fontWeight: 600, 
                                color: routeColor.main
                            }}
                        >
                            {isLogin ? 'Sign in to your account' : 'Create a new account'}
                        </Typography>
                    </Box>
                    
                    <Divider sx={{ 
                        width: '100%', 
                        borderColor: alpha(routeColor.main, 0.2) 
                    }} />
                    
                    {(formError || error) && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                width: 'calc(100% - 48px)', 
                                mx: 3, 
                                mt: 3,
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                            }}
                        >
                            {formError || error}
                        </Alert>
                    )}
                    
                    <Box 
                        component="form" 
                        onSubmit={handleSubmit} 
                        sx={{ 
                            width: '100%',
                            p: 3,
                            pt: formError || error ? 2 : 3
                        }}
                    >
                        <Box sx={{ 
                            p: 3,
                            borderRadius: 1,
                            border: `1px solid ${alpha(routeColor.main, 0.1)}`,
                            mb: 2
                        }}>
                            {!isLogin && (
                                <TextField
                                    fullWidth
                                    label="Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    variant="outlined"
                                    color="primary"
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        sx: { borderRadius: 1 },
                                        startAdornment: <PersonIcon sx={{ mr: 1, color: alpha(routeColor.main, 0.7) }} />
                                    }}
                                />
                            )}

                            <TextField
                                fullWidth
                                label="Email address"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                variant="outlined"
                                color="info"
                                sx={{ mb: 2 }}
                                InputProps={{
                                    sx: { borderRadius: 1 },
                                    startAdornment: <EmailIcon sx={{ mr: 1, color: alpha(theme.palette.info.main, 0.7) }} />
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                variant="outlined"
                                color="secondary"
                                sx={{ mb: !isLogin ? 2 : 0 }}
                                InputProps={{
                                    sx: { borderRadius: 1 },
                                    startAdornment: <LockIcon sx={{ mr: 1, color: alpha(theme.palette.secondary.main, 0.7) }} />
                                }}
                            />
                            
                            {!isLogin && (
                                <TextField
                                    fullWidth
                                    label="Age (optional)"
                                    type="number"
                                    value={age || ''}
                                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                                    variant="outlined"
                                    color="warning"
                                    InputProps={{ 
                                        inputProps: { min: 0, max: 120 },
                                        sx: { borderRadius: 1 },
                                        startAdornment: <CakeIcon sx={{ mr: 1, color: alpha(theme.palette.warning.main, 0.7) }} />
                                    }}
                                />
                            )}
                        </Box>

                        <Divider sx={{ 
                            my: 2,
                            borderColor: alpha(routeColor.main, 0.1) 
                        }} />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ 
                                mt: 2, 
                                mb: 2,
                                py: 1.2,
                                borderRadius: 1,
                                boxShadow: `0 4px 12px ${alpha(routeColor.main, 0.3)}`
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : isLogin ? 'Sign in' : 'Sign up'}
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={() => setIsLogin(!isLogin)}
                            sx={{ 
                                borderRadius: 1,
                                py: 1,
                                color: theme.palette.text.secondary,
                                borderColor: alpha(theme.palette.divider, 0.5)
                            }}
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
        </>
    );
}
