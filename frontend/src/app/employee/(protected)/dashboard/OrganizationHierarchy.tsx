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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';

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
const stringToColor = (string: string | undefined | null) => {
    if (!string) return '#666666'; // Default gray for undefined/null
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

// Predefined vibrant color palette for departments
const DEPARTMENT_COLORS = [
    '#00BCD4', // Cyan
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#4CAF50', // Green
    '#E91E63', // Pink
    '#2196F3', // Blue
    '#FF5722', // Deep Orange
    '#673AB7', // Deep Purple
    '#009688', // Teal
    '#FFC107', // Amber
];

// Get department color by index (cycles through palette)
const getDepartmentColor = (index: number) => DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];

// Helper to check if a node contains the target position in its subtree
const hasDescendant = (node: HierarchyNode, targetId?: string | null): boolean => {
    if (!targetId) return false;
    if (node._id === targetId) return true;
    return node.children?.some(child => hasDescendant(child, targetId)) || false;
};

// Helper to compact the tree: limits siblings to create a roughly square shape
const compactTree = (node: HierarchyNode): HierarchyNode => {
    // Shallow clone to avoid mutating original data structure
    const newNode = { ...node, children: node.children ? [...node.children] : [] };

    // "Squarify" logic:
    // We want the number of direct children (columns) to be roughly the square root of the total children,
    // so that the tree grows downwards as much as it grows sideways.
    // Minimum 3 columns to keep it looking like a tree for small numbers.
    const limit = Math.max(3, Math.ceil(Math.sqrt(newNode.children.length)));

    if (newNode.children.length > limit) {
        const visible = newNode.children.slice(0, limit);
        const excess = newNode.children.slice(limit);

        // Distribute excess nodes under the visible ones in round-robin fashion
        excess.forEach((excessNode, i) => {
            const targetIndex = i % limit;
            // Ensure target has children array
            if (!visible[targetIndex].children) {
                visible[targetIndex].children = [];
            }
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

const OrgChartNode = React.memo(({ node, currentPositionId, departmentColor }: { node: HierarchyNode; currentPositionId?: string | null; departmentColor?: string }) => {
    const theme = useTheme();
    const isCurrentUser = node._id === currentPositionId;
    // Use departmentColor if provided, otherwise fall back to stringToColor
    const groupColor = departmentColor || stringToColor(node.departmentId || node._id);
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

                            <OrgChartNode node={child} currentPositionId={currentPositionId} departmentColor={departmentColor} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
});

export default function OrganizationHierarchy() {
    const theme = useTheme();
    const [hierarchy, setHierarchy] = React.useState<HierarchyNode[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentPositionId, setCurrentPositionId] = React.useState<string | null>(null);
    const [currentEmployeeId, setCurrentEmployeeId] = React.useState<string | null>(null);
    const [userInfoLoaded, setUserInfoLoaded] = React.useState(false);
    const [scale, setScale] = React.useState(1);
    const [showMyHierarchy, setShowMyHierarchy] = React.useState(true);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Fetch user profile info on mount
    React.useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const encryptedEmployeeId = localStorage.getItem('employeeId');

                if (encryptedEmployeeId && token) {
                    const { decryptData } = await import('../../../../common/utils/encryption');
                    const employeeId = await decryptData(encryptedEmployeeId, token);

                    if (employeeId) {
                        setCurrentEmployeeId(employeeId);

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
                console.warn('Failed to fetch user info', e);
            } finally {
                setUserInfoLoaded(true);
            }
        };

        fetchUserInfo();
    }, []);

    // Fetch hierarchy data based on toggle state
    React.useEffect(() => {
        // Wait for user info to load when in My Hierarchy mode
        if (showMyHierarchy && !userInfoLoaded) {
            return;
        }

        const fetchHierarchy = async () => {
            // Clear old data and show loading when switching views
            setHierarchy([]);
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('access_token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

                if (!token) {
                    throw new Error('Authentication details missing');
                }

                let url = `${apiUrl}/organization-structure/hierarchy`;

                // If showing my hierarchy and we have the current employee ID, use the user hierarchy endpoint
                if (showMyHierarchy && currentEmployeeId) {
                    url = `${apiUrl}/organization-structure/hierarchy/user/${currentEmployeeId}`;
                }

                const hierarchyRes = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!hierarchyRes.ok) throw new Error('Failed to fetch hierarchy data');
                const hierarchyData = await hierarchyRes.json();

                // Both endpoints now return the same format - array of root nodes
                const dataToProcess: HierarchyNode[] = Array.isArray(hierarchyData) ? hierarchyData : [];

                // Apply compaction to all root nodes
                const compactedData = dataToProcess.map((root: HierarchyNode) => compactTree(root));
                setHierarchy(compactedData);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching hierarchy:', err);
                setError('Failed to load organization hierarchy.');
                setLoading(false);
            }
        };

        fetchHierarchy();
    }, [showMyHierarchy, currentEmployeeId, userInfoLoaded]);

    // Auto-scroll to component when switching views
    React.useEffect(() => {
        if (!loading && hierarchy.length > 0 && containerRef.current) {
            // Small delay to ensure fade animation has started
            const timer = setTimeout(() => {
                containerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [loading, showMyHierarchy, hierarchy.length]);

    // Effect to calculate and update scale
    React.useLayoutEffect(() => {
        if (loading || !hierarchy.length) return;

        const handleResize = () => {
            if (containerRef.current && contentRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const contentRect = contentRef.current.getBoundingClientRect();

                // Reset scale to 1 to get true content dimensions first (if needed, but simpler to just measure scrollWidth/scrollHeight)

                const contentWidth = contentRef.current.scrollWidth;
                const contentHeight = contentRef.current.scrollHeight;
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;

                // Add some padding to the available space calculation to prevent edge-touching
                const paddingX = 40;
                const paddingY = 40;

                const scaleX = (containerWidth - paddingX) / contentWidth;
                const scaleY = (containerHeight - paddingY) / contentHeight;

                // We only want to scale down, not up (keep max scale at 1)
                // Also choose the smaller scale to fit both dimensions
                const newScale = Math.min(scaleX, scaleY, 1);

                setScale(newScale);
            }
        };

        // Initial check
        // We need a slight delay or resize observer to wait for render
        const timer = setTimeout(handleResize, 100);

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Also observe content changes if possible, or just rely on hierarchy changes re-triggering this
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [loading, hierarchy]);


    // with Auto-Zoom, scrolling might not be needed if it fits, but if we zoomed out, everything is visible.
    // If we are zoomed out, we don't really need to scroll.


    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        );
    }

    if (!loading && (!hierarchy || hierarchy.length === 0)) {
        // Show specific message when My Hierarchy is empty
        if (showMyHierarchy) {
            return (
                <Card
                    elevation={0}
                    sx={{
                        mt: 4,
                        width: '100%',
                        height: 'calc(100vh - 200px)',
                        minHeight: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
                        You are not in a Department yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        Contact your HR administrator to be assigned to a department.
                    </Typography>
                </Card>
            );
        }
        return (
            <Alert severity="info" sx={{ mt: 2 }}>No organization structure found.</Alert>
        );
    }

    return (
        <Card
            elevation={0}
            ref={containerRef}
            sx={(theme) => ({
                mt: 4,
                width: '100%',
                height: 'calc(100vh - 100px)', // Larger height to accommodate scrolling
                minHeight: 600,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column', // Stack header and content
                ...theme.applyStyles('light', {
                    backgroundImage: 'linear-gradient(to top right, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
                    backdropFilter: 'blur(8px)',
                }),
            })}
        >
            {/* Toggle Switch */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 1.5,
                }}
            >
                <ToggleButtonGroup
                    value={showMyHierarchy ? 'my' : 'company'}
                    exclusive
                    onChange={(e, newValue) => {
                        if (newValue !== null) {
                            setShowMyHierarchy(newValue === 'my');
                        }
                    }}
                    aria-label="hierarchy view"
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '24px',
                        boxShadow: theme.shadows[3],
                        p: 0.5,
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
                    <ToggleButton value="company" aria-label="company hierarchy">
                        <BusinessRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">Company</Typography>
                    </ToggleButton>
                    <ToggleButton value="my" aria-label="my hierarchy">
                        <AccountTreeRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">My Hierarchy</Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Loading State - Inline within card */}
            <Fade in={loading} timeout={300} unmountOnExit>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    <CircularProgress size={40} />
                </Box>
            </Fade>

            {/* Company View - Vertical stacked layout */}
            <Fade in={!loading && !showMyHierarchy && hierarchy.length > 0} timeout={400} unmountOnExit>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        width: '100%',
                        py: 2,
                    }}
                >
                    {hierarchy.map((rootNode, index) => (
                        <Box
                            key={rootNode._id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                py: 3,
                                px: 2,
                                mx: 2,
                                borderRadius: 2,
                                borderLeft: `4px solid ${getDepartmentColor(index)}`,
                                bgcolor: alpha(getDepartmentColor(index), 0.05),
                                ...(index < hierarchy.length - 1 && {
                                    mb: 3,
                                }),
                            }}
                        >
                            {/* Department Label */}
                            <Typography
                                variant="caption"
                                sx={{
                                    mb: 2,
                                    px: 2,
                                    py: 0.5,
                                    bgcolor: alpha(getDepartmentColor(index), 0.2),
                                    color: getDepartmentColor(index),
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                }}
                            >
                                Department {index + 1}
                            </Typography>

                            {/* Horizontal Scrollable Tree Container */}
                            <Box
                                sx={{
                                    overflowX: 'auto',
                                    overflowY: 'visible',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    pb: 1,
                                    '&::-webkit-scrollbar': {
                                        height: 6,
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        bgcolor: 'action.hover',
                                        borderRadius: 3,
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: 'divider',
                                        borderRadius: 3,
                                        '&:hover': {
                                            bgcolor: 'text.disabled',
                                        },
                                    },
                                }}
                            >
                                <Box
                                    ref={index === 0 ? contentRef : undefined}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'flex-start',
                                        width: 'fit-content',
                                        minWidth: '100%',
                                    }}
                                >
                                    <OrgChartNode
                                        node={rootNode}
                                        currentPositionId={currentPositionId}
                                        departmentColor={getDepartmentColor(index)}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Fade>

            {/* My Hierarchy View - Original centered layout */}
            <Fade in={!loading && showMyHierarchy && hierarchy.length > 0} timeout={400} unmountOnExit>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    <Box
                        ref={contentRef}
                        sx={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.3s ease',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            width: 'fit-content',
                            p: 2,
                        }}
                    >
                        {hierarchy.map((rootNode) => (
                            <OrgChartNode
                                key={rootNode._id}
                                node={rootNode}
                                currentPositionId={currentPositionId}
                            />
                        ))}
                    </Box>
                </Box>
            </Fade>
        </Card>
    );
}
