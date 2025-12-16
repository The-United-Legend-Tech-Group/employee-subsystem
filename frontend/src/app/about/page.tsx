"use client";
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import NextLink from "next/link";
import ProTip from "@/components/ProTip";
import Copyright from "@/components/Copyright";

export default function About() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 6 }}>
        <Stack spacing={4} alignItems="center">
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, md: 6 },
              width: "100%",
              background:
                "linear-gradient(120deg, rgba(63,81,181,0.08), rgba(0,188,212,0.06))",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{ mb: 1, textAlign: "center" }}
            >
              Project Arcana
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 2 }}
            >
              An immersive HR platform powered by The United Legends Tech Group
            </Typography>

            <Box sx={{ maxWidth: 900, mx: "auto", textAlign: "center" }}>
              <Typography paragraph sx={{ fontSize: 16 }}>
                Project Arcana is an HR system built by 21 team members from The
                United Legends Tech Group. It aims to deliver an immersive HR
                experience through digital transformation, modern UX patterns,
                and integrated tools to streamline employee lifecycle,
                performance, payroll, recruitment, notifications, and time
                management.
              </Typography>
              <Typography paragraph sx={{ fontSize: 16 }}>
                The platform focuses on extensibility, accessibility, and
                real-world workflows to help organizations manage people and
                processes more efficiently. Arcana is modular with services for
                time management, payroll, recruitment, and analytics.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  component={NextLink}
                  href="/"
                  endIcon={<ArrowForwardIosIcon fontSize="small" />}
                >
                  Home
                </Button>
                <Button variant="outlined" component={NextLink} href="/credits">
                  View Credits
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ width: "100%", maxWidth: 900 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              What makes Arcana special
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Paper sx={{ p: 2, flex: "1 1 220px" }} elevation={2}>
                <Typography variant="subtitle1">
                  Modular Architecture
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Independent subsystems for payroll, time, recruitment and
                  more.
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: "1 1 220px" }} elevation={2}>
                <Typography variant="subtitle1">Human-centered UX</Typography>
                <Typography variant="body2" color="text.secondary">
                  Designed with real workflows in mind for managers and
                  employees.
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: "1 1 220px" }} elevation={2}>
                <Typography variant="subtitle1">
                  Extensible Integrations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  APIs and connectors to modern HR and financial tools.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Stack>
        <Box
          sx={{
            mt: 4,
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <ProTip />
          <Copyright />
        </Box>
      </Box>
    </Container>
  );
}
