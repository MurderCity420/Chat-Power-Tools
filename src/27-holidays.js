    // ============================================================
    // HOLIDAY EASTER EGGS
    // ============================================================
    // Each entry: month, day, name, localName (optional), significance,
    //   iconKey (→ PT_ICONS.holidays), effect (→ EFFECTS palette),
    //   country ('All' or comma-separated ISO-2 codes), wiki (Wikipedia URL).
    // Only the first matching entry per date is shown (date = Eastern Time).
    // Variable-date holidays use the 2025 Gregorian date; significance notes this.

    // All colors verified readable on dark/black backgrounds (luminance ≥ 0.10).
    // Dark flag/palette colors are replaced with brighter same-hue equivalents.
    const EFFECTS = {
        // ---- Existing ----
        // Uses the site's own .b1–.b16 username color palette — all verified safe on dark backgrounds.
        rainbow:       ['#2ea3f5','#35a258','#ea5454','#d459ca','#63a9ab','#cea448',
                        '#c34545','#36d2bc','#d9e432','#ea0606','#646fd0','#00940C',
                        '#da7268','#6ca1a7','#9e5ebf','#ff68ec'],
        test_rwb:      ['#FF4444','#FFFFFF','#4466FF'],
        // ---- Universal ----
        new_year:      ['#FFD700','#C0C0C0','#4466FF','#FFFFFF'],
        labour_day:    ['#FF4444','#FFDF00','#FFFFFF'],
        // ---- Christianity ----
        christmas:     ['#FF4444','#33BB33','#FFFFFF','#FFD700'],
        advent:        ['#9944CC','#CC55CC','#FFD700','#FFFFFF'],
        all_saints:    ['#CC55CC','#FFD700','#FFFFFF'],
        // ---- Islam ----
        eid:           ['#00BB44','#FFD700','#FFFFFF','#C0C0C0'],
        ramadan:       ['#00BB44','#C0C0C0','#FFD700','#FFFFFF'],
        // ---- Judaism ----
        hanukkah:      ['#3377EE','#4488FF','#FFFFFF','#C0C0C0'],
        rosh:          ['#3377EE','#FFFFFF','#FFD700'],
        yom_kippur:    ['#FFFFFF','#4488FF','#C0C0C0'],
        purim:         ['#CC44DD','#FFD700','#FF6633'],
        passover:      ['#3377EE','#FFFFFF','#FFD700'],
        sukkot:        ['#33BB33','#FFD700','#3377EE'],
        // ---- Buddhism ----
        vesak:         ['#FFFF00','#FF8C00','#FF4444','#4466FF','#FFFFFF'],
        bodhi:         ['#FFD700','#CC7733','#90EE90'],
        // ---- Hinduism ----
        diwali:        ['#FF6F00','#FFD700','#FF3355','#CC55FF'],
        holi:          ['#FF3355','#FF9800','#FFEB3B','#44CC55','#4499FF','#CC44DD'],
        hindu:         ['#FF8C00','#FFD700','#FF3344'],
        // ---- Wheel of the Year (Pagan / Neopagan / Wicca) ----
        samhain:       ['#FF6600','#9944CC','#EE3333','#AA3333'],
        yule:          ['#4466BB','#C0C0C0','#FFFFFF','#FFD700'],
        imbolc:        ['#FFFFFF','#87CEEB','#ADD8E6'],
        ostara:        ['#FFFF99','#90EE90','#FFB6C1','#ADD8E6'],
        beltane:       ['#33CC33','#FFFF00','#FF69B4'],
        litha:         ['#FFD700','#FF4500','#FFFF00','#FF8C00'],
        lughnasadh:    ['#DAA520','#FF8C00','#CC7733'],
        mabon:         ['#FF6600','#EE3333','#CC7733','#FFD700'],
        // ---- Satanic (Church of Satan / The Satanic Temple) ----
        satanic:       ['#EE3333','#AA3333','#CC55CC','#FF2222'],
        // ---- National flags — brightened to stay readable on dark backgrounds ----
        us_flag:       ['#EE3344','#FFFFFF','#5566AA'],  // red · white · brightened navy
        mx_flag:       ['#00BB55','#FFFFFF','#EE3333'],  // brightened green · white · red
        ca_flag:       ['#FF3333','#FFFFFF'],
        br_flag:       ['#00BB44','#FFDF00','#3366BB'],  // brightened green · gold · brightened blue
        ar_flag:       ['#74ACDF','#FFFFFF','#F6B40E'],  // sky-blue · white · sun-gold (all ok)
        nl_flag:       ['#EE3344','#FFFFFF','#3366BB'],  // brightened red · white · brightened blue
        de_flag:       ['#888888','#FF3333','#FFCE00'],  // gray (was black) · red · gold
        au_flag:       ['#3366BB','#EE3344','#FFFFFF'],  // brightened blue · red · white
        ph_flag:       ['#3377CC','#EE3344','#FFFFFF','#FCD116'],  // brightened blue · red · white · gold
        gb_flag:       ['#EE3344','#FFFFFF','#3355CC'],  // red · white · brightened blue
        ie_flag:       ['#33CC77','#FFFFFF','#FF8200'],  // brightened green · white · orange
        es_flag:       ['#EE3344','#FFB800'],            // brightened red · gold
        pt_flag:       ['#00BB00','#FF4444','#FFD700'],  // brightened green · red · gold
        pl_flag:       ['#FFFFFF','#EE3344'],
        fr_flag:       ['#3355CC','#FFFFFF','#EE3344'],  // brightened blue · white · red
        multi_eu:      ['#4477CC','#FFCC00'],
    };

    const HOLIDAYS = [

        // ==== JANUARY ====

        { month:1,  day:1,
          name:"New Year's Day",
          localName:"Año Nuevo · Nouvel An · Neujahr · Nieuwjaarsdag · Ano Novo · Nowy Rok / New Year's Day",
          significance:"The first day of the Gregorian year — celebrated worldwide with fireworks, resolutions, and gatherings.",
          iconKey:'new_year', effect:'new_year', country:'All',
          wiki:'https://en.wikipedia.org/wiki/New_Year%27s_Day' },

        { month:1,  day:6,
          name:"Epiphany / Three Kings' Day",
          localName:"Día de Reyes · Epifania · Heilige Drei Könige · Objawienie Pańskie / Three Kings' Day",
          significance:"Los Reyes Magos visitaron al Niño Jesús; día de regalos en España y Latinoamérica. / Christian feast of the Magi's visit — the major gift-giving day in Spain and Latin America.",
          iconKey:'christian', effect:'advent', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Epiphany_(holiday)' },

        { month:1,  day:14,
          name:"Makar Sankranti",
          localName:"मकर संक्रान्ति / Makar Sankranti",
          significance:"मकर संक्रान्ति सूर्य के मकर राशि में प्रवेश का उत्सव है — पतंगबाज़ी और तिल-गुड़। / Hindu solar festival marking the sun's entry into Capricorn — kite-flying and sesame sweets.",
          iconKey:'hindu', effect:'hindu', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Makar_Sankranti' },

        { month:1,  day:20,
          name:"Martin Luther King Jr. Day",
          significance:"U.S. federal holiday honoring the civil-rights leader — held on the third Monday of January.",
          iconKey:'us', effect:'us_flag', country:'US',
          wiki:'https://en.wikipedia.org/wiki/Martin_Luther_King_Jr._Day' },

        { month:1,  day:26,
          name:"Australia Day",
          significance:"Australia's national day marking the 1788 arrival of the First Fleet at Sydney Cove.",
          iconKey:'au', effect:'au_flag', country:'AU',
          wiki:'https://en.wikipedia.org/wiki/Australia_Day' },

        // ==== FEBRUARY ====

        { month:2,  day:1,
          name:"Imbolc / St Brigid's Day",
          localName:"Lá Fhéile Bríde / St Brigid's Day",
          significance:"Ceiliúrann Lá Fhéile Bríde tús an earraigh agus onóraíonn Naomh Bríd — lá saoire poiblí in Éirinn ó 2023. / Pagan spring sabbat honoring Brigid; public holiday in Ireland since 2023.",
          iconKey:'pagan', effect:'imbolc', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Imbolc' },

        { month:2,  day:5,
          name:"Constitution Day",
          localName:"Día de la Constitución / Constitution Day (Mexico)",
          significance:"El Día de la Constitución conmemora la Constitución de 1917, primera constitución social del mundo. / Constitution Day marks the 1917 Mexican Constitution, the world's first social constitution.",
          iconKey:'mx', effect:'mx_flag', country:'MX',
          wiki:'https://en.wikipedia.org/wiki/Constitution_Day_(Mexico)' },

        { month:2,  day:15,
          name:"Lupercalia / Parinirvana Day",
          significance:"Lupercalia: ancient Roman fertility festival observed by The Satanic Temple. Parinirvana Day: Buddhist commemoration of the Buddha's final nirvana.",
          iconKey:'satanic', effect:'satanic', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Lupercalia' },

        { month:2,  day:17,
          name:"Presidents' Day / Family Day",
          localName:"Jour de la famille / Presidents' Day · Family Day",
          significance:"U.S.: Federal holiday honoring Washington and Lincoln (3rd Monday of Feb). Canada — Fête de la famille: jour férié dans la plupart des provinces. / Family Day public holiday in most provinces.",
          iconKey:'us', effect:'us_flag', country:'US,CA',
          wiki:'https://en.wikipedia.org/wiki/Presidents%27_Day' },

        { month:2,  day:25,
          name:"EDSA People Power Anniversary",
          localName:"Araw ng EDSA / EDSA People Power Day",
          significance:"Ang Araw ng EDSA ay naggunita ng rebolusyong walang karahasan noong 1986 na nagwakas sa diktadurya ni Marcos. / EDSA Day marks the 1986 non-violent revolution that ended the Marcos dictatorship.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/People_Power_Revolution' },

        // ==== MARCH ====

        { month:3,  day:13,
          name:"Purim",
          localName:"פּוּרִים / Purim",
          significance:"פורים חוגג את הצלת היהודים בפרס העתיקה — תחפושות, משתה ומתנות. / Purim celebrates the salvation of the Jewish people in ancient Persia — costumes, feasting, and gifts. (~14 Adar)",
          iconKey:'jewish', effect:'purim', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Purim' },

        { month:3,  day:14,
          name:"Holi — Festival of Colors",
          localName:"होली / Holi — Festival of Colors",
          significance:"होली रंगों का त्योहार है — बुराई पर अच्छाई की जीत और वसंत के आगमन का उत्सव। / Holi celebrates the triumph of good over evil and the arrival of spring with colored powder and water.",
          iconKey:'hindu', effect:'holi', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Holi' },

        { month:3,  day:17,
          name:"St Patrick's Day",
          localName:"Lá Fhéile Pádraig / St Patrick's Day",
          significance:"Ceiliúrtar Lá Fhéile Pádraig le parádanna, éadaí glasa, agus ceol traidisiúnta. / St Patrick's Day honors Ireland's patron saint with parades, wearing of the green, and traditional music.",
          iconKey:'ie', effect:'ie_flag', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Saint_Patrick%27s_Day' },

        { month:3,  day:20,
          name:"Ostara — Spring Equinox",
          significance:"Neopagan sabbat at the vernal equinox celebrating balance, renewal, and the return of light. Approximate date — equinox falls Mar 20–21.",
          iconKey:'pagan', effect:'ostara', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Ostara' },

        { month:3,  day:21,
          name:"Benito Juárez Day",
          localName:"Natalicio de Benito Juárez / Birthday of Benito Juárez",
          significance:"El Natalicio de Benito Juárez rinde homenaje al Benemérito de las Américas, defensor de los derechos indígenas. / Benito Juárez Day honors the president who defended indigenous rights and national sovereignty.",
          iconKey:'mx', effect:'mx_flag', country:'MX',
          wiki:'https://en.wikipedia.org/wiki/Benito_Ju%C3%A1rez' },

        { month:3,  day:24,
          name:"National Day of Memory",
          localName:"Día de la Memoria por la Verdad y la Justicia / National Day of Memory",
          significance:"El Día de la Memoria recuerda a las víctimas del terrorismo de Estado durante la dictadura militar de 1976–83. / National Day of Memory remembers victims of State terrorism during the 1976–83 military dictatorship.",
          iconKey:'ar', effect:'ar_flag', country:'AR',
          wiki:'https://en.wikipedia.org/wiki/National_Day_of_Memory_for_Truth_and_Justice' },

        { month:3,  day:30,
          name:"Eid al-Fitr",
          localName:"عيد الفطر / Eid al-Fitr (End of Ramadan)",
          significance:"عيد الفطر يُحتفل به في نهاية شهر رمضان — يوم فرح وامتنان وزكاة الفطر. / Eid al-Fitr celebrates the end of Ramadan with joy, gratitude, and charity. Date shifts yearly with the lunar calendar.",
          iconKey:'islam', effect:'eid', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Eid_al-Fitr' },

        { month:3, day:31, name:'International Transgender Day of Visibility',
          significance:'Celebrating transgender and non-binary individuals and their achievements worldwide.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/International_Transgender_Day_of_Visibility' },

        // ==== APRIL ====

        { month:4,  day:2,
          name:"Malvinas Day",
          localName:"Día del Veterano y de los Caídos en la Guerra de Malvinas / Malvinas Veterans Day",
          significance:"El Día de Malvinas rinde homenaje a los veteranos y caídos en la Guerra de las Malvinas de 1982. / Malvinas Day honors veterans and fallen soldiers of the 1982 Falklands/Malvinas War.",
          iconKey:'ar', effect:'ar_flag', country:'AR',
          wiki:'https://en.wikipedia.org/wiki/Falklands_War' },

        { month:4,  day:6,
          name:"Ram Navami",
          localName:"राम नवमी / Ram Navami",
          significance:"राम नवमी भगवान राम के जन्म का उत्सव है — उपवास, पूजा और रामायण पाठ। / Ram Navami celebrates Lord Rama's birth — fasting, prayers, and recitation of the Ramayana. (~Chaitra 9)",
          iconKey:'hindu', effect:'hindu', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Ram_Navami' },

        { month:4,  day:9,
          name:"Araw ng Kagitingan — Day of Valor",
          localName:"Araw ng Kagitingan / Day of Valor",
          significance:"Ang Araw ng Kagitingan ay nagpaparangal sa lakas-loob ng mga sundalo sa Pagbabagsak ng Bataan noong 1942. / Day of Valor honors Filipino and American soldiers at the 1942 Fall of Bataan.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/Bataan_Day' },

        { month:4,  day:12,
          name:"Passover — Pesach",
          localName:"פֶּסַח / Passover (Pesach)",
          significance:"פסח מציין את יציאת מצרים — ליל הסדר, מצה, וסיפור הגאולה. / Passover commemorates the Exodus from Egypt — Seder meals, matzah, and retelling of the liberation story. (~15 Nisan)",
          iconKey:'jewish', effect:'passover', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Passover' },

        { month:4,  day:21,
          name:"Tiradentes Day",
          localName:"Dia de Tiradentes / Tiradentes Day",
          significance:"O Dia de Tiradentes homenageia Joaquim José da Silva Xavier, mártir da independência brasileira. / Tiradentes Day honors Joaquim José da Silva Xavier, martyr of Brazil's independence movement.",
          iconKey:'br', effect:'br_flag', country:'BR',
          wiki:'https://en.wikipedia.org/wiki/Tiradentes%27_Day' },

        { month:4,  day:25,
          name:"Anzac Day / Dia da Liberdade",
          localName:"Anzac Day · Dia da Liberdade / Anzac Day · Freedom Day (PT)",
          significance:"Austrália/NZ: Day of remembrance for ANZACs. Portugal: O Dia da Liberdade celebra a Revolução dos Cravos de 25 de abril de 1974. / Portugal: Freedom Day marks the 1974 Carnation Revolution.",
          iconKey:'au', effect:'au_flag', country:'AU,NZ,PT',
          wiki:'https://en.wikipedia.org/wiki/Anzac_Day' },

        { month:4,  day:26,
          name:'Lesbian Visibility Day',
          significance:'Dedicated to raising the visibility of lesbians and addressing the unique challenges they face.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Lesbian_Visibility_Day' },

        { month:4,  day:27,
          name:"King's Day",
          localName:"Koningsdag / King's Day",
          significance:"Koningsdag is een nationale feestdag ter ere van de verjaardag van Koning Willem-Alexander — Nederland kleurt oranje. / King's Day celebrates King Willem-Alexander's birthday — the Netherlands turns orange.",
          iconKey:'nl', effect:'nl_flag', country:'NL',
          wiki:'https://en.wikipedia.org/wiki/Koningsdag' },

        { month:4,  day:30,
          name:"Walpurgisnacht",
          localName:"Walpurgisnacht / Walpurgis Night",
          significance:"Walpurgisnacht ist ein uraltes germanisches Frühlingsfest — Feuer, Tanz und der Übergang in den Mai. / Walpurgis Night is an ancient Germanic spring festival and high sabbat in Satanic traditions.",
          iconKey:'satanic', effect:'satanic', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Walpurgis_Night' },

        // ==== MAY ====

        { month:5,  day:1,
          name:"Beltane / International Workers' Day",
          localName:"Beltane · Fête du Travail · Día del Trabajo · Tag der Arbeit · Dia do Trabalho · Święto Pracy / International Workers' Day",
          significance:"Pagan cross-quarter sabbat of fire and fertility. Also Fête du Travail · Día del Trabajo · Giornata del Lavoro — public holiday across France, Germany, Spain, Portugal, Poland, Philippines, Mexico, Brazil, and Argentina.",
          iconKey:'pagan', effect:'beltane', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Beltane' },

        { month:5,  day:3,
          name:"Constitution Day",
          localName:"Święto Konstytucji 3 Maja / Polish Constitution Day",
          significance:"Święto Konstytucji upamiętnia uchwalenie Konstytucji 3 maja 1791 r. — jednej z pierwszych nowoczesnych konstytucji na świecie. / Polish Constitution Day commemorates the 1791 Constitution, one of the world's first modern constitutions.",
          iconKey:'pl', effect:'pl_flag', country:'PL',
          wiki:'https://en.wikipedia.org/wiki/Constitution_Day_(Poland)' },

        { month:5,  day:5,
          name:"Cinco de Mayo",
          significance:"El Cinco de Mayo conmemora la victoria del Ejército mexicano sobre las tropas francesas en la Batalla de Puebla de 1862. / Cinco de Mayo marks Mexico's 1862 victory over French forces at the Battle of Puebla.",
          iconKey:'mx', effect:'mx_flag', country:'MX,US',
          wiki:'https://en.wikipedia.org/wiki/Cinco_de_Mayo' },

        { month:5,  day:8,
          name:"Victory in Europe Day",
          localName:"Fête de la Victoire · Tag der Befreiung / Victory in Europe Day",
          significance:"Le 8 mai 1945 marque la capitulation de l'Allemagne nazie — fête nationale en France. Der 8. Mai: Tag der Befreiung. / May 8, 1945: Nazi Germany's surrender — national holiday in France.",
          iconKey:'fr', effect:'fr_flag', country:'FR,DE,NL',
          wiki:'https://en.wikipedia.org/wiki/Victory_in_Europe_Day' },

        { month:5,  day:12,
          name:"Vesak — Buddha Day",
          localName:"Visākha Pūjā · वेसाक / Vesak (Buddha Day)",
          significance:"Visākha Pūjā — birth, Enlightenment, and parinibbāna of the Buddha observed on the full moon of Vaisakha. / The holiest day in Buddhism — celebrated with lanterns, processions, and generosity. (~2025 date)",
          iconKey:'buddhist', effect:'vesak', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Vesak' },

        { month:5,  day:17,
          name:'IDAHOBIT',
          significance:'International Day Against Homophobia, Biphobia, and Transphobia — marks the 1990 WHO decision to declassify homosexuality as a mental illness.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/International_Day_Against_Homophobia,_Biphobia_and_Transphobia' },

        { month:5,  day:19,
          name:"Victoria Day",
          localName:"Fête de la Reine / Victoria Day",
          significance:"La Fête de la Reine honore l'anniversaire de la Reine Victoria — dernier lundi avant le 25 mai. / Victoria Day honors Queen Victoria's birthday — held on the last Monday before May 25.",
          iconKey:'ca', effect:'ca_flag', country:'CA',
          wiki:'https://en.wikipedia.org/wiki/Victoria_Day' },

        { month:5,  day:25,
          name:"May Revolution Day",
          localName:"Día de la Revolución de Mayo / May Revolution Day",
          significance:"El 25 de Mayo de 1810, Argentina formó su primera junta de gobierno propia — primer paso hacia la independencia. / On May 25, 1810, Argentina formed its first self-governing council — the first step toward independence.",
          iconKey:'ar', effect:'ar_flag', country:'AR',
          wiki:'https://en.wikipedia.org/wiki/May_Revolution' },

        // ==== JUNE ====

        { month:6,  day:1,
          name:"Shavuot",
          localName:"שָׁבוּעוֹת / Shavuot (Festival of Weeks)",
          significance:"שבועות חוגג את מתן התורה בהר סיני — מאכלי חלב ולימוד תורה כל הלילה. / Shavuot celebrates the giving of the Torah at Mount Sinai — dairy foods and all-night Torah study. (~6 Sivan)",
          iconKey:'jewish', effect:'rosh', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Shavuot' },

        { month:6,  day:7,
          name:"Eid al-Adha",
          localName:"عيد الأضحى / Eid al-Adha (Festival of Sacrifice)",
          significance:"عيد الأضحى يُحيي ذكرى استعداد سيدنا إبراهيم للتضحية — صلاة وتوزيع الأضاحي والصدقات. / Eid al-Adha honors Ibrahim's willingness to sacrifice — prayers, sharing of meat, and charity. (~10 Dhul Hijja)",
          iconKey:'islam', effect:'eid', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Eid_al-Adha' },

        { month:6,  day:10,
          name:"Portugal Day",
          localName:"Dia de Portugal, de Camões e das Comunidades Portuguesas / Portugal Day",
          significance:"Dia de Portugal celebra a língua e cultura portuguesas na data da morte de Luís de Camões. / Portugal Day celebrates the Portuguese language and culture on the anniversary of poet Luís de Camões' death.",
          iconKey:'pt', effect:'pt_flag', country:'PT',
          wiki:'https://en.wikipedia.org/wiki/Portugal_Day' },

        { month:6,  day:12,
          name:"Philippine Independence Day",
          localName:"Araw ng Kalayaan / Independence Day",
          significance:"Ang Araw ng Kalayaan ay naggunita ng pagpapahayag ng kalayaan ng Pilipinas mula sa Espanya noong 1898. / Independence Day marks the 1898 declaration of independence from Spain.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/Philippine_Independence_Day' },

        { month:6,  day:19,
          name:"Juneteenth",
          significance:"U.S. federal holiday marking June 19, 1865, when enslaved people in Texas were finally informed of their freedom — two years after the Emancipation Proclamation.",
          iconKey:'us', effect:'us_flag', country:'US',
          wiki:'https://en.wikipedia.org/wiki/Juneteenth' },

        { month:6,  day:20,
          name:"Flag Day",
          localName:"Día de la Bandera / Flag Day",
          significance:"El Día de la Bandera honra al General Manuel Belgrano, creador de la bandera argentina, en el aniversario de su muerte en 1820. / Flag Day honors General Belgrano, creator of the Argentine flag, on the anniversary of his death.",
          iconKey:'ar', effect:'ar_flag', country:'AR',
          wiki:'https://en.wikipedia.org/wiki/Flag_of_Argentina' },

        { month:6,  day:21,
          name:"Litha — Summer Solstice",
          significance:"Neopagan sabbat at the longest day of the year — bonfires, solar energy, and midsummer celebration. Approximate date (solstice falls Jun 20–21).",
          iconKey:'pagan', effect:'litha', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Midsummer' },

        { month:6,  day:26,
          name:"Islamic New Year",
          localName:"رأس السنة الهجرية / Islamic New Year (1 Muharram)",
          significance:"رأس السنة الهجرية يُحيي ذكرى هجرة النبي محمد ﷺ من مكة إلى المدينة المنورة. / Islamic New Year marks the Prophet Muhammad's migration from Mecca to Medina. Date shifts yearly with the lunar calendar.",
          iconKey:'islam', effect:'ramadan', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Islamic_New_Year' },

        { month:6,  day:28,
          name:'Global LGBTQ+ Pride Day',
          significance:'The anchor day of the community, marking the anniversary of the 1969 Stonewall Uprising in New York City.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Stonewall_riots' },

        // ==== JULY ====

        { month:7,  day:1,
          name:"Canada Day",
          localName:"Fête du Canada / Canada Day",
          significance:"La Fête du Canada célèbre l'Acte de l'Amérique du Nord britannique de 1867 qui a uni les provinces en Dominion. / Canada Day celebrates the 1867 Constitution Act that united the provinces.",
          iconKey:'ca', effect:'ca_flag', country:'CA',
          wiki:'https://en.wikipedia.org/wiki/Canada_Day' },

        { month:7,  day:4,
          name:"Independence Day",
          significance:"U.S. national holiday marking the 1776 Declaration of Independence — fireworks, parades, and barbecues nationwide.",
          iconKey:'us', effect:'us_flag', country:'US',
          wiki:'https://en.wikipedia.org/wiki/Independence_Day_(United_States)' },

        { month:7,  day:9,
          name:"Argentine Independence Day",
          localName:"Día de la Independencia / Independence Day",
          significance:"El 9 de Julio de 1816 se proclamó la independencia de las Provincias Unidas del Río de la Plata de España. / On July 9, 1816, independence from Spain was declared for the United Provinces of the Río de la Plata.",
          iconKey:'ar', effect:'ar_flag', country:'AR',
          wiki:'https://en.wikipedia.org/wiki/Argentine_Declaration_of_Independence' },

        { month:7,  day:14,
          name:"Bastille Day",
          localName:"Fête Nationale / Bastille Day",
          significance:"Le 14 juillet commémore la prise de la Bastille en 1789 — défilé militaire sur les Champs-Élysées et feux d'artifice. / July 14 marks the 1789 storming of the Bastille — military parade on the Champs-Élysées and fireworks.",
          iconKey:'fr', effect:'fr_flag', country:'FR',
          wiki:'https://en.wikipedia.org/wiki/Bastille_Day' },

        { month:7,  day:14,
          name:"International Non-Binary People's Day",
          significance:'Raising awareness and celebrating people who identify outside the traditional gender binary.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Non-binary_gender' },

        // ==== AUGUST ====

        { month:8,  day:1,
          name:"Lughnasadh / Lammas",
          significance:"Neopagan first-harvest sabbat honoring the Celtic god Lugh — grain festivals, games, and thanksgiving for summer's bounty.",
          iconKey:'pagan', effect:'lughnasadh', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Lughnasadh' },

        { month:8,  day:15,
          name:"Assumption of Mary",
          localName:"Assomption · Himmelfahrt Mariä · Wniebowzięcie · Assunção / Assumption of Mary",
          significance:"L'Assomption célèbre l'élévation corporelle de la Vierge Marie au Ciel — fête nationale en France, Allemagne, Portugal, Pologne. / Catholic feast of Mary's bodily assumption into Heaven — public holiday across Catholic Europe.",
          iconKey:'christian', effect:'all_saints', country:'FR,DE,PT,PL,ES,IT,BE',
          wiki:'https://en.wikipedia.org/wiki/Assumption_of_Mary' },

        { month:8,  day:21,
          name:"Ninoy Aquino Day",
          localName:"Araw ni Ninoy Aquino / Ninoy Aquino Day",
          significance:"Ang Araw ni Ninoy Aquino ay nagpaparangal sa buhay at pagkamartir ni Senator Benigno Aquino Jr. noong Agosto 21, 1983. / Ninoy Aquino Day honors the life and martyrdom of Senator Benigno Aquino Jr. on August 21, 1983.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/Benigno_Aquino_Jr.' },

        { month:8,  day:27,
          name:"Ganesh Chaturthi",
          localName:"गणेश चतुर्थी / Ganesh Chaturthi",
          significance:"गणेश चतुर्थी भगवान गणेश के जन्म का पर्व है — मूर्तियाँ, जुलूस और विसर्जन। / Ganesh Chaturthi celebrates Lord Ganesha's birth — clay statues, processions, and immersion ceremonies over 10 days.",
          iconKey:'hindu', effect:'hindu', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Ganesh_Chaturthi' },

        // ==== SEPTEMBER ====

        { month:9,  day:4,
          name:"Mawlid al-Nabi",
          localName:"المولد النبوي / Mawlid al-Nabi (Prophet's Birthday)",
          significance:"المولد النبوي الشريف يُحتفل بذكرى مولد النبي محمد ﷺ — صلوات ومواكب وأعمال خيرية. / Mawlid al-Nabi marks the Prophet Muhammad's birthday — prayers, processions, and charitable acts.",
          iconKey:'islam', effect:'ramadan', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Mawlid' },

        { month:9,  day:7,
          name:"Brazilian Independence Day",
          localName:"Dia da Independência / Brazilian Independence Day",
          significance:"Em 7 de setembro de 1822, Dom Pedro I proclamou a Independência do Brasil de Portugal — Independência ou Morte! / On September 7, 1822, Dom Pedro I declared Brazil's independence from Portugal.",
          iconKey:'br', effect:'br_flag', country:'BR',
          wiki:'https://en.wikipedia.org/wiki/Brazilian_Independence_Day' },

        { month:9,  day:16,
          name:"Mexican Independence Day",
          localName:"Día de la Independencia / Mexican Independence Day",
          significance:"¡El 16 de septiembre México celebra su independencia con el Grito de Independencia! La guerra de independencia comenzó en 1810. / Mexico celebrates with the Grito de Independencia! The War of Independence began in 1810.",
          iconKey:'mx', effect:'mx_flag', country:'MX',
          wiki:'https://en.wikipedia.org/wiki/Mexican_War_of_Independence' },

        { month:9,  day:22,
          name:"Rosh Hashanah — Jewish New Year",
          localName:"ראש השנה / Rosh Hashanah (Jewish New Year)",
          significance:"ראש השנה הוא ראש השנה היהודי — תפילה, חשבון נפש ותקיעת שופר. / Rosh Hashanah is the Jewish New Year — prayer, reflection, and the sounding of the shofar. (~1 Tishrei)",
          iconKey:'jewish', effect:'rosh', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Rosh_Hashanah' },

        { month:9,  day:23,
          name:"Mabon — Autumn Equinox",
          significance:"Neopagan sabbat at the autumnal equinox — thanksgiving for the harvest, balance of light and dark. Approximate date (equinox falls Sep 22–23).",
          iconKey:'pagan', effect:'mabon', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Mabon_(Neopaganism)' },

        { month:9,  day:23,
          name:'Celebrate Bisexuality Day',
          significance:'Recognizing and celebrating bisexual history, culture, and community.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Celebrate_Bisexuality_Day' },

        // ==== OCTOBER ====

        { month:10, day:1,
          name:"Yom Kippur — Day of Atonement",
          localName:"יוֹם כִּפּוּר / Yom Kippur (Day of Atonement)",
          significance:"יום כיפור הוא היום הקדוש ביותר בשנה היהודית — צום של 25 שעות ותפילה עמוקה. / Yom Kippur is the holiest Jewish day — a 25-hour fast and intense prayer. (~10 Tishrei)",
          iconKey:'jewish', effect:'yom_kippur', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Yom_Kippur' },

        { month:10, day:3,
          name:"German Unity Day",
          localName:"Tag der Deutschen Einheit / German Unity Day",
          significance:"Der Tag der Deutschen Einheit erinnert an die Wiedervereinigung Deutschlands am 3. Oktober 1990. / German Unity Day marks the reunification of East and West Germany on October 3, 1990.",
          iconKey:'de', effect:'de_flag', country:'DE',
          wiki:'https://en.wikipedia.org/wiki/German_Unity_Day' },

        { month:10, day:5,
          name:"Republic Day",
          localName:"Dia da República / Republic Day (Portugal)",
          significance:"O Dia da República comemora a proclamação da República Portuguesa em 5 de outubro de 1910, pondo fim à monarquia. / Republic Day marks the 1910 proclamation of the Portuguese Republic, ending the monarchy.",
          iconKey:'pt', effect:'pt_flag', country:'PT',
          wiki:'https://en.wikipedia.org/wiki/Portuguese_First_Republic' },

        { month:10, day:6,
          name:"Sukkot",
          localName:"סוּכּוֹת / Sukkot (Feast of Tabernacles)",
          significance:"סוכות הוא חג האסיף — שבעה ימים של אכילה בסוכה וארבעת המינים. / Sukkot is the harvest festival — seven days of meals in a sukkah and the four species. (~15 Tishrei)",
          iconKey:'jewish', effect:'sukkot', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Sukkot' },

        { month:10, day:11,
          name:'National Coming Out Day',
          significance:'Celebrating the personal act of coming out as a form of civil rights advocacy.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/National_Coming_Out_Day' },

        { month:10, day:12,
          name:"National Day / Día de la Raza / Our Lady of Aparecida",
          localName:"Fiesta Nacional · Día de la Raza · Nossa Senhora Aparecida / National Day · Day of Diversity · Our Lady of Aparecida",
          significance:"España: Fiesta Nacional de España. México/Argentina: Día de la Diversidad Cultural. Brasil: Nossa Senhora Aparecida — feriado nacional. / Spain: National Day. Mexico/Argentina: Day of Cultural Diversity. Brazil: Our Lady of Aparecida.",
          iconKey:'es', effect:'es_flag', country:'ES,MX,AR,BR',
          wiki:'https://en.wikipedia.org/wiki/Columbus_Day' },

        { month:10, day:13,
          name:"Thanksgiving",
          localName:"Action de grâce / Thanksgiving",
          significance:"L'Action de grâce canadienne est célébrée le deuxième lundi d'octobre — repas en famille et gratitude pour la récolte. / Canadian Thanksgiving is held on the second Monday of October — family meals and harvest gratitude.",
          iconKey:'ca', effect:'ca_flag', country:'CA',
          wiki:'https://en.wikipedia.org/wiki/Thanksgiving_(Canada)' },

        { month:10, day:20,
          name:"Diwali — Festival of Lights",
          localName:"दीपावली / Diwali (Festival of Lights)",
          significance:"दीपावली प्रकाश का त्योहार है — अंधकार पर प्रकाश की विजय, दीये, पटाखे और मिठाइयाँ। / Diwali is the Festival of Lights celebrating the triumph of light over darkness — oil lamps, fireworks, and sweets.",
          iconKey:'hindu', effect:'diwali', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Diwali' },

        { month:10, day:26,
          name:'Intersex Awareness Day',
          significance:'Highlights human rights issues faced by intersex individuals worldwide.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Intersex_Awareness_Day' },

        { month:10, day:31,
          name:"Samhain / Halloween",
          significance:"Gaelic festival marking summer's end and the thinning of the veil between worlds. Also the highest Satanic high holiday (both Church of Satan and The Satanic Temple). Costumes, carved pumpkins, and trick-or-treating.",
          iconKey:'pagan', effect:'samhain', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Samhain' },

        // ==== NOVEMBER ====

        { month:11, day:1,
          name:"All Saints' Day / Día de Muertos",
          localName:"Toussaint · Todos los Santos · Wszystkich Świętych · Día de Muertos / All Saints' Day · Day of the Dead",
          significance:"Toussaint honore tous les saints. En México, el Día de Muertos — familias honran a sus difuntos con altares y flores de cempasúchil. / All Saints honors all saints; in Mexico, Day of the Dead honors deceased relatives with altars and marigolds.",
          iconKey:'christian', effect:'all_saints', country:'All',
          wiki:'https://en.wikipedia.org/wiki/All_Saints%27_Day' },

        { month:11, day:5,
          name:"Bonfire Night",
          localName:"Guy Fawkes Night / Bonfire Night",
          significance:"British tradition commemorating the foiling of the 1605 Gunpowder Plot — bonfires, fireworks, and burning effigies of Guy Fawkes.",
          iconKey:'gb', effect:'gb_flag', country:'GB',
          wiki:'https://en.wikipedia.org/wiki/Guy_Fawkes_Night' },

        { month:11, day:11,
          name:"Veterans / Armistice / Remembrance / Independence Day",
          localName:"Jour du Souvenir · Remembrance Day · Dzień Niepodległości / Armistice Day · Remembrance Day · Independence Day",
          significance:"US: Veterans Day. France — Armistice: La guerre 1914–18 se termina le 11 novembre 1918. Poland — Dzień Niepodległości: odzyskanie niepodległości w 1918 r. / France: Armistice Day (WWI). Poland: National Independence Day (1918). CA/UK: Remembrance Day.",
          iconKey:'us', effect:'multi_eu', country:'US,FR,CA,GB,PL',
          wiki:'https://en.wikipedia.org/wiki/Armistice_Day' },

        { month:11, day:15,
          name:"Republic Day",
          localName:"Proclamação da República / Republic Day (Brazil)",
          significance:"Em 15 de novembro de 1889, foi proclamada a República dos Estados Unidos do Brasil, pondo fim ao Império. / On November 15, 1889, the Brazilian Republic was proclaimed, ending the Empire.",
          iconKey:'br', effect:'br_flag', country:'BR',
          wiki:'https://en.wikipedia.org/wiki/Proclamation_of_the_Republic_(Brazil)' },

        { month:11, day:20,
          name:'Transgender Day of Remembrance',
          significance:'A solemn vigil honoring the memory of transgender people lost to anti-transgender violence.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Transgender_Day_of_Remembrance' },

        { month:11, day:20,
          name:"Revolution Day",
          localName:"Día de la Revolución / Revolution Day (Mexico)",
          significance:"El Día de la Revolución conmemora el inicio de la Revolución Mexicana de 1910, liderada por Francisco I. Madero. / Revolution Day marks the start of the 1910 Mexican Revolution led by Francisco I. Madero.",
          iconKey:'mx', effect:'mx_flag', country:'MX',
          wiki:'https://en.wikipedia.org/wiki/Mexican_Revolution' },

        { month:11, day:27,
          name:"Thanksgiving",
          significance:"U.S. Thanksgiving — held on the fourth Thursday of November, celebrating the harvest and giving thanks with family meals.",
          iconKey:'us', effect:'us_flag', country:'US',
          wiki:'https://en.wikipedia.org/wiki/Thanksgiving_(United_States)' },

        { month:11, day:30,
          name:"Bonifacio Day",
          localName:"Araw ni Gat Andres Bonifacio / Bonifacio Day",
          significance:"Ang Araw ni Andres Bonifacio ay nagpaparangal sa tagapagtatag ng Katipunan na naglunsad ng rebolusyon laban sa Espanya. / Bonifacio Day honors the founder of the Katipunan revolutionary movement against Spanish colonial rule.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/Andres_Bonifacio' },

        // ==== DECEMBER ====

        { month:12, day:1,
          name:"Independence Restoration Day",
          localName:"Dia da Restauração da Independência / Independence Restoration Day",
          significance:"O Dia da Restauração da Independência celebra o fim do domínio espanhol sobre Portugal em 1640. / Independence Restoration Day marks the 1640 end of Spanish rule over Portugal.",
          iconKey:'pt', effect:'pt_flag', country:'PT',
          wiki:'https://en.wikipedia.org/wiki/Portuguese_Restoration_War' },

        { month:12, day:6,
          name:"Constitution Day",
          localName:"Día de la Constitución Española / Spanish Constitution Day",
          significance:"El Día de la Constitución conmemora la Constitución de 1978, que restauró la democracia en España tras la dictadura de Franco. / Constitution Day marks the 1978 Constitution that restored democracy after Franco's dictatorship.",
          iconKey:'es', effect:'es_flag', country:'ES',
          wiki:'https://en.wikipedia.org/wiki/Constitution_of_Spain' },

        { month:12, day:8,
          name:"Bodhi Day / Immaculate Conception",
          localName:"成道会 (Jōdō-e) · Inmaculada Concepción / Bodhi Day · Immaculate Conception",
          significance:"仏教: 成道会は仏陀が菩提樹の下で悟りを開かれたことを記念します。Católicos: La Inmaculada Concepción de María — feriado en España, Argentina y Portugal. / Buddhism: Buddha's enlightenment. Catholic: Immaculate Conception of Mary.",
          iconKey:'buddhist', effect:'bodhi', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Bodhi_Day' },

        { month:12, day:8,
          name:'Pansexual Pride Day',
          significance:'Celebrating the pansexual and omnisexual community.',
          iconKey:'lgbtq_rainbow', effect:'rainbow', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Pansexuality' },

        { month:12, day:14,
          name:"Hanukkah begins",
          localName:"חֲנֻכָּה / Hanukkah (Festival of Lights)",
          significance:"חנוכה הוא חג האורות — שמונה לילות של הדלקת נרות לזכר נס פך השמן במקדש. / Hanukkah is the Festival of Lights — eight nights of candle-lighting commemorating the miracle of the Temple oil. (~25 Kislev)",
          iconKey:'hanukkah', effect:'hanukkah', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Hanukkah' },

        { month:12, day:21,
          name:"Yule — Winter Solstice",
          significance:"Neopagan sabbat at the longest night — the rebirth of the Sun God, Yule logs, candles, and the triumph of light returning. Approximate date (solstice falls Dec 21–22).",
          iconKey:'pagan', effect:'yule', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Yule' },

        { month:12, day:24,
          name:"Christmas Eve",
          localName:"Nochebuena · Heiligabend · Réveillon de Noël · Vigília do Natal · Wigilia / Christmas Eve",
          significance:"Nochebuena en España y Latinoamérica, Heiligabend en Alemania, Wigilia en Polonia — la víspera de Navidad es la celebración principal en muchos países. / Christmas Eve is the primary celebration in Germany, Poland, Spain, and Latin America.",
          iconKey:'christmas', effect:'christmas', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Christmas_Eve' },

        { month:12, day:25,
          name:"Christmas / Sol Invictus",
          localName:"Navidad · Noël · Weihnachten · Natal · Boże Narodzenie · Pasko / Christmas",
          significance:"Frohe Weihnachten! Joyeux Noël! Feliz Navidad! Feliz Natal! — Christian celebration of Christ's birth; also Sol Invictus (The Satanic Temple). Shared national holiday worldwide.",
          iconKey:'christmas', effect:'christmas', country:'All',
          wiki:'https://en.wikipedia.org/wiki/Christmas' },

        { month:12, day:26,
          name:"Boxing Day",
          localName:"Lá Fhéile Stiofáin · Lendemain de Noël / St Stephen's Day · Boxing Day",
          significance:"Public holiday in the UK, Canada, Australia, and Ireland — originally for giving Christmas boxes to the poor; now associated with shopping sales and sports.",
          iconKey:'gb', effect:'gb_flag', country:'GB,CA,AU,IE',
          wiki:'https://en.wikipedia.org/wiki/Boxing_Day' },

        { month:12, day:30,
          name:"Rizal Day",
          localName:"Araw ni Dr. Jose Rizal / Rizal Day",
          significance:"Ang Araw ni Rizal ay nagpaparangal sa pagkamartir ni Dr. José Rizal noong 1896 — pambansang bayani at manunulat na nagbigay-inspirasyon sa kalayaan ng Pilipinas. / Rizal Day honors Dr. José Rizal, national hero executed in 1896 for inspiring Philippine independence.",
          iconKey:'ph', effect:'ph_flag', country:'PH',
          wiki:'https://en.wikipedia.org/wiki/Jose_Rizal' },

        { month:12, day:31,
          name:"New Year's Eve",
          localName:"Nochevieja · Silvester · Saint-Sylvestre · Réveillon · Sylwester / New Year's Eve",
          significance:"The last night of the year — fireworks, countdowns, and celebrations worldwide to welcome the New Year.",
          iconKey:'new_year', effect:'new_year', country:'All',
          wiki:'https://en.wikipedia.org/wiki/New_Year%27s_Eve' },

    ];

    // Simple hash → consistent pseudo-random index 0…(n-1)
    function _hashStringToColorIdx(str, n) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
        return Math.abs(h) % (n || 6);
    }

    // Get the 2-letter country code for a username DOM element.
    // Primary source: settings.users[u].country — set by the add_user socket listener
    // from the authoritative server payload (no DOM scraping needed).
    // Falls back to flag images for users who joined before the listener was active.
    function _getUserCountryCode(el) {
        // 1. Look up from unified user store (populated by add_user listener).
        const username = lc(el.getAttribute('username') || el.textContent.trim());
        if (username) {
            const cc = getUser(username).country;
            if (cc) return cc.toUpperCase();
        }
        // 2. Explicit data attribute.
        let cc = el.getAttribute('data-cc');
        if (cc) return cc.toUpperCase();
        // 3. DOM flag image fallback.
        let parent = el;
        for (let i = 0; i < 5; i++) {
            if (!parent) break;
            const flagImg = parent.querySelector('img[src*="/flags/"]');
            if (flagImg) {
                cc = flagImg.getAttribute('title') || flagImg.getAttribute('alt');
                if (cc) return cc.toUpperCase();
            }
            parent = parent.parentElement;
        }
        return '';
    }

    function _holidayAppliesToCountry(holiday, userCountryCode) {
        if (holiday.country === 'All') return true;
        if (!userCountryCode) return false;
        return holiday.country.split(',').map(function(c) { return c.trim().toUpperCase(); })
            .indexOf(userCountryCode) > -1;
    }

    // Returns today's date as 'YYYY-MM-DD' in US Eastern Time.
    function _etDateStr() {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    }

    function _etMonthDay() {
        const s = new Date().toLocaleDateString('en-US', {
            timeZone: 'America/New_York', month: 'numeric', day: 'numeric'
        });
        const parts = s.split('/');
        return { month: parseInt(parts[0], 10), day: parseInt(parts[1], 10) };
    }

    function getTodayHoliday() {
        const { month, day } = _etMonthDay();
        return HOLIDAYS.find(function(h) { return h.month === month && h.day === day; }) || null;
    }

    // "Disable for today" state is persisted to GM storage keyed by ET date,
    // so it survives login/logout and resets automatically at midnight ET.
    function _isHolidayDismissed() { return settings.holidayDismissed === _etDateStr(); }
    function _dismissHoliday()     { saveSetting('holidayDismissed', _etDateStr()); }
    function _enableHoliday()      { saveSetting('holidayDismissed', ''); }

    // ---- Username color effect ----

    let _holidayNickObserver = null;
    let _currentHoliday = null;

    function _applyRainbowToEl(el) {
        if (el.dataset.ptHoliday) return;
        if (!_currentHoliday) return;
        const username = (el.getAttribute('username') || el.textContent || '').trim().toLowerCase();
        const userCC = _getUserCountryCode(el);
        if (!_holidayAppliesToCountry(_currentHoliday, userCC)) return;

        const colors = EFFECTS[_currentHoliday.effect] || EFFECTS.rainbow;
        const n = colors.length;
        const startIdx = _hashStringToColorIdx(username, n);

        const bSpans = el.querySelectorAll('[class^="b"]');
        if (bSpans.length > 0) {
            bSpans.forEach(function(sp, i) {
                if (!sp.dataset.ptOrigColor) sp.dataset.ptOrigColor = sp.style.color;
                sp.style.color = colors[(startIdx + i) % n];
            });
            el.dataset.ptHoliday = 'override';
            return;
        }

        el.dataset.ptOrigHtml = el.innerHTML;
        const frag = document.createDocumentFragment();
        let ci = 0;
        Array.from(el.childNodes).forEach(function(node) {
            if (node.nodeType === 3) {
                Array.from(node.textContent).forEach(function(ch) {
                    if (/\s/.test(ch)) {
                        frag.appendChild(document.createTextNode(ch));
                    } else {
                        const sp = document.createElement('span');
                        sp.className = 'pt-rbc';
                        sp.style.color = colors[(startIdx + ci) % n];
                        sp.textContent = ch;
                        frag.appendChild(sp);
                        ci++;
                    }
                });
            } else {
                frag.appendChild(node.cloneNode(true));
            }
        });
        el.innerHTML = '';
        el.appendChild(frag);
        el.dataset.ptHoliday = 'wrap';
    }

    function _removeRainbowFromEl(el) {
        if (!el.dataset.ptHoliday) return;
        if (el.dataset.ptHoliday === 'override') {
            el.querySelectorAll('[class^="b"]').forEach(function(sp) {
                sp.style.color = sp.dataset.ptOrigColor || '';
                delete sp.dataset.ptOrigColor;
            });
        } else if (el.dataset.ptHoliday === 'wrap' && el.dataset.ptOrigHtml !== undefined) {
            el.innerHTML = el.dataset.ptOrigHtml;
            delete el.dataset.ptOrigHtml;
        }
        delete el.dataset.ptHoliday;
    }

    function _applyRainbowAll()  { document.querySelectorAll('.nick, .username').forEach(_applyRainbowToEl); }

    function _startRainbowObserver() {
        if (_holidayNickObserver) return;
        _holidayNickObserver = new MutationObserver(function(muts) {
            muts.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    if (node.classList.contains('nick') || node.classList.contains('username')) _applyRainbowToEl(node);
                    if (node.querySelectorAll) node.querySelectorAll('.nick, .username').forEach(_applyRainbowToEl);
                });
            });
        });
        _holidayNickObserver.observe(document.body, { childList: true, subtree: true });
    }

    function _stopRainbowObserver() {
        if (_holidayNickObserver) { _holidayNickObserver.disconnect(); _holidayNickObserver = null; }
    }

    function _applyHolidayEffect(holiday) {
        if (!holiday || !holiday.effect) return;
        if (!settings.holidayEffectEnabled) return; // color effects globally disabled
        _currentHoliday = holiday;
        _applyRainbowAll();
        _startRainbowObserver();
    }

    function _removeHolidayEffect(holiday) {
        if (!holiday) return;
        _currentHoliday = null;
        _stopRainbowObserver();
        document.querySelectorAll('.nick[data-pt-holiday], .username[data-pt-holiday]').forEach(_removeRainbowFromEl);
    }

    // ---- Badge + tooltip ----

    function _buildHolidayTooltip(holiday, iconLi) {
        const tip = document.createElement('div');
        tip.id = 'pt-holiday-tip';
        const btnText = _isHolidayDismissed() ? 'Enable' : 'Disable for today';
        var _titleParts = (holiday.localName || holiday.name).split(' / ');
        let html = '<div class="pt-htip-title">' + _titleParts.map(function(p) { return escapeHtml(p.trim()); }).join('<br>') + '</div>';
        var _descParts = (holiday.significance || '').split(' / ');
        html += '<div class="pt-htip-desc">' + _descParts.map(function(p) { return escapeHtml(p.trim()); }).join('<br><br>') + '</div>';
        html += '<div class="pt-htip-footer">';
        if (holiday.wiki) {
            html += '<a class="pt-htip-wiki" href="' + escapeHtml(holiday.wiki) + '" target="_blank" rel="noopener">Wikipedia →</a>';
        }
        html += '<button id="pt-holiday-toggle-btn">' + btnText + '</button>';
        html += '</div>';
        tip.innerHTML = html;
        document.body.appendChild(tip);

        const btn = tip.querySelector('#pt-holiday-toggle-btn');
        btn.addEventListener('click', function() {
            if (_isHolidayDismissed()) {
                _enableHoliday();
                _applyHolidayEffect(holiday);
                iconLi.classList.remove('pt-holiday-disabled');
                btn.textContent = 'Disable for today';
            } else {
                _dismissHoliday();
                _removeHolidayEffect(holiday);
                iconLi.classList.add('pt-holiday-disabled');
                btn.textContent = 'Enable';
            }
        });
        return tip;
    }

    function removeHolidayBadge() {
        const li = document.getElementById('pt-holiday-nav');
        if (li) li.remove();
        const tip = document.getElementById('pt-holiday-tip');
        if (tip) tip.remove();
    }

    function installHolidayBadge() {
        const holiday = getTodayHoliday();
        if (!holiday) return;

        function tryInject() {
            const gear = document.getElementById('pt-gear-nav');
            if (!gear || document.getElementById('pt-holiday-nav')) return false;

            const li = document.createElement('li');
            li.id = 'pt-holiday-nav';
            if (_isHolidayDismissed()) li.classList.add('pt-holiday-disabled');

            const iconSpan = document.createElement('span');
            iconSpan.id = 'pt-holiday-icon';
            const _ik = holiday.iconKey || '';
            if (/^[a-z]{2}$/.test(_ik)) {
                const _fi = document.createElement('img');
                _fi.src = (W.PT_ICONS && W.PT_ICONS.flags && W.PT_ICONS.flags[_ik])
                    || ('https://flagcdn.com/w40/' + _ik + '.png');
                _fi.style.cssText = 'height:20px;width:auto;vertical-align:middle;border-radius:1px';
                _fi.alt = _ik.toUpperCase();
                _fi.onerror = function() { iconSpan.textContent = _ik.toUpperCase(); };
                iconSpan.appendChild(_fi);
            } else {
                iconSpan.textContent = (W.PT_ICONS && W.PT_ICONS.holidays && W.PT_ICONS.holidays[_ik]) || '\u{1F3F3}️‍\u{1F308}';
            }
            li.appendChild(iconSpan);

            gear.insertAdjacentElement('afterend', li);
            const tip = _buildHolidayTooltip(holiday, li);

            iconSpan.addEventListener('mouseenter', function() {
                const r = li.getBoundingClientRect();
                tip.style.top   = (r.bottom + 8) + 'px';
                tip.style.right = (window.innerWidth - r.right) + 'px';
                tip.classList.add('pt-htip-visible');
            });
            iconSpan.addEventListener('mouseleave', function() {
                setTimeout(function() { if (!tip.matches(':hover')) tip.classList.remove('pt-htip-visible'); }, 150);
            });
            tip.addEventListener('mouseleave', function() { tip.classList.remove('pt-htip-visible'); });

            if (!_isHolidayDismissed()) _applyHolidayEffect(holiday);
            return true;
        }

        if (!tryInject()) {
            let attempts = 0;
            const t = setInterval(function() {
                attempts++;
                if (tryInject() || attempts > 120) clearInterval(t);
            }, 500);
        }
    }
