'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PersonalInformationForm from './edit/PersonalInformationForm';
import ContactInformationForm from './edit/ContactInformationForm';
import AddressForm from './edit/AddressForm';
import EmploymentDetailsForm from './edit/EmploymentDetailsForm';
import SecurityForm from './edit/SecurityForm';

interface EmployeeEditFormProps {
    employee: any;
    onUpdate: () => void;
}

export default function EmployeeEditForm({ employee, onUpdate }: EmployeeEditFormProps) {
    const router = useRouter();
    // Use dayjs for dates in state
    const [formData, setFormData] = React.useState<any>({
        firstName: '',
        middleName: '',
        lastName: '',
        nationalId: '',
        gender: '',
        maritalStatus: '',
        dateOfBirth: null,
        personalEmail: '',
        mobilePhone: '',
        homePhone: '',
        address: {
            city: '',
            streetAddress: '',
            country: ''
        },
        employeeNumber: '',
        dateOfHire: null,
        workEmail: '',
        biography: '',
        contractStartDate: null,
        contractEndDate: null,
        contractType: '',
        workType: '',
        status: '',
        profilePictureUrl: '',
        password: ''
    });

    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState('');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (employee) {
            setFormData({
                firstName: employee.firstName || '',
                middleName: employee.middleName || '',
                lastName: employee.lastName || '',
                nationalId: employee.nationalId || '',
                gender: employee.gender || '',
                maritalStatus: employee.maritalStatus || '',
                dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : null,
                personalEmail: employee.personalEmail || '',
                mobilePhone: employee.mobilePhone || '',
                homePhone: employee.homePhone || '',
                address: {
                    city: employee.address?.city || '',
                    streetAddress: employee.address?.streetAddress || '',
                    country: employee.address?.country || ''
                },
                employeeNumber: employee.employeeNumber || '',
                dateOfHire: employee.dateOfHire ? dayjs(employee.dateOfHire) : null,
                workEmail: employee.workEmail || '',
                biography: employee.biography || '',
                contractStartDate: employee.contractStartDate ? dayjs(employee.contractStartDate) : null,
                contractEndDate: employee.contractEndDate ? dayjs(employee.contractEndDate) : null,
                contractType: employee.contractType || '',
                workType: employee.workType || '',
                status: employee.status || '',
                profilePictureUrl: employee.profilePictureUrl || '',
                password: ''
            });
        }
    }, [employee]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field: string, value: Dayjs | null) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    }

    const handleAddressChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const payload: any = { ...formData };

            // Convert dayjs objects back to ISO strings
            payload.dateOfBirth = formData.dateOfBirth ? formData.dateOfBirth.toISOString() : null;
            payload.dateOfHire = formData.dateOfHire ? formData.dateOfHire.toISOString() : null;
            payload.contractStartDate = formData.contractStartDate ? formData.contractStartDate.toISOString() : null;
            payload.contractEndDate = formData.contractEndDate ? formData.contractEndDate.toISOString() : null;

            if (!payload.password) {
                delete payload.password;
            }

            if (payload.profilePictureUrl) delete payload.profilePictureUrl;

            const response = await fetch(`${apiUrl}/employee/${employee._id}/profile/admin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update profile');
            }

            setSuccess('Employee profile updated successfully');
            setFormData((prev: any) => ({ ...prev, password: '' }));
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12 }}>
                        <PersonalInformationForm
                            formData={formData}
                            handleChange={handleChange}
                            handleDateChange={handleDateChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <ContactInformationForm
                            formData={formData}
                            handleChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <AddressForm
                            formData={formData}
                            handleAddressChange={handleAddressChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <EmploymentDetailsForm
                            formData={formData}
                            handleChange={handleChange}
                            handleDateChange={handleDateChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <SecurityForm
                            formData={formData}
                            handleChange={handleChange}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="inherit"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.back()}
                    >
                        Back
                    </Button>
                    <Button variant="contained" type="submit" disabled={loading} size="large">
                        {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}
