import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface LanguageDropdownProps {
  className?: string;
}

const LANGUAGE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  en: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'EN' },
  te: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'తె' },
  hi: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'हिं' },
  ta: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'த' },
  kn: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'ಕ' },
  mr: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'म' },
};

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLangCode = (i18n.language || 'en').split('-')[0].toLowerCase();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode) || SUPPORTED_LANGUAGES[0];
  const activeBadge = LANGUAGE_BADGES[currentLang.code] || { bg: 'bg-emerald-100', text: 'text-[#005B43]', label: currentLang.code.toUpperCase() };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrismart_lang', code);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Pill Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none shadow-2xs border ${
          isOpen
            ? 'bg-[#E7F6E9] border-[#005B43] text-[#005B43] ring-2 ring-[#005B43]/20'
            : 'bg-gradient-to-r from-gray-50 via-white to-emerald-50/40 border-gray-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 text-[#102D20]'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#005B43] shrink-0 group-hover:scale-105 transition-transform">
          <Globe className="w-3.5 h-3.5" />
        </div>

        <span className="font-extrabold text-[12px] tracking-tight">
          {currentLang.nativeName}
        </span>

        <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${activeBadge.bg} ${activeBadge.text}`}>
          {currentLang.code.toUpperCase()}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#005B43]' : 'group-hover:text-gray-700'
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/98 backdrop-blur-md border border-emerald-100 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
          {/* Menu Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#E7F6E9]/80 via-emerald-50/40 to-white border-b border-emerald-100/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#005B43]" />
              <span className="text-xs font-black text-[#102D20] tracking-tight">
                {t('selectLanguage', 'Select Language')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#005B43] bg-white px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
              6 Languages
            </span>
          </div>

          {/* Language Options List */}
          <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = activeLangCode === lang.code;
              const badge = LANGUAGE_BADGES[lang.code] || { bg: 'bg-gray-100', text: 'text-gray-700', label: lang.code.toUpperCase() };

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#E7F6E9] text-[#005B43] font-bold border border-emerald-200 shadow-2xs'
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Language Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-[#005B43] text-white'
                          : `${badge.bg} ${badge.text}`
                      }`}
                    >
                      {badge.label}
                    </div>

                    {/* Language Name Labels */}
                    <div className="flex flex-col">
                      <span className={`text-xs leading-tight ${isSelected ? 'font-black text-[#005B43]' : 'font-bold text-gray-900'}`}>
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {lang.name}
                      </span>
                    </div>
                  </div>

                  {/* Active Checkmark */}
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#005B43] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-gray-200 group-hover:border-emerald-300 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#005B43]" />
              <span>Instant AI translation across all screens</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
