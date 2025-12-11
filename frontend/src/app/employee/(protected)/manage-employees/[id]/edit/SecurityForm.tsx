
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface SecurityFormProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
}

export default function SecurityForm({ formData, handleChange }: SecurityFormProps) {
    return (
        <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>Security</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>New Password (leave blank to keep current)</Typography>
                    <TextField
                        size="small"
                        fullWidth
                        type="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        helperText="Only enter a value if you want to change the user's password"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
