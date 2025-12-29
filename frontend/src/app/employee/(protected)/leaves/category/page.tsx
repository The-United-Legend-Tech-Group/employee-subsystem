'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import CreateLeaveCategoryForm from './_components/CreateLeaveCategoryForm';
import LeaveCategoryList from './_components/LeaveCategoryList';

export default function LeaveCategoryPage() {
  const [open, setOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  function handleCreated() {
    setOpen(false);
    setRefreshToken((t) => t + 1);
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2.5 },
        pb: 3,
        pt: 1,
        width: '100%',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Leave Category Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create new leave categories and manage existing ones.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Create Leave Category
          </Button>
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: theme.palette.divider,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.paperChannel} / 0.9)`
            : theme.palette.background.paper,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <LeaveCategoryList refreshToken={refreshToken} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Leave Category</DialogTitle>
        <DialogContent>
          <CreateLeaveCategoryForm onCreated={handleCreated} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
