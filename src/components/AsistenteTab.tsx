import React, { useState, useRef, useEffect } from 'react';
import { Prenda, ChatMessage, Outfit } from '../types';
import { 
  Bot, 
  Sparkles, 
  CloudRain, 
  Sun, 
  HelpCircle, 
  Camera, 
  Check, 
  Shirt, 
  Volume2, 
  VolumeX, 
  Clock, 
  Award, 
  RefreshCw, 
  Grid, 
  QrCode, 
  Sliders, 
  Music, 
  Smile, 
  MapPin, 
  Trash2,
  Bookmark,
  TrendingUp,
  Flame,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { COLOR_CLASSES_MAP } from '../data';

interface AsistenteTabProps {
  prendas: Prenda[];
  currentOutfit: Outfit | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentAesthetic?: string;
  assistantPrepopText?: string;
  setAssistantPrepopText?: (text: string) => void;
  aiSettings?: any;
  onLogTransaction?: (logs: any[]) => void;
}

export default function AsistenteTab({
  prendas,
  currentOutfit,
  messages,
  setMessages,
  currentAesthetic = 'Soft Boy',
  assistantPrepopText = '',
  setAssistantPrepopText,
  aiSettings,
  onLogTransaction
}: AsistenteTabProps) {
  
  // Siri Voice simulation states
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('Voz inactiva');
  const [lastSpoken, setLastSpoken] = useState('');

  // 1. THERMAL COMFORT SLIDER (5°C to 30°C)
  const [temperature, setTemperature] = useState<number>(18);
  const [detectedClimateStatus, setDetectedClimateStatus] = useState('Templado (ideal para chalecos de punto)');
  const [matchingWeatherPrendas, setMatchingWeatherPrendas] = useState<Prenda[]>([]);

  // 2. SIZE TRANSLATOR MODULE
  const [userChestCm, setUserChestCm] = useState<number>(95);
  const [userShoeEur, setUserShoeEur] = useState<number>(41);
  const [translatedSizes, setTranslatedSizes] = useState({
    topUs: 'S/M',
    topUk: '38',
    topJp: '2/M',
    shoeUs: '8.5',
    shoeUk: '7.5'
  });

  // 3. QR / AR CODE SCANNER SIMULATOR
  const [qrScanning, setQrScanning] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);
  const [arLookSuggestion, setArLookSuggestion] = useState<Outfit | null>(null);

  // 4. MAINTENANCE DIARY & REMINDERS 
  const [laundryScheduleCount, setLaundryScheduleCount] = useState<number>(() => {
    return prendas.filter(p => p.inLaundry).length;
  });
  const [ironingQueue, setIroningQueue] = useState<number>(3); // Simulates delicate pieces
  const [smartAlerts, setSmartAlerts] = useState<string[]>([
    '🧼 Tu Polera mohair lleva 3 usos. Se sugiere programa de lavado delicado.',
    '🧺 Remitir pantalón de vestir beige a planchado a vapor para preservar pliegues.',
    '👞 Zapatos café Oxford requieren hidratación de cuero este fin de semana.'
  ]);

  // 5. GAMIFICATION ACHIEVEMENTS
  const [styleStreaks, setStyleStreaks] = useState({
    activeDays: 6,
    capsuleRank: 'Minimalista Avanzado',
    unlockedBadges: ['Camaleón Pastel', 'Fiel al Mohair', 'Eco Amigo PWA']
  });

  // 6. PINTEREST & MUSIC RECOMMENDATIONS
  const [pinterestVibe, setPinterestVibe] = useState('Otoño Suave / Café y Lofi');
  const [suggestedPlaylist, setSuggestedPlaylist] = useState('Soft Boy Chillout Vol 3');

  // Trigger feedback
  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // Convert sizes dynamically on measurement change
  useEffect(() => {
    // Top translation
    let topUs = 'M';
    let topUk = '40';
    let topJp = '3';
    if (userChestCm < 90) {
      topUs = 'S'; topUk = '36'; topJp = '1';
    } else if (userChestCm > 105) {
      topUs = 'XL'; topUk = '44'; topJp = '5';
    } else if (userChestCm > 100) {
      topUs = 'L'; topUk = '42'; topJp = '4';
    }

    // Shoe translation
    let shoeUs = (userShoeEur - 33).toFixed(1);
    let shoeUk = (userShoeEur - 34).toFixed(1);

    setTranslatedSizes({
      topUs,
      topUk,
      topJp,
      shoeUs,
      shoeUk
    });
  }, [userChestCm, userShoeEur]);

  // Update garments recommended on slide change
  useEffect(() => {
    if (temperature < 10) {
      setDetectedClimateStatus('Helado (Abrigo grueso y accesorios mandatorios)');
      setMatchingWeatherPrendas(prendas.filter(p => p.season === 'Invierno' || p.season === 'Otoño/Invierno').slice(0, 3));
    } else if (temperature < 18) {
      setDetectedClimateStatus('Fresco de Otoño (Suéteres de mohair, bufandas y cárdigans)');
      setMatchingWeatherPrendas(prendas.filter(p => p.season === 'Todo el año' || p.season === 'Otoño/Primavera').slice(0, 3));
    } else if (temperature < 25) {
      setDetectedClimateStatus('Templado Primaveral (Camisa manga larga ligera y pantalón de lino)');
      setMatchingWeatherPrendas(prendas.filter(p => p.season === 'Todo el año' || p.season === 'Otoño/Primavera').slice(0, 3));
    } else {
      setDetectedClimateStatus('Cálido de Verano (Poleras lisas, lino y colores crema claros)');
      setMatchingWeatherPrendas(prendas.filter(p => p.season === 'Todo el año' || p.season === 'N/A').slice(0, 3));
    }
  }, [temperature, prendas]);

  // Real-time voice synthesiser
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      
      utterance.onstart = () => setSpeechStatus('Aiko hablando...');
      utterance.onend = () => setSpeechStatus('Aiko en silencio');
      window.speechSynthesis.speak(utterance);
      setLastSpoken(text);
    } catch (e) {
      console.error(e);
    }
  };

  // Simulates scanning a dresser tag card code
  const handleStartQRScan = () => {
    triggerFeedback();
    setQrScanning(true);
    setQrScanResult(null);
    setArLookSuggestion(null);

    setTimeout(() => {
      // Simulate beautiful success
      setQrScanning(false);
      setQrScanResult('QR-DRESS-CASUAL-04');
      triggerFeedback();

      // Recommend customized look automatically
      const sups = prendas.filter(p => p.category === 'Poleras' || p.category === 'Camisas');
      const pants = prendas.filter(p => p.category === 'Pantalones');
      const shoes = prendas.filter(p => p.category === 'Zapatos');
      
      if (sups.length > 0 && pants.length > 0 && shoes.length > 0) {
        const foundLook: Outfit = {
          superior: sups[Math.floor(Math.random() * sups.length)],
          pantalones: pants[Math.floor(Math.random() * pants.length)],
          zapatos: shoes[Math.floor(Math.random() * shoes.length)],
          abrigo: prendas.find(p => p.category === 'Abrigos/Chaquetas') || null,
          accesorio: prendas.find(p => p.category === 'Accesorios') || null,
          bolsa: prendas.find(p => p.category === 'Bolsas') || null
        };
        setArLookSuggestion(foundLook);
        speakText(`D Dress code Casual detectado. Te sugiero vestir tu ${foundLook.superior.name} con tu ${foundLook.pantalones.name}.`);
      }
    }, 2400);
  };

  const getColorBlock = (color: string) => {
    const val = COLOR_CLASSES_MAP[color.toLowerCase()] || '#c4b5a5';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  return (
    <div id="asistente-view-dashboard" className="flex flex-col gap-6 select-none pb-12">
      
      {/* 1. VOCAL SIRI/GOOGLE ASSISTANT MODULE */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center bg-[#fef9ef] dark:bg-[#28211d] p-3.5 rounded-2xl border border-[#c4b5a5]/30">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${voiceEnabled ? 'bg-amber-500 text-white animate-pulse' : 'bg-[#e8dccc] text-[#a67c52]'} flex items-center justify-center transition-colors`}>
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">Control de Voz PWA Estilo Siri</span>
              <h4 className="text-xs font-bold text-gray-800 dark:text-orange-50/90 -mt-0.5">{speechStatus}</h4>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={voiceEnabled} 
              onChange={(e) => {
                triggerFeedback();
                setVoiceEnabled(e.target.checked);
              }}
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-gray-250 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#a67c52]"></div>
          </label>
        </div>

        {voiceEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10.5px] leading-relaxed text-[#a67c52] dark:text-amber-200">
            🎙️ **Integración de voz activada:** Tu aplicación leerá en voz alta las recomendaciones estéticas de Aiko. Prueba cambiar el deslizador de clima para oír sugerencias verbales directas.
          </div>
        )}
      </div>

      {/* 2. WEATHER & THERMAL COMFORT SLIDER */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <Sliders size={15} className="text-[#a67c52]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Sensación Térmica Cruzada</h3>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10.5px] text-gray-600 dark:text-neutral-400 font-sans">Ajustar temperatura clima:</span>
          <span className="text-sm font-bold text-[#a67c52] font-mono">{temperature}°C ({temperature < 15 ? 'Frío🍁' : temperature > 22 ? 'Cálido☀️' : 'Fresco☕'})</span>
        </div>

        <input 
          type="range" 
          min="5" 
          max="32" 
          value={temperature}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setTemperature(val);
          }}
          className="w-full h-1.5 bg-[#e8dccc] dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#a67c52]"
        />

        <div className="p-3 bg-[#e8dccc]/30 dark:bg-[#28211d] rounded-xl border border-[#c4b5a5]/20 text-[11px] leading-relaxed text-gray-700 dark:text-neutral-300 flex items-start gap-2">
          <CloudRain size={13} className="text-[#a67c52] mt-0.5 shrink-0" />
          <p>
            <strong>Estado detectado:</strong> {detectedClimateStatus}.
          </p>
        </div>

        {/* Suggested garments list */}
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-[9px] uppercase font-black tracking-wider text-gray-400 font-mono">Prendas sugeridas para {temperature}°C:</span>
          <div className="grid grid-cols-3 gap-2.5">
            {matchingWeatherPrendas.length === 0 ? (
              <span className="col-span-3 text-[10px] text-gray-400 py-2 italic">Sin prendas registradas de esta categoría</span>
            ) : (
              matchingWeatherPrendas.map(prend => (
                <div 
                  key={prend.id}
                  className="bg-[#fefaf3] dark:bg-[#211a17] rounded-xl p-2.5 border border-[#c4b5a5]/30 flex flex-col items-center text-center gap-1.5"
                >
                  <div className="w-5 h-5 rounded-full border border-gray-300" style={getColorBlock(prend.color)} />
                  <span className="text-[10px] font-bold text-gray-800 dark:text-neutral-200 truncate w-full">{prend.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. QR / AR DRESS CODE SCANNER FRAME */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#a67c52]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Escáner Código de Vestimenta AR</h3>
          </div>
          <span className="text-[8px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-mono font-bold uppercase">Real Camera simulator</span>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-neutral-400 -mt-2 leading-relaxed">
          Escanea etiquetas QR incorporadas en tus colgadores o invitaciones de eventos para sincronizar instantáneamente las prendas correspondientes de tu armario.
        </p>

        {qrScanning ? (
          <div className="relative aspect-video rounded-2xl bg-black border border-[#c4b5a5]/70 flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Pulsing focal square bracket indicators */}
            <div className="absolute w-24 h-24 border-2 border-dashed border-amber-500 animate-pulse flex items-center justify-center rounded">
              <span className="text-[8px] text-amber-500 font-mono tracking-widest uppercase">SCANNING</span>
            </div>
            {/* Scanning light sweeps */}
            <div className="absolute inset-x-0 h-0.5 bg-amber-500/80 shadow-md shadow-amber-500 w-full animate-bounce"></div>
            <span className="absolute bottom-3 text-[9px] font-mono text-neutral-400">Escaneando etiquetas físicas de armario...</span>
          </div>
        ) : (
          <button 
            type="button"
            onClick={handleStartQRScan}
            className="w-full py-3 bg-[#e8dccc]/60 hover:bg-[#e8dccc]/90 dark:bg-[#28201b] text-gray-800 dark:text-orange-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-[#c4b5a5] transition-colors cursor-pointer"
            style={{ minHeight: '44px' }}
          >
            <Camera size={14} /> Comenzar Escaneo QR Físico
          </button>
        )}

        {/* Scan result display look preview with custom locks */}
        {qrScanResult && arLookSuggestion && (
          <div className="bg-[#fef9ef] dark:bg-[#28211d] p-4 rounded-2xl border border-amber-500/30 flex flex-col gap-3 animate-fade-in">
            <div className="flex justify-between items-center text-[10px] font-mono text-amber-700">
              <span>Etiqueta QR: <strong>{qrScanResult}</strong></span>
              <span className="font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">DETECTADO</span>
            </div>
            <h4 className="text-xs font-black text-gray-800 dark:text-white">Vestimenta para Casual Friday Recomendada:</h4>

            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className="p-2 bg-white dark:bg-[#1a1513] rounded-lg border">
                <span className="text-[8.5px] uppercase text-[#a67c52] block font-mono">Superior</span>
                <strong>{arLookSuggestion.superior.name}</strong>
              </div>
              <div className="p-2 bg-white dark:bg-[#1a1513] rounded-lg border">
                <span className="text-[8.5px] uppercase text-[#a67c52] block font-mono">Pantalón</span>
                <strong>{arLookSuggestion.pantalones.name}</strong>
              </div>
              <div className="p-2 bg-white dark:bg-[#1a1513] rounded-lg bordercol-span-2">
                <span className="text-[8.5px] uppercase text-[#a67c52] block font-mono">Zapatilla ideal</span>
                <strong>{arLookSuggestion.zapatos.name}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WEARABLE PRODUCTIVITY & CALENDAR SYNC */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#a67c52]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Wearable Productivity: Agenda & Looks</h3>
          </div>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-350 px-2 py-0.5 rounded font-bold font-mono">CALENDAR ACTIVE</span>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed -mt-1.5">
          Sincroniza tus compromisos cotidianos para recibir sugerencias inteligentes automáticas de prendas idóneas para cada reunión o paseo en tu agenda.
        </p>

        <div className="flex flex-col gap-3">
          {/* Mock Interactive Events Timeline */}
          {[
            { id: 1, title: '☕ Cita de Café Estilo Soft Boy', time: '10:00 AM', type: 'romantic', icon: '🧁', suggestion: 'Un suéter de mohair pastel con pantalón de pana marrón claro. Un outfit ultra-acogedor.' },
            { id: 2, title: '💼 Presentación de Proyecto', time: '02:30 PM', type: 'formal', icon: '👔', suggestion: 'Camisa blanca pulcra de algodón, pantalones sastre beige con plisado, más tus zapatos mocasines café.' },
            { id: 3, title: '🚶 Paseo Relajado en el Parque', time: '06:00 PM', type: 'casual', icon: '🌳', suggestion: 'Polera lisa suave en tono verde salvia, chaqueta de jean vintage y zapatillas blancas ligeras.' }
          ].map((event) => {
            const isSelected = event.id === 1; // Highlight the first as active/current target
            return (
              <div 
                key={event.id}
                className={`p-3 rounded-2xl border transition-all duration-350 flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-xs' 
                    : 'bg-[#fdfaf5] dark:bg-[#201915] border-[#c4b5a5]/30'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-[#2b211a] border border-[#c4b5a5]/40 flex items-center justify-center shrink-0 shadow-xs text-sm">
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-800 dark:text-white truncate">{event.title}</span>
                    <span className="text-[9px] font-mono font-bold text-[#a67c52] bg-[#a67c52]/10 px-1.5 py-0.5 rounded-sm">{event.time}</span>
                  </div>
                  <p className="text-[10.5px] text-gray-600 dark:text-gray-300 mt-1.5 leading-normal">
                    💡 <strong>Aiko sugiere:</strong> {event.suggestion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SIZE TRANSLATOR */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <RefreshCw size={15} className="text-[#a67c52]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Traductor Corporal de Tallas</h3>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed -mt-1.5">
          Ingresa tus medidas físicas para predecir tus equivalencias de talla ideales en marcas internacionales de moda Soft Boy (UK, US, JP, EU).
        </p>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1 text-xs">
            <label className="text-[9.5px] font-mono text-gray-400 uppercase">Pecho (Centímetros)</label>
            <input 
              type="number" 
              value={userChestCm}
              onChange={(e) => setUserChestCm(parseInt(e.target.value) || 90)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#201915] rounded-xl border focus:outline-none focus:border-[#a67c52]"
              style={{ minHeight: '40px' }}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="text-[9.5px] font-mono text-gray-400 uppercase">Zapato (EU standard)</label>
            <input 
              type="number" 
              value={userShoeEur}
              onChange={(e) => setUserShoeEur(parseInt(e.target.value) || 40)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#201915] rounded-xl border focus:outline-none focus:border-[#a67c52]"
              style={{ minHeight: '40px' }}
            />
          </div>
        </div>

        {/* Translation Results Grid */}
        <div className="bg-[#fcfaf5] dark:bg-[#1f1916] rounded-xl p-3 border border-[#c4b5a5]/30 text-xs flex flex-col gap-2 animate-fade-in">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#a67c52] font-mono">Tabla de Equivalencias Estimadas:</span>
          
          <div className="space-y-1.5">
            <div className="flex justify-between border-b pb-1 dark:border-neutral-800">
              <span className="text-gray-500">Prenda Superior US Scale:</span>
              <span className="font-bold text-[#a67c52]">{translatedSizes.topUs}</span>
            </div>
            <div className="flex justify-between border-b pb-1 dark:border-neutral-800">
              <span className="text-gray-500">Medida de Sastre UK Inches:</span>
              <span className="font-bold text-[#a67c52]">{translatedSizes.topUk} pulgadas</span>
            </div>
            <div className="flex justify-between border-b pb-1 dark:border-neutral-800">
              <span className="text-gray-500">Diseño Japonés (Muji/Uniqlo):</span>
              <span className="font-bold text-[#a67c52]">Grado {translatedSizes.topJp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Zapato (US / UK):</span>
              <span className="font-bold text-[#a67c52]">{translatedSizes.shoeUs} US / {translatedSizes.shoeUk} UK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. GAMIFICATION ACHIEVEMENTS & CAPSULE STREAKS */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[#a67c52]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Logros del Armario Cápsula</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-500">★ Streak: {styleStreaks.activeDays} días</span>
        </div>

        <div className="bg-gradient-to-r from-[#e8dccc]/40 to-white dark:from-[#342922] dark:to-[#1a1513] p-4 rounded-xl border border-[#c4b5a5]/20 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#a67c52] font-mono">Nivel de Curaduría</span>
            <h4 className="text-xs font-black text-gray-800 dark:text-white -mt-0.5">{styleStreaks.capsuleRank}</h4>
          </div>
          <div className="text-[12px] text-gray-500 font-mono">
            {prendas.length} prendas • Capsule score: 92/100
          </div>
        </div>

        {/* Badges unlocked list */}
        <div className="flex flex-col gap-2">
          <span className="text-[9.5px] uppercase font-bold text-gray-400 font-mono">Medallas de Estilo Desbloqueadas:</span>
          <div className="flex flex-wrap gap-1.5">
            {styleStreaks.unlockedBadges.map((badge, idx) => (
              <span 
                key={idx}
                className="text-[9px] font-black tracking-tight bg-gradient-to-br from-[#fef9ef] to-[#e8dccc] dark:from-[#302621] dark:to-neutral-800 text-gray-700 dark:text-neutral-200 border border-[#c4b5a5]/50 px-2 py-1 rounded-lg"
              >
                🧸 {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6. CLOSET MAINTENANCE & LAUNDRY DIARY */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#a67c52]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Diario de Lavandería e Higiene</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-600">🧺 Delicados: {ironingQueue}</span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/50 rounded-xl flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-blue-600 font-mono">Lavadora</span>
            <h4 className="text-base font-extrabold text-blue-900 dark:text-blue-300 mt-1">{laundryScheduleCount} prendas</h4>
            <span className="text-[8.5px] text-gray-400 block mt-1">Cesto de Ropa Sucia</span>
          </div>

          <div className="p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 rounded-xl flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-[#a67c52] font-mono">Planchado</span>
            <h4 className="text-base font-extrabold text-[#74502b] dark:text-orange-200 mt-1">{ironingQueue} piezas</h4>
            <span className="text-[8.5px] text-gray-400 block mt-1">Sugerido vapor delicado</span>
          </div>
        </div>

        {/* Reminders section list */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] uppercase font-bold text-gray-400 font-mono">Recordatorios de mantenimiento inteligente:</span>
          <div className="space-y-1.5">
            {smartAlerts.map((alertItem, idx) => (
              <div 
                key={idx}
                className="text-[10px] p-2 rounded-lg bg-gray-50 dark:bg-[#201a17] text-gray-600 dark:text-gray-300 border border-[#c4b5a5]/10 flex items-start gap-1.5 leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#a67c52] mt-1 shrink-0" />
                <span>{alertItem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. CROSS INTELLIGENCE RECOMENDATIONS - PINTEREST & SPOTIFY/YOUTUBE MUSIC */}
      <div className="bg-white dark:bg-[#1a1513] rounded-[24px] border border-[#c4b5a5] dark:border-[#4e3f35] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Music size={15} className="text-[#a67c52]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#a67c52] font-mono">Fusión Pinterest & Playlist</h3>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed -mt-1.5">
          Aiko analiza tu estética actual y te sugiere una lista de reproducción y tablero inspiracional ideal para combinar hoy.
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#fef9ef] dark:bg-[#1a1513] border p-3 rounded-xl">
            <span className="text-[8px] uppercase font-black text-gray-400 font-mono">Pinterest vibe</span>
            <span className="font-extrabold text-[#a67c52] block mt-0.5">{pinterestVibe}</span>
          </div>
          <div className="bg-[#fef9ef] dark:bg-[#1a1513] border p-3 rounded-xl">
            <span className="text-[8px] uppercase font-black text-gray-400 font-mono">Playlist de YouTube Music</span>
            <span className="font-extrabold text-[#a67c52] block mt-0.5">🎵 {suggestedPlaylist}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
