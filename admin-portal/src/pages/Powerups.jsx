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
import { powerupsService } from '../services/api';

const rarities = [
  { value: 'common', label: 'Common', color: 'default' },
  { value: 'rare', label: 'Rare', color: 'primary' },
  { value: 'epic', label: 'Epic', color: 'secondary' },
  { value: 'legendary', label: 'Legendary', color: 'warning' },
];

const powerupTypes = [
  'weapon_upgrade',
  'health_boost',
  'speed_boost',
  'shield',
  'multi_shot',
  'rapid_fire',
  'extra_life',
];

export default function Powerups() {
  const [powerups, setPowerups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPowerup, setEditingPowerup] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    powerup_key: '',
    name: '',
    type: 'weapon_upgrade',
    effect: {},
    duration_ms: 10000,
    rarity: 'common',
    image: '',
  });

  useEffect(() => {
    loadPowerups();
  }, []);

  const loadPowerups = async () => {
    try {
      setLoading(true);
      const data = await powerupsService.getAll();
      setPowerups(data);
      setError('');
    } catch (err) {
      setError('Failed to load powerups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (powerup = null) => {
    if (powerup) {
      setEditingPowerup(powerup);
      setFormData({
        powerup_key: powerup.powerup_key,
        name: powerup.name,
        type: powerup.type,
        effect: powerup.effect || {},
        duration_ms: powerup.duration_ms || 10000,
        rarity: powerup.rarity || 'common',
        image: powerup.image || '',
        is_active: powerup.is_active !== false,
      });
      setImagePreview(powerup.image ? `http://localhost:3001${powerup.image}` : '');
      setImageFile(null);
    } else {
      setEditingPowerup(null);
      setFormData({
        powerup_key: '',
        name: '',
        type: 'weapon_upgrade',
        effect: {},
        duration_ms: 10000,
        rarity: 'common',
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
    setEditingPowerup(null);
  };

  const handleSubmit = async () => {
    try {
      let imagePath = formData.image;
      
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('http://localhost:3001/api/upload/powerup-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imagePath = uploadData.path;
        }
      }
      
      const dataToSubmit = { ...formData, image: imagePath };
      
      if (editingPowerup) {
        await powerupsService.update(editingPowerup.id, dataToSubmit);
        setSuccess('Powerup updated successfully');
      } else {
        await powerupsService.create(dataToSubmit);
        setSuccess('Powerup created successfully');
      }
      handleCloseDialog();
      loadPowerups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save powerup');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this powerup?')) return;
    
    try {
      await powerupsService.delete(id);
      setSuccess('Powerup deleted successfully');
      loadPowerups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete powerup');
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
            Powerups Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Powerup
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {powerups.map((powerup) => {
            const rarityInfo = rarities.find(r => r.value === powerup.rarity) || rarities[0];
            return (
              <Grid item xs={12} sm={6} md={4} key={powerup.id}>
                <Card sx={{ opacity: powerup.is_active ? 1 : 0.6 }}>
                  {powerup.image && (
                    <Box
                      component="img"
                      src={`http://localhost:3001${powerup.image}`}
                      alt={powerup.name}
                      sx={{
                        width: '100%',
                        height: 150,
                        objectFit: 'contain',
                        backgroundColor: '#f0f0f0',
                        p: 2,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {powerup.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={rarityInfo.label}
                        color={rarityInfo.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={powerup.type}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {!powerup.is_active && (
                        <Chip
                          label="Inactive"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {powerup.duration_ms ? `${powerup.duration_ms/1000}s` : 'Instant'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(powerup)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(powerup.id)}
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

      {/* Powerup Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPowerup ? 'Edit Powerup' : 'Add Powerup'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Powerup Key"
                value={formData.powerup_key}
                onChange={(e) => setFormData({ ...formData, powerup_key: e.target.value })}
                helperText="Unique identifier (e.g., powerup_shield)"
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
                  {powerupTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rarity</InputLabel>
                <Select
                  value={formData.rarity}
                  label="Rarity"
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                >
                  {rarities.map((rarity) => (
                    <MenuItem key={rarity.value} value={rarity.value}>
                      {rarity.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (ms)"
                type="number"
                value={formData.duration_ms}
                onChange={(e) => setFormData({ ...formData, duration_ms: parseInt(e.target.value) })}
                helperText="0 for instant effects"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
              </Button>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingPowerup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
