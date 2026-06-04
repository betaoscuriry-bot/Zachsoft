import React, { useState, useEffect, useRef } from 'react';
import { Prenda, FuenteCargada } from '../types';
import { COLOR_CLASSES_MAP } from '../data';
import { 
  FileUp, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Trash2, 
  Plus, 
  Bookmark, 
  HelpCircle, 
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Lightbulb
} from 'lucide-react';

interface FuentesTabProps {
  prendas: Prenda[];
  setPrendas: React.Dispatch<React.SetStateAction<Prenda[]>>;
  fuentes: FuenteCargada[];
  setFuentes: React.Dispatch<React.SetStateAction<FuenteCargada[]>>;
  setActiveTab: (tab: 'generador' | 'asistente' | 'calendario' | 'armario' | 'semanal' | 'fuentes') => void;
  setAssistantPrepopText?: (text: string) => void;
}

export default function FuentesTab({
  prendas,
  setPrendas,
  fuentes,
  setFuentes,
  setActiveTab,
  setAssistantPrepopText
}: FuentesTabProps) {
  const [fileLoading, setFileLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Local active display of last analyzed source
  const [activeAnalysis, setActiveAnalysis] = useState<FuenteCargada | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sboy_fuentes');
    if (saved) {
      try {
        setFuentes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveFuentesToStorage = (list: FuenteCargada[]) => {
    localStorage.setItem('sboy_fuentes', JSON.stringify(list));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setFileLoading(true);
    setLoadingStepText('Abriendo archivo y preparando datos...');

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Error al leer el archivo local.');
      setFileLoading(false);
    };

    reader.onload = async (evt) => {
      try {
        const base64Data = evt.target?.result as string;
        
        // Progress text animation
        const steps = [
          'Abriendo archivo y cargando en memoria...',
          'Iniciando pasarela de lectura OCR...',
          'Transmitiendo datos seguros a Aiko Engine...',
          'Gemini AI analizando siluetas de moda y estilo...',
          'Extrayendo combinaciones cromáticas de la foto/PDF...',
          'Estructurando propuesta bento de prendas para tu clóset...',
          'Cerrando reporte fotográfico estilo Soft Boy...'
        ];
        
        let stepIdx = 0;
        const progressTimer = setInterval(() => {
          if (stepIdx < steps.length - 1) {
            stepIdx++;
            setLoadingStepText(steps[stepIdx]);
          }
        }, 1500);

        // Call our server endpoint
        const response = await fetch('/api/analyze-source', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        clearInterval(progressTimer);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Fallo del servidor de análisis.');
        }

        const data = await response.json();

        const newSource: FuenteCargada = {
          id: `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: file.name.split('.')[0].replace(/[-_]/g, ' '),
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          addedDate: new Date().toISOString().split('T')[0],
          analysisText: data.analysisText || 'Se completó la lectura del archivo.',
          styleVibe: data.styleVibe || 'Estilo Clásico Relajado',
          extractedPrendas: data.extractedPrendas || [],
          sourceUrl: file.type.includes('pdf') ? undefined : base64Data // save image thumbnail if image
        };

        const updatedList = [newSource, ...fuentes];
        setFuentes(updatedList);
        saveFuentesToStorage(updatedList);
        setActiveAnalysis(newSource);
        
        if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Error de conexión. Asegúrate de configurar GEMINI_API_KEY en Secretos.');
      } finally {
        setFileLoading(false);
        setLoadingStepText('');
      }
    };

    // Read as Data URL to support base64 transmission + image display thumbnails
    reader.readAsDataURL(file);
  };

  const handleDeleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas quitar esta fuente y su análisis del repertorio?')) return;
    
    const updated = fuentes.filter(f => f.id !== id);
    setFuentes(updated);
    saveFuentesToStorage(updated);
    
    if (activeAnalysis?.id === id) {
      setActiveAnalysis(null);
    }
  };

  const handleAskAikoRecommendation = (source: FuenteCargada) => {
    if (!setAssistantPrepopText) return;
    
    // Format request text
    const prepopText = `Hola Aiko! He guardado una fuente en mi repertorio llamada "${source.name}" con estilo "${source.styleVibe}". ${source.analysisText.slice(0, 150)}... ¿Podrías recomendarme un outfit de mi armario que se asemeje a esta propuesta o cómo recrearlo con mis prendas disponibles?`;
    
    setAssistantPrepopText(prepopText);
    setActiveTab('asistente');
  };

  // Add extracted garment physical item from file direct to active inventory!
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  
  const handleAddExtractedItem = (item: Omit<Prenda, 'id'>, index: number) => {
    const uniqueId = `extraido-${Date.now()}-${index}`;
    
    const newPrenda: Prenda = {
      id: uniqueId,
      name: item.name,
      category: item.category,
      color: item.color,
      season: item.season,
      customTags: [...(item.customTags || []), 'fuente-leída'],
      isFavorite: false,
      timesUsed: 0,
      inLaundry: false,
      addedDate: new Date().toISOString().split('T')[0]
    };

    setPrendas(prev => [newPrenda, ...prev]);
    setAddedItemIds(prev => [...prev, `${activeAnalysis?.id}-${index}`]);
    
    if (navigator.vibrate) navigator.vibrate(35);
  };

  return (
    <div className="flex flex-col gap-5.5 animate-fade-in">
      
      {/* Tab Banner */}
      <div className="bg-[#fcf7ee] dark:bg-[#1f1816] p-4.5 rounded-3xl border border-[#c4b5a5]/40 flex flex-col gap-1 shadow-xs">
        <h2 className="text-base font-bold text-gray-800 dark:text-neutral-50 flex items-center gap-1.5 font-sans">
          <Bookmark size={18} className="text-[#a67c52]" /> Repertorio & Carga de Fuentes
        </h2>
        <p className="text-[11px] text-gray-500 leading-snug">
          Alimenta el repertorio secreto de tu asistente cargando PDFs lookbook de tiendas, capturas de Instagram de outfits favoritos o guías de vestir. Nuestro lector inteligente leerá todo el contenido usando visión Gemini para recomendarte looks idénticos.
        </p>
      </div>

      {/* Upload Drag and Drop Section */}
      <div className="bg-white/80 dark:bg-[#201a17]/95 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#c4b5a5] p-6 text-center relative overflow-hidden transition-all duration-300">
        {fileLoading ? (
          <div className="flex flex-col items-center justify-center p-6 gap-3.5 z-10">
            <div className="w-12 h-12 border-4 border-[#a67c52]/20 border-t-[#a67c52] rounded-full animate-spin" />
            <h4 className="text-xs font-bold font-mono text-[#a67c52] uppercase tracking-wider animate-pulse">Lector AI Multimodal Activo</h4>
            <div className="max-w-[240px] text-[11px] text-gray-650 dark:text-gray-300 h-8 flex items-center justify-center">
              "{loadingStepText}"
            </div>
            <span className="text-[9px] text-gray-400 font-mono">Esto utiliza Gemini 3.5 Flash en tiempo real.</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#fef9ef] dark:bg-[#2d221c] flex items-center justify-center text-[#a67c52] mb-3 border border-[#c4b5a5]/30">
              <FileUp size={22} className="animate-pulse" />
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[#a67c52] hover:bg-[#a67c52]/95 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              style={{ minHeight: '40px' }}
            >
              Seleccionar Catálogo PDF o Foto...
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              accept=".pdf, image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <p className="text-[10px] text-gray-400 mt-2.5">
              Arrastra o sube archivos PDF, JPEG o PNG de alta fidelidad sin límites de peso.
            </p>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200/50 text-left text-[10.5px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
            <span className="font-bold">Error:</span>
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Active Analysis Detailed Card Panel */}
      {activeAnalysis && (
        <div className="bg-white/95 dark:bg-[#201a17]/95 rounded-3xl border border-[#c4b5a5] p-5 shadow-md animate-in slide-in-from-bottom-4 duration-300 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#c4b5a5]/25 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              {activeAnalysis.type === 'pdf' ? (
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <FileText size={18} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden">
                  {activeAnalysis.sourceUrl ? (
                    <img src={activeAnalysis.sourceUrl} alt="source thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={18} />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400">Lectura Completada</span>
                <h3 className="text-xs font-bold text-gray-850 dark:text-white truncate uppercase">{activeAnalysis.name}</h3>
              </div>
            </div>

            <button 
              onClick={() => handleAskAikoRecommendation(activeAnalysis)}
              className="text-[10.5px] font-bold text-[#a67c52] hover:underline flex items-center gap-1 shrink-0 bg-[#e8dccc]/40 px-2.5 py-1 rounded-lg"
              title="Pedir recomendación en Chat"
            >
              <MessageCircle size={12} /> Preguntar a Aiko
            </button>
          </div>

          {/* Style Vibe Badge */}
          <div className="p-2.5 bg-[#fdf8f0] dark:bg-[#1e1714] border border-[#a67c52]/20 rounded-xl flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500 animate-pulse shrink-0" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-gray-700 dark:text-neutral-300">Estilo Identificado:</span>{' '}
              <span className="text-[#a67c52] font-semibold">{activeAnalysis.styleVibe}</span>
            </div>
          </div>

          {/* Analysis Text Body */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Análisis y Tips de Estilismo</span>
            <div className="text-[11px] text-gray-700 dark:text-neutral-300 bg-neutral-50 dark:bg-[#181311] p-3.5 border border-[#c4b5a5]/30 rounded-2xl max-h-[180px] overflow-y-auto leading-relaxed scrollbar-thin">
              <p className="whitespace-pre-line font-medium">{activeAnalysis.analysisText}</p>
            </div>
          </div>

          {/* Extracted recommended prendas list */}
          {activeAnalysis.extractedPrendas && activeAnalysis.extractedPrendas.length > 0 && (
            <div className="flex flex-col gap-2 pt-1.5 border-t border-[#c4b5a5]/20">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1">
                <Lightbulb size={11} className="text-amber-500" /> Extraer prendas de esta fuente ({activeAnalysis.extractedPrendas.length})
              </span>
              
              <div className="flex flex-col gap-2">
                {activeAnalysis.extractedPrendas.map((item, idx) => {
                  const isAdded = addedItemIds.includes(`${activeAnalysis.id}-${idx}`);
                  const colorCode = COLOR_CLASSES_MAP[item.color.toLowerCase()] || '#c4b5a5';
                  const isLinear = colorCode.includes('linear');
                  return (
                    <div 
                      key={idx}
                      className="p-2.5 bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/45 rounded-xl flex justify-between items-center text-[11px] hover:border-[#a67c52]/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0 shadow-xs" 
                          style={{
                            backgroundImage: isLinear ? colorCode : 'none',
                            backgroundColor: isLinear ? 'transparent' : colorCode
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-[8px] bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 py-0.5 px-1 rounded uppercase font-bold shrink-0 inline-block mr-1">
                            {item.category}
                          </span>
                          <strong className="text-gray-800 dark:text-neutral-100 font-semibold truncate leading-none pt-0.5 inline-block">{item.name}</strong>
                          <span className="text-[9px] text-gray-400 block truncate mt-0.5 capitalize">Color: {item.color} • Temporada: {item.season}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => !isAdded && handleAddExtractedItem(item, idx)}
                        disabled={isAdded}
                        className={`transition-all py-1.5 px-2.5 rounded-lg flex items-center gap-1 font-bold text-[10px] cursor-pointer ${
                          isAdded 
                            ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 cursor-not-allowed'
                            : 'bg-[#a67c52] hover:bg-[#a67c52]/90 text-white shadow-xs'
                        }`}
                        style={{ minHeight: '28px' }}
                      >
                        {isAdded ? (
                          <>
                            <Check size={11} /> ¡Agregada!
                          </>
                        ) : (
                          <>
                            <Plus size={11} /> + Armario
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Saved Repertory List Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
          Tu Repertorio de Tendencias ({fuentes.length})
        </h3>

        {fuentes.length === 0 ? (
          <div className="text-center p-8 bg-white/40 dark:bg-[#1e1714]/40 border-2 border-dashed border-[#c4b5a5]/30 rounded-2.5xl flex flex-col items-center">
            <span className="text-3xl mb-1.5">📚</span>
            <p className="text-xs font-bold text-[#a67c52]">Repertorio Vacío</p>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Carga algunos catálogos PDF o looks fotográficos de referencia para leerlos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {fuentes.map(source => {
              const isSelected = activeAnalysis?.id === source.id;
              return (
                <div 
                  key={source.id}
                  onClick={() => setActiveAnalysis(source)}
                  className={`p-3 rounded-2.5xl border transition-all duration-200 cursor-pointer flex justify-between items-center text-xs ${
                    isSelected 
                      ? 'bg-[#a67c52]/10 border-[#a67c52] text-[#a67c52]'
                      : 'bg-white/90 dark:bg-[#201a17]/95 border-[#c4b5a5]/40 hover:border-[#a67c52]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {source.type === 'pdf' ? (
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 overflow-hidden border border-[#c4b5a5]/20">
                        {source.sourceUrl ? (
                          <img src={source.sourceUrl} alt="repertorio thumb" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={15} />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[#a67c52] truncate capitalize">{source.name}</h4>
                      <span className="text-[9.5px] text-gray-550 dark:text-neutral-400 block truncate font-medium mt-0.5">
                        Estilo: {source.styleVibe} • {source.addedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAskAikoRecommendation(source);
                      }}
                      className="p-1.5 text-gray-500 hover:text-[#a67c52] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                      title="Ver en chat"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSource(source.id, e)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                      title="Quitar de mi repertorio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
