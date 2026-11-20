package com.akai.nativekb

private fun r(am: String, ti: String, om: String, so: String, ar: String) = arrayOf(am, ti, om, so, ar)

/**
 * Words added in 1.0.23: backup and restore, crash reports, the dark-mode
 * theme and the daily AI limit. Columns are Amharic, Tigrinya, Oromo, Somali, Arabic.
 */
internal val UI_TEXT_RECENT: Map<String, Array<String>> = mapOf(
    // ── Backup and restore ──
    "Back up settings" to r("ቅንብሮችን ምትኬ አስቀምጥ", "ቅጥዕታት ተቐማጢ ግበር", "Qindaa'inoota kuusi", "Kaydi dejinta", "نسخ الإعدادات احتياطيًا"),
    "Settings, learned words, your themes and sticker packs, in one file" to r(
        "ቅንብሮች፣ የተማሩ ቃላት፣ ገጽታዎችዎና የተለጣፊ ጥቅሎች፣ በአንድ ፋይል",
        "ቅጥዕታት፣ ዝተመሃሩ ቃላት፣ ገጽታታትኩምን ጥቕላል ስቲከርን፣ ኣብ ሓደ ፋይል",
        "Qindaa'inoota, jechoota baratame, teemiiwwan kee fi kuusaa stikeroota, faayilii tokko keessatti",
        "Dejinta, erayada la bartay, qaababkaaga iyo xirmooyinka stickers, hal fayl",
        "الإعدادات والكلمات المتعلَّمة وسماتك وحزم الملصقات، في ملف واحد",
    ),
    "Restore from a backup" to r("ከምትኬ መልስ", "ካብ ተቐማጢ መልስ", "Kuusaa irraa deebisi", "Ka soo celi kayd", "الاستعادة من نسخة احتياطية"),
    "Restore from a backup?" to r("ከምትኬ ይመለስ?", "ካብ ተቐማጢ ይመለስ?", "Kuusaa irraa deebisuu?", "Ka soo celi kayd?", "الاستعادة من نسخة احتياطية؟"),
    "Replaces what's on this phone with the backup's" to r(
        "በዚህ ስልክ ያለውን በምትኬው ይተካል",
        "ኣብዚ ተሌፎን ዘሎ ብናይ ተቐማጢ ይትካእ",
        "Waan bilbila kana irra jiru kan kuusaatiin bakka buusa",
        "Waxa telefoonkan ku jira wuxuu ku beddelaa kan kaydka",
        "يستبدل ما على هذا الهاتف بما في النسخة الاحتياطية",
    ),
    "Your settings, learned words, themes, shortcuts and sticker packs on this phone will be replaced by the backup's." to r(
        "በዚህ ስልክ ያሉት ቅንብሮችዎ፣ የተማሩ ቃላት፣ ገጽታዎች፣ አቋራጮችና የተለጣፊ ጥቅሎች በምትኬው ይተካሉ።",
        "ኣብዚ ተሌፎን ዘለዉ ቅጥዕታትኩም፣ ዝተመሃሩ ቃላት፣ ገጽታታት፣ ሕጽረታትን ጥቕላል ስቲከርን ብናይ ተቐማጢ ክትክኡ እዮም።",
        "Qindaa'inoonni kee, jechoonni baratame, teemiiwwan, gabaabsoonni fi kuusaan stikeroota bilbila kana irra jiran kan kuusaatiin bakka bu'u.",
        "Dejintaada, erayada la bartay, qaababka, gaababinta iyo xirmooyinka stickers ee telefoonkan waxaa lagu beddeli doonaa kuwa kaydka.",
        "ستُستبدل إعداداتك وكلماتك المتعلَّمة وسماتك واختصاراتك وحزم الملصقات على هذا الهاتف بما في النسخة الاحتياطية.",
    ),
    "Choose file" to r("ፋይል ምረጥ", "ፋይል ምረጽ", "Faayilii filadhu", "Dooro fayl", "اختر ملفًا"),
    "No file picker on this phone" to r("በዚህ ስልክ ፋይል መምረጫ የለም", "ኣብዚ ተሌፎን መምረጺ ፋይል የለን", "Bilbila kana irratti filataan faayilii hin jiru", "Telefoonkan kuma jiro dooraha faylasha", "لا يوجد منتقي ملفات على هذا الهاتف"),
    "Backed up" to r("ምትኬ ተቀምጧል", "ተቐማጢ ተገይሩ", "Kuufameera", "Waa la kaydiyay", "تم النسخ الاحتياطي"),
    "Backed up, with {n} sticker packs" to r("ምትኬ ተቀምጧል፣ ከ{n} የተለጣፊ ጥቅሎች ጋር", "ተቐማጢ ተገይሩ፣ ምስ {n} ጥቕላል ስቲከር", "Kuufameera, kuusaa stikeroota {n} wajjin", "Waa la kaydiyay, oo ay la socdaan {n} xirmo stickers", "تم النسخ الاحتياطي مع {n} من حزم الملصقات"),
    "Couldn't save the backup there" to r("ምትኬውን እዚያ ማስቀመጥ አልተቻለም", "ተቐማጢ ኣብኡ ክዕቀብ ኣይከኣለን", "Kuusaa achitti olkaa'uun hin danda'amne", "Kaydka halkaas laguma kaydin karin", "تعذّر حفظ النسخة الاحتياطية هناك"),
    "Restored {n} settings" to r("{n} ቅንብሮች ተመልሰዋል", "{n} ቅጥዕታት ተመሊሶም", "Qindaa'inoonni {n} deebi'aniiru", "{n} dejin ayaa la soo celiyay", "تمت استعادة {n} من الإعدادات"),
    "Restored {n} settings and {p} sticker packs" to r(
        "{n} ቅንብሮችና {p} የተለጣፊ ጥቅሎች ተመልሰዋል",
        "{n} ቅጥዕታትን {p} ጥቕላል ስቲከርን ተመሊሶም",
        "Qindaa'inoonni {n} fi kuusaan stikeroota {p} deebi'aniiru",
        "{n} dejin iyo {p} xirmo stickers ayaa la soo celiyay",
        "تمت استعادة {n} من الإعدادات و{p} من حزم الملصقات",
    ),
    "That isn't an Akai backup file" to r("ይህ የአካይ ምትኬ ፋይል አይደለም", "እዚ ፋይል ተቐማጢ ኣካይ ኣይኮነን", "Kun faayilii kuusaa Akai miti", "Kani maaha fayl kayd Akai", "هذا ليس ملف نسخة احتياطية من Akai"),
    "That backup is from a newer Akai. Update the app first" to r(
        "ይህ ምትኬ ከአዲስ የአካይ ስሪት ነው። መጀመሪያ መተግበሪያውን ያዘምኑ",
        "እዚ ተቐማጢ ካብ ሓድሽ ኣካይ እዩ። ቅድም ኣፕሊኬሽን ኣሐድሱ",
        "Kuusaan kun Akai haaraa irraa dhufe. Dura appicha haaromsi",
        "Kaydkani wuxuu ka yimid Akai ka cusub. Marka hore cusboonaysii app-ka",
        "هذه النسخة من إصدار أحدث من Akai. حدِّث التطبيق أولًا",
    ),
    "That file is too big to be an Akai backup" to r("ይህ ፋይል የአካይ ምትኬ ለመሆን በጣም ትልቅ ነው", "እዚ ፋይል ተቐማጢ ኣካይ ንምዃን ኣዝዩ ዓቢ እዩ", "Faayiliin kun kuusaa Akai ta'uuf baay'ee guddaa dha", "Faylkani aad buu u weyn yahay si uu u noqdo kayd Akai", "هذا الملف أكبر من أن يكون نسخة احتياطية من Akai"),
    "Couldn't read that file" to r("ያንን ፋይል ማንበብ አልተቻለም", "እቲ ፋይል ክንበብ ኣይከኣለን", "Faayilii sana dubbisuun hin danda'amne", "Faylkaas lama akhrin karin", "تعذّرت قراءة ذلك الملف"),

    // ── Crash reports ──
    "Akai stopped unexpectedly" to r("አካይ ሳይጠበቅ ቆመ", "ኣካይ ብዘይተጸበናዮ ደው በለ", "Akai osoo hin eegamin dhaabbate", "Akai si lama filaan ah ayuu u istaagay", "توقف Akai بشكل غير متوقع"),
    "A report of what went wrong is saved on this phone. Sending it helps fix it. It holds the error, the app and Android versions and the phone model, never what you typed." to r(
        "የተበላሸው ነገር ሪፖርት በዚህ ስልክ ተቀምጧል። መላኩ ችግሩን ለማስተካከል ይረዳል። ስህተቱን፣ የመተግበሪያውንና የአንድሮይድ ስሪቶችን እና የስልኩን ሞዴል ይዟል፤ የተየቡትን በፍጹም አይይዝም።",
        "ጸብጻብ ናይቲ ዝተበላሸወ ኣብዚ ተሌፎን ተቐሚጡ ኣሎ። ምልኣኹ ንምዕራዩ ይሕግዝ። ጌጋ፣ ስሪታት ኣፕሊኬሽንን ኣንድሮይድን ሞዴል ተሌፎንን ይሕዝ፤ ዝጸሓፍኩሞ ፈጺሙ ኣይሕዝን።",
        "Gabaasni waan dogoggore bilbila kana irratti kuufameera. Erguun isaa sirreessuuf gargaara. Dogoggora, gosa appii fi Android, akkasumas moodeela bilbilaa qaba; waan barreessite gonkumaa hin qabu.",
        "Warbixin ku saabsan waxa khaldamay ayaa telefoonkan lagu kaydiyay. Dirkeedu wuxuu caawiyaa hagaajinta. Waxay haysaa khaladka, noocyada app-ka iyo Android iyo moodelka telefoonka, marnaba ma hayso waxa aad qortay.",
        "حُفظ تقرير بما حدث على هذا الهاتف. إرساله يساعد على إصلاحه. يحتوي على الخطأ وإصداري التطبيق وأندرويد وطراز الهاتف، ولا يحتوي أبدًا على ما كتبته.",
    ),
    "Send report" to r("ሪፖርት ላክ", "ጸብጻብ ስደድ", "Gabaasa ergi", "Dir warbixinta", "إرسال التقرير"),
    "See what's sent" to r("የሚላከውን ይመልከቱ", "ዝለኣኽ ርአ", "Waan ergamu ilaali", "Eeg waxa la dirayo", "اطّلع على ما سيُرسل"),
    "Delete it" to r("ሰርዘው", "ሰርዞ", "Haqi", "Tirtir", "احذفه"),
    "Crash report" to r("የብልሽት ሪፖርት", "ጸብጻብ ብልሽት", "Gabaasa dogoggoraa", "Warbixinta burburka", "تقرير الأعطال"),
    "Close" to r("ዝጋ", "ዕጸው", "Cufi", "Xidh", "إغلاق"),
    "Sent. Thank you" to r("ተልኳል። እናመሰግናለን", "ተላኢኹ። የቐንየልና", "Ergameera. Galatoomi", "Waa la diray. Mahadsanid", "تم الإرسال. شكرًا لك"),
    "Couldn't send it. Try again later" to r("መላክ አልተቻለም። ቆይተው እንደገና ይሞክሩ", "ክለኣኽ ኣይከኣለን። ደሓር ደጊምኩም ፈትኑ", "Erguun hin danda'amne. Booda irra deebi'ii yaali", "Lama diri karin. Mar dambe isku day", "تعذّر الإرسال. حاول مرة أخرى لاحقًا"),

    // ── Dark-mode theme ──
    "Dark mode" to r("ጨለማ ሁነታ", "ጸልማት ኣገባብ", "Haala dukkanaa", "Habka mugdiga", "الوضع الداكن"),
    "Different theme in dark mode" to r("በጨለማ ሁነታ ሌላ ገጽታ", "ኣብ ጸልማት ኣገባብ ካልእ ገጽታ", "Haala dukkanaatti teemii biraa", "Qaab kale habka mugdiga", "سمة مختلفة في الوضع الداكن"),
    "Switches when the phone goes dark, and back" to r(
        "ስልኩ ወደ ጨለማ ሲቀየር ይቀየራል፣ ሲመለስም ይመለሳል",
        "ተሌፎን ናብ ጸልማት ክቕየር ከሎ ይቕየር፣ ክምለስ ከሎ ይምለስ",
        "Yeroo bilbilli dukkanaa'u ni jijjiirama, yeroo deebi'us ni deebi'a",
        "Wuu beddelmaa marka telefoonku mugdoobo, waana soo noqdaa",
        "يتبدّل عندما يصبح الهاتف داكنًا، ويعود عند الرجوع",
    ),
    "Dark mode theme: {name}" to r("የጨለማ ሁነታ ገጽታ፦ {name}", "ገጽታ ጸልማት ኣገባብ፦ {name}", "Teemii haala dukkanaa: {name}", "Qaabka habka mugdiga: {name}", "سمة الوضع الداكن: {name}"),
    "Dark mode theme" to r("የጨለማ ሁነታ ገጽታ", "ገጽታ ጸልማት ኣገባብ", "Teemii haala dukkanaa", "Qaabka habka mugdiga", "سمة الوضع الداكن"),
    "Tap to choose another" to r("ሌላ ለመምረጥ ይንኩ", "ካልእ ንምምራጽ ትንክፍ", "Kan biraa filachuuf tuqi", "Taabo si aad mid kale u doorato", "اضغط لاختيار سمة أخرى"),

    // ── Daily limit and privacy ──
    "Today's limit is reached - try again tomorrow" to r(
        "የዛሬው ገደብ ደርሷል - ነገ እንደገና ይሞክሩ",
        "ናይ ሎሚ ደረት በጺሑ - ጽባሕ ደጊምኩም ፈትኑ",
        "Daangaan har'aa ga'ameera - boru irra deebi'ii yaali",
        "Xadka maanta waa la gaadhay - berri isku day",
        "تم بلوغ حد اليوم - حاول مرة أخرى غدًا",
    ),
    "These AI features also send a random number this phone made, so the server can count daily use. It never learns who you are." to r(
        "እነዚህ የAI ባህሪያት ይህ ስልክ የፈጠረውን የዘፈቀደ ቁጥር ይልካሉ፤ አገልጋዩ የዕለት አጠቃቀምን እንዲቆጥር። ማንነትዎን በፍጹም አያውቅም።",
        "እዞም ናይ AI ባህርያት እዚ ተሌፎን ዝፈጠሮ ዘይተመደበ ቍጽሪ ይሰዱ፤ ሰርቨር ዕለታዊ ኣጠቓቕማ ንኽቖጽር። መን ምዃንኩም ፈጺሙ ኣይፈልጥን።",
        "Amaloonni AI kun lakkoofsa carraa bilbilli kun uume ni ergu, akka sarvarichi itti fayyadama guyyaa lakkaa'uuf. Eenyu akka taate gonkumaa hin beeku.",
        "Astaamahan AI waxay sidoo kale diraan lambar random ah oo telefoonkani sameeyay, si server-ku u tiriyo isticmaalka maalinlaha. Marnaba ma oga cidda aad tahay.",
        "ترسل ميزات الذكاء الاصطناعي هذه أيضًا رقمًا عشوائيًا أنشأه هذا الهاتف، ليحسب الخادم الاستخدام اليومي. ولا يعرف أبدًا من أنت.",
    ),
)
