import type { WeatherData, WeatherForecastDay } from './api';

export const WMO_MAP: Record<number, { text: string; icon: string }> = {
  0: { text: "Clear Sky", icon: "sun" },
  1: { text: "Mainly Clear", icon: "cloud-sun" },
  2: { text: "Partly Cloudy", icon: "cloud-sun" },
  3: { text: "Overcast", icon: "cloud" },
  45: { text: "Foggy", icon: "cloud" },
  48: { text: "Depositing Rime Fog", icon: "cloud" },
  51: { text: "Light Drizzle", icon: "rain" },
  53: { text: "Moderate Drizzle", icon: "rain" },
  55: { text: "Dense Drizzle", icon: "rain" },
  61: { text: "Slight Rain", icon: "rain" },
  63: { text: "Moderate Rain", icon: "rain" },
  65: { text: "Heavy Rain", icon: "rain" },
  80: { text: "Rain Showers", icon: "rain" },
  81: { text: "Moderate Showers", icon: "rain" },
  82: { text: "Violent Showers", icon: "rain" },
  95: { text: "Thunderstorm", icon: "rain" },
};

export async function fetchDirectOpenMeteo(
  lat: number = 16.54,
  lon: number = 81.51,
  village: string = "Bhimavaram",
  district: string = "West Godavari",
  state: string = "Andhra Pradesh"
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=auto`;

  console.info(`[Open-Meteo] Connecting directly to Open-Meteo API: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API error: status ${res.status}`);
  }

  const data = await res.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const currentWmo = current.weather_code ?? 0;
  const currentInfo = WMO_MAP[currentWmo] || { text: "Partly Sunny", icon: "cloud-sun" };

  const currentTemp = Math.round(current.temperature_2m ?? 32);
  const feelsLike = Math.round(current.apparent_temperature ?? 34);
  const humidity = Math.round(current.relative_humidity_2m ?? 68);
  const windSpeed = Math.round(current.wind_speed_10m ?? 12);

  const times: string[] = daily.time || [];
  const maxTemps: number[] = daily.temperature_2m_max || [];
  const minTemps: number[] = daily.temperature_2m_min || [];
  const rainChances: number[] = daily.precipitation_probability_max || [];
  const precipSums: number[] = daily.precipitation_sum || [];
  const windMaxs: number[] = daily.wind_speed_10m_max || [];
  const weatherCodes: number[] = daily.weather_code || [];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const forecast: WeatherForecastDay[] = [];

  for (let i = 0; i < Math.min(7, times.length); i++) {
    const dateStr = times[i];
    const dateObj = new Date(dateStr);
    const dayName = daysOfWeek[dateObj.getDay()] || `Day ${i + 1}`;
    const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;

    const code = weatherCodes[i] ?? 1;
    const info = WMO_MAP[code] || { text: "Partly Sunny", icon: "cloud-sun" };
    const maxT = Math.round(maxTemps[i] ?? 32);
    const minT = Math.round(minTemps[i] ?? 24);
    const rain = rainChances[i] ?? 10;
    const precip = Math.round((precipSums[i] ?? 0) * 10) / 10;
    const maxWind = Math.round((windMaxs[i] ?? 12) * 10) / 10;

    let advisory = "Favorable conditions. Suitable for weeding, fertilizing, and foliar spray.";
    if (rain >= 60 || precip >= 5) {
      advisory = "High rain probability. Postpone pesticide/fertilizer spraying. Ensure field drainage.";
    } else if (rain >= 35 || precip >= 1) {
      advisory = "Light rain expected. Check soil moisture before turning on irrigation.";
    } else if (maxT >= 36) {
      advisory = "High temperature warning. Irrigate early morning or evening to avoid heat stress.";
    } else if (maxWind >= 25) {
      advisory = "Windy conditions. Avoid chemical spraying to prevent drift.";
    }

    forecast.push({
      day: dayName,
      date: formattedDate,
      full_date: dateStr,
      max_temp: maxT,
      min_temp: minT,
      rain_chance: rain,
      precipitation_sum: precip,
      wind_speed_max: maxWind,
      condition: info.text,
      icon: info.icon,
      advisory: advisory
    });
  }

  // Directly print the 7 days forecast details to console!
  console.group("🌦️ [Open-Meteo] Live 7-Day Agricultural Weather Forecast");
  console.log(`Location: ${village}, ${district}, ${state} (${lat}° N, ${lon}° E)`);
  console.log(`Current: ${currentTemp}°C (${currentInfo.text}), Humidity: ${humidity}%, Wind: ${windSpeed} km/h`);
  console.table(
    forecast.map(f => ({
      "Day": `${f.day} (${f.date})`,
      "Weather": f.condition,
      "High": `${f.max_temp}°C`,
      "Low": `${f.min_temp}°C`,
      "Rain %": `${f.rain_chance}%`,
      "Rain (mm)": `${f.precipitation_sum} mm`,
      "Wind Max": `${f.wind_speed_max} km/h`,
      "Farming Advisory": f.advisory
    }))
  );
  console.groupEnd();

  const rainToday = forecast[0]?.rain_chance ?? 10;
  const maxToday = forecast[0]?.max_temp ?? currentTemp;
  const minToday = forecast[0]?.min_temp ?? 24;

  const insights = [
    ...(rainToday >= 40
      ? [{
          title: `Rain expected today (${rainToday}%)`,
          message: `Chance of rain is ${rainToday}%. Delay fertilizer applications and avoid waterlogging.`,
          type: "warning",
          icon: "rain"
        }]
      : [{
          title: "Ideal spraying and harvesting window",
          message: `Good conditions today with ${currentInfo.text.toLowerCase()}. Suitable for routine farm activities.`,
          type: "success",
          icon: "sprout"
        }]),
    {
      title: "Crop growth conditions favorable",
      message: `Day temperature ${maxToday}°C and night temperature ${minToday}°C are suitable for active vegetation.`,
      type: "info",
      icon: "sprout"
    }
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    village,
    district,
    state,
    lat,
    lon,
    updated_at: `Today ${timeStr}`,
    current_temp: currentTemp,
    feels_like: feelsLike,
    condition: currentInfo.text,
    rain_chance: rainToday,
    max_temp: maxToday,
    min_temp: minToday,
    wind_speed: windSpeed,
    humidity,
    forecast,
    insights,
    audio_summary: `Live weather report for ${village}, ${district}. Current temperature is ${currentTemp} degrees Celsius with ${currentInfo.text}. Humidity is ${humidity} percent and wind speed is ${windSpeed} kilometers per hour. Chance of rain today is ${rainToday} percent.`
  };
}
