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
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { bossesService } from '../services/api';

const bossTypes = [
  { value: 'boss', label: 'Boss (Ultimate)', color: 'error' },
  { value: 'tank', label: 'Tank (Heavy)', color: 'info' },
  { value: 'fast', label: 'Fast (Agile)', color: 'warning' },
  { value: 'flying', label: 'Flying (Aerial)', color: 'success' },
  { value: 'ranged', label: 'Ranged (Shooter)', color: 'secondary' },
];

export default function Bosses() {
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoss, setEditingBoss] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [formData, setFormData] = useState({
    boss_key: '',
    name: '',
    description: '',
    type: 'boss',
    base_health: 1000,
    base_speed: 100,
    base_damage: 10,
    scale_min: 1.0,
    scale_max: 1.0,
    color: '#ff0000',
    image: '',
    defeat_reward: 100,
    currency_drop: 50,
  });

  useEffect(() => {
    loadBosses();
  }, []);

  const loadBosses = async () => {
    try {
      setLoading(true);
      const data = await bossesService.getAll();
      setBosses(data);
      setError('');
    } catch (err) {
      setError('Failed to load bosses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (boss = null) => {
    if (boss) {
      setEditingBoss(boss);
      setFormData({
        boss_key: boss.boss_key,
        name: boss.name,
        description: boss.description || '',
        type: boss.type,
        base_health: boss.base_health,
        base_speed: boss.base_speed,
        base_damage: boss.base_damage || 10,
        scale_min: parseFloat(boss.scale_min) || 1.0,
        scale_max: parseFloat(boss.scale_max) || 1.0,
        color: boss.color || '#ff0000',
        image: boss.image || '',
        defeat_reward: boss.defeat_reward || 100,
        currency_drop: boss.currency_drop || 50,
      });
      setImagePreview(boss.image ? `http://localhost:3001${boss.image}` : '');
      setImageFile(null);
      setImageError(false);
    } else {
      setEditingBoss(null);
      setFormData({
        boss_key: '',
        name: '',
        description: '',
        type: 'boss',
        base_health: 1000,
        base_speed: 100,
        base_damage: 10,
        scale_min: 1.0,
        scale_max: 1.0,
        color: '#ff0000',
        image: '',
        defeat_reward: 100,
        currency_drop: 50,
      });
      setImagePreview('');
      setImageFile(null);
      setImageError(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBoss(null);
  };

  const handleSubmit = async () => {
    try {
      let imagePath = formData.image;
      
      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('http://localhost:3001/api/upload/boss-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imagePath = uploadData.path;
        setUploadingImage(false);
      }
      
      const dataToSubmit = { ...formData, image: imagePath };
      
      if (editingBoss) {
        await bossesService.update(editingBoss.id, dataToSubmit);
        setSuccess('Boss updated successfully');
      } else {
        await bossesService.create(dataToSubmit);
        setSuccess('Boss created successfully');
      }
      handleCloseDialog();
      loadBosses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUploadingImage(false);
      setError(err.message || 'Failed to save boss');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this boss?')) return;
    
    try {
      await bossesService.delete(id);
      setSuccess('Boss deleted successfully');
      loadBosses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete boss');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      setImageFile(file);
      setImageError(false); // Clear error when new file is selected
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageError(false);
    setFormData({ ...formData, image: '' });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getBossTypeInfo = (type) => {
    return bossTypes.find(t => t.value === type) || bossTypes[0];
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Boss Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage boss templates with base stats
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Boss
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {bosses.map((boss) => {
          const typeInfo = getBossTypeInfo(boss.type);
          return (
            <Grid item xs={12} sm={6} md={4} key={boss.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6">
                      {boss.name}
                    </Typography>
                    <Chip 
                      label={typeInfo.label}
                      size="small" 
                      color={typeInfo.color}
                    />
                  </Box>
                  
                  {boss.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {boss.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ 
                    bgcolor: 'background.default', 
                    p: 1.5, 
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Base Stats:
                    </Typography>
                    <Typography variant="body2">
                      ❤️ Health: <strong>{boss.base_health}</strong><br />
                      ⚡ Speed: <strong>{boss.base_speed}</strong><br />
                      ⚔️ Damage: <strong>{boss.base_damage || 10}</strong>
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Scale: ${boss.scale_min}-${boss.scale_max}x`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`💰 ${boss.defeat_reward}`}
                      size="small"
                      variant="outlined"
                      color="warning"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(boss)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(boss.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add/Edit Boss Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBoss ? 'Edit Boss' : 'Add New Boss'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Boss Key"
                  value={formData.boss_key}
                  onChange={(e) => handleChange('boss_key', e.target.value)}
                  helperText="Unique identifier (e.g., demon_lord)"
                  disabled={!!editingBoss}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Boss Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    label="Boss Type"
                  >
                    {bossTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Base Stats
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Health"
                  value={formData.base_health}
                  onChange={(e) => handleChange('base_health', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Speed"
                  value={formData.base_speed}
                  onChange={(e) => handleChange('base_speed', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Damage"
                  value={formData.base_damage}
                  onChange={(e) => handleChange('base_damage', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Visual & Scale
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Scale Min"
                  value={formData.scale_min}
                  onChange={(e) => handleChange('scale_min', parseFloat(e.target.value) || 1.0)}
                  inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Scale Max"
                  value={formData.scale_max}
                  onChange={(e) => handleChange('scale_max', parseFloat(e.target.value) || 1.0)}
                  inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color (Hex)"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  helperText="e.g., #ff0000"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Boss Image
                </Typography>
                <Box sx={{ 
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'background.default'
                }}>
                  {imagePreview && !imageError ? (
                    <Box>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Boss preview"
                        onError={handleImageError}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          objectFit: 'contain',
                          mb: 2
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component="label"
                        >
                          Change Image
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={handleRemoveImage}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      {imageError && (
                        <Typography variant="body2" color="error" gutterBottom>
                          Image file not found. Please upload a new image.
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {imageError ? 'Upload new image' : 'No image selected'}
                      </Typography>
                      <Button
                        variant="contained"
                        component="label"
                        size="small"
                      >
                        Upload Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </Button>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                        Supported: JPG, PNG, GIF, WebP, SVG (Max 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Rewards
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Defeat Reward"
                  value={formData.defeat_reward}
                  onChange={(e) => handleChange('defeat_reward', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Currency Drop"
                  value={formData.currency_drop}
                  onChange={(e) => handleChange('currency_drop', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploadingImage}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={uploadingImage}
          >
            {uploadingImage ? 'Uploading...' : (editingBoss ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
