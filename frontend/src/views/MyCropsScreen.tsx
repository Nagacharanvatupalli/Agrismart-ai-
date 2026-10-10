import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Sprout,
  Plus,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Loader2,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, Crop } from '../services/api';
import { AddCropScreen } from './AddCropScreen';
import { AddFarmScreen } from './AddFarmModalOrScreen';
import { CropDetailsScreen } from './CropDetailsScreen';
import { CropAssistantScreen } from './CropAssistantScreen';

// Growth stage translation lookup
const STAGE_TRANSLATIONS: Record<string, Record<string, string>> = {
  te: {
    'seedling': 'మొలక దశ', 'nursery': 'నర్సరీ దశ', 'vegetative': 'శాకీయ దశ',
    'flowering': 'పూత దశ', 'grain filling': 'గింజు నింపు దశ', 'maturity': 'పరిపక్వత దశ',
    'harvest': 'కోత దశ', 'tillering': 'పిలకలు దశ', 'boll': 'కాయ దశ',
    'germination': 'మొలకెత్తు దశ', 'panicle': 'షామాసం దశ'
  },
  hi: {
    'seedling': 'पौध अवस्था', 'nursery': 'नर्सरी अवस्था', 'vegetative': 'वानस्पतिक अवस्था',
    'flowering': 'फूल अवस्था', 'grain filling': 'दाना भराई अवस्था', 'maturity': 'पक्वता अवस्था',
    'harvest': 'कटाई अवस्था', 'tillering': 'कंटा अवस्था', 'boll': 'कली अवस्था',
    'germination': 'अंकुरण अवस्था', 'panicle': 'बाली अवस्था'
  },
  ta: {
    'seedling': 'மொளாயிரு நிலை', 'nursery': 'நாற்று நிலை', 'vegetative': 'வளர்ச்சி நிலை',
    'flowering': 'பூக்கும் நிலை', 'grain filling': 'தஞ்சு நிலை', 'maturity': 'பக்ுவ நிலை',
    'harvest': 'அறுவடை நிலை'
  },
  kn: {
    'seedling': 'ಸಸ್ಯಮೊಳಕೆ ಹಂತ', 'vegetative': 'ಬೆಳವಣಿಗೆ ಹಂತ',
    'flowering': 'ಹೂಬಿಡುವ ಹಂತ', 'maturity': 'ಪಕ್ವತೆ ಹಂತ', 'harvest': 'ಕೋಯ್ಲು ಹಂತ'
  },
  mr: {
    'seedling': 'रोप अवस्था', 'vegetative': 'शाकीय अवस्था',
    'flowering': 'फुलोरा अवस्था', 'maturity': 'पक्वता अवस्था', 'harvest': 'काढणी अवस्था'
  }
};

const STATUS_TRANSLATIONS: Record<string, Record<string, string>> = {
  te: { 'healthy': 'ఆరోగ్యకరం', 'good': 'మంచిగా ఉంది', 'attention': 'శ్రద్ధ అవసరం', 'critical': 'ప్రమాదకరం', 'poor': 'షోచనీయం' },
  hi: { 'healthy': 'स्वस्थ', 'good': 'अच्छा', 'attention': 'ध्यान दें', 'critical': 'गंभीर', 'poor': 'खराब' },
  ta: { 'healthy': 'ஆரோக்கியமானது', 'good': 'நல்லது', 'attention': 'கவனம் தேவை', 'critical': 'ஆபத்தானது' },
  kn: { 'healthy': 'ಆರೊಗ್ಯಕರ', 'good': 'ಉತ್ತಮ', 'attention': 'ಗಮನ ಅಗತ್ಯ', 'critical': 'ಅಪಾಯಕಾರಿ' },
  mr: { 'healthy': 'निरोगी', 'good': 'चांगले', 'attention': 'लक्ष द्या', 'critical': 'गंभीर' }
};

function translateStage(stage: string, lang: string): string {
  if (!stage || lang === 'en') return stage;
  const map = STAGE_TRANSLATIONS[lang];
  if (!map) return stage;
  const lower = stage.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return stage;
}

function translateStatus(status: string, lang: string): string {
  if (!status || lang === 'en') return status;
  const map = STATUS_TRANSLATIONS[lang];
  if (!map) return status;
  const lower = status.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return status;
}

interface MyCropsScreenProps {
  farms: Farm[];
  onBackToHome?: () => void;
  onRefreshFarms?: () => void;
}

type ViewState = 'list' | 'add-crop' | 'add-farm' | 'crop-details' | 'crop-assistant';

export const MyCropsScreen: React.FC<MyCropsScreenProps> = ({
  farms,
  onBackToHome,
  onRefreshFarms
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const [crops, setCrops] = useState<Crop[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'harvested'>('all');
  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    setLoading(true);
    try {
      const data = await api.getCrops();
      setCrops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load crops from database:', err);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic filter counts
  const allCount = crops.length;
  const activeCount = crops.filter((c) => (c.category || 'active') === 'active').length;
  const harvestedCount = crops.filter((c) => (c.category || 'active') === 'harvested').length;

  // Filtered crop list
  const filteredCrops = crops.filter((crop) => {
    const category = crop.category || 'active';
    if (activeFilter === 'active' && category !== 'active') return false;
    if (activeFilter === 'harvested' && category !== 'harvested') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = crop.name.toLowerCase().includes(q);
      const matchFarm = (crop.farm_name || '').toLowerCase().includes(q);
      const matchStage = (crop.growth_stage || '').toLowerCase().includes(q);
      return matchName || matchFarm || matchStage;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('healthy') || s.includes('good')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#E7F6E9] text-[#005B43] text-[11px] font-bold flex items-center gap-1 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#005B43]" />
          <span>{status}</span>
        </span>
      );
    }
    if (s.includes('attention')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#FFF8E6] text-[#B7791F] text-[11px] font-bold flex items-center gap-1 shrink-0 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-[#FEECEC] text-[#E53935] text-[11px] font-bold flex items-center gap-1 shrink-0 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-[#E53935]" />
        <span>{status}</span>
      </span>
    );
  };

  // Sub-views handlers
  const handleSelectCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setCurrentView('crop-details');
  };

  const handleCropCreated = (newCrop: Crop) => {
    setCrops((prev) => [newCrop, ...prev]);
    setSelectedCrop(newCrop);
    setCurrentView('list');
  };

  const handleFarmCreated = (_newFarm: Farm) => {
    if (onRefreshFarms) onRefreshFarms();
    setCurrentView('add-crop');
  };

  // RENDER SUB-VIEWS
  if (currentView === 'add-crop') {
    return (
      <AddCropScreen
        farms={farms}
        onBack={() => setCurrentView('list')}
        onCropCreated={handleCropCreated}
        onOpenAddFarm={() => setCurrentView('add-farm')}
      />
    );
  }

  if (currentView === 'add-farm') {
    return (
      <AddFarmScreen
        onBack={() => setCurrentView('add-crop')}
        onFarmCreated={handleFarmCreated}
      />
    );
  }

  if (currentView === 'crop-details' && selectedCrop) {
    return (
      <CropDetailsScreen
        crop={selectedCrop}
        onBack={() => setCurrentView('list')}
        onCropUpdated={(updated) => {
          setSelectedCrop(updated);
          setCrops((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
        onOpenAssistant={(crop) => {
          setSelectedCrop(crop);
          setCurrentView('crop-assistant');
        }}
      />
    );
  }

  if (currentView === 'crop-assistant' && selectedCrop) {
    return (
      <CropAssistantScreen
        crop={selectedCrop}
        onBack={() => setCurrentView('crop-details')}
      />
    );
  }

  // SCREEN 1: MAIN MY CROPS LIST
  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#102344] pb-28 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header matching Reference Screen 1 with Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onBackToHome) {
                onBackToHome();
              } else if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-[#102344]"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#E7F6E9] border border-[#005B43]/20 flex items-center justify-center text-[#005B43] shadow-2xs shrink-0">
            <Sprout className="w-6 h-6 text-[#005B43]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-[#102344] leading-tight">My Crops</h2>
            <p className="text-xs text-[#536783] font-medium">Manage your farms and crops</p>
          </div>
        </div>

        {/* Add Crop Button */}
        <button
          onClick={() => setCurrentView('add-crop')}
          className="bg-[#005B43] hover:bg-[#004B37] text-white px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Crop</span>
        </button>
      </div>

      {/* Filter Tabs: All (5) | Active (4) | Harvested (1) */}
      <div className="flex items-center gap-2 border-b border-[#DCE4EB] pb-2 pt-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-[#005B43] text-white shadow-2xs'
              : 'bg-white text-[#536783] border border-[#DCE4EB] hover:text-[#102344]'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeFilter === 'all' ? 'bg-emerald-900 text-white' : 'bg-gray-100 text-[#536783]'
            }`}
          >
            {allCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('active')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'active'
              ? 'bg-[#005B43] text-white shadow-2xs'
              : 'bg-white text-[#536783] border border-[#DCE4EB] hover:text-[#102344]'
          }`}
        >
          <span>Active</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeFilter === 'active' ? 'bg-emerald-900 text-white' : 'bg-gray-100 text-[#536783]'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('harvested')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'harvested'
              ? 'bg-[#005B43] text-white shadow-2xs'
              : 'bg-white text-[#536783] border border-[#DCE4EB] hover:text-[#102344]'
          }`}
        >
          <span>Harvested</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeFilter === 'harvested' ? 'bg-emerald-900 text-white' : 'bg-gray-100 text-[#536783]'
            }`}
          >
            {harvestedCount}
          </span>
        </button>
      </div>

      {/* Search Input for Quick Filter */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search crop or farm name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-[#DCE4EB] bg-white text-xs font-medium focus:outline-none focus:border-[#005B43] text-[#102344]"
        />
        <Search className="w-3.5 h-3.5 text-[#536783] absolute left-3 top-2.5" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#536783]">
          <Loader2 className="w-6 h-6 animate-spin text-[#005B43]" />
          <span>Loading your crops...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCrops.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#DCE4EB] p-8 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#E7F6E9] text-[#005B43] flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#102344]">No crops found</h4>
            <p className="text-xs text-[#536783] mt-1">
              {searchQuery ? 'Try another search term.' : 'Add your first crop to track growth and smart irrigation.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('add-crop')}
            className="bg-[#005B43] text-white font-bold text-xs px-4 py-2.5 rounded-2xl inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Crop Now</span>
          </button>
        </div>
      )}

      {/* Crop Cards List matching Reference Screen 1 */}
      {!loading && (
        <div className="space-y-3">
          {filteredCrops.map((crop) => {
            const cropImage = crop.image_url || `/assets/crop_${crop.name.toLowerCase().replace(/\s+/g, '')}.jpg`;
            return (
              <div
                key={crop.id}
                onClick={() => handleSelectCrop(crop)}
                className="bg-white hover:bg-gray-50/80 active:bg-gray-100 rounded-3xl border border-[#DCE4EB] p-3.5 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3.5 overflow-hidden">
                  {/* Thumbnail Image */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-[#DCE4EB] shrink-0 relative">
                    <img
                      src={cropImage}
                      alt={crop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e: any) => {
                        e.target.src = '/assets/crop_paddy.jpg';
                      }}
                    />
                  </div>

                  {/* Middle Info */}
                  <div className="overflow-hidden space-y-0.5">
                    <h3 className="font-extrabold text-base text-[#102344] leading-tight truncate">
                      {crop.name}
                    </h3>

                    <p className="text-xs font-semibold text-[#536783] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#536783] shrink-0" />
                      <span>{crop.farm_name || 'Bhimavaram Farm'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{crop.area} {crop.area_unit || 'Acres'}</span>
                    </p>

                    <div className="pt-0.5">
                      <span className="text-[11px] font-bold text-[#005B43] bg-[#E7F6E9] px-2 py-0.5 rounded-md">
                        {translateStage(crop.growth_stage, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(translateStatus(crop.status, lang))}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#005B43] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
