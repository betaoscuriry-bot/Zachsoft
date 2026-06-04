import React, { useState, useEffect } from 'react';
import { Prenda, Outfit } from '../types';
import { generateSmartPick } from '../utils';
import { COLOR_CLASSES_MAP } from '../data';
import OutfitSimulator from './OutfitSimulator';
import { 
  Wand2, 
  Lock, 
  Unlock, 
  Sparkles, 
  HelpCircle, 
  Shirt, 
  Clock, 
  Sun, 
  Snowflake, 
  Flame, 
  ChevronRight,
  Info 
} from 'lucide-react';

interface GeneradorTabProps {
  prendas: Prenda[];
  currentOutfit: Outfit | null;
  setCurrentOutfit: (outfit: Outfit) => void;
  historial: Outfit[];
  addToHistorial: (outfit: Outfit) => void;
  currentAesthetic?: string;
  aiSettings?: any;
}

export default function GeneradorTab({
  prendas,
  currentOutfit,
  setCurrentOutfit,
  historial,
  addToHistorial,
  currentAesthetic = 'Soft Boy',
  aiSettings
}: GeneradorTabProps) {
  const [lockedSlots, setLockedSlots] = useState<{ [key: string]: boolean }>({
    superior: false,
    pantalones: false,
    zapatos: false,
    abrigo: false,
    accesorio: false,
    bolsa: false
  });

  const [seasonFilter, setSeasonFilter] = useState<'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' | 'Todas'>('Todas');
  
  // Custom Sliding Control for Summer (Calido) vs Winter (Frio)
  const [sliderSeason, setSliderSeason] = useState<'verano' | 'invierno'>('verano');

  // Real-time time connector state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Set interval loop to maintain real-time hour recommendations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync custom seasonal slide switch into seasonFilter
  const handleToggleSliderSeason = (season: 'verano' | 'invierno') => {
    triggerFeedback();
    setSliderSeason(season);
    if (season === 'verano') {
      setSeasonFilter('Otoño/Primavera');
    } else {
      setSeasonFilter('Invierno');
    }
  };

  // Trigger tactile vibration feedback if browser supports
  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const handleGenerate = () => {
    triggerFeedback();

    const lockedOutfitParts: Partial<Outfit> = {};
    if (currentOutfit) {
      if (lockedSlots.superior) lockedOutfitParts.superior = currentOutfit.superior;
      if (lockedSlots.pantalones) lockedOutfitParts.pantalones = currentOutfit.pantalones;
      if (lockedSlots.zapatos) lockedOutfitParts.zapatos = currentOutfit.zapatos;
      if (lockedSlots.abrigo && currentOutfit.abrigo) lockedOutfitParts.abrigo = currentOutfit.abrigo;
      if (lockedSlots.accesorio && currentOutfit.accesorio) lockedOutfitParts.accesorio = currentOutfit.accesorio;
      if (lockedSlots.bolsa && currentOutfit.bolsa) lockedOutfitParts.bolsa = currentOutfit.bolsa;
    }

    // Pass historic clothes to bypass collision
    const historialIds = historial.map(out => [
      out.superior.id,
      out.pantalones.id,
      out.zapatos.id,
      out.abrigo?.id || 'none',
      out.accesorio?.id || 'none',
      out.bolsa?.id || 'none'
    ]);

    const nextOutfit = generateSmartPick(prendas, lockedOutfitParts, seasonFilter, historialIds);
    if (nextOutfit) {
      setCurrentOutfit(nextOutfit);
      addToHistorial(nextOutfit);
    } else {
      alert("No se pudo generar un outfit. Intenta desbloquear categorías o quitar filtros de estación.");
    }
  };

  const toggleLock = (slot: string) => {
    triggerFeedback();
    setLockedSlots(prev => ({
      ...prev,
      [slot]: !prev[slot]
    }));
  };

  const getColorBlock = (color: string) => {
    const val = COLOR_CLASSES_MAP[color.toLowerCase()] || '#c4b5a5';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  const renderSlotCard = (
    label: string,
    prenda: Prenda | null | undefined,
    slotKey: string,
    isOptional: boolean = false
  ) => {
    const isLocked = lockedSlots[slotKey];
    return (
      <div 
        id={`slot-${slotKey}`}
        className="flex items-center justify-between p-4 bg-[#fdfaf5] dark:bg-[#251e1a] rounded-2.5xl border border-[#c4b5a5]/70 shadow-[0_2px_8px_rgba(74,63,53,0.03)] hover:shadow-md transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center gap-3">
          {/* Visual color dot pattern overlay */}
          {prenda ? (
            <div 
              className="w-10 h-10 rounded-full border border-[#c4b5a5] shadow-xs flex items-center justify-center relative shrink-0" 
              style={getColorBlock(prenda.color)}
            >
              {prenda.color === 'N/A' && <span className="text-[10px] text-gray-500 font-mono">N/A</span>}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#e8dccc] dark:bg-[#4a3f35] flex items-center justify-center text-[#a67c52] shrink-0">
              <HelpCircle size={16} />
            </div>
          )}

          <div className="flex flex-col min-w-0 pr-3">
            <span className="text-[10px] text-[#a67c52] font-bold tracking-wider uppercase font-mono">{label}</span>
            <span className="text-sm text-gray-800 dark:text-neutral-100 font-medium truncate">
              {prenda ? prenda.name : isOptional ? 'Sin capa asignada' : 'Selecciona generar outfit'}
            </span>
            {prenda && (
              <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-sans mt-0.5">
                {prenda.color !== 'N/A' ? prenda.color : 'Universal'} • {prenda.season}
              </span>
            )}
          </div>
        </div>

        {/* Lock switch toggle control */}
        <button
          onClick={() => toggleLock(slotKey)}
          id={`lock-btn-${slotKey}`}
          className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all duration-300 cursor-pointer ${
            isLocked
              ? 'bg-[#a67c52] border-[#a67c52] text-white scale-95 shadow-sm'
              : 'bg-white dark:bg-[#342922] border-[#c4b5a5] text-gray-400 hover:text-[#a67c52] hover:bg-[#e8dccc]/30'
          }`}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
      </div>
    );
  };

  // Evaluate real-time hourly clothing advice
  const getHourlyAdvice = () => {
    const hours = currentTime.getHours();
    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let rangeTitle = "";
    let rangeAdvice = "";
    let icon = <Sun size={16} className="text-amber-500" />;

    if (hours >= 6 && hours < 12) {
      rangeTitle = "Mañana de Capas";
      rangeAdvice = "Excelente momento para lucir abrigos y accesorios antes de que suba la temperatura.";
      icon = <Clock size={16} className="text-[#a67c52] animate-spin-slow" />;
    } else if (hours >= 12 && hours < 18) {
      rangeTitle = "Tarde Fresca / Templada";
      rangeAdvice = "El sol brilla. Se sugieren camisas manga larga dobladas o poleras con jeans ligeros.";
      icon = <Sun size={16} className="text-amber-500 animate-pulse" />;
    } else if (hours >= 18 && hours < 23) {
      rangeTitle = "Atardecer / Noche acogedora";
      rangeAdvice = "La temperatura baja. Añade el polerón o dale prioridad a bufandas abrigadas.";
      icon = <Flame size={16} className="text-orange-500" />;
    } else {
      rangeTitle = "Madrugada Helada";
      rangeAdvice = "No olvides un abrigo pesado y calzado cerrado completo si decides salir.";
      icon = <Snowflake size={16} className="text-sky-400 animate-pulse" />;
    }

    return { formattedTime, rangeTitle, rangeAdvice, icon };
  };

  const advice = getHourlyAdvice();

  return (
    <div id="generador-view" className="flex flex-col gap-6">
      
      {/* Real-Time Hour Connection Widget Card */}
      <div className="bg-[#fcf7ee] dark:bg-[#251e1a] rounded-3xl p-4.5 border border-[#c4b5a5]/50 shadow-[0_4px_20px_rgba(74,63,53,0.04)] flex items-center gap-4">
        {/* Dynamic Digital Clock Display Badge */}
        <div className="flex flex-col items-center justify-center bg-[#a67c52]/10 p-3 rounded-2xl min-w-[90px] text-center border border-[#a67c52]/20 shadow-inner">
          <span className="text-[9px] uppercase tracking-wider font-mono text-[#a67c52] font-semibold">HORA REAL</span>
          <span className="text-base font-bold font-mono tracking-tight text-[#a67c52]" id="live-time-display">
            {advice.formattedTime}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {advice.icon}
            <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{advice.rangeTitle}</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">
            {advice.rangeAdvice}
          </p>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="bg-gradient-to-br from-[#e8dccc] to-[#f4eadb] dark:from-[#2c221e] dark:to-[#382b24] rounded-3xl p-6 text-center border border-[#c4b5a5] shadow-sm relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-3 opacity-15">
          <Wand2 size={96} className="text-[#a67c52]" />
        </div>
        <h2 className="text-2xl font-bold font-sans tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-2">
          Smart Pick {currentAesthetic} <Sparkles size={20} className="text-[#a67c52] animate-bounce" />
        </h2>
        <p className="text-xs text-gray-700 dark:text-neutral-300 max-w-sm mx-auto mt-2 leading-relaxed">
          Generador de conjuntos estilo <strong className="text-[#a67c52]">{currentAesthetic}</strong> de alta gama. Evita redundancia y prioriza favoritos.
        </p>

        {/* Action button */}
        <button
          onClick={handleGenerate}
          id="btn-generar-look"
          className="mt-5 w-full bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all duration-300 active:scale-98 flex items-center justify-center gap-2.5 text-base md:text-lg cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <Wand2 size={20} />
          Generar nuevo outfit
        </button>
      </div>

      {/* Manual Sliding Seasonal Selector (Slide Switch) */}
      <div className="bg-white/80 dark:bg-[#251e1a]/80 p-4.5 rounded-3xl border border-[#c4b5a5]/50 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Control de Estación</span>
          <span className="text-[10px] font-bold text-[#a67c52] uppercase tracking-wide font-mono bg-[#a67c52]/10 px-2 py-0.5 rounded-full">
            Filtrar Clima
          </span>
        </div>

        {/* SLIDING TOGGLE COMPONENT */}
        <div className="relative w-full h-11 bg-[#e8dccc]/50 dark:bg-[#322722]/60 rounded-xl p-1 flex items-center select-none">
          
          {/* Active moving background pill sliding across the tracks */}
          <div 
            className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out shadow-sm"
            style={{
              width: 'calc(50% - 4px)',
              left: sliderSeason === 'verano' ? '4px' : '50%',
              backgroundColor: sliderSeason === 'verano' ? '#e2cbb0' : '#a67c52',
            }}
          />

          <button
            onClick={() => handleToggleSliderSeason('verano')}
            className={`flex-1 text-center text-xs font-bold rounded-lg h-full z-10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              sliderSeason === 'verano' 
                ? 'text-[#503a27]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sun size={14} className={sliderSeason === 'verano' ? 'text-amber-600' : ''} />
            Verano / Otoño
          </button>

          <button
            onClick={() => handleToggleSliderSeason('invierno')}
            className={`flex-1 text-center text-xs font-bold rounded-lg h-full z-10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              sliderSeason === 'invierno' 
                ? 'text-white' 
                : 'text-gray-500 hover:text-[#a67c52]'
            }`}
          >
            <Snowflake size={14} className={sliderSeason === 'invierno' ? 'text-sky-200 animate-spin-slow' : ''} />
            Invierno / Frío
          </button>
        </div>

        {/* Informative advice label */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 leading-snug">
          <Info size={12} className="shrink-0 text-[#a67c52]" />
          <span>
            {sliderSeason === 'verano' 
              ? 'Se sugieren camisas ligeras y looks frescos con colores neutros acogedores.' 
              : 'Se priorizan abrigos de franela, chaquetas pesadas y bufandas gruesas.'}
          </span>
        </div>
      </div>

      {/* Tab Filter Pills (for fine-granulated season override) */}
      <div className="bg-[#e8dccc]/30 p-4 rounded-3xl border border-[#c4b5a5]/30">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2.5 font-mono">Modo de Algoritmo de Temporada</span>
        <div className="flex flex-wrap gap-1.5">
          {(['Todas', 'Todo el año', 'Invierno', 'Otoño/Primavera', 'Otoño/Invierno'] as const).map(season => {
            const isSelected = seasonFilter === season;
            return (
              <button
                key={season}
                onClick={() => {
                  triggerFeedback();
                  setSeasonFilter(season);
                  // Auto adjust switch if exact item is clicked
                  if (season === 'Invierno') setSliderSeason('invierno');
                  if (season === 'Otoño/Primavera') setSliderSeason('verano');
                }}
                id={`season-pill-${season.replace('/', '-')}`}
                className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#a67c52] text-white border-[#a67c52] shadow-xs'
                    : 'bg-white dark:bg-[#342922] text-gray-700 dark:text-gray-300 border-[#c4b5a5] hover:bg-[#e8dccc]/50'
                }`}
                style={{ minHeight: '32px' }}
              >
                {season}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2D Interactive Mannequin Outfit Simulator */}
      <OutfitSimulator 
        outfit={currentOutfit} 
        onToggleLock={toggleLock}
        lockedSlots={lockedSlots}
        currentAesthetic={currentAesthetic}
        aiSettings={aiSettings}
        onWeatherSync={(detectedSeason) => {
          setSeasonFilter(detectedSeason);
          if (detectedSeason === 'Invierno' || detectedSeason === 'Otoño/Invierno') {
            setSliderSeason('invierno');
          } else {
            setSliderSeason('verano');
          }
        }}
      />

      {/* Main Closet Slots */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">Cápsulas de Prendas</span>
          <span className="text-[11px] text-[#a67c52] flex items-center gap-1">
            <Lock size={12} /> Bloquea para conservar
          </span>
        </div>

        {currentOutfit ? (
          <div className="flex flex-col gap-3">
            {renderSlotCard('Superior (Polera / Camisa)', currentOutfit.superior, 'superior')}
            {renderSlotCard('Pantalones', currentOutfit.pantalones, 'pantalones')}
            {renderSlotCard('Zapatos', currentOutfit.zapatos, 'zapatos')}
            {renderSlotCard('Abrigos / Chaquetas', currentOutfit.abrigo, 'abrigo', true)}
            {renderSlotCard('Accesorios (Bufandas)', currentOutfit.accesorio, 'accesorio', true)}
            {renderSlotCard('Bolsas', currentOutfit.bolsa, 'bolsa', true)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-[#342922]/30 border-2 border-dashed border-[#c4b5a5] rounded-3xl text-center">
            <div className="p-4 bg-[#e8dccc] rounded-full text-[#a67c52] mb-3">
              <Shirt size={28} />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-neutral-200">Aún no hay outfit en pantalla</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">Haga clic en el botón superior para crear una combinación de ensueño.</p>
          </div>
        )}
      </div>

      {/* Recent History Lookups */}
      {historial.length > 0 && (
        <div id="historial-container" className="bg-white/40 dark:bg-[#251e1a]/30 p-5 rounded-3xl border border-[#c4b5a5]/30">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-650 font-mono block mb-3 text-gray-700 dark:text-neutral-350">
            Últimos 7 Outfits Generados
          </span>
          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {historial.slice().reverse().map((out, idx) => {
              const activeLabel = historial.length - idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    triggerFeedback();
                    setCurrentOutfit(out);
                  }}
                  className="p-3 bg-[#fef9ef] dark:bg-[#2c221e]/80 hover:bg-[#e8dccc]/20 dark:hover:bg-[#a67c52]/10 border border-[#c4b5a5]/50 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all duration-150"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-semibold text-gray-800 dark:text-white">Outfit #{activeLabel}</span>
                    <span className="text-gray-500 dark:text-gray-400 truncate text-[11px] mt-0.5">
                      {out.superior.name} + {out.pantalones.name} + {out.zapatos.name}
                      {out.abrigo ? ` + ${out.abrigo.name}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={getColorBlock(out.superior.color)} />
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={getColorBlock(out.pantalones.color)} />
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={getColorBlock(out.zapatos.color)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
