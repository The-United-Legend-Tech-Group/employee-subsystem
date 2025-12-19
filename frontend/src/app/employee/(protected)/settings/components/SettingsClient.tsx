'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ProfileCard from './ProfileCard';
import ContactCard from './ContactCard';
import SubmitRequestTab from './SubmitRequestTab';
import MyRequestsTab from './MyRequestsTab';

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

interface SettingsClientProps {
    initialProfile: EmployeeProfile | null;
    employeeId: string | null;
}

export default function SettingsClient({ initialProfile, employeeId }: SettingsClientProps) {
    const theme = useTheme();
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [profile, setProfile] = React.useState<EmployeeProfile | null>(initialProfile);
    const [activeTab, setActiveTab] = React.useState(0);

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
        if (profile) {
            setBiography(sanitize(profile.biography));
            setMobilePhone(sanitize(profile.mobilePhone));
            setHomePhone(sanitize(profile.homePhone));
            setCity(sanitize(profile.address?.city));
            setStreetAddress(sanitize(profile.address?.streetAddress));
            setCountry(sanitize(profile.address?.country));
            setProfilePictureUrl(sanitize(profile.profilePictureUrl));
        }
    }, [profile]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            if (!employeeId) throw new Error('Auth missing');

            // 1. Update Profile (Bio, Picture)
            const profilePayload = { biography, profilePictureUrl };
            const profileRes = await fetch(`${apiUrl}/employee/${employeeId}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profilePayload),
                credentials: 'include'
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactPayload),
                credentials: 'include'
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

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Settings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab label="Profile Settings" />
                    <Tab label="New Request" />
                    <Tab label="My Requests" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
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
            )}

            {activeTab === 1 && (
                <SubmitRequestTab employeeId={employeeId} />
            )}

            {activeTab === 2 && (
                <MyRequestsTab employeeId={employeeId} />
            )}
        </Box>
    );
}
