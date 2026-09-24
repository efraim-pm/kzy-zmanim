const CONFIG = {
	lat: 41.0903,
	lon: -74.0484,
	elevation: 141,
	tzid: "America/New_York",
	shulName: "Khal Zichron Yakov",
	shulNameHe: "קהל זכרון יעקב",
	ravName: "Rabbi Dovid Simons",
	address: "4 Red Schoolhouse Rd, Chestnut Ridge, NY 10977",
	beinHazmanim: []
};
let currentDate = new Date,
	calendarMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

function renderAll() {
	renderZmanim(), renderCalendar(), renderNewsletterInfo()
}

function goToday() {
	currentDate = new Date, calendarMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), renderAll()
}

function prevDay() {
	currentDate.setDate(currentDate.getDate() - 1), renderAll()
}

function nextDay() {
	currentDate.setDate(currentDate.getDate() + 1), renderAll()
}

function prevMonth() {
	calendarMonth.setMonth(calendarMonth.getMonth() - 1), renderCalendar()
}

function nextMonth() {
	calendarMonth.setMonth(calendarMonth.getMonth() + 1), renderCalendar()
}

function switchTab(e) {
	document.querySelectorAll(".tab").forEach(e => e.classList.remove("active")), document.querySelectorAll(".tab-content").forEach(e => e.classList.remove("active")), document.querySelector(`.tab[data-tab="${e}"]`).classList.add("active"), document.getElementById(`${e}-tab`).classList.add("active"), "calendar" === e && renderCalendar()
}

function toJulianDay(e) {
	let t = e.getFullYear(),
		n = e.getMonth() + 1;
	const a = e.getDate();
	n <= 2 && (t--, n += 12);
	const i = Math.floor(t / 100),
		s = 2 - i + Math.floor(i / 4);
	return Math.floor(365.25 * (t + 4716)) + Math.floor(30.6001 * (n + 1)) + a + s - 1524.5
}

function toJulianCenturies(e) {
	return (e - 2451545) / 36525
}

function solarNoonUTC(e, t) {
	let n = eqOfTime(toJulianCenturies(e + -t / 360));
	n = eqOfTime(toJulianCenturies(e + (720 + 4 * -t - n) / 1440));
	let a = 720 + 4 * -t - n;
	for (; a < 0;) a += 1440;
	for (; a >= 1440;) a -= 1440;
	return a
}

function eqOfTime(e) {
	const t = obliqCorr(e),
		n = geomMeanLongSun(e),
		a = eccentEarthOrbit(e),
		i = geomMeanAnomalySun(e);
	let s = Math.tan(degToRad(t) / 2);
	s *= s;
	const o = Math.sin(2 * degToRad(n)),
		l = Math.sin(degToRad(i));
	return 4 * radToDeg(s * o - 2 * a * l + 4 * a * s * l * Math.cos(2 * degToRad(n)) - .5 * s * s * Math.sin(4 * degToRad(n)) - 1.25 * a * a * Math.sin(2 * degToRad(i)))
}

function geomMeanLongSun(e) {
	let t = 280.46646 + e * (36000.76983 + 3032e-7 * e);
	for (; t > 360;) t -= 360;
	for (; t < 0;) t += 360;
	return t
}

function geomMeanAnomalySun(e) {
	return 357.52911 + e * (35999.05029 - 1537e-7 * e)
}

function eccentEarthOrbit(e) {
	return .016708634 - e * (42037e-9 + 1.267e-7 * e)
}

function obliqCorr(e) {
	const t = 125.04 - 1934.136 * e;
	return 23 + (26 + (21.448 - e * (46.815 + e * (59e-5 - .001813 * e))) / 60) / 60 + .00256 * Math.cos(degToRad(t))
}

function sunDeclination(e) {
	const t = obliqCorr(e),
		n = sunApparentLong(e);
	return radToDeg(Math.asin(Math.sin(degToRad(t)) * Math.sin(degToRad(n))))
}

function sunApparentLong(e) {
	const t = 125.04 - 1934.136 * e;
	return sunTrueLong(e) - .00569 - .00478 * Math.sin(degToRad(t))
}

function sunTrueLong(e) {
	return geomMeanLongSun(e) + sunEqOfCenter(e)
}

function sunEqOfCenter(e) {
	const t = degToRad(geomMeanAnomalySun(e));
	return Math.sin(t) * (1.9146 - e * (.004817 + 14e-6 * e)) + Math.sin(2 * t) * (.019993 - 101e-6 * e) + 289e-6 * Math.sin(3 * t)
}

function degToRad(e) {
	return e * Math.PI / 180
}

function radToDeg(e) {
	return 180 * e / Math.PI
}

function sunriseUTCForAngle(e, t, n, a, i) {
	const s = toJulianCenturies(e + solarNoonUTC(e, n) / 1440),
		o = hourAngleForAngle(t, sunDeclination(s), a);
	if (isNaN(o)) return NaN;
	const l = toJulianCenturies(e + (720 - 4 * (n + (i ? o : -o)) - eqOfTime(s)) / 1440),
		r = hourAngleForAngle(t, sunDeclination(l), a);
	if (isNaN(r)) return NaN;
	return 720 - 4 * (n + (i ? r : -r)) - eqOfTime(l)
}

function hourAngleForAngle(e, t, n) {
	const a = degToRad(e),
		i = degToRad(t),
		s = (Math.cos(degToRad(90 + n)) - Math.sin(a) * Math.sin(i)) / (Math.cos(a) * Math.cos(i));
	return s > 1 || s < -1 ? NaN : radToDeg(Math.acos(s))
}

function getZmanim(e) {
	const t = toJulianDay(e),
		n = e.getTimezoneOffset();

	function a(e) {
		return isNaN(e) ? null : e - n
	}

	function i(t, n = !1) {
		if (null === t || isNaN(t)) return null;
		const a = new Date(e);
		return a.setHours(0, 0, 0, 0), a.setMinutes(n ? Math.round(t) : Math.floor(t)), a
	}
	const s = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, .833, !0)),
		o = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, .833, !1)),
		l = a(solarNoonUTC(t, CONFIG.lon)),
		r = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, 16.1, !0)),
		c = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, 16.1, !1)),
		h = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, 11, !0)),
		d = a(sunriseUTCForAngle(t, CONFIG.lat, CONFIG.lon, 8.5, !1)),
		u = null !== o && null !== s ? o - s : null,
		m = null !== u ? u / 12 : null,
		g = null !== s ? s - 72 : null,
		v = null !== o ? o + 72 : null,
		f = null !== v && null !== g ? v - g : null,
		y = null !== f ? f / 12 : null,
		M = null !== r && null !== c ? c - r : null,
		T = null !== M ? M / 12 : null,
		p = null !== s && null !== m ? s + 3 * m : null,
		D = null !== g && null !== y ? g + 3 * y : null,
		S = null !== s && null !== m ? s + 4 * m : null,
		b = null !== r && null !== T ? r + 4 * T : null,
		w = l,
		I = null !== w ? w + 30 : null,
		$ = null !== s && null !== m ? s + 9.5 * m : null,
		C = null !== s && null !== m ? s + 10.75 * m : null,
		N = null !== o ? o - 18 : null,
		z = null !== o ? o + 72 : null;
	return {
		alos: i(r),
		misheyakir: i(h),
		sunrise: i(s),
		shemaGra: i(p),
		shemaMGA: i(D),
		tefillaGra: i(S),
		tefillaMGA: i(b),
		chatzos: i(w, !0),
		minchaGedola: i(I),
		minchaKetana: i($),
		plag: i(C),
		shkiah: i(o),
		tzeis: i(d),
		tzeis72: i(z),
		candleLighting: i(N),
		shaahZmanis: m,
		_sunriseMin: s,
		_sunsetMin: o,
		_minchaGedolaMin: I,
		_plagMin: C,
		_tzeisMin: d
	}
}

function fmtTime(e) {
	if (!e) return "--:--";
	let t = e.getHours();
	const n = t >= 12 ? "PM" : "AM";
	return t > 12 && (t -= 12), 0 === t && (t = 12), `${t}:${e.getMinutes().toString().padStart(2, "0")} ${n}`
}

function fmtTimeShort(e) {
	if (!e) return "--:--";
	let t = e.getHours();
	return t > 12 && (t -= 12), 0 === t && (t = 12), `${t}:${e.getMinutes().toString().padStart(2,"0")}`
}

function roundTo5(e) {
	return 5 * Math.round(e / 5)
}

function minutesToTimeStr(e) {
	if (null === e || isNaN(e)) return "--:--";
	let t = Math.floor(e / 60);
	return t > 12 && (t -= 12), 0 === t && (t = 12), `${t}:${Math.floor(e % 60).toString().padStart(2,"0")}`
}

function getWeekSunday(e) {
	const t = new Date(e);
	return t.setDate(t.getDate() - t.getDay()), t.setHours(0, 0, 0, 0), t
}

function isMajorUSHoliday(e) {
	const t = e.getMonth(),
		n = e.getDate(),
		a = e.getDay();
	return 0 === t && 1 === n || (6 === t && 4 === n || (11 === t && 25 === n || (4 === t && 1 === a && n > 24 || (8 === t && 1 === a && n <= 7 || 10 === t && 4 === a && n >= 22 && n <= 28))))
}

function isBeinHazmanim(e) {
	const t = e.toISOString().split("T")[0];
	return CONFIG.beinHazmanim.some(([e, n]) => t >= e && t <= n)
}

function isDST(e) {
	const t = new Date(e.getFullYear(), 0, 1),
		n = new Date(e.getFullYear(), 6, 1),
		a = Math.max(t.getTimezoneOffset(), n.getTimezoneOffset());
	return e.getTimezoneOffset() < a
}

function checkIsYomTov(e) {
	if (!e) return !1;
	const t = ["Rosh Hashana", "Yom Kippur", "Sukkot I", "Sukkot II", "Shmini Atzeret", "Simchat Torah", "Pesach I", "Pesach II", "Pesach VII", "Pesach VIII", "Shavuot I", "Shavuot II"];
	return e.some(e => {
		const n = e.title_orig || e.title || "";
		return !0 === e.yomtov || "holiday" === e.category && t.some(e => n === e || n.startsWith(`${e} `))
	})
}

function checkIsCholHamoed(e) {
	return !!e && e.some(e => {
		const t = e.title_orig || e.title || "";
		return t.includes("CH''M") || t.includes("Chol HaMoed") || t.includes("Chol ha") || e.hebrew && e.hebrew.includes("חוה״מ")
	})
}

function checkIsHoshanaRabbah(e) {
	return !!e && e.some(e => (e.title_orig || e.title || "").includes("Hoshana Rabbah"))
}

function checkIsErevYomTov(e) {
	return !!e && e.some(e => (e.title_orig || e.title || "").startsWith("Erev") && "holiday" === e.category)
}

function checkIsChanukah(e) {
	return !!e && e.some(e => e.title && e.title.includes("Chanukah") && !e.title.includes("VIII"))
}

function checkIsRoshChodesh(e) {
	return !!e && e.some(e => "roshchodesh" === e.category)
}

function checkIsSecondDayYT(e) {
	return !!e && e.some(e => {
		const t = e.title_orig || e.title || "";
		return t.includes(" II") || t.includes("VIII") || t.includes("Simchat Torah") || t.includes("Shmini Atzeret")
	})
}

function isBeforeSukkos(e) {
	if (!e) return false;
	const event = e.find(e => e.hdate);
	if (!event || !event.hdate) return false;

	const match = event.hdate.match(/^(\d+)\s+(.+?)\s+\d+$/);
	if (!match) return false;

	const day = Number(match[1]);
	const month = match[2];

	if (month === "Tishrei") return day < 15;

	return new Set([
		"Adar", "Adar I", "Adar II", "Nisan", "Iyyar",
		"Sivan", "Tamuz", "Av", "Elul"
	]).has(month);
}

function getDaveningSchedule(e, t, n) {
	const dow = e.getDay(),
		isSun = dow === 0,
		isShab = dow === 6,
		isFri = dow === 5;
	const isYT = checkIsYomTov(n),
		isCHM = checkIsCholHamoed(n);
	const isHR = checkIsHoshanaRabbah(n),
		isErevYT = checkIsErevYomTov(n);
	const isChanukah = checkIsChanukah(n),
		isRC = checkIsRoshChodesh(n);

	if (isYT) return getYomTovSchedule(e, t, n);
	if (isShab) return getShabbosSchedule(e, t, n);

	if (isCHM) {
		const schedule = {
			shacharis: [],
			mincha: [],
			maariv: [],
			type: "chol-hamoed"
		};
		if (!isHR) schedule.shacharis.push("6:45", "8:10", "8:45");
		return schedule;
	}

	const schedule = {
		shacharis: [],
		mincha: [],
		maariv: [],
		type: "weekday"
	};
	const early = getEarlyShacharis(e, t, isRC);
	if (early !== null) schedule.shacharis.push(early);

	const sunrise = t._sunriseMin;
	const gap = sunrise !== null ? sunrise - 405 : 0;

	if (!isSun && gap > 33) {
		schedule.shacharis.push("Netz " + fmtTimeShort(t.sunrise));
	}

	schedule.shacharis.push("7:30");

	if (isSun || isMajorUSHoliday(e) || isBeinHazmanim(e)) {
		schedule.shacharis.push("8:45");
	}

	if (isFri) {
		if (isDST(e) && isBeforeSukkos(n)) {
			const plag = t._plagMin;
			if (plag !== null) {
				schedule.mincha.push(minutesToTimeStr(Math.floor(plag - 15)));
			}
		}

		const sunsetMincha = t._sunsetMin !== null ?
			Math.floor(t._sunsetMin - 15) :
			null;

		if (sunsetMincha !== null) {
			schedule.mincha.push(minutesToTimeStr(sunsetMincha));
		}
	} else if (isErevYT) {
		const sunsetMincha = t._sunsetMin !== null ?
			Math.floor(t._sunsetMin - 15) :
			null;

		if (sunsetMincha !== null) {
			schedule.mincha.push(minutesToTimeStr(sunsetMincha));
		}
	} else if (dow >= 0 && dow <= 4) {
		const mg = t._minchaGedolaMin;

		if ((isSun || isMajorUSHoliday(e)) && mg !== null && mg >= 765) {
			schedule.mincha.push("12:45");
		}

		if (mg !== null && mg >= 795) schedule.mincha.push("1:15");
		schedule.mincha.push("1:45");

		const shkiahMincha = getShkiahMincha(e, t);
		if (shkiahMincha !== null) {
			schedule.mincha.push(minutesToTimeStr(shkiahMincha));
		}
	}

	if (!isFri) {
		if (isErevYT) {
			schedule.maariv.push(fmtTimeShort(t.tzeis));
		} else if (dow >= 0 && dow <= 4) {
			schedule.maariv.push(fmtTimeShort(t.shkiah));

			if (isChanukah) schedule.maariv.push("5:15");

			const evening = getEveningMaariv(e, t);
			if (evening !== null) {
				schedule.maariv.push(minutesToTimeStr(evening));
			}

			schedule.maariv.push("9:45");
		}
	}

	return schedule;
}

function getEarlyShacharis(e, t, n) {
	const isSun = e.getDay() === 0;
	const sunrise = t._sunriseMin;

	if (sunrise === null) return "6:45";

	const gap = sunrise - 405;

	if (isSun && gap > 33) return null;
	if (n) return "6:30";
	if (gap <= 22) return "6:45";

	if (gap > 22 && gap <= 33) {
		const latest = sunrise - 22;
		const shifted = 5 * Math.floor(latest / 5);

		return `${Math.floor(shifted/60)}:${(shifted%60)
      .toString()
      .padStart(2,"0")}`;
	}

	return gap > 33 ? null : "6:45";
}

function getShkiahMincha(e, t) {
	if (t._sunsetMin === null) return null;

	const week = getWeekSunday(e),
		sunTue = [],
		wedThu = [];

	for (let i = 0; i <= 2; i++) {
		const d = new Date(week);
		d.setDate(d.getDate() + i);
		sunTue.push(getZmanim(d)._sunsetMin);
	}

	for (let i = 3; i <= 4; i++) {
		const d = new Date(week);
		d.setDate(d.getDate() + i);
		wedThu.push(getZmanim(d)._sunsetMin);
	}

	const all = [...sunTue, ...wedThu].filter(e => e !== null);
	if (!all.length) return null;

	const min = Math.min(...all),
		max = Math.max(...all);
	const candidate = roundTo5(min - 15);
	const gapMax = max - candidate,
		gapMin = min - candidate;

	if (gapMin >= 13 && gapMin <= 18 && gapMax >= 13 && gapMax <= 18) {
		return candidate;
	}

	const relevant = e.getDay() <= 2 ? sunTue : wedThu;
	return roundTo5(Math.min(...relevant.filter(e => e !== null)) - 15);
}

function getEveningMaariv(e, t) {
	const week = getWeekSunday(e);
	let latest = 0;

	for (let i = 0; i <= 4; i++) {
		const d = new Date(week);
		d.setDate(d.getDate() + i);
		const z = getZmanim(d);

		if (z.tzeis) {
			const value = 60 * z.tzeis.getHours() + z.tzeis.getMinutes();
			if (value > latest) latest = value;
		}
	}

	return latest >= 1215 ? 1215 : Math.floor(latest);
}

function getShabbosSchedule(e, t, n) {
	const schedule = {
		shacharis: [],
		mincha: [],
		maariv: [],
		type: "shabbos",
		erevMincha: []
	};

	const friday = new Date(e);
	friday.setDate(friday.getDate() - 1);
	const fridayZmanim = getZmanim(friday);

	if (isDST(friday) && isBeforeSukkos(n)) {
		const plag = fridayZmanim._plagMin;

		if (plag !== null) {
			schedule.erevMincha.push(
				minutesToTimeStr(Math.floor(plag - 15))
			);
		}
	}

	if (fridayZmanim._sunsetMin !== null) {
		schedule.erevMincha.push(
			minutesToTimeStr(
				Math.floor(fridayZmanim._sunsetMin - 15)
			)
		);
	}

	schedule.shacharis.push("8:45");
	schedule.mincha.push("2:15");

	if (t._sunsetMin !== null) {
		let minchaB = t._sunsetMin - 40;
		if (minchaB > 1095) minchaB = 1095;
		schedule.mincha.push(
			minutesToTimeStr(Math.floor(minchaB))
		);
		schedule.maariv.push(
			minutesToTimeStr(Math.floor(t._sunsetMin + 55))
		);
	}

	return schedule;
}

function getYomTovSchedule(e, t, n) {
	const schedule = {
		shacharis: ["8:45"],
		mincha: [],
		maariv: [],
		type: "yomtov",
		erevMincha: []
	};

	if (t._sunsetMin !== null) {
		schedule.mincha.push(
			minutesToTimeStr(Math.floor(t._sunsetMin - 25))
		);
	}

	if (checkIsSecondDayYT(n)) {
		if (t._sunsetMin !== null) {
			schedule.maariv.push(
				minutesToTimeStr(Math.floor(t._sunsetMin + 55))
			);
		}
	} else {
		schedule.maariv.push(fmtTimeShort(t.tzeis));
	}

	return schedule;
}
document.addEventListener("DOMContentLoaded", () => {
	renderAll();
	loadNewsletterDraft();
});

const hebcalCache = {};

async function getHebcalData(date) {
	const key = date.toISOString().split("T")[0];
	if (hebcalCache[key]) return hebcalCache[key];

	try {
		const url =
			`https://www.hebcal.com/hebcal?v=1&cfg=json` +
			`&year=${date.getFullYear()}` +
			`&month=${date.getMonth()+1}` +
			`&day=${date.getDate()}` +
			`&geo=pos` +
			`&latitude=${CONFIG.lat}` +
			`&longitude=${CONFIG.lon}` +
			`&tzid=${CONFIG.tzid}` +
			`&maj=on&min=on&mod=on&nx=on` +
			`&s=on&D=on&d=on&o=on&lg=he`;

		const response = await fetch(url);
		const data = await response.json();
		hebcalCache[key] = data;
		return data;
	} catch (error) {
		console.error("Hebcal fetch error:", error);
		return null;
	}
}

async function getHebcalDataBilingual(date) {
	const key = "bi_" + date.toISOString().split("T")[0];
	if (hebcalCache[key]) return hebcalCache[key];

	try {
		const url =
			`https://www.hebcal.com/hebcal?v=1&cfg=json` +
			`&year=${date.getFullYear()}` +
			`&month=${date.getMonth()+1}` +
			`&day=${date.getDate()}` +
			`&geo=pos` +
			`&latitude=${CONFIG.lat}` +
			`&longitude=${CONFIG.lon}` +
			`&tzid=${CONFIG.tzid}` +
			`&maj=on&min=on&mod=on&nx=on` +
			`&ss=on&s=on&D=on&d=on&o=on`;

		const response = await fetch(url);
		const data = await response.json();
		hebcalCache[key] = data;
		return data;
	} catch (error) {
		console.error("Hebcal fetch error:", error);
		return null;
	}
}

async function getHebrewDate(date) {
	const key = "hd_" + date.toISOString().split("T")[0];
	if (hebcalCache[key]) return hebcalCache[key];

	try {
		const url =
			`https://www.hebcal.com/converter?cfg=json` +
			`&gy=${date.getFullYear()}` +
			`&gm=${date.getMonth()+1}` +
			`&gd=${date.getDate()}&g2h=1`;

		const response = await fetch(url);
		const data = await response.json();
		hebcalCache[key] = data;
		return data;
	} catch (error) {
		console.error("Hebrew date fetch error:", error);
		return null;
	}
}

async function getHebcalMonthData(year, month) {
	const key = `month_${year}_${month}`;
	if (hebcalCache[key]) return hebcalCache[key];

	try {
		const url =
			`https://www.hebcal.com/hebcal?v=1&cfg=json` +
			`&year=${year}&month=${month+1}` +
			`&geo=pos` +
			`&latitude=${CONFIG.lat}` +
			`&longitude=${CONFIG.lon}` +
			`&tzid=${CONFIG.tzid}` +
			`&maj=on&min=on&mod=on&nx=on` +
			`&ss=on&s=on&D=on&d=on&o=on` +
			`&lg=he&c=on`;

		const response = await fetch(url);
		const data = await response.json();
		hebcalCache[key] = data;
		return data;
	} catch (error) {
		console.error("Hebcal month fetch error:", error);
		return null;
	}
}

async function getHebcalMonthDataBilingual(year, month) {
	const key = `month_bi_${year}_${month}`;
	if (hebcalCache[key]) return hebcalCache[key];

	try {
		const url =
			`https://www.hebcal.com/hebcal?v=1&cfg=json` +
			`&year=${year}&month=${month+1}` +
			`&geo=pos` +
			`&latitude=${CONFIG.lat}` +
			`&longitude=${CONFIG.lon}` +
			`&tzid=${CONFIG.tzid}` +
			`&maj=on&min=on&mod=on&nx=on` +
			`&ss=on&s=on&D=on&d=on&o=on&c=on`;

		const response = await fetch(url);
		const data = await response.json();
		hebcalCache[key] = data;
		return data;
	} catch (error) {
		console.error("Hebcal month fetch error:", error);
		return null;
	}
}

function eventsForDate(data, date) {
	if (!data || !Array.isArray(data.items)) return [];

	const dateStr = date.toISOString().split("T")[0];

	return data.items.filter(item =>
		item.date && item.date.startsWith(dateStr)
	);
}

async function getNextShabbosOrYomTov(startDate) {
	for (let offset = 0; offset <= 14; offset++) {
		const candidate = new Date(startDate);
		candidate.setDate(candidate.getDate() + offset);

		const data = await getHebcalDataBilingual(candidate);
		const events = eventsForDate(data, candidate);
		const yomTov = checkIsYomTov(events);

		if (yomTov || candidate.getDay() === 6) {
			return {
				date: candidate,
				events,
				isYomTov: yomTov
			};
		}
	}

	return null;
}

const dayNamesHeb = [
	"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "שבת"
];

function getDayLabel(date) {
	return dayNamesHeb[date.getDay()];
}
async function renderZmanim() {
