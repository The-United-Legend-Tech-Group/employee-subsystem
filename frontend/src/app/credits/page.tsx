"use client";
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NextLink from "next/link";
import CreditsHero from "@/components/CreditsHero";
import OrgChart from "@/components/OrgChart";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

export default function CreditsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 6 }}>
        <Box sx={{ mb: 4 }}>
          <CreditsHero />
        </Box>

        <Paper
          elevation={1}
          sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}
        >
          <Typography variant="h5" sx={{ mb: 1 }}>
            Organization Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Preview of the organizational structure for The United Legends Tech
            Group. Hover the nodes to see member summaries. Provide the team's
            data to fully populate this chart.
          </Typography>

          <OrgChart />
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
          <Typography variant="h6">
            About The United Legends Tech Group
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The United Legends Tech Group is a collaborative team focused on
            delivering modern software solutions. The group for Arcana brought
            together engineers, designers, and domain experts to build a
            production-ready HR platform.
          </Typography>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Button component={NextLink} href="/about" variant="outlined">
            Back to About
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
