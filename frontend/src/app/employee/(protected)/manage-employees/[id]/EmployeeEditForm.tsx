'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PersonalInformationForm from './edit/PersonalInformationForm';
import ContactInformationForm from './edit/ContactInformationForm';
import AddressForm from './edit/AddressForm';
import EmploymentDetailsForm from './edit/EmploymentDetailsForm';
import SecurityForm from './edit/SecurityForm';
import EmployeeRoleForm from './edit/EmployeeRoleForm';

interface EmployeeEditFormProps {
    employee: any;
    onUpdate: () => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`employee-tabpanel-${index}`}
            aria-labelledby={`employee-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `employee-tab-${index}`,
        'aria-controls': `employee-tabpanel-${index}`,
    };
}

export default function EmployeeEditForm({ employee, onUpdate }: EmployeeEditFormProps) {
    const router = useRouter();
    const [tabValue, setTabValue] = React.useState(0);

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

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

    const saveToApi = async (payload: any) => {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

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

        return response;
    };

    const handleSavePersonalInfo = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                nationalId: formData.nationalId,
                gender: formData.gender,
                maritalStatus: formData.maritalStatus,
                dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : null,
                biography: formData.biography
            };

            await saveToApi(payload);
            setSuccess('Personal information updated successfully');
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveContactInfo = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                personalEmail: formData.personalEmail,
                workEmail: formData.workEmail,
                mobilePhone: formData.mobilePhone,
                homePhone: formData.homePhone,
                address: formData.address
            };

            await saveToApi(payload);
            setSuccess('Contact information updated successfully');
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmploymentDetails = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                employeeNumber: formData.employeeNumber,
                status: formData.status,
                contractType: formData.contractType,
                workType: formData.workType,
                dateOfHire: formData.dateOfHire ? formData.dateOfHire.toISOString() : null,
                contractStartDate: formData.contractStartDate ? formData.contractStartDate.toISOString() : null,
                contractEndDate: formData.contractEndDate ? formData.contractEndDate.toISOString() : null
            };

            await saveToApi(payload);
            setSuccess('Employment details updated successfully');
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSecurity = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!formData.password) {
                setError('Please enter a new password');
                setLoading(false);
                return;
            }

            const payload = {
                password: formData.password
            };

            await saveToApi(payload);
            setSuccess('Password updated successfully');
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

            <Snackbar
                open={!!success}
                autoHideDuration={4000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="employee edit tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Personal" {...a11yProps(0)} />
                    <Tab icon={<ContactMailIcon />} iconPosition="start" label="Contact & Address" {...a11yProps(1)} />
                    <Tab icon={<WorkIcon />} iconPosition="start" label="Employment" {...a11yProps(2)} />
                    <Tab icon={<AdminPanelSettingsIcon />} iconPosition="start" label="Roles" {...a11yProps(3)} />
                    <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" {...a11yProps(4)} />
                </Tabs>
            </Box>

            <Box>
                {/* Personal Information Tab */}
                <TabPanel value={tabValue} index={0}>
                    <PersonalInformationForm
                        formData={formData}
                        handleChange={handleChange}
                        handleDateChange={handleDateChange}
                    />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSavePersonalInfo}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Personal Info'}
                        </Button>
                    </Box>
                </TabPanel>

                {/* Contact & Address Tab */}
                <TabPanel value={tabValue} index={1}>
                    <ContactInformationForm
                        formData={formData}
                        handleChange={handleChange}
                    />
                    <Box sx={{ mt: 3 }}>
                        <AddressForm
                            formData={formData}
                            handleAddressChange={handleAddressChange}
                        />
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveContactInfo}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Contact Info'}
                        </Button>
                    </Box>
                </TabPanel>

                {/* Employment Details Tab */}
                <TabPanel value={tabValue} index={2}>
                    <EmploymentDetailsForm
                        formData={formData}
                        handleChange={handleChange}
                        handleDateChange={handleDateChange}
                    />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveEmploymentDetails}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Employment Details'}
                        </Button>
                    </Box>
                </TabPanel>

                {/* Roles Tab */}
                <TabPanel value={tabValue} index={3}>
                    <EmployeeRoleForm
                        employeeId={employee._id}
                        currentRoles={employee.roles || []}
                        onUpdate={onUpdate}
                    />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                    </Box>
                </TabPanel>

                {/* Security Tab */}
                <TabPanel value={tabValue} index={4}>
                    <SecurityForm
                        formData={formData}
                        handleChange={handleChange}
                    />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveSecurity}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} /> : 'Update Password'}
                        </Button>
                    </Box>
                </TabPanel>
            </Box>
        </LocalizationProvider>
    );
}
