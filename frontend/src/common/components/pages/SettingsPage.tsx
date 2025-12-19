'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ProfileCard from './ProfileCard';
import ContactCard from './ContactCard';
import { decryptData } from '../../utils/encryption';

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

interface SettingsPageProps {
    loginPath?: string;
    apiPath?: string;
}

export default function SettingsPage({ loginPath = '/employee/login', apiPath }: SettingsPageProps) {
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

    const sanitize = (val: any) => (typeof val === 'string' ? val : '');

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                setError('Authentication details missing');
                setLoading(false);
                return;
            }

            try {
                const employeeId = await decryptData(encryptedEmployeeId, token);
                if (!employeeId) throw new Error('Decryption failed');

                const employeeApiPath = apiPath || `/employee/${employeeId}`;
                const res = await fetch(`${apiUrl}${employeeApiPath}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const p = data.profile || data;
                    setProfile(p);

                    // Initialize form using sanitize helper
                    setBiography(sanitize(p.biography));
                    setMobilePhone(sanitize(p.mobilePhone));
                    setHomePhone(sanitize(p.homePhone));
                    setCity(sanitize(p.address?.city));
                    setStreetAddress(sanitize(p.address?.streetAddress));
                    setCountry(sanitize(p.address?.country));
                    setProfilePictureUrl(sanitize(p.profilePictureUrl));
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
    }, [apiUrl, apiPath]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const token = localStorage.getItem('access_token');
        const encryptedEmployeeId = localStorage.getItem('employeeId');

        try {
            if (!token || !encryptedEmployeeId) throw new Error('Auth missing');
            const employeeId = await decryptData(encryptedEmployeeId, token);
            if (!employeeId) throw new Error('Decryption failed');

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

            if (!profileRes.ok) throw new Error('Failed to update profile details (biography/picture)');

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

            if (!contactRes.ok) throw new Error('Profile saved, but failed to update contact info');

            setSuccess('Settings updated successfully');

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
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Settings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Grid container spacing={2} columns={12}>
                {/* Profile Picture & Bio */}
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                    <ProfileCard
                        profile={profile}
                        profilePictureUrl={profilePictureUrl}
                        setProfilePictureUrl={setProfilePictureUrl}
                        biography={biography}
                        setBiography={setBiography}
                        setError={setError}
                    />
                </Grid>

                {/* Contact Information */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    <ContactCard
                        saving={saving}
                        handleSaveProfile={handleSaveProfile}
                        mobilePhone={mobilePhone}
                        setMobilePhone={setMobilePhone}
                        homePhone={homePhone}
                        setHomePhone={setHomePhone}
                        streetAddress={streetAddress}
                        setStreetAddress={setStreetAddress}
                        city={city}
                        setCity={setCity}
                        country={country}
                        setCountry={setCountry}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}


