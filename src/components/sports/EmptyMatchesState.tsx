import React from 'react';
import { Radio, RotateCw } from 'lucide-react';

interface EmptyMatchesStateProps {
  title?: string;
  description?: string;
  onRefresh?: () => void;
  onOpenConnector?: () => void;
  isRefreshing?: boolean;
}

export const EmptyMatchesState: React.FC<EmptyMatchesStateProps> = ({
  title = 'Aucun match disponible',
  description = 'Aucun match ne correspond aux critères actuels. FLASH ne diffuse aucun événement fictif ou simulé.',
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="w-full py-12 px-6 rounded-3xl bg-white border border-slate-200/80 text-center flex flex-col items-center justify-center max-w-md mx-auto my-3 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
        <Radio className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed mb-5">
        {description}
      </p>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Actualisation...' : 'Actualiser le flux officiel'}</span>
        </button>
      )}

      <div className="mt-5 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Données officielles en direct</span>
      </div>
    </div>
  );
};
