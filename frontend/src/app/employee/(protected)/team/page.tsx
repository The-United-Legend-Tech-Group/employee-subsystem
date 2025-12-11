'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { decryptData } from '../../../../common/utils/encryption';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';


interface TeamMember {
    _id: string;
    firstName: string;
    lastName: string;
    position?: { title: string };
    department?: { name: string };
    profilePictureUrl?: string;
    email: string;
    status: string;
}

export default function TeamPage(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = React.useState(true);
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
    const [manager, setManager] = React.useState<TeamMember | null>(null);
    const [hoveredMember, setHoveredMember] = React.useState<TeamMember | null>(null);
    const [viewMode, setViewMode] = React.useState<'orbit' | 'table'>('orbit');
    // Search and Filter Logic
    const [searchQuery, setSearchQuery] = React.useState('');

    // Combine manager and team for the table
    const allRows = React.useMemo(() => {
        const rows = [...teamMembers];
        if (manager) {
            return [manager, ...rows];
        }
        return rows;
    }, [manager, teamMembers]);

    const filteredRows = React.useMemo(() => {
        if (!searchQuery) return allRows;
        const lowerQuery = searchQuery.toLowerCase();
        return allRows.filter(row =>
            (row.firstName || '').toLowerCase().includes(lowerQuery) ||
            (row.lastName || '').toLowerCase().includes(lowerQuery) ||
            (row.email || '').toLowerCase().includes(lowerQuery) ||
            (row.position?.title || '').toLowerCase().includes(lowerQuery) ||
            (row.department?.name || '').toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, allRows]);

    const columns: GridColDef[] = [
        {
            field: 'fullName',
            headerName: 'Employee',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams<TeamMember>) => {
                const isManager = manager && params.row._id === manager._id;
                return (
                    <Box
                        onClick={() => router.push(`/employee/team/member-details/${params.row._id}`)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                        <Avatar src={params.row.profilePictureUrl} alt={params.row.firstName} sx={{ width: 32, height: 32 }} />
                        <Box>
                            <Typography variant="body2" fontWeight="medium" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                                {params.row.firstName} {params.row.lastName}
                            </Typography>
                            {isManager && (
                                <Typography variant="caption" color="primary" sx={{ display: 'block', lineHeight: 1 }}>
                                    (You)
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: 'position',
            headerName: 'Position',
            flex: 1,
            minWidth: 150,
            valueGetter: (value, row) => row.position?.title || (manager && row._id === manager._id ? 'Team Lead' : '')
        },
        {
            field: 'department',
            headerName: 'Department',
            flex: 1,
            minWidth: 150,
            valueGetter: (value, row) => row.department?.name
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams<TeamMember>) => (
                <Chip
                    label={params.row.status}
                    size="small"
                    color={params.row.status === 'ACTIVE' ? 'success' : 'default'}
                    variant="outlined"
                />
            )
        },
        { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    ];

    React.useEffect(() => {
        const fetchTeam = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                router.push('/employee/login');
                return;
            }

            try {
                const employeeId = await decryptData(encryptedEmployeeId, token);
                if (!employeeId) throw new Error('Decryption failed');

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

                // Fetch current user (Manager) profile first to show in center
                const profileRes = await fetch(`${apiUrl}/employee/${employeeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setManager(profileData.profile || profileData);
                }

                // Fetch team profiles
                const response = await fetch(`${apiUrl}/employee/team/profiles?managerId=${employeeId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTeamMembers(data.items || []);
                } else {
                    console.error('Failed to fetch team', response.status, response.statusText);
                    const text = await response.text();
                    console.error('Response body:', text);
                }
            } catch (error) {
                console.error('Failed to fetch team', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [router]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // --- Creative Layout Logic ---
    // We'll place the manager in the center and members in a circle around them.
    // If there are many members, we can use multiple concentric circles (orbits).

    // Constants for layout
    const CENTER_X = 50; // Percent
    const CENTER_Y = 50; // Percent
    const INITIAL_ORBIT_RADIUS = 22; // Start radius
    const ORBIT_RADIUS_STEP = 15; // Percent distance for each orbit ring
    const BASE_AVATAR_SIZE = 60; // px
    const MANAGER_AVATAR_SIZE = 120; // px

    // Helper to calculate position
    const calculatePosition = (index: number, total: number, orbitIndex: number = 0) => {
        const radius = INITIAL_ORBIT_RADIUS + (orbitIndex * ORBIT_RADIUS_STEP);
        // Add offset to avoid cardinal directions (top/bottom/left/right) if possible for better aesthetic
        const offsetAngle = (orbitIndex % 2 === 0) ? (Math.PI / total) : 0;
        const angleStep = (2 * Math.PI) / total;
        const angle = angleStep * index - (Math.PI / 2) + offsetAngle;

        // Convert to percentage offsets
        const x = CENTER_X + radius * Math.cos(angle) * 1.8; // Wider aspect ratio
        const y = CENTER_Y + radius * Math.sin(angle);

        return { x, y };
    };

    // Distribute members into orbits if there are too many
    const MAX_PER_ORBIT = 8;
    const orbits: TeamMember[][] = [];
    let remainingMembers = [...teamMembers];
    while (remainingMembers.length > 0) {
        orbits.push(remainingMembers.splice(0, MAX_PER_ORBIT));
    }




    return (
        <Box sx={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Top Toolbar - Centered & Floating */}
            <Box sx={{
                position: 'absolute',
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
            }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newView) => {
                        if (newView === 'summary') {
                            router.push('/employee/team/summary');
                            return;
                        }
                        if (newView !== null) {
                            setViewMode(newView);
                        }
                    }}
                    aria-label="view mode"
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '24px',
                        boxShadow: theme.shadows[3],
                        p: 0.5, // Padding for the floating effect
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            borderRadius: '20px',
                            border: 'none',
                            px: 2,
                            py: 0.5,
                            transition: 'all 0.2s',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                boxShadow: theme.shadows[2],
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                }
                            },
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                            }
                        },
                    }}
                    size="small"
                >
                    <ToggleButton value="orbit" aria-label="orbit view">
                        <GridViewRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">Orbit</Typography>
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="table view">
                        <TableRowsRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">List</Typography>
                    </ToggleButton>
                    <ToggleButton value="summary" aria-label="summary view">
                        <AssessmentRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">Summary</Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {viewMode === 'orbit' ? (
                /* ORBIT VIEW CONTAINER */
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.0) 70%)',
                }}>
                    {/* Manager (Sun) */}
                    {manager && (
                        <Box sx={{
                            position: 'absolute',
                            zIndex: 10,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}>
                            <Avatar
                                src={manager.profilePictureUrl}
                                alt={manager.firstName}
                                sx={{
                                    width: MANAGER_AVATAR_SIZE,
                                    height: MANAGER_AVATAR_SIZE,
                                    boxShadow: '0 0 30px rgba(0,0,0,0.15)',
                                    border: '6px solid',
                                    borderColor: 'background.default',
                                    bgcolor: 'grey.300'
                                }}
                            >
                                <PersonIcon sx={{ fontSize: MANAGER_AVATAR_SIZE * 0.6, color: 'grey.600' }} />
                            </Avatar>
                            <Box sx={(theme) => ({
                                mt: 2,
                                bgcolor: alpha(theme.palette.common.white, 0.85),
                                px: 2,
                                py: 1,
                                borderRadius: 4,
                                backdropFilter: 'blur(4px)',
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                ...theme.applyStyles('dark', {
                                    bgcolor: alpha(theme.palette.common.black, 0.6),
                                }),
                            })}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>You</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Team Lead</Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Team Members (Planets) */}
                    {orbits.map((orbitMembers, orbitIndex) => (
                        orbitMembers.map((member, index) => {
                            const pos = calculatePosition(index, orbitMembers.length, orbitIndex);
                            const isHovered = hoveredMember?._id === member._id;
                            return (
                                <Box
                                    key={member._id}
                                    sx={{
                                        position: 'absolute',
                                        top: `${pos.y}%`,
                                        left: `${pos.x}%`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: isHovered ? 100 : 5, // High z-index on hover
                                        cursor: 'pointer',
                                        width: BASE_AVATAR_SIZE, // Fixed size trigger area
                                        height: BASE_AVATAR_SIZE,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onMouseEnter={() => setHoveredMember(member)}
                                    onMouseLeave={() => setHoveredMember(null)}
                                >
                                    {/* 1. Default Avatar Layer */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: isHovered
                                                ? 'translate(-50%, -50%) scale(0.8)'
                                                : 'translate(-50%, -50%) scale(1)',
                                            opacity: isHovered ? 0 : 1,
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            zIndex: 1,
                                            pointerEvents: isHovered ? 'none' : 'auto',
                                        }}
                                    >
                                        <Avatar
                                            src={member.profilePictureUrl}
                                            alt={member.firstName}
                                            sx={{
                                                width: BASE_AVATAR_SIZE,
                                                height: BASE_AVATAR_SIZE,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                border: '2px solid',
                                                borderColor: 'background.default',
                                                bgcolor: 'grey.300'
                                            }}
                                        >
                                            <PersonIcon sx={{ fontSize: BASE_AVATAR_SIZE * 0.6, color: 'grey.600' }} />
                                        </Avatar>
                                        <Typography
                                            variant="caption"
                                            sx={(theme) => ({
                                                position: 'absolute',
                                                top: '100%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                mt: 1,
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                width: 'max-content',
                                                color: 'text.primary',
                                                bgcolor: alpha(theme.palette.common.white, 0.8),
                                                borderRadius: 1,
                                                px: 1,
                                                py: 0.5,
                                                backdropFilter: 'blur(4px)',
                                                ...theme.applyStyles('dark', {
                                                    bgcolor: alpha(theme.palette.common.black, 0.6),
                                                }),
                                            })}
                                        >
                                            {member.firstName}
                                        </Typography>
                                    </Box>

                                    {/* 2. Expanded Card Layer (Pops over) */}
                                    <Card
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: isHovered
                                                ? 'translate(-50%, -50%) scale(1)'
                                                : 'translate(-50%, -50%) scale(0.5)',
                                            opacity: isHovered ? 1 : 0,
                                            visibility: isHovered ? 'visible' : 'hidden', // Ensure it doesn't block clicks when hidden
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            zIndex: 2,
                                            width: 260,
                                            borderRadius: 4,
                                            boxShadow: 24,
                                            overflow: 'visible', // Allow content to flow nicely
                                            pointerEvents: isHovered ? 'auto' : 'none',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Optional: Click handling
                                        }}
                                    >
                                        <CardContent sx={{
                                            p: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            position: 'relative'
                                        }}>
                                            {/* Duplicate Avatar for visual continuity */}
                                            <Avatar
                                                src={member.profilePictureUrl}
                                                alt={member.firstName}
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    mb: 2,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    border: `3px solid ${theme.palette.primary.main}`,
                                                    bgcolor: 'grey.300'
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 50, color: 'grey.600' }} />
                                            </Avatar>

                                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                {member.firstName} {member.lastName}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {member.position?.title || 'Team Member'}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '100%', mb: 2 }}>
                                                <Chip
                                                    label={member.status}
                                                    size="small"
                                                    color={member.status === 'ACTIVE' ? 'success' : 'default'}
                                                    variant="filled"
                                                />
                                                <Chip
                                                    label={member.department?.name || 'Dept'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>

                                            <Typography variant="caption" color="text.secondary">
                                                {member.email}
                                            </Typography>

                                            <Button
                                                variant="contained"
                                                size="small"
                                                endIcon={<ArrowForwardRoundedIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card bubble events
                                                    router.push(`/employee/team/member-details/${member._id}`);
                                                }}
                                                sx={{ mt: 2, borderRadius: 2 }}
                                            >
                                                View Profile
                                            </Button>
                                        </CardContent>
                                    </Card>

                                </Box>
                            );
                        })
                    ))}
                </Box>
            ) : (
                /* TABLE VIEW CONTAINER */
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    pt: 12, // Space for floating toggle
                    px: 3,
                    pb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {/* Search Bar */}
                    <Fade in={viewMode === 'table'}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <TextField
                                placeholder="Search team..."
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ width: 300, bgcolor: 'background.paper', borderRadius: 1 }}
                            />
                        </Box>
                    </Fade>

                    {/* DataGrid */}
                    <Box sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                        <DataGrid
                            rows={filteredRows}
                            columns={columns}
                            getRowId={(row) => row._id}
                            disableRowSelectionOnClick
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                            }}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                '& .MuiDataGrid-cell': {
                                    alignContent: 'center',
                                },
                            }}
                        />
                    </Box>
                </Box>
            )
            }
        </Box >
    );
}
