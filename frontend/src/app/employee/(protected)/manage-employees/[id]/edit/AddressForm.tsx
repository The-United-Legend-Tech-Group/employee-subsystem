import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface AddressFormProps {
    formData: any;
    handleAddressChange: (field: string, value: any) => void;
}

export default function AddressForm({ formData, handleAddressChange }: AddressFormProps) {
    return (
        <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>Address</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>City</Typography>
                    <TextField size="small" fullWidth value={formData.address.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Street Address</Typography>
                    <TextField size="small" fullWidth value={formData.address.streetAddress} onChange={(e) => handleAddressChange('streetAddress', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Country</Typography>
                    <TextField size="small" fullWidth value={formData.address.country} onChange={(e) => handleAddressChange('country', e.target.value)} />
                </Grid>
            </Grid>
        </Box>
    );
}
