import React from 'react';
import {
  Container,
  Typography,
  Alert,
} from '@mui/material';

export default function Skins() {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Player Skins
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Manage player skin templates and cosmetics
      </Typography>

      <Alert severity="info">
        Skins management coming soon. Use the template sync to populate skins from JSON files.
      </Alert>
    </Container>
  );
}
