
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface ContactInformationFormProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
}

export default function ContactInformationForm({ formData, handleChange }: ContactInformationFormProps) {
    return (
        <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>Contact Information</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Personal Email</Typography>
                    <TextField size="small" fullWidth value={formData.personalEmail} onChange={(e) => handleChange('personalEmail', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Work Email</Typography>
                    <TextField size="small" fullWidth value={formData.workEmail} onChange={(e) => handleChange('workEmail', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Mobile Phone</Typography>
                    <TextField size="small" fullWidth value={formData.mobilePhone} onChange={(e) => handleChange('mobilePhone', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Home Phone</Typography>
                    <TextField size="small" fullWidth value={formData.homePhone} onChange={(e) => handleChange('homePhone', e.target.value)} />
                </Grid>
            </Grid>
        </Box>
    );
}
