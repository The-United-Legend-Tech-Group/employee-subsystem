
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';

interface PersonalInformationFormProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
    handleDateChange: (field: string, value: Dayjs | null) => void;
}

export default function PersonalInformationForm({ formData, handleChange, handleDateChange }: PersonalInformationFormProps) {
    return (
        <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>Personal Information</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>First Name</Typography>
                    <TextField size="small" fullWidth value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Middle Name</Typography>
                    <TextField size="small" fullWidth value={formData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Name</Typography>
                    <TextField size="small" fullWidth value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>National ID</Typography>
                    <TextField size="small" fullWidth value={formData.nationalId} onChange={(e) => handleChange('nationalId', e.target.value)} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Gender</Typography>
                    <TextField size="small" select fullWidth value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                        <MenuItem value="MALE">Male</MenuItem>
                        <MenuItem value="FEMALE">Female</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Marital Status</Typography>
                    <TextField size="small" select fullWidth value={formData.maritalStatus} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                        <MenuItem value="SINGLE">Single</MenuItem>
                        <MenuItem value="MARRIED">Married</MenuItem>
                        <MenuItem value="DIVORCED">Divorced</MenuItem>
                        <MenuItem value="WIDOWED">Widowed</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Biography</Typography>
                    <TextField size="small" fullWidth multiline rows={1} value={formData.biography} onChange={(e) => handleChange('biography', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Date of Birth</Typography>
                    <DatePicker
                        value={formData.dateOfBirth}
                        onChange={(newValue) => handleDateChange('dateOfBirth', newValue)}
                        slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
