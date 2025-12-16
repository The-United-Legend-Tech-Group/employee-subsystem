"use client";
import * as React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NextLink from "next/link";

export default function CreditsHero() {
  return (
    <Paper
      elevation={8}
      sx={{
        p: { xs: 3, md: 6 },
        borderRadius: 3,
        background:
          "linear-gradient(135deg, rgba(63,81,181,0.08), rgba(3,169,244,0.04))",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
          Credits
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          The United Legends Tech Group — 21 contributors
        </Typography>

        <Typography variant="body1" sx={{ maxWidth: 900, mx: "auto", mb: 2 }}>
          The United Legends Tech Group contributed to Project Arcana, an
          extensible HR platform built to modern standards. Below you can
          preview the organizational structure and team members; hover a node to
          read a quick summary of each member's role.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button component={NextLink} href="/about" variant="outlined">
            About Project
          </Button>
          <Button component={NextLink} href="#org" variant="contained">
            View Org Preview
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
