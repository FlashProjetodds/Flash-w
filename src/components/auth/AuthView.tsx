import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Radio,
  TrendingUp,
  BarChart2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { FlashLogo } from '../common/FlashLogo';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface VisualCard {
  id: number;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  image: string;
}

const VISUAL_CARDS: VisualCard[] = [
  {
    id: 1,
    title: 'Suivez les matchs en direct',
    subtitle: 'Scores instantanés et chronomètres officiels',
    badge: 'LIVE',
    icon: <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />,
    image: '/src/assets/images/flash_soccer_action_1790462007046.jpg',
  },
  {
    id: 2,
    title: 'Tous les sports',
    subtitle: 'Football, Basketball, Tennis & plus',
    badge: 'MULTI-SPORTS',
    icon: <span className="text-xs">🏀</span>,
    image: '/src/assets/images/flash_basketball_arena_1790462017456.jpg',
  },
  {
    id: 3,
    title: 'Cotes et marchés',
    subtitle: 'Variations en temps réel et cotes certifiées',
    badge: 'MARCHÉS',
    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500" />,
    image: '/src/assets/images/flash_tennis_court_1790462027963.jpg',
  },
  {
    id: 4,
    title: 'Statistiques et analyses',
    subtitle: 'Données détaillées et historique complet',
    badge: 'DATA',
    icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />,
    image: '/src/assets/images/flash_sports_analytics_1790794967582.jpg',
  },
  {
    id: 5,
    title: 'L’intensité du sport en direct',
    subtitle: 'Vivez chaque action sportive avec FLASH',
    badge: 'ACTION',
    icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" />,
    image: '/src/assets/images/flash_athletes_composite_1790794945901.jpg',
  },
  {
    id: 6,
    title: 'Sécurité & Règlement certifié',
    subtitle: 'Paiements automatisés et intégrité des paris',
    badge: 'SÉCURISÉ',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />,
    image: '/src/assets/images/flash_soccer_action_1790462007046.jpg',
  },
];

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, register, isAuthenticated } = useAuth();
  const { goBack, navigateTo } = useNavigation();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [activeSlide, setActiveSlide] = useState(0);

  // Form inputs
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Auto-scroll dynamic visual cards every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % VISUAL_CARDS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigateTo('home');
      }
    }
  }, [isAuthenticated, navigateTo, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = login(emailOrPhone.trim(), password);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg('Connexion réussie ! Bienvenue sur FLASH.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else navigateTo('home');
        }, 600);
      } else {
        setErrorMsg(res.error || 'Identifiant ou mot de passe incorrect.');
      }
    } else {
      if (!acceptTerms) {
        setIsLoading(false);
        setErrorMsg("Veuillez accepter les conditions d'utilisation et la politique de confidentialité.");
        return;
      }

      const res = register(name.trim(), emailOrPhone.trim(), password, confirmPassword);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg('Compte créé avec succès ! Bienvenue sur FLASH.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else navigateTo('home');
        }, 800);
      } else {
        setErrorMsg(res.error || 'Erreur lors de la création du compte.');
      }
    }
  };

  const handleFillDemoAdmin = () => {
    setEmailOrPhone('admin@flash.sport');
    setPassword('AdminPassword2026!');
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#f8faff] text-slate-900 flex flex-col relative w-full max-w-full overflow-x-hidden box-border">
      
      {/* Decorative background curves matching design */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-28 -mb-28" />

      {/* Modern bottom swoosh graphic */}
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none" />

      {/* Main Responsive Wrapper */}
      <div className="relative z-10 flex-1 max-w-md sm:max-w-xl mx-auto w-full px-4 sm:px-6 pt-3 sm:pt-5 pb-12 flex flex-col justify-between">
        
        {/* Top Header Bar */}
        <div className="w-full mb-3">
          <div className="flex items-center justify-between">
            {/* Android Back Button */}
            <button
              onClick={goBack}
              aria-label="Retour"
              className="w-10 h-10 rounded-full bg-white/95 border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>

            {/* Quick Demo Credentials shortcut (Discreet for fast testing) */}
            <button
              onClick={handleFillDemoAdmin}
              type="button"
              className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 px-2.5 py-1 rounded-full transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              title="Pré-remplir avec le compte administrateur / test"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Identifiants Démo</span>
            </button>
          </div>
        </div>

        {/* Brand Showcase Section with Athletes Composite */}
        <div className="relative mb-4 sm:mb-5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: FLASH Typography */}
            <div className="z-10">
              <FlashLogo size="lg" showSlogan={true} />
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
                Votre espace sportif en temps réel
              </p>
            </div>

            {/* Right: Athletes Composite Graphic */}
            <div className="w-32 sm:w-44 h-24 sm:h-28 relative rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-200/70">
              <img
                src="/src/assets/images/flash_athletes_composite_1790794945901.jpg"
                alt="Athlètes FLASH"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/40" />
            </div>
          </div>
        </div>

        {/* DYNAMIC VISUAL ZONE: 4-5s smooth auto-scroll card presentation */}
        <div className="w-full mb-5">
          {/* Card Showcase Viewport */}
          <div className="relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80">
            {VISUAL_CARDS.map((card, idx) => {
              const isActive = idx === activeSlide;

              return (
                <div
                  key={card.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
                  />
                  {/* Subtle dark gradient scrim for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

                  {/* Card Content */}
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1">
                      {card.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                          {card.badge}
                        </span>
                      )}
                      <span className="p-1 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                        {card.icon}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white font-display leading-tight drop-shadow-sm">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-200 mt-0.5 line-clamp-1 drop-shadow-xs">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6 Dots indicators matching design */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {VISUAL_CARDS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Afficher la présentation ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeSlide
                    ? 'w-6 h-1.5 bg-blue-600 shadow-xs shadow-blue-500/40'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* AUTHENTICATION FORM CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] w-full max-w-full min-w-0 box-border">
          
          {/* Circular User Avatar */}
          <div className="w-13 h-13 rounded-full bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <UserIcon className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* Heading */}
          <div className="text-center mt-3 mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              {mode === 'login' ? 'Bienvenue sur FLASH' : 'Créer votre compte FLASH'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {mode === 'login'
                ? 'Connectez-vous à votre compte pour accéder à votre espace personnel.'
                : 'Rejoignez FLASH pour suivre vos matchs et gérer vos paris en toute sécurité.'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Mode register: Name input */}
            {mode === 'register' && (
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nom complet ou pseudo"
                  className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
                />
              </div>
            )}

            {/* Email or phone input */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder="Email ou numéro de téléphone"
                className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
              />
            </div>

            {/* Password input */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full h-12 pl-10 pr-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Mode register: Confirm Password */}
            {mode === 'register' && (
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
                />
              </div>
            )}

            {/* Mot de passe oublié (Login mode) */}
            {mode === 'login' && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Terms checkbox (Register mode) */}
            {mode === 'register' && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>
                    J'accepte les <strong className="text-slate-900">Conditions Générales d'Utilisation</strong> et confirme avoir l'âge légal requis.
                  </span>
                </label>
              </div>
            )}

            {/* Bouton principal : Connexion / Inscription */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{mode === 'login' ? 'Connexion' : 'Créer mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Divider "ou" */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                ou
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Bouton secondaire : Créer un compte / Se connecter */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="w-full h-12 rounded-2xl bg-white hover:bg-slate-50 border-2 border-blue-600 active:scale-98 text-blue-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {mode === 'login' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Créer un compte</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-4 h-4" />
                  <span>J'ai déjà un compte • Se connecter</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Footer Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Connexion sécurisée • Votre espace personnel FLASH</span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-display">
                  Récupération de compte
                </h4>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>
                Pour réinitialiser votre mot de passe, un code de sécurité temporaire peut être envoyé à votre adresse email ou par SMS.
              </p>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800">
                <span className="font-bold block mb-0.5">Assistance FLASH :</span>
                Vous pouvez également contacter le support ou utiliser le compte démo administrateur pour accéder à l'application.
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
