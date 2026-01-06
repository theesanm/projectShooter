import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { wavesService, bossesService, enemiesService, powerupsService } from '../services/api';

export default function WaveEditor() {
  const [waves, setWaves] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [powerups, setPowerups] = useState([]);
  const [selectedWave, setSelectedWave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wave form state
  const [waveForm, setWaveForm] = useState({
    wave_number: 1,
    name: '',
    description: '',
    duration_ms: 60000,
    enemy_spawn_rate_ms: 2000,
    max_enemies: 10,
  });
  
  // Boss sequence state
  const [bossSequence, setBossSequence] = useState([]);
  const [bossDialogOpen, setBossDialogOpen] = useState(false);
  const [editingBossIndex, setEditingBossIndex] = useState(null);
  const [selectedBoss, setSelectedBoss] = useState('');
  const [bossSpawnTime, setBossSpawnTime] = useState(0);
  const [isMainBoss, setIsMainBoss] = useState(false);
  const [healthMultiplier, setHealthMultiplier] = useState(1.0);
  const [damageMultiplier, setDamageMultiplier] = useState(1.0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  
  // Wave settings state
  const [waveSettings, setWaveSettings] = useState({
    powerup_spawn_interval_ms: 10000,
    difficulty_multiplier: 1.0,
  });

  // Enemy pool state
  const [enemyPool, setEnemyPool] = useState([]);
  const [enemyDialogOpen, setEnemyDialogOpen] = useState(false);
  const [editingEnemyIndex, setEditingEnemyIndex] = useState(null);
  const [selectedEnemy, setSelectedEnemy] = useState('');
  const [enemySpawnWeight, setEnemySpawnWeight] = useState(100);
  const [enemyMinTime, setEnemyMinTime] = useState(0);
  const [enemyMaxTime, setEnemyMaxTime] = useState(null);
  const [enemyHealthMult, setEnemyHealthMult] = useState(1.0);
  const [enemySpeedMult, setEnemySpeedMult] = useState(1.0);
  const [enemyDamageMult, setEnemyDamageMult] = useState(1.0);

  // Powerup pool state
  const [powerupPool, setPowerupPool] = useState([]);
  const [powerupDialogOpen, setPowerupDialogOpen] = useState(false);
  const [editingPowerupIndex, setEditingPowerupIndex] = useState(null);
  const [selectedPowerup, setSelectedPowerup] = useState('');
  const [powerupDropChance, setPowerupDropChance] = useState(10.0);
  const [powerupMinTime, setPowerupMinTime] = useState(0);
  const [powerupMaxTime, setPowerupMaxTime] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wavesData, bossesData, enemiesData, powerupsData] = await Promise.all([
        wavesService.getAll(),
        bossesService.getAll(),
        enemiesService.getAll(),
        powerupsService.getAll(),
      ]);
      setWaves(wavesData);
      setBosses(bossesData);
      setEnemies(enemiesData.filter(e => e.is_active));
      setPowerups(powerupsData.filter(p => p.is_active));
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleWaveSelect = async (wave) => {
    setSelectedWave(wave);
    setWaveForm({
      wave_number: wave.wave_number,
      name: wave.name,
      description: wave.description,
      duration_ms: wave.duration_ms,
      enemy_spawn_rate_ms: wave.enemy_spawn_rate_ms,
      max_enemies: wave.max_enemies,
    });
    
    // Load boss sequence
    setBossSequence(wave.bossSequence || []);
    
    // Load enemy pool
    loadEnemyPool(wave.wave_number);
    
    // Load powerup pool
    loadPowerupPool(wave.wave_number);
    
    // Load settings
    setWaveSettings(wave.settings || {
      powerup_spawn_interval_ms: 10000,
      difficulty_multiplier: 1.0,
    });
  };

  const loadEnemyPool = async (waveNumber) => {
    try {
      const response = await fetch(`http://localhost:3001/api/waves/${waveNumber}/enemies`);
      if (response.ok) {
        const data = await response.json();
        setEnemyPool(data);
      }
    } catch (err) {
      console.error('Failed to load enemy pool:', err);
    }
  };

  const loadPowerupPool = async (waveNumber) => {
    try {
      const response = await fetch(`http://localhost:3001/api/waves/${waveNumber}/powerups`);
      if (response.ok) {
        const data = await response.json();
        setPowerupPool(data);
      }
    } catch (err) {
      console.error('Failed to load powerup pool:', err);
    }
  };

  const handleSaveWave = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Check if wave number already exists (for new waves)
      if (!selectedWave) {
        const existingWave = waves.find(w => w.wave_number === waveForm.wave_number);
        if (existingWave) {
          setError(`Wave ${waveForm.wave_number} already exists. Please select it from the list to edit, or use a different wave number.`);
          return;
        }
      }
      
      const waveData = {
        ...waveForm,
        bossSequence: bossSequence.map((b, index) => ({
          boss_id: b.boss_id,
          spawn_time_ms: b.spawn_time_ms,
          is_main_boss: b.is_main_boss,
          sequence_order: index + 1,
          health_multiplier: b.health_multiplier || 1.0,
          damage_multiplier: b.damage_multiplier || 1.0,
          speed_multiplier: b.speed_multiplier || 1.0,
        })),
        settings: waveSettings,
      };

      let waveId;
      if (selectedWave) {
        await wavesService.update(selectedWave.id, waveData);
        waveId = selectedWave.wave_number;
        setSuccess('Wave updated successfully!');
      } else {
        await wavesService.create(waveData);
        waveId = waveForm.wave_number;
        setSuccess('Wave created successfully!');
      }
      
      // Save enemy pool
      if (enemyPool.length > 0) {
        await saveEnemyPool(waveId);
      }
      
      // Save powerup pool
      if (powerupPool.length > 0) {
        await savePowerupPool(waveId);
      }
      
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save wave');
    }
  };

  const saveEnemyPool = async (waveNumber) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/api/waves/${waveNumber}/enemies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          enemyPool: enemyPool.map(e => ({
            enemy_id: e.enemy_id,
            spawn_weight: e.spawn_weight || 100,
            min_spawn_time_ms: e.min_spawn_time_ms || 0,
            max_spawn_time_ms: e.max_spawn_time_ms,
            health_multiplier: e.health_multiplier || 1.0,
            speed_multiplier: e.speed_multiplier || 1.0,
            damage_multiplier: e.damage_multiplier || 1.0,
          })),
        }),
      });
    } catch (err) {
      console.error('Failed to save enemy pool:', err);
    }
  };

  const savePowerupPool = async (waveNumber) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/api/waves/${waveNumber}/powerups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          powerupPool: powerupPool.map(p => ({
            powerup_id: p.powerup_id,
            drop_chance: p.drop_chance || 10.0,
            min_spawn_time_ms: p.min_spawn_time_ms || 0,
            max_spawn_time_ms: p.max_spawn_time_ms,
          })),
        }),
      });
    } catch (err) {
      console.error('Failed to save powerup pool:', err);
    }
  };

  const handleAddBoss = () => {
    if (!selectedBoss) return;
    
    const boss = bosses.find(b => b.id === parseInt(selectedBoss));
    if (!boss) return;
    
    const spawnTime = parseInt(bossSpawnTime) || 0;
    
    const bossData = {
      boss_id: boss.id,
      boss_name: boss.name,
      spawn_time_ms: spawnTime,
      is_main_boss: isMainBoss,
      health_multiplier: healthMultiplier,
      damage_multiplier: damageMultiplier,
      speed_multiplier: speedMultiplier,
    };
    
    if (editingBossIndex !== null) {
      // Edit existing boss
      const newSequence = [...bossSequence];
      newSequence[editingBossIndex] = bossData;
      setBossSequence(newSequence);
      setEditingBossIndex(null);
    } else {
      // Add new boss
      setBossSequence([...bossSequence, bossData]);
    }
    
    setBossDialogOpen(false);
    setSelectedBoss('');
    setBossSpawnTime(0);
    setIsMainBoss(false);
    setHealthMultiplier(1.0);
    setDamageMultiplier(1.0);
    setSpeedMultiplier(1.0);
  };

  const handleEditBoss = (index) => {
    const boss = bossSequence[index];
    setEditingBossIndex(index);
    setSelectedBoss(boss.boss_id.toString());
    setBossSpawnTime(boss.spawn_time_ms);
    setIsMainBoss(boss.is_main_boss);
    setHealthMultiplier(boss.health_multiplier);
    setDamageMultiplier(boss.damage_multiplier);
    setSpeedMultiplier(boss.speed_multiplier);
    setBossDialogOpen(true);
  };

  const handleRemoveBoss = (index) => {
    setBossSequence(bossSequence.filter((_, i) => i !== index));
  };

  const handleMoveBoss = (index, direction) => {
    const newSequence = [...bossSequence];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSequence.length) return;
    
    [newSequence[index], newSequence[targetIndex]] = [newSequence[targetIndex], newSequence[index]];
    setBossSequence(newSequence);
  };

  const handleAddEnemy = () => {
    if (!selectedEnemy) return;
    
    const enemy = enemies.find(e => e.id === parseInt(selectedEnemy));
    if (!enemy) return;
    
    // Check if enemy already in pool (only when adding, not editing)
    if (editingEnemyIndex === null && enemyPool.some(e => e.enemy_id === enemy.id)) {
      setError('Enemy already added to this wave');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const enemyData = {
      enemy_id: enemy.id,
      enemy_name: enemy.name,
      enemy_type: enemy.type,
      spawn_weight: enemySpawnWeight,
      min_spawn_time_ms: enemyMinTime,
      max_spawn_time_ms: enemyMaxTime,
      health_multiplier: enemyHealthMult,
      speed_multiplier: enemySpeedMult,
      damage_multiplier: enemyDamageMult,
      image: enemy.image,
    };
    
    if (editingEnemyIndex !== null) {
      // Edit existing enemy
      const newPool = [...enemyPool];
      newPool[editingEnemyIndex] = enemyData;
      setEnemyPool(newPool);
      setEditingEnemyIndex(null);
    } else {
      // Add new enemy
      setEnemyPool([...enemyPool, enemyData]);
    }
    
    setEnemyDialogOpen(false);
    setSelectedEnemy('');
    setEnemySpawnWeight(100);
    setEnemyMinTime(0);
    setEnemyMaxTime(null);
    setEnemyHealthMult(1.0);
    setEnemySpeedMult(1.0);
    setEnemyDamageMult(1.0);
  };

  const handleEditEnemy = (index) => {
    const enemy = enemyPool[index];
    setEditingEnemyIndex(index);
    setSelectedEnemy(enemy.enemy_id.toString());
    setEnemySpawnWeight(enemy.spawn_weight);
    setEnemyMinTime(enemy.min_spawn_time_ms);
    setEnemyMaxTime(enemy.max_spawn_time_ms);
    setEnemyHealthMult(enemy.health_multiplier);
    setEnemySpeedMult(enemy.speed_multiplier);
    setEnemyDamageMult(enemy.damage_multiplier);
    setEnemyDialogOpen(true);
  };

  const handleRemoveEnemy = (index) => {
    setEnemyPool(enemyPool.filter((_, i) => i !== index));
  };

  const handleAddPowerup = () => {
    if (!selectedPowerup) return;
    
    const powerup = powerups.find(p => p.id === parseInt(selectedPowerup));
    if (!powerup) return;
    
    // Check if powerup already in pool (only when adding, not editing)
    if (editingPowerupIndex === null && powerupPool.some(p => p.powerup_id === powerup.id)) {
      setError('Powerup already added to this wave');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const powerupData = {
      powerup_id: powerup.id,
      powerup_name: powerup.name,
      powerup_type: powerup.type,
      rarity: powerup.rarity,
      drop_chance: powerupDropChance,
      min_spawn_time_ms: powerupMinTime,
      max_spawn_time_ms: powerupMaxTime,
      image: powerup.image,
    };
    
    if (editingPowerupIndex !== null) {
      // Edit existing powerup
      const newPool = [...powerupPool];
      newPool[editingPowerupIndex] = powerupData;
      setPowerupPool(newPool);
      setEditingPowerupIndex(null);
    } else {
      // Add new powerup
      setPowerupPool([...powerupPool, powerupData]);
    }
    
    setPowerupDialogOpen(false);
    setSelectedPowerup('');
    setPowerupDropChance(10.0);
    setPowerupMinTime(0);
    setPowerupMaxTime(null);
  };

  const handleEditPowerup = (index) => {
    const powerup = powerupPool[index];
    setEditingPowerupIndex(index);
    setSelectedPowerup(powerup.powerup_id.toString());
    setPowerupDropChance(powerup.drop_chance);
    setPowerupMinTime(powerup.min_spawn_time_ms);
    setPowerupMaxTime(powerup.max_spawn_time_ms);
    setPowerupDialogOpen(true);
  };

  const handleRemovePowerup = (index) => {
    setPowerupPool(powerupPool.filter((_, i) => i !== index));
  };

  const handleNewWave = () => {
    // Find next available wave number
    const existingNumbers = waves.map(w => w.wave_number);
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    setSelectedWave(null);
    setWaveForm({
      wave_number: nextNumber,
      name: '',
      description: '',
      duration_ms: 60000,
      enemy_spawn_rate_ms: 2000,
      max_enemies: 10,
    });
    setBossSequence([]);
    setWaveSettings({
      powerup_spawn_interval_ms: 10000,
      difficulty_multiplier: 1.0,
    });
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Wave Editor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure wave duration, boss sequences, powerups, and difficulty
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Wave List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Waves</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleNewWave}
                variant="contained"
              >
                New
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {waves.map((wave) => (
              <Card
                key={wave.id}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: selectedWave?.id === wave.id ? 'primary.dark' : 'background.paper',
                }}
                onClick={() => handleWaveSelect(wave)}
              >
                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                  <Typography variant="subtitle2">
                    Wave {wave.wave_number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {wave.name}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        {/* Wave Configuration */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedWave ? 'Edit Wave' : 'New Wave'}
            </Typography>

            {/* Basic Settings */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Basic Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Wave Number"
                    type="number"
                    value={waveForm.wave_number}
                    onChange={(e) => setWaveForm({ ...waveForm, wave_number: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Wave Name"
                    value={waveForm.name}
                    onChange={(e) => setWaveForm({ ...waveForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={waveForm.description}
                    onChange={(e) => setWaveForm({ ...waveForm, description: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Timing Settings */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Timing & Spawn Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Wave Duration (ms)"
                    type="number"
                    value={waveForm.duration_ms}
                    onChange={(e) => setWaveForm({ ...waveForm, duration_ms: parseInt(e.target.value) })}
                    helperText={`${formatTime(waveForm.duration_ms)} total`}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Enemy Spawn Rate (ms)"
                    type="number"
                    value={waveForm.enemy_spawn_rate_ms}
                    onChange={(e) => setWaveForm({ ...waveForm, enemy_spawn_rate_ms: parseInt(e.target.value) })}
                    helperText={`Every ${(waveForm.enemy_spawn_rate_ms / 1000).toFixed(1)}s`}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Max Enemy per Wave"
                    type="number"
                    value={waveForm.max_enemies}
                    onChange={(e) => setWaveForm({ ...waveForm, max_enemies: parseInt(e.target.value) })}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Boss Sequence */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Boss Sequence
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setBossDialogOpen(true)}
                  variant="outlined"
                >
                  Add Boss
                </Button>
              </Box>
              
              {bossSequence.length === 0 ? (
                <Alert severity="info">No bosses configured. Add bosses to create challenging encounters!</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Boss Name</TableCell>
                      <TableCell>Spawn Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Health</TableCell>
                      <TableCell>Damage</TableCell>
                      <TableCell>Speed</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bossSequence.map((boss, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveBoss(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveBoss(index, 'down')}
                              disabled={index === bossSequence.length - 1}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>{boss.boss_name}</TableCell>
                        <TableCell>{formatTime(boss.spawn_time_ms)}</TableCell>
                        <TableCell>
                          <Chip
                            label={boss.is_main_boss ? 'Main Boss' : 'Mini Boss'}
                            color={boss.is_main_boss ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${(boss.health_multiplier || 1.0)}x`}
                            size="small"
                            color={boss.health_multiplier > 1 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${(boss.damage_multiplier || 1.0)}x`}
                            size="small"
                            color={boss.damage_multiplier > 1 ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${(boss.speed_multiplier || 1.0)}x`}
                            size="small"
                            color={boss.speed_multiplier !== 1 ? 'info' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditBoss(index)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveBoss(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            {/* Enemy Pool */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Enemy Pool
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setEnemyDialogOpen(true)}
                  variant="outlined"
                >
                  Add Enemy
                </Button>
              </Box>
              
              {enemyPool.length === 0 ? (
                <Alert severity="info">No enemies configured. Add enemies to spawn in this wave!</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Enemy</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Time Window</TableCell>
                      <TableCell>Multipliers</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enemyPool.map((enemy, index) => (
                      <TableRow key={index}>
                        <TableCell>{enemy.enemy_name}</TableCell>
                        <TableCell>
                          <Chip label={enemy.enemy_type} size="small" />
                        </TableCell>
                        <TableCell>{enemy.spawn_weight}</TableCell>
                        <TableCell>
                          {formatTime(enemy.min_spawn_time_ms)} - {enemy.max_spawn_time_ms ? formatTime(enemy.max_spawn_time_ms) : 'End'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip label={`HP:${enemy.health_multiplier}x`} size="small" color={enemy.health_multiplier > 1 ? 'success' : 'default'} />
                            <Chip label={`SPD:${enemy.speed_multiplier}x`} size="small" />
                            <Chip label={`DMG:${enemy.damage_multiplier}x`} size="small" color={enemy.damage_multiplier > 1 ? 'error' : 'default'} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditEnemy(index)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveEnemy(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            {/* Powerup Pool */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Powerup Pool
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setPowerupDialogOpen(true)}
                  variant="outlined"
                >
                  Add Powerup
                </Button>
              </Box>
              
              {powerupPool.length === 0 ? (
                <Alert severity="info">No powerups configured. Add powerups that can drop in this wave!</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Powerup</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Rarity</TableCell>
                      <TableCell>Drop Chance</TableCell>
                      <TableCell>Time Window</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {powerupPool.map((powerup, index) => (
                      <TableRow key={index}>
                        <TableCell>{powerup.powerup_name}</TableCell>
                        <TableCell>
                          <Chip label={powerup.powerup_type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={powerup.rarity} 
                            size="small"
                            color={powerup.rarity === 'legendary' ? 'warning' : powerup.rarity === 'epic' ? 'secondary' : powerup.rarity === 'rare' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{powerup.drop_chance}%</TableCell>
                        <TableCell>
                          {formatTime(powerup.min_spawn_time_ms)} - {powerup.max_spawn_time_ms ? formatTime(powerup.max_spawn_time_ms) : 'End'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditPowerup(index)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePowerup(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            {/* Powerup & Difficulty Settings */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Powerup & Difficulty Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Powerup Spawn Interval (ms)"
                    type="number"
                    value={waveSettings.powerup_spawn_interval_ms}
                    onChange={(e) => setWaveSettings({
                      ...waveSettings,
                      powerup_spawn_interval_ms: parseInt(e.target.value)
                    })}
                    helperText={`Every ${(waveSettings.powerup_spawn_interval_ms / 1000).toFixed(1)}s`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Difficulty Multiplier"
                    type="number"
                    inputProps={{ step: 0.1, min: 0.5, max: 3.0 }}
                    value={waveSettings.difficulty_multiplier}
                    onChange={(e) => setWaveSettings({
                      ...waveSettings,
                      difficulty_multiplier: parseFloat(e.target.value)
                    })}
                    helperText="1.0 = normal, >1.0 = harder"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Save Button */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveWave}
                size="large"
              >
                Save Wave
              </Button>
              {selectedWave && (
                <Button
                  variant="outlined"
                  onClick={handleNewWave}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Boss Dialog */}
      <Dialog open={bossDialogOpen} onClose={() => { setBossDialogOpen(false); setEditingBossIndex(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBossIndex !== null ? 'Edit Boss' : 'Add Boss to Wave'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Boss</InputLabel>
              <Select
                value={selectedBoss}
                onChange={(e) => setSelectedBoss(e.target.value)}
                label="Select Boss"
              >
                {bosses.map((boss) => (
                  <MenuItem key={boss.id} value={boss.id}>
                    {boss.name} ({boss.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Spawn Time (ms)"
              type="number"
              value={bossSpawnTime}
              onChange={(e) => setBossSpawnTime(parseInt(e.target.value) || 0)}
              sx={{ mb: 2 }}
              helperText={`At ${formatTime(bossSpawnTime)}`}
              inputProps={{ min: 0, step: 1000 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Boss Type</InputLabel>
              <Select
                value={isMainBoss}
                onChange={(e) => setIsMainBoss(e.target.value)}
                label="Boss Type"
              >
                <MenuItem value={false}>Mini Boss (Supporting)</MenuItem>
                <MenuItem value={true}>Main Boss (Wave Boss)</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Stat Multipliers</Typography>
            
            <TextField
              fullWidth
              label="Health Multiplier"
              type="number"
              value={healthMultiplier}
              onChange={(e) => setHealthMultiplier(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              helperText="1.0 = normal, 2.0 = double health"
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
            
            <TextField
              fullWidth
              label="Damage Multiplier"
              type="number"
              value={damageMultiplier}
              onChange={(e) => setDamageMultiplier(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              helperText="1.0 = normal, 2.0 = double damage"
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
            
            <TextField
              fullWidth
              label="Speed Multiplier"
              type="number"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              helperText="1.0 = normal, 0.5 = half speed, 1.5 = faster"
              inputProps={{ min: 0.1, max: 3, step: 0.1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBossDialogOpen(false); setEditingBossIndex(null); }}>Cancel</Button>
          <Button onClick={handleAddBoss} variant="contained">
            {editingBossIndex !== null ? 'Update Boss' : 'Add Boss'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Enemy Dialog */}
      <Dialog open={enemyDialogOpen} onClose={() => { setEnemyDialogOpen(false); setEditingEnemyIndex(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEnemyIndex !== null ? 'Edit Enemy' : 'Add Enemy to Wave'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Enemy</InputLabel>
              <Select
                value={selectedEnemy}
                onChange={(e) => setSelectedEnemy(e.target.value)}
                label="Select Enemy"
              >
                {enemies.map((enemy) => (
                  <MenuItem key={enemy.id} value={enemy.id}>
                    {enemy.name} ({enemy.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Spawn Weight"
              type="number"
              value={enemySpawnWeight}
              onChange={(e) => setEnemySpawnWeight(parseInt(e.target.value) || 100)}
              sx={{ mb: 2 }}
              helperText="Higher weight = more likely to spawn (100 = normal)"
              inputProps={{ min: 1, step: 10 }}
            />
            
            <TextField
              fullWidth
              label="Min Spawn Time (ms)"
              type="number"
              value={enemyMinTime}
              onChange={(e) => setEnemyMinTime(parseInt(e.target.value) || 0)}
              sx={{ mb: 2 }}
              helperText={`Earliest at ${formatTime(enemyMinTime)}`}
              inputProps={{ min: 0, step: 1000 }}
            />
            
            <TextField
              fullWidth
              label="Max Spawn Time (ms)"
              type="number"
              value={enemyMaxTime || ''}
              onChange={(e) => setEnemyMaxTime(e.target.value ? parseInt(e.target.value) : null)}
              sx={{ mb: 2 }}
              helperText="Leave empty to spawn until wave ends"
              inputProps={{ min: 0, step: 1000 }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Stat Multipliers</Typography>
            
            <TextField
              fullWidth
              label="Health Multiplier"
              type="number"
              value={enemyHealthMult}
              onChange={(e) => setEnemyHealthMult(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
            
            <TextField
              fullWidth
              label="Speed Multiplier"
              type="number"
              value={enemySpeedMult}
              onChange={(e) => setEnemySpeedMult(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              inputProps={{ min: 0.1, max: 3, step: 0.1 }}
            />
            
            <TextField
              fullWidth
              label="Damage Multiplier"
              type="number"
              value={enemyDamageMult}
              onChange={(e) => setEnemyDamageMult(parseFloat(e.target.value) || 1.0)}
              sx={{ mb: 2 }}
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEnemyDialogOpen(false); setEditingEnemyIndex(null); }}>Cancel</Button>
          <Button onClick={handleAddEnemy} variant="contained">
            {editingEnemyIndex !== null ? 'Update Enemy' : 'Add Enemy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Powerup Dialog */}
      <Dialog open={powerupDialogOpen} onClose={() => { setPowerupDialogOpen(false); setEditingPowerupIndex(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPowerupIndex !== null ? 'Edit Powerup' : 'Add Powerup to Wave'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Powerup</InputLabel>
              <Select
                value={selectedPowerup}
                onChange={(e) => setSelectedPowerup(e.target.value)}
                label="Select Powerup"
              >
                {powerups.map((powerup) => (
                  <MenuItem key={powerup.id} value={powerup.id}>
                    {powerup.name} ({powerup.rarity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Drop Chance (%)"
              type="number"
              value={powerupDropChance}
              onChange={(e) => setPowerupDropChance(parseFloat(e.target.value) || 10.0)}
              sx={{ mb: 2 }}
              helperText="Percentage chance to drop (0-100%)"
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
            
            <TextField
              fullWidth
              label="Min Spawn Time (ms)"
              type="number"
              value={powerupMinTime}
              onChange={(e) => setPowerupMinTime(parseInt(e.target.value) || 0)}
              sx={{ mb: 2 }}
              helperText={`Available from ${formatTime(powerupMinTime)}`}
              inputProps={{ min: 0, step: 1000 }}
            />
            
            <TextField
              fullWidth
              label="Max Spawn Time (ms)"
              type="number"
              value={powerupMaxTime || ''}
              onChange={(e) => setPowerupMaxTime(e.target.value ? parseInt(e.target.value) : null)}
              sx={{ mb: 2 }}
              helperText="Leave empty to be available until wave ends"
              inputProps={{ min: 0, step: 1000 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPowerupDialogOpen(false); setEditingPowerupIndex(null); }}>Cancel</Button>
          <Button onClick={handleAddPowerup} variant="contained">
            {editingPowerupIndex !== null ? 'Update Powerup' : 'Add Powerup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
