import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  RotateCw,
  Volume2,
  CheckCircle2,
  Plus,
  Calendar,
  Sprout,
  MapPin,
  Loader2,
  AlertCircle,
  Gauge,
  Zap,
  Leaf
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, WeatherData } from '../services/api';
import { voiceService } from '../services/voice';

interface WeatherScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onAddFarm: () => void;
  onBack: () => void;
}

function WeatherIcon({ icon, className = "w-6 h-6" }: { icon: string; className?: string }) {
  if (icon === 'rain') return <CloudRain className={`${className} text-sky-500`} />;
  if (icon === 'cloud') return <CloudSun className={`${className} text-gray-400`} />;
  if (icon === 'cloud-sun') return <CloudSun className={`${className} text-gray-400`} />;
  return <Sun className={`${className} text-amber-400 fill-amber-300`} />;
}

export const WeatherScreen: React.FC<WeatherScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingReport, setIsPlayingReport] = useState(false);

  const currentLang = i18n.language || 'en';

  useEffect(() => {
    if (selectedFarm) {
      loadWeather(selectedFarm);
    }
  }, [selectedFarm?.id, currentLang]);

  const loadWeather = async (farm: Farm) => {
    setLoading(true);
    setError(null);
    try {
      // Pass farmId, farmMeta, and active language
      const data = await api.getWeather(farm.id, {
        lat: farm.latitude,
        lon: farm.longitude,
        village: farm.village,
        district: farm.district,
        state: farm.state
      }, currentLang);
      setWeather(data);
    } catch (err) {
      console.error("Weather fetch failed:", err);
      setError("Could not fetch live weather. Trying direct Open-Meteo connection...");
      // Try direct Open-Meteo as last resort
      try {
        const direct = await api.getDirectWeather(
          farm.latitude,
          farm.longitude,
          farm.village,
          farm.district,
          farm.state
        );
        setWeather(direct);
        setError(null);
      } catch (err2) {
        setError("Weather unavailable. Check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakReport = (textToSpeak: string) => {
    if (isPlayingReport) {
      voiceService.stop();
      setIsPlayingReport(false);
    } else {
      setIsPlayingReport(true);
      voiceService.speak(textToSpeak, currentLang, () => {
        setIsPlayingReport(false);
      });
    }
  };

  const activeFarm = selectedFarm || (farms.length > 0 ? farms[0] : null);

  // Trigger load on mount if there's an active farm that hasn't been fetched
  useEffect(() => {
    if (activeFarm && !weather && !loading) {
      loadWeather(activeFarm);
    }
  }, [activeFarm?.id]);

  const isLiveData = weather?.updated_at?.includes('Open-Meteo') || weather?.updated_at?.includes(':');

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">
              {t('weatherUpdates', 'Weather Updates')}
            </h2>
            <p className="text-xs text-[#5A6E65]">
              {isLiveData ? '🟢 ' + t('weatherLiveBadge', 'Live Open-Meteo') : t('weatherSub', 'Live weather for your farms')}
            </p>
          </div>
        </div>
      </div>

      {/* Farm Selector Carousel */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {farms.map((farm, index) => {
          const isSelected = selectedFarm?.id === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => { onSelectFarm(farm); loadWeather(farm); }}
              className={`flex-none w-36 p-2.5 rounded-2xl border transition-all text-left relative flex items-center justify-between ${
                isSelected
                  ? 'bg-white border-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E7F7E4] flex items-center justify-center text-[#087A3D]">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#102D20] truncate">{farm.village}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{t('myFarm', 'Farm')} {index + 1}</p>
                </div>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-[#087A3D] fill-[#087A3D]/20 shrink-0" />
              )}
            </button>
          );
        })}

        <button
          onClick={onAddFarm}
          className="flex-none w-28 p-2.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 text-xs font-bold text-gray-700"
        >
          <Plus className="w-4 h-4 text-[#087A3D]" />
          <span>{t('addFarm', 'Add Farm')}</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 via-sky-300 to-emerald-200 p-8 flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <p className="font-bold text-sm">{t('loading', 'Fetching live weather from Open-Meteo...')}</p>
          <p className="text-[11px] text-white/80">
            {activeFarm?.village}, {activeFarm?.district}
          </p>
        </div>
      )}

      {/* Main Weather Hero Card */}
      {!loading && weather && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-400 via-sky-300 to-emerald-200 text-white p-5 shadow-md">
          <div className="absolute top-2 right-4 opacity-25 pointer-events-none">
            <Sun className="w-28 h-28 text-amber-300 fill-amber-300" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Location + Live badge */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 drop-shadow-xs">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>{weather.village}, {weather.district}</span>
                </div>
                <p className="text-[11px] text-slate-800 font-medium ml-5">
                  {weather.lat}° N | {weather.lon}° E
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold bg-white/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>{weather.updated_at}</span>
                <button
                  onClick={() => activeFarm && loadWeather(activeFarm)}
                  className="hover:rotate-180 transition-transform ml-0.5"
                  title={t('refresh', 'Refresh weather')}
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-900" />
                </button>
              </div>
            </div>

            {/* Current Temp */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    {weather.current_temp}°C
                  </span>
                  <button
                    onClick={() => handleSpeakReport(weather.audio_summary)}
                    className="w-10 h-10 rounded-full bg-emerald-800/80 text-white flex items-center justify-center shadow-xs hover:bg-emerald-900 transition-colors"
                    title={t('listen', 'Listen to weather report')}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{weather.condition}</p>
                <p className="text-xs font-semibold text-slate-800">{t('feelsLike', 'Feels like')} {weather.feels_like}°C</p>
              </div>

              <div className="w-24 h-20 relative">
                <WeatherIcon
                  icon={weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('drizzle') ? 'rain' :
                        weather.condition.toLowerCase().includes('cloud') || weather.condition.toLowerCase().includes('overcast') ? 'cloud-sun' : 'sun'}
                  className="w-20 h-20 absolute bottom-0 left-0 drop-shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Farm Selected */}
      {!loading && !weather && !error && !activeFarm && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center space-y-3">
          <CloudSun className="w-14 h-14 text-sky-400 mx-auto" />
          <h3 className="font-bold text-[#102D20]">{t('addFarm', 'Add a Farm to See Weather')}</h3>
          <p className="text-sm text-gray-500">Add your farm location to view live weather powered by Open-Meteo API.</p>
          <button onClick={onAddFarm} className="bg-[#087A3D] text-white font-bold px-6 py-2.5 rounded-2xl text-sm hover:bg-[#07552F] transition-colors">
            + {t('addFarm', 'Add Farm')}
          </button>
        </div>
      )}

      {/* Weather Metric Grid */}
      {!loading && weather && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
            <Droplets className="w-5 h-5 text-sky-500 mx-auto" />
            <p className="text-[10px] text-gray-500 font-medium mt-1">{t('rainChance', 'Rain')}</p>
            <p className="font-extrabold text-sm text-[#102D20]">{weather.rain_chance}%</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
            <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-[10px] text-gray-500 font-medium mt-1">Max</p>
            <p className="font-extrabold text-sm text-rose-600">{weather.max_temp}°C</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
            <Thermometer className="w-5 h-5 text-sky-600 mx-auto" />
            <p className="text-[10px] text-gray-500 font-medium mt-1">Min</p>
            <p className="font-extrabold text-sm text-sky-600">{weather.min_temp}°C</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
            <Wind className="w-5 h-5 text-teal-500 mx-auto" />
            <p className="text-[10px] text-gray-500 font-medium mt-1">{t('windSpeed', 'Wind')}</p>
            <p className="font-extrabold text-sm text-[#102D20]">{weather.wind_speed} km/h</p>
          </div>
        </div>
      )}

      {/* Humidity badge */}
      {!loading && weather && (
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-[#102D20]">{t('humidity', 'Humidity')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500"
                style={{ width: `${Math.min(weather.humidity, 100)}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-violet-700">{weather.humidity}%</span>
          </div>
        </div>
      )}

      {/* 7-Day Forecast */}
      {!loading && weather && weather.forecast && weather.forecast.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#087A3D]" />
              <h3 className="font-extrabold text-sm text-[#102D20]">{t('sevenDayForecast', '7-Day Forecast')}</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              📡 {t('weatherLiveBadge', 'Open-Meteo Live')}
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden divide-y divide-gray-50">
            {weather.forecast.map((day, idx) => (
              <div
                key={idx}
                className={`flex items-center px-4 py-3 gap-3 ${idx === 0 ? 'bg-[#E7F7E4]/40' : ''}`}
              >
                {/* Day */}
                <div className="w-12 shrink-0">
                  <p className={`font-extrabold text-xs ${idx === 0 ? 'text-[#087A3D]' : 'text-[#102D20]'}`}>
                    {idx === 0 ? 'Today' : day.day}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">{day.date}</p>
                </div>

                {/* Icon + Condition */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <WeatherIcon icon={day.icon} className="w-5 h-5 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-500 truncate">
                    {day.condition}
                  </span>
                </div>

                {/* Rain bar */}
                <div className="flex items-center gap-1.5 w-16 shrink-0">
                  <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${Math.min(day.rain_chance, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 w-7 text-right">
                    {day.rain_chance}%
                  </span>
                </div>

                {/* Temps */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-xs text-rose-500">{day.max_temp}°</span>
                  <span className="text-gray-300 text-xs">|</span>
                  <span className="font-semibold text-xs text-sky-500">{day.min_temp}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farming Advisory for each day */}
      {!loading && weather && weather.forecast && weather.forecast.some(d => d.advisory) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#087A3D]" />
            <h3 className="font-extrabold text-sm text-[#102D20]">{t('weatherAdvisory', 'Daily Farming Advisories')}</h3>
          </div>
          <div className="space-y-2">
            {weather.forecast.slice(0, 4).map((day, idx) => (
              day.advisory ? (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-start gap-3 shadow-2xs">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    day.advisory.includes('rain') || day.advisory.includes('Rain') ? 'bg-sky-100' :
                    day.advisory.includes('High temp') || day.advisory.includes('heat') ? 'bg-rose-100' :
                    day.advisory.includes('wind') || day.advisory.includes('Wind') ? 'bg-amber-100' :
                    'bg-green-100'
                  }`}>
                    {day.advisory.includes('rain') || day.advisory.includes('Rain') ? <CloudRain className="w-4 h-4 text-sky-600" /> :
                     day.advisory.includes('High temp') || day.advisory.includes('heat') ? <Thermometer className="w-4 h-4 text-rose-600" /> :
                     day.advisory.includes('wind') || day.advisory.includes('Wind') ? <Wind className="w-4 h-4 text-amber-600" /> :
                     <Sprout className="w-4 h-4 text-[#087A3D]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#102D20]">{day.day} • {day.condition}</p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5 leading-relaxed">{day.advisory}</p>
                  </div>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {!loading && weather && weather.hourly && weather.hourly.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#102D20]">{t('hourlyForecast', 'Hourly Forecast Today')}</h3>
            <span className="text-[11px] text-gray-400 font-semibold">{weather.hourly.length} periods</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {weather.hourly.map((h, i) => (
              <div
                key={i}
                className="flex-none w-20 bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs space-y-1.5"
              >
                <p className="text-[10px] text-gray-400 font-bold">{h.time}</p>
                <WeatherIcon icon={h.icon} className="w-5 h-5 mx-auto" />
                <p className="text-xs font-black text-[#102D20]">{h.temp}°C</p>
                <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-sky-600">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{h.rain_chance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spraying & Operations Window */}
      {!loading && weather && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#102D20]">{t('sprayingWindow', 'Spraying & Farm Operations Window')}</h4>
                <p className="text-[10px] text-emerald-700 font-medium">Microclimate condition analysis</p>
              </div>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              weather.rain_chance > 40 || weather.wind_speed > 18
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {weather.rain_chance > 40 || weather.wind_speed > 18 ? 'Caution' : 'Favorable'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="bg-white/80 rounded-2xl p-2.5 border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">Best Spray Window</span>
              <span className="font-bold text-[#102D20]">
                {weather.wind_speed < 15 ? 'Early Morning (6:30 - 9:30 AM)' : 'Late Evening after 5:00 PM'}
              </span>
            </div>
            <div className="bg-white/80 rounded-2xl p-2.5 border border-emerald-100">
              <span className="text-[10px] text-gray-500 block">Wind Drift Risk</span>
              <span className={`font-bold ${weather.wind_speed > 15 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {weather.wind_speed} km/h ({weather.wind_speed > 15 ? 'Moderate Drift' : 'Low Drift'})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
