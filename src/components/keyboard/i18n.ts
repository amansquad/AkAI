/**
 * The words of the app itself (settings, labels, buttons) in other languages.
 *
 * This is separate from the typing language (the 🌐 key), which only changes
 * what the keys type. Strings are keyed by their English text, so the code
 * stays readable and anything not translated yet simply stays in English.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';

export type UiLang = 'en' | 'am' | 'ti' | 'om' | 'so' | 'ar';

export const UI_LANGUAGES: readonly { id: UiLang; native: string; english: string; rtl?: boolean }[] = [
  { id: 'en', native: 'English', english: 'English' },
  { id: 'am', native: 'አማርኛ', english: 'Amharic' },
  { id: 'ti', native: 'ትግርኛ', english: 'Tigrinya' },
  { id: 'om', native: 'Afaan Oromoo', english: 'Oromo' },
  { id: 'so', native: 'Soomaali', english: 'Somali' },
  { id: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
];

const STORAGE_KEY = 'akai-ui-lang';

// [am, ti, om, so, ar]
type Row = readonly [string, string, string, string, string];
const ORDER: UiLang[] = ['am', 'ti', 'om', 'so', 'ar'];

const STRINGS: Record<string, Row> = {
  'Keyboard Settings': ['የኪቦርድ ቅንብሮች', 'ናይ ኪቦርድ ቅጥዕታት', "Qindaa'inoota Kiiboordii", 'Dejinta Kiiboodhka', 'إعدادات لوحة المفاتيح'],
  'Search settings': ['ቅንብሮችን ፈልግ', 'ቅጥዕታት ድለ', "Qindaa'ina barbaadi", 'Raadi dejinta', 'ابحث في الإعدادات'],
  'Clear search': ['ፍለጋን አጥፋ', 'ድላይ ሰርዝ', 'Barbaacha haqi', 'Tir raadinta', 'مسح البحث'],
  'Language': ['ቋንቋ', 'ቋንቋ', 'Afaan', 'Luqadda', 'اللغة'],
  'App language': ['የመተግበሪያ ቋንቋ', 'ቋንቋ ኣፕሊኬሽን', 'Afaan appii', 'Luqadda app-ka', 'لغة التطبيق'],
  'The words in menus and settings. The 🌐 key still switches what you type.': [
    'በምናሌዎችና በቅንብሮች ውስጥ ያሉ ቃላት። የ🌐 ቁልፍ አሁንም የሚተይቡትን ቋንቋ ይቀይራል።',
    'ኣብ ዝርዝራትን ቅጥዕታትን ዘለዉ ቃላት። ናይ 🌐 መፍትሕ ግና ዝጽሕፍዎ ቋንቋ ይቕይር።',
    "Jechoota baafata fi qindaa'inoota keessa jiran. Furtuun 🌐 amma iyyuu afaan barreessitan jijjiira.",
    'Erayada ku jira liisaska iyo dejinta. Furaha 🌐 weli wuxuu beddelaa luqadda aad qorto.',
    'الكلمات في القوائم والإعدادات. لا يزال مفتاح 🌐 يبدّل لغة الكتابة.',
  ],
  'Look': ['መልክ', 'መልክዕ', 'Bifa', 'Muuqaalka', 'المظهر'],
  'Theme': ['ገጽታ', 'ገጽታ', 'Teemii', 'Qaabka', 'السمة'],
  'Colours and live wallpapers': ['ቀለማትና ሕያው ልጣፎች', 'ሕብርታትን ህያው ዕላፍታትን', 'Halluuwwan fi fuula duubaa jiraataa', 'Midabyo iyo gadaal-muuqaal nool', 'الألوان والخلفيات الحية'],
  'Change': ['ቀይር', 'ቀይር', 'Jijjiiri', 'Beddel', 'تغيير'],
  'Key-press animation': ['የቁልፍ ንክኪ እነማ', 'ናይ መፍትሕ ንክኪ ኣኒሜሽን', 'Animeeshiinii tuqaa furtuu', 'Animation-ka riixista furaha', 'حركة الضغط على المفاتيح'],
  'Glow and bounce when a key is tapped': ['ቁልፍ ሲነካ ያበራል ይወዛወዛል', 'መፍትሕ ክትትንክፍ ከሎ የብርህ ይንቀጥቀጥ', 'Furtuun yeroo tuqamu ni ibsa, ni utaala', 'Furuhu marka la taabto wuu iftiimaa wuuna booddaa', 'توهّج وارتداد عند لمس المفتاح'],
  'Key style': ['የቁልፍ ዘይቤ', 'ዓይነት መፍትሕ', 'Akaakuu furtuu', 'Qaabka furayaasha', 'شكل المفاتيح'],
  'Corner roundness': ['የማዕዘን ክብነት', 'ዙርያ ኩርናዕ', 'Gara marsaa golee', 'Wareegga geesaha', 'استدارة الزوايا'],
  '0 is square; higher is rounder': ['0 አራት ማዕዘን ነው፤ ከፍ ሲል ክብ ይሆናል', '0 ሬብዓዊ እዩ፤ ዝወሰኸ ዝዙር', '0 xiqqoo lafaa; gadi-aanaan marsaadha', '0 waa afar-geesood; sare waa wareegsan yahay', '0 مربع؛ كلما زاد صار أكثر استدارة'],
  'Label weight': ['የፊደል ክብደት', 'ክብደት ፊደል', 'Ulfaatina mallattoo', 'Culeyska xarfaha', 'سماكة الخط'],
  '100 thin, 500 medium, 900 black': ['100 ቀጭን፣ 500 መካከለኛ፣ 900 ወፍራም', '100 ቀጢን፣ 500 ማእከላይ፣ 900 ደፍራም', '100 dhiphaa, 500 giddu-galeessa, 900 jabaa', '100 khafiif, 500 dhexdhexaad, 900 cufan', '100 رفيع، 500 متوسط، 900 عريض'],
  'Key borders': ['የቁልፍ ጠርዞች', 'ደረት መፍትሕ', 'Daangaa furtuu', 'Xuduudaha furayaasha', 'حدود المفاتيح'],
  'Outline on each letter key': ['በእያንዳንዱ የፊደል ቁልፍ ላይ ዙሪያ መስመር', 'ኣብ ነፍሲ ወከፍ ናይ ፊደል መፍትሕ ዙርያ መስመር', 'Sararri naannoo furtuu qubee hundaa', 'Xariiq ku wareegsan fure kasta', 'إطار حول كل مفتاح حرف'],
  'Keyboard layout': ['የኪቦርድ አቀማመጥ', 'ኣቀማምጣ ኪቦርድ', 'Qindoomina kiiboordii', 'Qaabeynta kiiboodhka', 'تخطيط لوحة المفاتيح'],
  'English layout': ['የእንግሊዝኛ አቀማመጥ', 'ኣቀማምጣ እንግሊዝኛ', 'Qindoomina Ingliffaa', 'Qaabeynta Ingiriisiga', 'تخطيط الإنجليزية'],
  'Applies only to the English keyboard': ['ለእንግሊዝኛ ኪቦርድ ብቻ ይሠራል', 'ንናይ እንግሊዝኛ ኪቦርድ ጥራይ ይሰርሕ', 'Kiiboordii Ingliffaa qofaaf hojjeta', 'Waxay khusaysaa kiiboodhka Ingiriisiga oo kaliya', 'ينطبق على لوحة الإنجليزية فقط'],
  "Applies to the Ge'ez fidel keyboard": ['ለግዕዝ ፊደል ኪቦርድ ይሠራል', 'ንናይ ግዕዝ ፊደል ኪቦርድ ይሰርሕ', "Kiiboordii qubee Ge'ez irratti hojjeta", "Waxay khusaysaa kiiboodhka xarafka Ge'ez", 'ينطبق على لوحة حروف الجعز'],
  'Traditional': ['ባህላዊ', 'ባህላዊ', 'Aadaa', 'Dhaqameed', 'تقليدي'],
  'Frequency': ['በአጠቃቀም', 'ብኣጠቓቕማ', 'Baay\'ina fayyadamaa', 'Isticmaal badan', 'حسب التكرار'],
  'Phonetic': ['ድምጻዊ', 'ድምጻዊ', 'Sagalee', 'Codka', 'صوتي'],
  "Traditional: Ge'ez alphabetical order · Frequency: most-used letters first · Phonetic: QWERTY-mapped sounds": [
    'ባህላዊ፦ የግዕዝ ፊደል ተራ · በአጠቃቀም፦ ብዙ ጥቅም ላይ የሚውሉ መጀመሪያ · ድምጻዊ፦ በQWERTY የተመደቡ ድምጾች',
    'ባህላዊ፦ ሰዓብ ፊደል ግዕዝ · ብኣጠቓቕማ፦ ብዙሕ ዝጥቀሙሉ መጀመርታ · ድምጻዊ፦ ብQWERTY ዝተመደቡ ድምጺታት',
    "Aadaa: tartiiba qubee Ge'ez · Baay'ina fayyadamaa: qubeewwan baay'ee fayyadaman duraan · Sagalee: sagaleewwan QWERTY'n kaa'aman",
    "Dhaqameed: kala horreynta xarfaha Ge'ez · Isticmaal badan: xarfaha ugu badan ayaa horreeya · Codka: codad loo qoondeeyay QWERTY",
    'تقليدي: ترتيب حروف الجعز · التكرار: الأكثر استخدامًا أولًا · صوتي: أصوات مرتبطة بـ QWERTY',
  ],
  'Top bar': ['የላይኛው አሞሌ', 'ላዕለዋይ ባር', 'Gabatee gubbaa', 'Barka sare', 'الشريط العلوي'],
  'Suggestion bar': ['የጥቆማ አሞሌ', 'ባር ጥቆማ', 'Gabatee yaada', 'Barka soo jeedinta', 'شريط الاقتراحات'],
  'Word suggestions above the keys': ['ከቁልፎች በላይ የቃል ጥቆማዎች', 'ልዕሊ መፍትሕ ዝርከቡ ጥቆማ ቃላት', 'Yaada jechootaa furtuuwwan gubbaa', 'Soo jeedinta erayada furayaasha ka sarreeya', 'اقتراحات كلمات فوق المفاتيح'],
  'Word of the Day': ['የዕለቱ ቃል', 'ቃል ናይታ መዓልቲ', 'Jecha Guyyaa', 'Eraygii Maalinta', 'كلمة اليوم'],
  'Shown in the bar before you start typing': ['መተየብ ከመጀመርዎ በፊት በአሞሌው ውስጥ ይታያል', 'ክሳብ ዝጽሕፍ ኣብ ባር ይርአ', 'Osoo hin barreessin gabatee keessatti mul\'ata', 'Waxaa lagu muujiyaa barka ka hor intaadan qorin', 'يظهر في الشريط قبل أن تبدأ الكتابة'],
  'Toolbar labels': ['የመሣሪያ አሞሌ ስሞች', 'ሽም መሳርሒ ባር', 'Maqaawwan gabatee meeshaalee', 'Calaamadaha barka qalabka', 'تسميات شريط الأدوات'],
  'Active only': ['ንቁውን ብቻ', 'ንጡፍ ጥራይ', 'Kan hojii irra jiru qofa', 'Kan shidan oo kaliya', 'النشط فقط'],
  'All labels': ['ሁሉንም ስሞች', 'ኩሉ ሽምታት', 'Maqaawwan hunda', 'Dhammaan calaamadaha', 'كل التسميات'],
  'Icons only': ['ምልክቶች ብቻ', 'ምልክታት ጥራይ', 'Mallattoolee qofa', 'Astaamaha oo kaliya', 'الأيقونات فقط'],
  'Toolbar buttons': ['የመሣሪያ አሞሌ አዝራሮች', 'ዓቕንቲ መሳርሒ ባር', 'Butoonii gabatee meeshaalee', 'Badhamada barka qalabka', 'أزرار شريط الأدوات'],
  'Emoji & stickers': ['ሺሸንፎችና ተለጣፊዎች', 'ኢሞጂን ስቲከርን', 'Emojii fi stikeroota', 'Emoji iyo stickers', 'الرموز التعبيرية والملصقات'],
  'GIFs': ['GIFs', 'GIFs', 'GIFs', 'GIFs', 'صور GIF'],
  'Clipboard': ['ቅንጥብ ሰሌዳ', 'ክሊፕቦርድ', 'Kilippiboordii', 'Clipboard-ka', 'الحافظة'],
  'AI translate': ['AI ትርጉም', 'AI ትርጉም', 'Hiikkaa AI', 'Turjumaadda AI', 'ترجمة AI'],
  'Handwriting': ['የእጅ ጽሕፈት', 'ናይ ኢድ ጽሑፍ', 'Barreeffama harkaa', 'Far-gacmeed', 'الكتابة اليدوية'],
  'Theme button': ['የገጽታ አዝራር', 'ዓቐንቲ ገጽታ', 'Butoonii teemii', 'Badhanka qaabka', 'زر السمة'],
  'Themes stay available from Look, above': ['ገጽታዎች ከላይ ባለው መልክ ውስጥ ይገኛሉ', 'ገጽታታት ካብ ላዕሊ መልክዕ ይርከቡ', 'Teemiiwwan gubbaa Bifa keessaa argamu', 'Qaababka waxaa laga helaa Muuqaalka, kor', 'تبقى السمات متاحة من «المظهر» أعلاه'],
  'Keys': ['ቁልፎች', 'መፍትሕታት', 'Furtuuwwan', 'Furayaasha', 'المفاتيح'],
  'Key height': ['የቁልፍ ቁመት', 'ቁመት መፍትሕ', 'Dheerina furtuu', 'Dhererka furaha', 'ارتفاع المفتاح'],
  'Height of each row of keys. The whole keyboard grows with it': ['የእያንዳንዱ ረድፍ ቁመት። መላው ኪቦርድ አብሮ ይለወጣል', 'ቁመት ነፍሲ ወከፍ ረድፊ። ኩሉ ኪቦርድ ምስኡ የዓቢ', 'Dheerina sarara hundaa. Kiiboordiin guutuun wajjin guddata', 'Dhererka saf kasta. Kiiboodhka oo dhan ayaa la weynaadaa', 'ارتفاع كل صف. تكبر لوحة المفاتيح كلها معه'],
  'Space between keys': ['በቁልፎች መካከል ክፍተት', 'ክፍተት ማእከል መፍትሕታት', 'Iddoo furtuuwwan gidduu', 'Booska u dhexeeya furayaasha', 'المسافة بين المفاتيح'],
  'The gap around every key': ['በእያንዳንዱ ቁልፍ ዙሪያ ያለ ክፍተት', 'ኣብ ዙርያ ነፍሲ ወከፍ መፍትሕ ዘሎ ክፍተት', 'Iddoo furtuu hundaa naannoo', 'Farqiga ku wareegsan fure kasta', 'الفراغ حول كل مفتاح'],
  'Key label size': ['የቁልፍ ፊደል መጠን', 'ዓቐን ፊደል መፍትሕ', 'Guddina qubee furtuu', 'Cabbirka xarfaha furayaasha', 'حجم خط المفاتيح'],
  'Size of the letters on the keys': ['በቁልፎች ላይ ያሉ ፊደላት መጠን', 'ኣብ መፍትሕታት ዘለዉ ፊደላት ዓቐን', 'Guddina qubeewwan furtuu irra jiran', 'Cabbirka xarfaha ku yaal furayaasha', 'حجم الحروف على المفاتيح'],
  'Number row': ['የቁጥር ረድፍ', 'ረድፊ ቍጽሪ', 'Sarara lakkoofsaa', 'Safka tirooyinka', 'صف الأرقام'],
  'A row of numbers above the letters': ['ከፊደላት በላይ የቁጥሮች ረድፍ', 'ልዕሊ ፊደላት ረድፊ ቍጽርታት', 'Sarara lakkoofsaa qubeewwan gubbaa', 'Saf tirooyin ah oo xarfaha ka sarreeya', 'صف أرقام فوق الحروف'],
  'Symbol hints': ['የምልክት ፍንጮች', 'ርሕቀት ምልክታት', 'Mallattoo yaadachiisaa', 'Tilmaamaha calaamadaha', 'تلميحات الرموز'],
  'Small symbols in the corner of letter keys': ['በፊደል ቁልፎች ጥግ ያሉ ትናንሽ ምልክቶች', 'ኣብ ኩርናዕ ፊደል መፍትሕታት ንኣሽቱ ምልክታት', 'Mallattoolee xixiqqaa golee furtuu qubee irra', 'Calaamado yaryar oo ku yaal geeska furayaasha', 'رموز صغيرة في زاوية مفاتيح الحروف'],
  'Microphone button': ['የማይክሮፎን አዝራር', 'ዓቐንቲ ማይክሮፎን', 'Butoonii maayikirofoonii', 'Badhanka makarafoonka', 'زر الميكروفون'],
  'Sits in the toolbar before Settings. A long press of space also starts voice typing': [
    'ከቅንብሮች በፊት በመሣሪያ አሞሌ ውስጥ ይቀመጣል። ክፍት ቦታን ረጅም መጫንም የድምጽ ትየባ ይጀምራል',
    'ቅድሚ ቅጥዕታት ኣብ መሳርሒ ባር ይቕመጥ። ንነዊሕ ምጥዋይ ስፔስ ድማ ብድምጽ ምጽሓፍ የጅምር',
    "Dura qindaa'inaa gabatee meeshaaleetti argama. Space yeroo dheeraa tuquunis sagaleen barreessuu jalqaba",
    'Wuxuu yaalaa barka qalabka ka hor Dejinta. Cabbaar dheer ku hay space waxay bilaabaysaa qorista codka',
    'يوجد في شريط الأدوات قبل الإعدادات. الضغط المطوّل على المسافة يبدأ الكتابة الصوتية',
  ],
  'Cursor row': ['የጠቋሚ ረድፍ', 'ረድፊ ጠቋሚ', 'Sarara agarsiisaa', 'Safka tilmaamaha', 'صف المؤشر'],
  'Arrow keys above the bottom row for precise cursor movement': ['ጠቋሚን በትክክል ለማንቀሳቀስ ከታችኛው ረድፍ በላይ የቀስት ቁልፎች', 'ጠቋሚ ብትኽክል ንምንቅስቓስ ልዕሊ ታሕተዋይ ረድፊ ናይ ቀስቲ መፍትሕታት', 'Furtuuwwan xiyyaa sarara gadii gubbaa deemsa agarsiisaa sirrii argachuuf', 'Furayaasha fallaadhaha oo ka sarreeya safka hoose si loo dhaqaajiyo tilmaame', 'مفاتيح الأسهم فوق الصف السفلي لتحريك المؤشر بدقة'],
  'One-handed mode': ['በአንድ እጅ ሁነታ', 'ሞድ ብሓንቲ ኢድ', 'Haala harka tokkoo', 'Habka hal gacan', 'وضع اليد الواحدة'],
  'Shrink the keyboard towards one thumb': ['ኪቦርዱን ወደ አንድ አውራ ጣት አሳንስ', 'ኪቦርድ ናብ ሓንቲ ኣጻብዕ ኣንክስ', 'Kiiboordii gara quba tokkootti xiqqeessi', 'Kiiboodhka ugu yaree xagga suulka', 'صغّر لوحة المفاتيح نحو إبهام واحد'],
  'Left': ['ግራ', 'ጸጋም', 'Bitaa', 'Bidix', 'يسار'],
  'Off': ['ጠፍቷል', 'ጠፊኡ', 'Cufaa', 'Dansan', 'إيقاف'],
  'Right': ['ቀኝ', 'የማን', 'Mirga', 'Midig', 'يمين'],
  'One-handed width': ['በአንድ እጅ ስፋት', 'ስፍሓት ብሓንቲ ኢድ', 'Bal\'ina harka tokkoo', 'Ballaadhka hal gacan', 'عرض اليد الواحدة'],
  'How much of the screen width the keyboard takes': ['ኪቦርዱ ከማያው ስፋት ምን ያህል ይይዛል', 'ኪቦርድ ክንደይ ካብ ስፍሓት ስክሪን ይሕዝ', 'Kiiboordiin bal\'ina iskiriinii hagam qabata', 'Inta kiiboodhku ka qaato ballaadhka shaashadda', 'مقدار عرض الشاشة الذي تشغله لوحة المفاتيح'],
  'Typing': ['መተየብ', 'ምጽሓፍ', 'Barreessuu', 'Qorista', 'الكتابة'],
  'Auto-capitalise': ['ራስ-ሰር ትልቅ ፊደል', 'ባዕሉ ዓቢ ፊደል', 'Of-eegannoo qubee guddaa', 'Xarafka weyn si toos ah', 'الأحرف الكبيرة تلقائيًا'],
  'Capital letter at the start of a sentence': ['በዓረፍተ ነገር መጀመሪያ ትልቅ ፊደል', 'ኣብ መጀመርታ ሓረግ ዓቢ ፊደል', 'Qubee guddaa jalqaba hima', 'Xarafka weyn bilowga jumladda', 'حرف كبير في بداية الجملة'],
  'Double-space full stop': ['ሁለት ክፍት ቦታ = ነጥብ', 'ክልተ ስፔስ = ነጥቢ', 'Space lama = tuqaa', 'Laba space = dhibic', 'مسافتان = نقطة'],
  'Tap space twice to type ". "': ['ክፍት ቦታን ሁለት ጊዜ በመንካት ". " ይተይቡ', 'ስፔስ ክልተ ጊዜ ብምትንካፍ ". " ጽሓፍ', 'Space altokkoo tuquun ". " barreessa', 'Laba jeer taabo space si aad u qorto ". "', 'اضغط المسافة مرتين لكتابة ". "'],
  'Space after punctuation': ['ከሥርዓተ ነጥብ በኋላ ክፍት ቦታ', 'ድሕሪ ሥርዓተ ነጥቢ ስፔስ', 'Space mallattoo dubbiin booda', 'Space ka dib calaamadaha', 'مسافة بعد علامات الترقيم'],
  'After . ! ? ; :': ['ከ . ! ? ; : በኋላ', 'ድሕሪ . ! ? ; :', 'Booda . ! ? ; :', 'Kadib . ! ? ; :', 'بعد . ! ? ; :'],
  'Spacebar cursor control': ['በክፍት ቦታ ቁልፍ ጠቋሚ መቆጣጠር', 'ብስፔስ ጠቋሚ ምቊጽጻር', 'To\'annoo agarsiisaa space-n', 'Xakamaynta tilmaamaha space-ka', 'التحكم بالمؤشر عبر المسافة'],
  'Swipe left/right on the spacebar to move the cursor': ['ጠቋሚን ለማንቀሳቀስ በክፍት ቦታ ቁልፍ ላይ ወደ ግራ/ቀኝ ጎትት', 'ጠቋሚ ንምንቅስቓስ ኣብ ስፔስ ናብ ጸጋም/የማን ሳሓብ', 'Agarsiisaa sochoosuuf space irratti bitaa/mirga harkisi', 'Ku jiid bidix/midig space-ka si aad u dhaqaajiso tilmaamaha', 'اسحب يمينًا/يسارًا على المسافة لتحريك المؤشر'],
  'Long-press popup': ['ረጅም ጭነት ብቅ-ባይ', 'ናይ ነዊሕ ምጥዋይ ፖፕኣፕ', 'Fuula bahu tuqaa dheeraa', 'Daaqad sii-booda cadaadis dheer', 'نافذة الضغط المطوّل'],
  'Hold a key for accents, or for every vowel form of a fidel': ['ለአክሰንት ወይም ለፊደል ሁሉም ድምጽ ቅርጾች ቁልፍን ያዙ', 'ንኣክሰንት ወይ ንኩሉ ድምጺ ፊደል መፍትሕ ሓዝ', 'Furtuu qabi: mallattoo ykn bifa sagalee hunda qubee irra', 'Ku hay furaha si aad u hesho lahjado ama dhammaan qaababka shaqalka', 'اضغط مطولًا على مفتاح للحصول على اللكنات أو كل أشكال حرف الفيدل'],
  'How long to hold': ['ለምን ያህል ጊዜ መያዝ', 'ክንደይ ግዜ ምሓዝ', 'Yeroo hagam qabuu', 'Inta la hayo', 'مدة الضغط'],
  'Time before the popup opens': ['ብቅ-ባዩ ከመከፈቱ በፊት ያለ ጊዜ', 'ቅድሚ ፖፕኣፕ ዝኽፈት ግዜ', 'Yeroo fuulli bahu osoo hin banamin', 'Waqtiga ka hor intaan daaqaddu furmin', 'الوقت قبل ظهور النافذة'],
  'Hold backspace to clear': ['ለማጥፋት ጀርባ-ጠባቂን ያዙ', 'ንምድምሳስ backspace ሓዝ', 'Haquuf backspace qabi', 'Ku hay backspace si aad u masaxdo', 'اضغط مطولًا على الحذف للمسح'],
  'Press and hold backspace to erase the whole sentence, not one letter': ['ሙሉውን ዓረፍተ ነገር ለማጥፋት ባክስፔስን ተጭነው ይያዙ', 'ምሉእ ሓረግ ንምድምሳስ backspace ጠዊና ሓዝ', 'Hima guutuu haquuf backspace qabi, qubee tokko osoo hin ta\'in', 'Ku hay backspace si aad u masaxdo jumlad dhan, ee ma aha hal xaraf', 'اضغط مطولًا على الحذف لمسح الجملة كلها وليس حرفًا واحدًا'],
  'Hold time to clear': ['ለማጥፋት የመያዣ ጊዜ', 'ግዜ ምሓዝ ንምድምሳስ', 'Yeroo qabuu haquuf', 'Waqtiga la hayo si loo masaxo', 'مدة الضغط للمسح'],
  'How long to hold backspace before the sentence is erased': ['ዓረፍተ ነገሩ ከመጥፋቱ በፊት ባክስፔስ ለምን ያህል ጊዜ ይያዛል', 'ቅድሚ ሓረግ ዝድምሰስ backspace ክንደይ ግዜ ይሕዝ', 'Yeroo hagam backspace qabamu hima osoo hin haqamin', 'Inta backspace la hayo ka hor intaan jumladda la tirin', 'مدة الضغط على الحذف قبل مسح الجملة'],
  'Key-press feedback': ['የቁልፍ ንክኪ ግብረ መልስ', 'ግብረ መልሲ ምትንካፍ መፍትሕ', 'Deebii tuqaa furtuu', 'Jawaabta riixista furaha', 'ردود فعل الضغط'],
  'Vibration': ['ንዝረት', 'ንዘኽታዊ', 'Hollannaa', 'Gariir', 'الاهتزاز'],
  'A short buzz on every key': ['በእያንዳንዱ ቁልፍ አጭር ንዝረት', 'ኣብ ነፍሲ ወከፍ መፍትሕ ሓጺር ንዘኽታዊ', 'Hollannaa gabaabaa furtuu hundaaf', 'Gariir gaaban fure kasta', 'اهتزاز قصير مع كل مفتاح'],
  'Vibration strength': ['የንዝረት ጥንካሬ', 'ሓይሊ ንዘኽታዊ', 'Cimina hollannaa', 'Xoogga gariirka', 'قوة الاهتزاز'],
  'Very light': ['በጣም ቀላል', 'ዳርጋ ቀሊል', 'Baay\'ee salphaa', 'Aad u khafiif', 'خفيف جدًا'],
  'Light': ['ቀላል', 'ቀሊል', 'Salphaa', 'Khafiif', 'خفيف'],
  'Medium': ['መካከለኛ', 'ማእከላይ', 'Giddu-galeessa', 'Dhexdhexaad', 'متوسط'],
  'Strong': ['ጠንካራ', 'ሓያል', 'Jabaa', 'Xooggan', 'قوي'],
  'Very strong': ['በጣም ጠንካራ', 'ኣዝዩ ሓያል', 'Baay\'ee jabaa', 'Aad u xooggan', 'قوي جدًا'],
  'Sound': ['ድምጽ', 'ድምጺ', 'Sagalee', 'Cod', 'الصوت'],
  'A soft click on every key': ['በእያንዳንዱ ቁልፍ ለስላሳ ጠቅታ', 'ኣብ ነፍሲ ወከፍ መፍትሕ ለዝቢ ጠቅታ', 'Tuqaa laafaa furtuu hundaaf', 'Guji jilicsan fure kasta', 'نقرة خفيفة مع كل مفتاح'],
  'Click volume': ['የጠቅታ ድምጽ መጠን', 'ዓቐን ድምጺ ጠቅታ', 'Sagalee tuqaa', 'Heerka codka guji', 'مستوى صوت النقر'],
  'Layout': ['አቀማመጥ', 'ኣቀማምጣ', 'Qindoomina', 'Qaabeynta', 'التخطيط'],
  'Desktop view': ['የዴስክቶፕ እይታ', 'ርእይቶ ዴስክቶፕ', 'Mul\'ata desktop', 'Muuqaalka desktop-ka', 'عرض سطح المكتب'],
  'Wide layout for larger screens': ['ለትላልቅ ማያዎች ሰፊ አቀማመጥ', 'ንዓበይቲ ስክሪን ሰፊሕ ኣቀማምጣ', 'Qindoomina bal\'aa iskiriinii guddaaf', 'Qaabeyn balaaran shaashado waaweyn', 'تخطيط عريض للشاشات الكبيرة'],
  'Reset to defaults': ['ወደ ነባሪ መልስ', 'ናብ ነባሪ ምለስ', 'Gara durtii deebisi', 'Dib ugu celi caadiga', 'إعادة التعيين إلى الافتراضي'],
  'Tap again to reset': ['ለማረጋገጥ እንደገና ይንኩ', 'ንምርግጋጽ ዳግማይ ትንክፍ', 'Deebisuuf irra deebi\'ii tuqi', 'Mar kale taabo si aad dib u dejiso', 'اضغط مجددًا للتأكيد'],
  'Your theme and custom themes are kept.': ['ገጽታዎ እና የራስዎ ገጽታዎች ይቀመጣሉ።', 'ገጽታኻን ናትካ ገጽታታትን ይዕቀቡ።', 'Teemiin keessanii fi teemiiwwan keessan ni eegamu.', 'Qaabkaaga iyo qaababkaaga gaarka ah waa la ilaaliyaa.', 'يتم الاحتفاظ بالسمة والسمات المخصصة.'],
  'Default': ['ነባሪ', 'ነባሪ', 'Durtii', 'Caadi', 'الافتراضي'],
  'Reset to {v}': ['ወደ {v} መልስ', 'ናብ {v} ምለስ', 'Gara {v} deebisi', 'Dib ugu celi {v}', 'إعادة إلى {v}'],
  'Decrease {v}': ['{v} ቀንስ', '{v} ቀንስ', '{v} xiqqeessi', 'Hoos u dhig {v}', 'تقليل {v}'],
  'Increase {v}': ['{v} ጨምር', '{v} ወስኽ', '{v} dabali', 'Kordhi {v}', 'زيادة {v}'],
};

/** Translate `text` (the English wording) into `lang`; English or unknown text comes back unchanged. */
export function translate(lang: UiLang, text: string, vars?: Record<string, string | number>): string {
  let out = text;
  if (lang !== 'en') {
    const row = STRINGS[text];
    if (row) out = row[ORDER.indexOf(lang)] || text;
  }
  if (vars) for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(String(vars[k]));
  return out;
}

export function isRtl(lang: UiLang): boolean {
  return UI_LANGUAGES.find(l => l.id === lang)?.rtl === true;
}

function readStored(): UiLang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && UI_LANGUAGES.some(l => l.id === v)) return v as UiLang;
  } catch { /* storage unavailable */ }
  return 'en';
}

/** The app's interface language, remembered between visits. */
export function useUiLanguage() {
  const [lang, setLangState] = useState<UiLang>('en');

  // Read after mount so server and client markup match on first render.
  useEffect(() => { setLangState(readStored()); }, []);

  const setLang = useCallback((next: UiLang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const tr = useCallback(
    (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars),
    [lang],
  );

  return { lang, setLang, tr, rtl: isRtl(lang) };
}
