const CONFIG = {
  lat: 41.0903,
  lng: -74.0484,
  tzid: 'America/New_York',
  locationName: 'Chestnut Ridge, NY',
  shachrisWeekday: ['6:45 AM', '7:30 AM'],
  shachrisSunHoliday: ['8:45 AM'],
  minchaFixed: '1:45 PM',
  minchaConditional1_15: '1:15 PM',
  minchaConditionalSun12_45: '12:45 PM',
  maarivLate: '9:45 PM',
  maarivConditional8_15: '8:15 PM',
  shachrisShabbos: '8:30 AM',
  minchaShabbosAleph: '2:15 PM',
  minchaShabbosBeisOffset: -40,
  maarivShabbosOffset: 55,
};

let currentDate = new Date();
let calendarMonth = null;
let zmanimCache = {};

async function fetchZmanim(date) {
  const key = dateStr(date);
  if (zmanimCache[key]) return zmanimCache[key];
  const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${CONFIG.lat}&longitude=${CONFIG.lng}&tzid=${CONFIG.tzid}&date=${key}`;
  const resp = await fetch(url);
  const data = await resp.json();
  zmanimCache[key] = data.times;
  return data.times;
}

async function fetchHebrewDate(date) {
  const url = `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth()+1}&gd=${date.getDate()}&g2h=1`;
  const resp = await fetch(url);
  return resp.json();
}

async function fetchHolidays(year, month) {
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=on&mod=on&nx=off&ss=off&mf=off&c=off&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lng}&tzid=${CONFIG.tzid}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.items || [];
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CONFIG.tzid });
}

function fmtTimeShort(iso) {
  if (!iso) return '—';
  return fmtTime(iso).replace(' AM','').replace(' PM','');
}

function offsetMinutes(iso, mins) {
  if (!iso) return null;
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

function timeToMinutes(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function isoToMinutes(iso) {
  if (!iso) return 9999;
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const HEBREW_NUMS = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳',
  'י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ׳',
  'כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל׳'];

const HEBREW_MONTHS = {
  'Nisan':'ניסן','Iyyar':'אייר','Sivan':'סיון','Tamuz':'תמוז',
  'Av':'אב','Elul':'אלול','Tishrei':'תשרי','Cheshvan':'חשון',
  'Kislev':'כסלו','Tevet':'טבת','Shvat':'שבט','Adar':'אדר',
  'Adar I':'אדר א׳','Adar II':'אדר ב׳'
};

function hebrewYear(hy) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const hundreds = ['','ק','ר','ש','ת'];
  const y = hy % 1000;
  const h = Math.floor(y / 100);
  const t = Math.floor((y % 100) / 10);
  const o = y % 10;
  let letters = 'ה׳';
  if (h <= 4) letters += hundreds[h];
  else letters += 'ת' + (h > 5 ? hundreds[h-4] : '');
  letters += tens[t] + ones[o];
  if (letters.length > 2) letters = letters.slice(0,-1) + '״' + letters.slice(-1);
  return letters;
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isYomTov(holidayItem) {
  const title = (holidayItem.title || '').toLowerCase();
  const yomTovNames = ['rosh hashana','yom kippur','sukkot','shmini atzeret','simchat torah','pesach','shavuot',"sh'mini"];
  if (title.includes('erev') || title.includes('chol ha')) return false;
  return yomTovNames.some(n => title.includes(n));
}

function isErev(holidayItem) {
  return (holidayItem.title || '').toLowerCase().includes('erev');
}

const MORNING_ZMANIM = [
  { key:'alotHaShachar', en:'Alos HaShachar', he:'עלות השחר', desc:'Dawn - Earliest point of morning light' },
  { key:'misheyakirMachmir', en:'Misheyakir (11°)', he:'משיכיר', desc:'Earliest time to wear Tallit and Tefillin' },
  { key:'sunrise', en:'HaNetz (Sunrise)', he:'הנץ החמה', desc:"Sun's upper limb touches the horizon", highlight:true },
  { key:'sofZmanShmaMGA', en:'Sof Zman Shema (MGA)', he:'סוף זמן שמע מג״א', desc:'Shema cutoff according to Magen Avraham' },
  { key:'sofZmanShma', en:'Sof Zman Shema (GRA)', he:'סוף זמן שמע גר״א', desc:'Shema cutoff according to the Vilna Gaon' },
  { key:'sofZmanTfilla', en:'Sof Zman Tefillah (GRA)', he:'סוף זמן תפילה', desc:'Morning prayer deadline (Vilna Gaon)' },
  { key:'chatzot', en:'Chatzos', he:'חצות היום', desc:'Halachic Midday' },
];

const EVENING_ZMANIM = [
  { key:'minchaGedola', en:'Mincha Gedolah', he:'מנחה גדולה', desc:'Earliest time permitted for Mincha' },
  { key:'minchaKetana', en:'Mincha Ketanah', he:'מנחה קטנה', desc:'Preferred timeframe for afternoon prayers' },
  { key:'plagHaMincha', en:'Plag HaMincha', he:'פלג המנחה', desc:'Midpoint of late afternoon' },
  { key:'sunset', en:'Shkiah (Sunset)', he:'שקיעת החמה', desc:'Sunset - End of halachic day', highlight:true },
  { key:'tzeit85deg', en:'Tzeis HaKochavim', he:'צאת הכוכבים', desc:'Tzais Geonim 8.5°' },
  { key:'tzeit72min', en:'Tzais 72 Minutes', he:'צאת ע״ב דקות', desc:'72 minutes after sunset' },
  { key:'chatzotNight', en:'Chatzos HaLailah', he:'חצות הלילה', desc:'Halachic Midnight' },
];

function renderZmanRow(en, he, time, desc, highlight) {
  return `<li class="zman-row ${highlight?'highlight':''}">
    <div class="zman-info">
      <div class="zman-label"><span class="zman-english">${en}</span><span class="zman-hebrew">${he}</span></div>
      ${desc?`<div class="zman-desc">${desc}</div>`:''}
    </div>
    <span class="zman-time">${time}</span></li>`;
}

async function renderZmanimTab() {
  const times = await fetchZmanim(currentDate);
  const heb = await fetchHebrewDate(currentDate);
  const dayName = DAY_NAMES[currentDate.getDay()];
  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const gDate = `${dayName}, ${monthName} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  const hDate = `${HEBREW_NUMS[heb.hd]} ${HEBREW_MONTHS[heb.hm]||heb.hm} ${hebrewYear(heb.hy)}`;
  document.getElementById('mainDate').innerHTML = `${gDate} / <span dir="rtl">${hDate}</span>`;

  const holidays = await fetchHolidays(currentDate.getFullYear(), currentDate.getMonth()+1);
  const todayStr = dateStr(currentDate);
  const todayHolidays = holidays.filter(h => h.date === todayStr);
  const parasha = todayHolidays.find(h => h.category === 'parashat');
  document.getElementById('tagParasha').textContent = parasha ? parasha.title : '';
  document.getElementById('tagParasha').style.display = parasha ? '' : 'none';

  const now = new Date();
  if (isSameDay(now, currentDate)) {
    const shmaTime = new Date(times.sofZmanShma);
    if (now < shmaTime) {
      const diff = Math.round((shmaTime - now)/60000);
      document.getElementById('nextDeadline').textContent = `Sof Zman Shema in ${Math.floor(diff/60)}h ${diff%60}m`;
    } else {
      document.getElementById('nextDeadline').textContent = `Shkiah at ${fmtTime(times.sunset)}`;
    }
  } else {
    document.getElementById('nextDeadline').textContent = `Sof Zman Shema at ${fmtTime(times.sofZmanShma)}`;
  }

  let morningHTML = '';
  for (const z of MORNING_ZMANIM) morningHTML += renderZmanRow(z.en, z.he, fmtTime(times[z.key]), z.desc, z.highlight);
  document.getElementById('morningList').innerHTML = morningHTML;

  let eveningHTML = '';
  for (const z of EVENING_ZMANIM) eveningHTML += renderZmanRow(z.en, z.he, fmtTime(times[z.key]), z.desc, z.highlight);
  document.getElementById('eveningList').innerHTML = eveningHTML;

  renderDaveningTimes(times, currentDate);
  document.getElementById('mainDateCal').innerHTML = document.getElementById('mainDate').innerHTML;
  document.getElementById('nextDeadlineCal').textContent = document.getElementById('nextDeadline').textContent;
}

function renderDaveningTimes(times, date) {
  const dow = date.getDay();
  const isShabbos = dow === 6;
  const isSunday = dow === 0;
  const sunset = times.sunset;
  const mgMins = isoToMinutes(times.minchaGedola);
  const tzais85Mins = isoToMinutes(times.tzeit85deg);
  const minchaBeforeShk = offsetMinutes(sunset, -15);

  let html = '';
  let c;

  if (!isShabbos) {
    c = 0;
    for (const t of CONFIG.shachrisWeekday) { c++; html += renderZmanRow(`Shachris ${HEBREW_NUMS[c]} (Weekday)`,'שחרית',t); }
    html += renderZmanRow('Shachris (Sun/Holiday)','שחרית',CONFIG.shachrisSunHoliday[0]);
  }

  const mOpts = [];
  if (isSunday && mgMins <= timeToMinutes(CONFIG.minchaConditionalSun12_45))
    mOpts.push({time:CONFIG.minchaConditionalSun12_45, mins:timeToMinutes(CONFIG.minchaConditionalSun12_45), desc:'Sundays only · when Mincha Gedolah ≤ 12:45 PM'});
  if (mgMins <= timeToMinutes(CONFIG.minchaConditional1_15))
    mOpts.push({time:CONFIG.minchaConditional1_15, mins:timeToMinutes(CONFIG.minchaConditional1_15), desc:'Only when Mincha Gedolah ≤ 1:15 PM'});
  if (!isShabbos) {
    mOpts.push({time:CONFIG.minchaFixed, mins:timeToMinutes(CONFIG.minchaFixed), desc:''});
    mOpts.push({time:fmtTime(minchaBeforeShk), mins:isoToMinutes(minchaBeforeShk), desc:'Shkiah-based time', highlight:true});
  }
  mOpts.sort((a,b) => a.mins - b.mins);
  c = 0;
  for (const o of mOpts) { c++; const l = mOpts.length>1?` ${HEBREW_NUMS[c]}`:''; html += renderZmanRow(`Mincha${l}`,'מנחה',o.time,o.desc,o.highlight); }

  if (!isShabbos) {
    const mvOpts = [];
    mvOpts.push({time:`At Shkiah (${fmtTime(sunset)})`, mins:isoToMinutes(sunset), desc:'Shkiah-based time', highlight:true});
    if (tzais85Mins <= timeToMinutes(CONFIG.maarivConditional8_15))
      mvOpts.push({time:CONFIG.maarivConditional8_15, mins:timeToMinutes(CONFIG.maarivConditional8_15), desc:'Only when Tzais 8.5° ≤ 8:15 PM'});
    mvOpts.push({time:CONFIG.maarivLate, mins:timeToMinutes(CONFIG.maarivLate), desc:''});
    mvOpts.sort((a,b) => a.mins - b.mins);
    c = 0;
    for (const o of mvOpts) { c++; const l = mvOpts.length>1?` ${HEBREW_NUMS[c]}`:''; html += renderZmanRow(`Maariv${l}`,'מעריב',o.time,o.desc,o.highlight); }
  }

  document.getElementById('daveningList').innerHTML = html;
  renderShabbosSection(date);
}

async function renderShabbosSection(date) {
  const shabbos = new Date(date);
  const d = (6 - shabbos.getDay() + 7) % 7;
  if (d > 0) shabbos.setDate(shabbos.getDate() + d);
  const t = await fetchZmanim(shabbos);
  const minB = offsetMinutes(t.sunset, CONFIG.minchaShabbosBeisOffset);
  const maariv = offsetMinutes(t.sunset, CONFIG.maarivShabbosOffset);
  let html = '';
  html += renderZmanRow('Shachris','שחרית',CONFIG.shachrisShabbos);
  html += renderZmanRow('Mincha א׳','מנחה',CONFIG.minchaShabbosAleph);
  html += renderZmanRow('Mincha ב׳','מנחה',fmtTime(minB),'Shkiah-based time',true);
  html += renderZmanRow('Maariv','מעריב',fmtTime(maariv),'Shkiah-based time',true);
  document.getElementById('shabbosList').innerHTML = html;
}

async function renderCalendar() {
  const heb = await fetchHebrewDate(currentDate);
  if (!calendarMonth) calendarMonth = { hm:heb.hm, hy:heb.hy };
  const monthHe = HEBREW_MONTHS[calendarMonth.hm]||calendarMonth.hm;
  document.getElementById('monthTitle').textContent = `${calendarMonth.hm} ${calendarMonth.hy} / ${monthHe} ${hebrewYear(calendarMonth.hy)}`;

  const r = await fetch(`https://www.hebcal.com/converter?cfg=json&hy=${calendarMonth.hy}&hm=${calendarMonth.hm}&hd=1&h2g=1`);
  const firstDay = await r.json();
  const startGreg = new Date(firstDay.gy, firstDay.gm-1, firstDay.gd);

  let daysInMonth = 29;
  try { const r2 = await fetch(`https://www.hebcal.com/converter?cfg=json&hy=${calendarMonth.hy}&hm=${calendarMonth.hm}&hd=30&h2g=1`);
    const d30 = await r2.json(); if (!d30.error) daysInMonth = 30; } catch(e) {}

  const holidays = await fetchHolidays(startGreg.getFullYear(), startGreg.getMonth()+1);
  const nm = new Date(startGreg); nm.setMonth(nm.getMonth()+1);
  const h2 = await fetchHolidays(nm.getFullYear(), nm.getMonth()+1);
  const allH = [...holidays,...h2];
  const hMap = {};
  for (const h of allH) { if (!hMap[h.date]) hMap[h.date]=[]; hMap[h.date].push(h); }

  let grid = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => grid += `<div class="cal-day-header ${d==='Sat'?'shabbos':''}">${d}</div>`);
  for (let i = 0; i < startGreg.getDay(); i++) grid += '<div class="cal-cell empty"></div>';

  const today = new Date();
  const proms = [];
  for (let d = 0; d < daysInMonth; d++) { const dd = new Date(startGreg); dd.setDate(dd.getDate()+d); proms.push(fetchZmanim(dd).then(t => ({day:d+1,date:dd,times:t}))); }
  const all = await Promise.all(proms);

  for (const {day,date:dd,times} of all) {
    const dow = dd.getDay();
    const gs = dateStr(dd);
    const dh = hMap[gs]||[];
    const yt = dh.find(h => isYomTov(h));
    const ev = dh.find(h => isErev(h));
    let cls = 'cal-cell';
    if (dow===6) cls += ' shabbos';
    if (yt) cls += ' yomtov';
    if (ev && dow!==6 && !yt) cls += ' erev';
    if (isSameDay(dd,today)) cls += ' today';

    let tag = '';
    const sp = dh.find(h => h.category!=='parashat' && h.category!=='dafyomi');
    if (sp) tag = `<span class="cal-holiday-tag">${sp.title.replace('Rosh Hashana ','RH ').replace('Yom Kippur','YK').replace("Sukkot ","Sukkos ").replace("Shmini Atzeret","Sh. Atz.").replace("Simchat Torah","Sim. Torah").replace("Tzom Gedaliah","Tzom Ged.")}</span>`;

    const sunset = times.sunset;
    const mbsk = offsetMinutes(sunset,-15);
    let dv = '';
    if (dow===6 || yt) {
      const mb = offsetMinutes(sunset,CONFIG.minchaShabbosBeisOffset);
      const mv = offsetMinutes(sunset,CONFIG.maarivShabbosOffset);
      dv = `<div>Shach. 8:30</div><div>Min. א׳ 2:15</div><div>Min. ב׳ ${fmtTimeShort(mb)}</div><div>Maar. ${fmtTimeShort(mv)}</div>`;
    } else if (dow===0) {
      dv = `<div>Shach. 8:45</div><div>Min. 1:45, ${fmtTimeShort(mbsk)}</div><div>Maar. ${fmtTimeShort(sunset)}, 9:45</div>`;
    } else {
      dv = `<div>Shach. 6:45, 7:30</div><div>Min. 1:45, ${fmtTimeShort(mbsk)}</div><div>Maar. ${fmtTimeShort(sunset)}, 9:45</div>`;
    }

    grid += `<div class="${cls}"><div class="cal-date-header"><span class="cal-hebrew-date">${HEBREW_NUMS[day]}</span><span class="cal-greg-date">${MONTH_NAMES[dd.getMonth()].slice(0,3)} ${dd.getDate()}</span></div>${tag}<div class="cal-times">${dv}</div></div>`;
  }
  document.getElementById('calendarGrid').innerHTML = grid;
}

const HEBREW_MONTH_ORDER = ['Tishrei','Cheshvan','Kislev','Tevet','Shvat','Adar','Nisan','Iyyar','Sivan','Tamuz','Av','Elul'];

function nextHebrewMonth() {
  const i = HEBREW_MONTH_ORDER.indexOf(calendarMonth.hm);
  calendarMonth = i===HEBREW_MONTH_ORDER.length-1 ? {hm:HEBREW_MONTH_ORDER[0],hy:calendarMonth.hy+1} : {hm:HEBREW_MONTH_ORDER[i+1],hy:calendarMonth.hy};
  renderCalendar();
}
function prevHebrewMonth() {
  const i = HEBREW_MONTH_ORDER.indexOf(calendarMonth.hm);
  calendarMonth = i===0 ? {hm:HEBREW_MONTH_ORDER[HEBREW_MONTH_ORDER.length-1],hy:calendarMonth.hy-1} : {hm:HEBREW_MONTH_ORDER[i-1],hy:calendarMonth.hy};
  renderCalendar();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active',t.dataset.tab===tab));
  document.getElementById('tab-zmanim').classList.toggle('hidden',tab!=='zmanim');
  document.getElementById('tab-calendar').classList.toggle('hidden',tab!=='calendar');
  if (tab==='calendar') renderCalendar();
}

function goToDate(date) {
  currentDate = new Date(date);
  calendarMonth = null;
  zmanimCache = {};
  renderZmanimTab();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.getElementById('btnToday').addEventListener('click', () => goToDate(new Date()));
  document.getElementById('btnPrev').addEventListener('click', () => { currentDate.setDate(currentDate.getDate()-1); goToDate(currentDate); });
  document.getElementById('btnNext').addEventListener('click', () => { currentDate.setDate(currentDate.getDate()+1); goToDate(currentDate); });
  document.getElementById('calPrev').addEventListener('click', prevHebrewMonth);
  document.getElementById('calNext').addEventListener('click', nextHebrewMonth);
  renderZmanimTab();
});
