'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastState {
    open: boolean;
    message: string;
    severity: AlertColor;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: '',
        severity: 'info',
    });

    const showToast = useCallback((message: string, severity: AlertColor) => {
        setToast({ open: true, message, severity });
    }, []);

    const handleClose = useCallback(
        (_event?: React.SyntheticEvent | Event, reason?: string) => {
            if (reason === 'clickaway') return;
            setToast((prev) => ({ ...prev, open: false }));
        },
        []
    );

    const value: ToastContextValue = {
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        info: (message: string) => showToast(message, 'info'),
        warning: (message: string) => showToast(message, 'warning'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={toast.severity} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
