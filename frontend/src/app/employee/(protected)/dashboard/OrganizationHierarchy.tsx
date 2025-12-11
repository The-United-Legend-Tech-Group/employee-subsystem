'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
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

// Helper to generate a consistent color from a string (e.g., departmentId)
const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
};

// Helper to check if a node contains the target position in its subtree
const hasDescendant = (node: HierarchyNode, targetId?: string | null): boolean => {
    if (!targetId) return false;
    if (node._id === targetId) return true;
    return node.children?.some(child => hasDescendant(child, targetId)) || false;
};

// Helper to compact the tree: limits siblings to 3, distributing excess as children of the first 3
const compactTree = (node: HierarchyNode): HierarchyNode => {
    // Shallow clone to avoid mutating original data structure in place if strictly necessary, 
    // but here we are producing a new view structure.
    const newNode = { ...node, children: node.children ? [...node.children] : [] };

    if (newNode.children.length > 3) {
        const visible = newNode.children.slice(0, 3);
        const excess = newNode.children.slice(3);

        // Distribute excess nodes under the visible ones in round-robin fashion
        excess.forEach((excessNode, i) => {
            const targetIndex = i % 3;
            // Ensure target has children array
            if (!visible[targetIndex].children) {
                visible[targetIndex].children = [];
            }
            // Add excess node to target's children
            visible[targetIndex].children.push(excessNode);
        });

        // Update the current node's children to only be the visible ones
        newNode.children = visible;
    }

    // Recursively compact the children (now including the adopted ones)
    if (newNode.children.length > 0) {
        newNode.children = newNode.children.map(compactTree);
    }

    return newNode;
};

const OrgChartNode = React.memo(({ node, currentPositionId }: { node: HierarchyNode; currentPositionId?: string | null }) => {
    const theme = useTheme();
    const isCurrentUser = node._id === currentPositionId;
    const groupColor = React.useMemo(() => stringToColor(node.departmentId || node._id), [node.departmentId, node._id]);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Node Card */}
            <Card
                elevation={isCurrentUser ? 4 : 0}
                sx={{
                    width: 180,
                    mx: 1,
                    textAlign: 'center',
                    border: `1px solid ${isCurrentUser ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 2,
                    position: 'relative',
                    zIndex: 2,
                    bgcolor: isCurrentUser ? 'primary.lighter' : 'background.paper',
                    transition: 'all 0.2s ease',
                    ...(isCurrentUser && {
                        borderColor: 'primary.main',
                        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    }),
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[3],
                        borderColor: theme.palette.primary.main,
                    }
                }}
                id={`node-${node._id}`}
            >
                <Box sx={{
                    height: 4,
                    width: '100%',
                    bgcolor: groupColor,
                }} />

                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: `${groupColor}20`,
                                color: groupColor,
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                                border: `1px solid ${groupColor}`
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
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip
                            label={node.description}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                borderRadius: 1,
                                bgcolor: node.description === 'Open' ? 'success.lighter' : 'action.hover',
                                color: node.description === 'Open' ? 'success.dark' : 'text.secondary',
                                ...(node.description === 'Open' && { bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }),
                                '& .MuiChip-label': { px: 1 }
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Children Container */}
            {hasChildren && (
                <Box
                    sx={{
                        display: 'flex',
                        position: 'relative',
                        pt: 2,
                        alignItems: 'flex-start'
                    }}
                >
                    {/* Vertical line from Parent to Hub */}
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: '1px',
                        height: 16,
                        bgcolor: 'divider',
                        transform: 'translateX(-50%)',
                    }} />

                    {node.children.map((child, index) => (
                        <Box key={child._id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

                            <OrgChartNode node={child} currentPositionId={currentPositionId} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
});

export default function OrganizationHierarchy() {
    const [hierarchy, setHierarchy] = React.useState<HierarchyNode[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentPositionId, setCurrentPositionId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            let token: string | null = null;
            let apiUrl: string | undefined = undefined;

            try {
                token = localStorage.getItem('access_token');
                apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

                if (!token) {
                    throw new Error('Authentication details missing');
                }

                // 1. Fetch Hierarchy
                const hierarchyRes = await fetch(`${apiUrl}/organization-structure/hierarchy`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!hierarchyRes.ok) throw new Error('Failed to fetch hierarchy data');
                const hierarchyData = await hierarchyRes.json();

                // Apply compaction to all root nodes
                const compactedData = hierarchyData.map((root: HierarchyNode) => compactTree(root));
                setHierarchy(compactedData);
                setLoading(false); // Show hierarchy immediately

            } catch (err) {
                console.error('Error fetching hierarchy:', err);
                setError('Failed to load organization hierarchy.');
                setLoading(false);
                return; // Stop if hierarchy fails
            }

            // 2. Fetch User Profile (Background)
            try {
                const encryptedEmployeeId = localStorage.getItem('employeeId');
                if (encryptedEmployeeId && token) {
                    const { decryptData } = await import('../../../../common/utils/encryption');
                    const employeeId = await decryptData(encryptedEmployeeId, token);

                    if (employeeId) {
                        const profileRes = await fetch(`${apiUrl}/employee/${employeeId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (profileRes.ok) {
                            const profileData = await profileRes.json();
                            const p = profileData.profile || profileData;
                            const posId = p.position?._id || p.primaryPositionId?._id || (typeof p.primaryPositionId === 'string' ? p.primaryPositionId : null);

                            if (posId) {
                                setCurrentPositionId(posId);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch user position for centering', e);
            }
        };

        fetchData();
    }, []);

    // Effect to scroll to the current position node
    React.useEffect(() => {
        if (!loading && currentPositionId && hierarchy.length > 0) {
            // Small timeout to ensure DOM is rendered
            const timer = setTimeout(() => {
                const element = document.getElementById(`node-${currentPositionId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    // Optional: Add a highlight effect class temporarily
                    element.style.transition = 'box-shadow 0.5s ease';
                    element.style.boxShadow = '0 0 0 4px rgba(25, 118, 210, 0.3)'; // primary.main with opacity

                    setTimeout(() => {
                        element.style.boxShadow = '';
                    }, 2000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, currentPositionId, hierarchy]);

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
                borderRadius: 1,
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
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    minWidth: 'fit-content',
                    gap: 2,
                    p: 1,
                    pb: 4
                }}>
                    {hierarchy.map((rootNode) => (
                        <OrgChartNode
                            key={rootNode._id}
                            node={rootNode}
                            currentPositionId={currentPositionId}
                        />
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}
