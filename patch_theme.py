import re

def update_colors(content):
    # We want to change the opacity of background, surface, surfaceVariant, key, keyPressed, keySecondary, keySecondaryPressed to 0xA0 for live themes.
    # We will find each block definition that has category: 'live' and modify inside that block.
    
    themes = content.split("static const akai")
    new_content = themes[0]
    
    for i in range(1, len(themes)):
        theme_block = themes[i]
        
        # Check if it has category: 'live' or isLive
        if "category: 'live'" in theme_block or "liveTheme:" in theme_block:
            # It's a live theme, we need to replace 0xFF with 0xA0 for specific keys
            def patch_color(match):
                key_name = match.group(1)
                color_val = match.group(2)
                return f"{key_name}: Color(0xA0{color_val}),"
            
            # The keys to match are background, surface, surfaceVariant, key, keyPressed, keySecondary, keySecondaryPressed
            keys_to_patch = ["background", "surface", "surfaceVariant", "key", "keyPressed", "keySecondary", "keySecondaryPressed"]
            
            for key_name in keys_to_patch:
                pattern = rf"({key_name}):\s*Color\(0xFF([0-9A-Fa-f]{{6}})\),"
                theme_block = re.sub(pattern, patch_color, theme_block)
                
        new_content += "static const akai" + theme_block
        
    return new_content

with open("c:/Users/HP/Documents/AkAI/flutter_app/lib/app/theme/app_theme.dart", "r", encoding="utf-8") as f:
    content = f.read()

new_content = update_colors(content)

with open("c:/Users/HP/Documents/AkAI/flutter_app/lib/app/theme/app_theme.dart", "w", encoding="utf-8") as f:
    f.write(new_content)
