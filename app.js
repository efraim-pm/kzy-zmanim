// ===== Configuration =====
const CONFIG = {
  lat: 41.0903,
  lon: -74.0484,
  tzid: 'America/New_York',
  locationName: 'Chestnut Ridge, NY',
  shachrisWeekday: ['6:45 AM', '7:30 AM'],
  shachrisRC: '6:30 AM',
  shachrisSunHoliday: '8:45 AM',
  shachrisShabbos: '8:30 AM',
  mincha145: '1:45 PM',
  mincha1245: '12:45 PM',
  mincha115: '1:15 PM',
  minchaShabbosA: '2:15 PM',
  minchaShabbosB_summer: '6:15 PM',
  minchaBeforeShkiah: 15,
  minchaBeforeShkiahShabbos: 40,
  maarivAfterShkiahShabbos: 55,
  maariv815: '8:15 PM',
  maariv945: '9:45 PM',
  summerCutoff: '6:55 PM',
  usHolidays: [
    '01-01','01-20','02-17','05-25','06-19','07-04','09-07','10-12','11-11','11-26','12-25'
  ]
};

const HEBREW_NUMERALS = {
  1:'א׳',2:'ב׳',3:'ג׳',4:'ד׳',5:'ה׳',6:'ו׳',7:'ז׳',8:'ח׳',9:'ט׳',10:'י׳',
  11:'י״א',12:'י״ב',13:'י״ג',14:'י״ד',15:'ט״ו',16:'ט״ז',17:'י״ז',18:'י״ח',
  19:'י״ט',20:'כ׳',21:'כ״א',22:'כ״ב',23:'כ״ג',24:'כ״ד',25:'כ״ה',
  26:'כ״ו',27:'כ״ז',28:'כ״ח',29:'כ״ט',30:'ל׳'
};

const HEBREW_MONTHS = [
  'Nisan','Iyar','Sivan','Tammuz','Av','Elul',
  'Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar II'
];
const HEBREW_MONTHS_HEB = {
  'Tishrei':'תשרי','Cheshvan':'חשון','Kislev':'כסלו','Tevet':'טבת',
  'Shevat':'שבט','Adar':'אדר','Adar II':'אדר ב׳','Nisan':'ניסן',
  'Iyar':'אייר','Sivan':'סיון','Tammuz':'תמוז','Av':'אב','Elul':'אלול'
};

function hebrewYearStr(year) {
  const letters = {
    1:'א',2:'ב',3:'ג',4:'ד',5:'ה',6:'ו',7:'ז',8:'ח',9:'ט',
    10:'י',20:'כ',30:'ל',40:'מ',50:'נ',60:'ס',70:'ע',80:'פ',90:'צ',
    100:'ק',200:'ר',300:'ש',400:'ת'
  };
  const hundreds = Math.floor((year % 1000) / 100);
  const tens = Math.floor((year % 100) / 10);
  const ones = year % 10;
  let str = '';
  if (hundreds) str += letters[hundreds * 100] || '';
  if (tens === 1 && ones === 5) str += 'ט״ו';
  else if (tens === 1 && ones === 6) str += 'ט״ז';
  else {
    if (tens) str += letters[tens * 10] || '';
    if (ones) str += letters[ones] || '';
    if (str.length > 1) str = str.slice(0, -1) + '״' + str.slice(-1);
    else if (str.length === 1) str += '׳';
  }
  return str;
}

// ===== API =====
const cache = {};
async function fetchJSON(url) {
  if (cache[url]) return cache[url];
  const resp = await fetch(url);
  const data = await resp.json();
  cache[url] = data;
  return data;
}

async function getZmanim(date) {
  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return fetchJSON(`https://www.hebcal.com/zmanim?cfg=json&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&date=${ds}`);
}

async function getHebrewDate(date) {
  return fetchJSON(`https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth()+1}&gd=${date.getDate()}&g2h=1`);
}

async function getHolidays(year, month) {
  return fetchJSON(`https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=on&mod=on`);
}

async function getParsha(date) {
  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  try {
    const data = await fetchJSON(`https://www.hebcal.com/shabbat?cfg=json&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&date=${ds}&M=on`);
    if (data.items) {
      const parsha = data.items.find(i => i.category === 'parashat');
      return { parsha: parsha ? parsha.title : null };
    }
  } catch(e) {}
  return { parsha: null };
}

// ===== Time Helpers =====
function parseTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = +m[1], mi = +m[2];
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return h * 60 + mi;
}

function minutesToTime(tot) {
  if (tot < 0) tot += 1440;
  if (tot >= 1440) tot -= 1440;
  let h = Math.floor(tot/60), m = tot%60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h > 12 ? h-12 : (h===0 ? 12 : h);
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}

function subtractMinutes(t, mins) { return minutesToTime(timeToMinutes(t) - mins); }
function addMinutes(t, mins) { return minutesToTime(timeToMinutes(t) + mins); }
function shortTime(t) { return t.replace(/\s*(AM|PM)/i,'').trim(); }

function isUSHoliday(date) {
  const md = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return CONFIG.usHolidays.includes(md);
}

// ===== Shabbos Mincha B Logic =====
function getShabbosMinchaBTime(shkiah) {
  if (!shkiah) return CONFIG.minchaShabbosB_summer;
  const shkiahMins = timeToMinutes(shkiah);
  const cutoffMins = timeToMinutes(CONFIG.summerCutoff);
  if (shkiahMins >= cutoffMins) {
    return CONFIG.minchaShabbosB_summer;
  } else {
    return subtractMinutes(shkiah, CONFIG.minchaBeforeShkiahShabbos);
  }
}

function isSummerSeason(shkiah) {
  if (!shkiah) return true;
  return timeToMinutes(shkiah) >= timeToMinutes(CONFIG.summerCutoff);
}

// ===== Holiday Helpers =====
const HEBREW_HOLIDAY_NAMES = {
  "Rosh Hashana":"ר״ה","Rosh Hashana I":"ר״ה א׳","Rosh Hashana II":"ר״ה ב׳",
  "Tzom Gedaliah":"צום גדליה","Erev Yom Kippur":"ערב יו״כ","Yom Kippur":"יום כיפור",
  "Erev Sukkot":"ערב סוכות","Sukkot I":"סוכות א׳","Sukkot II":"סוכות ב׳",
  "Sukkot III (CH''M)":"חוה״מ א׳","Sukkot IV (CH''M)":"חוה״מ ב׳",
  "Sukkot V (CH''M)":"חוה״מ ג׳","Sukkot VI (CH''M)":"חוה״מ ד׳",
  "Sukkot VII (Hoshana Raba)":"הושענא רבה",
  "Shmini Atzeret":"שמיני עצרת","Simchat Torah":"שמחת תורה",
  "Shabbat Shuva":"שבת שובה","Rosh Chodesh":"ר״ח",
  "Rosh Chodesh Cheshvan":"ר״ח חשון","Rosh Chodesh Kislev":"ר״ח כסלו",
  "Rosh Chodesh Tevet":"ר״ח טבת","Rosh Chodesh Shevat":"ר״ח שבט",
  "Rosh Chodesh Adar":"ר״ח אדר","Rosh Chodesh Nisan":"ר״ח ניסן",
  "Rosh Chodesh Iyar":"ר״ח אייר","Rosh Chodesh Sivan":"ר״ח סיון",
  "Rosh Chodesh Tammuz":"ר״ח תמוז","Rosh Chodesh Av":"ר״ח אב",
  "Rosh Chodesh Elul":"ר״ח אלול",
  "Chanukah":"חנוכה","Purim":"פורים","Pesach":"פסח","Shavuot":"שבועות",
  "Pesach I":"פסח א׳","Pesach II":"פסח ב׳","Pesach VII":"פסח ז׳","Pesach VIII":"פסח ח׳",
  "Shavuot I":"שבועות א׳","Shavuot II":"שבועות ב׳",
  "Ta'anit Esther":"תענית אסתר","Lag BaOmer":"ל״ג בעומר",
  "Tish'a B'Av":"ט׳ באב","Tu BiShvat":"ט״ו בשבט","Tu B'Av":"ט״ו באב"
};

const YOM_TOV_NAMES = new Set([
  'Rosh Hashana','Rosh Hashana I','Rosh Hashana II','Yom Kippur',
  'Sukkot I','Sukkot II','Shmini Atzeret','Simchat Torah',
  'Pesach I','Pesach II','Pesach VII','Pesach VIII',
  'Shavuot I','Shavuot II'
]);

let currentDate = new Date();
let currentHebrewMonth = null;
let holidayCache = {};

// ===== Davening Schedule =====
function buildDaveningSchedule(date, z, holidays, isRC) {
  const dow = date.getDay();
  const isShabbos = dow === 6;
  const isSunday = dow === 0;
  const isYomTov = holidays.some(h => YOM_TOV_NAMES.has(h));
  const isLegalHoliday = isUSHoliday(date);
  const shkiah = z.sunset ? parseTime(z.sunset) : null;
  const mg = z.minchaGedola ? parseTime(z.minchaGedola) : null;
  const tzais = z.tzeit85deg ? parseTime(z.tzeit85deg) : null;

  const weekday = [], shabbos = [];

  if (isShabbos || isYomTov) {
    shabbos.push({label:'Shachris',labelHeb:'שחרית',time:CONFIG.shachrisShabbos});
    shabbos.push({label:'Mincha א׳',labelHeb:'מנחה',time:CONFIG.minchaShabbosA});
    if (shkiah) {
      const minchaB = getShabbosMinchaBTime(shkiah);
      shabbos.push({label:'Mincha ב׳',labelHeb:'מנחה',time:minchaB});
      shabbos.push({label:'Shkiah',labelHeb:'שקיעה',time:shkiah,isShkiah:true});
      shabbos.push({label:'Maariv',labelHeb:'מעריב',time:addMinutes(shkiah,CONFIG.maarivAfterShkiahShabbos)});
    }
  }

  if (!isShabbos && !isYomTov) {
    if (isRC) {
      weekday.push({label:"Shachris א׳",labelHeb:'שחרית',time:CONFIG.shachrisRC,note:'Rosh Chodesh'});
    } else {
      weekday.push({label:"Shachris א׳",labelHeb:'שחרית',time:CONFIG.shachrisWeekday[0]});
    }
    weekday.push({label:"Shachris ב׳",labelHeb:'שחרית',time:CONFIG.shachrisWeekday[1]});
    if (isSunday || isLegalHoliday) {
      weekday.push({label:"Shachris ג׳",labelHeb:'שחרית',time:CONFIG.shachrisSunHoliday,note:'Sun/Holiday',isConditional:true});
    }
    if (isSunday && mg && timeToMinutes(mg) <= timeToMinutes('12:45 PM')) {
      weekday.push({label:"Mincha",labelHeb:'מנחה',time:CONFIG.mincha1245,note:'Sundays · MG ≤ 12:45',isConditional:true});
    }
    if (mg && timeToMinutes(mg) <= timeToMinutes('1:15 PM')) {
      weekday.push({label:"Mincha",labelHeb:'מנחה',time:CONFIG.mincha115,note:'when MG ≤ 1:15',isConditional:true});
    }
    weekday.push({label:"Mincha",labelHeb:'מנחה',time:CONFIG.mincha145});
    if (shkiah) {
      weekday.push({label:"Mincha",labelHeb:'מנחה',time:subtractMinutes(shkiah,15),note:'Shkiah-based'});
      weekday.push({label:'Shkiah',labelHeb:'שקיעה',time:shkiah,isShkiah:true});
      weekday.push({label:"Maariv א׳",labelHeb:'מעריב',time:shkiah,note:'Shkiah-based'});
    }
    if (tzais && timeToMinutes(tzais) <= timeToMinutes('8:15 PM')) {
      weekday.push({label:"Maariv ב׳",labelHeb:'מעריב',time:CONFIG.maariv815,note:'when Tzais 8.5° ≤ 8:15',isConditional:true});
    }
    weekday.push({label:"Maariv ג׳",labelHeb:'מעריב',time:CONFIG.maariv945});
  }

  return {weekday, shabbos, isShabbos, isYomTov};
}

// ===== Calendar Cell Schedule =====
function buildCellSchedule(date, shkiah, holidays, isRC) {
  const dow = date.getDay();
  const isShabbos = dow === 6;
  const isSunday = dow === 0;
  const isYomTov = holidays.some(h => YOM_TOV_NAMES.has(h));
  const isLegalHoliday = isUSHoliday(date);
  const lines = [];

  if (isShabbos || isYomTov) {
    lines.push({text:'Shach. 8:30',sk:510});
    lines.push({text:'Mincha א׳ 2:15',sk:855});
    if (shkiah) {
      const minchaB = getShabbosMinchaBTime(shkiah);
      lines.push({text:`Mincha ב׳ ${shortTime(minchaB)}`,sk:timeToMinutes(minchaB)});
      lines.push({text:`☀ Shkiah ${shortTime(shkiah)}`,sk:timeToMinutes(shkiah),isShkiah:true});
      lines.push({text:`Maariv ${shortTime(addMinutes(shkiah,55))}`,sk:timeToMinutes(addMinutes(shkiah,55))});
    }
  } else {
    if (isRC) {
      lines.push({text:'Shach. 6:30',sk:390,isNew:true});
    } else {
      lines.push({text:'Shach. 6:45',sk:405});
    }
    lines.push({text:'Shach. 7:30',sk:450});
    if (isSunday || isLegalHoliday) {
      lines.push({text:'Shach. 8:45',sk:525});
    }
    lines.push({text:'Mincha 1:45',sk:825});
    if (shkiah) {
      lines.push({text:`Mincha ${shortTime(subtractMinutes(shkiah,15))}`,sk:timeToMinutes(subtractMinutes(shkiah,15))});
      lines.push({text:`☀ Shkiah ${shortTime(shkiah)}`,sk:timeToMinutes(shkiah),isShkiah:true});
      lines.push({text:`Maariv ${shortTime(shkiah)}`,sk:timeToMinutes(shkiah)+1});
    }
    lines.push({text:'Maariv 8:15',sk:1215});
    lines.push({text:'Maariv 9:45',sk:1305});
  }

  lines.sort((a,b) => a.sk - b.sk);
  return lines;
}

// ===== Get holidays for a date =====
async function getHolidaysForDate(date) {
  const key = `${date.getFullYear()}-${date.getMonth()+1}`;
  if (!holidayCache[key]) {
    try {
      const data = await getHolidays(date.getFullYear(), date.getMonth()+1);
      holidayCache[key] = data.items || [];
    } catch(e) { holidayCache[key] = []; }
  }
  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return holidayCache[key].filter(h => h.date === ds).map(h => h.title);
}

// ===== Render Zmanim Tab =====
async function renderZmanimTab(date) {
  try {
    const zData = await getZmanim(date);
    const hData = await getHebrewDate(date);
    const z = zData.times || zData;

    const opts = {weekday:'long',year:'numeric',month:'long',day:'numeric'};
    document.getElementById('dateEnglish').textContent = date.toLocaleDateString('en-US',opts) + ' /';
    const hYear = hebrewYearStr(hData.hy);
    const hDay = HEBREW_NUMERALS[hData.hd] || hData.hd;
    document.getElementById('dateHebrew').textContent = `${hDay} ${HEBREW_MONTHS_HEB[hData.hm]||hData.hm} ${hYear}`;

    const tagsEl = document.getElementById('dateTags');
    tagsEl.innerHTML = '';
    if (hData.events) {
      hData.events.forEach(e => {
        if (e.includes('Parashat')||e.includes('Parshat')) {
          tagsEl.innerHTML += `<span class="tag tag-parasha">${e}</span>`;
        }
      });
    }
    tagsEl.innerHTML += `<span class="tag tag-dafyomi">Daf Yomi</span>`;

    const mList = document.getElementById('morningList');
    mList.innerHTML = '';
    const mZmanim = [
      {eng:'Alos HaShachar',heb:'עלות השחר',key:'alotHaShachar',desc:'Dawn - Earliest point of morning light'},
      {eng:'Misheyakir',heb:'משיכיר',key:'misheyakirMachmir',desc:'Earliest time to wear Tallit and Tefillin'},
      {eng:'HaNetz (Sunrise)',heb:'הנץ החמה',key:'sunrise',desc:"Sun's upper limb touches the horizon",hl:true},
      {eng:'Sof Zman Shema (MGA)',heb:'סוף זמן שמע מג״א',key:'sofZmanShmaMGA',desc:'Shema cutoff according to Magen Avraham'},
      {eng:'Sof Zman Shema (GRA)',heb:'סוף זמן שמע גר״א',key:'sofZmanShma',desc:'Shema cutoff according to the Vilna Gaon'},
      {eng:'Sof Zman Tefillah (GRA)',heb:'סוף זמן תפילה',key:'sofZmanTfilla',desc:'Morning prayer deadline (Vilna Gaon)'},
      {eng:'Chatzos',heb:'חצות היום',key:'chatzot',desc:'Halachic Midday'}
    ];
    mZmanim.forEach(zm => {
      const t = z[zm.key] ? parseTime(z[zm.key]) : '—';
      mList.innerHTML += `<div class="zman-row ${zm.hl?'highlighted':''}"><div class="zman-names"><div><span class="zman-english">${zm.eng}</span><span class="zman-hebrew">${zm.heb}</span></div><div class="zman-desc">${zm.desc}</div></div><div class="zman-time">${t}</div></div>`;
    });

    const aList = document.getElementById('afternoonList');
    aList.innerHTML = '';
    const aZmanim = [
      {eng:'Mincha Gedolah',heb:'מנחה גדולה',key:'minchaGedola',desc:'Earliest time permitted for Mincha'},
      {eng:'Mincha Ketanah',heb:'מנחה קטנה',key:'minchaKetana',desc:'Preferred timeframe for afternoon prayers'},
      {eng:'Plag HaMincha',heb:'פלג המנחה',key:'plagHaMincha',desc:'Midpoint of late afternoon'},
      {eng:'Shkiah (Sunset)',heb:'שקיעת החמה',key:'sunset',desc:'Sunset - End of halachic day',hl:true},
      {eng:'Tzais HaKochavim',heb:'צאת הכוכבים',key:'tzeit85deg',desc:'Tzais Geonim 8.5°'},
      {eng:'Tzais 72 Minutes',heb:'צאת ע״ב דקות',key:'tzeit72min',desc:'72 minutes after sunset'},
      {eng:'Chatzos HaLailah',heb:'חצות הלילה',key:'chatzotNight',desc:'Halachic Midnight'}
    ];
    aZmanim.forEach(zm => {
      const t = z[zm.key] ? parseTime(z[zm.key]) : '—';
      aList.innerHTML += `<div class="zman-row ${zm.hl?'highlighted':''}"><div class="zman-names"><div><span class="zman-english">${zm.eng}</span><span class="zman-hebrew">${zm.heb}</span></div><div class="zman-desc">${zm.desc}</div></div><div class="zman-time">${t}</div></div>`;
    });

    const holidays = await getHolidaysForDate(date);
    const isRC = holidays.some(h => h.includes('Rosh Chodesh')) || hData.hd === 1 || hData.hd === 30;
    const sched = buildDaveningSchedule(date, z, holidays, isRC);

    const dList = document.getElementById('daveningList');
    dList.innerHTML = '';
    sched.weekday.forEach(d => {
      const cls = d.isShkiah ? 'davening-row shkiah-row' : d.isConditional ? 'davening-row highlighted' : 'davening-row';
      dList.innerHTML += `<div class="${cls}"><div class="davening-names"><div><span class="davening-english">${d.label}</span><span class="davening-hebrew">${d.labelHeb}</span></div>${d.note?`<div class="davening-note">${d.note}</div>`:''}</div><div class="davening-time">${d.time}</div></div>`;
    });

    const sList = document.getElementById('shabbosList');
    sList.innerHTML = '';
    const shabbosItems = sched.shabbos.length > 0 ? sched.shabbos : buildShabbosPreview(z);
    shabbosItems.forEach(d => {
      const cls = d.isShkiah ? 'davening-row shkiah-row' : 'davening-row';
      sList.innerHTML += `<div class="${cls}"><div class="davening-names"><div><span class="davening-english">${d.label}</span><span class="davening-hebrew">${d.labelHeb}</span></div></div><div class="davening-time">${d.time}</div></div>`;
    });

    const now = new Date();
    const upcoming = [...mZmanim,...aZmanim].map(zm=>({name:zm.eng,time:z[zm.key]?parseTime(z[zm.key]):null})).filter(x=>x.time&&timeToMinutes(x.time)>now.getHours()*60+now.getMinutes());
    if (upcoming.length) {
      const n = upcoming[0];
      const ml = timeToMinutes(n.time)-(now.getHours()*60+now.getMinutes());
      document.getElementById('nextZmanTime').textContent = `${n.name} in ${Math.floor(ml/60)}h ${ml%60}m`;
    }

    document.getElementById('calDateEnglish').textContent = document.getElementById('dateEnglish').textContent;
    document.getElementById('calDateHebrew').textContent = document.getElementById('dateHebrew').textContent;
    document.getElementById('calDateTags').innerHTML = tagsEl.innerHTML;
    document.getElementById('calNextZmanTime').textContent = document.getElementById('nextZmanTime').textContent || '';
  } catch(err) { console.error('Zmanim error:', err); }
}

function buildShabbosPreview(z) {
  const shkiah = z.sunset ? parseTime(z.sunset) : null;
  const items = [
    {label:'Shachris',labelHeb:'שחרית',time:CONFIG.shachrisShabbos},
    {label:'Mincha א׳',labelHeb:'מנחה',time:CONFIG.minchaShabbosA}
  ];
  if (shkiah) {
    const minchaB = getShabbosMinchaBTime(shkiah);
    items.push({label:'Mincha ב׳',labelHeb:'מנחה',time:minchaB});
    items.push({label:'Maariv',labelHeb:'מעריב',time:addMinutes(shkiah,CONFIG.maarivAfterShkiahShabbos)});
  }
  return items;
}

// ===== Render Calendar =====
async function renderCalendar(hy, hm) {
  const url1 = `https://www.hebcal.com/converter?cfg=json&hy=${hy}&hm=${hm}&hd=1&h2g=1`;
  const fd = await fetchJSON(url1);
  const start = new Date(fd.gy, fd.gm-1, fd.gd);

  let ml = 29;
  try {
    const u30 = `https://www.hebcal.com/converter?cfg=json&hy=${hy}&hm=${hm}&hd=30&h2g=1`;
    const d30 = await fetchJSON(u30);
    if (d30.hm === hm) ml = 30;
  } catch(e) {}

  const hmHeb = HEBREW_MONTHS_HEB[hm]||hm;
  const hys = hebrewYearStr(hy);
  document.getElementById('monthTitle').innerHTML = `${hm} ${hy} / <span style="font-size:20px">${hmHeb} ${hys}</span>`;
  document.getElementById('monthDaysBadge').textContent = `${ml} days`;

  if (window.innerWidth < 768) {
    await renderCalendarAgenda(start, ml);
  } else {
    await renderCalendarGrid(start, ml);
  }
}

async function renderCalendarGrid(start, ml) {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  grid.className = 'calendar-grid';
  const sDow = start.getDay();

  const end = new Date(start); end.setDate(end.getDate()+ml-1);
  await getHolidaysForDate(start);
  await getHolidaysForDate(end);

  for (let i=0; i<sDow; i++) grid.innerHTML += '<div class="day-cell empty"></div>';

  for (let d=1; d<=ml; d++) {
    const cd = new Date(start); cd.setDate(start.getDate()+d-1);
    const dow = cd.getDay();
    const hols = await getHolidaysForDate(cd);
    const isShabbos = dow===6;
    const isYT = hols.some(h=>YOM_TOV_NAMES.has(h));
    const isRC = hols.some(h=>h.includes('Rosh Chodesh'))||d===1||d===30;

    let shkiah = null;
    try { const zd = await getZmanim(cd); const t = zd.times||zd; shkiah = t.sunset ? parseTime(t.sunset) : null; } catch(e){}

    const sched = buildCellSchedule(cd,shkiah,hols,isRC);

    let special = '';
    for (const h of hols) {
      for (const [eng,heb] of Object.entries(HEBREW_HOLIDAY_NAMES)) {
        if (h.includes(eng)||eng.includes(h)) { special=heb; break; }
      }
      if (special) break;
    }

    const today = new Date();
    const isToday = cd.toDateString()===today.toDateString();
    const engD = `${cd.toLocaleDateString('en-US',{month:'short'})} ${cd.getDate()}`;
    const hebD = HEBREW_NUMERALS[d]||d;

    let cls = 'day-cell';
    if (isShabbos) cls += ' shabbos';
    if (isYT) cls += ' yomtov';
    if (isToday) cls += ' today';

    let header = `${hebD}  ${engD}`;
    if (special) header += `  ·  ${special}`;

    grid.innerHTML += `<div class="${cls}"><div class="cell-header ${special?'special':''}">${header}</div><div class="cell-divider"></div><div class="cell-times">${sched.map(l=>`<div class="cell-time-line ${l.isShkiah?'shkiah':''} ${l.isNew?'new-highlight':''}">${l.text}</div>`).join('')}</div></div>`;
  }

  const total = sDow+ml;
  const rem = total%7===0 ? 0 : 7-(total%7);
  for (let i=0; i<rem; i++) grid.innerHTML += '<div class="day-cell empty"></div>';
}

async function renderCalendarAgenda(start, ml) {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  grid.className = 'calendar-agenda';

  const end = new Date(start); end.setDate(end.getDate()+ml-1);
  await getHolidaysForDate(start);
  await getHolidaysForDate(end);

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Shabbos'];

  for (let d=1; d<=ml; d++) {
    const cd = new Date(start); cd.setDate(start.getDate()+d-1);
    const dow = cd.getDay();
    const hols = await getHolidaysForDate(cd);
    const isShabbos = dow===6;
    const isYT = hols.some(h=>YOM_TOV_NAMES.has(h));
    const isRC = hols.some(h=>h.includes('Rosh Chodesh'))||d===1||d===30;

    let shkiah = null;
    try { const zd = await getZmanim(cd); const t = zd.times||zd; shkiah = t.sunset ? parseTime(t.sunset) : null; } catch(e){}

    const sched = buildCellSchedule(cd,shkiah,hols,isRC);

    let special = '';
    for (const h of hols) {
      for (const [eng,heb] of Object.entries(HEBREW_HOLIDAY_NAMES)) {
        if (h.includes(eng)||eng.includes(h)) { special=heb; break; }
      }
      if (special) break;
    }

    const today = new Date();
    const isToday = cd.toDateString()===today.toDateString();
    const engD = `${cd.toLocaleDateString('en-US',{month:'short'})} ${cd.getDate()}`;
    const hebD = HEBREW_NUMERALS[d]||d;

    let cls = 'agenda-card';
    if (isShabbos || isYT) cls += ' agenda-shabbos';
    if (isToday) cls += ' agenda-today';

    const timesHtml = sched.map(l =>
      `<span class="agenda-time ${l.isShkiah?'shkiah':''} ${l.isNew?'new-highlight':''}">${l.text}</span>`
    ).join('');

    grid.innerHTML += `
      <div class="${cls}">
        <div class="agenda-date">
          <div class="agenda-heb-day">${hebD}</div>
          <div class="agenda-eng-date">${engD}</div>
          <div class="agenda-dow">${dayNames[dow]}</div>
          ${special ? `<div class="agenda-special">${special}</div>` : ''}
        </div>
        <div class="agenda-times">${timesHtml}</div>
      </div>`;
  }
}

// ===== Newsletter Generator =====
async function renderNewsletter() {
  const preview = document.getElementById('newsletterPreview');
  if (!preview) return;

  const today = new Date();
  let shabbosDate = new Date(today);
  const todayDow = today.getDay();
  shabbosDate.setDate(today.getDate() + (6 - todayDow));

  const fridayDate = new Date(shabbosDate);
  fridayDate.setDate(shabbosDate.getDate() - 1);

  const sundayDate = new Date(shabbosDate);
  sundayDate.setDate(shabbosDate.getDate() + 1);

  const [zShabbos, zFriday, hShabbos, parshaData] = await Promise.all([
    getZmanim(shabbosDate), getZmanim(fridayDate), getHebrewDate(shabbosDate), getParsha(shabbosDate)
  ]);

  const zS = zShabbos.times || zShabbos;
  const zF = zFriday.times || zFriday;

  const shkiahFri = zF.sunset ? parseTime(zF.sunset) : null;
  const shkiahShab = zS.sunset ? parseTime(zS.sunset) : null;
  const plagFri = zF.plagHaMincha ? parseTime(zF.plagHaMincha) : null;
  const hadlaka = shkiahFri ? subtractMinutes(shkiahFri, 18) : null;
  const szsMGA = zS.sofZmanShmaMGA ? parseTime(zS.sofZmanShmaMGA) : null;
  const szsGRA = zS.sofZmanShma ? parseTime(zS.sofZmanShma) : null;
  const tzais72 = shkiahShab ? addMinutes(shkiahShab, 72) : null;

  const ovMinchaB = document.getElementById('ovMinchaB')?.value?.trim();
  let minchaB = ovMinchaB || (shkiahShab ? shortTime(getShabbosMinchaBTime(shkiahShab)) : '—');

  const ovShiur = document.getElementById('ovShiur')?.value?.trim();
  let shiurTime;
  if (ovShiur) { shiurTime = ovShiur; }
  else if (minchaB !== '—') {
    const mbMins = timeToMinutes(minchaB.includes('M') ? minchaB : minchaB + ' PM');
    shiurTime = shortTime(minutesToTime(mbMins - 30));
  } else { shiurTime = '—'; }

  const ovShachris = document.getElementById('ovShachris')?.value?.trim() || shortTime(CONFIG.shachrisShabbos);

  const maarivMotzei = shkiahShab ? shortTime(addMinutes(shkiahShab, CONFIG.maarivAfterShkiahShabbos)) : '—';

  const ovErevMincha = document.getElementById('ovErevMincha')?.value?.trim();
  let erevMincha = ovErevMincha || (shkiahFri ? shortTime(subtractMinutes(shkiahFri, 15)) : '—');

  const likrasTime = erevMincha !== '—' ? shortTime(minutesToTime(timeToMinutes(erevMincha.includes('M') ? erevMincha : erevMincha + ' PM') - 35)) : '—';

  const summer = shkiahShab ? isSummerSeason(shkiahShab) : true;
  const shaloshMode = summer ? 'No שלוש סעודות' : 'שלוש סעודות in shul';

  const isPrkAvos = isPirkeiAvosSeason(hShabbos);

  let parshaHeb = '';
  if (parshaData.parsha) {
    parshaHeb = parshaData.parsha.replace('Parashat ', '').replace('Parshat ', '');
  }

  const hebDay = HEBREW_NUMERALS[hShabbos.hd] || hShabbos.hd;
  const hebMonth = HEBREW_MONTHS_HEB[hShabbos.hm] || hShabbos.hm;
  const hebYear = hebrewYearStr(hShabbos.hy);
  const engDate = shabbosDate.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'2-digit'});

  const annAlert = document.getElementById('annAlert')?.value || '';
  const annLikras = document.getElementById('annLikras')?.value || '';
  const annMazalTov = document.getElementById('annMazalTov')?.value || '';
  const annShiurTopic = document.getElementById('annShiurTopic')?.value || '';
  const annTorah = document.getElementById('annTorah')?.value || '';
  const annFridayNight = document.getElementById('annFridayNight')?.value || '';
  const annShalosh = document.getElementById('annShalosh')?.value || '';
  const annAvos = document.getElementById('annAvos')?.value || '';
  const annMaariv = document.getElementById('annMaariv')?.value || '';
  const annSpecial = document.getElementById('annSpecial')?.value || '';
  const annExtra = document.getElementById('annExtra')?.value || '';

  let weekdayShkiah = '—';
  try {
    const zWed = await getZmanim(new Date(sundayDate.getTime() + 3*86400000));
    const tw = zWed.times || zWed;
    weekdayShkiah = tw.sunset ? shortTime(parseTime(tw.sunset)) : '—';
  } catch(e) {}

  // Build schedule rows
  let scheduleRows = '';
  const sr = (label, time, bold, brk) => {
    let cls = '';
    if (bold) cls += ' bold-row';
    if (brk) cls += ' section-break';
    return `<tr class="${cls}"><td>${label}</td><td>${time || '—'}</td></tr>`;
  };

  scheduleRows += sr('לקראת שבת', likrasTime, false, true);
  if (summer && shkiahFri) {
    scheduleRows += sr('מנחה א', erevMincha);
    if (plagFri) scheduleRows += sr('פלג המנחה', shortTime(plagFri));
    if (hadlaka) scheduleRows += sr('הדלקה', shortTime(hadlaka));
    scheduleRows += sr('מנחה ב', shkiahFri ? shortTime(subtractMinutes(shkiahFri, 5)) : '—', true);
    scheduleRows += sr('שקיעה', shortTime(shkiahFri), false, true);
  } else {
    if (hadlaka) scheduleRows += sr('הדלקה', shortTime(hadlaka));
    scheduleRows += sr('מנחה', erevMincha);
    if (shkiahFri) scheduleRows += sr('שקיעה', shortTime(shkiahFri), false, true);
  }

  scheduleRows += sr('שיעור', '8:05');
  scheduleRows += sr('שחרית', ovShachris);
  if (szsMGA && szsGRA) scheduleRows += sr('ס״ז קריאת שמע', `${shortTime(szsMGA)}/${shortTime(szsGRA)}`);
  scheduleRows += sr('מנחה א', shortTime(CONFIG.minchaShabbosA));
  scheduleRows += sr('שיעור', shiurTime, true);
  scheduleRows += sr('מנחה ב', minchaB, true);

  if (summer) {
    const mBMins = timeToMinutes(minchaB.includes('M') ? minchaB : minchaB + ' PM');
    const sederStart = shortTime(minutesToTime(mBMins + 20));
    const sederEnd = shortTime(minutesToTime(mBMins + 50));
    scheduleRows += `<tr class="no-border"><td>סדר לימוד / אבות ובנים</td><td>${sederStart}-${sederEnd}</td></tr>`;
  }

  scheduleRows += `<tr class="no-border"><td colspan="2" style="text-align:center;font-weight:600;font-size:10px;padding:4px 0">${shaloshMode}</td></tr>`;
  if (shkiahShab) scheduleRows += sr('שקיעה', shortTime(shkiahShab));

  if (isPrkAvos) {
    const pirkeiTime = shkiahShab ? shortTime(addMinutes(shkiahShab, 30)) : '—';
    scheduleRows += sr('פרקי אבות', pirkeiTime);
  }

  scheduleRows += sr('מעריב', maarivMotzei);
  if (tzais72) scheduleRows += sr('צה״כ (72)', shortTime(tzais72), false, true);

  if (!summer) {
    const avMins = tzais72 ? timeToMinutes(tzais72) + 30 : 0;
    if (avMins) scheduleRows += sr('אבות ובנים', shortTime(minutesToTime(avMins)));
  }

  let weekdaySummary = `
    <div class="nl-weekday-header">Week of ${sundayDate.toLocaleDateString('en-US',{month:'long', day:'numeric'})}</div>
    <table class="nl-weekday-table">
      <tr><td class="wk-label">שחרית</td><td class="wk-days">Sunday</td><td class="wk-times">6:45, 7:30, 8:45</td></tr>
      <tr><td></td><td class="wk-days">Mon-Fri</td><td class="wk-times">6:45, 7:30</td></tr>
      <tr><td class="wk-label">מנחה</td><td colspan="2" class="wk-times">1:45, ${weekdayShkiah}</td></tr>
      <tr><td class="wk-label">מעריב</td><td colspan="2" class="wk-times">שקיעה, ${annMaariv ? '<b>'+annMaariv+'</b>,' : '8:15,'} 9:45</td></tr>
    </table>`;

  // Left column
  let leftCol = '';
  if (annAlert) leftCol += `<div class="nl-alert-box">${annAlert.replace(/\n/g,'<br>')}</div>`;

  leftCol += `<div class="nl-section-block"><div class="nl-section-title">Likras Shabbos</div><div class="nl-section-body">Every Erev Shabbos 35 minutes before Mincha.</div>`;
  if (annLikras) leftCol += `<div class="nl-section-body">${annLikras.replace(/\n/g,'<br>')}</div>`;
  leftCol += `</div><div class="nl-divider"></div>`;

  if (annTorah) leftCol += `<div class="nl-section-block"><div class="nl-section-title">Torah & Stories</div><div class="nl-section-body">${annTorah.replace(/\n/g,'<br>')}</div></div><div class="nl-divider"></div>`;
  if (annMazalTov) leftCol += `<div class="nl-section-block"><div class="nl-section-hebrew">מזל טוב</div><div class="nl-section-body">${annMazalTov.replace(/\n/g,'<br>')}</div></div><div class="nl-divider"></div>`;

  leftCol += `<div class="nl-section-block"><div class="nl-section-title">Shabbos Afternoon Shiur</div><div class="nl-section-body">Shabbos afternoon 30 minutes<br>before the 2nd Mincha.</div>`;
  if (annShiurTopic) leftCol += `<div class="nl-section-body">Topic: ${annShiurTopic.replace(/\n/g,'<br>')}</div>`;
  leftCol += `</div><div class="nl-divider"></div>`;

  leftCol += `<div class="nl-section-block"><div class="nl-section-body">Avos UBanim / Seder Limud<br>Shabbos afternoon following second Mincha</div>`;
  if (annAvos) leftCol += `<div class="nl-section-body">${annAvos.replace(/\n/g,'<br>')}</div>`;
  leftCol += `</div><div class="nl-divider"></div>`;

  if (annFridayNight) leftCol += `<div class="nl-section-block"><div class="nl-section-title">Friday Night Oneg & Shiur</div><div class="nl-section-body">${annFridayNight.replace(/\n/g,'<br>')}</div></div><div class="nl-divider"></div>`;
  if (annShalosh) leftCol += `<div class="nl-section-block"><div class="nl-section-hebrew">שלוש סעודות</div><div class="nl-section-body">${annShalosh.replace(/\n/g,'<br>')}</div></div><div class="nl-divider"></div>`;

  if (isPrkAvos) {
    const pt = shkiahShab ? shortTime(addMinutes(shkiahShab, 30)) : '—';
    leftCol += `<div class="nl-section-block"><div class="nl-section-hebrew">פרקי אבות</div><div class="nl-section-body">${pt}</div></div><div class="nl-divider"></div>`;
  }

  if (annMaariv) leftCol += `<div class="nl-section-block"><div class="nl-alert-box"><b>Additional nightly Maariv:</b><br>This week <b>${annMaariv}</b></div></div>`;
  if (annSpecial) leftCol += `<div class="nl-section-block"><div class="nl-section-body">${annSpecial.replace(/\n/g,'<br>')}</div></div>`;
  if (annExtra) leftCol += `<div class="nl-section-block"><div class="nl-section-body">${annExtra.replace(/\n/g,'<br>')}</div></div>`;

  preview.innerHTML = `
    <div class="nl-page">
      <div class="nl-header">
        <div class="nl-logo">
          <div class="nl-logo-text">קהל<br>זכרון<br>יעקב</div>
          <div style="font-size:8px;color:#888;margin-top:2px">ע״ל שם יעקב בן משולם זי״ל</div>
        </div>
        <div class="nl-parsha">פרשת ${parshaHeb || '—'}</div>
        <div class="nl-date-block">
          <div class="nl-date-hebrew">${hebDay} ${hebMonth} ${hebYear}</div>
          <div>${engDate}</div>
        </div>
      </div>
      <div class="nl-body">
        <div class="nl-left">${leftCol}</div>
        <div class="nl-right">
          <table class="nl-schedule-table">${scheduleRows}</table>
          ${weekdaySummary}
        </div>
      </div>
      <div class="nl-footer">
        <div class="nl-footer-left">
          Khal Zichron Yakov<br>
          Mara D'asra HaRav Moshe Langer Shlit"a<br>
          8 Roxbury Court Chestnut Ridge, NY 10977
        </div>
      </div>
    </div>`;

  saveNewsletterData();
}

function isPirkeiAvosSeason(hData) {
  const monthOrder = ['Nisan','Iyar','Sivan','Tammuz','Av','Elul'];
  return monthOrder.includes(hData.hm);
}

function saveNewsletterData() {
  const fields = ['annAlert','annLikras','annMazalTov','annShiurTopic','annTorah',
    'annFridayNight','annShalosh','annAvos','annMaariv','annSpecial','annExtra',
    'ovShachris','ovMinchaB','ovShiur','ovErevMincha'];
  const data = {};
  fields.forEach(f => { const el = document.getElementById(f); if (el) data[f] = el.value; });
  localStorage.setItem('nlData', JSON.stringify(data));
}

function loadNewsletterData() {
  try {
    const data = JSON.parse(localStorage.getItem('nlData') || '{}');
    Object.entries(data).forEach(([k,v]) => { const el = document.getElementById(k); if (el && v) el.value = v; });
  } catch(e) {}
}

// ===== Navigation =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const tgt = tab.dataset.tab;
    document.getElementById('zmanimTab').classList.toggle('hidden',tgt!=='zmanim');
    document.getElementById('calendarTab').classList.toggle('hidden',tgt!=='calendar');
    document.getElementById('newsletterTab').classList.toggle('hidden',tgt!=='newsletter');
    if (tgt === 'newsletter') { loadNewsletterData(); renderNewsletter(); }
  });
});

document.getElementById('btnToday').addEventListener('click',()=>{currentDate=new Date();init();});
document.getElementById('btnPrev').addEventListener('click',()=>{currentDate.setDate(currentDate.getDate()-1);init();});
document.getElementById('btnNext').addEventListener('click',()=>{currentDate.setDate(currentDate.getDate()+1);init();});

document.getElementById('monthPrev').addEventListener('click',()=>{
  if(!currentHebrewMonth)return;
  const i=HEBREW_MONTHS.indexOf(currentHebrewMonth.monthName);
  if(i>0) currentHebrewMonth.monthName=HEBREW_MONTHS[i-1];
  else{currentHebrewMonth.monthName=HEBREW_MONTHS[HEBREW_MONTHS.length-1];currentHebrewMonth.year--;}
  renderCalendar(currentHebrewMonth.year,currentHebrewMonth.monthName);
});

document.getElementById('monthNext').addEventListener('click',()=>{
  if(!currentHebrewMonth)return;
  const i=HEBREW_MONTHS.indexOf(currentHebrewMonth.monthName);
  if(i<HEBREW_MONTHS.length-1) currentHebrewMonth.monthName=HEBREW_MONTHS[i+1];
  else{currentHebrewMonth.monthName=HEBREW_MONTHS[0];currentHebrewMonth.year++;}
  renderCalendar(currentHebrewMonth.year,currentHebrewMonth.monthName);
});

document.querySelectorAll('#nlOverrides input, #nlOverrides textarea').forEach(el => {
  el.addEventListener('input', () => {
    clearTimeout(el._debounce);
    el._debounce = setTimeout(() => renderNewsletter(), 500);
  });
});

document.getElementById('nlReset')?.addEventListener('click', () => {
  localStorage.removeItem('nlData');
  document.querySelectorAll('#nlOverrides input, #nlOverrides textarea').forEach(el => el.value = '');
  renderNewsletter();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentHebrewMonth) renderCalendar(currentHebrewMonth.year, currentHebrewMonth.monthName);
  }, 300);
});

// ===== Init =====
async function init() {
  await renderZmanimTab(currentDate);
  const hd = await getHebrewDate(currentDate);
  currentHebrewMonth = {year:hd.hy,monthName:hd.hm};
  await renderCalendar(hd.hy,hd.hm);
}

init();
