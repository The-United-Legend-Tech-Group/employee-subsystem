'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

// Adjust imports based on your project structure
import AppTheme from '../../../common/material-ui/shared-theme/AppTheme';

import ArcanaLogo from '../../../common/material-ui/shared-theme/ArcanaLogo';
import ColorModeSelect from '../../../common/material-ui/shared-theme/ColorModeSelect';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    [theme.breakpoints.up('sm')]: {
        width: '600px',
    },
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    minHeight: '100dvh',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

export default function CandidateRegister() {
    const router = useRouter();

    const [firstNameError, setFirstNameError] = React.useState(false);
    const [firstNameErrorMessage, setFirstNameErrorMessage] = React.useState('');

    const [lastNameError, setLastNameError] = React.useState(false);
    const [lastNameErrorMessage, setLastNameErrorMessage] = React.useState('');

    const [nationalIdError, setNationalIdError] = React.useState(false);
    const [nationalIdErrorMessage, setNationalIdErrorMessage] = React.useState('');

    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');

    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

    const [formError, setFormError] = React.useState('');

    const validateInputs = () => {
        const firstName = document.getElementById('firstName') as HTMLInputElement;
        const lastName = document.getElementById('lastName') as HTMLInputElement;
        const nationalId = document.getElementById('nationalId') as HTMLInputElement;
        const email = document.getElementById('email') as HTMLInputElement;
        const password = document.getElementById('password') as HTMLInputElement;

        let isValid = true;

        if (!firstName.value || firstName.value.length < 1) {
            setFirstNameError(true);
            setFirstNameErrorMessage('First name is required.');
            isValid = false;
        } else {
            setFirstNameError(false);
            setFirstNameErrorMessage('');
        }

        if (!lastName.value || lastName.value.length < 1) {
            setLastNameError(true);
            setLastNameErrorMessage('Last name is required.');
            isValid = false;
        } else {
            setLastNameError(false);
            setLastNameErrorMessage('');
        }

        if (!nationalId.value || nationalId.value.length < 1) {
            setNationalIdError(true);
            setNationalIdErrorMessage('National ID is required.');
            isValid = false;
        } else {
            setNationalIdError(false);
            setNationalIdErrorMessage('');
        }

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!password.value || password.value.length < 8) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 8 characters long.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!validateInputs()) {
            return;
        }

        const data = new FormData(event.currentTarget);
        const payload = {
            firstName: data.get('firstName'),
            lastName: data.get('lastName'),
            middleName: data.get('middleName') || undefined,
            nationalId: data.get('nationalId'),
            personalEmail: data.get('email'),
            password: data.get('password'),
            mobilePhone: data.get('mobilePhone') || undefined,
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const response = await fetch(`${apiUrl}/auth/candidate/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Successful registration
                router.push('/candidate/login');
            } else {
                const errorData = await response.json();
                setFormError(errorData.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setFormError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <AppTheme>
            <CssBaseline enableColorScheme />

            <SignUpContainer direction="column" justifyContent="center">
                <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <ArcanaLogo />
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
                    >
                        Candidate Registration
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel htmlFor="firstName">First name</FormLabel>
                                <TextField
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    placeholder="Jon"
                                    error={firstNameError}
                                    helperText={firstNameErrorMessage}
                                    color={firstNameError ? 'error' : 'primary'}
                                />
                            </FormControl>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel htmlFor="lastName">Last name</FormLabel>
                                <TextField
                                    autoComplete="family-name"
                                    name="lastName"
                                    required
                                    fullWidth
                                    id="lastName"
                                    placeholder="Snow"
                                    error={lastNameError}
                                    helperText={lastNameErrorMessage}
                                    color={lastNameError ? 'error' : 'primary'}
                                />
                            </FormControl>
                        </Box>

                        <FormControl>
                            <FormLabel htmlFor="middleName">Middle name (Optional)</FormLabel>
                            <TextField
                                autoComplete="additional-name"
                                name="middleName"
                                fullWidth
                                id="middleName"
                                placeholder="Aegon"
                            />
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel htmlFor="nationalId">National ID</FormLabel>
                                <TextField
                                    required
                                    fullWidth
                                    id="nationalId"
                                    placeholder="1234567890"
                                    name="nationalId"
                                    variant="outlined"
                                    error={nationalIdError}
                                    helperText={nationalIdErrorMessage}
                                    color={nationalIdError ? 'error' : 'primary'}
                                />
                            </FormControl>

                            <FormControl sx={{ flex: 1 }}>
                                <FormLabel htmlFor="mobilePhone">Mobile Phone (Optional)</FormLabel>
                                <TextField
                                    fullWidth
                                    id="mobilePhone"
                                    placeholder="+1234567890"
                                    name="mobilePhone"
                                    autoComplete="tel"
                                    variant="outlined"
                                />
                            </FormControl>
                        </Box>

                        <FormControl>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                placeholder="your@email.com"
                                name="email"
                                autoComplete="email"
                                variant="outlined"
                                error={emailError}
                                helperText={emailErrorMessage}
                                color={emailError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                placeholder="••••••"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                variant="outlined"
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                color={passwordError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        {formError && (
                            <Typography color="error" variant="body2">
                                {formError}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                        >
                            Sign up
                        </Button>
                    </Box>
                    <Divider>
                        <Typography sx={{ color: 'text.secondary' }}>or</Typography>
                    </Divider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ textAlign: 'center' }}>
                            Already have an account?{' '}
                            <Link
                                href="/candidate/login"
                                variant="body2"
                                sx={{ alignSelf: 'center' }}
                            >
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignUpContainer>
        </AppTheme>
    );
}
