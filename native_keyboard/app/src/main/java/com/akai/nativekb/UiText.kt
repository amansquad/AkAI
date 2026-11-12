package com.akai.nativekb

import android.content.Context

/**
 * The words of the app's own screens (settings and so on) in other languages.
 *
 * This is not the typing language: the language key still switches what the
 * keys type. Strings are looked up by their English text, so a string with no
 * entry here simply stays in English, and call sites need no changes.
 */
object UiText {
    class Language(val code: String, val native: String, val english: String, val rtl: Boolean = false)

    val LANGUAGES = listOf(
        Language("en", "English", "English"),
        Language("am", "አማርኛ", "Amharic"),
        Language("ti", "ትግርኛ", "Tigrinya"),
        Language("om", "Afaan Oromoo", "Oromo"),
        Language("so", "Soomaali", "Somali"),
        Language("ar", "العربية", "Arabic", rtl = true),
    )

    fun code(c: Context): String =
        c.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(Prefs.UI_LANG, "en") ?: "en"

    fun current(c: Context): Language = LANGUAGES.firstOrNull { it.code == code(c) } ?: LANGUAGES[0]

    /** [en] in the chosen language, or [en] itself when there is no translation. */
    fun t(c: Context, en: String): String {
        val row = STRINGS[en] ?: return en
        val code = code(c)
        if (code == "en") return en
        val i = ORDER.indexOf(code)
        return if (i >= 0 && i < row.size && row[i].isNotEmpty()) row[i] else en
    }

    /** Like [t], with `{name}` placeholders in [en] filled from [vars]. */
    fun t(c: Context, en: String, vararg vars: Pair<String, Any>): String =
        vars.fold(t(c, en)) { s, (k, v) -> s.replace("{$k}", v.toString()) }

    // Columns: Amharic, Tigrinya, Oromo, Somali, Arabic.
    private val ORDER = listOf("am", "ti", "om", "so", "ar")

    private fun row(am: String, ti: String, om: String, so: String, ar: String) = arrayOf(am, ti, om, so, ar)

    private val STRINGS: Map<String, Array<String>> = UI_TEXT_MORE + UI_TEXT_SCREENS + UI_TEXT_PANELS + mapOf(
        "Settings" to row("ቅንብሮች", "ቅጥዕታት", "Qindaa'inoota", "Dejinta", "الإعدادات"),
        "Look" to row("መልክ", "መልክዕ", "Bifa", "Muuqaalka", "المظهر"),
        "Typing" to row("መተየብ", "ምጽሓፍ", "Barreessuu", "Qorista", "الكتابة"),
        "Extras" to row("ተጨማሪዎች", "ተወሳኺ", "Dabalataa", "Dheeraad ah", "إضافات"),
        "Help" to row("እገዛ", "ሓገዝ", "Gargaarsa", "Caawimo", "مساعدة"),
        "Theme" to row("ገጽታ", "ገጽታ", "Teemii", "Qaabka", "السمة"),
        "Keys" to row("ቁልፎች", "መፍትሕታት", "Furtuuwwan", "Furayaasha", "المفاتيح"),
        "Size and rows" to row("መጠንና ረድፎች", "ዓቐንን ረድፍታትን", "Guddina fi sarara", "Cabbirka iyo safafka", "الحجم والصفوف"),
        "Languages and layouts" to row("ቋንቋዎችና አቀማመጦች", "ቋንቋታትን ኣቀማምጣታትን", "Afaanonni fi qindoomina", "Luqadaha iyo qaabeynta", "اللغات والتخطيطات"),
        "Typing and correction" to row("መተየብና ማረም", "ምጽሓፍን ምምሕያሽን", "Barreessuu fi sirreessuu", "Qorista iyo sixidda", "الكتابة والتصحيح"),
        "Sound and vibration" to row("ድምጽና ንዝረት", "ድምጺን ንዘኽታዊን", "Sagalee fi hollannaa", "Cod iyo gariir", "الصوت والاهتزاز"),
        "Toolbar" to row("የመሣሪያ አሞሌ", "መሳርሒ ባር", "Gabatee meeshaalee", "Barka qalabka", "شريط الأدوات"),
        "Emoji and GIFs" to row("ሺሸንፎችና GIF", "ኢሞጂን GIFን", "Emojii fi GIF", "Emoji iyo GIF", "الرموز التعبيرية وGIF"),
        "Sticker packs" to row("የተለጣፊ ጥቅሎች", "ጥቕላል ስቲከር", "Kuusaa stikeroota", "Xirmooyinka stickers", "حزم الملصقات"),
        "Translation and handwriting" to row("ትርጉምና የእጅ ጽሕፈት", "ትርጉምን ናይ ኢድ ጽሑፍን", "Hiikkaa fi barreeffama harkaa", "Turjumaadda iyo far-gacmeed", "الترجمة والكتابة اليدوية"),
        "Set up and test" to row("ማዘጋጀትና መሞከር", "ምድላውን ፈተናን", "Qopheessuu fi qorachuu", "Dejin iyo tijaabo", "الإعداد والتجربة"),
        "About Akai" to row("ስለ አካይ", "ብዛዕባ ኣካይ", "Waa'ee Akai", "Ku saabsan Akai", "حول Akai"),
        "App language" to row("የመተግበሪያ ቋንቋ", "ቋንቋ ኣፕሊኬሽን", "Afaan appii", "Luqadda app-ka", "لغة التطبيق"),
        "Choose the language of menus and settings. The language key still switches what you type." to row(
            "የምናሌዎችና የቅንብሮች ቋንቋ ይምረጡ። የቋንቋ ቁልፉ አሁንም የሚተይቡትን ቋንቋ ይቀይራል።",
            "ቋንቋ ዝርዝራትን ቅጥዕታትን ምረጽ። ናይ ቋንቋ መፍትሕ ግና ዝጽሕፍዎ ቋንቋ ይቕይር።",
            "Afaan baafata fi qindaa'inootaa filadhu. Furtuun afaanii amma iyyuu afaan barreessitan jijjiira.",
            "Dooro luqadda liisaska iyo dejinta. Furaha luqaddu weli wuxuu beddelaa waxa aad qorto.",
            "اختر لغة القوائم والإعدادات. لا يزال مفتاح اللغة يبدّل لغة الكتابة.",
        ),
        "Search settings" to row("ቅንብሮችን ፈልግ", "ቅጥዕታት ድለ", "Qindaa'ina barbaadi", "Raadi dejinta", "ابحث في الإعدادات"),
        "Check for updates" to row("ዝማኔዎችን ፈትሽ", "ሓደሽቲ ኣሰናድዩ ፈትሽ", "Haaromsa ilaali", "Hubi cusboonaysiinta", "التحقق من التحديثات"),
        "Set it up" to row("አዘጋጀው", "ኣዳሉዎ", "Qopheessi", "Deji", "إعداد"),
        "Akai isn't your keyboard yet" to row("አካይ ገና የእርስዎ ኪቦርድ አይደለም", "ኣካይ ገና ናትካ ኪቦርድ ኣይኮነን", "Akai amma kiiboordii keessan miti", "Akai wali ma aha kiiboodhkaaga", "Akai ليس لوحة مفاتيحك بعد"),
        "Turn it on and choose it to use these settings." to row("እነዚህን ቅንብሮች ለመጠቀም ያብሩትና ይምረጡት።", "ነዞም ቅጥዕታት ንምጥቃም ኣብርሁን ምረጽዎን።", "Qindaa'inoota kana fayyadamuuf jalqabsiisaa fi filadhaa.", "Daar oo dooro si aad u isticmaasho dejintan.", "فعّله واخترْه لاستخدام هذه الإعدادات."),
        "English" to row("እንግሊዝኛ", "እንግሊዝኛ", "Ingliffaa", "Ingiriisi", "الإنجليزية"),
        "Amharic" to row("አማርኛ", "ኣምሓርኛ", "Amaariffaa", "Amxaari", "الأمهرية"),
        "Layout" to row("አቀማመጥ", "ኣቀማምጣ", "Qindoomina", "Qaabeynta", "التخطيط"),
        "Keyboard" to row("ኪቦርድ", "ኪቦርድ", "Kiiboordii", "Kiiboodh", "لوحة المفاتيح"),
        "Phonetic" to row("ድምጻዊ", "ድምጻዊ", "Sagalee", "Codka", "صوتي"),
        "Language switch" to row("የቋንቋ መቀየሪያ", "መቐየሪ ቋንቋ", "Jijjiirraa afaanii", "Beddelka luqadda", "تبديل اللغة"),
        "Create a theme" to row("ገጽታ ፍጠር", "ገጽታ ፍጠር", "Teemii uumi", "Samee qaab", "إنشاء سمة"),
        "Animated backgrounds" to row("እነማ ዳራዎች", "ኣኒሜሽን ድሕረ-ባይታ", "Duubbee sochii", "Gadaal-muuqaal dhaqdhaqaaq leh", "خلفيات متحركة"),
        "Key height" to row("የቁልፍ ቁመት", "ቁመት መፍትሕ", "Dheerina furtuu", "Dhererka furaha", "ارتفاع المفتاح"),
        "One-handed mode" to row("በአንድ እጅ ሁነታ", "ሞድ ብሓንቲ ኢድ", "Haala harka tokkoo", "Habka hal gacan", "وضع اليد الواحدة"),
        "Number row" to row("የቁጥር ረድፍ", "ረድፊ ቍጽሪ", "Sarara lakkoofsaa", "Safka tirooyinka", "صف الأرقام"),
        "Corner roundness" to row("የማዕዘን ክብነት", "ዙርያ ኩርናዕ", "Gara marsaa golee", "Wareegga geesaha", "استدارة الزوايا"),
        "Key borders" to row("የቁልፍ ጠርዞች", "ደረት መፍትሕ", "Daangaa furtuu", "Xuduudaha furayaasha", "حدود المفاتيح"),
        "Show suggestions" to row("ጥቆማዎችን አሳይ", "ጥቆማታት ኣርኢ", "Yaada agarsiisi", "Muuji soo jeedinta", "إظهار الاقتراحات"),
        "Auto-correct" to row("ራስ-ሰር ማረም", "ባዕሉ ምምሕያሽ", "Of-sirreessuu", "Sixid toos ah", "تصحيح تلقائي"),
        "Swipe typing" to row("በማንሸራተት መተየብ", "ብምስሓብ ምጽሓፍ", "Barreessuu harkisuun", "Qorista jiidid", "الكتابة بالتمرير"),
        "Auto-capitalization" to row("ራስ-ሰር ትልቅ ፊደል", "ባዕሉ ዓቢ ፊደል", "Qubee guddaa of-eegannoo", "Xarafka weyn toos ah", "الأحرف الكبيرة تلقائيًا"),
        "Haptic feedback" to row("የንዝረት ግብረ መልስ", "ናይ ንዘኽታዊ ግብረ መልሲ", "Deebii hollannaa", "Jawaab gariir", "ردود فعل الاهتزاز"),
        "Key sounds" to row("የቁልፍ ድምጾች", "ድምጽታት መፍትሕ", "Sagalee furtuu", "Codadka furayaasha", "أصوات المفاتيح"),
        "Toolbar buttons" to row("የመሣሪያ አሞሌ አዝራሮች", "ዓቐንቲ መሳርሒ ባር", "Butoonii gabatee meeshaalee", "Badhamada barka qalabka", "أزرار شريط الأدوات"),
        "Word of the day" to row("የዕለቱ ቃል", "ቃል ናይታ መዓልቲ", "Jecha guyyaa", "Eraygii maalinta", "كلمة اليوم"),
        "Skin tone" to row("የቆዳ ቀለም", "ሕብሪ ቆርበት", "Halluu gogaa", "Midabka maqaarka", "لون البشرة"),
        "Add sticker pack" to row("የተለጣፊ ጥቅል ጨምር", "ጥቕላል ስቲከር ወስኽ", "Kuusaa stikeroota dabali", "Ku dar xirmo stickers ah", "إضافة حزمة ملصقات"),
        "Turn the keyboard on" to row("ኪቦርዱን አብራ", "ኪቦርድ ኣብሪሕ", "Kiiboordii jalqabsiisi", "Daar kiiboodhka", "تفعيل لوحة المفاتيح"),
        "Try the keyboard" to row("ኪቦርዱን ሞክር", "ኪቦርድ ፈትን", "Kiiboordii yaali", "Tijaabi kiiboodhka", "جرّب لوحة المفاتيح"),
        "Privacy" to row("ግላዊነት", "ብሕትውና", "Dhuunfaa", "Asturnaanta", "الخصوصية"),
        "Version" to row("ስሪት", "ሕታም", "Gosa", "Nooca", "الإصدار"),
    )
}
