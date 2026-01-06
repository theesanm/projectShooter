# 🎮 Kombat Game - Backend API & Admin Portal

## 🚀 Quick Start Guide

### ✅ What's Been Created

1. **Backend API** (Node.js + Express + PostgreSQL)
   - Location: `/backend/`
   - Port: `3001`
   - Status: ✅ Running

2. **Admin Portal** (React + Material-UI)
   - Location: `/admin-portal/`
   - Port: `5174`
   - Status: ✅ Running

3. **Database** (PostgreSQL)
   - Name: `fCombat`
   - Port: `5430`
   - Tables: 18 created
   - Data: Weapons & Skins synced ✅

---

## 🔐 Login Credentials

**Admin Portal:** http://localhost:5174

```
Username: admin
Password: admin123
```

⚠️ **Change password after first login!**

---

## 📡 API Endpoints

**Base URL:** http://localhost:3001/api

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Weapons
- `GET /api/weapons` - Get all weapons
- `GET /api/weapons/:id` - Get weapon by ID
- `POST /api/weapons` - Create weapon (admin)
- `PUT /api/weapons/:id` - Update weapon (admin)
- `DELETE /api/weapons/:id` - Delete weapon (admin)

### Waves
- `GET /api/waves` - Get all waves
- `GET /api/waves/:waveNumber` - Get wave config for game
- `POST /api/waves` - Create wave (admin)
- `PUT /api/waves/:id` - Update wave (admin)

### Shop
- `GET /api/shop/items` - Get shop items
- `POST /api/shop/purchase` - Purchase item (authenticated)
- `POST /api/shop/items` - Create shop item (admin)

---

## 📦 Current Data

### Weapons (8 total)
1. Basic Pistol (Tier 1) - Free
2. Shotgun (Tier 2) - 500 coins
3. Assault Rifle (Tier 3) - 1500 coins
4. Sniper Rifle (Tier 4) - 3000 coins
5. Minigun (Tier 5) - 5000 coins
6. Laser Cannon (Tier 6) - 8000 coins
7. Rocket Launcher (Tier 7) - 12000 coins
8. Plasma Cannon (Tier 8) - 15000 coins

### Skins (10 total)
1. Default Hero (Common) - Free
2. Elite Warrior (Rare) - 800 coins
3. Cyber Ninja (Epic) - 2000 coins
4. Dragon Knight (Legendary) - 5000 coins
5. Shadow Assassin (Epic) - 3500 coins
6. Cosmic Guardian (Legendary) - 8000 coins
7. Phoenix Rising (Mythic) - 15000 coins
8. Void Walker (Mythic) - 20000 coins
9. Mechanized Titan (Legendary) - 6000 coins
10. Arcane Wizard (Epic) - 4500 coins

### Shop Items: 16 items ready for purchase

---

## 🛠️ Commands

### Backend
```bash
cd backend

# Start development server
npm run dev

# Sync templates from JSON
npm run sync-templates

# Create admin user
node scripts/createAdmin.js

# Start production
npm start
```

### Admin Portal
```bash
cd admin-portal

# Start development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎯 Testing the Setup

### 1. Test API Health
```bash
curl http://localhost:3001/health
```

### 2. Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 3. Test Get Weapons
```bash
curl http://localhost:3001/api/weapons
```

### 4. Access Admin Portal
Open browser: http://localhost:5174
Login with: `admin` / `admin123`

---

## 📂 Project Structure

```
kombat/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # PostgreSQL connection
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication
│   │   └── routes/
│   │       ├── auth.js        # Auth endpoints
│   │       ├── weapons.js     # Weapons CRUD
│   │       ├── waves.js       # Waves CRUD
│   │       └── shop.js        # Shop endpoints
│   ├── scripts/
│   │   ├── syncTemplates.js   # Import from JSON
│   │   └── createAdmin.js     # Create admin user
│   ├── .env                   # Environment config
│   ├── package.json
│   └── server.js              # Entry point
│
├── admin-portal/              # Admin Web UI
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx     # App layout
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Weapons.jsx
│   │   │   ├── Skins.jsx
│   │   │   ├── Waves.jsx
│   │   │   └── Shop.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── config/                    # Template files
│   ├── weapons/
│   │   └── weaponTemplates.json
│   └── skins/
│       └── skinTemplates.json
│
└── database/
    └── setup.sql              # Database schema
```

---

## 🔄 Template Sync Workflow

1. **Edit Templates** in `config/weapons/` or `config/skins/`
2. **Sync to Database:**
   ```bash
   cd backend
   npm run sync-templates
   ```
3. **Changes are live** in API and Admin Portal

---

## 🎨 Admin Portal Features

### Current Features ✅
- Dashboard with stats overview
- Weapons management (view all weapons)
- Shop management (view all shop items)
- User authentication with JWT
- Responsive design (mobile-friendly)
- Dark theme

### Coming Soon 🚧
- Weapon editor with form
- Skin gallery and editor
- Wave configuration with boss sequence builder
- Economy dashboard with analytics
- User management
- Balance reports and charts

---

## 🔐 Security Notes

1. **JWT Secret:** Change `JWT_SECRET` in `backend/.env` for production
2. **Database Password:** Update database password for production
3. **CORS:** Configure `ALLOWED_ORIGINS` for production domains
4. **Admin Password:** Change default admin password immediately
5. **Rate Limiting:** Configured at 100 requests per 15 minutes

---

## 🚀 Next Steps

1. **Access Admin Portal:** http://localhost:5174
2. **Login** with admin credentials
3. **View Weapons** - See all 8 weapons loaded
4. **View Shop** - See 16 items ready for sale
5. **Create Waves** - Set up your first wave configuration
6. **Test API** - Use curl or Postman to test endpoints

---

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5430
DB_NAME=fCombat
DB_USER=postgres
DB_PASSWORD=200Sti007@
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Admin Portal (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
docker ps

# Check if port 3001 is available
lsof -i :3001

# Check database connection
cd backend
node -e "import('./src/config/database.js').then(m => m.default.query('SELECT NOW()'))"
```

### Admin Portal won't start
```bash
# Check if port 5174 is available
lsof -i :5174

# Reinstall dependencies
cd admin-portal
rm -rf node_modules package-lock.json
npm install
```

### Can't login
```bash
# Recreate admin user
cd backend
node scripts/createAdmin.js
```

---

## 📊 Database Stats

- **Users:** 1 (admin)
- **Weapons:** 8
- **Skins:** 10
- **Shop Items:** 16
- **Waves:** 0 (create via admin portal)
- **Total Tables:** 18

---

## 🎮 Integration with Game

To integrate with your Phaser game:

1. **Update APIService.js** in your game:
   ```javascript
   const API_URL = 'http://localhost:3001/api';
   
   async getWeapons() {
     const response = await fetch(`${API_URL}/weapons`);
     return response.json();
   }
   ```

2. **Load player loadout:**
   ```javascript
   async getPlayerLoadout(token) {
     const response = await fetch(`${API_URL}/loadout`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   }
   ```

3. **Purchase items:**
   ```javascript
   async purchaseItem(token, shopItemId) {
     const response = await fetch(`${API_URL}/shop/purchase`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ shop_item_id: shopItemId })
     });
     return response.json();
   }
   ```

---

## ✅ Checklist

- [x] PostgreSQL database created
- [x] 18 tables created with relationships
- [x] Backend API server running
- [x] Admin portal running
- [x] Weapons synced (8 weapons)
- [x] Skins synced (10 skins)
- [x] Shop items created (16 items)
- [x] Admin user created
- [x] JWT authentication working
- [ ] Create your first wave
- [ ] Test shop purchases
- [ ] Configure currency drops
- [ ] Set up balance settings

---

**🎉 Congratulations! Your admin system is ready!**

Access the admin portal at: **http://localhost:5174**
