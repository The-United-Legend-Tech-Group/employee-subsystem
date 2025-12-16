"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface CVUploadSectionProps {
  onUploadSuccess: (cvId: string) => void;
  employeeId: string;
}

export default function CVUploadSection({
  onUploadSuccess,
  employeeId,
}: CVUploadSectionProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [jobDescription, setJobDescription] = React.useState("");
  const [candidateId, setCandidateId] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please upload PDF, DOCX, DOC, or TXT files only."
      );
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (candidateId) formData.append("candidateId", candidateId);
      if (jobDescription) formData.append("jobDescription", jobDescription);

      const token = localStorage.getItem("access_token");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

      const response = await fetch(
        `${apiUrl}/recruitment/ats/upload?uploadedBy=${employeeId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Upload failed" }));
        throw new Error(errorData.message || "Failed to upload CV");
      }

      const data = await response.json();
      onUploadSuccess(data.id);

      // Reset form
      setSelectedFile(null);
      setJobDescription("");
      setCandidateId("");
    } catch (err: any) {
      setError(err.message || "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload CV for Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload a CV file (PDF, DOCX, TXT) to get AI-powered analysis and
          scoring
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Drag & Drop Area */}
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: "2px dashed",
              borderColor: dragActive ? "primary.main" : "divider",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: dragActive ? "action.hover" : "background.paper",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            {selectedFile ? (
              <Stack alignItems="center" spacing={1}>
                <DescriptionIcon sx={{ fontSize: 48, color: "primary.main" }} />
                <Typography variant="body1">{selectedFile.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  Remove
                </Button>
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={2}>
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "text.secondary" }}
                />
                <Typography variant="body1">
                  Drag & drop your CV here, or click to browse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: PDF, DOCX, DOC, TXT (Max 10MB)
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                >
                  Browse Files
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleChange}
                    accept=".pdf,.docx,.doc,.txt"
                  />
                </Button>
              </Stack>
            )}
          </Box>

          {/* Optional Fields */}
          <TextField
            label="Candidate ID (Optional)"
            placeholder="Enter MongoDB ID if linking to a candidate"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Job Description (Optional)"
            placeholder="Paste job description for relevance scoring..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />

          {/* Upload Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={<CloudUploadIcon />}
          >
            {uploading ? "Uploading & Analyzing..." : "Upload & Analyze"}
          </Button>

          {uploading && (
            <Box>
              <LinearProgress />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Processing may take 10-30 seconds...
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
