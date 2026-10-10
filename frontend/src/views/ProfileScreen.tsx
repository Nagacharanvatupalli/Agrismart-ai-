import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, LogOut, CheckCircle2, Globe, Database, Sparkles, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import type { User as UserType } from '../services/api';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserType | null>(() => api.getCurrentUser());
  const [isUpdatingLang, setIsUpdatingLang] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      console.warn("Failed to refresh live profile, using cached session:", err);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setIsUpdatingLang(true);
    i18n.changeLanguage(langCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrismart_lang', langCode);
    }
    setTimeout(() => {
      setIsUpdatingLang(false);
    }, 300);
  };

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'F';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSignOut = () => {
    api.logout();
    onLogout();
  };

  const displayName = profile?.name || 'Farmer';
  const displayPhone = profile?.phone || 'Mobile not linked';
  const initials = getInitials(displayName);

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-[#087A3D]">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20]">{t('farmerProfile', 'Farmer Profile')}</h2>
          <p className="text-xs text-[#5A6E65]">Manage profile & language preferences</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#E7F7E4] text-[#087A3D] font-black text-xl flex items-center justify-center shadow-2xs">
            {initials}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#102D20]">{displayName}</h3>
            <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
              <span>{displayPhone}</span>
              <span className="text-[#087A3D] flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> ({t('verified', 'Verified')})
              </span>
            </p>
          </div>
        </div>

        {/* Language Selection Grid */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#005B43]" />
              <span>{t('selectLanguage', 'Select Language')}</span>
            </label>
            {isUpdatingLang && (
              <span className="text-[10px] text-[#005B43] font-extrabold bg-[#E7F6E9] px-2 py-0.5 rounded-full animate-pulse border border-emerald-200">
                {t('saved', 'Saved')} ✓
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = (i18n.language || 'en').startsWith(lang.code);
              const badges: Record<string, { bg: string; text: string; code: string }> = {
                en: { bg: 'bg-blue-100', text: 'text-blue-700', code: 'EN' },
                te: { bg: 'bg-emerald-100', text: 'text-emerald-700', code: 'తె' },
                hi: { bg: 'bg-orange-100', text: 'text-orange-700', code: 'हिं' },
                ta: { bg: 'bg-amber-100', text: 'text-amber-700', code: 'த' },
                kn: { bg: 'bg-purple-100', text: 'text-purple-700', code: 'ಕ' },
                mr: { bg: 'bg-rose-100', text: 'text-rose-700', code: 'म' },
              };
              const b = badges[lang.code] || { bg: 'bg-gray-100', text: 'text-gray-700', code: lang.code.toUpperCase() };

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'border-[#005B43] bg-gradient-to-br from-[#E7F6E9] to-emerald-50/50 shadow-xs ring-2 ring-[#005B43]/15'
                      : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50/80 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isSelected ? 'bg-[#005B43] text-white' : `${b.bg} ${b.text}`}`}>
                        {b.code}
                      </span>
                      <span className={`text-xs ${isSelected ? 'font-black text-[#005B43]' : 'font-bold text-gray-900'}`}>
                        {lang.nativeName}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#005B43] text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium pl-8 mt-0.5">{lang.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* System & Cloud Status */}
        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs font-semibold">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <span className="text-gray-600 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('cloudDatabase', 'Cloud Database')}</span>
            </span>
            <span className="font-extrabold text-[#102D20]">PostgreSQL / Supabase</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <span className="text-gray-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('aiEngineStatus', 'AI Engine Status')}</span>
            </span>
            <span className="font-extrabold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active (Gemini 2.5)</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-rose-200 text-xs active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('signOut', 'Sign Out')}</span>
        </button>
      </div>
    </div>
  );
};
