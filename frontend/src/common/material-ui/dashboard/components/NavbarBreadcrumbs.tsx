'use client';
'use client';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { usePathname } from 'next/navigation';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

export default function NavbarBreadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbTitle = () => {
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/team')) return 'Team';
    if (pathname.includes('/manage-organization')) return 'Manage Organization';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/calendar')) return 'Calendar';
    if (pathname.includes('/clients')) return 'Clients';
    return 'Home';
  };

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1">Dashboard</Typography>
      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {getBreadcrumbTitle()}
      </Typography>
    </StyledBreadcrumbs>
  );
}
