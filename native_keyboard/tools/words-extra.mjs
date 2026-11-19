// Words the frequency list lacks or splits: contractions and everyday slang.
// Shared by gen-words.mjs and any patch that adds to the existing list.
export const contractions = ["i'm", "don't", "it's", "that's", "you're", "can't", "i'll", "didn't", "we're",
  "won't", "i've", "let's", "he's", "what's", "there's", "they're", "doesn't", "isn't", "she's",
  "wasn't", "you've", "i'd", "we'll", "you'll", "couldn't", "wouldn't", "haven't", "aren't",
  "we've", "shouldn't", "they'll", "who's", "here's", "you'd", "he'll", "she'll", "hasn't",
  "weren't", "they've", "we'd", "he'd", "she'd", "they'd", "ain't", "where's", "how's", "it'll"];

// Less common contractions, added after the main ones.
export const moreContractions = ["there're", "there'll", "there'd", "that'll", "that'd", "who'll", "who'd", "who're",
  "who've", "what'll", "what're", "what've", "what'd", "where'd", "where're", "when's", "why's", "why'd", "how'd",
  "how'll", "it'd", "it's", "this'll", "these're", "those're", "everyone's", "everybody's", "someone's", "nobody's",
  "something's", "nothing's", "anyone's", "let's", "y'all", "ma'am", "o'clock", "mustn't", "needn't", "hadn't",
  "mightn't", "shan't", "might've", "must've", "should've", "would've", "could've", "ain't", "gonna", "wanna",
  "gotta", "lemme", "gimme", "kinda", "sorta", "dunno", "tryna", "finna", "outta", "lotta"];

// Gen Z and texting slang. Inserted well down the list, so they are offered as completions
// but never take over auto-correct from an ordinary word.
export const slang = ["bruh", "bro", "lowkey", "highkey", "vibe", "vibes", "vibing", "slay", "slaying", "slayed",
  "bussin", "rizz", "sus", "fr", "ngl", "tbh", "imo", "idk", "omg", "lmao", "lmfao", "rofl", "bestie", "besties", "goat",
  "fam", "yeet", "simp", "stan", "salty", "flex", "flexing", "ghosted", "ghosting", "bet", "periodt", "delulu", "mid",
  "ick", "gyat", "sigma", "skibidi", "yapping", "cooked", "based", "cringe", "snatched", "drip", "savage", "shook",
  "ong", "istg", "irl", "fomo", "yolo", "smh", "brb", "ily", "wyd", "hmu", "fyi", "ootd", "bday", "cuz", "tho", "thx",
  "ty", "pls", "plz", "rn", "af", "asf", "deadass", "bffr", "oomf", "pov", "npc", "w", "l", "ratio", "touchgrass",
  "glowup", "situationship", "aura", "mewing", "gaslight", "gatekeep", "girlboss", "boujee", "chill", "cap", "nocap",
  "tea", "spill", "cheugy", "extra", "iykyk", "lit", "fire", "hits", "ate", "serve", "valid", "wig", "main", "era"];
