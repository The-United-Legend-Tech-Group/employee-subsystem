import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';

interface EmploymentDetailsFormProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
    handleDateChange: (field: string, value: Dayjs | null) => void;
}

export default function EmploymentDetailsForm({ formData, handleChange, handleDateChange }: EmploymentDetailsFormProps) {
    return (
        <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" color="primary" gutterBottom>Employment Details</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee Number</Typography>
                    <TextField size="small" fullWidth value={formData.employeeNumber} onChange={(e) => handleChange('employeeNumber', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
                    <TextField size="small" select fullWidth value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                        <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                        <MenuItem value="SUSPENDED">Suspended</MenuItem>
                        <MenuItem value="RETIRED">Retired</MenuItem>
                        <MenuItem value="PROBATION">Probation</MenuItem>
                        <MenuItem value="TERMINATED">Terminated</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Contract Type</Typography>
                    <TextField size="small" select fullWidth value={formData.contractType} onChange={(e) => handleChange('contractType', e.target.value)}>
                        <MenuItem value="FULL_TIME_CONTRACT">Full Time Contract</MenuItem>
                        <MenuItem value="PART_TIME_CONTRACT">Part Time Contract</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Work Type</Typography>
                    <TextField size="small" select fullWidth value={formData.workType} onChange={(e) => handleChange('workType', e.target.value)}>
                        <MenuItem value="FULL_TIME">Full Time</MenuItem>
                        <MenuItem value="PART_TIME">Part Time</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Date of Hire</Typography>
                    <DatePicker
                        value={formData.dateOfHire}
                        onChange={(newValue) => handleDateChange('dateOfHire', newValue)}
                        slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Contract Start Date</Typography>
                    <DatePicker
                        value={formData.contractStartDate}
                        onChange={(newValue) => handleDateChange('contractStartDate', newValue)}
                        slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Contract End Date</Typography>
                    <DatePicker
                        value={formData.contractEndDate}
                        onChange={(newValue) => handleDateChange('contractEndDate', newValue)}
                        slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
