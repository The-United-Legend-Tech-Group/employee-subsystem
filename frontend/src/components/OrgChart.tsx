"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

type Member = {
  id: string;
  name: string;
  role: string;
  summary?: string;
  team?: string;
  photo?: string;
  parentId?: string | null;
};

// Global template palette: blue primary, black background, white foreground
const TEMPLATE_PRIMARY = "#1E40AF";
const TEMPLATE_BG = "#000000";
const TEMPLATE_FG = "#FFFFFF";
const SAMPLE: Member[] = [
  {
    id: "1",
    name: "Youssef Ashraf",
    role: "Team Leader",
    summary: "Team Leader and lead for the Time Management subsystem.",
    team: "Leadership, Time Management",
    parentId: null,
  },

  // Representatives / leaders under Youssef
  {
    id: "2",
    name: "Mahmoud Ghoraba",
    role: "Leaves Team Leader / Design Lead",
    summary: "Leads the leaves team and drives design decisions.",
    team: "Leaves, Design",
    parentId: "1",
  },
  {
    id: "3",
    name: "Mohamed Ghoraba",
    role: "Engineer",
    summary: "Developer in the Leaves team.",
    team: "Leaves",
    parentId: "2",
  },
  {
    id: "4",
    name: "Mahmoud Khalil (7ooka)",
    role: "Engineer",
    summary: "Developer in the Leaves team.",
    team: "Leaves",
    parentId: "2",
  },

  {
    id: "5",
    name: "Fady Osama",
    role: "Employee System Leader",
    summary: "Leads the Employee subsystem.",
    team: "Employee",
    parentId: "1",
  },
  {
    id: "6",
    name: "Youssef Amr",
    role: "Engineer",
    summary: "Developer in the Employee subsystem.",
    team: "Employee",
    parentId: "5",
  },
  {
    id: "7",
    name: "Adham Ashraf",
    role: "Engineer",
    summary: "Developer in the Employee subsystem.",
    team: "Employee",
    parentId: "5",
  },

  {
    id: "8",
    name: "Ahmed Hebesha",
    role: "Recruitment Leader",
    summary: "Leads recruitment efforts and candidate flows.",
    team: "Recruitment",
    parentId: "1",
  },
  {
    id: "9",
    name: "Amr Khaled",
    role: "Recruitment Engineer",
    summary: "Works on recruitment pipelines and automation.",
    team: "Recruitment",
    parentId: "8",
  },
  {
    id: "10",
    name: "Lakshy Rupani",
    role: "Recruitment Engineer",
    summary: "Works on candidate systems and integrations.",
    team: "Recruitment",
    parentId: "8",
  },

  {
    id: "11",
    name: "Mostafa Ahmed",
    role: "Payroll Configuration & Technical Lead",
    summary: "Leads payroll configuration and technical direction.",
    team: "Payroll",
    parentId: "1",
  },
  {
    id: "12",
    name: "Abdelhamid Taher",
    role: "Engineer",
    summary: "Works on payroll configuration and tooling.",
    team: "Payroll",
    parentId: "11",
  },
  {
    id: "13",
    name: "Abdullah Mahmoud (3ergo)",
    role: "Engineer",
    summary: "Payroll and integrations developer.",
    team: "Payroll",
    parentId: "11",
  },
  // Payroll Execution sub-team
  {
    id: "14",
    name: "Ziyad",
    role: "Payroll Execution Leader",
    summary: "Leads payroll execution efforts.",
    team: "Payroll",
    parentId: "1",
  },
  {
    id: "15",
    name: "Hamza Ahmed",
    role: "Engineer",
    summary: "Works on payroll execution.",
    team: "Payroll - Execution",
    parentId: "14",
  },
  {
    id: "16",
    name: "Amr Heidawy",
    role: "Engineer",
    summary: "Works on payroll execution.",
    team: "Payroll - Execution",
    parentId: "14",
  },
  // Payroll Tracking sub-team
  {
    id: "17",
    name: "Abdelrhman Haithem",
    role: "Payroll Tracking Leader",
    summary: "Leads payroll tracking and monitoring.",
    team: "Payroll",
    parentId: "1",
  },
  {
    id: "18",
    name: "Yassien Azab",
    role: "Engineer",
    summary: "Works on payroll tracking and monitoring.",
    team: "Payroll - Tracking",
    parentId: "17",
  },
  {
    id: "19",
    name: "Youssef Badr",
    role: "Engineer",
    summary: "Works on payroll tracking and monitoring.",
    team: "Payroll - Tracking",
    parentId: "17",
  },
  {
    id: "20",
    name: "Roshdy Essam",
    role: "Engineer",
    summary: "Works on time management.",
    team: "Time Management",
    parentId: "1",
  },
  {
    id: "21",
    name: "Mahmoud Shawky",
    role: "Engineer",
    summary: "Works on the time management subsystem.",
    team: "Time Management",
    parentId: "1",
  },
];

function HoverCard({ m }: { m: Member }) {
  const theme = useTheme();
  const paletteMain = theme.palette.info?.main || "#1E40AF";
  // Force accent to be the same blue as paletteMain (remove purple accents)
  const accent = paletteMain;
  return (
    <Paper
      elevation={8}
      sx={{
        p: 2,
        maxWidth: 300,
        background: `linear-gradient(135deg, ${alpha(
          TEMPLATE_FG,
          0.03
        )}, ${alpha(TEMPLATE_BG, 0.6)})`,
        backdropFilter: "blur(8px)",
        borderLeft: `4px solid ${paletteMain}`,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: TEMPLATE_FG }}
      >
        {m.name}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: alpha(TEMPLATE_FG, 0.8),
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {m.role}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.6 }}>
        <span style={{ color: alpha(TEMPLATE_FG, 0.9) }}>{m.summary}</span>
      </Typography>
    </Paper>
  );
}

function Node({
  m,
  size = 74,
  id,
  innerRef,
}: {
  m: Member;
  size?: number;
  id: string;
  innerRef: (el: HTMLElement | null) => void;
}) {
  const theme = useTheme();
  const paletteMain = theme.palette.info?.main || "#1E40AF";
  // Force accent to be the same blue as paletteMain (remove purple accents)
  const accent = paletteMain;
  const initial = m.name ? m.name.charAt(0) : "?";
  const isRoot = id === "root";

  // Keep the node cards compact enough so 2 members can sit side-by-side
  // under the same leader on typical widths.
  const cardWidth = Math.max(110, Math.round(size * 1.42));
  return (
    <div
      ref={(el) => innerRef(el)}
      style={{ display: "inline-block" }}
      data-nodeid={id}
    >
      <Tooltip
        title={<HoverCard m={m} />}
        placement="top"
        enterDelay={120}
        leaveDelay={180}
        disableInteractive={false}
      >
        <Paper
          elevation={10}
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 1.5,
            minWidth: cardWidth,
            textAlign: "center",
            borderRadius: 3,
            border: "2px solid",
            borderColor: alpha(paletteMain, 0.18),
            transition: "all 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: `linear-gradient(90deg, ${paletteMain}, ${accent})`,
              opacity: 0,
              transition: "opacity 300ms ease",
            },
            "&:hover": {
              transform: "translateY(-10px) scale(1.04)",
              boxShadow: `0 18px 48px ${alpha(paletteMain, 0.32)}`,
              borderColor: alpha(paletteMain, 0.5),
              "&::before": {
                opacity: 1,
              },
            },
            background: `linear-gradient(145deg, ${alpha(
              TEMPLATE_FG,
              0.02
            )}, ${alpha(TEMPLATE_BG, 0.6)})`,
            backdropFilter: "blur(20px)",
          }}
        >
          <Avatar
            src={m.photo}
            sx={{
              width: size,
              height: size,
              bgcolor: TEMPLATE_BG,
              background: `linear-gradient(135deg, ${paletteMain}, ${accent})`,
              boxShadow: `0 8px 28px ${alpha(paletteMain, 0.36)}`,
              border: `3px solid ${TEMPLATE_FG}`,
              fontSize: size * 0.4,
              fontWeight: 700,
            }}
          >
            {!m.photo && initial}
          </Avatar>
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: "text.primary",
                fontSize: "0.95rem",
              }}
            >
              {m.name}
            </Typography>
            <Box
              sx={{
                px: 2,
                py: 0.55,
                background: `linear-gradient(135deg, ${paletteMain}, ${accent})`,
                color: theme.palette.getContrastText(paletteMain),
                borderRadius: 999,
                fontWeight: 700,
                letterSpacing: 0.6,
                display: "inline-block",
                fontSize: "0.68rem",
                textTransform: "uppercase",
                boxShadow: `0 6px 20px ${alpha(paletteMain, 0.22)}`,
              }}
            >
              {m.role}
            </Box>
          </Box>
        </Paper>
      </Tooltip>
    </div>
  );
}

export default function OrgChart({ data = SAMPLE }: { data?: Member[] }) {
  const theme = useTheme();
  // Use theme values when available, otherwise fall back to template colors
  const paletteMain = theme.palette.info?.main || TEMPLATE_PRIMARY;
  // Use a single blue accent across the chart (no secondary/purple)
  const accent = paletteMain;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = React.useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);

  // refs for nodes
  const nodeRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const setNodeRef = (id: string) => (el: HTMLElement | null) => {
    nodeRefs.current[id] = el;
  };

  const updateLines = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const getCenter = (el: HTMLElement | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - rect.left + r.width / 2,
        y: r.top - rect.top + r.height / 2,
      };
    };

    const newLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // connect each node to its parent (based on parentId)
    for (const m of data) {
      const pid = (m as any).parentId as string | undefined | null;
      if (!pid) continue;
      const parentEl = nodeRefs.current[pid];
      const childEl = nodeRefs.current[m.id];
      const pc = getCenter(parentEl);
      const cc = getCenter(childEl);
      if (pc && cc) {
        newLines.push({ x1: pc.x, y1: pc.y + 50, x2: cc.x, y2: cc.y - 50 });
      }
    }

    setLines(newLines);
  }, [data]);

  React.useLayoutEffect(() => {
    updateLines();
    const ro = new ResizeObserver(() => updateLines());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateLines);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateLines);
    };
  }, [updateLines]);

  // Layout mapping
  // Build a parent -> children map from the provided data
  const byId = React.useMemo(() => {
    const m = new Map<string, Member>();
    data.forEach((d) => m.set(d.id, d));
    return m;
  }, [data]);

  const childrenMap = React.useMemo(() => {
    const map = new Map<string, Member[]>();
    data.forEach((d) => {
      const pid = d.parentId || null;
      if (pid) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push(d);
      }
    });
    return map;
  }, [data]);

  const root = React.useMemo(
    () => data.find((d) => !d.parentId) || data[0],
    [data]
  );
  const leads = childrenMap.get(root.id) || [];

  return (
    <Box
      ref={containerRef}
      id="org"
      sx={{
        width: "100%",
        position: "relative",
        py: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          position: "relative",
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* SVG connectors */}
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient
              id="orgLineGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={alpha(paletteMain, 0.85)} />
              <stop offset="60%" stopColor={alpha(accent, 0.6)} />
              <stop offset="100%" stopColor={alpha(paletteMain, 0.45)} />
            </linearGradient>
            <filter id="orgGlow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="orgDotGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={paletteMain} />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          {lines.map((l, i) => {
            const midY = (l.y1 + l.y2) / 2;
            const curve = `M ${l.x1} ${l.y1} C ${l.x1} ${midY}, ${l.x2} ${midY}, ${l.x2} ${l.y2}`;
            return (
              <g key={i}>
                <path
                  d={curve}
                  stroke="url(#orgLineGradient)"
                  strokeWidth={3.5}
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#orgGlow)"
                  opacity={0.9}
                />
                <circle
                  cx={l.x1}
                  cy={l.y1}
                  r={4.25}
                  fill="url(#orgDotGradient)"
                  opacity={0.85}
                />
                <circle
                  cx={l.x2}
                  cy={l.y2}
                  r={5.5}
                  fill="url(#orgDotGradient)"
                  stroke={TEMPLATE_FG}
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 5 }}>
          {root && (
            <Node m={root} id="root" innerRef={setNodeRef("root")} size={100} />
          )}
        </Box>

        <Box sx={{ my: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Divider
            sx={{
              flex: 1,
              borderColor: alpha(paletteMain, 0.15),
              borderWidth: 1.5,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontSize: "0.7rem",
            }}
          >
            Teams
          </Typography>
          <Divider
            sx={{
              flex: 1,
              borderColor: alpha(paletteMain, 0.15),
              borderWidth: 1.5,
            }}
          />
        </Box>

        {/* Teams: each leader stacked above their members; teams wrap on smaller screens */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: { xs: 3, md: 4 },
            mt: 3,
          }}
        >
          {leads.map((leader) => {
            const kids = childrenMap.get(leader.id) || [];
            return (
              <Box
                key={leader.id}
                sx={{
                  flex: "1 1 260px",
                  maxWidth: {
                    xs: "100%",
                    sm: "calc(50% - 24px)",
                    lg: "calc(25% - 32px)",
                  },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    p: 2.25,
                    borderRadius: 4,
                    border: `1.5px solid ${alpha(paletteMain, 0.16)}`,
                    background: `linear-gradient(145deg, ${alpha(
                      TEMPLATE_FG,
                      0.02
                    )}, ${alpha(TEMPLATE_BG, 0.55)})`,
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <Node
                      m={leader}
                      id={leader.id}
                      innerRef={setNodeRef(leader.id)}
                      size={85}
                    />
                  </Box>

                  {kids.length === 0 ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", textAlign: "center" }}
                    >
                      No direct reports
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        columnGap: 3,
                        rowGap: 3,
                        flexWrap: "wrap",
                        pt: 1,
                      }}
                    >
                      {kids.map((k) => (
                        <Box
                          key={k.id}
                          sx={{ display: "flex", justifyContent: "center" }}
                        >
                          <Node
                            m={k}
                            id={k.id}
                            innerRef={setNodeRef(k.id)}
                            size={75}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            This is a visual preview. Provide member data to fully populate the
            chart.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
