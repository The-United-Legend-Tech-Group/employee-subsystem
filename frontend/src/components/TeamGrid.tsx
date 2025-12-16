import * as React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

// Template color fallbacks (Persian Blue, Black, White)
const TEMPLATE_PRIMARY = "#1E40AF";
const TEMPLATE_BG = "#000000";
const TEMPLATE_FG = "#FFFFFF";

type Member = {
  id: string;
  name: string;
  role: string;
  summary?: string;
  team?: string;
};

// Sample placeholder data to show the design. You'll provide real data later.
const SAMPLE: Member[] = [
  {
    id: "1",
    name: "Youssef Ashraf",
    role: "Team Leader",
    summary: "Team Leader and lead for the Time Management subsystem.",
    team: "Leadership, Time Management",
  },
  {
    id: "2",
    name: "Mahmoud Ghoraba",
    role: "Leaves Team Leader / Design Lead",
    summary: "Leads the leaves team and drives design decisions.",
    team: "Leaves, Design",
  },
  {
    id: "3",
    name: "Mohamed Ghoraba",
    role: "Engineer",
    summary: "Developer in Leaves.",
    team: "Leaves",
  },
  {
    id: "4",
    name: "Mahmoud Khalil (7ooka)",
    role: "Engineer",
    summary: "Developer in Leaves.",
    team: "Leaves",
  },
  {
    id: "5",
    name: "Fady Osama",
    role: "Employee System Leader",
    summary: "Leads Employee subsystem.",
    team: "Employee",
  },
  {
    id: "6",
    name: "Youssef Amr",
    role: "Engineer",
    summary: "Developer in Employee.",
    team: "Employee",
  },
  {
    id: "7",
    name: "Adham Ashraf",
    role: "Engineer",
    summary: "Developer in Employee.",
    team: "Employee",
  },
  {
    id: "8",
    name: "Ahmed Hebesha",
    role: "Recruitment Leader",
    summary: "Leads recruitment.",
    team: "Recruitment",
  },
  {
    id: "9",
    name: "Amr Khaled",
    role: "Recruitment Engineer",
    summary: "Recruitment pipelines.",
    team: "Recruitment",
  },
  {
    id: "10",
    name: "Lakshy Rupani",
    role: "Recruitment Engineer",
    summary: "Candidate integrations.",
    team: "Recruitment",
  },
  {
    id: "11",
    name: "Mostafa Ahmed",
    role: "Payroll Configuration & Technical Lead",
    summary: "Leads payroll config.",
    team: "Payroll",
  },
  {
    id: "12",
    name: "Abdelhamid Taher",
    role: "Engineer",
    summary: "Payroll tooling.",
    team: "Payroll",
  },
  {
    id: "13",
    name: "Abdullah Mahmoud (3ergo)",
    role: "Engineer",
    summary: "Payroll integrations.",
    team: "Payroll",
  },
  // (placeholder entries removed - use real members as needed)
];

function MemberChip({ member }: { member: Member }) {
  const theme = useTheme();
  const paletteMain = theme.palette.info?.main || TEMPLATE_PRIMARY;
  // Use paletteMain for accents to avoid purple secondary colors
  const accent = paletteMain;
  const title = (
    <Paper
      sx={{
        p: 1.5,
        maxWidth: 320,
        background: `linear-gradient(135deg, ${alpha(
          TEMPLATE_FG,
          0.03
        )}, ${alpha(TEMPLATE_BG, 0.6)})`,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: TEMPLATE_FG }}
      >
        {member.name}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: "uppercase",
          color: alpha(TEMPLATE_FG, 0.8),
        }}
      >
        {member.role}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <span style={{ color: alpha(TEMPLATE_FG, 0.9) }}>{member.summary}</span>
      </Typography>
    </Paper>
  );

  return (
    <Tooltip
      title={title}
      placement="top"
      enterDelay={200}
      leaveDelay={200}
      disableInteractive={false}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
        <Avatar sx={{ width: 40, height: 40 }}>{member.name.charAt(0)}</Avatar>
        <Typography variant="body2">{member.name}</Typography>
      </Box>
    </Tooltip>
  );
}

function HoverCard({ member }: { member: Member }) {
  const theme = useTheme();
  const paletteMain = theme.palette.info?.main || TEMPLATE_PRIMARY;
  // Use paletteMain for accents to avoid purple secondary colors
  const accent = paletteMain;
  return (
    <Paper
      sx={{
        p: 1.25,
        maxWidth: 260,
        background: `linear-gradient(135deg, ${alpha(
          TEMPLATE_FG,
          0.03
        )}, ${alpha(TEMPLATE_BG, 0.6)})`,
        borderLeft: `3px solid ${paletteMain}`,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: TEMPLATE_FG }}
      >
        {member.name}
      </Typography>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: alpha(TEMPLATE_FG, 0.8) }}
      >
        {member.role}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <span style={{ color: alpha(TEMPLATE_FG, 0.9) }}>{member.summary}</span>
      </Typography>
    </Paper>
  );
}

function Node({ member, size = 72 }: { member: Member; size?: number }) {
  if (!member) {
    return null as any;
  }
  const initial = member.name ? member.name.charAt(0) : "?";
  const theme = useTheme();
  const paletteMain = theme.palette.info?.main || TEMPLATE_PRIMARY;
  // Use paletteMain for accents to avoid purple secondary colors
  const accent = paletteMain;
  const cardWidth = Math.max(130, size * 1.85);
  return (
    <Tooltip
      title={<HoverCard member={member} />}
      placement="top"
      enterDelay={150}
      leaveDelay={200}
      disableInteractive={false}
    >
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: 0.5,
          minWidth: cardWidth,
          textAlign: "center",
          borderRadius: 3,
          background: `linear-gradient(145deg, ${alpha(
            TEMPLATE_FG,
            0.02
          )}, ${alpha(TEMPLATE_BG, 0.6)})`,
          color: TEMPLATE_FG,
        }}
      >
        <Avatar
          sx={{
            width: size,
            height: size,
            bgcolor: TEMPLATE_BG,
            background: `linear-gradient(135deg, ${paletteMain}, ${accent})`,
            boxShadow: `0 8px 24px ${alpha(paletteMain, 0.34)}`,
            border: `3px solid ${TEMPLATE_FG}`,
          }}
        >
          {initial}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          <span style={{ color: TEMPLATE_FG }}>{member.name}</span>
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: alpha(TEMPLATE_FG, 0.8) }}
        >
          {member.role}
        </Typography>
      </Paper>
    </Tooltip>
  );
}

export default function TeamGrid({ data = SAMPLE }: { data?: Member[] }) {
  // Map a simple org layout: root -> three leads -> children -> bottom row
  const root = data[0];
  const leads = data.slice(1, 4);
  const leftChildren = data.slice(4, 5);
  const rightChildren = data.slice(5, 7);
  const bottom = data.slice(4, 7);

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ maxWidth: 1100, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Node member={root} size={88} />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          {leads.map((l) => (
            <Box
              key={l.id}
              sx={{ flex: 1, display: "flex", justifyContent: "center" }}
            >
              <Node member={l} />
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {leftChildren.map((m) => (
              <Node key={m.id} member={m} />
            ))}
          </Box>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {/* space for center vertical */}
          </Box>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {rightChildren.map((m) => (
              <Node key={m.id} member={m} />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-around", mt: 1 }}>
          {bottom.map((m) => (
            <Box
              key={m.id}
              sx={{
                flex: "0 0 20%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Node member={m} size={64} />
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 4, display: "flex", gap: 1, alignItems: "center" }}>
          <Chip label="Preview" color="primary" />
          <Typography variant="body2" color="text.secondary">
            Hover a member to see a summary.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
