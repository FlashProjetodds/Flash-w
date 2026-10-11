import React, { useState } from 'react';
import { Gamepad2, Trophy, Flame, Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useBets } from '../../context/BetContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

export const GamingView: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { navigateTo } = useNavigation();

  // Mini quiz state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleQuizChoice = (idx: number) => {
    setQuizAnswer(idx);
    setQuizSubmitted(true);
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-4xl mx-auto space-y-5 pb-28">
      
      {/* Hero Gaming Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden shadow-xl shadow-blue-600/15">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>FLASH Gaming Zone</span>
          </span>
        </div>

        <h1 className="relative z-10 text-2xl sm:text-3xl font-black font-display tracking-tight leading-tight">
          Pronostics & Défis Sportifs ⚡
        </h1>

        <p className="relative z-10 text-xs sm:text-sm text-blue-100 mt-1 max-w-md">
          Participez aux défis quotidiens, testez vos connaissances sportives et remportez des bonus FLASH exclusifs.
        </p>

        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigateTo('live')}
            className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 text-xs font-black hover:bg-blue-50 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-blue-600 stroke-none" />
            <span>Défis Matchs en Direct</span>
          </button>
        </div>
      </div>

      {/* Streak / Level Card */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xl font-black font-mono text-slate-900">3x</span>
          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Série en cours</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xl font-black font-mono text-slate-900">#14</span>
          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Classement</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xl font-black font-mono text-slate-900">500 pts</span>
          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Points Flash</span>
        </div>
      </div>

      {/* Mini Sport Quiz */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
              Q1
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
              Quiz Express du Jour
            </h3>
          </div>
          <span className="text-[11px] font-bold text-blue-600 font-mono">+50 pts</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 font-medium">
          Quel joueur détient le record du plus grand nombre de buts marqués en une seule saison de Ligue 1 (44 buts) ?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {['Josip Skoblar', 'Kylian Mbappé', 'Zlatan Ibrahimović', 'Jean-Pierre Papin'].map((name, idx) => {
            const isCorrect = idx === 0;
            const isChosen = quizAnswer === idx;

            let btnStyle = 'bg-slate-50 hover:bg-blue-50/50 text-slate-800 border-slate-200/80';
            if (quizSubmitted) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400';
              } else if (isChosen && !isCorrect) {
                btnStyle = 'bg-rose-50 text-rose-800 border-rose-300';
              }
            }

            return (
              <button
                key={name}
                disabled={quizSubmitted}
                onClick={() => handleQuizChoice(idx)}
                className={`p-3 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-all ${btnStyle}`}
              >
                <span>{name}</span>
                {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {quizSubmitted && (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bravo ! Josip Skoblar a inscrit 44 buts lors de la saison 1970-1971 avec l'OM.</span>
          </div>
        )}
      </div>

    </div>
  );
};
