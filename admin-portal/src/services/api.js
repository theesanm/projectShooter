import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    return data;
  },
  register: async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Weapons Service
export const weaponsService = {
  getAll: async () => {
    const { data } = await api.get('/weapons');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/weapons/${id}`);
    return data;
  },
  create: async (weaponData) => {
    const { data } = await api.post('/weapons', weaponData);
    return data;
  },
  update: async (id, weaponData) => {
    const { data } = await api.put(`/weapons/${id}`, weaponData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/weapons/${id}`);
    return data;
  },
};

// Waves Service
export const wavesService = {
  getAll: async () => {
    const { data } = await api.get('/waves');
    return data;
  },
  getByNumber: async (waveNumber) => {
    const { data } = await api.get(`/waves/${waveNumber}`);
    return data;
  },
  create: async (waveData) => {
    const { data } = await api.post('/waves', waveData);
    return data;
  },
  update: async (id, waveData) => {
    const { data } = await api.put(`/waves/${id}`, waveData);
    return data;
  },
};

// Bosses Service
export const bossesService = {
  getAll: async () => {
    const { data } = await api.get('/bosses');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/bosses/${id}`);
    return data;
  },
  create: async (bossData) => {
    const { data } = await api.post('/bosses', bossData);
    return data;
  },
  update: async (id, bossData) => {
    const { data } = await api.put(`/bosses/${id}`, bossData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/bosses/${id}`);
    return data;
  },
};

// Enemies Service
export const enemiesService = {
  getAll: async () => {
    const { data } = await api.get('/enemies');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/enemies/${id}`);
    return data;
  },
  create: async (enemyData) => {
    const { data } = await api.post('/enemies', enemyData);
    return data;
  },
  update: async (id, enemyData) => {
    const { data } = await api.put(`/enemies/${id}`, enemyData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/enemies/${id}`);
    return data;
  },
};

// Powerups Service
export const powerupsService = {
  getAll: async () => {
    const { data } = await api.get('/powerups');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/powerups/${id}`);
    return data;
  },
  create: async (powerupData) => {
    const { data } = await api.post('/powerups', powerupData);
    return data;
  },
  update: async (id, powerupData) => {
    const { data } = await api.put(`/powerups/${id}`, powerupData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/powerups/${id}`);
    return data;
  },
};

// Shop Service
export const shopService = {
  getItems: async () => {
    const { data } = await api.get('/shop/items');
    return data;
  },
  createItem: async (itemData) => {
    const { data } = await api.post('/shop/items', itemData);
    return data;
  },
};

export default api;
