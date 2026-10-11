import React, { useState, useEffect } from 'react';
import { X, Settings, Bell, Globe, Palette, Volume2, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreferences {
  language: 'fr' | 'en';
  oddsFormat: 'decimal' | 'fractional';
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  liveNotifications: boolean;
  oddsVariationAlerts: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'fr',
  oddsFormat: 'decimal',
  theme: 'light',
  soundEnabled: true,
  liveNotifications: true,
  oddsVariationAlerts: false,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('flash_user_preferences_v1');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('flash_user_preferences_v1', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: val }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Paramètres</h3>
              <p className="text-xs text-slate-500">Personnalisez votre expérience Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {savedSuccess && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Paramètres enregistrés automatiquement</span>
            </div>
          )}

          {/* Section: Langue & Format */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0066ff]" />
              <span>Langue et cotes</span>
            </h4>

            {/* Langue */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Langue d’affichage</span>
                <span className="text-[11px] text-slate-500">Interface utilisateur</span>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => updatePreference('language', 'fr')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    preferences.language === 'fr'
                      ? 'bg-[#0066ff] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => updatePreference('language', 'en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    preferences.language === 'en'
                      ? 'bg-[#0066ff] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Format des cotes */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Format des cotes</span>
                <span className="text-[11px] text-slate-500">Ex: 2.15 vs 23/20</span>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => updatePreference('oddsFormat', 'decimal')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    preferences.oddsFormat === 'decimal'
                      ? 'bg-[#0066ff] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Décimal
                </button>
                <button
                  onClick={() => updatePreference('oddsFormat', 'fractional')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    preferences.oddsFormat === 'fractional'
                      ? 'bg-[#0066ff] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fraction
                </button>
              </div>
            </div>
          </div>

          {/* Section: Notifications & Alertes */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#0066ff]" />
              <span>Notifications & Alertes</span>
            </h4>

            {/* Buts en direct */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Alertes buts en direct</span>
                <span className="text-[11px] text-slate-500">Notifications instantanées</span>
              </div>
              <button
                onClick={() => updatePreference('liveNotifications', !preferences.liveNotifications)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  preferences.liveNotifications ? 'bg-[#0066ff]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    preferences.liveNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Variations de cotes */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Alertes variations fortes</span>
                <span className="text-[11px] text-slate-500">Flèches de hausse / baisse</span>
              </div>
              <button
                onClick={() => updatePreference('oddsVariationAlerts', !preferences.oddsVariationAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  preferences.oddsVariationAlerts ? 'bg-[#0066ff]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    preferences.oddsVariationAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sons */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sons de l’application</span>
                </span>
                <span className="text-[11px] text-slate-500">Validation des paris & alertes</span>
              </div>
              <button
                onClick={() => updatePreference('soundEnabled', !preferences.soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  preferences.soundEnabled ? 'bg-[#0066ff]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sécurité certifiée */}
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-800">
            <ShieldCheck className="w-5 h-5 text-[#0066ff] shrink-0" />
            <span>Vos préférences sont stockées localement de manière sécurisée et privée.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0066ff] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
