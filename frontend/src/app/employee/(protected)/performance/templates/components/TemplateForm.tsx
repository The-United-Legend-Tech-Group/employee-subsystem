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
    Tabs,
    Tab,
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

interface FormActionsProps {
    onCancel: () => void;
}

const FormActions = ({ onCancel }: FormActionsProps) => (
    <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button variant="outlined" onClick={onCancel}>
            Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
            Save Template
        </Button>
    </Box>
);

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

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


    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const FormActionsWithCancel = () => <FormActions onCancel={onCancel} />;

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="template form tabs">
                    <Tab label="Basic Information" />
                    <Tab label="Rating Scale" />
                    <Tab label="Evaluation Criteria" />
                    <Tab label="Applicability" />
                </Tabs>
            </Box>

            <CustomTabPanel value={tabValue} index={0}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Basic Information
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Template Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter template name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                            />
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Template Type
                            </Typography>
                            <TextField
                                fullWidth
                                select
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
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Description
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={1}
                                placeholder="Enter description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Instructions
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={1}
                                placeholder="Enter instructions"
                                value={formData.instructions}
                                onChange={(e) => handleChange('instructions', e.target.value)}
                            />
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Status
                            </Typography>
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
                    <FormActionsWithCancel />
                </Paper>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Rating Scale
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ width: { xs: '100%', md: '33.3333%' } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Scale Type
                            </Typography>
                            <TextField
                                fullWidth
                                select
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
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Minimum Value
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                value={formData.ratingScale.min}
                                onChange={(e) => handleRatingScaleChange('min', Number(e.target.value))}
                            />
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: '33.3333%' } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Maximum Value
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                value={formData.ratingScale.max}
                                onChange={(e) => handleRatingScaleChange('max', Number(e.target.value))}
                            />
                        </Box>
                    </Stack>
                    <FormActionsWithCancel />
                </Paper>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Evaluation Criteria</Typography>
                        <Button startIcon={<AddIcon />} onClick={handleAddCriterion}>
                            Add Criterion
                        </Button>
                    </Box>
                    {formData.criteria?.map((criterion, index) => (
                        <Box key={criterion.key || index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Title
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Criterion title"
                                            value={criterion.title}
                                            onChange={(e) => handleCriterionChange(index, 'title', e.target.value)}
                                            required
                                        />
                                    </Box>
                                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Details
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Criterion details"
                                            value={criterion.details}
                                            onChange={(e) => handleCriterionChange(index, 'details', e.target.value)}
                                        />
                                    </Box>
                                </Stack>

                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                    <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Weight (0-100)
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            value={criterion.weight ?? 0}
                                            onChange={(e) => handleCriterionChange(index, 'weight', Number(e.target.value))}
                                        />
                                    </Box>

                                    <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Requirement
                                        </Typography>
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
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleRemoveCriterion(index)}
                                        >
                                            Delete Criterion
                                        </Button>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>
                    ))}
                    <FormActionsWithCancel />
                </Paper>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Applicability
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Departments
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    multiple
                                    value={formData.applicableDepartmentIds || []}
                                    onChange={(e) => handleChange('applicableDepartmentIds', e.target.value)}
                                    input={<OutlinedInput />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {Array.isArray(selected)
                                                ? selected.map((value) => {
                                                    const dept = departments.find((d) => d._id === value);
                                                    return dept ? <Chip key={value} label={dept.name} /> : null;
                                                })
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
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Positions
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    multiple
                                    value={formData.applicablePositionIds || []}
                                    onChange={(e) => handleChange('applicablePositionIds', e.target.value)}
                                    input={<OutlinedInput />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {Array.isArray(selected)
                                                ? selected.map((value) => {
                                                    const pos = positions.find((p) => p._id === value);
                                                    return pos ? <Chip key={value} label={pos.title} /> : null;
                                                })
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
                    <FormActionsWithCancel />
                </Paper>
            </CustomTabPanel>
        </form>
    );
}
