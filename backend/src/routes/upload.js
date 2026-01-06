import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on upload type
    let uploadPath;
    const uploadType = req.path.split('/')[1]; // Gets 'boss-image', 'enemy-image', etc.
    
    if (uploadType === 'boss-image') {
      uploadPath = path.join(__dirname, '../../../public/assets/bosses');
    } else if (uploadType === 'enemy-image') {
      uploadPath = path.join(__dirname, '../../../public/assets/enemies');
    } else if (uploadType === 'powerup-image') {
      uploadPath = path.join(__dirname, '../../../public/assets/powerups');
    } else {
      uploadPath = path.join(__dirname, '../../../public/assets/bosses');
    }
    
    console.log('[Upload] Upload path:', uploadPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('[Upload] Created directory:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
});

/**
 * POST /api/upload/boss-image
 * Upload a boss image
 */
router.post('/boss-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload] Upload error:', err);
      return res.status(400).json({ 
        error: err.message || 'Failed to upload image' 
      });
    }
    
    try {
      console.log('[Upload] Boss image upload request received');
      console.log('[Upload] File:', req.file);
      
      if (!req.file) {
        console.log('[Upload] No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return the relative path that will be used in the database
      const imagePath = `/assets/bosses/${req.file.filename}`;
      
      console.log('[Upload] File uploaded successfully:', imagePath);
      
      res.json({
        success: true,
        path: imagePath,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('[Upload] Processing error:', error);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  });
});

/**
 * GET /api/upload/boss-images
 * List all boss images
 */
router.get('/boss-images', (req, res) => {
  try {
    const uploadPath = path.join(__dirname, '../../../../public/assets/bosses');
    
    if (!fs.existsSync(uploadPath)) {
      return res.json({ images: [] });
    }
    
    const files = fs.readdirSync(uploadPath);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `/assets/bosses/${file}`,
      }));
    
    res.json({ images });
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

/**
 * DELETE /api/upload/boss-image/:filename
 * Delete a boss image
 */
router.delete('/boss-image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../../public/assets/bosses', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image deleted' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * POST /api/upload/enemy-image
 * Upload an enemy image
 */
router.post('/enemy-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload] Upload error:', err);
      return res.status(400).json({ 
        error: err.message || 'Failed to upload image' 
      });
    }
    
    try {
      console.log('[Upload] Enemy image upload request received');
      console.log('[Upload] File:', req.file);
      
      if (!req.file) {
        console.log('[Upload] No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return the relative path that will be used in the database
      const imagePath = `/assets/enemies/${req.file.filename}`;
      
      console.log('[Upload] File uploaded successfully:', imagePath);
      
      res.json({
        success: true,
        path: imagePath,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('[Upload] Processing error:', error);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  });
});

/**
 * POST /api/upload/powerup-image
 * Upload a powerup image
 */
router.post('/powerup-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload] Upload error:', err);
      return res.status(400).json({ 
        error: err.message || 'Failed to upload image' 
      });
    }
    
    try {
      console.log('[Upload] Powerup image upload request received');
      console.log('[Upload] File:', req.file);
      
      if (!req.file) {
        console.log('[Upload] No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return the relative path that will be used in the database
      const imagePath = `/assets/powerups/${req.file.filename}`;
      
      console.log('[Upload] File uploaded successfully:', imagePath);
      
      res.json({
        success: true,
        path: imagePath,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('[Upload] Processing error:', error);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  });
});

export default router;
