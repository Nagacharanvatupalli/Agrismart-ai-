import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Droplet,
  Check,
  ChevronRight,
  Sprout,
  Sun,
  CloudRain,
  Thermometer,
  Calendar,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Sparkles,
  FlaskConical,
  Info,
  CheckCircle2,
  Clock,
  BarChart2,
  Sliders,
  History,
  Plus,
  Radio,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, IrrigationPlanResponse, IrrigationHistoryResponse } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface IrrigationScreenProps {
  farms?: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
}

export const IrrigationScreen: React.FC<IrrigationScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onBack,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy');
  const [growthStage, setGrowthStage] = useState<string>('Vegetative Stage');
  const [waterSource, setWaterSource] = useState<string>('Canal');
  const [irrigationMethod, setIrrigationMethod] = useState<string>('Drip System');
  const [pumpFlowRate, setPumpFlowRate] = useState<number>(30); // 30 m3/hr default (5 HP pump)
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [planData, setPlanData] = useState<IrrigationPlanResponse | null>(null);

  // 7-day forecast state
  const [forecastOutlook, setForecastOutlook] = useState<any[]>([]);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // History & Record Event state
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<IrrigationHistoryResponse | null>(null);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordDepthMm, setRecordDepthMm] = useState<string>('25');
  const [recordDurationHours, setRecordDurationHours] = useState<string>('2.5');
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [recordSuccessToast, setRecordSuccessToast] = useState<string | null>(null);

  // Sensor state
  const [sensorStatus, setSensorStatus] = useState<any>(null);
  const [showSensorModal, setShowSensorModal] = useState<boolean>(false);
  const [manualMoistureInput, setManualMoistureInput] = useState<string>('28');

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5, state: 'Andhra Pradesh', soil_type: 'Clay Loam' },
    { id: 2, village: 'Tanuku', acreage: 1.8, state: 'Andhra Pradesh', soil_type: 'Loamy' },
    { id: 3, village: 'Narsapuram', acreage: 3.2, state: 'Andhra Pradesh', soil_type: 'Sandy Loam' },
    { id: 4, village: 'Eluru', acreage: 1.0, state: 'Andhra Pradesh', soil_type: 'Clay' }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];

  const crops = [
    { id: 'Paddy', name: 'Paddy' },
    { id: 'Maize', name: 'Maize' },
    { id: 'Groundnut', name: 'Groundnut' },
    { id: 'Chilli', name: 'Chilli' },
    { id: 'Cotton', name: 'Cotton' },
    { id: 'Turmeric', name: 'Turmeric' },
    { id: 'Sugarcane', name: 'Sugarcane' },
    { id: 'Tomato', name: 'Tomato' },
    { id: 'Onion', name: 'Onion' },
    { id: 'Pulses', name: 'Pulses' }
  ];

  const waterSources = [
    { id: 'Canal', name: 'Canal' },
    { id: 'Borewell', name: 'Borewell' },
    { id: 'Tank/Pond', name: 'Tank/Pond' },
    { id: 'Drip System', name: 'Drip System' }
  ];

  const growthStages = [
    'Initial / Emergence',
    'Vegetative Stage',
    'Flowering / Reproduction',
    'Maturation / Harvesting'
  ];

  const irrigationMethods = [
    { id: 'Drip System', label: 'Drip (85-90% eff)' },
    { id: 'Sprinkler', label: 'Sprinkler (70-75% eff)' },
    { id: 'Canal / Basin', label: 'Surface Basin (55-60% eff)' }
  ];

  useEffect(() => {
    if (activeFarm) {
      loadSensorStatus();
    }
  }, [activeFarm?.id]);

  const loadSensorStatus = async () => {
    try {
      const res = await api.getSensorStatus(activeFarm.id || 1);
      setSensorStatus(res);
    } catch {
      setSensorStatus({
        connected: false,
        message: 'Sensor not connected — recommendations are based on FAO-56 weather and soil-water estimates.'
      });
    }
  };

  useEffect(() => {
    if (showResults && activeFarm) {
      handleGetPlan();
    }
  }, [currentLang]);

  const handleGetPlan = async () => {
    setLoading(true);
    try {
      const data = await api.getIrrigationPlan(
        activeFarm.id || 1,
        selectedCrop,
        waterSource,
        growthStage,
        {
          area: activeFarm.acreage || 2.5,
          soil_type: activeFarm.soil_type || 'Loamy',
          irrigation_method: irrigationMethod,
          pump_flow_rate_m3_hr: pumpFlowRate
        },
        currentLang
      );
      setPlanData(data);
      setShowResults(true);

      // Also trigger 7-day forecast
      loadForecast(activeFarm.id || 1, selectedCrop, growthStage);
    } catch (err) {
      console.error("Irrigation plan error", err);
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async (farmId: number, crop: string, stage: string) => {
    setLoadingForecast(true);
    try {
      const data = await api.getIrrigationForecast(farmId, crop, stage);
      setForecastOutlook(data.daily_outlook || []);
    } catch (err) {
      console.error("Forecast error", err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      const hist = await api.getIrrigationHistory(activeFarm.id || 1);
      setHistoryData(hist);
    } catch (err) {
      console.error("History error", err);
    }
  };

  const handleRecordEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depth = parseFloat(recordDepthMm) || 25.0;
    const areaHa = (activeFarm.acreage || 2.5) * 0.404686;
    const volM3 = roundTo1(depth * areaHa * 10.0);

    try {
      await api.recordIrrigationEvent({
        farm_id: activeFarm.id || 1,
        crop_name: selectedCrop,
        event_date: recordDate,
        water_applied_mm: depth,
        water_volume_m3: volM3,
        duration_hours: parseFloat(recordDurationHours) || 2.0,
        irrigation_method: irrigationMethod,
        notes: recordNotes
      });
      setShowRecordModal(false);
      setRecordSuccessToast('Irrigation event recorded in database!');
      setTimeout(() => setRecordSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to log event', err);
    }
  };

  const handleManualSensorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualMoistureInput);
    if (isNaN(val) || val <= 0) return;
    try {
      await api.logSensorReading(activeFarm.id || 1, val, 'MANUAL-ENTRY');
      setShowSensorModal(false);
      loadSensorStatus();
      setRecordSuccessToast(`Recorded soil moisture ${val}% VWC!`);
      setTimeout(() => setRecordSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to log sensor', err);
    }
  };

  const roundTo1 = (n: number) => Math.round(n * 10) / 10;

  // ─── Fertilizer recommendation logic based on rainfall ───────────────────────
  const getFertilizerPlan = (rainfallMm: number, _crop: string) => {
    if (rainfallMm >= 20) {
      return {
        scenario: 'heavy-rain',
        label: 'Recent Heavy Rain (≥ 20 mm)',
        scenarioColor: 'sky',
        icon: '🌧️',
        headline: 'Post-Rain Fertilizer Plan',
        summary:
          'Heavy rain washes away surface nitrogen (leaching). Delay top-dressing by 2–3 days until soil drains, then apply split doses to maximise absorption.',
        products: [
          {
            name: 'Urea (46% N)',
            dose: '25–30 kg / acre',
            timing: '3 days after rain stops',
            method: 'Broadcast + light incorporation',
            reason:
              'Nitrogen is highly mobile in saturated soil. A 3-day delay prevents immediate leaching and ensures roots can uptake the nutrient before the next irrigation cycle.',
            caution: 'Do NOT apply during active rainfall — up to 70% is lost via runoff.',
            cautionType: 'danger',
          },
          {
            name: 'MOP / Muriate of Potash (60% K₂O)',
            dose: '10–12 kg / acre',
            timing: 'Immediately after waterlogging recedes',
            method: 'Band placement near root zone',
            reason:
              'Potassium strengthens cell walls and improves disease resistance, which is critical after high-humidity rain events that promote fungal spread.',
            caution: 'Avoid on waterlogged fields — potassium uptake is blocked by anaerobic root conditions.',
            cautionType: 'warning',
          },
          {
            name: 'DAP (18-46-0)',
            dose: '5–8 kg / acre (supplement only)',
            timing: '5 days after rain',
            method: 'Spot application near crown roots',
            reason:
              'Phosphorus moves slowly in soil. Rain improves P solubility slightly, but an additional supplement ensures vegetative growth is not stalled by phosphorus deficiency.',
            caution: null,
            cautionType: null,
          },
        ],
        avoidList: [
          'Ammonium Sulphate — acidifies already-leached soil further',
          'Foliar sprays during wet/cloudy weather — poor absorption',
          'Zinc Sulphate alone — mix with lime before applying on wet soil',
        ],
      };
    } else if (rainfallMm >= 5) {
      return {
        scenario: 'moderate-rain',
        label: 'Moderate Recent Rain (5–19 mm)',
        scenarioColor: 'teal',
        icon: '🌦️',
        headline: 'Light Top-Dressing Plan',
        summary:
          'Moderate rain improves soil moisture, making it an ideal window for light top-dressing. Nutrients dissolve quickly and reach root zones efficiently.',
        products: [
          {
            name: 'Urea (46% N)',
            dose: '20–25 kg / acre',
            timing: '1 day after rain — while soil is moist',
            method: 'Broadcast into moist topsoil',
            reason:
              'Moist soil dissolves urea rapidly, creating a nitrogen-rich solution that moves into the active root zone within 24–48 hours — maximising vegetative push.',
            caution: 'Apply in the early morning; high afternoon heat volatilises ammonia from urea.',
            cautionType: 'warning',
          },
          {
            name: 'NPK 20-20-0',
            dose: '15–20 kg / acre',
            timing: 'Within 24 hours of light rain',
            method: 'Broadcast or drip fertigation',
            reason:
              'The balanced N and P ratio supports both vegetative growth (N) and root strengthening (P) simultaneously. Moist soil improves P mobility which is otherwise very slow.',
            caution: null,
            cautionType: null,
          },
          {
            name: 'Ferrous Sulphate (FeSO₄)',
            dose: '5 kg / acre',
            timing: 'Mix with soil before broadcasting',
            method: 'Soil application',
            reason:
              'Moderate rain slightly raises soil pH in sandy soils, risking iron deficiency (chlorosis). Ferrous sulphate corrects this and maintains leaf greenness.',
            caution: 'Do not mix with phosphate fertilizers — forms insoluble iron phosphate precipitate.',
            cautionType: 'warning',
          },
        ],
        avoidList: [
          'Heavy single-dose Urea — causes vegetative surge without root balance',
          'Superphosphate without incorporation — rain binds P to top 1 cm surface',
        ],
      };
    } else {
      return {
        scenario: 'dry',
        label: 'Dry Spell / No Rain (< 5 mm)',
        scenarioColor: 'amber',
        icon: '☀️',
        headline: 'Irrigation-Linked Fertilizer Plan',
        summary:
          'In dry conditions, dry fertilizers cannot be absorbed and may scorch root hairs. Apply strictly with or immediately before scheduled irrigation.',
        products: [
          {
            name: 'Water-Soluble NPK 19-19-19',
            dose: '3–5 kg / acre via drip or spray',
            timing: 'With scheduled irrigation',
            method: 'Fertigation / drip delivery',
            reason:
              'Delivering nutrients directly dissolved in irrigation water bypasses dry topsoil and places ions directly at active root uptake sites without salt scorch.',
            caution: 'Never apply solid granular fertilizer onto dry soil without watering within 2 hours.',
            cautionType: 'danger',
          },
          {
            name: 'Urea (split micro-dose)',
            dose: '15–18 kg / acre',
            timing: 'Immediately before water release',
            method: 'Furrow side-band placement',
            reason:
              'Applying a smaller split dose just ahead of the irrigation wave ensures urea is pulled down into the root zone without volatilising in dry 32°C air.',
            caution: 'Do not broadcast in direct midday sun — up to 35% ammonia loss in dry heat.',
            cautionType: 'warning',
          },
          {
            name: 'Zinc Sulphate (ZnSO₄ 21%)',
            dose: '5–10 kg / acre',
            timing: 'Basal / alternate irrigation cycle',
            method: 'Soil band application',
            reason:
              'Zinc uptake drops sharply in dry warm soil. A maintenance dose prevents "Khaira" disease (bronzing) in cereals and keeps photosynthetic rate high.',
            caution: 'Keep separate from DAP by at least 3 days.',
            cautionType: 'warning',
          },
        ],
        avoidList: [
          'Broadcasting dry Urea on parched soil — severe ammonia gas loss',
          'Calcium Nitrate mixed with Sulphate fertilizers — causes insoluble gypsum clogging',
          'High-concentration foliar sprays during mid-day heat (> 32°C) — burns leaves',
        ],
      };
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-[#102D20] leading-tight">Smart Irrigation</h2>
            <p className="text-xs text-[#5A6E65] font-semibold">FAO-56 Water Balance • Open-Meteo Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenHistory}
            title="View Irrigation History"
            className="p-2 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-[#087A3D] transition-colors shadow-2xs"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRecordModal(true)}
            title="Log Irrigation Event"
            className="p-2 rounded-2xl bg-emerald-50 border border-green-300 text-[#087A3D] hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {recordSuccessToast && (
        <div className="bg-[#E7F7E4] border border-[#087A3D]/40 text-[#087A3D] text-xs font-bold p-2.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <span>✓ {recordSuccessToast}</span>
          <button onClick={() => setRecordSuccessToast(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Farm Selector Row */}
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

      {/* Sensor Status Card (Honest disclosure or active reading) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${sensorStatus?.connected ? 'bg-emerald-100 text-[#087A3D]' : 'bg-amber-100 text-amber-700'}`}>
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#102D20] text-xs">Soil Moisture Interface</span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${sensorStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                {sensorStatus?.connected ? 'Active Sensor' : 'Model Estimate'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium line-clamp-1">
              {sensorStatus?.message || 'Loading sensor status...'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSensorModal(true)}
          className="text-[10px] font-bold text-[#087A3D] bg-green-50 px-2 py-1 rounded-xl border border-green-200 hover:bg-green-100 shrink-0"
        >
          {sensorStatus?.connected ? 'Log Reading' : 'Log Manual VWC'}
        </button>
      </div>

      {!showResults ? (
        /* CONFIGURATION VIEW */
        <div className="space-y-4">
          {/* Crop Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#087A3D]" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Select Target Crop</h3>
            </div>
            <p className="text-xs text-gray-500">Choose the active crop to calculate evapotranspiration demand</p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {crops.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`bg-white border rounded-2xl p-3 text-center transition-all relative flex flex-col items-center justify-center gap-2 shadow-2xs h-24 ${
                      isSelected
                        ? 'border-[#087A3D] bg-[#E7F7E4]/40 ring-2 ring-[#087A3D]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#087A3D] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <CropIconMapper cropId={crop.id} />
                    <span className="font-extrabold text-xs text-[#102D20]">{crop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Growth Stage Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Crop Growth Stage (FAO Kc)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {growthStages.map((stg) => (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setGrowthStage(stg)}
                  className={`p-2.5 rounded-2xl border text-left font-bold text-xs transition-all ${
                    growthStage === stg
                      ? 'border-[#087A3D] bg-[#E7F7E4] text-[#087A3D]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* Irrigation Method Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Irrigation Method &amp; Delivery System</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {irrigationMethods.map((m) => {
                const isSel = irrigationMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIrrigationMethod(m.id)}
                    className={`p-2 rounded-2xl border text-center transition-all text-xs flex flex-col justify-center items-center gap-1 ${
                      isSel
                        ? 'border-[#087A3D] bg-[#E7F7E4] font-extrabold text-[#087A3D]'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] leading-tight">{m.label.split('(')[0]}</span>
                    <span className="text-[9px] text-gray-500">({m.label.split('(')[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Water Source & Pump Capacity */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Water Source</label>
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-[#102D20] bg-white"
              >
                {waterSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Pump Flow Rate (m³/hr)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={pumpFlowRate}
                onChange={(e) => setPumpFlowRate(parseFloat(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-[#102D20]"
                placeholder="e.g. 30 m3/hr (5 HP)"
              />
            </div>
          </div>

          <button
            onClick={handleGetPlan}
            disabled={loading}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mt-4 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Calculating FAO-56 Water Balance...</span>
              </>
            ) : (
              <>
                <span>Calculate Smart Irrigation Plan</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* RESULTS VIEW */
        <div className="space-y-4 animate-in fade-in">
          {/* Active Crop Summary Bar with Change Action */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <CropIconMapper cropId={planData?.crop || selectedCrop} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-[#102D20]">{planData?.crop || selectedCrop}</h3>
                  <span className="bg-[#E7F7E4] border border-green-300 text-[#087A3D] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    {planData?.growth_stage || growthStage} (Kc: {planData?.kc || 1.15})
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Field Area: {planData?.acreage || activeFarm.acreage || 2.5} acres • Method: {planData?.irrigation_method || irrigationMethod}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowResults(false)}
              className="text-xs font-extrabold text-[#087A3D] bg-green-50 px-2.5 py-1 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
            >
              Reconfigure
            </button>
          </div>

          {/* Live Weather Conditions Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]">
                <Sparkles className="w-4 h-4 text-[#087A3D]" />
                <span>Open-Meteo Current Conditions</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                <MapPin className="w-3 h-3 text-[#087A3D]" />
                <span>{planData?.village || activeFarm.village} • Live API</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Thermometer className="w-5 h-5 text-rose-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.weather_snapshot?.temp || 32}°C</p>
                <p className="text-[10px] text-gray-500 font-medium">Temperature</p>
                <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">High</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <CloudRain className="w-5 h-5 text-sky-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.weather_snapshot?.forecast_rain_7d || 0} mm</p>
                <p className="text-[10px] text-gray-500 font-medium">Rainfall (7d)</p>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Low</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Droplet className="w-5 h-5 text-emerald-500 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.weather_snapshot?.humidity || 65}%</p>
                <p className="text-[10px] text-gray-500 font-medium">Humidity</p>
                <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">Moderate</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-2.5 text-center shadow-2xs">
                <Sun className="w-5 h-5 text-amber-400 fill-amber-300 mx-auto" />
                <p className="font-extrabold text-sm text-[#102D20] mt-1">{planData?.fao_calculation?.daily_eto_mm || 4.8} mm</p>
                <p className="text-[10px] text-gray-500 font-medium">Daily ETo</p>
                <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block">FAO-56</span>
              </div>
            </div>
          </div>

          {/* Primary Recommendation Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500 fill-sky-400" />
                <h4 className="font-extrabold text-sm text-[#102D20]">Water Application Requirements</h4>
              </div>
              <span className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                planData?.urgency === 'high' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-green-100 text-[#087A3D] border-green-200'
              }`}>
                {planData?.urgency === 'high' ? 'Immediate Need' : 'Scheduled Cycle'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Gross Irrigation Depth</p>
                <p className="text-2xl font-black text-sky-700">
                  {planData?.gross_depth_mm || 25} mm
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Net Crop ETc: {planData?.net_depth_mm || 20} mm</p>
                <p className="text-[11px] font-bold text-[#102D20] pt-0.5">
                  {planData?.volume_label}
                </p>
              </div>

              <div className="space-y-1 border-l border-gray-100 pl-3">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Schedule Timing</p>
                <p className="text-base font-black text-[#087A3D]">
                  {planData?.next_date}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-600 font-medium pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pump Run: <strong className="text-[#102D20]">{planData?.pump_duration_label}</strong></span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium pt-0.5">
                  Flow: {planData?.pump_flow_rate_assumed}
                </p>
              </div>
            </div>

            {/* Optimal window banner */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Recommended Window: {planData?.optimal_window}
              </span>
            </div>
          </div>

          {/* Why this recommendation banner */}
          <div className="bg-[#E7F7E4]/80 border border-green-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#087A3D]" />
              <h4 className="font-extrabold text-xs text-[#07552F]">Agronomic Rationale</h4>
            </div>
            <p className="text-xs text-[#102D20] font-medium leading-relaxed">
              {planData?.why_recommendation}
            </p>
            <p className="text-[11px] text-gray-600 font-normal leading-relaxed pt-1 border-t border-green-200/60">
              {planData?.window_rationale}
            </p>
          </div>

          {/* Water-Saving Comparison Analysis Card */}
          {planData?.water_saving && (
            <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#087A3D]" />
                  <h4 className="font-extrabold text-sm text-[#102D20]">Water Conservation Analysis</h4>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {planData.water_saving.saving_percentage}% Water Saved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-gray-50 p-2.5 rounded-2xl">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Baseline Flood Practice</p>
                  <p className="text-sm font-black text-rose-800 mt-0.5">
                    {Math.round(planData.water_saving.baseline_liters / 100000)} lakh L
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">({planData.water_saving.baseline_volume_m3} m³)</p>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-2xl">
                  <p className="text-[9px] font-bold text-emerald-700 uppercase">Weather-Adjusted Need</p>
                  <p className="text-sm font-black text-[#087A3D] mt-0.5">
                    {Math.round(planData.water_saving.adjusted_liters / 100000)} lakh L
                  </p>
                  <p className="text-[10px] text-emerald-800 font-medium">({planData.water_saving.adjusted_volume_m3} m³)</p>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-medium">
                {planData.water_saving.assumptions}
              </p>
            </div>
          )}

          {/* Irrigation Method Comparison Table */}
          {planData?.method_comparison && (
            <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#087A3D]" />
                <h4 className="font-extrabold text-xs text-[#102D20]">Delivery System Efficiency Comparison</h4>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {planData.method_comparison.map((m, i) => (
                  <div key={i} className="border border-gray-100 rounded-2xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-[#102D20] block">{m.method}</span>
                      <span className="text-[10px] text-gray-500">{m.suitability}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sky-800 block text-xs">{m.efficiency_percent}% eff</span>
                      <span className="text-[10px] text-gray-400 font-medium">{m.gross_volume_m3} m³ gross</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Live Forecast Table */}
          {forecastOutlook.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#087A3D]" />
                  <h4 className="font-extrabold text-xs text-[#102D20]">7-Day Open-Meteo Irrigation Outlook</h4>
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                  {loadingForecast ? 'Updating outlook...' : 'Next 7 Days'}
                </span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {forecastOutlook.map((f, i) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#102D20] mr-2">{f.day}</span>
                      <span className="text-[10px] text-gray-400">{f.date}</span>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        ETc: {f.etc_mm} mm • Rain: {f.rain_forecast_mm} mm
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      f.irrigation_needed ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {f.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Advice List */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h4 className="font-extrabold text-sm text-[#102D20]">Field Management Guidance</h4>
            </div>

            <div className="space-y-2 text-xs font-semibold text-gray-700">
              {planData?.additional_advice?.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 text-[#087A3D] shrink-0" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── FERTILIZER RECOMMENDATIONS ─────────────────────────────── */}
          {(() => {
            const rainfall = planData?.weather_snapshot?.forecast_rain_7d ?? 0;
            const fPlan = getFertilizerPlan(rainfall, planData?.crop || selectedCrop);
            const scenarioBg =
              fPlan.scenario === 'heavy-rain'
                ? 'bg-sky-50 border-sky-200'
                : fPlan.scenario === 'moderate-rain'
                ? 'bg-teal-50 border-teal-200'
                : 'bg-amber-50 border-amber-200';
            const scenarioText =
              fPlan.scenario === 'heavy-rain'
                ? 'text-sky-800'
                : fPlan.scenario === 'moderate-rain'
                ? 'text-teal-800'
                : 'text-amber-800';
            const badgeBg =
              fPlan.scenario === 'heavy-rain'
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : fPlan.scenario === 'moderate-rain'
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-amber-100 text-amber-800 border-amber-300';

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#087A3D]" />
                  <h4 className="font-extrabold text-sm text-[#102D20]">Rainfall-Linked Fertilizer Recommendations</h4>
                </div>

                <div className={`${scenarioBg} border rounded-2xl p-3 flex items-start gap-2.5`}>
                  <span className="text-xl leading-none mt-0.5">{fPlan.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-extrabold text-xs ${scenarioText}`}>{fPlan.headline}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {fPlan.label}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium mt-1 leading-relaxed ${scenarioText}`}>
                      {fPlan.summary}
                    </p>
                  </div>
                </div>

                {fPlan.products.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#E7F7E4] flex items-center justify-center shrink-0">
                          <FlaskConical className="w-3.5 h-3.5 text-[#087A3D]" />
                        </div>
                        <span className="font-extrabold text-[12px] text-[#102D20] leading-tight">
                          {product.name}
                        </span>
                      </div>
                      <span className="bg-[#E7F7E4] text-[#07552F] font-bold text-[10px] px-2 py-0.5 rounded-full border border-green-200 shrink-0">
                        {product.dose}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Timing</p>
                        <p className="text-[11px] font-bold text-[#102D20] mt-0.5 leading-tight">
                          {product.timing}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Method</p>
                        <p className="text-[11px] font-bold text-[#102D20] mt-0.5 leading-tight">
                          {product.method}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                        <span className="font-extrabold">Why: </span>{product.reason}
                      </p>
                    </div>

                    {product.caution && (
                      <div
                        className={`flex items-start gap-2 rounded-xl p-2.5 ${
                          product.cautionType === 'danger'
                            ? 'bg-rose-50 border border-rose-200'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            product.cautionType === 'danger' ? 'text-rose-500' : 'text-amber-500'
                          }`}
                        />
                        <p
                          className={`text-[11px] font-semibold leading-relaxed ${
                            product.cautionType === 'danger' ? 'text-rose-800' : 'text-amber-800'
                          }`}
                        >
                          {product.caution}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Record Irrigation Event Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleRecordEventSubmit} className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#087A3D]" />
                <h3 className="font-extrabold text-base text-[#102D20]">Log Irrigation Event</h3>
              </div>
              <button type="button" onClick={() => setShowRecordModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Irrigation Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-[#102D20]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Water Depth Applied (mm)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="100"
                  value={recordDepthMm}
                  onChange={(e) => setRecordDepthMm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-[#102D20]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Pump Duration (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={recordDurationHours}
                  onChange={(e) => setRecordDurationHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-[#102D20]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Field Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Applied morning irrigation via drip"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium text-[#102D20]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#087A3D] text-white py-2.5 rounded-2xl text-xs font-bold hover:bg-[#07552F] transition-colors shadow-2xs"
              >
                Save Event to Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Sensor Moisture Modal */}
      {showSensorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleManualSensorSubmit} className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#087A3D]" />
                <h3 className="font-extrabold text-base text-[#102D20]">Log Soil Moisture Reading</h3>
              </div>
              <button type="button" onClick={() => setShowSensorModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[11px] text-gray-500">
                Enter your handheld soil moisture probe reading or gravimetric lab percentage:
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Volumetric Water Content (% VWC)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="60"
                  value={manualMoistureInput}
                  onChange={(e) => setManualMoistureInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-[#102D20]"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#087A3D] text-white py-2.5 rounded-2xl text-xs font-bold hover:bg-[#07552F] transition-colors shadow-2xs"
              >
                Update Moisture Level
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#087A3D]" />
                <h3 className="font-extrabold text-base text-[#102D20]">Recorded Irrigation Events</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {!historyData || historyData.recorded_events.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 font-medium">
                No recorded irrigation events yet. Click the + icon in the header to record an irrigation event.
              </div>
            ) : (
              <div className="space-y-2">
                {historyData.recorded_events.map((ev) => (
                  <div key={ev.id} className="border border-gray-100 rounded-2xl p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#102D20]">{ev.crop_name}</span>
                      <span className="text-[10px] font-bold text-[#087A3D]">{ev.event_date}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium">
                      Applied {ev.water_applied_mm} mm ({ev.water_volume_m3} m³) in {ev.duration_hours} hrs via {ev.irrigation_method}
                    </p>
                    {ev.notes && (
                      <p className="text-[10px] text-gray-400 italic">"{ev.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
