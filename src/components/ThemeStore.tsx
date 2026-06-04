import React, { useState } from 'react';
import { SoftBoyTheme } from '../types';
import { SYSTEM_THEMES } from '../data';
import { 
  ShoppingBag, 
  Sparkles, 
  Check, 
  Lock, 
  Coins, 
  Heart, 
  Compass, 
  Tag, 
  X,
  Gift
} from 'lucide-react';

interface ThemeStoreProps {
  currentThemeId: string;
  setCurrentThemeId: (id: string) => void;
  softBoyCoins: number;
  setSoftBoyCoins: React.Dispatch<React.SetStateAction<number>>;
  themesList: SoftBoyTheme[];
  setThemesList: React.Dispatch<React.SetStateAction<SoftBoyTheme[]>>;
  onClose: () => void;
}

export default function ThemeStore({
  currentThemeId,
  setCurrentThemeId,
  softBoyCoins,
  setSoftBoyCoins,
  themesList,
  setThemesList,
  onClose
}: ThemeStoreProps) {
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);

  const handleApplyTheme = (theme: SoftBoyTheme) => {
    setCurrentThemeId(theme.id);
    localStorage.setItem('sboy_current_theme_id', theme.id);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleUnlockTheme = (theme: SoftBoyTheme) => {
    if (softBoyCoins < theme.cost) {
      alert(`⚠️ ¡No tienes suficientes Soft Boy Coins! Necesitas ${theme.cost} 🧸 pero posees ${softBoyCoins} 🧸. ¡Puedes reclamar algunas monedas gratis en el botón de regalo abajo!`);
      return;
    }

    // Purchase deduction
    const updatedCoins = softBoyCoins - theme.cost;
    setSoftBoyCoins(updatedCoins);
    localStorage.setItem('sboy_coins', String(updatedCoins));

    // Update themes unlock state
    const updatedThemes = themesList.map(t => {
      if (t.id === theme.id) {
        return { ...t, isUnlocked: true };
      }
      return t;
    });
    setThemesList(updatedThemes);
    localStorage.setItem('sboy_themes', JSON.stringify(updatedThemes));

    // Success styling animations
    setSuccessAnimationId(theme.id);
    setCurrentThemeId(theme.id);
    localStorage.setItem('sboy_current_theme_id', theme.id);
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setTimeout(() => {
      setSuccessAnimationId(null);
    }, 2500);
  };

  const handleClaimFreeCoins = () => {
    const updated = softBoyCoins + 100;
    setSoftBoyCoins(updated);
    localStorage.setItem('sboy_coins', String(updated));
    alert('🎁 ¡Has recibido 100 Soft Boy Coins de cortesía! ¡Úsalas para desbloquear los hermosos temas del Clóset!');
    if (navigator.vibrate) navigator.vibrate([50, 50]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div 
        id="theme-store-drawer"
        className="bg-white dark:bg-[#1a1412] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-[32px] w-full max-w-sm max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95"
      >
        
        {/* Store Header */}
        <div className="p-5 border-b border-[#c4b5a5]/30 flex justify-between items-center bg-[#fcf8f3] dark:bg-[#231a17] shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white font-sans uppercase tracking-tight">Tienda de Temas</h3>
              <p className="text-[10px] text-gray-400 font-mono">SOFT BOY CÁPSULA COUTURE</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1 px-2 text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Coins tracker header panel */}
        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200 font-bold">
            <Coins size={14} className="animate-bounce" />
            <span>Monedas: {softBoyCoins} 🧸 Soft Boy Coins</span>
          </div>

          <button
            onClick={handleClaimFreeCoins}
            className="flex items-center gap-1 py-1 px-2.5 bg-[#a67c52] hover:bg-[#a67c52]/90 text-[#fef9ef] rounded-lg font-bold text-[9px] transition-all cursor-pointer"
          >
            <Gift size={11} /> +100 GRATIS
          </button>
        </div>

        {/* Themes inventory slider scroll */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3.5 scrollbar-thin">
          <p className="text-[10.5px] text-neutral-500 leading-relaxed text-center mb-1">
            Cada tema conserva la calidez acogedora de la estética <strong>Soft Boy</strong> con variaciones pasteles sutiles inspiradoras.
          </p>

          {themesList.map(theme => {
            const isActive = currentThemeId === theme.id;
            const isUnlocked = theme.isUnlocked || theme.cost === 0;
            const canAfford = softBoyCoins >= theme.cost;
            const isAnimating = successAnimationId === theme.id;

            return (
              <div
                key={theme.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex justify-between items-center ${
                  isActive
                    ? 'border-[#a67c52] ring-1 ring-[#a67c52]'
                    : 'border-[#c4b5a5]/30 hover:border-[#a67c52]/40'
                }`}
                style={{
                  backgroundColor: theme.bgCard,
                  color: theme.text
                }}
              >
                {/* Theme visual representation */}
                <div className="flex flex-col gap-1 min-w-0 pr-3.5 flex-1">
                  <div className="flex items-center gap-1.5">
                    {/* Circle preview of palette dots */}
                    <div className="flex gap-0.5 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.accentLight }} />
                    </div>
                    <h4 className="font-extrabold text-xs tracking-tight truncate">{theme.name}</h4>
                    {theme.cost === 0 && (
                      <span className="text-[8px] bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 font-bold font-mono px-1.5 rounded uppercase">Default</span>
                    )}
                  </div>
                  <p className="text-[10px] leading-snug mt-0.5 opacity-80" style={{ color: theme.textMuted }}>
                    {theme.description}
                  </p>
                </div>

                {/* Theme Buy or Activate controls */}
                <div className="shrink-0 flex items-center justify-end">
                  {isUnlocked ? (
                    isActive ? (
                      <span 
                        className={`text-[10px] font-extrabold font-sans py-1.5 px-3 rounded-xl flex items-center gap-1 ${
                          isAnimating 
                            ? 'bg-emerald-500 text-white animate-pulse' 
                            : 'bg-[#a67c52] text-[#fef9ef]'
                        }`}
                      >
                        <Check size={11} /> {isAnimating ? '¡COMPRADO!' : 'ACTIVO'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyTheme(theme)}
                        className="py-1.5 px-3 border rounded-xl font-bold text-[10px] transition-all duration-150 cursor-pointer text-gray-500 border-[#c4b5a5]/60 hover:text-[#a67c52] hover:border-[#a67c52] bg-white/50"
                        style={{ minHeight: '28px' }}
                      >
                        ACTIVAR
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleUnlockTheme(theme)}
                      className={`py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
                        canAfford
                          ? 'bg-[#a67c52] text-white hover:bg-[#a67c52]/90 shadow-xs'
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border'
                      }`}
                      style={{ minHeight: '28px' }}
                      title={`Desbloquear por ${theme.cost} coins`}
                    >
                      <Lock size={10} />
                      <span>{theme.cost} 🧸</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* FOOTER ADVICE */}
        <div className="p-4 bg-[#fcf8f3] dark:bg-[#201715] text-center border-t border-[#c4b5a5]/20 shrink-0">
          <p className="text-[9.5px] text-gray-450 font-mono uppercase tracking-wider">
            ★ Diseños exclusivos del Clóset ★
          </p>
        </div>

      </div>
    </div>
  );
}
