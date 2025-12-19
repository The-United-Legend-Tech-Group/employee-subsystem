'use client';

import { useState, useEffect } from 'react';
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
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InventoryIcon from '@mui/icons-material/Inventory';
import LaptopIcon from '@mui/icons-material/Laptop';
import BadgeIcon from '@mui/icons-material/Badge';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function ResourceReservation() {
  const toast = useToast();
  const [showReserveForm, setShowReserveForm] = useState(false);

  const newHires = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Senior Developer',
      startDate: '2025-12-15',
      department: 'Engineering',
      resources: {
        laptop: 'Reserved - MacBook Pro 16"',
        desk: 'Reserved - Desk #A-42',
        accessCard: 'Pending',
        equipment: ['Monitor x2', 'Keyboard', 'Mouse'],
      },
      status: 'Partial',
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Product Manager',
      startDate: '2025-12-20',
      department: 'Product',
      resources: {
        laptop: 'Reserved - MacBook Air',
        desk: 'Reserved - Desk #B-15',
        accessCard: 'Reserved',
        equipment: ['Monitor', 'Headset'],
      },
      status: 'Complete',
    },
  ];

  const availableResources = {
    laptops: [
      { id: 1, model: 'MacBook Pro 16"', available: 3 },
      { id: 2, model: 'MacBook Air', available: 5 },
      { id: 3, model: 'Dell XPS 15', available: 2 },
    ],
    equipment: [
      { id: 4, item: 'Monitor 27"', available: 10 },
      { id: 5, item: 'Keyboard', available: 15 },
      { id: 6, item: 'Mouse', available: 20 },
      { id: 7, item: 'Headset', available: 8 },
    ],
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Resource Reservation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reserve and track equipment, desks and access cards for new hires
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<InventoryIcon />}
          onClick={() => setShowReserveForm(true)}
        >
          Reserve Resources
        </Button>
      </Stack>

      {/* New Hires Resource Tracking */}
      <Stack spacing={2}>
        {newHires.map((hire) => (
          <Card key={hire.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={500}>
                    {hire.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hire.position} · {hire.department}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start Date: {hire.startDate}
                  </Typography>
                </Box>
                <Chip
                  label={hire.status}
                  color={hire.status === 'Complete' ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <LaptopIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2">Laptop</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {hire.resources.laptop}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <InventoryIcon sx={{ fontSize: 20, color: 'success.main' }} />
                    <Typography variant="body2">Desk</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {hire.resources.desk}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <BadgeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                    <Typography variant="body2">Access Card</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {hire.resources.accessCard}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <VpnKeyIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="body2">Equipment</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {hire.resources.equipment.join(', ')}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button variant="outlined" size="small">
                  Modify Reservation
                </Button>
                {hire.status === 'Complete' && (
                  <Button variant="contained" color="success" size="small">
                    Mark as Ready
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Available Resources Inventory */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            Available Resources Inventory
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
              Laptops
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {availableResources.laptops.map((laptop) => (
                <Card key={laptop.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2">{laptop.model}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available: {laptop.available}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
              Equipment
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {availableResources.equipment.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2">{item.item}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available: {item.available}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Reserve Form Modal */}
      <Dialog
        open={showReserveForm}
        onClose={() => setShowReserveForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={500}>
            Reserve Resources for New Hire
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select New Hire</InputLabel>
              <Select label="Select New Hire">
                <MenuItem value="">Select new hire...</MenuItem>
                <MenuItem value="john">John Doe - Senior Developer</MenuItem>
                <MenuItem value="jane">Jane Smith - Product Manager</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Laptop</InputLabel>
              <Select label="Laptop">
                <MenuItem value="">Select laptop...</MenuItem>
                {availableResources.laptops.map((laptop) => (
                  <MenuItem key={laptop.id} value={laptop.id}>
                    {laptop.model} ({laptop.available} available)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Desk Assignment"
              fullWidth
              placeholder="e.g. A-42, B-15"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Additional Equipment
              </Typography>
              <Stack spacing={1}>
                {availableResources.equipment.map((item) => (
                  <FormControlLabel
                    key={item.id}
                    control={<Checkbox />}
                    label={`${item.item} (${item.available} available)`}
                  />
                ))}
              </Stack>
            </Box>

            <FormControlLabel
              control={<Checkbox />}
              label="Request access card"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShowReserveForm(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
          >
            Reserve Resources
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

