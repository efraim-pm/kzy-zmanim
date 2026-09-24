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
	const e = currentDate,
		t = getZmanim(e),
		n = await getHebrewDate(e),
		a = await getHebcalData(e),
		i = await getHebcalDataBilingual(e),
		s = document.getElementById("date-hero");
	let o = e.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric"
	});
	o = o.replace("Saturday", "שבת");
	let l = n ? n.hebrew : "",
		r = "";
	if (a && a.items) {
		const t = e.toISOString().split("T")[0];
		a.items.filter(e => e.date === t || e.date && e.date.startsWith(t)).forEach(e => {
			"holiday" === e.category || "roshchodesh" === e.category ? r += `<span class="badge">${e.title}</span>` : "parashat" === e.category && (r += `<span class="badge blue">${e.title}</span>`)
		})
	}
	let c = new Date(e);
	for (; 6 !== c.getDay();) c.setDate(c.getDate() + 1);
	const h = getZmanim(c);
	s.innerHTML = `<div class="date-main"><div class="date-english">${o}</div><div class="date-hebrew">${l}</div><div class="date-badges">${r}</div></div><div class="next-info"><div class="next-label">הדלקת נרות</div><div class="next-value">${fmtTime(h.candleLighting)}</div><div class="next-label" style="margin-top:8px">שקיעה</div><div class="next-value">${fmtTime(h.shkiah)}</div></div>`;
	document.getElementById("morning-times").innerHTML = zmanRow("Alos Hashachar", "עלות השחר", "16.1° below horizon", t.alos) + zmanRow("Misheyakir", "משיכיר", "11° below horizon", t.misheyakir) + zmanRow("Netz (Sunrise)", "הנץ החמה", "Sea level", t.sunrise, "highlight") + zmanRow("Sof Zman Shema (MGA)", "סוף זמן ק״ש מג״א", "72-minute MGA", t.shemaMGA) + zmanRow("Sof Zman Shema (GRA)", "סוף זמן ק״ש גר״א", "Sea level", t.shemaGra) + zmanRow("Sof Zman Tefilla (MGA)", "סוף זמן תפילה מג״א", "16.1° MGA", t.tefillaMGA) + zmanRow("Sof Zman Tefilla (GRA)", "סוף זמן תפילה גר״א", "Sea level", t.tefillaGra) + zmanRow("Chatzos", "חצות", "Astronomical noon", t.chatzos);
	document.getElementById("evening-times").innerHTML = zmanRow("Mincha Gedola", "מנחה גדולה", "Chatzos + 30 min", t.minchaGedola) + zmanRow("Plag HaMincha", "פלג המנחה", "10.75 shaos GRA", t.plag) + zmanRow("Candle Lighting", "הדלקת נרות", "18 min before sunset", t.candleLighting) + zmanRow("Shkiah (Sunset)", "שקיעה", "Sea level", t.shkiah, "sunset") + zmanRow("Tzeis Hakochavim", "צאת הכוכבים", "8.5° below horizon", t.tzeis) + zmanRow("Tzeis (72 min)", "ר״ת", "72 min after sunset", t.tzeis72);
	const d = document.getElementById("davening-section"),
		u = e.toISOString().split("T")[0],
		m = i && i.items ? i.items.filter(e => e.date === u || e.date && e.date.startsWith(u)) : [],
		g = ["א", "ב", "ג", "ד", "ה"];
	let v = "<h3>לוח תפילות</h3>";
	v += '<div class="daven-columns">', v += '<div class="daven-col">';
	const f = checkIsCholHamoed(m);
	v += `<h4>${f?"חול המועד":"חול"}</h4>`;
	const y = getDaveningSchedule(e, t, m);
	let M = y;
	if ("yomtov" === y.type) M = {
		shacharis: [],
		mincha: [],
		maariv: [],
		type: "yomtov"
	};
	else if ("shabbos" === y.type) {
		let t = new Date(e),
			n = !1;
		for (let e = 1; e <= 10; e++) {
			if (t.setDate(t.getDate() + 1), 6 === t.getDay()) continue;
			const e = t.toISOString().split("T")[0],
				a = await getHebcalDataBilingual(t),
				i = a && a.items ? a.items.filter(t => t.date === e || t.date && t.date.startsWith(e)) : [];
			if (checkIsYomTov(i) || checkIsCholHamoed(i)) continue;
			const s = getZmanim(t);
			M = getDaveningSchedule(t, s, i), n = !0;
			break
		}
		if (!n) M = {
			shacharis: [],
			mincha: [],
			maariv: [],
			type: "weekday"
		}
	}
	M.shacharis.length > 0 && M.shacharis.forEach((e, t) => {
		const n = M.shacharis.length > 1 ? `שחרית ${g[t]}` : "שחרית";
		v += `<div class="daven-row"><span class="daven-he">${n}</span><span class="daven-time">${e}</span></div>`
	}), M.mincha.length > 0 && M.mincha.forEach((e, t) => {
		const n = M.mincha.length > 1 ? `מנחה ${g[t]}` : "מנחה";
		v += `<div class="daven-row"><span class="daven-he">${n}</span><span class="daven-time">${e}</span></div>`
	}), M.maariv.length > 0 && M.maariv.forEach((e, t) => {
		const n = M.maariv.length > 1 ? `מעריב ${g[t]}` : "מעריב";
		v += `<div class="daven-row"><span class="daven-he">${n}</span><span class="daven-time">${e}</span></div>`
	}), v += "</div>", v += '<div class="daven-col">';
	const T = await getNextShabbosOrYomTov(e),
		p = T ? T.date : new Date(e),
		D = T ? T.events : [],
		S = getZmanim(p),
		b = T && T.isYomTov ? getYomTovSchedule(p, S, D) : getShabbosSchedule(p, S, D),
		w = eventsForDate(await getHebcalData(p), p),
		I = w.find(e => "holiday" === e.category),
		$ = w.find(e => "parashat" === e.category),
		C = T && T.isYomTov && I ? I.title : $ ? $.title : "שבת";
	v += `<h4>${C}</h4>`, b.erevMincha && b.erevMincha.length > 0 && b.erevMincha.forEach((e, t) => {
		const n = b.erevMincha.length > 1 ? `מנחה ע״ש ${g[t]}` : "מנחה ע״ש";
		v += `<div class="daven-row"><span class="daven-he">${n}</span><span class="daven-time">${e}</span></div>`
	}), b.shacharis.forEach(e => {
		v += `<div class="daven-row"><span class="daven-he">שחרית</span><span class="daven-time">${e}</span></div>`
	}), b.mincha.forEach((e, t) => {
		const n = b.mincha.length > 1 ? `מנחה ${g[t]}` : "מנחה";
		v += `<div class="daven-row"><span class="daven-he">${n}</span><span class="daven-time">${e}</span></div>`
	}), b.maariv.forEach(e => {
		v += `<div class="daven-row"><span class="daven-he">מעריב / הבדלה</span><span class="daven-time">${e}</span></div>`
	}), v += "</div>", v += "</div>", d.innerHTML = v
}

function zmanRow(e, t, n, a, i) {
	return `<div class="zman-row ${i||""}"><div class="zman-left"><div><span class="zman-name-en">${e}</span> <span class="zman-name-he">${t}</span></div><div class="zman-desc">${n}</div></div><div class="zman-time">${fmtTime(a)}</div></div>`
}
async function renderCalendar() {
	const e = calendarMonth.getFullYear(),
		t = calendarMonth.getMonth(),
		n = await getHebcalMonthData(e, t),
		a = await getHebcalMonthDataBilingual(e, t);
	document.getElementById("calendar-month-title").textContent = calendarMonth.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric"
	});
	const i = document.getElementById("calendar-badge");
	if (n && n.items) {
		const e = n.items.filter(e => "hebdate" === e.category);
		e.length > 0 && (i.textContent = e[0].hebrew || "")
	}
	const s = {},
		o = {};
	n && n.items && n.items.forEach(e => {
		const t = e.date ? e.date.split("T")[0] : null;
		t && (s[t] || (s[t] = {
			holidays: [],
			parsha: null,
			hebDate: null
		}), "parashat" === e.category ? s[t].parsha = e.hebrew || e.title : "hebdate" === e.category ? s[t].hebDate = e.hebrew : "holiday" !== e.category || !0 !== e.yomtov && !checkIsCholHamoed([e]) || s[t].holidays.push(e.hebrew || e.title))
	}), a && a.items && a.items.forEach(e => {
		const t = e.date ? e.date.split("T")[0] : null;
		t && (o[t] || (o[t] = []), o[t].push(e))
	}), window.innerWidth < 768 ? renderCalendarAgenda(e, t, s, o) : renderCalendarGrid(e, t, s, o)
}

function calTimeLine(e, t) {
	return `<div class="cal-time-row"><span class="cal-time-value">${t}</span><span class="cal-time-label">${e}</span></div>`
}

function renderCalendarGrid(e, t, n, a) {
	const i = document.getElementById("days-header"),
		s = document.getElementById("calendar-grid");
	document.getElementById("calendar-agenda").style.display = "none", s.style.display = "grid", i.style.display = "grid";
	i.innerHTML = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "שבת"].map((e, t) => `<div class="day-label ${6===t?"shabbos":""}">${e}</div>`).join("");
	const o = new Date(e, t, 1).getDay(),
		l = new Date(e, t + 1, 0).getDate(),
		r = (new Date).toISOString().split("T")[0];
	let c = "";
	for (let e = 0; e < o; e++) c += '<div class="cal-cell empty"></div>';
	for (let i = 1; i <= l; i++) {
		const s = new Date(e, t, i),
			o = s.toISOString().split("T")[0],
			l = o === r,
			h = 6 === s.getDay(),
			d = n[o] || {},
			u = a[o] || [],
			m = [s.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric"
			})];
		d.hebDate && m.push(d.hebDate), d.holidays && d.holidays.length ? m.push(d.holidays[0]) : h && d.parsha && m.push(d.parsha);
		const g = m.join(" · "),
			v = getZmanim(s),
			f = getDaveningSchedule(s, v, u);
		let y = "";
		f.shacharis.length && (y += calTimeLine("שחרית", f.shacharis.join(" / "))), y += calTimeLine("סוף זמן שמע", fmtTimeShort(v.shemaMGA) + " / " + fmtTimeShort(v.shemaGra)), y += calTimeLine("סוף זמן תפילה", fmtTimeShort(v.tefillaMGA) + " / " + fmtTimeShort(v.tefillaGra)), f.mincha.length && (y += calTimeLine("מנחה", f.mincha.join(" / "))), f.maariv.length && (y += calTimeLine("מעריב", f.maariv.join(" / "))), y += calTimeLine("שקיעה", fmtTimeShort(v.shkiah)), c += `<div class="cal-cell ${l?"today":""} ${h?"shabbos":""}"><div class="cal-header">${g}</div><div class="cal-divider"></div><div class="cal-times">${y}</div></div>`
	}
	const h = o + l,
		d = h % 7 == 0 ? 0 : 7 - h % 7;
	for (let e = 0; e < d; e++) c += '<div class="cal-cell empty"></div>';
	s.innerHTML = c
}

function renderCalendarAgenda(e, t, n, a) {
	const i = document.getElementById("calendar-agenda"),
		s = document.getElementById("calendar-grid"),
		o = document.getElementById("days-header");
	s.style.display = "none", o.style.display = "none", i.style.display = "block";
	const l = new Date(e, t + 1, 0).getDate(),
		r = (new Date).toISOString().split("T")[0];
	let c = "";
	for (let i = 1; i <= l; i++) {
		const s = new Date(e, t, i),
			o = s.toISOString().split("T")[0],
			l = o === r,
			h = 6 === s.getDay(),
			d = n[o] || {},
			u = a[o] || [],
			m = [s.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric"
			})];
		d.hebDate && m.push(d.hebDate), d.holidays && d.holidays.length ? m.push(d.holidays[0]) : h && d.parsha && m.push(d.parsha);
		const g = getZmanim(s),
			v = getDaveningSchedule(s, g, u);
		let f = "";
		v.shacharis.length && (f += calTimeLine("שחרית", v.shacharis.join(" / "))), f += calTimeLine("סוף זמן שמע", fmtTimeShort(g.shemaMGA) + " / " + fmtTimeShort(g.shemaGra)), f += calTimeLine("סוף זמן תפילה", fmtTimeShort(g.tefillaMGA) + " / " + fmtTimeShort(g.tefillaGra)), v.mincha.length && (f += calTimeLine("מנחה", v.mincha.join(" / "))), v.maariv.length && (f += calTimeLine("מעריב", v.maariv.join(" / "))), f += calTimeLine("שקיעה", fmtTimeShort(g.shkiah)), c += `<div class="agenda-card ${l?"today":""} ${h?"shabbos":""}"><div class="cal-header">${m.join(" · ")}</div><div class="cal-divider"></div><div class="cal-times">${f}</div></div>`
	}
	i.innerHTML = c
}

function renderNewsletterInfo() {
	const e = document.getElementById("nl-date-info");
	let t = new Date;
	for (; 6 !== t.getDay();) t.setDate(t.getDate() + 1);
	const n = t.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	});
	e.textContent = `Generating for שבת: ${n}`
}

function isPirkeiAvosSeason(e) {
	const t = e.getMonth();
	return t >= 3 && t <= 8
}
async function renderNewsletter() {
	const e = document.getElementById("nl-page");
	e.innerHTML = '<div class="nl-placeholder">Generating newsletter...</div>';
	let t = new Date;
	for (; 5 !== t.getDay();) t.setDate(t.getDate() + 1);
	let n = new Date(t);
	n.setDate(n.getDate() + 1);
	const a = getZmanim(t),
		i = getZmanim(n),
		s = await getHebrewDate(n),
		o = await getHebcalData(n);
	let l = "פרשת השבוע";
	if (o && o.items) {
		const e = eventsForDate(o, n).find(e => "parashat" === e.category);
		e && (l = e.hebrew || e.title)
	}
	const r = document.getElementById("nl-mincha-override").value,
		c = document.getElementById("nl-avos-override").value,
		h = document.getElementById("nl-minchab-override").value,
		d = document.getElementById("nl-torahstories-override").value,
		u = document.getElementById("nl-shiur-topic").value,
		m = (document.getElementById("nl-avosubanim-override").value, document.getElementById("nl-maariv-override").value),
		g = document.getElementById("nl-special-shiur").value,
		v = document.getElementById("nl-simcha").value,
		f = document.getElementById("nl-announcements").value,
		y = document.getElementById("nl-sponsors").value,
		M = (document.getElementById("nl-seudos").value, fmtTime(a.candleLighting)),
		T = r || fmtTime(new Date(a.shkiah.getTime() - 108e4)),
		p = fmtTime(i.shkiah);
	let D = i._sunsetMin - 40;
	D > 1095 && (D = 1095);
	const S = h || minutesToTimeStr(Math.floor(D)),
		b = m || minutesToTimeStr(Math.floor(i._sunsetMin + 55)),
		w = d || "9:45 AM",
		I = isPirkeiAvosSeason(n),
		$ = c || (I ? "פרק א" : ""),
		C = n.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric"
		}),
		N = s ? s.hebrew : "";
	e.innerHTML = `<div class="nl-header"><div class="nl-logo"><img src="emblem.png" alt="KZY Emblem"></div><div class="nl-parsha"><h1>${l}</h1><div class="nl-shul-sub">${CONFIG.shulName} · ${CONFIG.shulNameHe}</div></div><div class="nl-dates"><div class="nl-heb-date">${N}</div><div class="nl-eng-date">${C}</div>${I?`<div class="nl-avos-ref">${$}</div>`:""}</div></div><div class="nl-body"><div class="nl-left">${v?`<div class="nl-announce-box highlight"><strong>מזל טוב!</strong>${v}</div>`:""}${f?`<div class="nl-announce-box"><strong>Announcements</strong>${f}</div>`:""}${u?`<div class="nl-section-title">שיעור</div><div class="nl-section-body">${u}</div><hr class="nl-divider">`:""}${g?`<div class="nl-section-title">Special Shiur / Event</div><div class="nl-section-body">${g}</div><hr class="nl-divider">`:""}${y?`<div class="nl-section-title">Sponsors & Dedications</div><div class="nl-section-body">${y}</div>`:""}</div><div class="nl-right"><table class="nl-schedule-table"><tr><th colspan="2">לוח זמנים לשבת קודש</th></tr><tr class="bold"><td>הדלקת נרות</td><td>${M}</td></tr><tr><td>מנחה ערב שבת</td><td>${T}</td></tr><tr class="section-break"><td>קבלת שבת</td><td>After Mincha</td></tr><tr><td>Torah & Stories</td><td>${w}</td></tr><tr class="bold"><td>שחרית</td><td>8:45 AM</td></tr><tr><td>סוף זמן ק״ש (גר״א)</td><td>${fmtTime(i.shemaGra)}</td></tr><tr><td>סוף זמן ק״ש (מג״א)</td><td>${fmtTime(i.shemaMGA)}</td></tr><tr class="section-break"><td>חצות</td><td>${fmtTime(i.chatzos)}</td></tr><tr><td>מנחה א</td><td>2:15 PM</td></tr><tr class="bold"><td>מנחה ב</td><td>${S}</td></tr><tr><td>שקיעה</td><td>${p}</td></tr><tr class="bold section-break"><td>מעריב / הבדלה</td><td>${b}</td></tr></table><table class="nl-weekday-table"><tr><th colspan="2">Weekday Schedule</th></tr><tr><td>שחרית (Mon-Fri)</td><td>7:00 AM</td></tr><tr><td>שחרית (Sunday)</td><td>8:45 AM</td></tr><tr><td>מעריב (Nightly)</td><td>${m||"8:30 PM"}</td></tr></table></div></div><div class="nl-footer"><strong>${CONFIG.shulName} · ${CONFIG.shulNameHe}</strong><br>${CONFIG.address}<br>${CONFIG.ravName} · לעילוי נשמת ר׳ יעקב דב שטרנבוך ז״ל</div>`
}

function printNewsletter() {
	window.print()
}

function saveNewsletterDraft() {
	const e = {};
	["nl-mincha-override", "nl-avos-override", "nl-minchab-override", "nl-torahstories-override", "nl-shiur-topic", "nl-avosubanim-override", "nl-maariv-override", "nl-special-shiur", "nl-simcha", "nl-announcements", "nl-sponsors", "nl-seudos"].forEach(t => {
		e[t] = document.getElementById(t).value
	}), e._savedAt = (new Date).toISOString(), localStorage.setItem("kzy-newsletter-draft", JSON.stringify(e)), alert("Draft saved!")
}

function loadNewsletterDraft() {
	const e = localStorage.getItem("kzy-newsletter-draft");
	if (e) try {
		const t = JSON.parse(e);
		Object.keys(t).forEach(e => {
			if (e.startsWith("_")) return;
			const n = document.getElementById(e);
			n && (n.value = t[e])
		})
	} catch (e) {
		console.error("Error loading draft:", e)
	}
}
let resizeTimer;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimer), resizeTimer = setTimeout(() => renderCalendar(), 250)
});
