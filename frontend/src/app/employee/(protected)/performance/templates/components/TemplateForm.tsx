'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Typography,
    FormControlLabel,
    Switch,
    Paper,
    IconButton,
    Divider,
    Select,
    InputLabel,
    FormControl,
    Chip,
    OutlinedInput,
    Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
    AppraisalTemplate,
    CreateAppraisalTemplateDto,
    AppraisalTemplateType,
    AppraisalRatingScaleType,
    EvaluationCriterion,
    Department,
    Position,
} from '../types';

interface TemplateFormProps {
    initialData?: AppraisalTemplate;
    departments: Department[];
    positions: Position[];
    onSubmit: (data: CreateAppraisalTemplateDto) => void;
    onCancel: () => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

export default function TemplateForm({
    initialData,
    departments,
    positions,
    onSubmit,
    onCancel,
}: TemplateFormProps) {
    const [formData, setFormData] = useState<CreateAppraisalTemplateDto>({
        name: '',
        description: '',
        templateType: AppraisalTemplateType.ANNUAL,
        ratingScale: {
            type: AppraisalRatingScaleType.FIVE_POINT,
            min: 1,
            max: 5,
            step: 1,
            labels: [],
        },
        criteria: [],
        instructions: '',
        applicableDepartmentIds: [],
        applicablePositionIds: [],
        isActive: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                templateType: initialData.templateType,
                ratingScale: initialData.ratingScale,
                criteria: initialData.criteria || [],
                instructions: initialData.instructions || '',
                applicableDepartmentIds: initialData.applicableDepartmentIds || [],
                applicablePositionIds: initialData.applicablePositionIds || [],
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData]);

    const handleChange = (field: keyof CreateAppraisalTemplateDto, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRatingScaleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            ratingScale: { ...prev.ratingScale, [field]: value },
        }));
    };

    const handleAddCriterion = () => {
        setFormData((prev) => ({
            ...prev,
            criteria: [
                ...(prev.criteria || []),
                {
                    key: `criterion_${Date.now()}`,
                    title: '',
                    details: '',
                    weight: 0,
                    maxScore: prev.ratingScale.max,
                    required: true,
                },
            ],
        }));
    };

    const handleRemoveCriterion = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            criteria: prev.criteria?.filter((_, i) => i !== index),
        }));
    };

    const handleCriterionChange = (index: number, field: keyof EvaluationCriterion, value: any) => {
        setFormData((prev) => {
            const newCriteria = [...(prev.criteria || [])];
            newCriteria[index] = { ...newCriteria[index], [field]: value };
            return { ...prev, criteria: newCriteria };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Basic Information
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                        <TextField
                            fullWidth
                            label="Template Name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                        <TextField
                            fullWidth
                            select
                            label="Template Type"
                            value={formData.templateType}
                            onChange={(e) => handleChange('templateType', e.target.value)}
                        >
                            {Object.values(AppraisalTemplateType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Instructions"
                            value={formData.instructions}
                            onChange={(e) => handleChange('instructions', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => handleChange('isActive', e.target.checked)}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </Stack>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Rating Scale
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '33.3333%' } }}>
                        <TextField
                            fullWidth
                            select
                            label="Scale Type"
                            value={formData.ratingScale.type}
                            onChange={(e) => handleRatingScaleChange('type', e.target.value)}
                        >
                            {Object.values(AppraisalRatingScaleType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '33.3333%' } }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Minimum Value"
                            value={formData.ratingScale.min}
                            onChange={(e) => handleRatingScaleChange('min', Number(e.target.value))}
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '33.3333%' } }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Maximum Value"
                            value={formData.ratingScale.max}
                            onChange={(e) => handleRatingScaleChange('max', Number(e.target.value))}
                        />
                    </Box>
                </Stack>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Evaluation Criteria</Typography>
                    <Button startIcon={<AddIcon />} onClick={handleAddCriterion}>
                        Add Criterion
                    </Button>
                </Box>
                {formData.criteria?.map((criterion, index) => (
                    <Box key={criterion.key || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        value={criterion.title}
                                        onChange={(e) => handleCriterionChange(index, 'title', e.target.value)}
                                        required
                                    />
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                    <TextField
                                        fullWidth
                                        label="Details"
                                        value={criterion.details}
                                        onChange={(e) => handleCriterionChange(index, 'details', e.target.value)}
                                    />
                                </Box>
                            </Stack>

                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Weight (0-100)"
                                        value={criterion.weight ?? 0}
                                        onChange={(e) => handleCriterionChange(index, 'weight', Number(e.target.value))}
                                    />
                                </Box>

                                <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(criterion.required)}
                                                onChange={(e) => handleCriterionChange(index, 'required', e.target.checked)}
                                            />
                                        }
                                        label="Required"
                                    />
                                </Box>

                                <Box sx={{ ml: 'auto' }}>
                                    <IconButton color="error" onClick={() => handleRemoveCriterion(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Stack>
                        </Stack>
                    </Box>
                ))}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Applicability
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                        <FormControl fullWidth>
                            <InputLabel>Departments</InputLabel>
                            <Select
                                multiple
                                value={formData.applicableDepartmentIds || []}
                                onChange={(e) => handleChange('applicableDepartmentIds', e.target.value)}
                                input={<OutlinedInput label="Departments" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {Array.isArray(selected)
                                            ? selected.map((value) => (
                                                  <Chip
                                                      key={value}
                                                      label={departments.find((d) => d._id === value)?.name || value}
                                                  />
                                              ))
                                            : null}
                                    </Box>
                                )}
                                MenuProps={MenuProps}
                            >
                                {departments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                        <FormControl fullWidth>
                            <InputLabel>Positions</InputLabel>
                            <Select
                                multiple
                                value={formData.applicablePositionIds || []}
                                onChange={(e) => handleChange('applicablePositionIds', e.target.value)}
                                input={<OutlinedInput label="Positions" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {Array.isArray(selected)
                                            ? selected.map((value) => (
                                                  <Chip
                                                      key={value}
                                                      label={positions.find((p) => p._id === value)?.title || value}
                                                  />
                                              ))
                                            : null}
                                    </Box>
                                )}
                                MenuProps={MenuProps}
                            >
                                {positions.map((pos) => (
                                    <MenuItem key={pos._id} value={pos._id}>
                                        {pos.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Stack>
            </Paper>

            <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                    Save Template
                </Button>
            </Box>
        </form>
    );
}
