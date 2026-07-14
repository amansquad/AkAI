import json

# Generate amharicLetters
amharic_rows = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ዐ', 'ከ', 'ኸ', 'ወ'],
  ['ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጘ', 'ጠ', 'ጨ', 'ጰ'],
  ['ፀ', 'ፈ', 'ፐ', 'ቨ', 'ሟ', 'ኟ', 'ዟ', 'ጟ', '፟'],
]

out = "  static const amharicLetters = [\n"
for i, row in enumerate(amharic_rows):
    out += "    [\n"
    if i == 2:
        out += "      KeyDef(kind: KeyKind.shift, flex: 1.3),\n"
    for char in row:
        out += f"      KeyDef(kind: KeyKind.char, primary: '{char}'),\n"
    if i == 2:
        out += "      KeyDef(kind: KeyKind.backspace, flex: 1.3),\n"
    if i == 3:
        out += "      KeyDef(kind: KeyKind.symbols, primary: '?123', flex: 1.2),\n"
        out += "      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\\''),\n"
        out += "      KeyDef(kind: KeyKind.space, primary: 'en / አማ', flex: 7.2),\n"
        out += "      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),\n"
        out += "      KeyDef(kind: KeyKind.enter, flex: 2.0),\n"
    elif i == 3:
        pass
    out += "    ],\n"
# Manually build the last row (space row) like QWERTY row 3. Wait, Amharic has 4 rows of letters, plus the space row!
# Let's fix that.
out = "  static const amharicLetters = [\n"
for i, row in enumerate(amharic_rows):
    out += "    [\n"
    if i == 3:
       out += "      KeyDef(kind: KeyKind.shift, flex: 1.3),\n"
    for char in row:
        out += f"      KeyDef(kind: KeyKind.char, primary: '{char}'),\n"
    if i == 3:
        out += "      KeyDef(kind: KeyKind.backspace, flex: 1.3),\n"
    out += "    ],\n"
    
out += "    [\n"
out += "      KeyDef(kind: KeyKind.symbols, primary: '?123', flex: 1.2),\n"
out += "      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\\''),\n"
out += "      KeyDef(kind: KeyKind.space, primary: 'en / አማ', flex: 7.2),\n"
out += "      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),\n"
out += "      KeyDef(kind: KeyKind.enter, flex: 2.0),\n"
out += "    ],\n  ];\n"

from textwrap import dedent

amharic_vowels_raw = {
  'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'],
  'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'],
  'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'],
  'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'],
  'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'],
  'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'],
  'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'],
  'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቋ'],
  'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'],
  'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'],
  'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'],
  'ኀ': ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ', 'ኋ'],
  'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'],
  'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'],
  'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
  'ዐ': ['ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ'],
  'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኳ'],
  'ኸ': ['ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ'],
  'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ', 'ዏ'],
  'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'],
  'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'],
  'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'],
  'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'],
  'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጓ'],
  'ጘ': ['ጘ', 'ጙ', 'ጚ', 'ጛ', 'ጜ', 'ጝ', 'ጞ'],
  'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'],
  'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'],
  'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'],
  'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
  'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'],
  'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'],
  'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
}

vowels_out = "  static const Map<String, List<String>> amharicVowels = {\n"
for key, vals in amharic_vowels_raw.items():
    formatted_vals = ", ".join(f"'{v}'" for v in vals)
    vowels_out += f"    '{key}': [{formatted_vals}],\n"
vowels_out += "  };\n"

final_out = out + "\n" + vowels_out

with open("c:/Users/HP/Documents/AkAI/flutter_app/lib/app/keyboard/keyboard_layout.dart", "r", encoding="utf-8") as f:
    orig = f.read()

orig = orig.replace("}\n", "}\n" + final_out) # Append before last brace? Wait, `KeyboardLayout` is a class.
idx = orig.rfind("}")
if idx != -1:
    orig = orig[:idx] + final_out + orig[idx:]

with open("c:/Users/HP/Documents/AkAI/flutter_app/lib/app/keyboard/keyboard_layout.dart", "w", encoding="utf-8") as f:
    f.write(orig)
