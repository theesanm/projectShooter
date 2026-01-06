import React from 'react';
import {
  Container,
  Typography,
  Alert,
} from '@mui/material';

export default function Waves() {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Waves Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Configure wave settings, boss sequences, and difficulty
      </Typography>

      <Alert severity="info">
        Waves management coming soon. Create waves with boss sequences and enemy spawns.
      </Alert>
    </Container>
  );
}
