# Akai Keyboard Theme Marketplace

This directory contains downloadable themes for the Akai Keyboard Flutter app.

## Structure

- `themes.json` - List of all available themes with metadata
- `*.json` - Individual theme definition files
- `*.png` - Background images for live themes (optional)

## Theme JSON Format

```json
{
  "name": "Theme Name",
  "emoji": "🎨",
  "category": "live|solid|faith|culture|football",
  "liveTheme": "aurora|ocean|fire|matrix|rainbow|null",
  "colors": {
    "background": 197394,
    "surface": 1119527,
    "surfaceVariant": 2039095,
    "key": 2039095,
    "keyPressed": 3684945,
    "keySecondary": 1119527,
    "keySecondaryPressed": 2039095,
    "keyAccent": 4294967295,
    "keyAccentPressed": 4293322219,
    "keyText": 4294375931,
    "keySecondaryText": 3502461915,
    "accent": 4294967295,
    "accentMuted": 3502461915,
    "glow": 4294967295
  }
}
```

## Themes Metadata Format (themes.json)

```json
[
  {
    "id": "theme-id",
    "name": "Theme Name",
    "emoji": "🎨",
    "description": "Short description",
    "category": "live",
    "isPremium": false,
    "size": 1024,
    "liveTheme": "aurora"
  }
]
```

## Color Values

All color values are integers representing ARGB colors. Convert hex colors using:
- Dart: `Color(0xFFRRGGBB).value`
- JavaScript: `parseInt('FFRRGGBB', 16)`

## Live Theme Types

- `aurora` - Northern lights animation
- `ocean` - Wave/water animation
- `fire` - Flame animation
- `matrix` - Matrix code rain
- `rainbow` - Rainbow gradient animation

## Adding New Themes

1. Create theme JSON file: `{theme-id}.json`
2. (Optional) Add image for live themes: `{theme-id}.png`
3. Add entry to `themes.json` with metadata
4. Deploy to server

## Server Endpoints

- `GET /themes/themes.json` - List of available themes
- `GET /themes/{theme-id}.json` - Theme definition
- `GET /themes/{theme-id}.png` - Theme background image (if live theme)

## Download URLs

Base URL: `https://ak-ai-opal.vercel.app/themes`

Example:
- Themes list: `https://ak-ai-opal.vercel.app/themes/themes.json`
- Fire theme: `https://ak-ai-opal.vercel.app/themes/fire.json`
- Matrix image: `https://ak-ai-opal.vercel.app/themes/matrix.png`
