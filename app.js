/* ============================================================
   Jewish Calendar & Zmanim — Kehel Zichron Yaakov
   Chestnut Ridge, NY
   NOAA Calculator matches KosherJava exactly
   ============================================================ */

// ===== CONFIG =====
const CONFIG = {
  lat: 41.0903,
  lon: -74.0484,
  elevation: 141,
  tzid: 'America/New_York',
  shulName: 'Kehel Zichron Yaakov',
  shulNameHe: 'קהל זכרון יעקב',
  ravName: 'Rabbi Dovid Simons',
  address: '4 Red Schoolhouse Rd, Chestnut Ridge, NY 10977',
  // Major legal holidays (month 0-indexed)
  // Bein Hazmanim ranges (manually configured) — [start, end] inclusive
  beinHazmanim: [
    // Example: ['2026-07-01', '2026-07-21'],
  ],
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

// ============================================================
// ZMANIM ENGINE
// ============================================================

function getZmanim(date) {
  const jd = toJulianDay(date);
  const tz = date.getTimezoneOffset();
  const seaLevelZenith = 0.833;

  function utcToLocal(utcMin) {
    if (isNaN(utcMin)) return null;
    return utcMin - tz;
  }

  function minutesToDate(min) {
    if (min === null || isNaN(min)) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(Math.floor(min));
    return d;
  }

  const sunriseMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, seaLevelZenith, true));
  const sunsetMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, seaLevelZenith, false));
  const noonMin = utcToLocal(solarNoonUTC(jd, CONFIG.lon));
  const alosMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 16.1, true));
  const misheyakirMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 11, true));
  const tzeisMin = utcToLocal(sunriseUTCForAngle(jd, CONFIG.lat, CONFIG.lon, 8.5, false));

  const dayLengthMin = (sunsetMin !== null && sunriseMin !== null) ? sunsetMin - sunriseMin : null;
  const shaahGRA = dayLengthMin !== null ? dayLengthMin / 12 : null;

  const alos72Min = sunriseMin !== null ? sunriseMin - 72 : null;
  const tzeis72DeriveMin = sunsetMin !== null ? sunsetMin + 72 : null;
  const dayLengthMGA = (tzeis72DeriveMin !== null && alos72Min !== null) ? tzeis72DeriveMin - alos72Min : null;
  const shaahMGA = dayLengthMGA !== null ? dayLengthMGA / 12 : null;

  const shemaGraMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 3 * shaahGRA : null;
  const shemaMGAMin = (alos72Min !== null && shaahMGA !== null) ? alos72Min + 3 * shaahMGA : null;
  const tefillaGraMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 4 * shaahGRA : null;
  const tefillaMGAMin = (alos72Min !== null && shaahMGA !== null) ? alos72Min + 4 * shaahMGA : null;
  const chatzosMin = noonMin;
  const minchaGedolaMin = chatzosMin !== null ? chatzosMin + 30 : null;
  const minchaKetanaMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 9.5 * shaahGRA : null;
  const plagMin = (sunriseMin !== null && shaahGRA !== null) ? sunriseMin + 10.75 * shaahGRA : null;
  const candleLightingMin = sunsetMin !== null ? sunsetMin - 18 : null;
  const tzeis72Min = sunsetMin !== null ? sunsetMin + 72 : null;

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
    shkiah: minutesToDate(sunsetMin),
    tzeis: minutesToDate(tzeisMin),
    tzeis72: minutesToDate(tzeis72Min),
    candleLighting: minutesToDate(candleLightingMin),
    shaahZmanis: shaahGRA,
    // Raw minutes for schedule calculations
    _sunriseMin: sunriseMin,
    _sunsetMin: sunsetMin,
    _minchaGedolaMin: minchaGedolaMin,
    _plagMin: plagMin,
    _tzeisMin: tzeisMin,
  };
}

// ============================================================
// TIME FORMATTING
// ============================================================

function fmtTime(date) {
  if (!date) return '--:--';
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function fmtTimeShort(date) {
  if (!date) return '--:--';
  let h = date.getHours();
  let m = date.getMinutes();
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function roundTo5(minutes) {
  return Math.round(minutes / 5) * 5;
}

function minutesToTimeStr(totalMin) {
  if (totalMin === null || isNaN(totalMin)) return '--:--';
  let h = Math.floor(totalMin / 60);
  let m = Math.floor(totalMin % 60);
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// ============================================================
// HELPER: WEEK BOUNDARIES
// ============================================================

function getWeekSunday(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================
// MAJOR HOLIDAY / DST DETECTION
// ============================================================

function isMajorUSHoliday(date) {
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

function isBeinHazmanim(date) {
  const dateStr = date.toISOString().split('T')[0];
  return CONFIG.beinHazmanim.some(([start, end]) => dateStr >= start && dateStr <= end);
}

function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdOffset;
}

// ============================================================
// HEBCAL EVENT CHECKERS
// ============================================================

function checkIsYomTov(events) {
  if (!events) return false;
  const ytKeywords = ['Rosh Hashana', 'Yom Kippur', 'Sukkot I', 'Sukkot II', 'Shmini Atzeret', 'Simchat Torah', 'Pesach I', 'Pesach II', 'Pesach VII', 'Pesach VIII', 'Shavuot I', 'Shavuot II'];
  return events.some(e => ytKeywords.some(k => e.title && e.title.includes(k)) && e.category === 'holiday');
}

function checkIsCholHamoed(events) {
  if (!events) return false;
  return events.some(e => e.title && (e.title.includes('Chol ha') || e.title.includes('Chol HaMoed')));
}

function checkIsHoshanaRabbah(events) {
  if (!events) return false;
  return events.some(e => e.title && e.title.includes('Hoshana Rabbah'));
}

function checkIsErevYomTov(events) {
  if (!events) return false;
  return events.some(e => e.title && e.title.startsWith('Erev') && e.category === 'holiday');
}

function checkIsChanukah(events) {
  if (!events) return false;
  return events.some(e => e.title && e.title.includes('Chanukah') && !e.title.includes('VIII'));
}

function checkIsRoshChodesh(events) {
  if (!events) return false;
  return events.some(e => e.category === 'roshchodesh');
}

function checkIsSecondDayYT(events) {
  if (!events) return false;
  return events.some(e => e.title && (e.title.includes(' II') || e.title.includes('VIII') || e.title.includes('Simchat Torah') || e.title.includes('Shmini Atzeret')));
}

// ============================================================
// DAVENING SCHEDULE ENGINE
// ============================================================

function getDaveningSchedule(date, zmanim, hebcalEvents) {
  const dow = date.getDay();
  const isSun = dow === 0;
  const isShab = dow === 6;
  const isFri = dow === 5;

  const isYomTov = checkIsYomTov(hebcalEvents);
  const isCholHamoed = checkIsCholHamoed(hebcalEvents);
  const isHoshanaRabbah = checkIsHoshanaRabbah(hebcalEvents);
  const isErevYomTov = checkIsErevYomTov(hebcalEvents);
  const isChanukah = checkIsChanukah(hebcalEvents);
  const isRoshChodesh = checkIsRoshChodesh(hebcalEvents);

  if (isShab) return getShabbosSchedule(date, zmanim, hebcalEvents);
  if (isYomTov) return getYomTovSchedule(date, zmanim, hebcalEvents);

  // --- WEEKDAY ---
  const schedule = { shacharis: [], mincha: [], maariv: [], type: 'weekday' };

  // ===== SHACHARIS =====
  if (isCholHamoed && !isHoshanaRabbah) {
    schedule.shacharis.push('6:45');
    schedule.shacharis.push('8:10');
    schedule.shacharis.push('8:45');
  } else {
    const earlyTime = getEarlyShacharis(date, zmanim, isRoshChodesh);
    if (earlyTime !== null) {
      schedule.shacharis.push(earlyTime);
    }

    // Netz minyan — Mon-Fri only, when sunrise > 33 min after 6:45
    const sunriseMinOfDay = zmanim._sunriseMin;
    const gapFromEarly = sunriseMinOfDay !== null ? sunriseMinOfDay - (6 * 60 + 45) : 0;
    if (!isSun && gapFromEarly > 33) {
      schedule.shacharis.push('Netz ' + fmtTimeShort(zmanim.sunrise));
    }

    // 7:30 — always Sun-Fri
    schedule.shacharis.push('7:30');

    // 8:45 — Sundays, major holidays, bein hazmanim (excl chol hamoed)
    if (isSun || isMajorUSHoliday(date) || (isBeinHazmanim(date) && !isCholHamoed)) {
      schedule.shacharis.push('8:45');
    }
  }

  // ===== MINCHA =====
  if (isFri) {
    // Erev Shabbos — exact times, no rounding
    if (isDST(date)) {
      const plagTime = zmanim._plagMin;
      if (plagTime !== null) {
        const earlyMincha = Math.floor(plagTime - 15);
        schedule.mincha.push(minutesToTimeStr(earlyMincha));
      }
    }
    const sunsetMinus15 = zmanim._sunsetMin !== null ? Math.floor(zmanim._sunsetMin - 15) : null;
    if (sunsetMinus15 !== null) {
      schedule.mincha.push(minutesToTimeStr(sunsetMinus15));
    }
  } else if (isErevYomTov && !isFri) {
    const sunsetMinus15 = zmanim._sunsetMin !== null ? Math.floor(zmanim._sunsetMin - 15) : null;
    if (sunsetMinus15 !== null) {
      schedule.mincha.push(minutesToTimeStr(sunsetMinus15));
    }
  } else if (dow >= 0 && dow <= 4) {
    // Sun-Thu regular mincha
    const mgMin = zmanim._minchaGedolaMin;

    // 12:45 — Sundays & major holidays, when MG >= 12:45
    if ((isSun || isMajorUSHoliday(date)) && mgMin !== null && mgMin >= 12 * 60 + 45) {
      schedule.mincha.push('12:45');
    }

    // 1:15 — when MG >= 1:15
    if (mgMin !== null && mgMin >= 13 * 60 + 15) {
      schedule.mincha.push('1:15');
    }

    // 1:45 — always
    schedule.mincha.push('1:45');

    // Shkiah mincha — 13-18 min before sunset, rounded to 5
    const shkiahMincha = getShkiahMincha(date, zmanim);
    if (shkiahMincha !== null) {
      schedule.mincha.push(minutesToTimeStr(shkiahMincha));
    }
  }

  // ===== MAARIV =====
  if (isFri) {
    // No separate maariv on Friday
  } else if (isErevYomTov) {
    schedule.maariv.push(fmtTimeShort(zmanim.tzeis));
  } else if (dow >= 0 && dow <= 4) {
    // At shkiah
    schedule.maariv.push(fmtTimeShort(zmanim.shkiah));

    // 5:15 Chanukah
    if (isChanukah) {
      schedule.maariv.push('5:15');
    }

    // 8:15 or latest tzais for the week
    const eveningMaariv = getEveningMaariv(date, zmanim);
    if (eveningMaariv !== null) {
      schedule.maariv.push(minutesToTimeStr(eveningMaariv));
    }

    // 9:45 always
    schedule.maariv.push('9:45');
  }

  return schedule;
}

// ===== EARLY SHACHARIS CALCULATOR =====
function getEarlyShacharis(date, zmanim, isRoshChodesh) {
  const dow = date.getDay();
  const isSun = dow === 0;
  const sunriseMin = zmanim._sunriseMin;
  if (sunriseMin === null) return '6:45';

  const baseTime = 6 * 60 + 45;
  const gap = sunriseMin - baseTime;

  // Sunday and sunrise > 33 min after 6:45 — canceled
  if (isSun && gap > 33) return null;

  // Rosh Chodesh override
  if (isRoshChodesh) return '6:30';

  // Normal — sunrise <= 22 min after 6:45
  if (gap <= 22) return '6:45';

  // Gap 23-33 — shift to keep >= 22 min before sunrise
  if (gap > 22 && gap <= 33) {
    const latest = sunriseMin - 22;
    const shifted = Math.floor(latest / 5) * 5;
    const shiftedH = Math.floor(shifted / 60);
    const shiftedM = shifted % 60;
    return `${shiftedH}:${shiftedM.toString().padStart(2, '0')}`;
  }

  // sunrise > 33 min after 6:45 (Mon-Fri) — canceled, netz replaces
  if (gap > 33) return null;

  return '6:45';
}

// ===== SHKIAH MINCHA CALCULATOR =====
function getShkiahMincha(date, zmanim) {
  if (zmanim._sunsetMin === null) return null;

  const weekSun = getWeekSunday(date);
  const sunTue = [];
  const wedThu = [];
  for (let i = 0; i <= 2; i++) {
    const d = new Date(weekSun);
    d.setDate(d.getDate() + i);
    sunTue.push(getZmanim(d)._sunsetMin);
  }
  for (let i = 3; i <= 4; i++) {
    const d = new Date(weekSun);
    d.setDate(d.getDate() + i);
    wedThu.push(getZmanim(d)._sunsetMin);
  }

  const allSunsets = [...sunTue, ...wedThu].filter(s => s !== null);
  if (allSunsets.length === 0) return null;

  const minSunset = Math.min(...allSunsets);
  const maxSunset = Math.max(...allSunsets);

  // Try one time for whole week
  const candidate = roundTo5(minSunset - 15);
  const gapFromMax = maxSunset - candidate;
  const gapFromMin = minSunset - candidate;

  if (gapFromMin >= 13 && gapFromMin <= 18 && gapFromMax >= 13 && gapFromMax <= 18) {
    return candidate;
  }

  // Split: figure out which half this date falls in
  const dow = date.getDay();
  const relevantSunsets = dow <= 2 ? sunTue : wedThu;
  const relevantMin = Math.min(...relevantSunsets.filter(s => s !== null));
  const splitCandidate = roundTo5(relevantMin - 15);
  return splitCandidate;
}

// ===== EVENING MAARIV (8:15 or latest tzais for week) =====
function getEveningMaariv(date, zmanim) {
  const weekSun = getWeekSunday(date);
  let latestTzais = 0;

  for (let i = 0; i <= 4; i++) {
    const d = new Date(weekSun);
    d.setDate(d.getDate() + i);
    const z = getZmanim(d);
    if (z.tzeis) {
      const tzaisMin = z.tzeis.getHours() * 60 + z.tzeis.getMinutes();
      if (tzaisMin > latestTzais) latestTzais = tzaisMin;
    }
  }

  const target815 = 20 * 60 + 15;

  if (latestTzais >= target815) {
    return target815;
  } else {
    return Math.floor(latestTzais);
  }
}

// ===== SHABBOS SCHEDULE =====
function getShabbosSchedule(date, zmanim, hebcalEvents) {
  const schedule = { shacharis: [], mincha: [], maariv: [], type: 'shabbos', erevMincha: [] };

  const friday = new Date(date);
  friday.setDate(friday.getDate() - 1);
  const fridayZmanim = getZmanim(friday);

  // Early kabbalas shabbos — plag - 15, exact (no rounding), only during DST
  if (isDST(friday)) {
    const plagMin = fridayZmanim._plagMin;
    if (plagMin !== null) {
      schedule.erevMincha.push(minutesToTimeStr(Math.floor(plagMin - 15)));
    }
  }

  // Regular erev shabbos mincha — sunset - 15, exact
  if (fridayZmanim._sunsetMin !== null) {
    schedule.erevMincha.push(minutesToTimeStr(Math.floor(fridayZmanim._sunsetMin - 15)));
  }

  // Shacharis
  schedule.shacharis.push('8:45');

  // Mincha A — 2:15
  schedule.mincha.push('2:15');

  // Mincha B — sunset - 40, cap at 6:15
  if (zmanim._sunsetMin !== null) {
    let minchaBMin = zmanim._sunsetMin - 40;
    const cap = 18 * 60 + 15;
    if (minchaBMin > cap) minchaBMin = cap;
    schedule.mincha.push(minutesToTimeStr(Math.floor(minchaBMin)));
  }

  // Maariv — sunset + 55, exact
  if (zmanim._sunsetMin !== null) {
    schedule.maariv.push(minutesToTimeStr(Math.floor(zmanim._sunsetMin + 55)));
  }

  return schedule;
}

// ===== YOM TOV SCHEDULE =====
function getYomTovSchedule(date, zmanim, hebcalEvents) {
  const schedule = { shacharis: [], mincha: [], maariv: [], type: 'yomtov', erevMincha: [] };

  schedule.shacharis.push('8:45');

  // Mincha — sunset - 25
  if (zmanim._sunsetMin !== null) {
    schedule.mincha.push(minutesToTimeStr(Math.floor(zmanim._sunsetMin - 25)));
  }

  const isSecondDay = checkIsSecondDayYT(hebcalEvents);
  if (isSecondDay) {
    // Motzei YT — sunset + 55
    if (zmanim._sunsetMin !== null) {
      schedule.maariv.push(minutesToTimeStr(Math.floor(zmanim._sunsetMin + 55)));
    }
  } else {
    // Day 1 — Tzais 8.5°
    schedule.maariv.push(fmtTimeShort(zmanim.tzeis));
  }

  return schedule;
}

// ============================================================
// HEBREW DATE & HEBCAL API
// ============================================================

const hebcalCache = {};

async function getHebcalData(date) {
  const key = date.toISOString().split('T')[0];
  if (hebcalCache[key]) return hebcalCache[key];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&M=on&s=on&D=on&d=on&o=on&&lg=he`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[key] = data;
    return data;
  } catch (e) {
    console.error('Hebcal fetch error:', e);
    return null;
  }
}

async function getHebcalDataBilingual(date) {
  const key = 'bi_' + date.toISOString().split('T')[0];
  if (hebcalCache[key]) return hebcalCache[key];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&ss=on&s=on&D=on&d=on&o=on&`;
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
  const key = 'hd_' + date.toISOString().split('T')[0];
  if (hebcalCache[key]) return hebcalCache[key];
  try {
    const url = `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth() + 1}&gd=${date.getDate()}&g2h=1`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[key] = data;
    return data;
  } catch (e) {
    console.error('Hebrew date fetch error:', e);
    return null;
  }
}

async function getHebcalMonthData(year, month) {
  const cacheKey = `month_${year}_${month}`;
  if (hebcalCache[cacheKey]) return hebcalCache[cacheKey];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month + 1}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&ss=on&s=on&D=on&d=on&o=on&&lg=he&c=on`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[cacheKey] = data;
    return data;
  } catch (e) {
    console.error('Hebcal month fetch error:', e);
    return null;
  }
}

async function getHebcalMonthDataBilingual(year, month) {
  const cacheKey = `month_bi_${year}_${month}`;
  if (hebcalCache[cacheKey]) return hebcalCache[cacheKey];
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month + 1}&geo=pos&latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&tzid=${CONFIG.tzid}&ss=on&s=on&D=on&d=on&o=on&&c=on`;
    const resp = await fetch(url);
    const data = await resp.json();
    hebcalCache[cacheKey] = data;
    return data;
  } catch (e) {
    return null;
  }
}

// ============================================================
// DAY NAME HELPERS
// ============================================================

const dayNamesHeb = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'שבת'];

function getDayLabel(date) {
  return dayNamesHeb[date.getDay()];
}

// ============================================================
// ZMANIM TAB RENDERING
// ============================================================

async function renderZmanim() {
  const date = currentDate;
  const zmanim = getZmanim(date);
  const hd = await getHebrewDate(date);
  const hebcal = await getHebcalData(date);
  const hebcalBi = await getHebcalDataBilingual(date);

  const heroEl = document.getElementById('date-hero');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let engDate = date.toLocaleDateString('en-US', options);
  engDate = engDate.replace('Saturday', 'שבת');
  let hebDate = hd ? hd.hebrew : '';
  let badges = '';

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
      <div class="next-label">הדלקת נרות</div>
      <div class="next-value">${fmtTime(nextZmanim.candleLighting)}</div>
      <div class="next-label" style="margin-top:8px">שקיעה</div>
      <div class="next-value">${fmtTime(nextZmanim.shkiah)}</div>
    </div>
  `;

  // Morning zmanim
  const morningEl = document.getElementById('morning-times');
  morningEl.innerHTML = zmanRow('Alos Hashachar', 'עלות השחר', '16.1° below horizon', zmanim.alos) +
    zmanRow('Misheyakir', 'משיכיר', '11° below horizon', zmanim.misheyakir) +
    zmanRow('Netz (Sunrise)', 'הנץ החמה', 'Sea level', zmanim.sunrise, 'highlight') +
    zmanRow('Sof Zman Shema (MGA)', 'סוף זמן ק״ש מג״א', '72-minute MGA', zmanim.shemaMGA) +
    zmanRow('Sof Zman Shema (GRA)', 'סוף זמן ק״ש גר״א', 'Sea level', zmanim.shemaGra) +
    zmanRow('Sof Zman Tefilla (MGA)', 'סוף זמן תפילה מג״א', '72-minute MGA', zmanim.tefillaMGA) +
    zmanRow('Sof Zman Tefilla (GRA)', 'סוף זמן תפילה גר״א', 'Sea level', zmanim.tefillaGra) +
    zmanRow('Chatzos', 'חצות', 'Astronomical noon', zmanim.chatzos);

  // Evening zmanim
  const eveningEl = document.getElementById('evening-times');
  eveningEl.innerHTML = zmanRow('Mincha Gedola', 'מנחה גדולה', 'Chatzos + 30 min', zmanim.minchaGedola) +
    zmanRow('Plag HaMincha', 'פלג המנחה', '10.75 shaos GRA', zmanim.plag) +
    zmanRow('Candle Lighting', 'הדלקת נרות', '18 min before sunset', zmanim.candleLighting) +
    zmanRow('Shkiah (Sunset)', 'שקיעה', 'Sea level', zmanim.shkiah, 'sunset') +
    zmanRow('Tzeis Hakochavim', 'צאת הכוכבים', '8.5° below horizon', zmanim.tzeis) +
    zmanRow('Tzeis (72 min)', 'ר״ת', '72 min after sunset', zmanim.tzeis72);

  // ===== DAVENING SCHEDULE — separate rows, two columns =====
  const daveningEl = document.getElementById('davening-section');
  const dateStr = date.toISOString().split('T')[0];
  const biEvents = hebcalBi && hebcalBi.items ? hebcalBi.items.filter(i => i.date === dateStr || (i.date && i.date.startsWith(dateStr))) : [];

  const hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה'];

  let daveningHTML = '<h3>לוח תפילות</h3>';
  daveningHTML += '<div class="daven-columns">';

  // ===== LEFT COLUMN: WEEKDAY / CHOL HAMOED =====
  daveningHTML += '<div class="daven-col">';

  const isCHM = checkIsCholHamoed(biEvents);
  daveningHTML += `<h4>${isCHM ? 'חול המועד' : 'חול'}</h4>`;

  const todaySched = getDaveningSchedule(date, zmanim, biEvents);

 // If today is Shabbos/YT, find the next non-YT, non-Shabbos day for the weekday column
  let weekdaySched = todaySched;
  if (todaySched.type === 'shabbos' || todaySched.type === 'yomtov') {
    let sampleDay = new Date(date);
    let found = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      sampleDay.setDate(sampleDay.getDate() + 1);
      if (sampleDay.getDay() === 6) continue; // skip Shabbos
      const sampleDateStr = sampleDay.toISOString().split('T')[0];
      const sampleBi = await getHebcalDataBilingual(sampleDay);
      const sampleEvents = sampleBi && sampleBi.items ? sampleBi.items.filter(i => i.date === sampleDateStr || (i.date && i.date.startsWith(sampleDateStr))) : [];
      if (checkIsYomTov(sampleEvents)) continue; // skip YT days
      const sampleZmanim = getZmanim(sampleDay);
      weekdaySched = getDaveningSchedule(sampleDay, sampleZmanim, sampleEvents);
      found = true;
      break;
    }
    if (!found) {
      // Fallback: use a day 10 days out
      const fallback = new Date(date);
      fallback.setDate(fallback.getDate() + 10);
      const fbZmanim = getZmanim(fallback);
      weekdaySched = getDaveningSchedule(fallback, fbZmanim, []);
    }
  }

  // Shacharis rows
  if (weekdaySched.shacharis.length > 0) {
    weekdaySched.shacharis.forEach((t, i) => {
      const label = weekdaySched.shacharis.length > 1 ? `שחרית ${hebrewLetters[i]}` : 'שחרית';
      daveningHTML += `<div class="daven-row"><span class="daven-he">${label}</span><span class="daven-time">${t}</span></div>`;
    });
  }

  // Mincha rows
  if (weekdaySched.mincha.length > 0) {
    weekdaySched.mincha.forEach((t, i) => {
      const label = weekdaySched.mincha.length > 1 ? `מנחה ${hebrewLetters[i]}` : 'מנחה';
      daveningHTML += `<div class="daven-row"><span class="daven-he">${label}</span><span class="daven-time">${t}</span></div>`;
    });
  }

  // Maariv rows
  if (weekdaySched.maariv.length > 0) {
    weekdaySched.maariv.forEach((t, i) => {
      const label = weekdaySched.maariv.length > 1 ? `מעריב ${hebrewLetters[i]}` : 'מעריב';
      daveningHTML += `<div class="daven-row"><span class="daven-he">${label}</span><span class="daven-time">${t}</span></div>`;
    });
  }

  daveningHTML += '</div>';

  // ===== RIGHT COLUMN: SHABBOS / YOM TOV =====
  daveningHTML += '<div class="daven-col">';

  const isYTSeason = biEvents.some(e => checkIsYomTov([e]) || checkIsCholHamoed([e]) || checkIsErevYomTov([e]));

  const nextShab = new Date(date);
  while (nextShab.getDay() !== 6) nextShab.setDate(nextShab.getDate() + 1);
  const shabZmanim = getZmanim(nextShab);
  const shabDateStr = nextShab.toISOString().split('T')[0];
  const shabBi = await getHebcalDataBilingual(nextShab);
  const shabEvents = shabBi && shabBi.items ? shabBi.items.filter(i => i.date === shabDateStr || (i.date && i.date.startsWith(shabDateStr))) : [];
  const shabSched = getShabbosSchedule(nextShab, shabZmanim, shabEvents);

  const shabHebcal = await getHebcalData(nextShab);
  let shabTitle = 'שבת';
  if (shabHebcal && shabHebcal.items) {
    const parashat = shabHebcal.items.find(i => i.category === 'parashat');
    const holiday = shabHebcal.items.find(i => i.category === 'holiday');
    if (isYTSeason && holiday) {
      shabTitle = holiday.title;
    } else if (parashat) {
      shabTitle = parashat.title;
    }
  }

  daveningHTML += `<h4>${shabTitle}</h4>`;

  // Erev Shabbos mincha
  if (shabSched.erevMincha && shabSched.erevMincha.length > 0) {
    shabSched.erevMincha.forEach((t, i) => {
      const label = shabSched.erevMincha.length > 1 ? `מנחה ע״ש ${hebrewLetters[i]}` : 'מנחה ע״ש';
      daveningHTML += `<div class="daven-row"><span class="daven-he">${label}</span><span class="daven-time">${t}</span></div>`;
    });
  }

  shabSched.shacharis.forEach((t) => {
    daveningHTML += `<div class="daven-row"><span class="daven-he">שחרית</span><span class="daven-time">${t}</span></div>`;
  });

  shabSched.mincha.forEach((t, i) => {
    const label = shabSched.mincha.length > 1 ? `מנחה ${hebrewLetters[i]}` : 'מנחה';
    daveningHTML += `<div class="daven-row"><span class="daven-he">${label}</span><span class="daven-time">${t}</span></div>`;
  });

  shabSched.maariv.forEach((t) => {
    daveningHTML += `<div class="daven-row"><span class="daven-he">מעריב / הבדלה</span><span class="daven-time">${t}</span></div>`;
  });

  daveningHTML += '</div>';
  daveningHTML += '</div>';

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

// ============================================================
// CALENDAR TAB — combined lines per category, dot leaders
// ============================================================

async function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const monthDataHe = await getHebcalMonthData(year, month);
  const monthDataBi = await getHebcalMonthDataBilingual(year, month);

  const titleEl = document.getElementById('calendar-month-title');
  titleEl.textContent = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const badgeEl = document.getElementById('calendar-badge');
  if (monthDataHe && monthDataHe.items) {
    const hdItems = monthDataHe.items.filter(i => i.category === 'hebdate');
    if (hdItems.length > 0) {
      badgeEl.textContent = hdItems[0].hebrew || '';
    }
  }

  const eventsMapHe = {};
  const eventsMapBi = {};
  if (monthDataHe && monthDataHe.items) {
    monthDataHe.items.forEach(item => {
      const d = item.date ? item.date.split('T')[0] : null;
      if (!d) return;
      if (!eventsMapHe[d]) eventsMapHe[d] = { holidays: [], parsha: null, hebDate: null };
      if (item.category === 'parashat') eventsMapHe[d].parsha = item.title;
      else if (item.category === 'hebdate') eventsMapHe[d].hebDate = item.hebrew;
      else if (item.category === 'holiday' || item.category === 'roshchodesh') eventsMapHe[d].holidays.push(item.title);
    });
  }
  if (monthDataBi && monthDataBi.items) {
    monthDataBi.items.forEach(item => {
      const d = item.date ? item.date.split('T')[0] : null;
      if (!d) return;
      if (!eventsMapBi[d]) eventsMapBi[d] = [];
      eventsMapBi[d].push(item);
    });
  }

  if (window.innerWidth < 768) {
    renderCalendarAgenda(year, month, eventsMapHe, eventsMapBi);
  } else {
    renderCalendarGrid(year, month, eventsMapHe, eventsMapBi);
  }
}

function calTimeLine(label, times) {
  return `<div class="cal-time-row"><span class="cal-time-value">${times}</span><span class="cal-time-label">${label}</span></div>`;
}

function renderCalendarGrid(year, month, eventsMapHe, eventsMapBi) {
  const daysHeaderEl = document.getElementById('days-header');
  const gridEl = document.getElementById('calendar-grid');
  const agendaEl = document.getElementById('calendar-agenda');
  agendaEl.style.display = 'none';
  gridEl.style.display = 'grid';
  daysHeaderEl.style.display = 'grid';

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'שבת'];
  daysHeaderEl.innerHTML = dayLabels.map((d, i) =>
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

    const evHe = eventsMapHe[dateStr] || {};
    const evBi = eventsMapBi[dateStr] || [];

    const dayLabel = getDayLabel(dateObj);
    const dateShort = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let headerParts = [dayLabel, dateShort];
    if (evHe.hebDate) headerParts.push(evHe.hebDate);
    if (evHe.holidays && evHe.holidays.length) headerParts.push(evHe.holidays[0]);
    else if (evHe.parsha) headerParts.push(evHe.parsha);
    const headerLine = headerParts.join(' · ');

    const z = getZmanim(dateObj);
    const sched = getDaveningSchedule(dateObj, z, evBi);

    let timesHTML = '';
    // Calendar view: combined on one line with slashes
    if (sched.shacharis.length) timesHTML += calTimeLine('שחרית', sched.shacharis.join(' / '));
    timesHTML += calTimeLine('סוף זמן שמע', fmtTimeShort(z.shemaMGA) + ' / ' + fmtTimeShort(z.shemaGra));
    timesHTML += calTimeLine('סוף זמן תפילה', fmtTimeShort(z.tefillaMGA) + ' / ' + fmtTimeShort(z.tefillaGra));
    if (sched.mincha.length) timesHTML += calTimeLine('מנחה', sched.mincha.join(' / '));
    if (sched.maariv.length) timesHTML += calTimeLine('מעריב', sched.maariv.join(' / '));
    timesHTML += calTimeLine('שקיעה', fmtTimeShort(z.shkiah));

    cells += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSat ? 'shabbos' : ''}">
      <div class="cal-header">${headerLine}</div>
      <div class="cal-divider"></div>
      <div class="cal-times">${timesHTML}</div>
    </div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    cells += '<div class="cal-cell empty"></div>';
  }

  gridEl.innerHTML = cells;
}

function renderCalendarAgenda(year, month, eventsMapHe, eventsMapBi) {
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

    const evHe = eventsMapHe[dateStr] || {};
    const evBi = eventsMapBi[dateStr] || [];

    const dayLabel = getDayLabel(dateObj);
    const dateShort = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let headerParts = [dayLabel, dateShort];
    if (evHe.hebDate) headerParts.push(evHe.hebDate);
    if (evHe.holidays && evHe.holidays.length) headerParts.push(evHe.holidays[0]);
    else if (evHe.parsha) headerParts.push(evHe.parsha);

    const z = getZmanim(dateObj);
    const sched = getDaveningSchedule(dateObj, z, evBi);

    let timesHTML = '';
    if (sched.shacharis.length) timesHTML += calTimeLine('שחרית', sched.shacharis.join(' / '));
    timesHTML += calTimeLine('סוף זמן שמע', fmtTimeShort(z.shemaMGA) + ' / ' + fmtTimeShort(z.shemaGra));
    timesHTML += calTimeLine('סוף זמן תפילה', fmtTimeShort(z.tefillaMGA) + ' / ' + fmtTimeShort(z.tefillaGra));
    if (sched.mincha.length) timesHTML += calTimeLine('מנחה', sched.mincha.join(' / '));
    if (sched.maariv.length) timesHTML += calTimeLine('מעריב', sched.maariv.join(' / '));
    timesHTML += calTimeLine('שקיעה', fmtTimeShort(z.shkiah));

    html += `<div class="agenda-card ${isToday ? 'today' : ''} ${isSat ? 'shabbos' : ''}">
      <div class="cal-header">${headerParts.join(' · ')}</div>
      <div class="cal-divider"></div>
      <div class="cal-times">${timesHTML}</div>
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
  infoEl.textContent = `Generating for שבת: ${shabbosStr}`;
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
  const shabbosHd = await getHebrewDate(shabbos);
  const hebcalData = await getHebcalData(shabbos);

  let parsha = 'פרשת השבוע';
  if (hebcalData && hebcalData.items) {
    const parashat = hebcalData.items.find(i => i.category === 'parashat');
    if (parashat) parsha = parashat.hebrew || parashat.title;
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

  let minchaBMin = shabbosZmanim._sunsetMin - 40;
  if (minchaBMin > 18 * 60 + 15) minchaBMin = 18 * 60 + 15;
  const minchaBTime = minchaBOverride || minutesToTimeStr(Math.floor(minchaBMin));

  const maarivTime = maarivOverride || minutesToTimeStr(Math.floor(shabbosZmanim._sunsetMin + 55));
  const torahStoriesTime = torahStoriesOverride || '9:45 AM';
  const isAvos = isPirkeiAvosSeason(shabbos);
  const avosChapter = avosOverride || (isAvos ? 'פרק א' : '');
  const engDateStr = shabbos.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const hebDateStr = shabbosHd ? shabbosHd.hebrew : '';

  nlPage.innerHTML = `
    <div class="nl-header">
      <div class="nl-logo"><img src="emblem.png" alt="KZY Emblem"></div>
      <div class="nl-parsha"><h1>${parsha}</h1><div class="nl-shul-sub">${CONFIG.shulName} · ${CONFIG.shulNameHe}</div></div>
      <div class="nl-dates"><div class="nl-heb-date">${hebDateStr}</div><div class="nl-eng-date">${engDateStr}</div>${isAvos ? `<div class="nl-avos-ref">${avosChapter}</div>` : ''}</div>
    </div>
    <div class="nl-body">
      <div class="nl-left">
        ${simcha ? `<div class="nl-announce-box highlight"><strong>מזל טוב!</strong>${simcha}</div>` : ''}
        ${announcements ? `<div class="nl-announce-box"><strong>Announcements</strong>${announcements}</div>` : ''}
        ${shiurTopic ? `<div class="nl-section-title">שיעור</div><div class="nl-section-body">${shiurTopic}</div><hr class="nl-divider">` : ''}
        ${specialShiur ? `<div class="nl-section-title">Special Shiur / Event</div><div class="nl-section-body">${specialShiur}</div><hr class="nl-divider">` : ''}
        ${sponsors ? `<div class="nl-section-title">Sponsors & Dedications</div><div class="nl-section-body">${sponsors}</div>` : ''}
      </div>
      <div class="nl-right">
        <table class="nl-schedule-table">
          <tr><th colspan="2">לוח זמנים לשבת קודש</th></tr>
          <tr class="bold"><td>הדלקת נרות</td><td>${candleLighting}</td></tr>
          <tr><td>מנחה ערב שבת</td><td>${minchaErev}</td></tr>
          <tr class="section-break"><td>קבלת שבת</td><td>After Mincha</td></tr>
          <tr><td>Torah & Stories</td><td>${torahStoriesTime}</td></tr>
          <tr class="bold"><td>שחרית</td><td>8:45 AM</td></tr>
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
      ${CONFIG.address}<br>${CONFIG.ravName} · לעילוי נשמת ר׳ יעקב דב שטרנבוך ז״ל
    </div>
  `;
}

function printNewsletter() { window.print(); }

function saveNewsletterDraft() {
  const fields = ['nl-mincha-override', 'nl-avos-override', 'nl-minchab-override', 'nl-torahstories-override', 'nl-shiur-topic', 'nl-avosubanim-override', 'nl-maariv-override', 'nl-special-shiur', 'nl-simcha', 'nl-announcements', 'nl-sponsors', 'nl-seudos'];
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
  } catch (e) { console.error('Error loading draft:', e); }
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderCalendar(), 250);
});
