import React from 'react';
import { ShieldCheck, Zap, Radio, Globe, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import { BannerCarousel } from '../common/BannerCarousel';

interface PublicLandingViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: 'Cotes en direct',
    desc: 'Données sportives réelles et variations de cotes actualisées automatiquement.',
  },
  {
    icon: Layers,
    title: 'Large choix de marchés',
    desc: 'Résultat, double chance, buts, mi-temps, handicap, corners, cartons et statistiques.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité et intégrité',
    desc: 'Gestion rigoureuse des soldes avec contrôle d’accès et registre d’audit inviolable.',
  },
  {
    icon: Globe,
    title: 'Fuseau horaire automatique',
    desc: 'Conversion automatique des horaires de rencontres selon votre fuseau local.',
  },
];

const AVAILABLE_MARKETS = [
  { name: 'Résultat (1X2)', desc: 'Vainqueur du match ou match nul' },
  { name: 'Double chance', desc: 'Couverture de 2 issues possibles' },
  { name: 'Total de buts', desc: 'Plus / Moins de buts sur la rencontre' },
  { name: 'Les deux équipes marquent', desc: 'Oui ou Non' },
  { name: 'Mi-temps', desc: 'Résultat et scores intermédiaires' },
  { name: 'Handicap', desc: 'Avantage de points ou buts' },
  { name: 'Corners & Cartons', desc: 'Statistiques de discipline et de jeu' },
  { name: 'LIVE & Statistiques', desc: 'Suivi dynamique en direct' },
];

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({ onOpenAuth }) => {
  return (
    <div className="space-y-10 pb-16">
      
      {/* 4-second Auto-sliding Zero-Data Carousel Banner */}
      <BannerCarousel autoPlayInterval={4000} onExplore={() => onOpenAuth('register')} />

      {/* Hero Welcome Message */}
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Plateforme Sportive Premium</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight text-balance">
          L'expérience sportive réinventée
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 text-balance leading-relaxed">
          Rejoignez FLASH pour vivre les grandes rencontres, suivre les cotes officielles en temps réel et gérer vos sélections sur une interface rapide et intuitive.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="min-h-[48px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
          >
            Créer un compte FLASH
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="min-h-[48px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
          >
            Déjà inscrit ? Se connecter
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HIGHLIGHTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[#0b1222] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Markets Showcase Grid */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-display">
              Tous les marchés disponibles sur FLASH
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Architecture multi-marchés prête pour la diffusion en direct
            </p>
          </div>
          <button
            onClick={() => onOpenAuth('register')}
            className="min-h-[40px] px-4 py-1.5 bg-slate-900 border border-slate-700 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            Accéder à l'offre complète
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AVAILABLE_MARKETS.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-xl flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">{m.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Responsible Play Notice */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Plateforme sportive sécurisée · Conformité et protection des données</span>
        </div>
        <span className="font-semibold text-slate-300">Jeu Responsable</span>
      </div>

    </div>
  );
};
