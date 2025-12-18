"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CVUploadSection from "./components/CVUploadSection";
// import CVAnalysisResults from "./components/CVAnalysisResults";
import CVListSection from "./components/CVListSection";
import { atsService, CVRecord } from "./services/atsService";
import { decryptData } from "../../../../common/utils/encryption";

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
      id={`ats-tabpanel-${index}`}
      aria-labelledby={`ats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ATSPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState<string>("");
  const [tabValue, setTabValue] = React.useState(0);
  const [cvRecords, setCvRecords] = React.useState<CVRecord[]>([]);
  const [selectedCV, setSelectedCV] = React.useState<CVRecord | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cvToDelete, setCvToDelete] = React.useState<string | null>(null);

  // Fetch employee ID on mount
  React.useEffect(() => {
    const fetchEmployeeId = async () => {
      const token = localStorage.getItem("access_token");
      const encryptedEmployeeId = localStorage.getItem("employeeId");

      if (!token || !encryptedEmployeeId) {
        router.push("/employee/login");
        return;
      }

      try {
        const decryptedId = await decryptData(encryptedEmployeeId, token);
        if (!decryptedId) {
          router.push("/employee/login");
          return;
        }
        setEmployeeId(decryptedId);
      } catch (error) {
        console.error("Failed to decrypt employee ID", error);
        router.push("/employee/login");
      }
    };

    fetchEmployeeId();
  }, [router]);

  // Load CV records
  const loadCVRecords = React.useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError(null);

    try {
      const records = await atsService.getAllCVs(50, 0);
      setCvRecords(records);
    } catch (err: any) {
      setError(err.message || "Failed to load CV records");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    if (employeeId) {
      loadCVRecords();
    }
  }, [employeeId, loadCVRecords]);

  const handleUploadSuccess = async (cvId: string) => {
    setSuccessMessage("CV uploaded successfully! Analysis is in progress...");
    setTabValue(1); // Switch to History tab
    await loadCVRecords();

    // Auto-refresh to check for completion
    setTimeout(async () => {
      await loadCVRecords();
    }, 5000);
  };

  const handleViewDetails = async (cvId: string) => {
    setLoading(true);
    try {
      const cv = await atsService.getCVAnalysis(cvId);
      setSelectedCV(cv);
      setDetailsDialogOpen(true);
    } catch (err: any) {
      // If analysis not ready, try getting status
      try {
        const cv = await atsService.getCVStatus(cvId);
        setSelectedCV(cv);
        setDetailsDialogOpen(true);
      } catch (statusErr: any) {
        setError(statusErr.message || "Failed to load CV details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cvId: string) => {
    setCvToDelete(cvId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cvToDelete) return;

    setLoading(true);
    try {
      await atsService.deleteCV(cvToDelete);
      setSuccessMessage("CV deleted successfully");
      await loadCVRecords();
      setDeleteDialogOpen(false);
      setCvToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete CV");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedCV(null);
  };

  if (!employeeId) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom>
            CV Analysis System (ATS)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload CVs for AI-powered analysis, scoring, and improvement
            suggestions powered by Google Gemini
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Upload CV" />
            <Tab label="CV History" />
          </Tabs>
        </Box>

        {/* Upload Tab */}
        <TabPanel value={tabValue} index={0}>
          <CVUploadSection
            onUploadSuccess={handleUploadSuccess}
            employeeId={employeeId}
          />
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={1}>
          <CVListSection
            cvRecords={cvRecords}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
            onRefresh={loadCVRecords}
            loading={loading}
          />
        </TabPanel>
      </Stack>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          CV Analysis Details
          {selectedCV && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              Uploaded: {new Date(selectedCV.createdAt).toLocaleString()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {/* {selectedCV && (
            <CVAnalysisResults
              filename={selectedCV.filename}
              score={selectedCV.score || 0}
              analysis={selectedCV.analysis || {}}
              status={selectedCV.status}
              errorMessage={selectedCV.errorMessage}
            />
          )} */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this CV record? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
