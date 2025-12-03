# Image Requirements for Game Sprites

## Format Requirements
- **File Format**: PNG only (not JPEG/JPG)
- **Transparency**: RGBA (with alpha channel)
- **Background**: Transparent (no white or colored background)
- **Size**: 1024x1024 pixels (or 512x512, 256x256)

## How to Create with AI Tools (Nano Banana, etc.)

### Method 1: Request Transparent Background
When generating images, use these prompts:
- "green soldier character, transparent background, PNG format"
- "game sprite, isolated character, no background"
- Add keywords: "transparent", "alpha channel", "isolated"

### Method 2: Remove Background After Generation
If the AI generates with white background:

1. **Use Online Tools:**
   - remove.bg
   - Adobe Express Background Remover
   - Canva Background Remover

2. **Use Our Script (Already Set Up):**
   ```bash
   # Place your image in public/assets/shooters/
   # Then run:
   python3 -c "
   from PIL import Image
   img = Image.open('public/assets/shooters/YOUR_IMAGE.png').convert('RGBA')
   data = img.getdata()
   new_data = []
   for item in data:
       r, g, b = item[0], item[1], item[2]
       if r >= 250 and g >= 250 and b >= 250:
           new_data.append((255, 255, 255, 0))
       else:
           new_data.append((item[0], item[1], item[2], 255))
   img.putdata(new_data)
   img.save('public/assets/shooters/YOUR_IMAGE_transparent.png')
   "
   ```

## Current Image Setup

The game loads images from: `public/assets/shooters/`

Current player sprite path: `assets/shooters/greensoldier-transparent.png`

## To Add New Characters:

1. Generate PNG image (1024x1024 recommended)
2. Ensure transparent background
3. Place in `public/assets/shooters/`
4. Verify with: `file public/assets/shooters/FILENAME.png`
   - Should show: "PNG image data... 8-bit/color RGBA"
   - NOT: "JPEG" or "8-bit/color RGB"

## Testing Images:
```bash
# Check if image has transparency:
file public/assets/shooters/YOUR_IMAGE.png

# Should output:
# PNG image data, 1024 x 1024, 8-bit/color RGBA, non-interlaced
```

## Common Issues:
- ❌ JPEG files don't support transparency
- ❌ RGB PNG (no alpha channel) won't be transparent
- ✅ RGBA PNG with transparent pixels works perfectly
