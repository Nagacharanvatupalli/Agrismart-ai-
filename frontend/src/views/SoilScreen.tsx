import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Sprout,
  Lock,
  FlaskConical,
  Info,
  Pencil,
  Droplet,
  CloudRain,
  Sun,
  Lightbulb,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Database,
  CheckCircle2,
  Zap,
  Activity,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, SoilData } from '../services/api';

interface SoilScreenProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onAddFarm?: () => void;
  onBack: () => void;
}

export const SoilScreen: React.FC<SoilScreenProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [inputPh, setInputPh] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const selectedCrop = selectedFarm?.current_crops || 'Paddy';

  useEffect(() => {
    if (selectedFarm) {
      loadSoil(selectedFarm.id, false);
    }
  }, [selectedFarm, currentLang]);

  const loadSoil = async (farmId: number, isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await api.getSoil(farmId, selectedCrop, isRefresh, currentLang);
      setSoilData(data);
      if (data.has_ph && data.ph !== undefined) {
        setInputPh(data.ph.toString());
      } else {
        setInputPh('');
      }
    } catch (err) {
      console.error("Soil fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSavePh = async (presetVal?: number) => {
    if (!selectedFarm) return;
    const phVal = presetVal !== undefined ? presetVal : parseFloat(inputPh);

    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      setErrorMsg("Please enter a valid soil pH value between 0.0 and 14.0");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const updated = await api.updateSoilPh(selectedFarm.id, phVal);
      setSoilData(updated);
      setInputPh(String(phVal));
      setIsEditing(false);
      // Reload multi-factor analysis
      loadSoil(selectedFarm.id, true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save soil pH");
    } finally {
      setLoading(false);
    }
  };

  const currentPh = soilData?.ph ?? 6.5;
  const scalePercent = Math.min(Math.max(((currentPh - 4.5) / 4.0) * 100, 0), 100);

  const presets = [
    { label: '5.8 Acidic', desc: 'Paddy / Heavy rain', val: 5.8 },
    { label: '6.5 Loam', desc: 'Optimal neutral', val: 6.5 },
    { label: '7.0 Neutral', desc: 'All crops balanced', val: 7.0 },
    { label: '7.8 Alkaline', desc: 'Black soil / Dry', val: 7.8 }
  ];

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Soil Intelligence</h2>
            <p className="text-xs text-[#5A6E65]">Multi-Factor • Live Weather • AI Agronomy</p>
          </div>
        </div>

        {/* Refresh AI Analysis Button */}
        <button
          onClick={() => {
            if (selectedFarm) {
              loadSoil(selectedFarm.id, true);
            }
          }}
          disabled={loading || refreshing}
          className="p-2 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#087A3D] hover:border-green-300 transition-colors shadow-2xs"
          title="Refresh AI Analysis from Live Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin text-[#087A3D]' : ''}`} />
        </button>
      </div>

      {/* Select Farm Location — Horizontal Pill Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#087A3D]" />
            Select Farm Location
          </span>
          {soilData?.weather_data && (
            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-600" />
              {soilData.weather_data.temp}°C • {soilData.weather_data.condition} ({soilData.weather_data.rain_chance}% Rain)
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {farms.map((farm) => {
            const isSelected = selectedFarm?.id === farm.id;
            return (
              <button
                key={farm.id}
                type="button"
                onClick={() => onSelectFarm(farm)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#087A3D] text-white border-[#087A3D] shadow-md'
                    : 'bg-white text-[#102D20] border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white/20' : 'bg-[#E7F7E4]'
                }`}>
                  <Sprout className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[#087A3D]'}`} />
                </div>
                <div className="text-left">
                  <div className={`font-extrabold leading-tight ${isSelected ? 'text-white' : 'text-[#102D20]'}`}>
                    {farm.farm_name}
                  </div>
                  <div className={`text-[10px] font-medium leading-none mt-0.5 ${
                    isSelected ? 'text-white/75' : 'text-gray-500'
                  }`}>
                    {farm.village}, {farm.district}
                  </div>
                </div>
                {farm.soil_ph && (
                  <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-[#087A3D]'
                  }`}>
                    pH {farm.soil_ph}
                  </span>
                )}
              </button>
            );
          })}

          {onAddFarm && (
            <button
              type="button"
              onClick={onAddFarm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#087A3D]" />
              <span>Add Farm</span>
            </button>
          )}
        </div>
      </div>

      {/* SOIL INTELLIGENCE DIAGNOSIS & GUIDANCE */}
      {(!soilData?.has_ph || isEditing) ? (
        /* STATE A: BEFORE SOIL pH IS SAVED OR EDITING */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-green-100 shadow-xs overflow-hidden text-center space-y-4 pb-5">
            <div className="w-full h-44 relative overflow-hidden bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center">
              <img
                src="/assets/soil_hero_real.jpg"
                alt="Soil Intelligence Hero"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Gemini AI Agronomy Engine
                </span>
              </div>
            </div>

            <div className="px-5 space-y-1.5">
              <h3 className="text-xl font-black text-[#102D20]">
                {isEditing ? 'Update Soil pH' : 'Enter Manual Soil pH'}
              </h3>
              <p className="text-xs font-semibold text-[#5A6E65] max-w-xs mx-auto leading-relaxed">
                Soil pH connects with live weather, land type ({selectedFarm?.soil_type || 'Loamy'}), water source ({selectedFarm?.irrigation_method || 'Canal Water'}), and crop ({selectedCrop}) to generate tailored advice.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900">Manual pH Entry Required</h4>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                Since pH is optional during registration, enter your field test result or pick a common regional preset below to generate your report.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="font-bold text-xs text-gray-700 flex items-center gap-1">
              <span>Quick Regional Presets:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => {
                    setInputPh(String(p.val));
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    inputPh === String(p.val)
                      ? 'border-[#087A3D] bg-green-50/70 text-[#087A3D]'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="font-black text-xs">{p.label}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[#102D20] flex items-center gap-1.5">
                <span>Manual Soil pH Value</span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </label>
              <span className="text-[11px] font-semibold text-gray-500">Scale: 0.0 – 14.0</span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={inputPh}
                onChange={(e) => setInputPh(e.target.value)}
                placeholder="e.g. 6.5"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-base font-bold text-[#102D20] focus:outline-hidden focus:border-[#087A3D] focus:ring-2 focus:ring-[#087A3D]/20 transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            <p className="text-[11px] text-gray-500 leading-snug">
              Values between 6.0 and 7.5 represent optimal conditions for {selectedCrop}.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleSavePh()}
              disabled={loading || !inputPh}
              className="w-full bg-[#087A3D] hover:bg-[#07552F] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Analyzing with AI...' : 'Save Manual pH & Run AI Diagnosis'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>

            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-2xl text-xs transition-colors"
              >
                Cancel Edit
              </button>
            )}

            <button
              onClick={() => setShowHelpModal(true)}
              className="w-full bg-white hover:bg-gray-50 border border-green-300 text-[#087A3D] font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How do I test soil pH?</span>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
            </button>
          </div>
        </div>
      ) : (
        /* STATE B: AFTER SOIL pH IS SAVED (FETCHED FROM DB / AI-GENERATED) */
        <div className="space-y-4">
          {/* Top Status Banner with DB & AI Badges */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs relative space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#087A3D] bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Soil Intelligence</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Synced in DB</span>
              </div>
            </div>

            <div className="flex items-start justify-between pt-1">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#102D20]">
                  <span>Soil pH ({soilData?.farm_name || selectedFarm?.farm_name})</span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-[#102D20]">{soilData?.ph}</span>
                  <span className="text-xs font-bold bg-[#E7F7E4] text-[#087A3D] px-2.5 py-0.5 rounded-full border border-green-200">
                    {soilData?.ph_category || 'Neutral'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  {soilData?.ph_status}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] text-gray-400 font-medium">
                  {soilData?.last_updated || 'Updated recently'}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Change Manual pH"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit pH</span>
                </button>
              </div>
            </div>

            {/* pH Color Gauge */}
            <div className="mt-3 pt-2">
              <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-green-500 to-blue-600">
                <div
                  className="absolute -top-2 w-4 h-4 bg-slate-900 border-2 border-white rounded-full shadow-md -translate-x-1/2"
                  style={{ left: `${scalePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1.5 px-1">
                <span>4.5 (Acidic)</span>
                <span>6.5 (Neutral)</span>
                <span>8.5 (Alkaline)</span>
              </div>
            </div>
          </div>

          {/* Multi-Factor Overview Pill Grid (Weather, Land Type, Water Source) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-amber-50/80 border border-amber-200/70 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                Live Weather Factor
              </span>
              <p className="font-extrabold text-xs text-[#102D20]">
                {soilData?.weather_data?.temp || 32}°C • {soilData?.weather_data?.condition || 'Partly Sunny'}
              </p>
              <p className="text-[10px] text-gray-600">
                Rain Chance: {soilData?.weather_data?.rain_chance || 15}% • Humidity: {soilData?.weather_data?.humidity || 68}%
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/70 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-emerald-600" />
                Land & Water Source
              </span>
              <p className="font-extrabold text-xs text-[#102D20]">
                {selectedFarm?.soil_type || 'Loamy'}
              </p>
              <p className="text-[10px] text-gray-600">
                Source: {selectedFarm?.irrigation_method || 'Canal Water'}
              </p>
            </div>
          </div>

          {/* AI Agronomic Diagnostic & Health Score */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#102D20] text-white rounded-3xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Soil Health Index ({selectedCrop})</h4>
                  <p className="text-[10px] text-emerald-200/80">Evaluated with live weather & soil chemistry</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-300">
                  {soilData?.health_score || 88}
                </span>
                <span className="text-xs text-white/60"> / 100</span>
              </div>
            </div>

            <p className="text-xs text-emerald-50 leading-relaxed font-medium bg-white/5 p-3 rounded-2xl border border-white/10">
              {soilData?.ai_summary}
            </p>

            {/* Weather Impact on Soil */}
            {soilData?.weather_soil_impact && (
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mb-0.5">
                  <CloudRain className="w-3 h-3 text-amber-300" />
                  Weather Impact on Fertilizer & Soil Moisture:
                </span>
                <p className="text-[11px] text-emerald-50 leading-snug">
                  {soilData.weather_soil_impact}
                </p>
              </div>
            )}

            {/* Irrigation & Water Source Impact */}
            {soilData?.water_source_impact && (
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mb-0.5">
                  <Droplet className="w-3 h-3 text-emerald-300" />
                  Irrigation & Water Quality Impact:
                </span>
                <p className="text-[11px] text-emerald-50 leading-snug">
                  {soilData.water_source_impact}
                </p>
              </div>
            )}

            {/* Nutrient Absorption Efficiency */}
            <div className="space-y-1.5 pt-1">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Nutrient Uptake Efficiency
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-200 block font-medium">Nitrogen (N)</span>
                  <span className="font-extrabold text-white">
                    {soilData?.nutrient_absorption?.nitrogen || 'High (88%)'}
                  </span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-200 block font-medium">Phosphorus (P)</span>
                  <span className="font-extrabold text-white">
                    {soilData?.nutrient_absorption?.phosphorus || 'Optimal (84%)'}
                  </span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-200 block font-medium">Potassium (K)</span>
                  <span className="font-extrabold text-white">
                    {soilData?.nutrient_absorption?.potassium || 'High (90%)'}
                  </span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-200 block font-medium">Micronutrients</span>
                  <span className="font-extrabold text-white">
                    {soilData?.nutrient_absorption?.micronutrients || 'Adequate'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Amendments */}
          {soilData?.amendments && soilData.amendments.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Recommended Soil Amendments & Weather Timing</span>
              </div>
              <div className="space-y-2">
                {soilData.amendments.map((amendment, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700 font-medium leading-relaxed">{amendment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommended Crops for this Soil */}
          {soilData?.recommended_crops && soilData.recommended_crops.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                  <Sprout className="w-4 h-4 text-[#087A3D]" />
                  <span>AI Crop Suitability for this Soil</span>
                </div>
                <span className="text-[10px] font-bold text-[#087A3D] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  pH {soilData.ph}
                </span>
              </div>
              <div className="space-y-2">
                {soilData.recommended_crops.map((crop) => (
                  <div
                    key={crop.id}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-green-50/40 hover:border-green-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#102D20]">{crop.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
                          crop.suitability === 'Highly Suitable'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {crop.suitability}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{crop.reason}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0 ml-2">
                      pH {crop.preferred_ph}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soil Guidance Cards */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Agronomic Guidance for {selectedCrop}</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Location: {soilData?.village}</span>
            </div>

            <div className="space-y-2">
              {soilData?.guidance?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-amber-100 flex items-center justify-between hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center shrink-0 mt-0.5">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#102D20]">{item.title}</h5>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.message}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-[#102D20]">How do I test soil pH?</h3>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 font-medium">
              <li>Collect 5-6 soil samples from V-shaped pits (15cm deep) across your farm parcel.</li>
              <li>Mix samples thoroughly in a clean plastic container and dry under shade.</li>
              <li>Take sample to nearest District Krishi Vigyan Kendra (KVK) or soil testing lab.</li>
              <li>Alternatively, use a calibrated digital soil pH meter with distilled water slurry.</li>
            </ol>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#087A3D] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
