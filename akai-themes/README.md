# Akai Keyboard Themes

Downloadable themes for the Akai Keyboard app.

## How to Use

1. Create a GitHub repo named `akai-themes`
2. Upload all files from this folder
3. Replace `YOUR_USERNAME` in `themes.json` with your GitHub username
4. In the Akai Keyboard app, go to Settings → Theme Marketplace

## Available Themes

| Theme | Emoji | Premium |
|-------|-------|---------|
| Sunset | 🌅 | Free |
| Forest | 🌿 | Free |
| Rose | 🌸 | Free |
| Solar | ☀️ | Premium |
| Aurora | 🌌 | Premium |
| Cyberpunk | 🤖 | Premium |
| Neon Pulse | 💜 | Premium |
| Matrix | 🔢 | Premium |
| Rainbow | 🌈 | Premium |
| Fire | 🔥 | Premium |
| Lava | 🌋 | Premium |
| Waterfall | 💧 | Premium |
| Galaxy | 🌌 | Premium |
| Autumn | 🍂 | Premium |

## Adding New Themes

1. Create a new JSON file in `themes/` folder
2. Follow the format in existing theme files
3. Add entry to `themes.json` manifest
4. Commit and push to GitHub

## Theme JSON Format

```json
{
  "id": "theme-id",
  "name": "Theme Name",
  "emoji": "🎨",
  "description": "Theme description",
  "isPremium": false,
  "colors": {
    "background": 4278190080,
    "surface": 4278193664,
    ...
  }
}
```
