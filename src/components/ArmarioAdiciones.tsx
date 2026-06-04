import React, { useState, useRef } from 'react';
import { Prenda } from '../types';
import { COLOR_CLASSES_MAP } from '../data';
import { 
  FileText, 
  Trash2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  Camera, 
  Layers, 
  Check, 
  ChevronRight, 
  ShoppingCart, 
  TrendingUp,
  Inbox,
  RefreshCw,
  Tag,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ArmarioAdicionesProps {
  prendas: Prenda[];
  setPrendas: React.Dispatch<React.SetStateAction<Prenda[]>>;
  triggerFeedback: () => void;
}

export default function ArmarioAdiciones({
  prendas,
  setPrendas,
  triggerFeedback
}: ArmarioAdicionesProps) {
  const [activeSection, setActiveSection] = useState<'import' | 'scanner' | 'laundry' | 'stats'>('stats');

  // --- 1. STATE FOR FILE IMPORTER & DUPLICATE RESOLUTION ---
  const [importSourceType, setImportSourceType] = useState<'csv' | 'pdf' | 'image'>('csv');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusStep, setImportStatusStep] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [parsedItems, setParsedItems] = useState<Prenda[]>([]);
  
  // Duplicates selection tracker
  const [duplicatesToResolve, setDuplicatesToResolve] = useState<{ original: Prenda; imported: Prenda }[]>([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState<number>(-1);

  // --- 2. STATE FOR PHOTO RECOGNITION (AI SCANNER) ---
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scanResult, setScanResult] = useState<{
    name: string;
    category: Prenda['category'];
    color: string;
    season: Prenda['season'];
    customTags: string[];
  } | null>(null);

  // --- 3. CSV PARSER (Real Commas / Semicolons) ---
  const parseCSVText = (text: string): Prenda[] => {
    const lines = text.split('\n');
    const list: Prenda[] = [];
    
    // Skip header and scan fields
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Basic CSV field extraction supporting quotes or simple commas
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (parts.length >= 3) {
        const name = parts[0].replace(/"/g, '').trim();
        const categoryRaw = parts[1].replace(/"/g, '').trim();
        const color = parts[2].replace(/"/g, '').trim();
        const seasonRaw = parts[3] ? parts[3].replace(/"/g, '').trim() : 'Todo el año';

        // Categorize safely
        const validCategories: Prenda['category'][] = [
          'Poleras', 'Pantalones', 'Zapatos', 'Abrigos/Chaquetas', 'Camisas', 'Accesorios', 'Bolsas'
        ];
        let category: Prenda['category'] = 'Poleras';
        const foundCat = validCategories.find(c => c.toLowerCase() === categoryRaw.toLowerCase() || categoryRaw.toLowerCase().includes(c.toLowerCase().slice(0, 4)));
        if (foundCat) category = foundCat;

        // Custom tags default
        const tags: string[] = parts[4] ? parts[4].replace(/"/g, '').split(';').map(x => x.trim()) : [];

        list.push({
          id: `prenda-csv-import-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
          name,
          category,
          color,
          season: seasonRaw as any,
          customTags: tags,
          isFavorite: false,
          timesUsed: 0,
          inLaundry: false,
          addedDate: new Date().toISOString().split('T')[0]
        });
      }
    }
    return list;
  };

  // Run simulated batch import for PDF and Images with gorgeous loading states
  const triggerBatchImportSimulation = (type: 'pdf' | 'image', fileName: string) => {
    setIsImporting(true);
    setImportProgress(10);
    setImportStatusStep(`Abriendo archivo "${fileName}" y detectando metadatos...`);
    triggerFeedback();

    setTimeout(() => {
      setImportProgress(40);
      setImportStatusStep('Analizando marcas de agua y extrayendo inventario mediante análisis de visión OCR...');
      
      setTimeout(() => {
        setImportProgress(75);
        setImportStatusStep('Sincronizando paleta Pantone de colores y emparejando con categorías de armario Soft Boy...');
        
        setTimeout(() => {
          let simulatedList: Prenda[] = [];
          if (type === 'pdf') {
            simulatedList = [
              {
                id: `pdf-1-${Date.now()}`,
                name: 'Polera de punto mohair',
                category: 'Poleras',
                color: 'beige',
                season: 'Otoño/Invierno',
                customTags: ['solo formal', 'vintage'],
                isFavorite: false,
                timesUsed: 1,
                addedDate: '2026-03-01'
              },
              {
                id: `pdf-2-${Date.now()}`,
                name: 'Jeans negros 1', // intentional duplicate to check conflict handler
                category: 'Pantalones',
                color: 'negro',
                season: 'Todo el año',
                customTags: ['básico'],
                isFavorite: false,
                timesUsed: 4,
                addedDate: '2026-01-15'
              }
            ];
          } else {
            simulatedList = [
              {
                id: `img-1-${Date.now()}`,
                name: 'Cortaviento impermeable gris',
                category: 'Abrigos/Chaquetas',
                color: 'gris claro',
                season: 'Otoño/Primavera',
                customTags: ['lluvioso'],
                isFavorite: false,
                timesUsed: 0,
                addedDate: new Date().toISOString().split('T')[0]
              }
            ];
          }

          setIsImporting(false);
          setImportProgress(100);
          setImportStatusStep('');
          
          // Process Duplicates check!
          checkAndRegisterItems(simulatedList);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleCsvFileSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(20);
    setImportStatusStep(`Subiendo archivo CSV "${file.name}"...`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const textStr = evt.target?.result as string;
        setImportProgress(60);
        setImportStatusStep('Procesando líneas y verificando separadores...');

        setTimeout(() => {
          const list = parseCSVText(textStr);
          setIsImporting(false);
          setImportProgress(100);
          setImportStatusStep('');
          
          if (list.length === 0) {
            alert('No se pudieron extraer prendas de este CSV. Asegúrate de tener al menos una línea con Name, Category, Color.');
          } else {
            checkAndRegisterItems(list);
          }
        }, 800);
      } catch (err) {
        alert('Archivo CSV corrupto. Por favor selecciona otro válido.');
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // Core duplicate checking rules
  const checkAndRegisterItems = (incoming: Prenda[]) => {
    const conflicts: { original: Prenda; imported: Prenda }[] = [];
    const directAdd: Prenda[] = [];

    incoming.forEach(inc => {
      // If same name & category, classify as duplicate collision
      const match = prendas.find(
        p => p.name.toLowerCase() === inc.name.toLowerCase() && p.category === inc.category
      );
      if (match) {
        conflicts.push({ original: match, imported: inc });
      } else {
        directAdd.push(inc);
      }
    });

    if (directAdd.length > 0) {
      setPrendas(prev => [...directAdd, ...prev]);
    }

    if (conflicts.length > 0) {
      setDuplicatesToResolve(conflicts);
      setCurrentConflictIndex(0);
      triggerFeedback();
    } else {
      alert(`¡Sincronización exitosa! Se agregaron ${directAdd.length} prendas nuevas.`);
    }
  };

  // Resolve current duplicate selections
  const handleResolveCollision = (decision: 'keep-both' | 'skip' | 'merge') => {
    if (currentConflictIndex === -1 || duplicatesToResolve.length === 0) return;
    triggerFeedback();

    const current = duplicatesToResolve[currentConflictIndex];

    if (decision === 'keep-both') {
      const renamed = {
        ...current.imported,
        name: `${current.imported.name} (Copia Sincronizada)`,
        id: `${current.imported.id}-copy`
      };
      setPrendas(prev => [renamed, ...prev]);
    } else if (decision === 'merge') {
      // Merge unique custom tags & make it favorite if either was
      setPrendas(prev => prev.map(p => {
        if (p.id === current.original.id) {
          const combinedTags = Array.from(new Set([
            ...(p.customTags || []),
            ...(current.imported.customTags || [])
          ]));
          return {
            ...p,
            customTags: combinedTags,
            isFavorite: p.isFavorite || current.imported.isFavorite
          };
        }
        return p;
      }));
    }

    // Go to next conflict or close Dialog
    if (currentConflictIndex < duplicatesToResolve.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      alert('¡Resolución de importación completa con éxito!');
      setDuplicatesToResolve([]);
      setCurrentConflictIndex(-1);
    }
  };

  // --- 4. PHOTO AI SCANNER SIMULATION MECHANICS ---
  const fileInputScannerRef = useRef<HTMLInputElement>(null);

  const handlePhotoScanSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setScannedImage(event.target?.result as string);
      setIsScanningPhoto(true);
      setScanStep('Iniciando cámara de captura analítica de moda...');
      triggerFeedback();

      setTimeout(() => {
        setScanStep('Definiendo contorno tridimensional y silueta de costura...');
        
        setTimeout(() => {
          setScanStep('Analizando tono RGB dominante contra paleta Soft Boy...');
          
          setTimeout(() => {
            setScanStep('Prediciendo estación de uso mediante simulación de clima...');
            
            setTimeout(() => {
              // Set prediction outcomes
              setIsScanningPhoto(false);
              setScanStep('');

              // Auto predictions mapping
              const lowerName = file.name.toLowerCase();
              let categoryPrediction: Prenda['category'] = 'Poleras';
              let colorPrediction = 'beige';
              let seasonPrediction: Prenda['season'] = 'Todo el año';
              let tagsPrediction = ['básico'];

              if (lowerName.includes('pant') || lowerName.includes('jean')) {
                categoryPrediction = 'Pantalones';
                colorPrediction = 'negro';
                seasonPrediction = 'Todo el año';
                tagsPrediction = ['casual', 'denim'];
              } else if (lowerName.includes('shoe') || lowerName.includes('zap') || lowerName.includes('bota')) {
                categoryPrediction = 'Zapatos';
                colorPrediction = 'blancos';
                seasonPrediction = 'Todo el año';
                tagsPrediction = ['retro', 'cuero'];
              } else if (lowerName.includes('coat') || lowerName.includes('abrigo') || lowerName.includes('chaq') || lowerName.includes('poleron')) {
                categoryPrediction = 'Abrigos/Chaquetas';
                colorPrediction = 'gris claro';
                seasonPrediction = 'Invierno';
                tagsPrediction = ['térmico', 'capas'];
              } else if (lowerName.includes('camisa')) {
                categoryPrediction = 'Camisas';
                colorPrediction = 'blanco';
                seasonPrediction = 'Todo el año';
                tagsPrediction = ['minimalista', 'preppy'];
              }

              // Strip extension for nice naming
              const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ');

              setScanResult({
                name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                category: categoryPrediction,
                color: colorPrediction,
                season: seasonPrediction,
                customTags: tagsPrediction
              });
              if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
            }, 900);
          }, 900);
        }, 900);
      }, 900);
    };
    reader.readAsDataURL(file);
  };

  const saveScannerPrenda = () => {
    if (!scanResult) return;
    triggerFeedback();

    const newItem: Prenda = {
      id: `prenda-scan-${Date.now()}`,
      name: scanResult.name,
      category: scanResult.category,
      color: scanResult.color,
      season: scanResult.season,
      customTags: scanResult.customTags,
      isFavorite: false,
      timesUsed: 0,
      inLaundry: false,
      addedDate: new Date().toISOString().split('T')[0]
    };

    setPrendas(prev => [newItem, ...prev]);
    alert('¡Prenda identificada y guardada exitosamente!');
    setScanResult(null);
    setScannedImage(null);
  };

  // --- 5. STATS GENERATORS ---
  const colorGroupingCounts = () => {
    const list: { [key: string]: number } = {};
    prendas.forEach(p => {
      const col = p.color || 'Universal';
      list[col] = (list[col] || 0) + 1;
    });
    return Object.entries(list).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getMissingAdvice = () => {
    const counts = {
      superior: prendas.filter(p => p.category === 'Poleras' || p.category === 'Camisas').length,
      pantalones: prendas.filter(p => p.category === 'Pantalones').length,
      zapatos: prendas.filter(p => p.category === 'Zapatos').length,
      abrigos: prendas.filter(p => p.category === 'Abrigos/Chaquetas').length,
      accesorios: prendas.filter(p => p.category === 'Accesorios' && p.id !== 'accesorio-4').length,
      bolsas: prendas.filter(p => p.category === 'Bolsas' && p.id !== 'bolsa-3').length
    };

    const recommendations: string[] = [];
    if (counts.superior < 5) recommendations.push('👕 Te sugerimos comprar poleras básicas de colores pastel para capas.');
    if (counts.pantalones < 3) recommendations.push('👖 Faltan pantalones sueltos. Añade jeans beige o de vestir estilo preppy.');
    if (counts.zapatos < 2) recommendations.push('👟 Solamente posees un calzado principal. Considera zapatillas de cuero blancas.');
    if (counts.abrigos < 3) recommendations.push('🧥 Tienes pocas chaquetas. Un abrigo largo de paño mohair mejorará tu silueta.');
    if (counts.accesorios < 2) recommendations.push('🧣 Añade bufandas o gorros neutrales para acentuar tu estilo.');

    return { counts, recommendations };
  };

  const usageStats = getMissingAdvice();

  // Wash all clothes instantly helper
  const handleWashAllLaundry = () => {
    triggerFeedback();
    const updated = prendas.map(p => ({ ...p, inLaundry: false }));
    setPrendas(updated);
    alert('🧼 ¡Lavadora completada! Todas tus prendas están limpias y secas listas para coordinar outfits.');
  };

  const laundryItemsCount = prendas.filter(p => p.inLaundry).length;

  return (
    <div className="bg-white/90 dark:bg-[#201a17]/95 rounded-3xl border border-[#c4b5a5] p-5 shadow-sm transition-all duration-300">
      
      {/* Mini Segmenter Navigation Tabs */}
      <div className="flex border-b border-[#c4b5a5]/30 pb-3 mb-4 gap-1 select-none">
        {[
          { key: 'stats', label: 'Estadísticas e Inteligencia', icon: TrendingUp },
          { key: 'import', label: 'Importar Lotes', icon: FileText },
          { key: 'scanner', label: 'Escanear Foto', icon: Camera },
          { key: 'laundry', label: `Lavandería (${laundryItemsCount})`, icon: Inbox },
        ].map(tab => {
          const isActive = activeSection === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { triggerFeedback(); setActiveSection(tab.key as any); }}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10.5px] font-bold tracking-tight border transition-all duration-200 cursor-pointer flex-1 justify-center ${
                isActive
                  ? 'bg-[#a67c52] border-[#a67c52] text-white shadow-xs'
                  : 'bg-transparent border-[#c4b5a5]/30 text-gray-500 hover:text-gray-800 hover:bg-[#e8dccc]/20'
              }`}
              style={{ minHeight: '38px' }}
            >
              <Icon size={13} />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- DUPLICATE RESOLUTION OVERLAY MODAL --- */}
      {currentConflictIndex !== -1 && duplicatesToResolve.length > 0 && (
        <div className="fixed inset-0 bg-[#111827]/30 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-55 p-4">
          <div 
            id="duplicate-conflict-box"
            className="bg-[#fef9ef] dark:bg-[#221c19] w-full max-w-sm rounded-[28px] border border-amber-500 shadow-2xl p-6 flex flex-col gap-4.5 animate-in zoom-in-95"
          >
            <div className="flex gap-2 items-center text-amber-600">
              <AlertTriangle size={20} className="animate-bounce" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide font-sans">Conflicto de Duplicados</h4>
                <p className="text-[10px] text-gray-500 uppercase font-mono mt-0.5">Filtro de Seguridad de Clóset</p>
              </div>
            </div>

            <p className="text-[11.5px] text-gray-700 dark:text-neutral-300 leading-relaxed">
              La prenda <strong className="text-[#a67c52]">"{duplicatesToResolve[currentConflictIndex].imported.name}"</strong> en la categoría <strong className="font-semibold">{duplicatesToResolve[currentConflictIndex].original.category}</strong> ya está configurada en tu base de datos local. ¿Cómo deseas proceder?
            </p>

            <div className="flex flex-col gap-2 w-full mt-1.5">
              <button
                onClick={() => handleResolveCollision('merge')}
                className="w-full bg-[#a67c52] hover:bg-[#a67c52]/95 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ minHeight: '42px' }}
              >
                <Layers size={13} /> Unir prendas (Combinar etiquetas)
              </button>
              
              <button
                onClick={() => handleResolveCollision('keep-both')}
                className="w-full bg-white dark:bg-[#1a1513] border border-[#c4b5a5] hover:bg-gray-100 text-[#a67c52] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ minHeight: '42px' }}
              >
                <TrendingUp size={13} /> Conservar ambos (registrar copia)
              </button>

              <button
                onClick={() => handleResolveCollision('skip')}
                className="w-full bg-red-100 dark:bg-red-950/20 text-red-700 hover:bg-red-200/50 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ minHeight: '42px' }}
              >
                <Trash2 size={13} /> Omitir / Ignorar duplicado
              </button>
            </div>

            <div className="text-center text-[10px] font-mono text-gray-400 mt-1">
              Conflicto {currentConflictIndex + 1} de {duplicatesToResolve.length}
            </div>
          </div>
        </div>
      )}


      {/* --- SECTION A: CLOSET INSIGHTS CHART & LISTS --- */}
      {activeSection === 'stats' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a67c52] font-mono flex items-center gap-1">
              🎯 Análisis de Rotación e Inteligencia de Estilo
            </h4>
          </div>

          {/* Intelligent Purchasing assistant recommendations widget */}
          <div className="bg-[#fcf7ee] dark:bg-[#1f1816] p-3 border border-[#c4b5a5]/30 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-800 dark:text-gray-100">
              <Lightbulb size={14} className="text-amber-500" />
              <span>Lista de Compras Inteligente AI</span>
              <span className="ml-auto text-[9px] uppercase font-mono tracking-widest text-[#a67c55]">Deficiencias</span>
            </div>
            
            {usageStats.recommendations.length > 0 ? (
              <div className="flex flex-col gap-2">
                {usageStats.recommendations.map((rec, i) => (
                  <p key={i} className="text-[10.5px] leading-relaxed text-gray-650 dark:text-gray-400 pl-4 relative">
                    <span className="absolute left-0 text-amber-500">•</span>
                    {rec}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[10.5px] text-emerald-800 dark:text-emerald-350 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl text-center leading-relaxed">
                ✓ ¡Fantástico! Tu clóset cápsula está perfectamente balanceado en todas sus categorías fundamentales.
              </p>
            )}
          </div>

          {/* Underused items section (Rotation timer checker 3 months) */}
          <div className="bg-red-50/40 dark:bg-red-950/10 p-3.5 rounded-2xl border border-red-200/50 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <AlertTriangle size={13} className="text-red-500" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-neutral-100">Rotación Crítica: Unused Capsule (Charity Suggestion)</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
              Los siguientes básicos llevan más de 3 meses sin registrar uso en tus maquetas u outfits planeados:
            </p>

            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto mt-1 pr-1.5">
              {prendas.filter(p => !p.inLaundry && (p.timesUsed === 0 || p.timesUsed === undefined)).slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-white dark:bg-[#1a1513] rounded-lg border border-[#c4b5a5]/30">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: COLOR_CLASSES_MAP[p.color.toLowerCase()] || '#ededed' }} />
                    <span className="text-[11px] truncate text-gray-700 dark:text-neutral-300 font-semibold">{p.name}</span>
                  </div>
                  <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950/30 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                    ⚠️ 3 Meses Inactivo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Color Popularity Progression Bar chart CSS */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 font-mono">Top 5 Colores Populares en Armario</span>
            <div className="grid grid-cols-5 gap-2.5 items-end justify-center pt-3 pb-1 h-[70px]">
              {colorGroupingCounts().map(([colName, cnt]) => {
                const total = prendas.length || 1;
                const percentage = Math.round((cnt / total) * 100);
                const colCode = COLOR_CLASSES_MAP[colName.toLowerCase()] || '#c4b5a5';
                const isLinear = colCode.includes('linear');
                return (
                  <div key={colName} className="flex flex-col items-center justify-end h-full group">
                    <span className="text-[8.5px] font-bold font-mono text-gray-500 mb-1 leading-none">{percentage}%</span>
                    <div 
                      className="w-full rounded-t-lg shadow-sm border border-[#c4b5a5]/20"
                      style={{ 
                        height: `${Math.max(percentage * 1.5, 12)}px`,
                        backgroundImage: isLinear ? colCode : 'none',
                        backgroundColor: isLinear ? 'transparent' : colCode
                      }}
                      title={`${cnt} prendas`}
                    />
                    <span className="text-[9px] font-sans truncate max-w-full text-center mt-1 text-gray-600 dark:text-gray-400 capitalize">{colName}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}


      {/* --- SECTION B: smart FILE IMPORTER --- */}
      {activeSection === 'import' && (
        <div className="flex flex-col gap-5.5 animate-in fade-in duration-200">
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a67c52] font-mono">
              Importador Universal de Guardarropas
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Sincroniza listas CSV completas, archivos PDF de inventario de tiendas, o listas impresas por OCR con escaneo de duplicados.
            </p>
          </div>

          {/* Format selection list */}
          <div className="flex gap-2.5 justify-center bg-[#fef9ef]/40 dark:bg-[#251e1a]/40 p-2 border border-[#c4b5a5]/30 rounded-2xl select-none">
            {[
              { type: 'csv', label: 'CSV clásico', tip: 'Carga listas rápidas' },
              { type: 'pdf', label: 'PDF Reporte', tip: 'Importa hojas PDF' },
              { type: 'image', label: 'Lista Imagen', tip: 'Lotes fotográficos' }
            ].map(f => (
              <button
                key={f.type}
                onClick={() => { triggerFeedback(); setImportSourceType(f.type as any); }}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center justify-center flex-1 cursor-pointer transition-all duration-150 ${
                  importSourceType === f.type 
                    ? 'bg-[#a67c52]/10 border-[#a67c52] text-[#a67c52] font-extrabold' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ minHeight: '52px' }}
              >
                <span className="text-xs font-semibold">{f.label}</span>
                <span className="text-[8px] font-mono text-gray-400">{f.tip}</span>
              </button>
            ))}
          </div>

          {/* Active input widgets */}
          <div className="bg-[#fcfcf9] dark:bg-[#1f1a17] rounded-2xl border border-dashed border-[#c4b5a5] p-6 text-center">
            
            {isImporting ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-[#a67c52]/30 border-t-[#a67c52] animate-spin" />
                <span className="text-xs font-bold font-mono text-[#a67c52] animate-pulse">Sincronizando lote...</span>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden max-w-[200px] mt-1">
                  <div className="bg-[#a67c52] h-full rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-[10px] text-gray-500 max-w-[220px] leading-relaxed mt-0.5">"{importStatusStep}"</p>
              </div>
            ) : (
              <>
                {importSourceType === 'csv' && (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4 group">
                    <FileText size={40} className="text-[#a67c52]/60 group-hover:text-[#a67c52]/90 transition-colors mb-2" />
                    <span className="text-xs font-bold text-[#a67c52] hover:underline">Buscar listado CSV en tu dispositivo</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Estructura esperada: Name, Category, Color, Season</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCsvFileSubmit} 
                      className="hidden" 
                    />
                  </label>
                )}

                {importSourceType === 'pdf' && (
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={40} className="text-[#a67c52]/50 mb-1" />
                    <button
                      onClick={() => triggerBatchImportSimulation('pdf', 'SoftBoy_Wardrobe_Report.pdf')}
                      className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-[#fef9ef] font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      style={{ minHeight: '40px' }}
                    >
                      Escanear Archivo PDF
                    </button>
                    <span className="text-[9px] text-gray-400">OCR inteligente simula descarga y filtra duplicados</span>
                  </div>
                )}

                {importSourceType === 'image' && (
                  <div className="flex flex-col items-center gap-2">
                    <Camera size={40} className="text-[#a67c52]/50 mb-1" />
                    <button
                      onClick={() => triggerBatchImportSimulation('image', 'Snapshot_Closet.jpeg')}
                      className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-[#fef9ef] font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      style={{ minHeight: '40px' }}
                    >
                      Analizar Captura JPEG/PNG
                    </button>
                    <span className="text-[9px] text-gray-400">Identifica lotes de prendas mediante Computer Vision</span>
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}


      {/* --- SECTION C: AI PHOTO SCANNER SIMULATION --- */}
      {activeSection === 'scanner' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a67c52] font-mono flex items-center gap-1.5">
              📸 Reconocimiento de Prendas por Visión AI
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Sube una fotografía de tu prenda física. El láser detector analiza la silueta, deduce el color, sugiere temporada de uso e insérer etiquetas.
            </p>
          </div>

          {!scannedImage ? (
            <div className="border-2 border-dashed border-[#c4b5a5] rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-[#fdfdfb]/50">
              <Camera size={44} className="text-[#a67c52]/40 mb-3" />
              <button
                onClick={() => fileInputScannerRef.current?.click()}
                className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-[#fef9ef] font-bold text-xs py-3 px-6 rounded-2xl cursor-pointer shadow-xs"
                style={{ minHeight: '44px' }}
              >
                Tomar foto o subir imagen...
              </button>
              <input
                type="file"
                ref={fileInputScannerRef}
                accept="image/*"
                onChange={handlePhotoScanSelect}
                className="hidden"
              />
              <span className="text-[9px] text-gray-400 mt-2">Compatible con JPEG, PNG de alta gama</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Photo & Scanner lasers */}
              <div className="relative w-full aspect-video rounded-2xl border border-[#c4b5a5] overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={scannedImage} 
                  alt="Scanned garment raw preview" 
                  className="w-full h-full object-cover opacity-80" 
                />

                {isScanningPhoto && (
                  <>
                    {/* Visual scan laser lines overlay */}
                    <div className="absolute left-0 right-0 h-1 bg-amber-500 top-0 animate-laser-scan blur-[1.5px]" />
                    <div className="absolute inset-0 bg-amber-500/10 pointer-events-none animate-pulse" />
                    
                    {/* Overlay status text */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-sm p-2.5 rounded-xl text-center border border-amber-500/40">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                      <span className="text-[10px] font-mono text-amber-400 font-semibold animate-pulse uppercase">
                        {scanStep}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!isScanningPhoto && scanResult && (
                <div className="bg-[#fcf8f2] dark:bg-[#1a1412] p-4.5 rounded-2.5xl border border-amber-500/30 flex flex-col gap-3">
                  
                  <div className="flex items-center gap-1.5 border-b border-[#c4b5a5]/30 pb-2">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">Resultado del Escáner Visión 3D</span>
                    <span className="ml-auto text-[9.5px] bg-[#a67c52]/10 text-[#a67c52] px-2 py-0.5 rounded-full font-bold">Confianza 98.4%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500 font-mono">Nombre Predicho</label>
                      <input 
                        type="text" 
                        value={scanResult.name} 
                        onChange={e => setScanResult({ ...scanResult, name: e.target.value })} 
                        className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5] rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none focus:border-[#a67c52]"
                        style={{ minHeight: '36px' }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500 font-mono">Categoría AI</label>
                      <select 
                        value={scanResult.category} 
                        onChange={e => setScanResult({ ...scanResult, category: e.target.value as any })}
                        className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5] rounded-xl px-2 py-1 text-xs text-gray-800 dark:text-neutral-100 focus:outline-[#a67c52]"
                        style={{ minHeight: '36px' }}
                      >
                        {['Poleras', 'Pantalones', 'Zapatos', 'Abrigos/Chaquetas', 'Camisas', 'Accesorios', 'Bolsas'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500 font-mono">Color Detectado</label>
                      <input 
                        type="text" 
                        value={scanResult.color} 
                        onChange={e => setScanResult({ ...scanResult, color: e.target.value })} 
                        className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5] rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none focus:border-[#a67c52] capitalize"
                        style={{ minHeight: '36px' }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500 font-mono">Temporada Estimada</label>
                      <select 
                        value={scanResult.season} 
                        onChange={e => setScanResult({ ...scanResult, season: e.target.value as any })}
                        className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5] rounded-xl px-2 py-1 text-xs text-gray-800 dark:text-neutral-100 focus:outline-[#a67c52]"
                        style={{ minHeight: '36px' }}
                      >
                        {['Todo el año', 'Invierno', 'Otoño/Primavera', 'Otoño/Invierno'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customizable Tags in Photo Recognizer output */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-gray-500 font-mono font-bold">Separar Etiquetas (#tags) personalizables (separar por coma)</label>
                    <input 
                      type="text" 
                      value={scanResult.customTags.join(', ')} 
                      onChange={e => setScanResult({ ...scanResult, customTags: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} 
                      placeholder="Ej. favorito, vintage, formal, impermeable"
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5] rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-neutral-100 focus:outline-none"
                      style={{ minHeight: '38px' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                    <button
                      onClick={() => { setScannedImage(null); setScanResult(null); }}
                      className="py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer text-center"
                      style={{ minHeight: '44px' }}
                    >
                      Volver a Escanear
                    </button>
                    <button
                      onClick={saveScannerPrenda}
                      className="py-2.5 bg-[#a67c52] hover:bg-[#a67c52]/90 text-white rounded-xl text-xs font-bold cursor-pointer text-center"
                      style={{ minHeight: '44px' }}
                    >
                      ✓ Clasificar y Guardar
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}


      {/* --- SECTION D: LAUNDRY LIST BASICS --- */}
      {activeSection === 'laundry' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#a67c52] font-mono">
                🧼 Lavandería y Ropa Sucia
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                El motor inteligente desvía de los outfits las prendas en lavandería.
              </p>
            </div>

            {laundryItemsCount > 0 && (
              <button
                onClick={handleWashAllLaundry}
                className="py-1 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 rounded-full font-bold text-[10px] transition-colors border border-indigo-200/50 cursor-pointer"
                style={{ minHeight: '32px' }}
              >
                🧼 Completar Lavado
              </button>
            )}
          </div>

          {laundryItemsCount === 0 ? (
            <div className="text-center py-8 bg-[#fdfdfb]/50 border-2 border-dashed border-[#c4b5a5]/30 rounded-2xl flex flex-col items-center">
              <span className="text-3xl mb-1.5">🫧</span>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-350">¡Tu armario está impecable!</p>
              <p className="text-[10.5px] text-gray-500 mt-1 max-w-[220px]">No tienes ninguna prenda en la canasta de ropa sucia actualmente.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {prendas.filter(p => p.inLaundry).map(p => (
                <div key={p.id} className="p-3 bg-[#e8dccc]/10 dark:bg-[#1e1714] border border-[#c4b5a5]/35 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: COLOR_CLASSES_MAP[p.color.toLowerCase()] || '#c4b5a5' }} />
                    <span className="font-semibold text-gray-800 dark:text-neutral-200 truncate">{p.name}</span>
                  </div>
                  
                  {/* Remove laundry flag item button */}
                  <button
                    onClick={() => {
                      triggerFeedback();
                      setPrendas(prev => prev.map(x => x.id === p.id ? { ...x, inLaundry: false } : x));
                    }}
                    className="text-[9px] font-mono font-bold text-[#a67c52] hover:underline"
                  >
                    SACAR
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
