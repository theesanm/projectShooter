import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { shopService } from '../services/api';

export default function Shop() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShopItems();
  }, []);

  const loadShopItems = async () => {
    try {
      const data = await shopService.getItems();
      setItems(data);
    } catch (err) {
      setError('Failed to load shop items');
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
        Shop Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Manage shop items, pricing, and availability
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Type</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell align="right">Price (Currency)</TableCell>
              <TableCell align="center">Featured</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Chip 
                    label={item.item_type} 
                    size="small" 
                    color={item.item_type === 'weapon' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>{item.item_name || `ID: ${item.item_id}`}</TableCell>
                <TableCell align="right">{item.price_currency}</TableCell>
                <TableCell align="center">
                  {item.is_featured ? '⭐' : '-'}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.is_active ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={item.is_active ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
