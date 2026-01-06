import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  ShoppingCart as ShopIcon,
  Waves as WavesIcon,
  SportsEsports as WeaponIcon,
  Person as SkinIcon,
} from '@mui/icons-material';

export default function Dashboard() {
  const stats = [
    { title: 'Total Weapons', value: '8', icon: <WeaponIcon fontSize="large" />, color: '#ff4444' },
    { title: 'Total Skins', value: '10', icon: <SkinIcon fontSize="large" />, color: '#ffa500' },
    { title: 'Total Waves', value: '0', icon: <WavesIcon fontSize="large" />, color: '#00bfff' },
    { title: 'Shop Items', value: '18', icon: <ShopIcon fontSize="large" />, color: '#00ff00' },
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to the Kombat Admin Portal
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Navigate to Weapons to manage weapon templates<br />
            • Navigate to Skins to manage player skins<br />
            • Navigate to Waves to configure wave settings<br />
            • Navigate to Shop to manage pricing and availability
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
