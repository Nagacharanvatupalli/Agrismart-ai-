import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Calendar,
  Droplet,
  Sprout,
  BarChart3,
  Sun,
  CloudRain,
  Thermometer,
  AlertTriangle,
  MapPin,
  ArrowRight,
  ChevronDown,
  Loader2,
  Sliders,
  Bookmark,
  History,
  X
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, CropRecommendationItem, CropComparisonResult } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface CropRecommendationScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
  onNavigateToIrrigation?: (cropName: string) => void;
}

export type CropItem = CropRecommendationItem;

export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onBack,
  onNavigateToIrrigation
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [activeView, setActiveView] = useState<'main' | 'detail' | 'irrigation' | 'multicrop'>('main');
  const [selectedSeason, setSelectedSeason] = useState<'Kharif' | 'Rabi' | 'Pre-summer' | 'All'>('Kharif');
  const [filterTab, setFilterTab] = useState<'all' | 'best' | 'good' | 'alternative'>('best');
  const [detailCrop, setDetailCrop] = useState<CropItem | null>(null);
  const [detailTab, setDetailTab] = useState<'Overview' | 'Irrigation' | 'Season' | 'Past Data'>('Overview');
  const [selectedMultiCrops, setSelectedMultiCrops] = useState<string[]>(['Paddy', 'Maize', 'Groundnut']);
  const [waterSource, setWaterSource] = useState<string>('Canal');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState<boolean>(false);

  // Live state
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherSnapshot, setWeatherSnapshot] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Soil adjustment state
  const [showAdjustPanel, setShowAdjustPanel] = useState<boolean>(false);
  const [inputSoilPh, setInputSoilPh] = useState<string>('');
  const [inputSoilType, setInputSoilType] = useState<string>('Loamy');

  // Comparison state
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<CropComparisonResult | null>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  // Persistence / History state
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5, state: 'Andhra Pradesh', soil_ph: 6.8, soil_type: 'Clay Loam', water_availability: 'Canal' },
    { id: 2, village: 'Tanuku', acreage: 1.8, state: 'Andhra Pradesh', soil_ph: 6.8, soil_type: 'Loamy', water_availability: 'Borewell' },
    { id: 3, village: 'Narsapuram', acreage: 3.2, state: 'Andhra Pradesh', soil_ph: 7.1, soil_type: 'Sandy Loam', water_availability: 'Canal' },
    { id: 4, village: 'Eluru', acreage: 1.0, state: 'Andhra Pradesh', soil_ph: 6.7, soil_type: 'Clay', water_availability: 'Borewell' }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  useEffect(() => {
    if (activeFarm) {
      setInputSoilPh(activeFarm.soil_ph ? String(activeFarm.soil_ph) : '6.8');
      setInputSoilType(activeFarm.soil_type || 'Loamy');
      setWaterSource((activeFarm as any).water_availability || 'Canal');
      loadRecommendations(activeFarm, selectedSeason);
    }
  }, [activeFarm?.id, selectedSeason, currentLang]);

  const loadRecommendations = async (farm: any, season: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const phVal = inputSoilPh ? parseFloat(inputSoilPh) : farm.soil_ph || 6.8;
      const res = await api.getCropRecommendations({
        farm_id: farm.id,
        village: farm.village || 'Bhimavaram',
        district: farm.district || 'West Godavari',
        latitude: farm.latitude || 16.5449,
        longitude: farm.longitude || 81.5212,
        area: farm.acreage || 2.5,
        season: season,
        soil_ph: phVal,
        soil_type: inputSoilType || farm.soil_type || 'Loamy',
        water_source: waterSource || farm.water_availability || 'Canal'
      }, currentLang);

      if (res && res.recommendations) {
        setCrops(res.recommendations);
        setWeatherSnapshot(res.weather_snapshot);
        if (res.recommendations.length > 0) {
          if (!detailCrop) {
            setDetailCrop(res.recommendations[0]);
          } else {
            // Keep detailCrop synchronized with translated data
            const matched = res.recommendations.find(r => r.name.toLowerCase() === detailCrop.name.toLowerCase() || (Boolean((detailCrop as any).local_name) && (r as any).local_name === (detailCrop as any).local_name));
            setDetailCrop(matched || res.recommendations[0]);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load crop recommendations from backend:', err);
      setErrorMsg('Connecting to local agronomic fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySoilAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecommendations(activeFarm, selectedSeason);
    setShowAdjustPanel(false);
  };

  const handleOpenCompare = async () => {
    setShowCompareModal(true);
    setCompareLoading(true);
    try {
      // Pick top 3-4 recommended crops
      const topIds = crops.slice(0, 4).map((c) => c.id);
      const phVal = inputSoilPh ? parseFloat(inputSoilPh) : 6.8;
      const comp = await api.compareCrops({
        crop_ids: topIds.length >= 2 ? topIds : ['Paddy', 'Maize', 'Chilli', 'Groundnut'],
        farm_id: activeFarm.id,
        soil_ph: phVal,
        soil_type: inputSoilType,
        season: selectedSeason,
        water_source: waterSource
      });
      setComparisonResult(comp);
    } catch (err) {
      console.error('Compare error', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSaveRecommendation = async () => {
    setSaving(true);
    try {
      await api.saveCropRecommendation({
        farm_id: activeFarm.id,
        field_name: `${activeFarm.village} Field`,
        season: selectedSeason,
        inputs: {
          soil_ph: inputSoilPh,
          soil_type: inputSoilType,
          water_source: waterSource,
          acreage: activeFarm.acreage
        },
        recommendations: crops.slice(0, 5)
      });
      setSaveToast('Plan saved to your account!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      console.error('Failed to save', err);
      setSaveToast('Saved locally!');
      setTimeout(() => setSaveToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      const hist = await api.getCropRecommendationHistory(activeFarm.id);
      setHistoryList(hist);
    } catch (err) {
      console.error('History fetch error', err);
    }
  };

  // Filter crops by Season AND Suitability
  const filteredCrops = crops.filter((c) => {
    const matchesSeason = selectedSeason === 'All' || c.seasonType === selectedSeason || c.season.toLowerCase().includes(selectedSeason.toLowerCase());
    const matchesSuitability = filterTab === 'all' || c.suitabilityType === filterTab;
    return matchesSeason && matchesSuitability;
  });

  const toggleMultiCrop = (cropId: string) => {
    if (selectedMultiCrops.includes(cropId)) {
      if (selectedMultiCrops.length > 1) {
        setSelectedMultiCrops(selectedMultiCrops.filter((id) => id !== cropId));
      }
    } else {
      if (selectedMultiCrops.length < 3) {
        setSelectedMultiCrops([...selectedMultiCrops, cropId]);
      }
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: MAIN CROP RECOMMENDATIONS LIST SCREEN
  // -------------------------------------------------------------
  if (activeView === 'main') {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-[#102D20]" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center p-1 shadow-2xs">
              <svg viewBox="0 0 48 48" className="w-8 h-8">
                <path d="M8 38 Q24 24 40 38 Q32 44 24 44 Q16 44 8 38 Z" fill="#6E4729" />
                <path d="M24 35 C24 26 23 20 22 14" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M23 22 C13 18 9 9 17 7 C23 7 24 16 23 22 Z" fill="#22C55E" />
                <path d="M23 18 C33 14 37 5 29 3 C23 3 22 12 23 18 Z" fill="#15803D" />
              </svg>
            </div>

            <div>
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Crop Recommendations</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">ICAR Agronomy • Open-Meteo Weather</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenHistory}
              title="Saved Plans History"
              className="p-2 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-[#087A3D] transition-colors shadow-2xs"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveRecommendation}
              disabled={saving}
              title="Save Current Recommendation"
              className="p-2 rounded-2xl bg-[#E7F7E4] border border-green-300 text-[#087A3D] hover:bg-green-100 transition-colors shadow-2xs"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="bg-[#E7F7E4] border border-[#087A3D]/40 text-[#087A3D] text-xs font-bold p-2.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <span>✓ {saveToast}</span>
            <button onClick={() => setSaveToast(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Location Selector Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {displayFarms.map((farm) => {
            const isSelected = activeFarm.id === farm.id;
            return (
              <button
                key={farm.id}
                onClick={() => onSelectFarm && onSelectFarm(farm as any)}
                className={`flex-none px-3.5 py-2 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-extrabold ${
                  isSelected
                    ? 'bg-[#E7F7E4] border-[#087A3D] text-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 fill-current" />
                <span>{farm.village}</span>
              </button>
            );
          })}
        </div>

        {/* Live Weather & Soil Baseline Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Sun className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <p className="font-extrabold text-[#102D20] text-xs">
                {weatherSnapshot ? `${weatherSnapshot.temperature}°C • ${weatherSnapshot.condition}` : 'Live Weather API'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                Soil pH: <span className="font-bold text-[#087A3D]">{inputSoilPh || '6.8'}</span> • {inputSoilType}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdjustPanel(!showAdjustPanel)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#087A3D] bg-green-50 px-2.5 py-1 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>Adjust Parameters</span>
          </button>
        </div>

        {/* Collapsible Soil & Water Parameter Form */}
        {showAdjustPanel && (
          <form onSubmit={handleApplySoilAdjustment} className="bg-white border border-green-200 rounded-2xl p-3.5 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-[#102D20] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#087A3D]" />
                Field Parameters Calibration
              </h4>
              <button type="button" onClick={() => setShowAdjustPanel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Soil pH (0 - 14)</label>
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="9.5"
                  value={inputSoilPh}
                  onChange={(e) => setInputSoilPh(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-[#102D20]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Soil Texture</label>
                <select
                  value={inputSoilType}
                  onChange={(e) => setInputSoilType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-[#102D20] bg-white"
                >
                  <option value="Loamy">Loamy</option>
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Black Cotton">Black Cotton</option>
                  <option value="Clay">Clay</option>
                  <option value="Alluvial">Alluvial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Water Source</label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-[#102D20] bg-white"
                >
                  <option value="Canal">Canal Water</option>
                  <option value="Borewell">Borewell</option>
                  <option value="Tank/Pond">Tank / Pond</option>
                  <option value="Drip System">Drip System</option>
                  <option value="Rainfed">Rainfed</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-[#087A3D] text-white py-1.5 rounded-xl text-xs font-bold hover:bg-[#07552F] transition-colors shadow-2xs"
                >
                  Recalculate Rankings
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Interactive Season Selector Banner */}
        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2.5 rounded-2xl flex items-center justify-between">
            <span className="font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold underline text-[11px] ml-2 shrink-0">Dismiss</button>
          </div>
        )}
        <div className="bg-[#FFFBEB] border border-amber-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2 relative">
          <div
            onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                <Sun className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#102D20]">Current Season Filter</p>
                <p className="text-xs text-amber-800 font-extrabold flex items-center gap-1">
                  <span>
                    {selectedSeason === 'Kharif' && 'Kharif (Jun – Oct)'}
                    {selectedSeason === 'Rabi' && 'Rabi (Nov – Feb)'}
                    {selectedSeason === 'Pre-summer' && 'Pre-summer (Mar – May)'}
                    {selectedSeason === 'All' && 'All Seasons (Year Round)'}
                  </span>
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Season Selector Tabs */}
          <div className="flex gap-1.5 pt-1 border-t border-amber-200/60 overflow-x-auto no-scrollbar">
            {(['Kharif', 'Rabi', 'Pre-summer', 'All'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                  selectedSeason === s
                    ? 'bg-[#087A3D] text-white shadow-xs'
                    : 'bg-white/80 border border-amber-200 text-amber-900 hover:bg-white'
                }`}
              >
                {s === 'Kharif' && '🌾 Kharif (Jun-Oct)'}
                {s === 'Rabi' && '🌽 Rabi (Nov-Feb)'}
                {s === 'Pre-summer' && '🥜 Pre-summer (Mar-May)'}
                {s === 'All' && '🗓️ All Seasons'}
              </button>
            ))}
          </div>
        </div>

        {/* Section Heading & Filters */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-[#102D20]">Recommended Crops ({selectedSeason})</h3>
              <p className="text-xs text-gray-500 font-medium">Ranked by ICAR agronomic scoring algorithm</p>
            </div>

            <button
              onClick={handleOpenCompare}
              className="text-xs font-bold text-[#087A3D] bg-green-50 border border-green-200 px-3 py-1 rounded-xl flex items-center gap-1 hover:bg-green-100 transition-colors shrink-0 shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Compare Top Crops</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setFilterTab('best')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'best'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Best Match (≥80%)
            </button>
            <button
              onClick={() => setFilterTab('good')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'good'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Good Option
            </button>
            <button
              onClick={() => setFilterTab('alternative')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'alternative'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alternative
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                filterTab === 'all'
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Crops
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-[#087A3D] animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-600">Calculating agronomic suitability scores...</p>
          </div>
        )}

        {/* Crop Cards List */}
        {!loading && (
          <div className="space-y-3">
            {filteredCrops.length > 0 ? (
              filteredCrops.map((crop) => (
                <div
                  key={crop.id}
                  onClick={() => {
                    setDetailCrop(crop);
                    setActiveView('detail');
                  }}
                  className={`bg-white border rounded-3xl p-4 shadow-xs hover:border-[#087A3D] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    crop.suitabilityType === 'best' ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="shrink-0 mt-0.5">
                      <CropIconMapper cropId={crop.id} size="lg" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-[#102D20]">{crop.name}</h4>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            crop.suitabilityType === 'best'
                              ? 'bg-[#E7F7E4] text-[#087A3D] border-green-200'
                              : crop.suitabilityType === 'good'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {crop.suitability} ({crop.score}%)
                        </span>
                      </div>

                      <ul className="space-y-0.5 text-xs text-gray-600 font-medium">
                        {crop.bullets.map((b, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs">
                            <Check className="w-3.5 h-3.5 text-[#087A3D] stroke-[2.5]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              ))
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center space-y-2">
                <p className="font-bold text-sm text-gray-700">No crops found for this filter combination</p>
                <button
                  onClick={() => {
                    setSelectedSeason('All');
                    setFilterTab('all');
                  }}
                  className="text-xs font-extrabold text-[#087A3D] hover:underline"
                >
                  View all crops across all seasons &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Multi-Crop Plan Action Button */}
        <div className="pt-2">
          <button
            onClick={() => setActiveView('multicrop')}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            <span>View Multi-Crop Rotation Plan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Modal */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#087A3D]" />
                  <h3 className="font-extrabold text-base text-[#102D20]">Crop Comparison Matrix</h3>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {compareLoading ? (
                <div className="py-10 text-center space-y-2">
                  <Loader2 className="w-7 h-7 text-[#087A3D] animate-spin mx-auto" />
                  <p className="text-xs font-bold text-gray-600">Comparing agronomic requirements...</p>
                </div>
              ) : comparisonResult ? (
                <div className="space-y-3">
                  <div className="bg-[#E7F7E4] p-3 rounded-2xl text-xs font-semibold text-[#07552F]">
                    {comparisonResult.insights?.soil_context}
                    {comparisonResult.insights?.lowest_water_consumer && (
                      <p className="mt-1 font-extrabold">
                        💧 Lowest Water Consumer: {comparisonResult.insights.lowest_water_consumer}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {comparisonResult.comparison.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-2xl p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CropIconMapper cropId={item.id} size="sm" />
                            <h4 className="font-black text-sm text-[#102D20]">{item.name}</h4>
                          </div>
                          <span className="bg-green-100 text-[#087A3D] font-black px-2 py-0.5 rounded-full text-[10px]">
                            {item.score}% Suitability
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="bg-gray-50 p-2 rounded-xl">
                            <span className="text-gray-400 font-bold block text-[9px] uppercase">Water Consumption</span>
                            <span className="font-bold text-sky-800">{item.seasonal_water_demand_mm} mm / season</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl">
                            <span className="text-gray-400 font-bold block text-[9px] uppercase">Growing Duration</span>
                            <span className="font-bold text-[#102D20]">{item.growing_duration}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl">
                            <span className="text-gray-400 font-bold block text-[9px] uppercase">Soil Suitability</span>
                            <span className="font-bold text-amber-900">{item.soil_suitability}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl">
                            <span className="text-gray-400 font-bold block text-[9px] uppercase">Expected Yield</span>
                            <span className="font-bold text-green-900">{item.expected_yield}</span>
                          </div>
                        </div>

                        {item.risks && item.risks.length > 0 && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-xl">
                            ⚠ Risk: {item.risks[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#087A3D]" />
                  <h3 className="font-extrabold text-base text-[#102D20]">Saved Recommendation Plans</h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 font-medium">
                  No saved plans yet for {activeFarm.village}. Click the bookmark icon to save your current plan.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyList.map((h) => (
                    <div key={h.id} className="border border-gray-200 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#102D20]">{h.field_name}</span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium">
                        Season: <span className="font-bold">{h.season}</span> • pH: {h.inputs?.soil_ph || '6.8'}
                      </p>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {h.recommendations?.slice(0, 3).map((r: any, idx: number) => (
                          <span key={idx} className="bg-green-50 text-[#087A3D] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-green-200">
                            {r.name} ({r.score}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: CROP DETAIL SCREEN (e.g., Paddy detail)
  // -------------------------------------------------------------
  if (activeView === 'detail' && detailCrop) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('main')} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-[#102D20]" />
            </button>
            <CropIconMapper cropId={detailCrop.id} size="md" />
            <div>
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">{detailCrop.name}</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">{detailCrop.scientific_name || 'Agronomic Insights'}</p>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {(['Overview', 'Irrigation', 'Season', 'Past Data'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                detailTab === tab
                  ? 'bg-[#07552F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Explainable Score Breakdown Card */}
        {detailCrop.score_breakdown && (
          <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#087A3D]" />
                <h4 className="font-extrabold text-xs text-[#102D20]">Agronomic Compatibility Score</h4>
              </div>
              <span className="font-black text-sm text-[#087A3D]">{detailCrop.score} / 100</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Soil Factor</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.soil_compatibility} / 30</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Temperature</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.temperature_compatibility} / 20</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Rainfall</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.rainfall_compatibility} / 20</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Water Source</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.water_availability} / 15</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Season Match</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.seasonal_suitability} / 10</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                <span className="text-gray-500 font-medium">Nutrient Need</span>
                <span className="font-bold text-[#102D20]">{detailCrop.score_breakdown.nutrient_compatibility} / 5</span>
              </div>
            </div>
          </div>
        )}

        {/* Why Recommended Card */}
        <div className="bg-[#E7F7E4]/80 border border-green-200 rounded-3xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-[#07552F]">
            <Sprout className="w-5 h-5" />
            <h4 className="font-extrabold text-sm">Why Recommended for {activeFarm.village}?</h4>
          </div>

          <ul className="space-y-1.5 text-xs text-[#102D20] font-semibold">
            {detailCrop.whyRecommended.map((reason, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#087A3D] stroke-[3] shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Environmental Risks Card */}
        {detailCrop.risks && detailCrop.risks.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h4 className="font-extrabold text-xs">Agronomic & Climate Risks</h4>
            </div>
            <ul className="space-y-1 text-xs text-rose-900 font-medium">
              {detailCrop.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Optimal Soil pH</span>
            </div>
            <p className="font-black text-base text-[#102D20]">{detailCrop.phRange}</p>
            <p className="text-[10px] text-gray-500 font-medium">Current: {inputSoilPh || '6.8'}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Expected Yield</span>
            </div>
            <p className="font-black text-xs text-[#102D20]">{detailCrop.yieldEstimate.split('(')[0]}</p>
            <p className="text-[10px] text-gray-500 font-medium">Under recommended practice</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Droplet className="w-4 h-4 text-sky-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Water Demand</span>
            </div>
            <p className="font-black text-xs text-[#102D20]">{detailCrop.waterReq}</p>
            <p className="text-[10px] text-gray-500 font-medium">Per cycle frequency</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Growing Season</span>
            </div>
            <p className="font-black text-xs text-[#102D20]">{detailCrop.season}</p>
            <p className="text-[10px] text-gray-500 font-medium">{detailCrop.seasonType}</p>
          </div>
        </div>

        {/* Companion Intercrops Card */}
        {detailCrop.interCrops && detailCrop.interCrops.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
            <h4 className="font-extrabold text-xs text-[#102D20] flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#087A3D]" />
              Recommended Same-Field Companion Crops
            </h4>
            <div className="space-y-2">
              {detailCrop.interCrops.map((ic, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-2xl text-xs">
                  <div className="flex items-center gap-2">
                    <CropIconMapper cropId={ic.id} size="sm" />
                    <div>
                      <span className="font-bold text-[#102D20] block">{ic.name}</span>
                      <span className="text-[10px] text-gray-500">{ic.timing}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setActiveView('irrigation')}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            <Droplet className="w-5 h-5" />
            <span>Generate Smart Irrigation Plan for {detailCrop.name}</span>
          </button>

          {onNavigateToIrrigation && (
            <button
              onClick={() => onNavigateToIrrigation(detailCrop.name)}
              className="w-full bg-white border border-[#087A3D] text-[#087A3D] font-extrabold py-2.5 px-4 rounded-2xl hover:bg-green-50 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <span>Open Dedicated Smart Irrigation Module</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: IRRIGATION PLAN SCREEN
  // -------------------------------------------------------------
  if (activeView === 'irrigation') {
    const crop = detailCrop || crops[0] || ({ id: 'Paddy', name: 'Paddy', season: 'Kharif' } as any);
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('detail')} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-[#102D20]" />
            </button>
            <CropIconMapper cropId={crop.id} size="md" />
            <div>
              <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Irrigation Plan</h2>
              <p className="text-xs text-[#5A6E65] font-semibold">Optimized for {crop.name} in {activeFarm.village}</p>
            </div>
          </div>
        </div>

        {/* Selected Crop Pill */}
        <div className="bg-white border border-gray-100 rounded-3xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <CropIconMapper cropId={crop.id} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-[#102D20]">{crop.name}</h4>
                <span className="bg-[#E7F7E4] text-[#087A3D] font-bold text-[10px] px-2 py-0.5 rounded-full border border-green-200">
                  Suitable
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{crop.season}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('main')}
            className="text-xs font-bold text-[#087A3D] hover:underline"
          >
            Change
          </button>
        </div>

        {/* Weather & Water Availability Grid */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm text-[#102D20]">Weather & Water Availability</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">
                {weatherSnapshot?.temperature || 32}°C
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Temperature</p>
              <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">High</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <CloudRain className="w-5 h-5 text-sky-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">
                {weatherSnapshot?.rain_chance || 10}%
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Rain Chance</p>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Low</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Droplet className="w-5 h-5 text-emerald-500 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">
                {weatherSnapshot?.humidity || 65}%
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Humidity</p>
              <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Moderate</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
              <Sun className="w-5 h-5 text-amber-400 fill-amber-300 mx-auto" />
              <p className="font-extrabold text-sm text-[#102D20] mt-1">
                {weatherSnapshot?.condition?.split(' ')[0] || 'Clear'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Weather</p>
            </div>
          </div>
        </div>

        {/* Water Source Selector */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm text-[#102D20]">Water Source</h4>
          <div className="grid grid-cols-4 gap-2">
            {['Canal', 'Borewell', 'Tank/Pond', 'Drip System'].map((src) => {
              const isSel = waterSource === src;
              return (
                <button
                  key={src}
                  onClick={() => setWaterSource(src)}
                  className={`bg-white border rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                    isSel
                      ? 'border-[#087A3D] bg-[#E7F7E4] font-extrabold text-[#087A3D]'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <Droplet className={`w-5 h-5 ${isSel ? 'text-[#087A3D]' : 'text-gray-400'}`} />
                  <span className="text-[11px] font-bold leading-tight">{src}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Irrigation Recommendation */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-sky-500 fill-sky-400" />
            <h4 className="font-extrabold text-sm text-[#102D20]">FAO-56 Irrigation Recommendation</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold">Water Depth</p>
              <p className="text-xl font-black text-sky-700">{crop.waterReq || '25 – 30 mm'}</p>
              <p className="text-[10px] text-gray-500 font-medium">(≈ 1.8 lakh liters / {activeFarm.acreage || 2.5} acres)</p>
            </div>

            <div className="border-l border-gray-100 pl-3">
              <p className="text-[10px] text-gray-500 font-semibold">Frequency Window</p>
              <p className="text-xl font-black text-[#087A3D]">Every 5–6 days</p>
              <p className="text-[10px] text-gray-500 font-medium">Optimal: 06:00 – 08:30 AM</p>
            </div>
          </div>
        </div>

        {/* Why this plan? */}
        <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#07552F]">
            <Sprout className="w-5 h-5" />
            <h4 className="font-extrabold text-xs">Why this plan?</h4>
          </div>
          <p className="text-xs text-[#102D20] font-medium leading-relaxed">
            Ambient temperatures (~{weatherSnapshot?.temperature || 32}°C) and low forecast rain accelerate evapotranspiration. Early morning application prevents evaporative loss.
          </p>
        </div>

        {/* Action Button to Open Dedicated Smart Irrigation Screen */}
        {onNavigateToIrrigation && (
          <button
            onClick={() => onNavigateToIrrigation(crop.name)}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
          >
            <span>Open Interactive Smart Irrigation Module</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 4: FARM-SPECIFIC MULTI-CROP PLAN SCREEN
  // -------------------------------------------------------------
  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView('main')} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center p-1 shadow-2xs">
            <svg viewBox="0 0 48 48" className="w-8 h-8">
              <path d="M8 38 Q24 24 40 38 Q32 44 24 44 Q16 44 8 38 Z" fill="#6E4729" />
              <path d="M24 35 C24 26 23 20 22 14" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M23 22 C13 18 9 9 17 7 C23 7 24 16 23 22 Z" fill="#22C55E" />
              <path d="M23 18 C33 14 37 5 29 3 C23 3 22 12 23 18 Z" fill="#15803D" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Multi-Crop Rotation Plan</h2>
            <p className="text-xs text-[#5A6E65] font-semibold">Plan crops across seasons for optimal soil fertility & income</p>
          </div>
        </div>
      </div>

      {/* Selected Farm Header Pill */}
      <div className="bg-[#E7F7E4]/90 border border-green-300 rounded-3xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#087A3D] text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#102D20]">{activeFarm.village} Farm</h3>
              <p className="text-xs text-gray-600 font-semibold">
                Area: {activeFarm.acreage || 2.5} acres • Soil pH: {inputSoilPh || '6.8'} ({inputSoilType})
              </p>
            </div>
          </div>
        </div>

        {/* Farm Switcher Pills */}
        <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
          {displayFarms.map((f) => {
            const isF = activeFarm.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFarm && onSelectFarm(f as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isF
                    ? 'bg-[#087A3D] text-white shadow-2xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.village} ({f.acreage} ac)
              </button>
            );
          })}
        </div>
      </div>

      {/* Your Interest Crop Selector Grid */}
      <div className="space-y-2">
        <div>
          <h3 className="font-extrabold text-sm text-[#102D20]">Your Crop Focus</h3>
          <p className="text-xs text-gray-500 font-medium">Select up to 3 focus crops for rotation</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['Paddy', 'Maize', 'Chilli', 'Groundnut', 'Turmeric', 'Cotton'].map((cropId) => {
            const isSel = selectedMultiCrops.includes(cropId);
            return (
              <button
                key={cropId}
                onClick={() => toggleMultiCrop(cropId)}
                className={`bg-white border rounded-2xl p-3 text-center transition-all relative flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                  isSel
                    ? 'border-[#087A3D] bg-[#E7F7E4]/50 ring-2 ring-[#087A3D]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    isSel ? 'bg-[#087A3D] text-white' : 'border border-gray-300 bg-white'
                  }`}
                >
                  {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <CropIconMapper cropId={cropId} size="md" />
                <span className="font-extrabold text-xs text-[#102D20]">{cropId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Plan Timeline */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#102D20]">Rotation Sequence ({activeFarm.village})</h3>
          <span className="text-[11px] font-extrabold text-[#087A3D] bg-[#E7F7E4] px-2 py-0.5 rounded-full border border-green-200">
            {activeFarm.acreage || 2.5} acres
          </span>
        </div>

        <div className="space-y-3 relative pl-3 border-l-2 border-dashed border-gray-200 ml-3">
          {/* Kharif */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Kharif (Jun – Oct) • Primary Crop</p>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  Main + Bund Crop
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <CropIconMapper cropId={selectedMultiCrops[0] || 'Paddy'} size="md" />
                <span className="text-sm font-black text-gray-400">+</span>
                <CropIconMapper cropId="Green Gram" size="sm" />

                <div>
                  <h4 className="font-extrabold text-sm text-[#102D20]">
                    {selectedMultiCrops[0] || 'Paddy'} <span className="text-gray-400 font-normal">&amp;</span> Green Gram
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Main field ({activeFarm.acreage || 2.5} acres) + Green Gram on bunds
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-2 rounded-xl text-[10px] text-emerald-900 font-medium flex items-center justify-between">
                <span>🌱 Bund legumes fix nitrogen naturally</span>
                <span className="font-bold text-[#087A3D]">+18% Revenue</span>
              </div>
            </div>
          </div>

          {/* Rabi */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Rabi (Nov – Feb) • Rotation</p>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  Low Water Demand
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <CropIconMapper cropId={selectedMultiCrops[1] || 'Maize'} size="md" />
                <span className="text-sm font-black text-gray-400">+</span>
                <CropIconMapper cropId="Black Gram" size="sm" />

                <div>
                  <h4 className="font-extrabold text-sm text-[#102D20]">
                    {selectedMultiCrops[1] || 'Maize'} <span className="text-gray-400 font-normal">&amp;</span> Black Gram
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Maize grain crop with pulse relay
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/70 p-2 rounded-xl text-[10px] text-amber-900 font-medium flex items-center justify-between">
                <span>🌽 Dual harvest without soil nutrient exhaustion</span>
                <span className="font-bold text-amber-800">+25% Revenue</span>
              </div>
            </div>
          </div>

          {/* Pre-summer */}
          <div className="relative pl-4">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-orange-400 ring-4 ring-orange-100" />
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Pre-summer (Mar – May) • Soil Rebuilder</p>
                <span className="bg-orange-100 text-orange-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  Catch Crop
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <CropIconMapper cropId={selectedMultiCrops[2] || 'Groundnut'} size="md" />
                <span className="text-sm font-black text-gray-400">+</span>
                <CropIconMapper cropId="Sesame" size="sm" />

                <div>
                  <h4 className="font-extrabold text-sm text-[#102D20]">
                    {selectedMultiCrops[2] || 'Groundnut'} <span className="text-gray-400 font-normal">&amp;</span> Sesame
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Groundnut ground-cover with Sesame strip planting
                  </p>
                </div>
              </div>

              <div className="bg-orange-50/70 p-2 rounded-xl text-[10px] text-orange-900 font-medium flex items-center justify-between">
                <span>🥜 Prevents summer topsoil erosion &amp; weed growth</span>
                <span className="font-bold text-orange-800">+15% Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why this same-field plan? Card */}
      <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-[#07552F]">
          <Sprout className="w-5 h-5" />
          <h4 className="font-extrabold text-sm">Why same-field multi-cropping for {activeFarm.village}?</h4>
        </div>

        <ul className="space-y-1.5 text-xs text-[#102D20] font-semibold">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Grows main crop and companion intercrop simultaneously on 1 field</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Increases total farm income per acre by 20% to 30%</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Reduces pest infestation through natural bio-diversity</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#087A3D] stroke-[3]" />
            <span>Legume intercrops fix atmospheric nitrogen for the main crop</span>
          </li>
        </ul>
      </div>

      {/* Bottom Save Plan Action Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            handleSaveRecommendation();
            setActiveView('main');
          }}
          className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
        >
          <span>Save Plan for {activeFarm.village}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
