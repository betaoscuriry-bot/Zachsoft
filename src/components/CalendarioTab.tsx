import React, { useState } from 'react';
import { Prenda, Outfit, CalendarioOutfits } from '../types';
import { generateSmartPick } from '../utils';
import { COLOR_CLASSES_MAP } from '../data';
import { Calendar, ChevronLeft, ChevronRight, X, Copy, Clipboard, Shuffle, Trash2, Heart, Shirt, CheckCircle } from 'lucide-react';

interface CalendarioTabProps {
  prendas: Prenda[];
  calendario: CalendarioOutfits;
  setCalendario: React.Dispatch<React.SetStateAction<CalendarioOutfits>>;
  copiedOutfit: Outfit | null;
  setCopiedOutfit: (outfit: Outfit | null) => void;
}

export default function CalendarioTab({
  prendas,
  calendario,
  setCalendario,
  copiedOutfit,
  setCopiedOutfit
}: CalendarioTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default June 2026 as per metadata
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manual garment selectors triggers within iOS modal
  const [activeCategorySelect, setActiveCategorySelect] = useState<'superior' | 'pantalones' | 'zapatos' | 'abrigo' | 'accesorio' | 'bolsa' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getStartDayOfWeek = (y: number, m: number) => {
    // 0 = Sunday, 1 = Monday...
    let day = new Date(y, m, 1).getDay();
    // Translate to 0 = Monday, 1 = Tuesday ... 6 = Sunday
    return day === 0 ? 6 : day - 1;
  };

  const daysCount = getDaysInMonth(year, month);
  const startDayOffset = getStartDayOfWeek(year, month);

  // Month names
  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const formatDateKey = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Click day
  const handleDayClick = (dayNum: number) => {
    triggerFeedback();
    const dateStr = formatDateKey(dayNum);
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
    setActiveCategorySelect(null);
  };

  // Get active outfit
  const activeOutfit: Outfit | undefined = selectedDateStr ? calendario[selectedDateStr] : undefined;

  // Save outfit for day
  const saveOutfitForDay = (out: Outfit | null) => {
    if (!selectedDateStr) return;
    setCalendario(prev => {
      const copy = { ...prev };
      if (out) {
        copy[selectedDateStr] = out;
      } else {
        delete copy[selectedDateStr];
      }
      return copy;
    });
  };

  // Generate random complete outfit for selected day
  const handleRandomizeForDay = () => {
    triggerFeedback();
    const generated = generateSmartPick(prendas, {}, 'Todas', []);
    if (generated) {
      saveOutfitForDay(generated);
    }
  };

  // Copy outfit
  const handleCopy = () => {
    if (activeOutfit) {
      triggerFeedback();
      setCopiedOutfit(activeOutfit);
      alert('Outfit copiado al portapapeles de la app');
    }
  };

  // Paste outfit
  const handlePaste = () => {
    if (copiedOutfit && selectedDateStr) {
      triggerFeedback();
      saveOutfitForDay(copiedOutfit);
    }
  };

  const handleClearDay = () => {
    triggerFeedback();
    saveOutfitForDay(null);
  };

  const getColorBlock = (color: string) => {
    const val = COLOR_CLASSES_MAP[color.toLowerCase()] || '#c4b5a5';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  // Filter garments by category for modal selectors
  const getPrendasByCategory = (cat: 'superior' | 'pantalones' | 'zapatos' | 'abrigo' | 'accesorio' | 'bolsa') => {
    if (cat === 'superior') {
      return prendas.filter(p => p.category === 'Poleras' || p.category === 'Camisas');
    } else if (cat === 'pantalones') {
      return prendas.filter(p => p.category === 'Pantalones');
    } else if (cat === 'zapatos') {
      return prendas.filter(p => p.category === 'Zapatos');
    } else if (cat === 'abrigo') {
      return prendas.filter(p => p.category === 'Abrigos/Chaquetas');
    } else if (cat === 'accesorio') {
      return prendas.filter(p => p.category === 'Accesorios');
    } else if (cat === 'bolsa') {
      return prendas.filter(p => p.category === 'Bolsas');
    }
    return [];
  };

  const handleManualSelectPrenda = (category: 'superior' | 'pantalones' | 'zapatos' | 'abrigo' | 'accesorio' | 'bolsa', item: Prenda) => {
    triggerFeedback();
    const baseOutfit: Outfit = activeOutfit || {
      superior: prendas.find(p => p.category === 'Poleras')!,
      pantalones: prendas.find(p => p.category === 'Pantalones')!,
      zapatos: prendas.find(p => p.category === 'Zapatos')!
    };

    const updatedOutfit = { ...baseOutfit };
    if (category === 'superior') updatedOutfit.superior = item;
    else if (category === 'pantalones') updatedOutfit.pantalones = item;
    else if (category === 'zapatos') updatedOutfit.zapatos = item;
    else if (category === 'abrigo') updatedOutfit.abrigo = item;
    else if (category === 'accesorio') updatedOutfit.accesorio = item;
    else if (category === 'bolsa') updatedOutfit.bolsa = item;

    saveOutfitForDay(updatedOutfit);
    setActiveCategorySelect(null);
  };

  return (
    <div id="calendario-view" className="flex flex-col gap-6">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-[#e8dccc] dark:bg-[#2d231e] px-5 py-4 rounded-3xl border border-[#c4b5a5] dark:border-[#4a3f35] shadow-xs">
        <button
          onClick={handlePrevMonth}
          id="btn-prev-month"
          className="h-11 w-11 rounded-full bg-white dark:bg-[#342922] hover:bg-neutral-100 dark:hover:bg-[#43352c] flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] border border-[#c4b5a5]/30 dark:border-[#4a3f35]/50 shadow-xs cursor-pointer"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-base font-bold text-gray-800 dark:text-white font-sans tracking-tight">
            {NOMBRES_MESES[month]} {year}
          </h2>
          <span className="text-[10px] font-mono uppercase font-bold text-[#a67c52] tracking-wider block mt-0.5">
            Calendario outfits
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          id="btn-next-month"
          className="h-11 w-11 rounded-full bg-white dark:bg-[#342922] hover:bg-neutral-100 dark:hover:bg-[#43352c] flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] border border-[#c4b5a5]/30 dark:border-[#4a3f35]/50 shadow-xs cursor-pointer"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid wrapper */}
      <div className="bg-white dark:bg-[#201a17] rounded-3xl p-4 border border-[#c4b5a5] dark:border-[#4a3f35] shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days of month grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Fill blank spacers */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`spacer-${i}`} className="aspect-square bg-transparent rounded-xl" />
          ))}

          {/* Render days */}
          {Array.from({ length: daysCount }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDateKey(dayNum);
            const saved = calendario[dateStr];
            const isToday = new Date().getDate() === dayNum && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
              <button
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                id={`calendar-day-${dayNum}`}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 border relative cursor-pointer group transition-all duration-200 ${
                  isToday 
                    ? 'border-[#a67c52] bg-[#e8dccc]/30 dark:bg-[#342922]/50' 
                    : 'border-[#c4b5a5]/20 dark:border-[#4a3f35]/35 bg-[#fef9ef]/20 dark:bg-[#2c221e]/20 hover:bg-[#e8dccc]/20 dark:hover:bg-[#3d3028]/40'
                }`}
                style={{ minHeight: '44px' }}
              >
                {/* Numeric day */}
                <span className={`text-xs font-bold font-mono ${isToday ? 'text-[#a67c52]' : 'text-gray-700 dark:text-gray-350'}`}>
                  {dayNum}
                </span>

                {/* Status Dot representation */}
                {saved ? (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {/* Tiny dots showing elements colored */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4b896]"></span>
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 bg-transparent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Copy notification status indicator */}
      {copiedOutfit && (
        <div className="bg-[#e8dccc]/50 dark:bg-[#3d332a]/50 border border-[#d4b896]/60 dark:border-[#5a4c3f]/50 rounded-2xl p-3 flex items-center justify-between text-xs text-gray-800 dark:text-neutral-200">
          <span className="flex items-center gap-2">
            <Clipboard size={14} className="text-[#a67c52]" /> Outfit en memoria listo para pegar.
          </span>
          <button 
            onClick={() => setCopiedOutfit(null)} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 text-[11px] font-bold font-mono p-1"
          >
            QUITAR
          </button>
        </div>
      )}

      {/* Dynamic iOS Modal for viewing/editing outfits */}
      {isModalOpen && selectedDateStr && (
        <div className="fixed inset-0 bg-[#111827]/40 dark:bg-black/60 backdrop-blur-md flex items-end justify-center z-50 p-4 transition-all duration-300">
          <div 
            id="ios-calendar-modal"
            className="bg-[#fef9ef] dark:bg-[#221c19] w-full max-w-sm rounded-[32px] border border-[#c4b5a5] dark:border-[#52443b] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300 animate-in slide-in-from-bottom"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-sans tracking-tight">
                  Outfit {selectedDateStr.split('-').reverse().join('/')}
                </h3>
                <span className="text-[10px] text-gray-500 font-mono block uppercase mt-0.5">Detalle del Día</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                id="close-modal-btn"
                className="h-11 w-11 bg-[#e8dccc]/50 hover:bg-[#e8dccc] dark:bg-[#342a24] dark:hover:bg-[#43352e] rounded-full flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] cursor-pointer"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Manual item collection loader drawers */}
            {activeCategorySelect ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-[#e8dccc]/30 dark:bg-[#342a24]/30 p-2.5 rounded-xl border border-[#c4b5a5]/40 dark:border-[#524339]/50 shrink-0">
                  <span className="text-xs font-bold text-gray-800 dark:text-white uppercase font-mono">Elegir {activeCategorySelect}</span>
                  <button 
                    onClick={() => setActiveCategorySelect(null)}
                    className="text-xs text-[#a67c52] dark:text-[#d4b896] font-semibold hover:underline"
                  >
                    Volver
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {getPrendasByCategory(activeCategorySelect).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleManualSelectPrenda(activeCategorySelect, p)}
                      id={`select-prenda-${p.id}`}
                      className="p-3 bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/50 dark:border-[#4a3f35] hover:bg-[#e8dccc]/20 dark:hover:bg-[#2a211d] rounded-xl flex items-center justify-between text-xs text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-neutral-700 shrink-0" style={getColorBlock(p.color)} />
                        <span className="font-medium text-gray-800 dark:text-neutral-200 truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0 capitalize">{p.season}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Regular Modal Actions */
              <div className="flex flex-col gap-4">
                {activeOutfit ? (
                  /* Display Current Day's Outfit */
                  <div className="flex flex-col gap-2.5">
                    {[
                      { key: 'superior', label: 'Superior', item: activeOutfit.superior },
                      { key: 'pantalones', label: 'Pantalones', item: activeOutfit.pantalones },
                      { key: 'zapatos', label: 'Zapatos', item: activeOutfit.zapatos },
                      { key: 'abrigo', label: 'Abrigo', item: activeOutfit.abrigo, opt: true },
                      { key: 'accesorio', label: 'Accesorio', item: activeOutfit.accesorio, opt: true },
                      { key: 'bolsa', label: 'Bolsa', item: activeOutfit.bolsa, opt: true },
                    ].map(slot => (
                      <div 
                        key={slot.key}
                        onClick={() => setActiveCategorySelect(slot.key as any)}
                        id={`modal-slot-trigger-${slot.key}`}
                        className="p-3 bg-[#e8dccc]/25 dark:bg-[#322721]/25 hover:bg-[#e8dccc]/45 dark:hover:bg-[#4a3f35]/35 border border-[#c4b5a5]/40 dark:border-[#52443b]/40 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all duration-150"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {slot.item ? (
                            <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-neutral-750 shrink-0" style={getColorBlock((slot.item as Prenda).color)} />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-250 border border-gray-350 shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-[#a67c52] font-bold uppercase font-mono">{slot.label}</span>
                            <span className="text-gray-800 dark:text-neutral-200 font-medium truncate mt-0.5">
                              {slot.item ? (slot.item as Prenda).name : 'Toque para seleccionar'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono font-bold hover:underline shrink-0 block">Cambiar</span>
                      </div>
                    ))}

                    {/* Clipboard Copy/Remove Block */}
                    <div className="flex gap-2.5 mt-2">
                      <button
                        onClick={handleCopy}
                        id="btn-copy-outfit"
                        className="flex-1 flex items-center justify-center gap-1 bg-[#e8dccc] dark:bg-[#342a24] hover:bg-[#e8dccc]/85 dark:hover:bg-[#4a3c33] text-[#a67c52] dark:text-[#d4b595] py-2.5 rounded-xl text-xs font-semibold border border-[#d4b896] dark:border-[#524239]/60 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <Copy size={14} /> Copiar
                      </button>

                      <button
                        onClick={handleClearDay}
                        id="btn-clear-day-outfit"
                        className="w-[44px] bg-red-50/10 dark:bg-red-950/20 hover:bg-red-100/20 text-red-600 dark:text-red-450 rounded-xl flex items-center justify-center border border-red-200/50 dark:border-red-900/40 cursor-pointer"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Outfit day */
                  <div className="flex flex-col items-center justify-center p-8 bg-[#e8dccc]/10 dark:bg-[#3d3028]/10 rounded-3xl border border-dashed border-[#c4b5a5] dark:border-[#4a3f35]/50">
                    <p className="text-xs font-medium text-gray-500 text-center mb-4">No hay un outfit asignado a este día.</p>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={handleRandomizeForDay}
                        id="btn-gen-random-day"
                        className="w-full bg-[#a67c52] hover:bg-[#a67c52]/90 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <Shuffle size={14} /> Generar estilo "Smart Pick"
                      </button>
                      <button
                        onClick={() => setActiveCategorySelect('superior')}
                        id="btn-manually-choose-day"
                        className="w-full bg-[#fef9ef] dark:bg-[#1f1a17] border border-[#c4b5a5] dark:border-[#4d3f35]/80 text-[#a67c52] dark:text-[#d4b896] text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-[#3c2f28]/40 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <Shirt size={14} /> Elegir prendas manualmente...
                      </button>
                      {copiedOutfit && (
                        <button
                          onClick={handlePaste}
                          id="btn-paste-day"
                          className="w-full bg-[#d4b896] hover:bg-[#d4b896]/95 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          style={{ minHeight: '44px' }}
                        >
                          <Clipboard size={14} /> Pegar outfit copiado
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
