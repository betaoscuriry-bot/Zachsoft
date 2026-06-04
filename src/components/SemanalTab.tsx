import React, { useState } from 'react';
import { Prenda, Outfit, SemanalPlan, DiaSemana } from '../types';
import { generateSmartPick } from '../utils';
import { COLOR_CLASSES_MAP } from '../data';
import { Clipboard, UserCheck, Plus, Shuffle, Trash2, Edit, X, RefreshCw, Layers } from 'lucide-react';

interface SemanalTabProps {
  prendas: Prenda[];
  semanal: SemanalPlan;
  setSemanal: React.Dispatch<React.SetStateAction<SemanalPlan>>;
}

export default function SemanalTab({
  prendas,
  semanal,
  setSemanal
}: SemanalTabProps) {
  const [selectedDay, setSelectedDay] = useState<DiaSemana | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<'superior' | 'pantalones' | 'zapatos' | 'abrigo' | 'accesorio' | 'bolsa' | null>(null);

  const DIAS: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const getColorBlock = (color: string) => {
    const val = COLOR_CLASSES_MAP[color.toLowerCase()] || '#c4b5a5';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  const handleEditClick = (day: DiaSemana) => {
    triggerFeedback();
    setSelectedDay(day);
    setIsModalOpen(true);
    setEditingCategory(null);
  };

  // Bulk replication algorithm
  const handleApplyToWholeWeek = (day: DiaSemana) => {
    triggerFeedback();
    const sourceOutfit = semanal[day];
    if (!sourceOutfit) {
      alert(`Primero debes asignar un outfit al día ${day} para poder replicarlo.`);
      return;
    }

    const confirmRep = window.confirm(`¿Seguro que deseas copiar el outfit del ${day} a todos los demás días de la semana?`);
    if (confirmRep) {
      setSemanal(() => {
        const fullScope: SemanalPlan = {};
        DIAS.forEach(d => {
          fullScope[d] = { ...sourceOutfit };
        });
        return fullScope;
      });
    }
  };

  const handleRandomizeForDay = (day: DiaSemana) => {
    triggerFeedback();
    const generated = generateSmartPick(prendas, {}, 'Todas', []);
    if (generated) {
      setSemanal(prev => ({
        ...prev,
        [day]: generated
      }));
    }
  };

  const handleClearDay = (day: DiaSemana) => {
    triggerFeedback();
    setSemanal(prev => {
      const copy = { ...prev };
      copy[day] = null;
      return copy;
    });
  };

  // Dropdown manual selection helper
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

  const handleSelectPrenda = (category: 'superior' | 'pantalones' | 'zapatos' | 'abrigo' | 'accesorio' | 'bolsa', item: Prenda) => {
    if (!selectedDay) return;
    triggerFeedback();

    const activeOutfit = semanal[selectedDay] || {
      superior: prendas.find(p => p.category === 'Poleras')!,
      pantalones: prendas.find(p => p.category === 'Pantalones')!,
      zapatos: prendas.find(p => p.category === 'Zapatos')!
    };

    const nextOutfit = { ...activeOutfit };
    if (category === 'superior') nextOutfit.superior = item;
    else if (category === 'pantalones') nextOutfit.pantalones = item;
    else if (category === 'zapatos') nextOutfit.zapatos = item;
    else if (category === 'abrigo') nextOutfit.abrigo = item;
    else if (category === 'accesorio') nextOutfit.accesorio = item;
    else if (category === 'bolsa') nextOutfit.bolsa = item;

    setSemanal(prev => ({
      ...prev,
      [selectedDay]: nextOutfit
    }));

    setEditingCategory(null);
  };

  return (
    <div id="semanal-view" className="flex flex-col gap-6">
      {/* Title */}
      <div className="bg-[#e8dccc] dark:bg-[#2d231e] rounded-3xl p-5 border border-[#d4b896]/40 dark:border-[#4a3f35]/50 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 dark:text-white font-sans tracking-tight">Planificador Semanal</h3>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
          Planifica tus outfits de lunes a domingo. Replícalos con un solo toque y organiza tu semana con antelación.
        </p>
      </div>

      {/* Week days list */}
      <div className="flex flex-col gap-4">
        {DIAS.map(day => {
          const outfit = semanal[day];
          return (
            <div
              key={day}
              id={`semanal-card-${day}`}
              className="bg-white dark:bg-[#201a17] rounded-2xl p-4 border border-[#c4b5a5]/40 dark:border-[#4a3f35] shadow-xs hover:shadow-md transition-all duration-350 relative flex flex-col gap-3"
            >
              {/* Card Header information */}
              <div className="flex items-center justify-between border-b border-[#c4b5a5]/20 pb-2.5">
                <span className="text-sm font-bold text-gray-800 dark:text-white tracking-tight">{day}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {outfit && (
                    <button
                      onClick={() => handleApplyToWholeWeek(day)}
                      id={`apply-all-btn-${day}`}
                      title="Copiar look a toda la semana"
                      className="text-[10px] bg-[#e8dccc] dark:bg-[#342a24] hover:bg-[#d4b896] dark:hover:bg-[#43352e] hover:text-white text-[#a67c52] dark:text-[#d4b595] font-semibold tracking-wide py-1 px-2 rounded-lg flex items-center gap-1 transition-all duration-200 cursor-pointer"
                      style={{ minHeight: '32px' }}
                    >
                      <Layers size={11} /> Replicar semana
                    </button>
                  )}
                  <button
                    onClick={() => handleEditClick(day)}
                    id={`edit-semanal-btn-${day}`}
                    className="h-8 w-8 bg-[#e8dccc]/50 dark:bg-[#322722]/60 hover:bg-[#e8dccc] dark:hover:bg-[#43352e] rounded-lg flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] cursor-pointer"
                    style={{ minHeight: '32px', minWidth: '32px' }}
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>

              {/* Card Body information */}
              {outfit ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full border border-[#c4b5a5]/30 shrink-0 inline-block" style={getColorBlock(outfit.superior.color)} />
                    <span className="truncate">Sup: {outfit.superior.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full border border-[#c4b5a5]/30 shrink-0 inline-block" style={getColorBlock(outfit.pantalones.color)} />
                    <span className="truncate">Pant: {outfit.pantalones.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full border border-[#c4b5a5]/35 shrink-0 inline-block" style={getColorBlock(outfit.zapatos.color)} />
                    <span className="truncate">Zap: {outfit.zapatos.name}</span>
                  </div>
                  {outfit.abrigo && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full border border-[#c4b5a5]/35 shrink-0 inline-block" style={getColorBlock(outfit.abrigo.color)} />
                      <span className="truncate">Abr: {outfit.abrigo.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
                  <span className="text-xs text-gray-400">Sin outfit asignado</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleRandomizeForDay(day)}
                      id={`random-semanal-${day}`}
                      className="flex-1 sm:flex-none uppercase font-bold tracking-wider text-[10px] text-gray-500 dark:text-gray-300 bg-[#e8dccc]/30 dark:bg-[#322722]/30 border border-[#c4b5a5]/30 dark:border-[#4a3f35]/50 hover:bg-[#e8dccc]/75 dark:hover:bg-[#43352c]/50 px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      style={{ minHeight: '36px' }}
                    >
                      <Shuffle size={12} /> Smart Pick
                    </button>
                    <button
                      onClick={() => handleEditClick(day)}
                      id={`add-semanal-manual-${day}`}
                      className="flex-1 sm:flex-none uppercase font-bold tracking-wider text-[10px] text-white bg-[#a67c52] hover:bg-[#a67c52]/90 px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      style={{ minHeight: '36px' }}
                    >
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* iOS Modal editor */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-[#111827]/40 dark:bg-black/60 backdrop-blur-md flex items-end justify-center z-50 p-4">
          <div 
            id="ios-semanal-modal"
            className="bg-[#fef9ef] dark:bg-[#221c19] w-full max-w-sm rounded-[32px] border border-[#c4b5a5] dark:border-[#52443b] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto transform scale-100 animate-in slide-in-from-bottom"
          >
            {/* Modal header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-sans tracking-tight">Editar {selectedDay}</h3>
                <span className="text-[10px] text-gray-400 uppercase font-mono block mt-0.5">Plan Semanal</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                id="close-semanal-modal-btn"
                className="h-11 w-11 bg-[#e8dccc]/50 hover:bg-[#e8dccc] dark:bg-[#342a24] dark:hover:bg-[#43352e] rounded-full flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] cursor-pointer"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X size={18} />
              </button>
            </div>

            {editingCategory ? (
              /* Manual Selection items accordion List */
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-[#e8dccc]/30 dark:bg-[#342a24]/30 p-2 rounded-xl border border-[#c4b5a5]/30 dark:border-[#4d3f35]/50">
                  <span className="text-xs font-bold text-gray-800 dark:text-white uppercase font-mono">Listado {editingCategory}</span>
                  <button 
                    onClick={() => setEditingCategory(null)}
                    className="text-xs text-[#a67c52] dark:text-[#d4b896] font-bold hover:underline"
                  >
                    Volver
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {getPrendasByCategory(editingCategory).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPrenda(editingCategory, p)}
                      id={`weekly-select-${p.id}`}
                      className="p-3 bg-white dark:bg-[#1a1513] border border-[#c4b5a5]/50 dark:border-[#4a3f35] hover:bg-[#e8dccc]/10 dark:hover:bg-[#2c221e] rounded-xl flex items-center justify-between text-xs text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-neutral-700 shrink-0" style={getColorBlock(p.color)} />
                        <span className="font-semibold text-gray-800 dark:text-neutral-200 truncate">{p.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 shrink-0 capitalize">{p.season}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Core items list */
              <div className="flex flex-col gap-4">
                {semanal[selectedDay] ? (
                  <div className="flex flex-col gap-2.5">
                    {[
                      { key: 'superior', label: 'Superior', item: semanal[selectedDay]?.superior },
                      { key: 'pantalones', label: 'Pantalón', item: semanal[selectedDay]?.pantalones },
                      { key: 'zapatos', label: 'Zapato', item: semanal[selectedDay]?.zapatos },
                      { key: 'abrigo', label: 'Abrigo', item: semanal[selectedDay]?.abrigo, opt: true },
                      { key: 'accesorio', label: 'Accesorio', item: semanal[selectedDay]?.accesorio, opt: true },
                      { key: 'bolsa', label: 'Bolsa', item: semanal[selectedDay]?.bolsa, opt: true },
                    ].map(slot => (
                      <div
                        key={slot.key}
                        onClick={() => setEditingCategory(slot.key as any)}
                        id={`weekly-slot-btn-${slot.key}`}
                        className="p-3 bg-[#e8dccc]/25 dark:bg-[#322721]/25 hover:bg-[#e8dccc]/45 dark:hover:bg-[#4a3f35]/35 border border-[#c4b5a5]/40 dark:border-[#52443b]/40 rounded-2xl flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {slot.item ? (
                            <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-neutral-750 shrink-0" style={getColorBlock((slot.item as Prenda).color)} />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-350 shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] text-[#a67c52] font-bold uppercase font-mono">{slot.label}</span>
                            <span className="text-gray-800 dark:text-neutral-200 font-medium truncate mt-0.5">
                              {slot.item ? (slot.item as Prenda).name : 'Vacío - toca para agregar'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold font-mono text-gray-400 dark:text-gray-500">EDIT</span>
                      </div>
                    ))}

                    <div className="flex gap-2.5 mt-2">
                      <button
                        onClick={() => handleClearDay(selectedDay)}
                        id="btn-weekly-remove-all"
                        className="flex-1 py-3 text-xs bg-red-50/10 dark:bg-red-950/20 hover:bg-red-100/20 text-red-600 dark:text-red-400 rounded-xl font-bold border border-red-100/50 dark:border-red-900/40 flex items-center justify-center gap-1 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <Trash2 size={13} /> Limpiar Día
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        id="btn-weekly-complete"
                        className="flex-1 py-3 bg-[#a67c52] hover:bg-[#a67c52]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        Cerrar y guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 bg-[#e8dccc]/10 dark:bg-[#3d3028]/10 rounded-2xl border border-dashed border-[#c4b5a5] dark:border-[#4a3f35]/50">
                    <p className="text-xs text-gray-500 mb-4">No hay outfit asignado.</p>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => handleRandomizeForDay(selectedDay)}
                        id="weekly-generate-random"
                        className="w-full bg-[#a67c52] hover:bg-[#a67c52]/90 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <Shuffle size={13} /> Generar estilo "Smart Pick"
                      </button>
                      <button
                        onClick={() => setEditingCategory('superior')}
                        id="weekly-choose-manually"
                        className="w-full bg-[#fef9ef] dark:bg-[#1f1a17] border border-[#c4b5a5] dark:border-[#4a3f35] text-[#a67c52] dark:text-[#d4b896] text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-[#322722]/50 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        Elegir prendas del armario...
                      </button>
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
