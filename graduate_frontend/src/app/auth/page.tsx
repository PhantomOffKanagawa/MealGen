'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Alert,
    Paper,
} from '@mui/material';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number | undefined>(undefined);
    const [formError, setFormError] = useState('');
    const { login, register, error, loading } = useAuth();
    const router = useRouter();

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
            router.push('/');
        } catch (err: any) {
            setFormError(err.message || 'An error occurred');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(to right, #4A5568, #2D3748)',
                py: 8,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2,
                    }}
                >
                    <Typography
                        component="h1"
                        variant="h4"
                        gutterBottom
                        sx={{ fontWeight: 'bold', mb: 3 }}
                    >
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </Typography>

                    {(formError || error) && (
                        <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                            {formError || error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        {!isLogin && (
                            <TextField
                                fullWidth
                                label="Name"
                                margin="normal"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                variant="outlined"
                            />
                        )}

                        <TextField
                            fullWidth
                            label="Email address"
                            margin="normal"
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant="outlined"
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            margin="normal"
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                        />

                        {!isLogin && (
                            <TextField
                                fullWidth
                                label="Age (optional)"
                                margin="normal"
                                type="number"
                                value={age || ''}
                                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                                variant="outlined"
                                InputProps={{ inputProps: { min: 0, max: 120 } }}
                            />
                        )}

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
                        </Button>

                        <Button
                            fullWidth
                            onClick={() => setIsLogin(!isLogin)}
                            sx={{ mt: 1 }}
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
