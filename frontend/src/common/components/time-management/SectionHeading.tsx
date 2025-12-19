"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { SectionDefinition } from "./types";

export default function SectionHeading({
  id,
  title,
  description,
}: SectionDefinition) {
  return (
    <Box id={id} sx={{ mb: 2 }}>
      <Typography component="h2" variant="h5" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
