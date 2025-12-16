"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SectionDefinition } from "./types";

export default function SectionHeading({
  id,
  title,
  description,
  icon,
}: SectionDefinition) {
  return (
    <Box id={id} sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon ? (
          <Box sx={{ color: (theme) => theme.palette.text.primary }}>
            {icon}
          </Box>
        ) : null}
        <Typography component="h2" variant="h5" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
