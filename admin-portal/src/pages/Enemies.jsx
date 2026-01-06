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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { enemiesService } from '../services/api';

const enemyTypes = [
  { value: 'standard', label: 'Standard', color: 'default' },
  { value: 'fast', label: 'Fast', color: 'warning' },
  { value: 'tank', label: 'Tank', color: 'info' },
  { value: 'flying', label: 'Flying', color: 'success' },
];

export default function Enemies() {
  const [enemies, setEnemies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    enemy_key: '',
    name: '',
    type: 'standard',
    base_health: 100,
    base_speed: 150,
    base_damage: 5,
    point_value: 10,
    currency_drop: 5,
    scale_min: 1.0,
    scale_max: 1.0,
    color: '#ff0000',
    image: '',
  });

  useEffect(() => {
    loadEnemies();
  }, []);

  const loadEnemies = async () => {
    try {
      setLoading(true);
      const data = await enemiesService.getAll();
      setEnemies(data);
      setError('');
    } catch (err) {
      setError('Failed to load enemies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (enemy = null) => {
    if (enemy) {
      setEditingEnemy(enemy);
      setFormData({
        enemy_key: enemy.enemy_key,
        name: enemy.name,
        type: enemy.type,
        base_health: enemy.base_health,
        base_speed: enemy.base_speed,
        base_damage: enemy.base_damage || 5,
        point_value: enemy.point_value || 10,
        currency_drop: enemy.currency_drop || 5,
        scale_min: parseFloat(enemy.scale_min) || 1.0,
        scale_max: parseFloat(enemy.scale_max) || 1.0,
        color: enemy.color || '#ff0000',
        image: enemy.image || '',
        is_active: enemy.is_active !== false,
      });
      setImagePreview(enemy.image ? `http://localhost:3001${enemy.image}` : '');
      setImageFile(null);
    } else {
      setEditingEnemy(null);
      setFormData({
        enemy_key: '',
        name: '',
        type: 'standard',
        base_health: 100,
        base_speed: 150,
        base_damage: 5,
        point_value: 10,
        currency_drop: 5,
        scale_min: 1.0,
        scale_max: 1.0,
        color: '#ff0000',
        image: '',
        is_active: true,
      });
      setImagePreview('');
      setImageFile(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnemy(null);
  };

  const handleSubmit = async () => {
    try {
      let imagePath = formData.image;
      
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('http://localhost:3001/api/upload/enemy-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imagePath = uploadData.path;
        }
      }
      
      const dataToSubmit = { ...formData, image: imagePath };
      
      if (editingEnemy) {
        await enemiesService.update(editingEnemy.id, dataToSubmit);
        setSuccess('Enemy updated successfully');
      } else {
        await enemiesService.create(dataToSubmit);
        setSuccess('Enemy created successfully');
      }
      handleCloseDialog();
      loadEnemies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save enemy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enemy?')) return;
    
    try {
      await enemiesService.delete(id);
      setSuccess('Enemy deleted successfully');
      loadEnemies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete enemy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Enemies Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Enemy
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {enemies.map((enemy) => {
            const typeInfo = enemyTypes.find(t => t.value === enemy.type) || enemyTypes[0];
            return (
              <Grid item xs={12} sm={6} md={4} key={enemy.id}>
                <Card sx={{ opacity: enemy.is_active ? 1 : 0.6 }}>
                  {enemy.image && (
                    <Box
                      component="img"
                      src={`http://localhost:3001${enemy.image}`}
                      alt={enemy.name}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'contain',
                        backgroundColor: '#f0f0f0',
                        p: 2,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {enemy.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={typeInfo.label}
                        color={typeInfo.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {!enemy.is_active && (
                        <Chip
                          label="Inactive"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Health: {enemy.base_health} | Speed: {enemy.base_speed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Damage: {enemy.base_damage} | Points: {enemy.point_value}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(enemy)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(enemy.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Enemy Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEnemy ? 'Edit Enemy' : 'Add Enemy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enemy Key"
                value={formData.enemy_key}
                onChange={(e) => setFormData({ ...formData, enemy_key: e.target.value })}
                helperText="Unique identifier (e.g., enemy_basic)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {enemyTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Health"
                type="number"
                value={formData.base_health}
                onChange={(e) => setFormData({ ...formData, base_health: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Speed"
                type="number"
                value={formData.base_speed}
                onChange={(e) => setFormData({ ...formData, base_speed: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Damage"
                type="number"
                value={formData.base_damage}
                onChange={(e) => setFormData({ ...formData, base_damage: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Point Value"
                type="number"
                value={formData.point_value}
                onChange={(e) => setFormData({ ...formData, point_value: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Currency Drop"
                type="number"
                value={formData.currency_drop}
                onChange={(e) => setFormData({ ...formData, currency_drop: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
              </Button>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingEnemy ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
