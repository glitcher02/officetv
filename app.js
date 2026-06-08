const CONFIG = {
  timeZone: "Europe/London",
  weather: {
    label: "London",
    latitude: 51.5072,
    longitude: -0.1276
  },
  tfl: {
    modes: ["tube", "dlr", "overground", "elizabeth-line"],
    appKey: "58697ea3709249cca86047c14bef7caf"
  },
  refresh: {
    weatherMs: 15 * 60 * 1000,
    tflMs: 2 * 60 * 1000,
    clockMs: 1000
  }
};

const elements = {
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  temperature: document.getElementById("temperature"),
  condition: document.getElementById("condition"),
  feelsLike: document.getElementById("feelsLike"),
  windSpeed: document.getElementById("windSpeed"),
  weatherVisual: document.getElementById("weatherVisual"),
  forecast: document.getElementById("forecast"),
  tube: document.getElementById("tube"),
  tflUpdated: document.getElementById("tflUpdated"),
  weatherTitle: document.getElementById("weather-title")
};

const STATUS_META = {
  partSuspended: { label: "Part suspended", className: "severe", rank: 6 },
  suspended: { label: "Suspended", className: "severe", rank: 6 },
  severeDelays: { label: "Severe delays", className: "severe", rank: 5 },
  noService: { label: "No service", className: "severe", rank: 5 },
  reducedService: { label: "Reduced service", className: "minor", rank: 4 },
  minorDelays: { label: "Minor delays", className: "minor", rank: 3 },
  plannedClosure: { label: "Planned closure", className: "notice", rank: 2 },
  information: { label: "Information", className: "notice", rank: 1 },
  goodService: { label: "Good service", className: "good", rank: 0 }
};

const LINE_COLORS = {
  bakerloo: { bg: "#b36305", fg: "#ffffff" },
  central: { bg: "#e32017", fg: "#ffffff" },
  circle: { bg: "#ffd300", fg: "#111111" },
  district: { bg: "#00782a", fg: "#ffffff" },
  "hammersmith & city": { bg: "#f3a9bb", fg: "#111111" },
  "h'smith & city": { bg: "#f3a9bb", fg: "#111111" },
  jubilee: { bg: "#a0a5a9", fg: "#111111" },
  metropolitan: { bg: "#9b0056", fg: "#ffffff" },
  northern: { bg: "#000000", fg: "#ffffff" },
  piccadilly: { bg: "#003688", fg: "#ffffff" },
  victoria: { bg: "#0098d4", fg: "#111111" },
  "waterloo & city": { bg: "#95cdba", fg: "#111111" },
  dlr: { bg: "#00a4a7", fg: "#111111" },
  elizabeth: { bg: "#6950a1", fg: "#ffffff" },
  overground: { bg: "#ee7c0e", fg: "#111111" }
};

const WEATHER_CODES = {
  0: { label: "Clear sky", visual: "clear" },
  1: { label: "Mainly clear", visual: "partly" },
  2: { label: "Partly cloudy", visual: "partly" },
  3: { label: "Overcast", visual: "cloudy" },
  45: { label: "Fog", visual: "cloudy" },
  48: { label: "Rime fog", visual: "cloudy" },
  51: { label: "Light drizzle", visual: "rainy" },
  53: { label: "Drizzle", visual: "rainy" },
  55: { label: "Heavy drizzle", visual: "rainy" },
  56: { label: "Freezing drizzle", visual: "rainy" },
  57: { label: "Freezing drizzle", visual: "rainy" },
  61: { label: "Light rain", visual: "rainy" },
  63: { label: "Rain", visual: "rainy" },
  65: { label: "Heavy rain", visual: "rainy" },
  66: { label: "Freezing rain", visual: "rainy" },
  67: { label: "Freezing rain", visual: "rainy" },
  71: { label: "Light snow", visual: "rainy" },
  73: { label: "Snow", visual: "rainy" },
  75: { label: "Heavy snow", visual: "rainy" },
  77: { label: "Snow grains", visual: "rainy" },
  80: { label: "Rain showers", visual: "rainy" },
  81: { label: "Rain showers", visual: "rainy" },
  82: { label: "Heavy showers", visual: "rainy" },
  85: { label: "Snow showers", visual: "rainy" },
  86: { label: "Heavy snow showers", visual: "rainy" },
  95: { label: "Thunderstorm", visual: "rainy" },
  96: { label: "Thunderstorm", visual: "rainy" },
  99: { label: "Thunderstorm", visual: "rainy" }
};

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CONFIG.timeZone,
  hour: "2-digit",
  minute: "2-digit"
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CONFIG.timeZone,
  weekday: "long",
  day: "numeric",
  month: "long"
});

const forecastDayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CONFIG.timeZone,
  weekday: "short"
});

function updateClock() {
  const now = new Date();
  elements.time.textContent = timeFormatter.format(now);
  elements.date.textContent = dateFormatter.format(now);
}

async function loadWeather() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: CONFIG.weather.latitude,
      longitude: CONFIG.weather.longitude,
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      forecast_days: "4",
      timezone: CONFIG.timeZone
    });

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Weather returned ${response.status}`);
    }

    const weather = await response.json();
    renderWeather(weather);
  } catch (error) {
    elements.condition.textContent = "Unable to load weather";
    elements.weatherVisual.className = "weather-visual unknown";
    elements.forecast.innerHTML = `<p class="muted">Forecast unavailable</p>`;
    console.error(error);
  }
}

function renderWeather(weather) {
  const current = weather.current || {};
  const condition = getWeatherCondition(current.weather_code);
  const temp = roundTemp(current.temperature_2m);
  const feels = roundTemp(current.apparent_temperature);
  const wind = Math.round(Number(current.wind_speed_10m));

  elements.weatherTitle.textContent = CONFIG.weather.label;
  elements.temperature.innerHTML = `${temp}&deg;`;
  elements.condition.textContent = condition.label;
  elements.feelsLike.innerHTML = `${feels}&deg;`;
  elements.windSpeed.textContent = Number.isFinite(wind) ? `${wind} km/h` : "-- km/h";
  elements.weatherVisual.className = `weather-visual ${condition.visual}`;
  renderForecast(weather.daily);
}

function renderForecast(daily = {}) {
  const days = (daily.time || []).slice(1, 4);

  if (!days.length) {
    elements.forecast.innerHTML = `<p class="muted">Forecast unavailable</p>`;
    return;
  }

  elements.forecast.innerHTML = days.map((day, index) => {
    const code = daily.weather_code?.[index + 1];
    const high = roundTemp(daily.temperature_2m_max?.[index + 1]);
    const low = roundTemp(daily.temperature_2m_min?.[index + 1]);
    const condition = getWeatherCondition(code);

    return `
      <article class="forecast-day">
        <div class="forecast-label">${escapeHtml(forecastDayFormatter.format(new Date(day)))}</div>
        <div class="forecast-temp">${high}&deg; / ${low}&deg;</div>
        <div class="forecast-condition">${escapeHtml(condition.label)}</div>
      </article>
    `;
  }).join("");
}

async function loadTubeStatus() {
  try {
    const response = await fetch(buildTflUrl().toString(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`TfL returned ${response.status}`);
    }

    const data = await response.json();
    const disruptions = Array.isArray(data) ? data : data.disruptions || [];
    renderTflDisruptions(disruptions);
    elements.tflUpdated.textContent = `Updated ${timeFormatter.format(new Date())}`;
  } catch (error) {
    elements.tube.innerHTML = `<div class="empty-state">Unable to load TfL status</div>`;
    elements.tflUpdated.textContent = "Update failed";
    console.error(error);
  }
}

function buildTflUrl() {
  const modes = CONFIG.tfl.modes.join(",");
  const url = new URL(`https://api.tfl.gov.uk/Line/Mode/${modes}/Disruption`);

  if (CONFIG.tfl.appKey) {
    url.searchParams.set("app_key", CONFIG.tfl.appKey);
  }

  return url;
}

function renderTflDisruptions(disruptions) {
  const rows = normaliseDisruptions(disruptions);

  if (!rows.length) {
    elements.tube.innerHTML = `
      <article class="status-row good">
        <div class="route-mark" style="background:#2fd27a;color:#101211;">OK</div>
        <div class="status-content">
          <div class="row-top">
            <h3>No current disruptions</h3>
            <div class="status-tags">
              <span class="status-tag">Good service</span>
            </div>
          </div>
          <p>TfL has not reported live disruptions for the watched modes.</p>
        </div>
      </article>
    `;
    return;
  }

  elements.tube.innerHTML = rows.map((row) => {
    const statusMeta = getHighestStatus(row.statuses);
    const lineColor = getLineColor(row.lineName);
    const tags = getSortedStatuses(row.statuses).map((status) => {
      return `<span class="status-tag">${escapeHtml(getStatusMeta(status).label)}</span>`;
    }).join("");

    return `
      <article class="status-row ${statusMeta.className}">
        <div class="route-mark" style="background:${lineColor.bg};color:${lineColor.fg};">${escapeHtml(getRouteMark(row.lineName))}</div>
        <div class="status-content">
          <div class="row-top">
            <h3>${escapeHtml(row.lineName)}</h3>
            <div class="status-tags">${tags}</div>
          </div>
          <p>${escapeHtml(row.summary)}</p>
        </div>
      </article>
    `;
  }).join("");
}

function normaliseDisruptions(disruptions) {
  const grouped = new Map();

  disruptions.forEach((item) => {
    const description = collapseWhitespace(item?.description || "");
    if (!description) {
      return;
    }

    const lineName = extractLineName(description);
    const summary = stripLinePrefix(description);
    const key = `${lineName.toLowerCase()}|${summary.toLowerCase()}`;
    const status = item.closureText || "information";

    if (!grouped.has(key)) {
      grouped.set(key, {
        lineName,
        summary,
        statuses: new Set()
      });
    }

    grouped.get(key).statuses.add(status);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const rankDifference = getHighestStatus(b.statuses).rank - getHighestStatus(a.statuses).rank;
    return rankDifference || a.lineName.localeCompare(b.lineName);
  });
}

function extractLineName(description) {
  const separator = description.indexOf(":");
  if (separator > -1 && separator < 48) {
    return tidyLineName(description.slice(0, separator));
  }
  return "TfL";
}

function stripLinePrefix(description) {
  const separator = description.indexOf(":");
  if (separator > -1 && separator < 48) {
    return description.slice(separator + 1).trim();
  }
  return description;
}

function tidyLineName(value) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "TfL";
  }
  if (/^(dlr|tfl)$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  if (/elizabeth line/i.test(cleaned)) {
    return "Elizabeth line";
  }
  return cleaned;
}

function getHighestStatus(statuses) {
  return getSortedStatuses(statuses)[0] ? getStatusMeta(getSortedStatuses(statuses)[0]) : STATUS_META.information;
}

function getSortedStatuses(statuses) {
  return Array.from(statuses).sort((a, b) => getStatusMeta(b).rank - getStatusMeta(a).rank);
}

function getStatusMeta(status) {
  return STATUS_META[status] || {
    label: humaniseCamelCase(status || "Information"),
    className: "notice",
    rank: 1
  };
}

function getLineColor(lineName) {
  const key = lineName.toLowerCase()
    .replace(/\s+line$/i, "")
    .replace(/^london\s+/, "");

  return LINE_COLORS[key] || { bg: "#37c6b0", fg: "#101211" };
}

function getRouteMark(lineName) {
  if (/^dlr$/i.test(lineName)) {
    return "DLR";
  }
  if (/elizabeth/i.test(lineName)) {
    return "EL";
  }
  if (/overground/i.test(lineName)) {
    return "OG";
  }

  return lineName
    .replace(/\s+line$/i, "")
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getWeatherCondition(code) {
  return WEATHER_CODES[Number(code)] || { label: "Weather updating", visual: "unknown" };
}

function roundTemp(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? number : "--";
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function humaniseCamelCase(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

updateClock();
loadWeather();
loadTubeStatus();

setInterval(updateClock, CONFIG.refresh.clockMs);
setInterval(loadWeather, CONFIG.refresh.weatherMs);
setInterval(loadTubeStatus, CONFIG.refresh.tflMs);
