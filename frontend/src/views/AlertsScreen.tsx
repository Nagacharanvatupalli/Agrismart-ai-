import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CloudRain,
  Thermometer,
  Wind,
  Sun,
  Bug,
  Zap,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Map,
  RefreshCw,
  Sprout,
  Plus,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, ClimateRiskData } from '../services/api';

interface AlertsScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onAddFarm?: () => void;
  onBack: () => void;
  onViewMap?: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
  onViewMap
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  // Helper: localized risk suffix
  const getRiskWord = (lang: string) => {
    const map: Record<string, string> = {
      te: 'ముప్పు', hi: 'जोखिम', ta: 'அபாயம்', kn: 'ಅಪಾಯ', mr: 'धोका'
    };
    return map[lang] || 'Risk';
  };

  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('today');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [climateData, setClimateData] = useState<ClimateRiskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const defaultFarms: Farm[] = [
    {
      id: 1,
      farm_name: 'Bhimavaram Farm',
      village: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      acreage: 2.5,
      latitude: 16.5449,
      longitude: 81.5212,
      current_crops: 'Paddy',
      soil_ph: 6.8
    } as any,
    {
      id: 2,
      farm_name: 'Tanuku Parcel',
      village: 'Tanuku',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      acreage: 1.8,
      latitude: 16.7562,
      longitude: 81.6811,
      current_crops: 'Maize',
      soil_ph: 7.0
    } as any
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  useEffect(() => {
    if (activeFarm) {
      loadClimateRisks(activeFarm.id, period, false);
    }
  }, [activeFarm?.id, period, currentLang]);

  const loadClimateRisks = async (farmId: number, selectedPeriod: string, isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await api.getClimatePredictions(farmId, selectedPeriod, currentLang);
      setClimateData(data);
      // Auto-expand the highest risk prediction
      if (data?.predictions && data.predictions.length > 0) {
        const highRisk = data.predictions.find(p => p.severity === 'high');
        setExpandedId(highRisk ? highRisk.id : data.predictions[0].id);
      }
    } catch (err) {
      console.error("Failed to load climate risk predictions from weather API", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Predictions' },
    { id: 'heat_stress', label: 'Heat Stress', icon: Thermometer },
    { id: 'heavy_rain', label: 'Rain & Flood', icon: CloudRain },
    { id: 'wind_lodging', label: 'Wind & Squalls', icon: Wind },
    { id: 'pest_disease', label: 'Pests & Fungi', icon: Bug },
    { id: 'dry_spell', label: 'Dry Spells', icon: Sun },
    { id: 'spray_window', label: 'Spray Windows', icon: Sprout }
  ];

  const filteredPredictions = climateData?.predictions.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.id === selectedCategory;
  }) || [];

  const topHeroPrediction = climateData?.predictions.find(p => p.severity === 'high') || climateData?.predictions[0];

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-500 text-white border-rose-600';
      case 'medium':
        return 'bg-amber-500 text-white border-amber-600';
      case 'safe':
        return 'bg-emerald-600 text-white border-emerald-700';
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const getSeverityBgClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-50/90 border-rose-200/90 text-rose-900';
      case 'medium':
        return 'bg-amber-50/90 border-amber-200/90 text-amber-900';
      case 'safe':
        return 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getPredictionIcon = (icon: string) => {
    switch (icon) {
      case 'thermometer':
        return <Thermometer className="w-5 h-5 text-rose-600" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-600" />;
      case 'wind':
        return <Wind className="w-5 h-5 text-teal-600" />;
      case 'bug':
        return <Bug className="w-5 h-5 text-purple-600" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-amber-600" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      default:
        return <Sprout className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-3 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Climate Risk Alerts</h2>
            <p className="text-xs text-[#5A6E65]">Weather API Hazard Predictions • Crop Protection</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh button */}
          <button
            onClick={() => activeFarm && loadClimateRisks(activeFarm.id, period, true)}
            disabled={loading || refreshing}
            className="p-2 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#087A3D] hover:border-green-300 transition-colors shadow-2xs"
            title="Refresh from Weather API"
          >
            <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin text-[#087A3D]' : ''}`} />
          </button>

          {/* Map view button */}
          {onViewMap && (
            <button
              onClick={onViewMap}
              className="p-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#087A3D] hover:bg-emerald-100 transition-colors shadow-2xs"
              title="View on Map"
            >
              <Map className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Farm Selector Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
          <span>Select Farm Parcel:</span>
          {climateData?.weather_snapshot && (
            <span className="text-[10px] text-[#087A3D] bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live {climateData.weather_snapshot.temp}°C • {climateData.weather_snapshot.condition}
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {displayFarms.map((farm) => {
            const isSelected = activeFarm?.id === farm.id;
            return (
              <button
                key={farm.id}
                onClick={() => onSelectFarm && onSelectFarm(farm)}
                className={`flex-none min-w-[130px] p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#E7F7E4] border-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#087A3D] text-white' : 'bg-green-100 text-[#087A3D]'
                }`}>
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-extrabold text-xs text-[#102D20] truncate">{farm.farm_name || farm.village}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {farm.acreage} ac • {farm.current_crops || 'Paddy'}
                  </p>
                </div>
              </button>
            );
          })}

          {onAddFarm && (
            <button
              onClick={onAddFarm}
              className="flex-none px-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-bold text-gray-700"
            >
              <Plus className="w-3.5 h-3.5 text-[#087A3D]" />
              <span className="text-[11px]">Add Farm</span>
            </button>
          )}
        </div>
      </div>

      {/* Forecast Horizon Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setPeriod('today')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === 'today'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setPeriod('7days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '7days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Next 7 Days
        </button>
        <button
          onClick={() => setPeriod('30days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '30days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Extended (14–30d)
        </button>
      </div>

      {/* Overall Climate Risk Score Card */}
      {climateData && (
        <div className="bg-gradient-to-br from-[#102D20] to-[#1C3D2E] text-white rounded-3xl p-4 shadow-md space-y-3 border border-emerald-900">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full">
                Open-Meteo Weather Model
              </span>
              <h3 className="text-base font-extrabold text-white pt-1 leading-tight">
                {climateData.summary_headline}
              </h3>
              <p className="text-[11px] text-emerald-100/80">
                Location: {climateData.farm_location} • Crop: {climateData.crop_name}
              </p>
            </div>

            <div className="text-right shrink-0 pl-2">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-amber-300">
                  {climateData.overall_risk_score}
                </span>
                <span className="text-xs text-emerald-200">/ 100</span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                (climateData.overall_risk_level_en || climateData.overall_risk_level) === 'High'
                  ? 'bg-rose-500 text-white'
                  : (climateData.overall_risk_level_en || climateData.overall_risk_level) === 'Moderate'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-emerald-500 text-white'
              }`}>
                {climateData.overall_risk_level} {getRiskWord(currentLang)}
              </span>
            </div>
          </div>

          {/* Risk Level Bar */}
          <div className="space-y-1 pt-1">
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  climateData.overall_risk_score >= 65
                    ? 'bg-rose-500'
                    : climateData.overall_risk_score >= 38
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${climateData.overall_risk_score}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-emerald-200/70 font-semibold px-0.5">
              <span>Low (0–35)</span>
              <span>Moderate (36–65)</span>
              <span>High (66–100)</span>
            </div>
          </div>

          {/* Weather Snapshot Chips */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-[10px] text-emerald-200 block font-medium">Temp</span>
              <span className="font-extrabold text-xs text-white">{climateData.weather_snapshot.temp}°C</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-[10px] text-emerald-200 block font-medium">Feels Like</span>
              <span className="font-extrabold text-xs text-amber-300">{climateData.weather_snapshot.feels_like}°C</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-[10px] text-emerald-200 block font-medium">Humidity</span>
              <span className="font-extrabold text-xs text-white">{climateData.weather_snapshot.humidity}%</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <span className="text-[10px] text-emerald-200 block font-medium">Rain Risk</span>
              <span className="font-extrabold text-xs text-sky-300">{climateData.weather_snapshot.rain_chance}%</span>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S HOURLY RISK BREAKDOWN (When period === 'today') */}
      {period === 'today' && climateData?.hourly_today && climateData.hourly_today.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#102D20]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Today's Diurnal Hazard Timeline</span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Hourly progression</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {climateData.hourly_today.map((h, i) => (
              <div
                key={i}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-between space-y-1 ${
                  h.risk_level === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : h.risk_level === 'medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                }`}
              >
                <span className="text-[9px] font-bold text-gray-500 block leading-tight">{h.time_label}</span>
                <span className="font-black text-xs">{h.temp}°C</span>
                <div className="text-[9px] font-semibold text-gray-500">
                  <div>💧 {h.humidity}%</div>
                  <div>🌧️ {h.rain_chance}%</div>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                  h.risk_level === 'high' ? 'bg-rose-500 text-white' : (h.risk_level === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white')
                }`}>
                  {h.risk_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-DAY HAZARD CALENDAR TIMELINE (When period === '7days') */}
      {period === '7days' && climateData?.seven_day_timeline && climateData.seven_day_timeline.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#102D20]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#087A3D]" />
              <span>7-Day Agricultural Hazard Calendar</span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Open-Meteo 7-day model</span>
          </div>

          <div className="space-y-2">
            {climateData.seven_day_timeline.map((day, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                  day.risk_level === 'high'
                    ? 'bg-rose-50/70 border-rose-200'
                    : day.risk_level === 'medium'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-gray-50/80 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 text-center">
                    <span className="font-extrabold text-xs text-[#102D20] block">{day.day}</span>
                    <span className="text-[10px] text-gray-500">{day.date}</span>
                  </div>

                  <div className="border-l pl-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#102D20]">
                      <span>{day.condition}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                        day.risk_level === 'high'
                          ? 'bg-rose-500 text-white'
                          : day.risk_level === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {day.primary_hazard}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>Max: {day.max_temp}°C</span>
                      <span>Min: {day.min_temp}°C</span>
                      <span>Rain: {day.rain_chance}% ({day.precipitation_sum}mm)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-600 block">💨 {day.wind_gusts} km/h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXTENDED 14–30 DAYS CLIMATE OUTLOOK (When period === '30days') */}
      {period === '30days' && climateData?.extended_outlook && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>14 to 30 Days Long-Range Climate Trend</span>
            </span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">Regional Model</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Monsoon & Rainfall Tendency</span>
              <p className="font-extrabold text-xs text-[#102D20]">{climateData.extended_outlook.monsoon_outlook}</p>
              <p className="text-[11px] text-gray-600">Expected 14-day total rain: {climateData.extended_outlook.cumulative_rain_estimate}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Thermal & Evaporative Trend</span>
              <p className="font-extrabold text-xs text-[#102D20]">{climateData.extended_outlook.historical_anomaly}</p>
              <p className="text-[11px] text-gray-600">{climateData.extended_outlook.dry_spell_duration}</p>
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-1 text-emerald-950">
              <span className="text-[10px] font-bold text-[#087A3D] uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#087A3D]" />
                Seasonal Agricultural Recommendation
              </span>
              <p className="text-xs font-semibold leading-relaxed">{climateData.extended_outlook.key_recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Featured High Risk Hero Card (If exists) */}
      {topHeroPrediction && (
        <div className={`border rounded-3xl p-4 space-y-3 shadow-xs relative overflow-hidden transition-all ${
          topHeroPrediction.severity === 'high'
            ? 'bg-rose-50/90 border-rose-200'
            : 'bg-amber-50/90 border-amber-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xs shrink-0">
                {getPredictionIcon(topHeroPrediction.icon)}
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getSeverityBadgeClass(topHeroPrediction.severity)}`}>
                  {topHeroPrediction.severity_label || topHeroPrediction.severity}
                </span>
                <h3 className="font-black text-base text-[#102D20] mt-1 leading-tight">
                  {topHeroPrediction.title}
                </h3>
                <p className="text-xs text-gray-500 font-semibold">{topHeroPrediction.forecast_window}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
            <div className="flex items-baseline justify-between border-b pb-2">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Forecast Metric</span>
                <p className="text-xl font-black text-[#102D20]">{topHeroPrediction.metric}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-medium">{topHeroPrediction.normal_baseline}</span>
                <p className="text-xs font-bold text-amber-700">Probability: {topHeroPrediction.probability}</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              {topHeroPrediction.agronomic_impact}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 flex items-start gap-2.5 text-xs text-[#102D20] shadow-2xs">
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-xs">Action Advice:</span>
              <p className="text-gray-600 mt-0.5 leading-snug">{topHeroPrediction.action_advice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Field Operations & Safe Spraying Window */}
      {climateData?.field_operations && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#087A3D]" />
              <span>Field Operations & Spray Window Opportunity</span>
            </span>
            <span className="text-[10px] bg-[#087A3D] text-white px-2 py-0.5 rounded-full font-bold">
              {climateData.field_operations.spraying_window?.status || 'Favorable'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-emerald-100 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-[#102D20]">
              <span>Optimal Spray Window:</span>
              <span className="text-[#087A3D]">{climateData.field_operations.spraying_window?.best_time}</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-snug">
              {climateData.field_operations.spraying_window?.reason}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-gray-500 block font-medium">Drainage Status:</span>
              <span className="font-extrabold text-[#102D20]">{climateData.field_operations.drainage_urgency}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-gray-500 block font-medium">Irrigation Timing:</span>
              <span className="font-extrabold text-[#102D20]">{climateData.field_operations.irrigation_strategy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Category Filters */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1 text-xs font-extrabold text-[#102D20]">
          <span>All Weather Risk Predictions ({filteredPredictions.length})</span>
          <span className="text-[10px] text-gray-500 font-semibold">Filter by hazard</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#102D20] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List of All Predictions Cards */}
      <div className="space-y-3">
        {loading && (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#087A3D] mx-auto" />
            <p className="text-xs font-bold text-gray-500">Calculating climate risk models from Weather API...</p>
          </div>
        )}

        {!loading && filteredPredictions.length === 0 && (
          <div className="py-8 text-center bg-gray-50 rounded-3xl border border-gray-200 p-4 space-y-2">
            <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No active hazards detected in this category.</p>
            <p className="text-[11px] text-gray-500">Farming conditions are within safe operational thresholds.</p>
          </div>
        )}

        {!loading && filteredPredictions.map((pred) => {
          const isExpanded = expandedId === pred.id;
          return (
            <div
              key={pred.id}
              className={`rounded-3xl border p-4 space-y-3 shadow-xs transition-all ${getSeverityBgClass(pred.severity)}`}
            >
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : pred.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                    {getPredictionIcon(pred.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${getSeverityBadgeClass(pred.severity)}`}>
                        {pred.severity_label || pred.severity} {getRiskWord(currentLang)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">{pred.category}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#102D20] mt-0.5 leading-snug">
                      {pred.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-gray-600 mt-0.5">{pred.metric}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-transform"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Collapsed brief snippet or Expanded full checklist */}
              {isExpanded ? (
                <div className="pt-2 border-t border-gray-200/80 space-y-2.5 text-xs">
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Impact on {climateData?.crop_name || 'Crop'}</span>
                    <p className="text-gray-700 font-medium leading-relaxed">{pred.agronomic_impact}</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      Recommended Mitigation Checklist
                    </span>
                    <ul className="space-y-1.5 text-gray-700">
                      {pred.mitigation_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-0.5 font-medium">
                    <span>Forecast Timing: {pred.forecast_window}</span>
                    <span>Confidence: {pred.probability}</span>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-white/80 p-2.5 rounded-2xl border border-gray-100 text-xs text-gray-600 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(pred.id)}
                >
                  <p className="truncate max-w-[280px] font-medium">{pred.action_advice}</p>
                  <span className="text-[10px] font-bold text-[#087A3D] shrink-0">View Steps →</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
