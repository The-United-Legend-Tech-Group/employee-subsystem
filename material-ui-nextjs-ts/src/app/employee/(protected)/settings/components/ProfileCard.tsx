import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

interface EmployeeProfile {
    firstName: string;
    lastName: string;
    personalEmail?: string;
    workEmail?: string;
}

interface ProfileCardProps {
    profile: EmployeeProfile | null;
    profilePictureUrl: string;
    setProfilePictureUrl: (url: string) => void;
    biography: string;
    setBiography: (value: string) => void;
    setError: (error: string | null) => void;
}

export default function ProfileCard({
    profile,
    profilePictureUrl,
    setProfilePictureUrl,
    biography,
    setBiography,
    setError
}: ProfileCardProps) {
    const sanitize = (val: string | undefined | null) => (val === 'string' || val === null ? undefined : val);

    return (
        <Card variant="outlined" sx={{ height: 'fit-content', minHeight: '100%', width: '100%' }}>
            <CardContent>
                <Stack spacing={2} alignItems="center">
                    <Avatar
                        src={sanitize(profilePictureUrl)}
                        sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 50 }}
                    >
                        {!sanitize(profilePictureUrl) && <PersonIcon fontSize="inherit" />}
                    </Avatar>

                    <Box textAlign="center">
                        <Typography variant="h6" component="div">
                            {sanitize(profile?.firstName)} {sanitize(profile?.lastName)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {sanitize(profile?.workEmail) || sanitize(profile?.personalEmail)}
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        size="small"
                    >
                        Upload Picture
                        <input
                            accept="image/*"
                            type="file"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                        setError('File size too large. Please select an image under 2MB.');
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setProfilePictureUrl(reader.result as string);
                                        setError(null);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </Button>

                    <Divider flexItem />

                    <Box width="100%">
                        <Typography variant="subtitle2" gutterBottom>
                            Biography
                        </Typography>
                        <TextField
                        fullWidth
                        placeholder="Biography"
                        multiline
                        rows={1}
                        minRows={1}
                        variant="outlined"
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        sx={{ textAlign: 'left', mt: 2 }}
                    />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
