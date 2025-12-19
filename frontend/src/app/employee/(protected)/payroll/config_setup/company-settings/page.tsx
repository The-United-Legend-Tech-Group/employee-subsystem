'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  PageHeader,
  ConfigDialog,
  DeleteConfirmDialog,
} from '../_components';
import {
  companySettingsApi,
  type CompanySettingsResponse,
  type CreateCompanySettingsDto,
  type UpdateCompanySettingsDto,
} from '../_api/config-setup.api';
import { useConfigPermissions } from '../_utils/config-permissions';
import BackupManagement from '../_components/BackupManagement';
import { SystemRole } from '@/common/utils/role-routing';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EGP', label: 'Egyptian Pound (E£)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
  { code: 'SAR', label: 'Saudi Riyal (﷼)' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Africa/Cairo',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function CompanySettingsPage() {
  const router = useRouter();
  const theme = useTheme();
  const permissions = useConfigPermissions('company-settings');

  const [settings, setSettings] = React.useState<CompanySettingsResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CompanySettingsResponse | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<CompanySettingsResponse | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<CreateCompanySettingsDto>({
    payDate: new Date().toISOString().split('T')[0],
    timeZone: 'UTC',
    currency: 'USD',
  });

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await companySettingsApi.findAll();
      if (response.error) {
        setError(response.error);
      } else {
        setSettings(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch company settings');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleOpenDialog = (item?: CompanySettingsResponse) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        payDate: item.payDate.split('T')[0],
        timeZone: item.timeZone,
        currency: item.currency || 'USD',
      });
    } else {
      setEditingItem(null);
      setFormData({
        payDate: new Date().toISOString().split('T')[0],
        timeZone: 'UTC',
        currency: 'USD',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      payDate: new Date().toISOString().split('T')[0],
      timeZone: 'UTC',
      currency: 'USD',
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        const updateDto: UpdateCompanySettingsDto = {
          payDate: formData.payDate,
          timeZone: formData.timeZone,
          currency: formData.currency,
        };
        const response = await companySettingsApi.update(editingItem._id, updateDto);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Company settings updated successfully');
      } else {
        const response = await companySettingsApi.create(formData);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Company settings created successfully');
      }

      handleCloseDialog();
      fetchSettings();
    } catch (err) {
      setError('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setSaving(true);
      const response = await companySettingsApi.delete(deletingItem._id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess('Company settings deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchSettings();
    } catch (err) {
      setError('Failed to delete company settings');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCurrencyLabel = (code?: string) => {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.label : code || '-';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <PageHeader
        title="Company Settings"
        subtitle="Configure company-wide payroll settings including pay date and timezone"
        icon={<BusinessIcon />}
        action={permissions.canCreate ? {
          label: 'Add Settings',
          onClick: () => handleOpenDialog(),
          icon: <AddIcon />,
        } : undefined}
        backButton={{
          label: 'Back to Config',
          onClick: () => router.push('/employee/payroll/config_setup'),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {settings.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Company Settings Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add Settings" to configure your company-wide payroll settings.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Pay Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time Zone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting._id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{formatDate(setting.payDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{setting.timeZone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{getCurrencyLabel(setting.currency)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(setting.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(setting.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {permissions.canEdit && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(setting)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {permissions.canDelete && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setDeletingItem(setting);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ConfigDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editingItem ? 'Edit Company Settings' : 'Add Company Settings'}
        onSubmit={handleSubmit}
        loading={saving}
        icon={<BusinessIcon />}
      >
        <Stack spacing={3}>
          <TextField
            label="Pay Date"
            type="date"
            fullWidth
            value={formData.payDate}
            onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Time Zone"
            select
            fullWidth
            value={formData.timeZone}
            onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
            required
          >
            {TIMEZONES.map((tz) => (
              <MenuItem key={tz} value={tz}>{tz}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Currency"
            select
            fullWidth
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </ConfigDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        itemName="this company setting"
        loading={saving}
      />

      {/* Backup Management Section - Only for System Admin */}
      {permissions.roles.includes(SystemRole.SYSTEM_ADMIN) && (
        <BackupManagement />
      )}


    </Box>
  );
}
