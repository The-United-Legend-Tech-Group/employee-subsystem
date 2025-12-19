"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import { getAccessToken } from "@/lib/auth-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

const PATTERN_TYPES = [
    { value: "rotation", label: "Rotation Pattern", example: "4on-3off" },
    { value: "weekly", label: "Weekly Schedule", example: "Mon-Fri" },
    { value: "fixed", label: "Fixed Schedule", example: "Day Shift" },
    { value: "custom", label: "Custom Pattern", example: "Custom JSON" },
];

const ROTATION_PATTERNS = [
    { value: "4on-3off", label: "4 days on, 3 days off" },
    { value: "5on-2off", label: "5 days on, 2 days off" },
    { value: "6on-1off", label: "6 days on, 1 day off" },
    { value: "2on-2off", label: "2 days on, 2 days off" },
    { value: "3on-3off", label: "3 days on, 3 days off" },
];

const STATUS_OPTIONS = [
    { value: true, label: "Active" },
    { value: false, label: "Inactive" },
];

type CreateScheduleRuleModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function CreateScheduleRuleModal({
    open,
    onClose,
    onSuccess,
}: CreateScheduleRuleModalProps) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const [name, setName] = React.useState("");
    const [patternType, setPatternType] = React.useState("rotation");
    const [rotationPattern, setRotationPattern] = React.useState("");
    const [customPattern, setCustomPattern] = React.useState("");
    const [active, setActive] = React.useState(true);

    const handleReset = () => {
        setName("");
        setPatternType("rotation");
        setRotationPattern("");
        setCustomPattern("");
        setActive(true);
        setError(null);
        setSuccess(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSubmitting(true);

        try {
            const token = getAccessToken();

            // Determine the pattern based on type
            let pattern = "";
            if (patternType === "custom") {
                pattern = customPattern;
            } else if (patternType === "rotation") {
                pattern = rotationPattern;
            } else {
                pattern = patternType; // weekly or fixed
            }

            const payload = {
                name,
                pattern,
                active,
            };

            const response = await fetch(`${API_BASE}/time/schedule-rules`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>),
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Failed to create schedule rule: ${response.status}`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch {
                    // Ignore parse error
                }

                throw new Error(errorMessage);
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1000);
        } catch (err) {
            console.error("Error creating schedule rule:", err);
            setError(
                err instanceof Error ? err.message : "Failed to create schedule rule"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid =
        name.trim() &&
        ((patternType === "rotation" && rotationPattern) ||
            (patternType === "custom" && customPattern.trim()) ||
            (patternType !== "rotation" && patternType !== "custom")) &&
        !submitting;

    const selectedPatternType = PATTERN_TYPES.find(
        (pt) => pt.value === patternType
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ pb: 1 }}>Create Schedule Rule</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={3}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && (
                            <Alert severity="success">
                                Schedule rule created successfully! Refreshing...
                            </Alert>
                        )}

                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                Basic Information
                            </Typography>
                            <TextField
                                label="Rule Name"
                                fullWidth
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Morning Shift Rotation"
                                helperText="Give your schedule rule a descriptive name"
                            />
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                Pattern Configuration
                            </Typography>
                            <Stack spacing={2.5}>
                                <FormControl fullWidth required>
                                    <InputLabel>Pattern Type</InputLabel>
                                    <Select
                                        value={patternType}
                                        label="Pattern Type"
                                        onChange={(e) => {
                                            setPatternType(e.target.value);
                                            setRotationPattern("");
                                            setCustomPattern("");
                                        }}
                                    >
                                        {PATTERN_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        Select the type of schedule pattern
                                        {selectedPatternType && (
                                            <> • Example: {selectedPatternType.example}</>
                                        )}
                                    </FormHelperText>
                                </FormControl>

                                {patternType === "rotation" && (
                                    <FormControl fullWidth required>
                                        <InputLabel>Rotation Pattern</InputLabel>
                                        <Select
                                            value={rotationPattern}
                                            label="Rotation Pattern"
                                            onChange={(e) => setRotationPattern(e.target.value)}
                                        >
                                            {ROTATION_PATTERNS.map((pattern) => (
                                                <MenuItem key={pattern.value} value={pattern.value}>
                                                    {pattern.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>
                                            Choose a predefined rotation pattern
                                        </FormHelperText>
                                    </FormControl>
                                )}

                                {patternType === "custom" && (
                                    <TextField
                                        label="Custom Pattern"
                                        fullWidth
                                        required
                                        multiline
                                        rows={3}
                                        value={customPattern}
                                        onChange={(e) => setCustomPattern(e.target.value)}
                                        placeholder='e.g., {"days": [1,2,3,4], "rest": [5,6,0]}'
                                        helperText="Enter your custom pattern (text or JSON format)"
                                    />
                                )}
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                Rule Status
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={active}
                                    label="Status"
                                    onChange={(e) => setActive(e.target.value as boolean)}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={String(option.value)} value={option.value as any}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    Active rules can be assigned to shifts
                                </FormHelperText>
                            </FormControl>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!isFormValid}
                        startIcon={submitting ? <CircularProgress size={16} /> : null}
                    >
                        {submitting ? "Creating..." : "Create Rule"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
