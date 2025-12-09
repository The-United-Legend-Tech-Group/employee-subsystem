'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import PersonIcon from '@mui/icons-material/Person';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

interface HierarchyNode {
    _id: string;
    code: string;
    title: string;
    description: string;
    departmentId: string;
    isActive: boolean;
    children: HierarchyNode[];
    reportsToPositionId?: string;
}

const OrgChartNode = ({ node }: { node: HierarchyNode }) => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Node Card */}
            <Card
                elevation={0}
                sx={{
                    width: 180,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    position: 'relative',
                    zIndex: 2,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[3],
                        borderColor: theme.palette.primary.main,
                    }
                }}
            >
                <Box sx={{
                    height: 4,
                    width: '100%',
                    bgcolor: node.isActive ? 'primary.main' : 'action.disabled',
                }} />

                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: node.isActive ? 'primary.light' : 'action.hover',
                                color: node.isActive ? 'primary.dark' : 'text.secondary',
                                width: 40,
                                height: 40,
                                fontSize: '1rem'
                            }}
                        >
                            {node.title.charAt(0)}
                        </Avatar>
                    </Box>
                    <Typography variant="subtitle2" component="div" fontWeight="bold" noWrap title={node.title} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {node.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 1, fontSize: '0.7rem' }}>
                        {node.code}
                    </Typography>
                    <Chip
                        label={node.description}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            borderRadius: 1,
                            bgcolor: node.description === 'Open' ? 'success.lighter' : 'action.hover', // Note: 'success.lighter' might not exist, safer to use alpha or light
                            color: node.description === 'Open' ? 'success.dark' : 'text.secondary',
                            ...(node.description === 'Open' && { bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }),
                            '& .MuiChip-label': { px: 1 }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Children Container */}
            {node.children && node.children.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        position: 'relative',
                        pt: 2, // 16px spacing for lines
                        alignItems: 'flex-start'
                    }}
                >
                    {/* Vertical line from Parent to Hub */}
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: '1px',
                        height: 16, // Matches pt
                        bgcolor: 'divider',
                        transform: 'translateX(-50%)',
                    }} />

                    {node.children.map((child, index) => (
                        <Box key={child._id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 1 }}>
                            {/* Top Wrapper for lines to Child */}
                            <Box sx={{ height: 16, width: '100%', position: 'relative' }}>
                                {/* Horizontal Line */}
                                {node.children.length > 1 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: index === 0 ? '50%' : 0,
                                        right: index === node.children.length - 1 ? '50%' : 0,
                                        height: '1px',
                                        bgcolor: 'divider'
                                    }} />
                                )}
                                {/* Vertical Line to Child */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    height: '100%',
                                    width: '1px',
                                    bgcolor: 'divider',
                                    transform: 'translateX(-50%)'
                                }} />
                            </Box>

                            <OrgChartNode node={child} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default function OrganizationHierarchy() {
    const [hierarchy, setHierarchy] = React.useState<HierarchyNode[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

                const response = await fetch(`${apiUrl}/organization-structure/hierarchy`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch hierarchy data');
                }

                const data = await response.json();
                setHierarchy(data);
            } catch (err) {
                console.error('Error fetching hierarchy:', err);
                setError('Failed to load organization hierarchy.');
            } finally {
                setLoading(false);
            }
        };

        fetchHierarchy();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        );
    }

    if (!hierarchy || hierarchy.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>No organization structure found.</Alert>
        );
    }

    return (
        <Card
            elevation={0}
            sx={(theme) => ({
                mt: 4,
                width: '100%',
                overflowX: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1, // Standardizes with other dashboard cards
                bgcolor: 'background.paper',
                ...theme.applyStyles('light', {
                    backgroundImage: 'linear-gradient(to top right, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
                    backdropFilter: 'blur(8px)',
                }),
            })}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                    Organization Structure
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minWidth: 'fit-content', gap: 2 }}>
                    {hierarchy.map((rootNode) => (
                        <OrgChartNode key={rootNode._id} node={rootNode} />
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}
