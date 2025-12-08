'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';

interface Address {
    city?: string;
    streetAddress?: string;
    country?: string;
}

interface EmployeeProfile {
    _id: string;
    firstName: string;
    lastName: string;
    personalEmail?: string;
    workEmail?: string;
    mobilePhone?: string;
    homePhone?: string;
    address?: Address;
    biography?: string;
    profilePictureUrl?: string;
}

export default function SettingsPage() {
    const theme = useTheme();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [profile, setProfile] = React.useState<EmployeeProfile | null>(null);

    // Form States
    const [biography, setBiography] = React.useState('');
    const [mobilePhone, setMobilePhone] = React.useState('');
    const [homePhone, setHomePhone] = React.useState('');
    const [city, setCity] = React.useState('');
    const [streetAddress, setStreetAddress] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [profilePictureUrl, setProfilePictureUrl] = React.useState('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('access_token');
            const employeeId = localStorage.getItem('employeeId');

            if (!token || !employeeId) {
                setError('Authentication details missing');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${apiUrl}/employee/${employeeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const p = data.profile || data;
                    setProfile(p);
                    
                    // Initialize form
                    setBiography(p.biography || '');
                    setMobilePhone(p.mobilePhone || '');
                    setHomePhone(p.homePhone || '');
                    setCity(p.address?.city || '');
                    setStreetAddress(p.address?.streetAddress || '');
                    setCountry(p.address?.country || '');
                    setProfilePictureUrl(p.profilePictureUrl || '');
                } else {
                    setError('Failed to load profile');
                }
            } catch (e) {
                console.error(e);
                setError('An error occurred while loading profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [apiUrl]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const token = localStorage.getItem('access_token');
        const employeeId = localStorage.getItem('employeeId');

        try {
            // 1. Update Profile (Bio, Picture)
            const profilePayload = { biography, profilePictureUrl };
            const profileRes = await fetch(`${apiUrl}/employee/${employeeId}/profile`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profilePayload)
            });

            if (!profileRes.ok) throw new Error('Failed to update profile details');

            // 2. Update Contact Info
            const contactPayload = {
                mobilePhone,
                homePhone,
                address: { city, streetAddress, country }
            };
            const contactRes = await fetch(`${apiUrl}/employee/${employeeId}/contact-info`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactPayload)
            });

            if (!contactRes.ok) throw new Error('Failed to update contact info');

            setSuccess('Settings updated successfully');
            
            // Refresh local profile state slightly to reflect changes if needed, 
            // but we already have the form values.
            
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Settings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Grid container spacing={3}>
                {/* Profile Picture & Bio */}
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                            <Avatar 
                                src={profilePictureUrl} 
                                sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: 60 }}
                            >
                                {!profilePictureUrl && <PersonIcon fontSize="inherit" />}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" gutterBottom>{profile?.firstName} {profile?.lastName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {profile?.workEmail || profile?.personalEmail}
                                </Typography>
                            </Box>
                            
                            <Divider flexItem sx={{ my: 1 }} />

                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profile-picture-upload"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Optional: Check file size (e.g. 2MB limit)
                                        if (file.size > 2 * 1024 * 1024) {
                                            setError('File size too large. Please select an image under 2MB.');
                                            return;
                                        }
                                        
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setProfilePictureUrl(reader.result as string);
                                            setError(null); // Clear any previous errors
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <label htmlFor="profile-picture-upload">
                                <Button 
                                    variant="outlined" 
                                    component="span" 
                                    fullWidth
                                    sx={{ mt: 2, mb: 2 }}
                                >
                                    Upload Picture
                                </Button>
                            </label>

                            <TextField
                                fullWidth
                                label="Biography"
                                multiline
                                rows={6}
                                variant="outlined"
                                value={biography}
                                onChange={(e) => setBiography(e.target.value)}
                                placeholder="Tell us about yourself..."
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader 
                            title="Contact Information" 
                            subheader="Update your personal details and address" 
                            action={
                                <Button 
                                    variant="contained" 
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Phone Numbers</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Mobile Phone"
                                                value={mobilePhone}
                                                onChange={(e) => setMobilePhone(e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Home Phone"
                                                value={homePhone}
                                                onChange={(e) => setHomePhone(e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Address</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label="Street Address"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="City"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                label="Country"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
