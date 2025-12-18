"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { recruitmentApi } from '@/lib/api/recruitment';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface Contract {
  _id: string;
  offerId: {
    _id: string;
    position: string;
    salaryOffered: number;
    bonus: number;
  };
  candidateId: string;
  documentId?: string;
  employeeSignedAt?: Date;
  employerSignedAt?: Date; // Renamed from hrSignedAt to match backend
  createdAt: Date;
}

interface ContractCardProps {
  contract: Contract;
  onRefresh: () => void;
}

function ContractCard({ contract, onRefresh }: ContractCardProps) {
  const toast = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedFiles([]);
  };

  const handleUploadSignedContract = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      await recruitmentApi.signContract(
        { contractId: contract._id },
        selectedFiles
      );
      toast.success('Contract signed successfully');
      setSelectedFiles([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error uploading signed contract:', error);
      toast.error('Failed to upload signed contract');
    } finally {
      setUploading(false);
    }
  };

  const getContractStatus = (contract: Contract) => {
    if (contract.employerSignedAt) {
      return { label: 'Fully Signed', color: 'success' as const, icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
    }
    if (contract.employeeSignedAt) {
      return { label: 'Awaiting HR Signature', color: 'warning' as const, icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> };
    }
    return { label: 'Awaiting Your Signature', color: 'info' as const, icon: <WarningIcon sx={{ fontSize: 16 }} /> };
  };

  const getProgress = (contract: Contract) => {
    if (contract.employerSignedAt) return 100;
    if (contract.employeeSignedAt) return 50;
    return 0;
  };

  const status = getContractStatus(contract);
  const progress = getProgress(contract);
  // Allow candidate to re-upload/sign as long as HR hasn't signed yet
  const canSign = !contract.employerSignedAt;

  return (
    <Card
      variant="outlined"
      sx={{
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.15) : 'primary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DescriptionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {contract.offerId?.position || 'Employment Contract'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(contract.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
            <Chip
              icon={status.icon}
              label={status.label}
              color={status.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {/* Progress */}
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Signing Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={progress === 100 ? 'success' : progress > 0 ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>

          <Divider />

          {/* Compensation */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Compensation Details
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.15) : 'success.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Annual Salary
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    ${contract.offerId?.salaryOffered?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
              {contract.offerId?.bonus > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.secondary.main, 0.15) : 'secondary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AttachMoneyIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Signing Bonus
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="secondary.main">
                      ${contract.offerId.bonus.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Stack>

          {/* Signature Status Box */}
          {/* Signature Status Box */}
          <Box sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'transparent' : 'action.hover',
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  {contract.employeeSignedAt ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <AccessTimeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  )}
                  <Typography variant="subtitle2" fontWeight={600}>Your Signature</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {contract.employeeSignedAt
                    ? `Signed on ${new Date(contract.employeeSignedAt).toLocaleDateString()}`
                    : 'Awaiting your signature'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  {contract.employerSignedAt ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <AccessTimeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  )}
                  <Typography variant="subtitle2" fontWeight={600}>HR Signature</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {contract.employerSignedAt
                    ? `Signed on ${new Date(contract.employerSignedAt).toLocaleDateString()}`
                    : 'Awaiting HR signature'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Alert Status */}
          {contract.employeeSignedAt && !contract.employerSignedAt && (
            <Alert severity="warning" icon={<AccessTimeIcon sx={{ fontSize: 20 }} />} sx={{ borderRadius: 2 }}>
              Your signature has been submitted. Waiting for HR to sign.
            </Alert>
          )}
          {contract.employeeSignedAt && contract.employerSignedAt && (
            <Alert severity="success" icon={<CheckCircleIcon sx={{ fontSize: 20 }} />} sx={{ borderRadius: 2 }}>
              Contract fully executed. Both parties have signed!
            </Alert>
          )}
        </Stack>
      </CardContent>

      {/* Action Area */}
      {canSign && (
        <>
          <Divider />
          <CardActions sx={{ p: 3, display: 'block' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Upload Signed Contract
            </Typography>
            <Stack spacing={2}>
              <Box
                component="label"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderRadius: 2,
                  borderColor: selectedFiles.length > 0 ? 'primary.main' : 'divider',
                  bgcolor: selectedFiles.length > 0
                    ? (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.15) : 'primary.50'
                    : (theme) => theme.palette.mode === 'dark' ? 'transparent' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.05) : 'action.hover'
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />

                {selectedFiles.length > 0 ? (
                  <>
                    <Box sx={{ p: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : 'primary.100', borderRadius: '50%', color: 'primary.main', mb: 1 }}>
                      <DescriptionIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {selectedFiles[0].name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready to upload
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={handleRemoveFile}
                      sx={{ mt: 1 }}
                      startIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <Box sx={{ p: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover', borderRadius: '50%', color: 'text.secondary', mb: 1 }}>
                      <CloudUploadIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Click to upload or drag and drop
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF, DOC, DOCX (max 10MB)
                    </Typography>
                  </>
                )}
              </Box>

              <Button
                onClick={handleUploadSignedContract}
                disabled={uploading || selectedFiles.length === 0}
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontWeight: 600,
                  // Override theme's gray background to use actual primary blue
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon sx={{ fontSize: 20 }} />}
              >
                {uploading ? 'Uploading...' : 'Submit Signed Contract'}
              </Button>
            </Stack>
          </CardActions>
        </>
      )}
    </Card>
  );
}

export default function CandidateContracts({ }: {}) {
  const toast = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getMyContracts();
      setContracts(response.data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <DescriptionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>
            My Contracts
          </Typography>
        </Stack>

        {loading ? (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">Loading contracts...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : contracts.length > 0 ? (
          <Stack spacing={3}>
            {contracts.map((contract) => (
              <ContractCard
                key={contract._id}
                contract={contract}
                onRefresh={fetchContracts}
              />
            ))}
          </Stack>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
                <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Box textAlign="center">
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No contracts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When you receive a contract, it will appear here
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
