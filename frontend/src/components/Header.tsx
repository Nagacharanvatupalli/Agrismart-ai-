import React from 'react';
import { Bell } from 'lucide-react';
import { LanguageDropdown } from './LanguageDropdown';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onLogoClick?: () => void;
  unreadAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  onLogoClick,
  unreadAlertsCount = 1 
}) => {
  return (
    <header className="bg-white border-b border-green-100/60 sticky top-0 z-40 px-4 py-2.5 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Brand Content */}
        <div 
          onClick={onLogoClick}
          className="flex items-center gap-2.5 cursor-pointer active:scale-98 transition-transform select-none"
          role="button"
          tabIndex={0}
        >
          {/* Logo Emblem in Soft Green Badge */}
          <div className="w-10 h-10 rounded-full bg-[#EBF7F0] flex items-center justify-center shrink-0 border border-[#D5EFE0]/70 p-1 shadow-2xs">
            <img
              src="/logo-icon.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="AgriSmart AI"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title & Tagline */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[17px] font-bold text-[#102D20] tracking-tight">AgriSmart</span>
              <span className="text-[17px] font-bold text-[#1B8354] tracking-tight">AI</span>
            </div>
            <p className="text-[11px] text-[#5A6E65] font-medium leading-tight mt-0.5 whitespace-nowrap">
              Smart Farming • Better Tomorrow
            </p>
          </div>
        </div>

        {/* Language Dropdown & Notifications */}
        <div className="flex items-center gap-2">
          <LanguageDropdown />

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
