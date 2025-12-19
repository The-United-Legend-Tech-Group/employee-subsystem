"use client";

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useToast } from '@/lib/hooks/useToast';
import { recruitmentApi } from '@/lib/api/recruitment';

interface Contract {
  _id: string;
  offerId: {
    _id: string;
    position?: string;
    role?: string;
    salaryOffered?: number;
    bonus?: number;
    candidateId?: string;
  };
  grossSalary: number;
  signingBonus?: number;
  role: string;
  benefits?: string[];
  documentId?: string;
  employeeSignedAt?: Date;
  employerSignedAt?: Date;
  createdAt: Date;
}

export default function HRContracts() {
  const toast = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [hrEmployeeId, setHrEmployeeId] = useState('673a1234567890abcdef9999'); // Temp HR ID

  // Custom employee data state
  const [useCustomData, setUseCustomData] = useState(false);
  const [customData, setCustomData] = useState({
    customFirstName: '',
    customLastName: '',
    customNationalId: '',
    customWorkEmail: '',
    customPersonalEmail: '',
    customStatus: 'PROBATION',
    customContractType: 'FULL_TIME_CONTRACT',
    customWorkType: 'FULL_TIME',
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getAllContracts();
      setContracts(response.data);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleHRSign = async (contractId: string) => {
    try {
      setSigning(true);
      const signData: any = {
        contractId,
        signedAt: new Date().toISOString(),
      };

      // Add custom employee data if enabled
      if (useCustomData) {
        signData.useCustomEmployeeData = true;
        signData.customFirstName = customData.customFirstName || undefined;
        signData.customLastName = customData.customLastName || undefined;
        signData.customNationalId = customData.customNationalId || undefined;

        signData.customWorkEmail = customData.customWorkEmail || undefined;
        signData.customPersonalEmail = customData.customPersonalEmail || undefined;
        signData.customStatus = customData.customStatus || undefined;
        signData.customContractType = customData.customContractType || undefined;
        signData.customWorkType = customData.customWorkType || undefined;
      }

      await recruitmentApi.hrSignContract(signData);
      toast.success('Contract signed successfully');
      setShowSignModal(false);
      setSelectedContract(null);
      setUseCustomData(false);
      setCustomData({
        customFirstName: '',
        customLastName: '',
        customNationalId: '',
        customWorkEmail: '',
        customPersonalEmail: '',
        customStatus: 'PROBATION',
        customContractType: 'FULL_TIME_CONTRACT',
        customWorkType: 'FULL_TIME',
      });
      fetchContracts();
    } catch (error: any) {
      // Extract the error message from the backend response
      let errorMessage = 'Failed to sign contract';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('Showing toast with message:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setSigning(false);
    }
  };

  const getContractStatus = (contract: Contract) => {
    if (contract.employeeSignedAt && contract.employerSignedAt) {
      return { label: 'Fully Signed', color: 'bg-green-100 text-green-800' };
    }
    if (contract.employeeSignedAt) {
      return { label: 'Awaiting HR Signature', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Awaiting Employee Signature', color: 'bg-blue-100 text-blue-800' };
  };

  const canHRSign = (contract: Contract) => {
    return contract.employeeSignedAt && !contract.employerSignedAt;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>
          Employment Contracts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {contracts.length} | Pending HR Signature: {contracts.filter(c => canHRSign(c)).length}
        </Typography>
      </Stack>

      {contracts.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" textAlign="center">No contracts available</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {contracts.map((contract) => {
            const status = getContractStatus(contract);

            return (
              <Card key={contract._id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={500}>
                        {contract.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Salary: ${contract.grossSalary?.toLocaleString() || 'N/A'}
                        {contract.signingBonus && contract.signingBonus > 0 &&
                          ` + $${contract.signingBonus.toLocaleString()} signing bonus`}
                      </Typography>
                      {contract.benefits && contract.benefits.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Benefits: {contract.benefits.join(', ')}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Created: {new Date(contract.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={status.label}
                      color={status.label === 'Fully Signed' ? 'success' : status.label === 'Awaiting HR Signature' ? 'warning' : 'info'}
                      size="small"
                    />
                  </Stack>

                  <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>Employee Signature</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {contract.employeeSignedAt
                            ? `Signed on ${new Date(contract.employeeSignedAt).toLocaleDateString()}`
                            : 'Not signed'}
                        </Typography>
                        {contract.documentId && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            onClick={async () => {
                              try {
                                // Use api instance to get blob with auth headers
                                const response = await recruitmentApi.viewDocument(contract.documentId!);
                                // Ensure we preserve MIME type when opening the blob
                                const blob = response.data instanceof Blob
                                  ? response.data
                                  : new Blob([response.data], { type: response.headers?.['content-type'] || 'application/pdf' });

                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('target', '_blank'); // Open in new tab
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                // Cleanup
                                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                              } catch (e) {
                                toast.error('Failed to view document');
                                console.error(e);
                              }
                            }}
                          >
                            View Signed Document
                          </Button>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>HR Signature</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {contract.employerSignedAt
                            ? `Signed on ${new Date(contract.employerSignedAt).toLocaleDateString()}`
                            : 'Not signed'}
                        </Typography>
                      </Box>
                    </Box>

                    {canHRSign(contract) && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowSignModal(true);
                        }}
                        sx={{ mt: 2 }}
                      >
                        Sign Contract as HR
                      </Button>
                    )}

                    {contract.employeeSignedAt && !contract.employerSignedAt && !canHRSign(contract) && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Waiting for employee to sign first.
                      </Alert>
                    )}

                    {!contract.employeeSignedAt && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Waiting for employee to sign the contract.
                      </Alert>
                    )}

                    {contract.employeeSignedAt && contract.employerSignedAt && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Contract fully executed. Employee profile created and onboarding initiated.
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Sign Confirmation Modal */}
      <Dialog
        open={showSignModal && selectedContract !== null}
        onClose={() => {
          setShowSignModal(false);
          setSelectedContract(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle sx={{ fontWeight: 500 }}>
              Sign Contract
            </DialogTitle>

            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Review and sign the contract for <strong>{selectedContract.role}</strong>
                </Typography>

                {/* Contract Summary */}
                <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 2, color: 'text.primary' }}>
                  <Typography variant="body2">
                    <strong>Salary:</strong> ${selectedContract.grossSalary?.toLocaleString()}
                  </Typography>
                  {selectedContract.signingBonus && selectedContract.signingBonus > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Signing Bonus:</strong> ${selectedContract.signingBonus.toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Employee Signed:</strong> {new Date(selectedContract.employeeSignedAt!).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Custom Employee Data Toggle */}
                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useCustomData}
                        onChange={(e) => setUseCustomData(e.target.checked)}
                      />
                    }
                    label="Use custom employee data (override candidate information)"
                  />
                </Box>

                {/* Custom Employee Data Form */}
                {useCustomData && (
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'primary.50', maxHeight: 400, overflowY: 'auto' }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
                      Custom Employee Information
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                      <TextField
                        label="First Name"
                        size="small"
                        value={customData.customFirstName}
                        onChange={(e) => setCustomData({ ...customData, customFirstName: e.target.value })}
                        placeholder="Leave empty to use candidate data"
                      />

                      <TextField
                        label="Last Name"
                        size="small"
                        value={customData.customLastName}
                        onChange={(e) => setCustomData({ ...customData, customLastName: e.target.value })}
                        placeholder="Leave empty to use candidate data"
                      />

                      <TextField
                        label="National ID"
                        size="small"
                        value={customData.customNationalId}
                        onChange={(e) => setCustomData({ ...customData, customNationalId: e.target.value })}
                        placeholder="Leave empty to use candidate data"
                      />



                      <TextField
                        label="Work Email"
                        type="email"
                        size="small"
                        value={customData.customWorkEmail}
                        onChange={(e) => setCustomData({ ...customData, customWorkEmail: e.target.value })}
                        placeholder="employee@company.com"
                        sx={{ gridColumn: 'span 2' }}
                      />

                      <TextField
                        label="Personal Email"
                        type="email"
                        size="small"
                        value={customData.customPersonalEmail}
                        onChange={(e) => setCustomData({ ...customData, customPersonalEmail: e.target.value })}
                        placeholder="personal@email.com (Required to avoid duplicates)"
                        sx={{ gridColumn: 'span 2' }}
                      />

                      <FormControl size="small">
                        <InputLabel>Employment Status</InputLabel>
                        <Select
                          value={customData.customStatus}
                          onChange={(e) => setCustomData({ ...customData, customStatus: e.target.value })}
                          label="Employment Status"
                        >
                          <MenuItem value="PROBATION">Probation</MenuItem>
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="NOTICE_PERIOD">Notice Period</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Contract Type</InputLabel>
                        <Select
                          value={customData.customContractType}
                          onChange={(e) => setCustomData({ ...customData, customContractType: e.target.value })}
                          label="Contract Type"
                        >
                          <MenuItem value="FULL_TIME_CONTRACT">Full Time Contract</MenuItem>
                          <MenuItem value="PART_TIME_CONTRACT">Part Time Contract</MenuItem>
                          <MenuItem value="TEMPORARY_CONTRACT">Temporary Contract</MenuItem>
                          <MenuItem value="INTERNSHIP">Internship</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ gridColumn: 'span 2' }}>
                        <InputLabel>Work Type</InputLabel>
                        <Select
                          value={customData.customWorkType}
                          onChange={(e) => setCustomData({ ...customData, customWorkType: e.target.value })}
                          label="Work Type"
                        >
                          <MenuItem value="FULL_TIME">Full Time</MenuItem>
                          <MenuItem value="PART_TIME">Part Time</MenuItem>
                          <MenuItem value="FLEXIBLE">Flexible</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                      * Leave fields empty to use candidate's original data. Only fill in fields you want to override.
                    </Typography>
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary">
                  By signing, you confirm that all contract terms are correct and the employee profile will be automatically created.
                </Typography>
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() => {
                  setShowSignModal(false);
                  setSelectedContract(null);
                }}
                disabled={signing}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleHRSign(selectedContract._id)}
                disabled={signing}
                variant="contained"
                color="success"
              >
                {signing ? 'Signing...' : 'Confirm Sign'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}

