# Boss Image Upload System

## Overview
Bosses can now have images uploaded and linked to them. Images are stored in the `/public/assets/bosses/` directory and served by the backend.

## Using the Image Upload Feature

### In the Admin Portal:

1. **Navigate to Bosses** - Click "Bosses" in the sidebar menu
2. **Add/Edit a Boss** - Click "Add Boss" or edit an existing boss
3. **Upload Image Section**:
   - Click "Upload Image" to select an image from your computer
   - Supported formats: JPG, PNG, GIF, WebP
   - Maximum file size: 5MB
   - Preview is shown immediately after selection
   - Click "Change Image" to replace the current image
   - Click "Remove" to clear the image

### Image Storage:

- **Local Path**: `/public/assets/bosses/[filename]`
- **Database Path**: `/assets/bosses/[filename]`
- **Access URL**: `http://localhost:3001/assets/bosses/[filename]`

### Creating Boss Images:

#### Recommended Specifications:
- **Format**: PNG with transparency (recommended) or JPG
- **Size**: 512x512px to 1024x1024px
- **Style**: Match game aesthetic (pixelated, cartoon, realistic, etc.)
- **Background**: Transparent PNG preferred for overlay on game backgrounds

#### Image Preparation Tools:
- **GIMP** (Free) - https://www.gimp.org/
- **Photoshop** (Paid) - https://www.adobe.com/photoshop
- **Figma** (Free) - https://www.figma.com/
- **Aseprite** (Pixel Art) - https://www.aseprite.org/
- **AI Generation**: Midjourney, DALL-E, Stable Diffusion

#### Example Boss Image Creation:

1. Create a 1024x1024px canvas with transparent background
2. Design your boss character centered in the frame
3. Leave some padding around edges (50-100px)
4. Export as PNG with transparency enabled
5. Optimize file size (use TinyPNG.com if needed)
6. Upload through admin portal

### API Endpoints:

#### Upload Boss Image
```bash
POST /api/upload/boss-image
Content-Type: multipart/form-data

# Example using curl:
curl -X POST http://localhost:3001/api/upload/boss-image \
  -F "image=@/path/to/boss-image.png"

# Response:
{
  "success": true,
  "path": "/assets/bosses/demon-lord-1704483800000-123456789.png",
  "filename": "demon-lord-1704483800000-123456789.png",
  "size": 245678
}
```

#### List Boss Images
```bash
GET /api/upload/boss-images

# Response:
{
  "images": [
    {
      "filename": "demon-lord-1704483800000-123456789.png",
      "path": "/assets/bosses/demon-lord-1704483800000-123456789.png"
    }
  ]
}
```

#### Delete Boss Image
```bash
DELETE /api/upload/boss-image/:filename

# Example:
curl -X DELETE http://localhost:3001/api/upload/boss-image/demon-lord-1704483800000-123456789.png
```

### Using Images in Game:

Images stored with bosses are accessible via their path property:

```javascript
// In game code
const boss = await bossesService.getById(bossId);
const imageUrl = `http://localhost:3001${boss.image}`;

// Load in Phaser
this.load.image('boss_demon_lord', imageUrl);
```

### Troubleshooting:

**Image not showing after upload:**
- Check browser console for errors
- Verify image path in database starts with `/assets/bosses/`
- Ensure backend server is running
- Check file exists in `/public/assets/bosses/`

**Upload fails:**
- Check file size (must be < 5MB)
- Verify file format (JPG, PNG, GIF, WebP only)
- Check backend logs for errors
- Ensure multer is installed: `npm install multer`

**Image shows broken in preview:**
- Backend URL may be incorrect (should be localhost:3001)
- Check CORS settings if accessing from different domain
- Verify file permissions on server

### Directory Structure:
```
public/
  assets/
    bosses/
      demon-lord-1704483800000-123456789.png
      ice-giant-1704483900000-987654321.png
      shadow-assassin-1704484000000-456789123.png
```

### Security Notes:
- Only authenticated admin users can upload images
- File types are validated server-side
- File size is limited to 5MB
- Filenames are sanitized and made unique
- Images are served as static files (no code execution risk)
