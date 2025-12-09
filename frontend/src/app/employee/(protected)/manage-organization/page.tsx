'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DepartmentDialog from './DepartmentDialog';
import PositionDialog from './PositionDialog';

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
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const paginationModel = { page: 0, pageSize: 10 };
const pageSizeOptions = [5, 10];

export default function ManageOrganizationPage() {
    const [value, setValue] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [departments, setDepartments] = React.useState<any[]>([]);
    const [positions, setPositions] = React.useState<any[]>([]);
    const [departmentDialogOpen, setDepartmentDialogOpen] = React.useState(false);
    const [positionDialogOpen, setPositionDialogOpen] = React.useState(false);
    const [selectedDepartment, setSelectedDepartment] = React.useState<any>(null);
    const [selectedPosition, setSelectedPosition] = React.useState<any>(null);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const fetchDepartments = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization-structure/departments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDepartments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch departments', error);
        }
    }, []);

    const fetchPositions = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization-structure/positions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPositions(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch positions', error);
        }
    }, []);

    React.useEffect(() => {
        let active = true;

        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchDepartments(), fetchPositions()]);
            if (active) {
                setLoading(false);
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, [fetchDepartments, fetchPositions]);

    const departmentColumns = React.useMemo<GridColDef[]>(() => [
        { field: 'code', headerName: 'Code', width: 150 },
        { field: 'name', headerName: 'Name', width: 250 },
        { field: 'description', headerName: 'Description', width: 300 },
        { field: 'isActive', headerName: 'Active', width: 100, type: 'boolean' },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (
                <Button size="small" onClick={() => {
                    setSelectedDepartment(params.row);
                    setDepartmentDialogOpen(true);
                }}>Edit</Button>
            )
        }
    ], []);

    const positionColumns = React.useMemo<GridColDef[]>(() => [
        { field: 'code', headerName: 'Code', width: 150 },
        { field: 'title', headerName: 'Title', width: 250 },
        {
            field: 'departmentId', headerName: 'Department', width: 200, valueGetter: (value, row) => {
                if (!departments) return value;
                const dept = departments.find((d: any) => d._id === value);
                return dept ? dept.name : value;
            }
        },
        { field: 'isActive', headerName: 'Active', width: 100, type: 'boolean' },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (
                <Button size="small" onClick={() => {
                    setSelectedPosition(params.row);
                    setPositionDialogOpen(true);
                }}>Edit</Button>
            )
        }
    ], [departments]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Manage Organization
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        if (value === 0) {
                            setSelectedDepartment(null);
                            setDepartmentDialogOpen(true);
                        } else {
                            setSelectedPosition(null);
                            setPositionDialogOpen(true);
                        }
                    }}
                >
                    Create {value === 0 ? 'Department' : 'Position'}
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="organization tabs">
                    <Tab label="Departments" />
                    <Tab label="Positions" />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={departments}
                        columns={departmentColumns}
                        getRowId={(row) => row._id}
                        loading={loading}
                        initialState={{
                            pagination: { paginationModel },
                        }}
                        pageSizeOptions={pageSizeOptions}
                        checkboxSelection={false}
                    />
                </div>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={positions}
                        columns={positionColumns}
                        getRowId={(row) => row._id}
                        loading={loading}
                        initialState={{
                            pagination: { paginationModel },
                        }}
                        pageSizeOptions={pageSizeOptions}
                        checkboxSelection={false}
                    />
                </div>
            </CustomTabPanel>

            <DepartmentDialog
                open={departmentDialogOpen}
                onClose={() => {
                    setDepartmentDialogOpen(false);
                    fetchDepartments();
                }}
                department={selectedDepartment}
            />

            <PositionDialog
                open={positionDialogOpen}
                onClose={() => {
                    setPositionDialogOpen(false);
                    fetchPositions();
                }}
                position={selectedPosition}
                departments={departments}
            />

        </Box>
    );
}
