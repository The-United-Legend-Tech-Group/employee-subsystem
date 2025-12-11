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

  // Split path paths and filter out empty strings and 'employee' prefix if redundant
  const pathnames = pathname.split('/').filter((x) => x && x !== 'employee');

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1" color="text.secondary">
        Dashboard
      </Typography>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/employee/${pathnames.slice(0, index + 1).join('/')}`;

        // Map segment to readable title
        let title = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

        // Specific overrides
        if (value === 'member-details') title = 'Member Details';
        if (value === '(protected)') return null; // Should not appear but just in case

        // Hide IDs if they are long strings (simple heuristic)
        if (value.length > 20 || (value.match(/\d/) && value.length > 10)) {
          return null;
        }

        return last ? (
          <Typography key={to} variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {title}
          </Typography>
        ) : (
          <Typography key={to} variant="body1" color="text.secondary">
            {title}
          </Typography>
        );
      })}
    </StyledBreadcrumbs>
  );
}
