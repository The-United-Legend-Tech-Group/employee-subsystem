"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { CVAnalysisResult } from "../services/atsService";

interface CVAnalysisResultsProps {
  filename: string;
  score: number;
  analysis: CVAnalysisResult;
  status: string;
  errorMessage?: string;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getColor = (score: number) => {
    if (score >= 80) return "success.main";
    if (score >= 60) return "warning.main";
    return "error.main";
  };

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={120}
        thickness={4}
        sx={{
          color: getColor(score),
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography variant="h4" component="div" fontWeight="bold">
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function CompletenessBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const getColor = (val: number) => {
    if (val >= 0.8) return "success";
    if (val >= 0.5) return "warning";
    return "error";
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">
          {percentage}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={getColor(value)}
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
}

export default function CVAnalysisResults({
  filename,
  score,
  analysis,
  status,
  errorMessage,
}: CVAnalysisResultsProps) {
  if (status === "pending" || status === "processing") {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6">
              {status === "pending" ? "Analysis Queued" : "Analyzing CV..."}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take 10-30 seconds. You can refresh to check progress.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              CV Analysis Failed
            </Typography>
            <Typography variant="body2">
              {errorMessage ||
                "An error occurred during CV processing. Please try uploading again."}
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Common issues:</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• File format not supported (use PDF, DOCX, or TXT)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• File is corrupted or password-protected" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• CV contains no extractable text (scanned images)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• API rate limit exceeded - please wait a moment" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    );
  }

  // If analysis data is missing but status is completed (should not happen)
  if (!analysis || Object.keys(analysis).length === 0) {
    return (
      <Alert severity="warning">
        Analysis data is not available. Please try re-analyzing this CV.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header with Overall Score */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            CV Analysis Results
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {filename}
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: "center" }}>
                <ScoreCircle score={score} label="Overall Score" />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Score Breakdown
              </Typography>
              {analysis.completeness && (
                <Stack spacing={1}>
                  {analysis.completeness.contact !== undefined && (
                    <CompletenessBar
                      label="Contact Information"
                      value={analysis.completeness.contact}
                    />
                  )}
                  {analysis.completeness.summary !== undefined && (
                    <CompletenessBar
                      label="Professional Summary"
                      value={analysis.completeness.summary}
                    />
                  )}
                  {analysis.completeness.experience !== undefined && (
                    <CompletenessBar
                      label="Work Experience"
                      value={analysis.completeness.experience}
                    />
                  )}
                  {analysis.completeness.education !== undefined && (
                    <CompletenessBar
                      label="Education"
                      value={analysis.completeness.education}
                    />
                  )}
                  {analysis.completeness.skills !== undefined && (
                    <CompletenessBar
                      label="Skills"
                      value={analysis.completeness.skills}
                    />
                  )}
                  {analysis.completeness.certifications !== undefined && (
                    <CompletenessBar
                      label="Certifications"
                      value={analysis.completeness.certifications}
                    />
                  )}
                </Stack>
              )}
              {analysis.relevanceScore !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`Relevance Score: ${analysis.relevanceScore}/100`}
                    color={
                      analysis.relevanceScore >= 70 ? "success" : "warning"
                    }
                    sx={{ mr: 1 }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card>
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TipsAndUpdatesIcon color="primary" />
              <Typography variant="h6">Suggestions for Improvement</Typography>
            </Stack>
            <List dense>
              {analysis.suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <ThumbUpIcon color="success" />
                  <Typography variant="h6">Strengths</Typography>
                </Stack>
                <List dense>
                  {analysis.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Weaknesses */}
        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <ThumbDownIcon color="warning" />
                  <Typography variant="h6">Areas for Improvement</Typography>
                </Stack>
                <List dense>
                  {analysis.weaknesses.map((weakness, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={weakness} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Grammar & Formatting Issues */}
      {((analysis.grammarIssues && analysis.grammarIssues.length > 0) ||
        (analysis.formattingIssues &&
          analysis.formattingIssues.length > 0)) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Issues
            </Typography>

            {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Grammar & Spelling
                </Typography>
                <List dense>
                  {analysis.grammarIssues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={issue.text}
                        secondary={`Suggestion: ${issue.suggestion}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {analysis.formattingIssues &&
              analysis.formattingIssues.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Formatting
                  </Typography>
                  <List dense>
                    {analysis.formattingIssues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${issue.section}: ${issue.issue}`}
                          secondary={`Suggestion: ${issue.suggestion}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
