import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { weaponsService } from '../services/api';

export default function Weapons() {
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWeapons();
  }, []);

  const loadWeapons = async () => {
    try {
      const data = await weaponsService.getAll();
      setWeapons(data);
    } catch (err) {
      setError('Failed to load weapons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Weapons Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Manage weapon templates and configurations
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {weapons.map((weapon) => (
          <Grid item xs={12} sm={6} md={4} key={weapon.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {weapon.name}
                </Typography>
                <Chip 
                  label={`Tier ${weapon.tier}`} 
                  size="small" 
                  color="primary" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" paragraph>
                  {weapon.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Damage:</strong> {weapon.damage}<br />
                  <strong>Fire Rate:</strong> {weapon.fire_rate}ms<br />
                  <strong>Speed:</strong> {weapon.projectile_speed}<br />
                  <strong>Pierce:</strong> {weapon.pierce_count}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Edit</Button>
                <Button size="small" color="secondary">Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
