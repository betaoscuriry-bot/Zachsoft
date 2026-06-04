import React, { useState } from 'react';
import { Prenda } from '../types';
import { COLOR_CLASSES_MAP } from '../data';
import { Search, ChevronDown, ChevronUp, Star, Filter, Edit3, X, HelpCircle, Save, Plus, Trash2 } from 'lucide-react';
import ArmarioAdiciones from './ArmarioAdiciones';

interface ArmarioTabProps {
  prendas: Prenda[];
  setPrendas: React.Dispatch<React.SetStateAction<Prenda[]>>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setActiveTab?: (tab: 'generador' | 'asistente' | 'chat_ia' | 'calendario' | 'armario' | 'semanal' | 'fuentes') => void;
}

export default function ArmarioTab({
  prendas,
  setPrendas,
  favorites,
  toggleFavorite,
  setActiveTab
}: ArmarioTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>('Poleras');

  // Selected prenda for Detail / Edit modal
  const [selectedPrenda, setSelectedPrenda] = useState<Prenda | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSeason, setEditSeason] = useState<'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' | 'N/A'>('Todo el año');
  const [editLaundry, setEditLaundry] = useState(false);
  const [editTagsStr, setEditTagsStr] = useState('');

  // New item creation form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Prenda['category']>('Poleras');
  const [newColor, setNewColor] = useState('negro');
  const [newSeason, setNewSeason] = useState<Prenda['season']>('Todo el año');

  // Safe delete confirmations to prevent window alerts inside index tabs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  // Categories list
  const CATEGORIAS_LIST: Prenda['category'][] = [
    'Poleras', 'Pantalones', 'Zapatos', 'Abrigos/Chaquetas', 'Camisas', 'Accesorios', 'Bolsas'
  ];

  // Colors list for quick filter
  const COLORES_LIST = [
    'negro', 'blanca', 'beige', 'azul oscuro', 'gris claro', 'rosa', 'azul claro', 'verde oscuro', 'café', 'vino'
  ];

  // Seasons list
  const TEMPORADAS_LIST = ['Todo el año', 'Invierno', 'Otoño/Primavera', 'Otoño/Invierno'];

  // Filter garments in real time
  const filteredPrendas = prendas.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customTags && p.customTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesColor = selectedColor 
      ? p.color.toLowerCase() === selectedColor.toLowerCase() || (selectedColor === 'blanca' && p.color.toLowerCase() === 'blanco')
      : true;

    const matchesSeason = selectedSeason ? p.season === selectedSeason : true;

    return matchesSearch && matchesColor && matchesSeason;
  });

  const getCountByCategory = (cat: string) => {
    return filteredPrendas.filter(p => p.category === cat).length;
  };

  const getColorBlock = (color: string) => {
    const val = COLOR_CLASSES_MAP[color.toLowerCase()] || '#c4b5a5';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  const handleOpenDetail = (prenda: Prenda) => {
    triggerFeedback();
    setSelectedPrenda(prenda);
    setEditName(prenda.name);
    setEditSeason(prenda.season);
    setEditLaundry(prenda.inLaundry || false);
    setEditTagsStr(prenda.customTags ? prenda.customTags.join(', ') : '');
    setEditMode(false);
    setShowDeleteConfirm(false);
  };

  const handleSaveChanges = () => {
    if (!selectedPrenda) return;
    triggerFeedback();

    const parsedTags = editTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updated = prendas.map(p => {
      if (p.id === selectedPrenda.id) {
        return {
          ...p,
          name: editName,
          season: editSeason,
          inLaundry: editLaundry,
          customTags: parsedTags
        };
      }
      return p;
    });

    setPrendas(updated);
    setSelectedPrenda({ 
      ...selectedPrenda, 
      name: editName, 
      season: editSeason,
      inLaundry: editLaundry,
      customTags: parsedTags
    });
    setEditMode(false);
  };

  return (
    <div id="armario-view" className="flex flex-col gap-6">
      {/* 🧸 Sincronizador de catálogos */}
      {setActiveTab && (
        <div className="bg-gradient-to-r from-[#e8dccc]/40 to-white dark:from-[#2d221e]/40 dark:to-[#201a17]/20 rounded-3xl border border-dashed border-[#c4b5a5] dark:border-[#4a3f35] p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[#a67c52] uppercase font-mono tracking-wider">MODO OCR INTEGRADO</span>
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-neutral-150">Importar Catálogos y PDF de Compras</h4>
            <span className="text-[10px] text-gray-500 leading-relaxed max-w-xs mt-0.5 block">
              Sube un recibo en PDF o captura fotos de revistas. Aiko extraerá de forma masiva los colores y siluetas para tu clóset.
            </span>
          </div>
          <button
            type="button"
            onClick={() => { triggerFeedback(); setActiveTab('fuentes'); }}
            className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-bold text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
            style={{ minHeight: '40px' }}
          >
            Sincronizar Fuentes AI
          </button>
        </div>
      )}
      {/* Botón y Formulario interactivo para Añadir Prenda */}
      <div className="bg-white dark:bg-[#201a17] rounded-3xl border border-[#c4b5a5] dark:border-[#4a3f35] p-4 shadow-sm flex flex-col gap-3">
        <button
          onClick={() => { triggerFeedback(); setShowAddForm(!showAddForm); }}
          id="btn-toggle-add-garment-form"
          className="w-full bg-[#a67c52] hover:bg-[#a67c52]/95 text-white py-3.5 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xs cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          {showAddForm ? 'Cerrar Registro de Prenda' : 'Añadir Nueva Prenda a mi Clóset'}
        </button>

        {showAddForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              triggerFeedback();
              const newItem: Prenda = {
                id: `prenda-new-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                name: newName,
                category: newCategory,
                color: newColor,
                season: newSeason,
                isFavorite: false
              };
              setPrendas(prev => [newItem, ...prev]);
              setNewName('');
              setShowAddForm(false);
            }}
            className="flex flex-col gap-3.5 mt-2 p-3 bg-[#fef9ef] dark:bg-[#1a1513] rounded-2xl border border-[#c4b5a5]/30"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a67c52] font-mono">
              Registrar Nueva Prenda
            </h4>

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 font-mono">Nombre de la Prenda</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. polera manga larga de lana mohair"
                className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:border-[#a67c52]"
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Two column grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 font-mono font-bold">Categoría</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as Prenda['category'])}
                  className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-[#a67c52]"
                  style={{ minHeight: '44px' }}
                >
                  {CATEGORIAS_LIST.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Color selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 font-mono font-bold font-semibold">Color dominante</label>
                <select
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-[#a67c52] capitalize"
                  style={{ minHeight: '44px' }}
                >
                  {COLORES_LIST.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                  <option value="gris oscuro">gris oscuro</option>
                  <option value="verde claro">verde claro</option>
                  <option value="amarillo">amarillo</option>
                  <option value="lila">lila</option>
                </select>
              </div>
            </div>

            {/* Season/Weather selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 font-mono font-bold font-semibold">Temporada sugerida</label>
              <select
                value={newSeason}
                onChange={e => setNewSeason(e.target.value as Prenda['season'])}
                className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-[#a67c52]"
                style={{ minHeight: '44px' }}
              >
                {TEMPORADAS_LIST.map(seas => (
                  <option key={seas} value={seas}>{seas}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-1.5 bg-[#a67c52] hover:bg-[#a67c52]/90 text-[#fef9ef] py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <Save size={14} /> Registrar en base de datos
            </button>
          </form>
        )}
      </div>

      {/* Search and filter engine */}
      <div className="bg-[#e8dccc]/60 dark:bg-[#251f1c]/70 p-4 rounded-3xl border border-[#c4b5a5]/40 dark:border-[#4a3f35]/50 flex flex-col gap-3.5 backdrop-blur-xs">
        {/* Real-time input search */}
        <div id="search-box-container" className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por color, prenda o categoría..."
            className="w-full bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-2xl pl-10 pr-4 py-3 text-xs text-gray-800 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:border-[#a67c52] transition-colors"
            style={{ minHeight: '44px' }}
          />
          <Search size={16} className="text-gray-400 absolute left-3.5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono font-bold text-gray-400 absolute right-3 hover:text-gray-600 dark:hover:text-neutral-300 cursor-pointer"
            >
              LIMPIAR
            </button>
          )}
        </div>

        {/* Colors filter bar */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a67c52] font-mono">Filtro por color</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
            <button
              onClick={() => { triggerFeedback(); setSelectedColor(null); }}
              id="color-filter-all"
              className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-200 border cursor-pointer ${
                selectedColor === null 
                  ? 'bg-[#a67c52] text-[#fef9ef] border-[#a67c52]' 
                  : 'bg-white dark:bg-[#251e1a] text-gray-700 dark:text-gray-300 border-[#c4b5a5] dark:border-[#4a3f35] hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              style={{ minHeight: '36px' }}
            >
              Todos
            </button>
            {COLORES_LIST.map(col => {
              const isActive = selectedColor === col;
              return (
                <button
                  key={col}
                  onClick={() => { triggerFeedback(); setSelectedColor(col); }}
                  id={`color-filter-${col}`}
                  className={`shrink-0 flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-medium transition-all duration-200 border cursor-pointer ${
                    isActive 
                      ? 'bg-[#a67c52] text-[#fef9ef] border-[#a67c52]' 
                      : 'bg-white dark:bg-[#251e1a] text-gray-700 dark:text-gray-300 border-[#c4b5a5] dark:border-[#4a3f35] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  <span className="w-3 h-3 rounded-full border border-[#c4b5a5]/30 block" style={getColorBlock(col)} />
                  <span className="capitalize">{col}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seasons filter bar */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a67c52] font-mono">Estación</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
            <button
              onClick={() => { triggerFeedback(); setSelectedSeason(null); }}
              id="season-filter-all"
              className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-medium border cursor-pointer ${
                selectedSeason === null 
                  ? 'bg-[#a67c52] text-[#fef9ef] border-[#a67c52]' 
                  : 'bg-white dark:bg-[#251e1a] text-gray-700 dark:text-gray-300 border-[#c4b5a5] dark:border-[#4a3f35]'
              }`}
              style={{ minHeight: '36px' }}
            >
              Todas
            </button>
            {TEMPORADAS_LIST.map(seas => {
              const isActive = selectedSeason === seas;
              return (
                <button
                  key={seas}
                  onClick={() => { triggerFeedback(); setSelectedSeason(seas); }}
                  id={`season-filter-${seas.replace('/', '-')}`}
                  className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-medium border cursor-pointer ${
                    isActive 
                      ? 'bg-[#a67c52] text-[#fef9ef] border-[#a67c52]' 
                      : 'bg-white dark:bg-[#251e1a] text-gray-700 dark:text-gray-300 border-[#c4b5a5] dark:border-[#4a3f35]'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  {seas}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories Accordions layout */}
      <div className="flex flex-col gap-3">
        {CATEGORIAS_LIST.map(category => {
          const isOpen = openCategory === category;
          const count = getCountByCategory(category);
          const blockGarments = filteredPrendas.filter(p => p.category === category);

          return (
            <div 
              key={category}
              id={`accordion-${category.replace('/', '-')}`}
              className="bg-white dark:bg-[#201a17] rounded-2xl border border-[#c4b5a5] dark:border-[#4a3f35] shadow-xs overflow-hidden transition-all duration-300"
            >
              {/* Accordion header button */}
              <button
                onClick={() => { triggerFeedback(); setOpenCategory(isOpen ? null : category); }}
                className="w-full px-5 py-4 flex items-center justify-between bg-white dark:bg-[#201a17] hover:bg-[#e8dccc]/10 dark:hover:bg-[#2c221e] transition-colors cursor-pointer text-left"
                style={{ minHeight: '52px' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-neutral-100 font-sans tracking-tight">{category}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#e8dccc] dark:bg-[#3d332a] px-2 py-0.5 rounded-full text-[#a67c52] dark:text-[#d4b595]">
                    {count}
                  </span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="border-t border-[#c4b5a5]/10 dark:border-[#4a3f35]/50 p-3 bg-[#fef9ef]/20 dark:bg-[#1a1513]/25 flex flex-col gap-2">
                  {blockGarments.length === 0 ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">No se encontraron prendas con los filtros activos.</p>
                  ) : (
                    blockGarments.map(item => {
                      const isFav = favorites.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          id={`item-card-${item.id}`}
                          className="flex items-center justify-between p-3 bg-white dark:bg-[#241e1b] rounded-xl border border-[#c4b5a5]/30 dark:border-[#4a3f35]/50 hover:border-[#a67c52]/30 dark:hover:border-[#a67c52]/60 hover:shadow-xs transition-all duration-200"
                        >
                          {/* Left item specifics */}
                          <div 
                            onClick={() => handleOpenDetail(item)}
                            className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer flex-1 py-1"
                          >
                            <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-neutral-700 shrink-0" style={getColorBlock(item.color)} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-gray-800 dark:text-white truncate">{item.name}</span>
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-sans mt-0.5 capitalize">
                                {item.color !== 'N/A' ? item.color : ''} • {item.season}
                              </span>
                            </div>
                          </div>

                          {/* Favorite trigger icon indicator */}
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            id={`heart-btn-${item.id}`}
                            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer shrink-0"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                          >
                            <Star 
                              size={16} 
                              className={`transition-all duration-200 ${isFav ? 'text-amber-500 fill-amber-500 scale-110' : 'text-gray-300 dark:text-neutral-600'}`} 
                            />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Advanced integrations and wardrobe statistics bento sections */}
      <ArmarioAdiciones 
        prendas={prendas} 
        setPrendas={setPrendas} 
        triggerFeedback={triggerFeedback} 
      />

      {/* Garment Details / Local editor modal */}
      {selectedPrenda && (
        <div className="fixed inset-0 bg-[#111827]/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-200 animate-in">
          <div 
            id="garment-details-modal"
            className="bg-[#fef9ef] dark:bg-[#221c19] w-full max-w-sm rounded-[28px] border border-[#c4b5a5] dark:border-[#52443b] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-sans tracking-tight">Detalle de Prenda</h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono mt-0.5">Gestión de Armario</span>
              </div>
              <button
                onClick={() => setSelectedPrenda(null)}
                id="close-detail-modal-btn"
                className="h-10 w-10 bg-[#e8dccc]/40 hover:bg-[#e8dccc] dark:bg-[#3c3028] dark:hover:bg-[#524136] rounded-full flex items-center justify-center text-[#a67c52] dark:text-[#d4b896] cursor-pointer"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Display color circle preview */}
            <div className="flex justify-center py-4 bg-[#e8dccc]/20 dark:bg-[#342820]/30 rounded-2xl border border-[#c4b5a5]/30 dark:border-[#52443b]/40">
              <div className="w-16 h-16 rounded-full border-2 border-white dark:border-[#221c19] shadow-md" style={getColorBlock(selectedPrenda.color)} />
            </div>

            {editMode ? (
              /* Editable format fields */
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-404 font-mono">Nombre de la prenda</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-white dark:bg-[#1a1513] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none focus:border-[#a67c52]"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-404 font-mono">Temporada recomendada</label>
                  <select
                    value={editSeason}
                    onChange={e => setEditSeason(e.target.value as any)}
                    className="bg-white dark:bg-[#1a1513] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none focus:border-[#a67c52]"
                    style={{ minHeight: '44px' }}
                  >
                    <option value="Todo el año">Todo el año</option>
                    <option value="Invierno">Invierno</option>
                    <option value="Otoño/Primavera">Otoño/Primavera</option>
                    <option value="Otoño/Invierno">Otoño/Invierno</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-404 font-mono">Etiquetas personalizadas (#tags, sep. por coma)</label>
                  <input
                    type="text"
                    value={editTagsStr}
                    onChange={e => setEditTagsStr(e.target.value)}
                    placeholder="Ej. favorito, formal, vintage"
                    className="bg-white dark:bg-[#1a1513] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none focus:border-[#a67c52]"
                    style={{ minHeight: '38px' }}
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-neutral-300 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editLaundry}
                    onChange={e => setEditLaundry(e.target.checked)}
                    className="rounded border-[#c4b5a5] text-[#a67c52] focus:ring-[#a67c52] h-4.5 w-4.5"
                  />
                  <span>En Lavandería (Prenda Sucia)</span>
                </label>

                <button
                  onClick={handleSaveChanges}
                  id="btn-save-garment-edits"
                  className="w-full bg-[#a67c52] text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#a67c52]/90 cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  <Save size={14} /> Guardar cambios
                </button>
              </div>
            ) : (
              /* Static viewer fields */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/30 dark:border-[#42372e]/85 p-2.5 rounded-xl">
                    <span className="text-[9px] text-[#a67c52] font-bold uppercase block font-mono">Categoría</span>
                    <span className="font-semibold text-gray-800 dark:text-neutral-250 block mt-0.5 truncate">{selectedPrenda.category}</span>
                  </div>
                  <div className="bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/30 dark:border-[#42372e]/85 p-2.5 rounded-xl">
                    <span className="text-[9px] text-[#a67c52] font-bold uppercase block font-mono">Color</span>
                    <span className="font-semibold text-gray-800 dark:text-neutral-250 block mt-0.5 capitalize truncate">{selectedPrenda.color}</span>
                  </div>
                </div>

                <div className="bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/30 dark:border-[#42372e]/85 p-3 rounded-xl">
                  <span className="text-[9px] text-[#a67c52] font-bold uppercase block font-mono">Nombre</span>
                  <span className="font-semibold text-gray-800 dark:text-neutral-100 block mt-1">{selectedPrenda.name}</span>
                </div>

                <div className="bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/30 dark:border-[#42372e]/85 p-3 rounded-xl">
                  <span className="text-[9px] text-[#a67c52] font-bold uppercase block font-mono">Temporada sugerida</span>
                  <span className="font-semibold text-gray-800 dark:text-neutral-100 block mt-1">{selectedPrenda.season}</span>
                </div>

                {/* Advanced statistics report for garments */}
                <div className="bg-[#fef9ef] dark:bg-[#1a1513] border border-[#c4b5a5]/30 dark:border-[#42372e]/85 p-3 rounded-xl text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono uppercase">
                    <span>Reporte de Uso</span>
                    <span>Sinc r.f.</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-[#251e1a] p-2 rounded-lg border border-[#c4b5a5]/20">
                    <span className="text-gray-600 dark:text-neutral-400">Veces que se ha usado:</span>
                    <span className="font-mono font-bold text-[#a67c52]">{selectedPrenda.timesUsed !== undefined ? selectedPrenda.timesUsed : 0} veces</span>
                  </div>
                  {selectedPrenda.inLaundry && (
                    <div className="p-2 bg-blue-150/40 text-blue-800 rounded-lg text-[10.5px] font-bold">
                      🧼 Prenda actualmente en lavandería / Cesto de ropa sucia.
                    </div>
                  )}
                  {selectedPrenda.customTags && selectedPrenda.customTags.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-400 font-mono uppercase">Etiquetas</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrenda.customTags.map(t => (
                          <span key={t} className="text-[9px] font-bold bg-[#e8dccc]/40 dark:bg-neutral-800 text-[#a67c52] dark:text-neutral-300 px-2 py-0.5 rounded-md">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedPrenda.timesUsed === 0 || selectedPrenda.timesUsed === undefined) && (
                    <div className="p-2 bg-red-50 text-red-00 rounded-lg text-[10.5px] border border-red-200">
                      ⚠️ **Consignación sugerida**: Lleva tiempo sin usarse; considera donarla para mantener tu clóset óptimo.
                    </div>
                  )}
                </div>

                {showDeleteConfirm ? (
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-200 dark:border-red-900/40 flex flex-col gap-2.5 mt-1 animate-in duration-200">
                    <span className="text-[11px] text-red-850 dark:text-red-300 font-semibold leading-relaxed">
                      ⚠️ ¿Confirmas eliminar permanentemente esta prenda de tu armario? Esta acción no se puede deshacer.
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { triggerFeedback(); setShowDeleteConfirm(false); }}
                        className="py-2 bg-neutral-250 dark:bg-neutral-800 hover:bg-neutral-300 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-center"
                        style={{ minHeight: '40px' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerFeedback();
                          setPrendas(prev => prev.filter(p => p.id !== selectedPrenda.id));
                          setSelectedPrenda(null);
                        }}
                        className="py-2 bg-red-650 hover:bg-red-700 rounded-xl text-[11px] font-bold text-white cursor-pointer text-center"
                        style={{ minHeight: '40px' }}
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { triggerFeedback(); setEditMode(true); }}
                      id="btn-toggle-garment-edit-mode"
                      className="w-full mt-1 bg-[#e8dccc] dark:bg-[#342a24] hover:bg-[#e8dccc]/90 dark:hover:bg-[#43352e] text-[#a67c52] dark:text-[#d4b896] py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#d4b896]/50 dark:border-[#524339]/50 cursor-pointer"
                      style={{ minHeight: '44px' }}
                    >
                      <Edit3 size={14} /> Editar prenda de forma local
                    </button>

                    <button
                      onClick={() => { triggerFeedback(); setShowDeleteConfirm(true); }}
                      id="btn-trigger-delete"
                      className="w-full bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-350 hover:bg-red-100 dark:hover:bg-red-900/30 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-200/50 cursor-pointer mt-1"
                      style={{ minHeight: '44px' }}
                    >
                      <Trash2 size={13} /> Eliminar prenda definitivamente
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
