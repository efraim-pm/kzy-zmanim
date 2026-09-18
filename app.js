/* ============================================================
   Jewish Calendar & Zmanim — Kehel Zichron Yaakov
   Chestnut Ridge, NY
   Matches KosherJava NOAA Calculator exactly
   ============================================================ */

// ===== CONFIG =====
const CONFIG = {
  lat: 41.0903,
  lon: -74.0484,
  elevation: 141, // meters
  tzid: 'America/New_York',
  shulName: 'Kehel Zichron Yaakov',
  shulNameHe: 'קהל זכרון יעקב',
  ravName: 'Rabbi Dovid Simons',
  address: '4 Red Schoolhouse Rd, Chestnut Ridge, NY 10977',
};

// ===== STATE =====
let currentDate = new Date();
let calendarMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  loadNewsletterDraft();
});

function renderAll() {
  renderZmanim();
  renderCalendar();
  renderNewsletterInfo();
}

// ===== NAVIGATION =====
function goToday() { currentDate = new Date(); calendarMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); renderAll(); }
function prevDay() { currentDate.setDate(currentDate.getDate() - 1); renderAll(); }
function nextDay() { currentDate.setDate(currentDate.getDate() + 1); renderAll(); }
function prevMonth() { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); }
function nextMonth() { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); }

// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).classList.add('active');
  if (tab === 'calendar') renderCalendar();
}

// ============================================================
// LOCAL NOAA SOLAR CALCULATOR (matches KosherJava exactly)
// ============================================================

// Midnight-based Julian Day — matches KosherJava's getJulianDay()
function toJulianDay(date) {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  const d = date.getDate();
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function toJulianCenturies(jd) {
  return (jd - 2451545.0) / 36525.0;
}

// Solar noon using actual JD — matches KosherJava's getSolarNoonUTC()
function solarNoonUTC(jd, lon) {
  const tnoon = toJulianCenturies(jd + (-lon / 360));
  let eqTime = eqOfTime(tnoon);
  const solNoon = 720 + (-lon * 4) - eqTime;
  const newt = toJulianCenturies(jd + solNoon / 1440.0);
  eqTime = eqOfTime(newt);
  let nv = 720 + (-lon * 4) - eqTime;
  while (nv < 0) nv += 1440;
  while (nv >= 1440) nv -= 1440;
  return nv;
}

function eqOfTime(t) {
  const eps = obliqCorr(t);
  const l0 = geomMeanLongSun(t);
  const e = eccentEarthOrbit(t);
  const m = geomMeanAnomalySun(t);
  let y = Math.tan(degToRad(eps) / 2);
  y *= y;
  const sin2l0 = Math.sin(2 * degToRad(l0));
  const sinm = Math.sin(degToRad(m));
  const cos2l0 = Math.cos(2 * degToRad(l0));
  const sin4l0 = Math.sin(4 * degToRad(l0));
  const sin2m = Math.sin(2 * degToRad(m));
  const eq = y * sin2l0 - 2 * e * sinm + 4 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
  return radToDeg(eq) * 4;
}

function geomMeanLongSun(t) { let l = 280.46646 + t * (36000.76983 + 0.0003032 * t); while (l > 360) l -= 360; while (l < 0) l += 360; return l; }
function geomMeanAnomalySun(t) { return 357.52911 + t * (35999.05029 - 0.0001537 * t); }
function eccentEarthOrbit(t) { return 0.016708634 - t * (0.000042037 + 0.0000001267 * t); }
function obliqCorr(t) {
  const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const omega = 125.04 - 1934.136 * t;
  return e0 + 0.00256 * Math.cos(degToRad(omega));
}
function sunDeclination(t) {
  const e = obliqCorr(t);
  const lambda = sunApparentLong(t);
  return radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(lambda))));
}
function sunApparentLong(t) {
  const o = sunTrueLong(t);
  const omega = 125.04 - 1934.136 * t;
  return o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
}
function sunTrueLong(t) { return geomMeanLongSun(t) + sunEqOfCenter(t); }
function sunEqOfCenter(t) {
  const m = degToRad(geomMeanAnomalySun(t));
  return Math.sin(m) * (1.9146 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * m) * (0.019993 - 0.000101 * t) + Math.sin(3 * m) * 0.000289;
}

function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }

function sunriseUTCForAngle(jd, lat, lon, angle, rising) {
  const noonmin = solarNoonUTC(jd, lon);
  const tnoon = toJulianCenturies(jd + noonmin / 1440.0);
  const decl = sunDeclination(tnoon);
  const hourAngle = hourAngleForAngle(lat, decl, angle);
  if (isNaN(hourAngle)) return NaN;
  const delta = rising ? hourAngle : -hourAngle;
  const timeUTC = 720 - 4 * (lon + delta) - eqOfTime(tnoon);
  const newt = toJulianCenturies(jd + timeUTC / 1440.0);
  const decl2 = sunDeclination(newt);
  const hourAngle2 = hourAngleForAngle(lat, decl2, angle);
  if (isNaN(hourAngle2)) return NaN;
  const delta2 = rising ? hourAngle2 : -hourAngle2;
  return 720 - 4 * (lon + delta2) - eqOfTime(newt);
}

function hourAngleForAngle(lat, decl, angle) {
  const latRad = degToRad(lat);
  const declRad = degToRad(decl);
  const cosHA = (Math.cos(degToRad(90 + angle)) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
  if (cosHA > 1 || cosHA < -1) return NaN;
  return radToDeg(Math.acos(cosHA));
}

function elevationAdjustment(elevation) {
  const earthRadius = 6356900;
  return radToDeg(Math.acos(earthRadius / (earthRadius + elevation)));
}

/**
 * Get all zmanim for a given date.
 * Sunrise/sunset at SEA LEVEL (0.833°) — matches KosherJava maps.
 */
function getZmanim(date) {
  const jd = toJulianDay(date);
  const tz = getTimezoneOffset(date);

  // Sea level zenith (standard refraction only, NO elevation adjustment)
  const seaLevelZenith = 0.833;

  function utcToLocal(utcMin) {
    if (isNaN(utcMin)) return null;
    return utcMin - tz;
  }

  // Truncate to minute (Math.floor) — matches KosherJava
  function minutesToDate(min) {
    if (min === null || isNaN(min)) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(Math.floor(min));
    return d;
  }

  // Sea level sunrise & sunset
  const sunriseMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, seaLevelZenith, true));
  const sunsetMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, seaLevelZenith, false));
  const noonMin = utcToLocal(solarNoonUTC(jd, CONFIG.lon));

  // Alos Hashachar — 16.1° below horizon
  const alosMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 16.1, true));

  // Misheyakir — 11° below horizon
  const misheyakirMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 11, true));

  // GRA shaos zmanios (sea level sunrise to sea level sunset)
  const dayLengthMin = (sunsetMin !== null && sunriseMin !== null) ? sunsetMin - sunriseMin : null;
  const shaahGRA = dayLengthMin !== null ? dayLengthMin / 12 : null;

  // MGA 72-minute shaos zmanios
  const alos72Min = sunriseMin !== null ? sunriseMin - 72 : null;
  const tzeis72DeriveMin = sunsetMin !== null ? sunsetMin + 72 : null;
  const dayLengthMGA = (tzeis72DeriveMin !== null && alos72Min !== null) ? tzeis72DeriveMin - alos72Min : null;
  const shaahMGA = dayLengthMGA !== null ? dayLengthMGA / 12 : null;

  // Sof Zman Shema
  const shemaGraMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 3 * shaahGRA : null;
  const shemaMGAMin = (alos72Min !== null && shaahMGA !== null) ? alos72Min + 3 * shaahMGA : null;

  // Sof Zman Tefilla
  const tefillaGraMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 4 * shaahGRA : null;
  const tefillaMGAMin = (alos72Min !== null && shaahMGA !== null) ? alos72Min + 4 * shaahMGA : null;

  // Chatzos — astronomical solar noon
  const chatzosMin = noonMin;

  // Mincha Gedola GRA — chatzos + 30 fixed minutes (matches KosherJava maps)
  const minchaGedolaMin = chatzosMin !== null ? chatzosMin + 30 : null;

  // Mincha Ketana — sunrise + 9.5 shaos GRA
  const minchaKetanaMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 9.5 * shaahGRA : null;

  // Plag HaMincha GRA — sunrise + 10.75 shaos
  const plagMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 10.75 * shaahGRA : null;

  // Shkiah (sea level sunset)
  const shkiahMin = sunsetMin;

  // Tzeis — 8.5° below horizon
  const tzeisMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 8.5, false));

  // Tzeis 72 — 72 minutes after sea level sunset
  const tzeis72Min = sunsetMin !== null ? sunsetMin + 72 : null;

  // Candle lighting — 18 minutes before sea level sunset
  const candleLightingMin = sunsetMin !== null ? sunsetMin - 18 : null;

  return {
    alos: minutesToDate(alosMin),
    misheyakir: minutesToDate(misheyakirMin),
    sunrise: minutesToDate(sunriseMin),
    shemaGra: minutesToDate(shemaGraMin),
    shemaMGA: minutesToDate(shemaMGAMin),
    tefillaGra: minutesToDate(tefillaGraMin),
    tefillaMGA: minutesToDate(tefillaMGAMin),
    chatzos: minutesToDate(chatzosMin),
    minchaGedola: minutesToDate(minchaGedolaMin),
    minchaKetana: minutesToDate(minchaKetanaMin),
    plag: minutesToDate(plagMin),
    shkiah: minutesToDate(shkiahMin),
    tzeis: minutesToDate(tzeisMin),
    tzeis72: minutesToDate(tzeis72Min),
    candleLighting: minutesToDate(candleLightingMin),
    shaahZmanis: shaahGRA,
  };
}

function getTimezoneOffset(date) {
  return date.getTimezoneOffset();
}

// ===== TIME FORMATTING (H:MM AM/PM — no seconds) =====
function fmtTime(date) {
  if (!date) return '--:--';
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}
function fmtTime24(date) {
  if (!date) return '--:--';
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ============================================================
// HEBREW DATE FUNCTIONS (using Hebcal API for dates/holidays)
// ============================================================

function hebrewYearStr(year) {
  const letters = {1:'א',2:'ב',3:'ג',4:'ד',5:'ה',6:'ו',7:'ז',8:'ח',9:'ט',10:'י',20:'כ',30:'ל',40:'מ',50:'נ',60:'ס',70:'ע',80:'פ',90:'צ',100:'ק',200:'ר',300:'ש',400:'ת'};
  let remainder = year % 1000;
  let str = '';
  while (remainder >= 100) {
    if (remainder >= 400) { str += 'ת'; remainder -= 400; }
    else if (remainder >= 300) { str += 'ש'; remainder -= 300; }
    else if (remainder >= 200) { str += 'ר'; remainder -= 200; }
    else { str += 'ק'; remainder -= 100; }
  }
  if (remainder >= 10) {
    if (remainder === 15) { str += 'טו'; remainder = 0; }
    else if (remainder === 16) { str += 'טז'; remainder = 0; }
    else { const tens = Math.floor(remainder / 10) * 10; str += letters[tens]; remainder -= tens; }
  }
  if (remainder > 0) str += letters[remainder];
  if (str.length > 1) str = str.slice(0, -1) + '״' + str.slice(-1);
  else if (str.length === 1) str += '׳';
  return str;
}

const hebcalCache = {};

async function getHebcalData(date) {
  const key = date.toISOString().split('T')[0];
  if (hebcalCache[key]) return hebcalCache[key];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&M=on&s=on&D=on&d=on&o=on&F=on&lg=he`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[key] = data;
    return data;
  } catch (e) {
    console.error('Hebcal fetch error:', e);
    return null;
  }
}

async function getHebrewDate(date) {
  const key = date.toISOString().split('T')[0];
  try {
    const url = `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth() + 1}&gd=${date.getDate()}&g2h=1`;
    const resp = await fetch(url);
    return await resp.json();
  } catch (e) {
    console.error('Hebrew date fetch error:', e);
    return null;
  }
}

async function getHebcalMonthData(year, month) {
  const cacheKey = `month_${year}_${month}`;
  if (hebcalCache[cacheKey]) return hebcalCache[cacheKey];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month + 1}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&M=on&s=on&D=on&d=on&o=on&F=on&lg=he&c=on`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[cacheKey] = data;
    return data;
  } catch (e) {
    console.error('Hebcal month fetch error:', e);
    return null;
  }
}

// ============================================================
// DAVENING SCHEDULE LOGIC
// ============================================================

function getDayOfWeek(date) { return date.getDay(); }
function isShabbos(date) { return date.getDay() === 6; }

async function isRoshChodesh(date) {
  const hd = await getHebrewDate(date);
  if (!hd) return false;
  return hd.hd === 1 || hd.hd === 30;
}

function isUSHoliday(date) {
  const m = date.getMonth();
  const d = date.getDate();
  const dow = date.getDay();
  if (m === 0 && d === 1) return true;
  if (m === 6 && d === 4) return true;
  if (m === 11 && d === 25) return true;
  if (m === 4 && dow === 1 && d > 24) return true;
  if (m === 8 && dow === 1 && d <= 7) return true;
  if (m === 10 && dow === 4 && d >= 22 && d <= 28) return true;
  return false;
}

function getShabbosMinchaBTime(shkiah) {
  if (!shkiah) return null;
  const shkiahTotalMin = shkiah.getHours() * 60 + shkiah.getMinutes();
  if (shkiahTotalMin >= 1135) {
    const d = new Date(shkiah);
    d.setHours(18, 15, 0, 0);
    return d;
  } else {
    const d = new Date(shkiah);
    d.setMinutes(d.getMinutes() - 40);
    return d;
  }
}

async function getDaveningSchedule(date, zmanim) {
  const dow = getDayOfWeek(date);
  const rc = await isRoshChodesh(date);
  const shabbos = isShabbos(date);
  const usHoliday = isUSHoliday(date);

  const schedule = { weekday: {}, shabbos: {}, notes: [] };

  if (shabbos) {
    schedule.shabbos = {
      shacharis: '8:30 AM',
      minchaB: fmtTime(getShabbosMinchaBTime(zmanim.shkiah)),
      maariv: zmanim.shkiah ? fmtTime(new Date(zmanim.shkiah.getTime() + 55 * 60000)) : '--:--',
    };
    schedule.shabbos.minchaA = '2:15 PM';
  } else {
    if (rc) {
      schedule.weekday.shacharis = '6:30 AM';
      schedule.notes.push('Rosh Chodesh Shacharis');
    } else if (dow === 0 || usHoliday) {
      schedule.weekday.shacharis = '8:45 AM';
    } else {
      schedule.weekday.shacharis = '7:00 AM';
    }

    if (zmanim.shkiah) {
      const shkiahMin = zmanim.shkiah.getHours() * 60 + zmanim.shkiah.getMinutes();
      if (shkiahMin >= 1095) {
        schedule.weekday.mincha = fmtTime(zmanim.shkiah) + ' (at shkiah)';
        schedule.weekday.maariv = '9:45 PM';
      } else if (shkiahMin >= 1005) {
        schedule.weekday.mincha = fmtTime(new Date(zmanim.shkiah.getTime() - 10 * 60000));
        schedule.weekday.maariv = '8:15 PM';
      } else {
        schedule.weekday.mincha = fmtTime(new Date(zmanim.shkiah.getTime() - 10 * 60000));
        schedule.weekday.maariv = fmtTime(zmanim.shkiah);
      }
    }
  }

  return schedule;
}

// ============================================================
// ZMANIM TAB RENDERING
// ============================================================
async function renderZmanim() {
  const date = currentDate;
  const zmanim = getZmanim(date);
  const hd = await getHebrewDate(date);
  const hebcal = await getHebcalData(date);

  const heroEl = document.getElementById('date-hero');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const engDate = date.toLocaleDateString('en-US', options);
  let hebDate = '';
  let badges = '';

  if (hd) {
    hebDate = `${hd.hebrew}`;
  }

  if (hebcal && hebcal.items) {
    const dateStr = date.toISOString().split('T')[0];
    const todayEvents = hebcal.items.filter(i => i.date === dateStr || (i.date && i.date.startsWith(dateStr)));
    todayEvents.forEach(ev => {
      if (ev.category === 'holiday' || ev.category === 'roshchodesh') {
        badges += `<span class="badge">${ev.title}</span>`;
      } else if (ev.category === 'parashat') {
        badges += `<span class="badge blue">${ev.title}</span>`;
      }
    });
  }

  let nextShabbos = new Date(date);
  while (nextShabbos.getDay() !== 6) nextShabbos.setDate(nextShabbos.getDate() + 1);
  const nextZmanim = getZmanim(nextShabbos);

  heroEl.innerHTML = `
    <div class="date-main">
      <div class="date-english">${engDate}</div>
      <div class="date-hebrew">${hebDate}</div>
      <div class="date-badges">${badges}</div>
    </div>
    <div class="next-info">
      <div class="next-label">Candle Lighting</div>
      <div class="next-value">${fmtTime(nextZmanim.candleLighting)}</div>
      <div class="next-label" style="margin-top:8px">Shkiah</div>
      <div class="next-value">${fmtTime(nextZmanim.shkiah)}</div>
    </div>
  `;

  // Morning times
  const morningEl = document.getElementById('morning-times');
  morningEl.innerHTML = zmanRow('Alos Hashachar', 'עלות השחר', '16.1° below horizon', zmanim.alos) +
    zmanRow('Misheyakir', 'משיכיר', '11° below horizon', zmanim.misheyakir) +
    zmanRow('Netz (Sunrise)', 'הנץ החמה', 'Sea level', zmanim.sunrise, 'highlight') +
    zmanRow('Sof Zman Shema (MGA)', 'סוף זמן ק״ש מג״א', '72-minute MGA', zmanim.shemaMGA) +
    zmanRow('Sof Zman Shema (GRA)', 'סוף זמן ק״ש גר״א', 'Sea level', zmanim.shemaGra) +
    zmanRow('Sof Zman Tefilla (MGA)', 'סוף זמן תפילה מג״א', '72-minute MGA', zmanim.tefillaMGA) +
    zmanRow('Sof Zman Tefilla (GRA)', 'סוף זמן תפילה גר״א', 'Sea level', zmanim.tefillaGra) +
    zmanRow('Chatzos', 'חצות', 'Astronomical noon', zmanim.chatzos);

  // Evening times
  const eveningEl = document.getElementById('evening-times');
  eveningEl.innerHTML = zmanRow('Mincha Gedola', 'מנחה גדולה', 'Chatzos + 30 min', zmanim.minchaGedola) +
    zmanRow('Plag HaMincha', 'פלג המנחה', '10.75 shaos GRA', zmanim.plag) +
    zmanRow('Candle Lighting', 'הדלקת נרות', '18 min before sunset', zmanim.candleLighting) +
    zmanRow('Shkiah (Sunset)', 'שקיעה', 'Sea level', zmanim.shkiah, 'sunset') +
    zmanRow('Tzeis Hakochavim', 'צאת הכוכבים', '8.5° below horizon', zmanim.tzeis) +
    zmanRow('Tzeis (72 min)', 'ר״ת', '72 min after sunset', zmanim.tzeis72);

  // Davening section
  const daveningEl = document.getElementById('davening-section');
  const sched = await getDaveningSchedule(date, zmanim);
  let daveningHTML = '<h3>🕐 Davening Schedule</h3>';

  if (isShabbos(date)) {
    daveningHTML += '<h4>Shabbos</h4>';
    daveningHTML += davenRow('Shacharis', 'שחרית', sched.shabbos.shacharis, true);
    daveningHTML += davenRow('Mincha א', 'מנחה א', sched.shabbos.minchaA, true);
    daveningHTML += davenRow('Mincha ב', 'מנחה ב', sched.shabbos.minchaB, true);
    daveningHTML += davenRow('Maariv', 'מעריב', sched.shabbos.maariv, true);
  } else {
    daveningHTML += '<h4>Weekday</h4>';
    daveningHTML += davenRow('Shacharis', 'שחרית', sched.weekday.shacharis, false, sched.notes.join(', '));
    if (sched.weekday.mincha) daveningHTML += davenRow('Mincha', 'מנחה', sched.weekday.mincha);
    if (sched.weekday.maariv) daveningHTML += davenRow('Maariv', 'מעריב', sched.weekday.maariv);
  }

  daveningEl.innerHTML = daveningHTML;
}

function zmanRow(nameEn, nameHe, desc, time, cls) {
  return `<div class="zman-row ${cls || ''}">
    <div class="zman-left">
      <div><span class="zman-name-en">${nameEn}</span> <span class="zman-name-he">${nameHe}</span></div>
      <div class="zman-desc">${desc}</div>
    </div>
    <div class="zman-time">${fmtTime(time)}</div>
  </div>`;
}

function davenRow(name, nameHe, time, isShabbos, note) {
  return `<div class="daven-row ${isShabbos ? 'shabbos' : ''}">
    <div class="daven-left">
      <span class="daven-name">${name}</span>
      <span class="daven-he">${nameHe}</span>
      ${note ? `<span class="daven-note">${note}</span>` : ''}
    </div>
    <div class="daven-time">${time}</div>
  </div>`;
}

// ============================================================
// CALENDAR TAB
// ============================================================
async function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthData = await getHebcalMonthData(year, month);

  const titleEl = document.getElementById('calendar-month-title');
  titleEl.textContent = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const badgeEl = document.getElementById('calendar-badge');
  if (monthData && monthData.items) {
    const hdItems = monthData.items.filter(i => i.category === 'hebdate');
    if (hdItems.length > 0) {
      const firstHeb = hdItems[0] ? hdItems[0].hebrew : '';
      badgeEl.textContent = firstHeb.replace(/[^֐-׿\s]/g, '').trim().split(' ').pop() || '';
    }
  }

  const eventsMap = {};
  if (monthData && monthData.items) {
    monthData.items.forEach(item => {
      const d = item.date ? item.date.split('T')[0] : null;
      if (!d) return;
      if (!eventsMap[d]) eventsMap[d] = { holidays: [], parsha: null, candles: null, havdalah: null, hebDate: null };
      if (item.category === 'parashat') eventsMap[d].parsha = item.title;
      else if (item.category === 'candles') eventsMap[d].candles = item.title;
      else if (item.category === 'havdalah') eventsMap[d].havdalah = item.title;
      else if (item.category === 'hebdate') eventsMap[d].hebDate = item.hebrew;
      else if (item.category === 'holiday' || item.category === 'roshchodesh') eventsMap[d].holidays.push(item.title);
    });
  }

  if (window.innerWidth < 768) {
    renderCalendarAgenda(year, month, eventsMap);
  } else {
    renderCalendarGrid(year, month, eventsMap);
  }
}

function renderCalendarGrid(year, month, eventsMap) {
  const daysHeaderEl = document.getElementById('days-header');
  const gridEl = document.getElementById('calendar-grid');
  const agendaEl = document.getElementById('calendar-agenda');
  agendaEl.style.display = 'none';
  gridEl.style.display = 'grid';
  daysHeaderEl.style.display = 'grid';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shabbos'];
  daysHeaderEl.innerHTML = dayNames.map((d, i) =>
    `<div class="day-label ${i === 6 ? 'shabbos' : ''}">${d}</div>`
  ).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isSat = dateObj.getDay() === 6;
    const ev = eventsMap[dateStr] || {};

    let cellContent = `<div class="cell-date">${d}</div>`;
    if (ev.hebDate) cellContent += `<div class="cell-hebrew">${ev.hebDate}</div>`;
    if (ev.holidays && ev.holidays.length) cellContent += `<div class="cell-holiday">${ev.holidays.join(', ')}</div>`;
    if (ev.parsha) cellContent += `<div class="cell-parsha">${ev.parsha}</div>`;
    if (ev.candles) cellContent += `<div class="cell-schedule"><strong>🕯</strong> ${ev.candles}</div>`;
    if (ev.havdalah) cellContent += `<div class="cell-schedule"><strong>✨</strong> ${ev.havdalah}</div>`;

    if (isSat) {
      const z = getZmanim(dateObj);
      cellContent += `<div class="cell-schedule"><strong>Shacharis:</strong> 8:30 AM</div>`;
      cellContent += `<div class="cell-schedule"><strong>Shkiah:</strong> ${fmtTime(z.shkiah)}</div>`;
    }

    cells += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSat ? 'shabbos' : ''}">${cellContent}</div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    cells += '<div class="cal-cell empty"></div>';
  }

  gridEl.innerHTML = cells;
}

function renderCalendarAgenda(year, month, eventsMap) {
  const agendaEl = document.getElementById('calendar-agenda');
  const gridEl = document.getElementById('calendar-grid');
  const daysHeaderEl = document.getElementById('days-header');
  gridEl.style.display = 'none';
  daysHeaderEl.style.display = 'none';
  agendaEl.style.display = 'block';

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let html = '';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isSat = dateObj.getDay() === 6;
    const ev = eventsMap[dateStr] || {};
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += `<div class="agenda-card ${isToday ? 'today' : ''} ${isSat ? 'shabbos' : ''}">
      <div class="agenda-date"><span class="eng">${dayName}</span><span class="heb">${ev.hebDate || ''}</span></div>
      ${ev.holidays && ev.holidays.length ? `<div class="agenda-holiday">${ev.holidays.join(', ')}</div>` : ''}
      ${ev.parsha ? `<div class="agenda-parsha">${ev.parsha}</div>` : ''}
      ${ev.candles ? `<div class="agenda-schedule"><strong>🕯</strong> ${ev.candles}</div>` : ''}
      ${ev.havdalah ? `<div class="agenda-schedule"><strong>✨</strong> ${ev.havdalah}</div>` : ''}
    </div>`;
  }

  agendaEl.innerHTML = html;
}

// ============================================================
// NEWSLETTER GENERATOR
// ============================================================

function renderNewsletterInfo() {
  const infoEl = document.getElementById('nl-date-info');
  let shabbos = new Date();
  while (shabbos.getDay() !== 6) shabbos.setDate(shabbos.getDate() + 1);
  const shabbosStr = shabbos.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  infoEl.textContent = `📅 Generating for Shabbos: ${shabbosStr}`;
}

function isPirkeiAvosSeason(date) {
  const month = date.getMonth();
  return month >= 3 && month <= 8;
}

async function renderNewsletter() {
  const nlPage = document.getElementById('nl-page');
  nlPage.innerHTML = '<div class="nl-placeholder">Generating newsletter...</div>';

  let friday = new Date();
  while (friday.getDay() !== 5) friday.setDate(friday.getDate() + 1);
  let shabbos = new Date(friday);
  shabbos.setDate(shabbos.getDate() + 1);

  const fridayZmanim = getZmanim(friday);
  const shabbosZmanim = getZmanim(shabbos);

  const fridayHd = await getHebrewDate(friday);
  const shabbosHd = await getHebrewDate(shabbos);

  const hebcalData = await getHebcalData(shabbos);
  let parsha = 'פרשת השבוע';
  let parshaEn = '';
  if (hebcalData && hebcalData.items) {
    const parashat = hebcalData.items.find(i => i.category === 'parashat');
    if (parashat) {
      parsha = parashat.hebrew || parashat.title;
      parshaEn = parashat.title;
    }
  }

  const minchaOverride = document.getElementById('nl-mincha-override').value;
  const avosOverride = document.getElementById('nl-avos-override').value;
  const minchaBOverride = document.getElementById('nl-minchab-override').value;
  const torahStoriesOverride = document.getElementById('nl-torahstories-override').value;
  const shiurTopic = document.getElementById('nl-shiur-topic').value;
  const avosUbanimOverride = document.getElementById('nl-avosubanim-override').value;
  const maarivOverride = document.getElementById('nl-maariv-override').value;
  const specialShiur = document.getElementById('nl-special-shiur').value;
  const simcha = document.getElementById('nl-simcha').value;
  const announcements = document.getElementById('nl-announcements').value;
  const sponsors = document.getElementById('nl-sponsors').value;
  const seudos = document.getElementById('nl-seudos').value;

  const candleLighting = fmtTime(fridayZmanim.candleLighting);
  const minchaErev = minchaOverride || fmtTime(new Date(fridayZmanim.shkiah.getTime() - 18 * 60000));
  const shkiah = fmtTime(shabbosZmanim.shkiah);
  const minchaBTime = minchaBOverride || fmtTime(getShabbosMinchaBTime(shabbosZmanim.shkiah));
  const maarivTime = maarivOverride || fmtTime(new Date(shabbosZmanim.shkiah.getTime() + 55 * 60000));
  const torahStoriesTime = torahStoriesOverride || '9:45 AM';

  const isAvos = isPirkeiAvosSeason(shabbos);
  const avosChapter = avosOverride || (isAvos ? 'פרק א' : '');

  const isSummer = shabbosZmanim.shkiah && (shabbosZmanim.shkiah.getHours() * 60 + shabbosZmanim.shkiah.getMinutes()) >= 1135;
  const shaloshSeudos = isSummer ? '' : 'Shalosh Seudos in shul';

  const engDateStr = shabbos.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const hebDateStr = shabbosHd ? shabbosHd.hebrew : '';

  const emblemUrl = 'emblem.png';

  nlPage.innerHTML = `
    <div class="nl-header">
      <div class="nl-logo"><img src="${emblemUrl}" alt="KZY Emblem"></div>
      <div class="nl-parsha">
        <h1>${parsha}</h1>
        <div class="nl-shul-sub">${CONFIG.shulName} · ${CONFIG.shulNameHe}</div>
      </div>
      <div class="nl-dates">
        <div class="nl-heb-date">${hebDateStr}</div>
        <div class="nl-eng-date">${engDateStr}</div>
        ${isAvos ? `<div class="nl-avos-ref">${avosChapter}</div>` : ''}
      </div>
    </div>

    <div class="nl-body">
      <div class="nl-left">
        ${simcha ? `<div class="nl-announce-box highlight"><strong>מזל טוב!</strong>${simcha}</div>` : ''}
        ${announcements ? `<div class="nl-announce-box"><strong>📢 Announcements</strong>${announcements}</div>` : ''}

        ${isAvos ? `
        <div class="nl-pirkei-avos">
          <div class="pa-title">פרקי אבות</div>
          <div class="pa-time">${avosChapter}</div>
        </div>
        <hr class="nl-divider">
        ` : ''}

        ${shaloshSeudos ? `
        <div class="nl-section-title">סעודה שלישית</div>
        <div class="nl-section-body">${shaloshSeudos}${seudos ? '<br>' + seudos : ''}</div>
        <hr class="nl-divider">
        ` : (seudos ? `
        <div class="nl-section-title">סעודה שלישית</div>
        <div class="nl-section-body">${seudos}</div>
        <hr class="nl-divider">
        ` : '')}

        ${shiurTopic ? `
        <div class="nl-section-title">שיעור</div>
        <div class="nl-section-body">${shiurTopic}</div>
        <hr class="nl-divider">
        ` : ''}

        ${specialShiur ? `
        <div class="nl-section-title">Special Shiur / Event</div>
        <div class="nl-section-body">${specialShiur}</div>
        <hr class="nl-divider">
        ` : ''}

        ${sponsors ? `
        <div class="nl-section-title">Sponsors & Dedications</div>
        <div class="nl-section-body">${sponsors}</div>
        ` : ''}
      </div>

      <div class="nl-right">
        <table class="nl-schedule-table">
          <tr><th colspan="2">לוח זמנים לשבת קודש</th></tr>
          <tr class="bold"><td>הדלקת נרות</td><td>${candleLighting}</td></tr>
          <tr><td>מנחה ערב שבת</td><td>${minchaErev}</td></tr>
          <tr class="section-break"><td>קבלת שבת</td><td>After Mincha</td></tr>
          <tr><td>Torah & Stories</td><td>${torahStoriesTime}</td></tr>
          <tr class="bold"><td>שחרית</td><td>8:30 AM</td></tr>
          <tr><td>סוף זמן ק״ש (גר״א)</td><td>${fmtTime(shabbosZmanim.shemaGra)}</td></tr>
          <tr><td>סוף זמן ק״ש (מג״א)</td><td>${fmtTime(shabbosZmanim.shemaMGA)}</td></tr>
          <tr class="section-break"><td>חצות</td><td>${fmtTime(shabbosZmanim.chatzos)}</td></tr>
          <tr><td>מנחה א</td><td>2:15 PM</td></tr>
          <tr class="bold"><td>מנחה ב</td><td>${minchaBTime}</td></tr>
          <tr><td>שקיעה</td><td>${shkiah}</td></tr>
          <tr class="bold section-break"><td>מעריב / הבדלה</td><td>${maarivTime}</td></tr>
        </table>

        <table class="nl-weekday-table">
          <tr><th colspan="2">Weekday Schedule</th></tr>
          <tr><td>שחרית (Mon-Fri)</td><td>7:00 AM</td></tr>
          <tr><td>שחרית (Sunday)</td><td>8:45 AM</td></tr>
          <tr><td>מעריב (Nightly)</td><td>${maarivOverride || '8:30 PM'}</td></tr>
        </table>
      </div>
    </div>

    <div class="nl-footer">
      <strong>${CONFIG.shulName} · ${CONFIG.shulNameHe}</strong><br>
      ${CONFIG.address}<br>
      ${CONFIG.ravName} · לעילוי נשמת ר׳ יעקב דב שטרנבוך ז״ל
    </div>
  `;
}

function printNewsletter() {
  window.print();
}

function saveNewsletterDraft() {
  const fields = ['nl-mincha-override', 'nl-avos-override', 'nl-minchab-override', 'nl-torahstories-override',
    'nl-shiur-topic', 'nl-avosubanim-override', 'nl-maariv-override', 'nl-special-shiur',
    'nl-simcha', 'nl-announcements', 'nl-sponsors', 'nl-seudos'];
  const draft = {};
  fields.forEach(id => { draft[id] = document.getElementById(id).value; });
  draft._savedAt = new Date().toISOString();
  localStorage.setItem('kzy-newsletter-draft', JSON.stringify(draft));
  alert('Draft saved!');
}

function loadNewsletterDraft() {
  const saved = localStorage.getItem('kzy-newsletter-draft');
  if (!saved) return;
  try {
    const draft = JSON.parse(saved);
    Object.keys(draft).forEach(id => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if (el) el.value = draft[id];
    });
  } catch (e) {
    console.error('Error loading draft:', e);
  }
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderCalendar(), 250);
});
