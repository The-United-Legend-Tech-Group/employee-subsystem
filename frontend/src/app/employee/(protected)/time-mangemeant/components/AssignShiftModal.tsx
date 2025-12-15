"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

import { ShiftDefinition } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

type Employee = {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
};

type AssignShiftModalProps = {
    open: boolean;
    onClose: () => void;
    shifts: ShiftDefinition[];
    onSuccess: () => void;
};

export default function AssignShiftModal({
    open,
    onClose,
    shifts,
    onSuccess,
}: AssignShiftModalProps) {
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("");
    const [selectedShiftId, setSelectedShiftId] = React.useState("");
    const [startDate, setStartDate] = React.useState("");
    const [endDate, setEndDate] = React.useState("");

    // Load employees when modal opens
    React.useEffect(() => {
        if (!open) {
            return;
        }

        const loadEmployees = async () => {
            setLoadingEmployees(true);
            setError(null);

            try {
                const token = window.localStorage.getItem("access_token");
                if (!token) {
                    setError("Not authenticated");
                    return;
                }

                const response = await fetch(`${API_BASE}/employee/s`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch employees: ${response.status}`);
                }

                const data = await response.json();
                // Handle both array and paginated response
                const employeeList = Array.isArray(data) ? data : data.data || [];
                setEmployees(employeeList);
            } catch (err) {
                console.error("Error loading employees:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load employees"
                );
            } finally {
                setLoadingEmployees(false);
            }
        };

        loadEmployees();
    }, [open]);

    const handleReset = () => {
        setSelectedEmployeeId("");
        setSelectedShiftId("");
        setStartDate("");
        setEndDate("");
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
            const token = window.localStorage.getItem("access_token");
            if (!token) {
                throw new Error("Not authenticated");
            }

            // Build payload
            const payload: {
                employeeId: string;
                shiftId: string;
                startDate: string;
                endDate?: string;
            } = {
                employeeId: selectedEmployeeId,
                shiftId: selectedShiftId,
                startDate,
            };

            if (endDate) {
                payload.endDate = endDate;
            }

            const response = await fetch(`${API_BASE}/time/shifts/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Failed to assign shift: ${response.status}`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage =
                        errorJson.message || errorJson.error || errorMessage;
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
            console.error("Error assigning shift:", err);
            setError(err instanceof Error ? err.message : "Failed to assign shift");
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid =
        selectedEmployeeId && selectedShiftId && startDate && !submitting;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Assign Shift</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && (
                            <Alert severity="success">
                                Shift assigned successfully! Refreshing...
                            </Alert>
                        )}

                        <FormControl fullWidth required disabled={loadingEmployees}>
                            <InputLabel id="employee-select-label">Employee</InputLabel>
                            <Select
                                labelId="employee-select-label"
                                id="employee-select"
                                value={selectedEmployeeId}
                                label="Employee"
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            >
                                {loadingEmployees ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={20} />
                                        &nbsp;Loading employees...
                                    </MenuItem>
                                ) : employees.length === 0 ? (
                                    <MenuItem disabled>No employees available</MenuItem>
                                ) : (
                                    employees.map((employee) => (
                                        <MenuItem key={employee._id} value={employee._id}>
                                            {employee.firstName} {employee.lastName}
                                            {employee.email ? ` (${employee.email})` : ""}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel id="shift-select-label">Shift</InputLabel>
                            <Select
                                labelId="shift-select-label"
                                id="shift-select"
                                value={selectedShiftId}
                                label="Shift"
                                onChange={(e) => setSelectedShiftId(e.target.value)}
                            >
                                {shifts.length === 0 ? (
                                    <MenuItem disabled>No shifts available</MenuItem>
                                ) : (
                                    shifts
                                        .filter((shift) => shift.active !== false)
                                        .map((shift) => (
                                            <MenuItem key={shift._id} value={shift._id}>
                                                {shift.name} ({shift.startTime} - {shift.endTime})
                                            </MenuItem>
                                        ))
                                )}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />

                        <TextField
                            label="End Date (Optional)"
                            type="date"
                            fullWidth
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: startDate || undefined,
                            }}
                            helperText="Leave empty for ongoing assignment"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!isFormValid}
                        startIcon={submitting ? <CircularProgress size={16} /> : null}
                    >
                        {submitting ? "Assigning..." : "Assign Shift"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
