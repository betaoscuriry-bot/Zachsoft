import React, { useState, useEffect } from 'react';
import { Prenda, Outfit, SemanalPlan, CalendarioOutfits, ChatMessage, AppStateExport, FuenteCargada, SoftBoyTheme } from './types';
import { INITIAL_PRENDAS, SYSTEM_THEMES } from './data';
import { generateSmartPick } from './utils';

// Import our interactive beautiful viewport tabs
import GeneradorTab from './components/GeneradorTab';
import AsistenteTab from './components/AsistenteTab';
import ChatIATab from './components/ChatIATab';
import CalendarioTab from './components/CalendarioTab';
import ArmarioTab from './components/ArmarioTab';
import SemanalTab from './components/SemanalTab';
import FuentesTab from './components/FuentesTab';
import ThemeStore from './components/ThemeStore';

// Icons for navigation and settings
import { Wand2, Bot, Calendar, Shirt, Layers, Sun, Moon, Download, Upload, ClipboardCheck, Laptop, BookOpen, ShoppingBag, Bell, MessageCircle, X, Sparkles, Settings2, Cpu } from 'lucide-react';

interface BearInstance {
  id: number;
  left: string;
  size: string;
  delay: string;
  duration: string;
  swayDuration: string;
  opacity: number;
}

// Fixed floating bear configuration to prevent flicker or layout jumps
const FLOATING_BEARS_DATA: BearInstance[] = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 7.5) + (Math.sin(i) * 3)}%`,
  size: `${16 + (i % 3) * 6}px`,
  delay: `${-Math.random() * 25}s`,
  duration: `${18 + (i % 3) * 6 + Math.random() * 4}s`,
  swayDuration: `${4.5 + (i % 2) * 2 + Math.random() * 1.5}s`,
  opacity: 0.05 + (i % 3) * 0.03
}));

export default function App() {
  const [activeTab, setActiveTab] = useState<'generador' | 'asistente' | 'chat_ia' | 'calendario' | 'armario' | 'semanal' | 'fuentes'>('generador');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Theme configurations states
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('sboy_current_theme_id') || 'original';
  });
  const [softBoyCoins, setSoftBoyCoins] = useState<number>(() => {
    const saved = localStorage.getItem('sboy_coins');
    return saved ? Number(saved) : 500;
  });
  const [themesList, setThemesList] = useState<SoftBoyTheme[]>(() => {
    const saved = localStorage.getItem('sboy_themes');
    if (saved) return JSON.parse(saved);
    return SYSTEM_THEMES;
  });
  const [showThemeStore, setShowThemeStore] = useState(false);

  // Loaded PDF/Image resources states
  const [fuentes, setFuentes] = useState<FuenteCargada[]>([]);
  const [assistantPrepopText, setAssistantPrepopText] = useState<string>('');

  // Core outfits and database states
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [calendario, setCalendario] = useState<CalendarioOutfits>({});
  const [semanal, setSemanal] = useState<SemanalPlan>({});
  const [historial, setHistorial] = useState<Outfit[]>([]);
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
  const [copiedOutfit, setCopiedOutfit] = useState<Outfit | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Backup manager expansion
  const [showBackupManager, setShowBackupManager] = useState(false);

  // AI Provider & Image Fallback Settings persistence states
  const [showAiSettingsPanel, setShowAiSettingsPanel] = useState(false);
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem('sboy_ai_settings_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return {
      primary: { provider: 'Gemini', apiKey: '', model: 'gemini-3.5-flash' },
      secondary: { provider: 'DeepSeek', apiKey: '', model: 'deepseek-chat' },
      tertiary: { provider: 'OpenAI', apiKey: '', model: 'gpt-3.5-turbo' },
      speedMode: 'Balanced',
      customTimeout: 20,
      fallbackAutomatico: true,
      compararRespuestas: false,
      pixabayKey: '',
      pexelsKey: '',
      unsplashKey: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('sboy_ai_settings_v3', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Dynamic Aesthetic states
  const [currentAesthetic, setCurrentAesthetic] = useState<string>(() => {
    return localStorage.getItem('sboy_current_aesthetic') || 'Soft Boy';
  });
  const [aestheticSearchText, setAestheticSearchText] = useState('');
  const [isSearchingAesthetic, setIsSearchingAesthetic] = useState(false);
  const [aestheticSearchStep, setAestheticSearchStep] = useState('');

  // Daily Notifications & Quick Bubble Assistant states
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; date: string; title: string; text: string; lookQuery?: string }>>([
    {
      id: 'notif-1',
      date: 'Hoy, 08:30 AM',
      title: '🧣 El accesorio perfecto',
      text: 'Aiko sugiere: Una bufanda en tono pastel o crema le daría un aire sumamente reconfortante a tu outfit actual. ¡Pruébalo!',
      lookQuery: '¿Debería usar bufanda con mi outfit?'
    },
    {
      id: 'notif-2',
      date: 'Ayer, 10:15 AM',
      title: '🌟 Tendencia urbana AI',
      text: 'Buscando en la web: Los outfits minimalistas cómodos con pantalones beige holgados están liderando los tableros de inspiración.',
      lookQuery: 'Recomiéndame un outfit minimalista cómodo'
    },
    {
      id: 'notif-3',
      date: 'Hace 2 días',
      title: '☕ Inspiración Casual Soft',
      text: '¡Visto en Pinteres! Combina suéter de punto con zapatos blancos impecables para una vibra artística de fin de semana.',
      lookQuery: '¿Cómo combinar un suéter de punto?'
    }
  ]);
  const [showChatBubble, setShowChatBubble] = useState(false);
  const [bubbleInputText, setBubbleInputText] = useState('');
  const [isBubbleTyping, setIsBubbleTyping] = useState(false);
  
  // Custom high-fidelity drag & resize state fields for the floating assistant
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });
  const [bubbleSize, setBubbleSize] = useState({ width: 320, height: 420 });
  
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const posStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const resizeStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const sizeStartRef = React.useRef<{ width: number; height: number }>({ width: 320, height: 420 });

  const handleDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...bubblePos };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setBubblePos({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy
    });
  };

  const handleDragUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = { x: e.clientX, y: e.clientY };
    sizeStartRef.current = { ...bubbleSize };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStartRef.current) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    
    // Bottom-left resize anchor behavior: dragging left expands width, dragging down expands height
    const calculatedWidth = Math.max(260, Math.min(480, sizeStartRef.current.width - dx));
    const calculatedHeight = Math.max(300, Math.min(650, sizeStartRef.current.height + dy));
    
    setBubbleSize({
      width: calculatedWidth,
      height: calculatedHeight
    });
  };

  const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Synchronize bubbleMessages directly with assistantMessages state for perfect sync
  const bubbleMessages = assistantMessages.length > 0 ? assistantMessages : [
    {
      id: 'bm-init',
      sender: 'assistant',
      text: '¡Hola! Qué outfit tan lindo. 🧸 Pregúntame si deberías usar bufanda hoy, qué cosas le agregarías para que resalte, o consúltame de cualquier tema (cocina, literatura, matemáticas, etc.). ¡Sube una foto para opinar!',
      timestamp: 'Ahora'
    }
  ];

  // 1. Initial State Loading from LocalStorage on mount
  useEffect(() => {
    try {
      // Theme Mode Preference
      const savedTheme = localStorage.getItem('sboy_theme_mode') as 'light' | 'dark' | 'auto' | null;
      const initialMode = savedTheme || 'auto';
      setThemeMode(initialMode);

      if (initialMode === 'light') {
        setDarkMode(false);
      } else if (initialMode === 'dark') {
        setDarkMode(true);
      } else {
        const osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(osDark);
      }

      // Clothes list load
      const savedPrendas = localStorage.getItem('sboy_prendas');
      let loadedPrendas: Prenda[] = [];
      if (savedPrendas) {
        loadedPrendas = JSON.parse(savedPrendas);
      } else {
        loadedPrendas = INITIAL_PRENDAS;
      }
      setPrendas(loadedPrendas);

      // Favorites index builder
      const favList = loadedPrendas.filter(p => p.isFavorite).map(p => p.id);
      setFavorites(favList);

      // Calendario loader
      const savedCalendar = localStorage.getItem('sboy_calendario');
      if (savedCalendar) {
        setCalendario(JSON.parse(savedCalendar));
      }

      // Semanal Loader
      const savedSemanal = localStorage.getItem('sboy_semanal');
      if (savedSemanal) {
        setSemanal(JSON.parse(savedSemanal));
      }

      // Historial Loader
      const savedHistorial = localStorage.getItem('sboy_historial');
      let loadedHistorial: Outfit[] = [];
      if (savedHistorial) {
        loadedHistorial = JSON.parse(savedHistorial);
        setHistorial(loadedHistorial);
      }

      // Current Outfit Loader
      const savedCurrentOutfit = localStorage.getItem('sboy_current_outfit');
      if (savedCurrentOutfit) {
        setCurrentOutfit(JSON.parse(savedCurrentOutfit));
      } else {
        // Run initial configuration random pick
        const firstPick = generateSmartPick(loadedPrendas, {}, 'Todas', []);
        if (firstPick) {
          setCurrentOutfit(firstPick);
          loadedHistorial.push(firstPick);
          setHistorial([...loadedHistorial]);
          localStorage.setItem('sboy_historial', JSON.stringify(loadedHistorial));
          localStorage.setItem('sboy_current_outfit', JSON.stringify(firstPick));
        }
      }

      // Chat Messages Loader
      const savedChats = localStorage.getItem('sboy_chats');
      if (savedChats) {
        setAssistantMessages(JSON.parse(savedChats));
      }
    } catch (e) {
      console.error("Local storage error on initialize", e);
    }
  }, []);

  // Register PWA Service Worker for high fidelity background AI processing & sync
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);
          
          // Request push notification permissions style
          if ('Notification' in window) {
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
          }

          // Sync tag helper registration for Background Sync
          const regAny = registration as any;
          if (regAny.sync) {
            regAny.sync.register('sync-ai-chat').catch((err: any) => {
              console.warn('Sync registration failed:', err);
            });
          }
        })
        .catch(err => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    }
  }, []);

  // Listen to OS preferences changes dynamically
  useEffect(() => {
    if (themeMode !== 'auto') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // 2. Persist state changes automatically on changes (offline support mechanics)
  useEffect(() => {
    if (prendas.length > 0) {
      localStorage.setItem('sboy_prendas', JSON.stringify(prendas));
    }
  }, [prendas]);

  useEffect(() => {
    localStorage.setItem('sboy_calendario', JSON.stringify(calendario));
  }, [calendario]);

  useEffect(() => {
    localStorage.setItem('sboy_semanal', JSON.stringify(semanal));
  }, [semanal]);

  useEffect(() => {
    if (historial.length > 0) {
      localStorage.setItem('sboy_historial', JSON.stringify(historial));
    }
  }, [historial]);

  useEffect(() => {
    if (currentOutfit) {
      localStorage.setItem('sboy_current_outfit', JSON.stringify(currentOutfit));
    }
  }, [currentOutfit]);

  useEffect(() => {
    if (assistantMessages.length > 0) {
      localStorage.setItem('sboy_chats', JSON.stringify(assistantMessages));
    }
  }, [assistantMessages]);

  useEffect(() => {
    localStorage.setItem('sboy_current_aesthetic', currentAesthetic);
  }, [currentAesthetic]);

  const toggleFavorite = (id: string) => {
    const updatedPrendas = prendas.map(p => {
      if (p.id === id) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });

    setPrendas(updatedPrendas);
    const updatedFavorites = updatedPrendas.filter(p => p.isFavorite).map(p => p.id);
    setFavorites(updatedFavorites);
  };

  const addToHistorial = (outfit: Outfit) => {
    setHistorial(prev => {
      const next = [...prev, outfit];
      return next.slice(-7); // Keep only last 7 generated combinations strictly
    });
  };

  const cycleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    let nextMode: 'light' | 'dark' | 'auto';
    if (themeMode === 'light') {
      nextMode = 'dark';
      setDarkMode(true);
    } else if (themeMode === 'dark') {
      nextMode = 'auto';
      const osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(osDark);
    } else {
      nextMode = 'light';
      setDarkMode(false);
    }
    setThemeMode(nextMode);
    localStorage.setItem('sboy_theme_mode', nextMode);
  };

  // JSON Export / Import handlers
  const handleExportDataJSON = () => {
    const exportState: AppStateExport = {
      prendas,
      calendario,
      semanal,
      favoritos: favorites,
      historial
    };

    const strJson = JSON.stringify(exportState, null, 2);
    const blob = new Blob([strJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SoftBoyCloset_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('¡Configuración exportada correctamente!');
  };

  const handleImportDataJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed: AppStateExport = JSON.parse(textStr);

        if (parsed.prendas && Array.isArray(parsed.prendas)) {
          setPrendas(parsed.prendas);
        }
        if (parsed.calendario) {
          setCalendario(parsed.calendario);
        }
        if (parsed.semanal) {
          setSemanal(parsed.semanal);
        }
        if (parsed.historial && Array.isArray(parsed.historial)) {
          setHistorial(parsed.historial);
          if (parsed.historial.length > 0) {
            setCurrentOutfit(parsed.historial[parsed.historial.length - 1]);
          }
        }
        if (parsed.favoritos) {
          setFavorites(parsed.favoritos);
        }

        alert('¡Configuración importada y cargada con éxito!');
        setShowBackupManager(false);
      } catch (err) {
        alert('Formato de archivo inválido. Por favor selecciona un JSON exportado anteriormente.');
      }
    };
    reader.readAsText(file);
  };

  const sendBubbleMessage = async (text: string) => {
    if (!text.trim()) return;
    if (navigator.vibrate) navigator.vibrate(40);

    const userMsg: ChatMessage = {
      id: `m-bubble-user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...bubbleMessages, userMsg];
    setAssistantMessages(newMessages);
    setBubbleInputText('');
    setIsBubbleTyping(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text.trim(),
          history: bubbleMessages.map(m => ({ sender: m.sender, text: m.text })),
          prendas,
          currentOutfit,
          currentAesthetic,
          aiSettings: aiSettings
        })
      });

      const elapsed = Date.now() - startTime;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error de conexión con la consultora AI. Revisa tu clave o tu conexión a internet.');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `m-bubble-ass-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || data.response || 'Disculpa, sigo pensando. ¿Hay algo más que quieras preguntarme?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        providerUsed: data.providerUsed || 'Gemini Flash',
        responseTime: elapsed
      };

      setAssistantMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const elapsedOnErr = Date.now() - startTime;
      const errMsg: ChatMessage = {
        id: `m-bubble-err-${Date.now()}`,
        sender: 'assistant',
        text: error.message || 'Error de conexión con la consultora AI. Revisa tu clave o conexión a internet.',
        timestamp: 'Ahora',
        providerUsed: 'Falla',
        responseTime: elapsedOnErr
      };
      setAssistantMessages(prev => [...prev, errMsg]);
    } finally {
      setIsBubbleTyping(false);
    }
  };

  const activeTheme = themesList.find(t => t.id === currentThemeId) || SYSTEM_THEMES[0];

  return (
    <div 
      className="min-h-screen transition-all duration-300 font-sans antialiased relative overflow-x-hidden"
      style={{
        backgroundColor: darkMode ? '#181412' : activeTheme.bg,
        color: darkMode ? '#f3edf2' : activeTheme.text
      }}
    >
      {/* 5. Injected Dynamic Theme CSS Overrides bar */}
      <style>{`
        .bg-white, .bg-white\\/90, .bg-white\\/80, .bg-white\\/75 {
          background-color: ${darkMode ? 'rgba(32, 26, 23, 0.95)' : activeTheme.bgCard} !important;
        }
        .text-gray-800, .text-gray-850, .text-gray-900 {
          color: ${darkMode ? '#f3edf2' : activeTheme.text} !important;
        }
        .text-gray-500, .text-gray-650 {
          color: ${darkMode ? 'rgba(243, 237, 242, 0.7)' : activeTheme.textMuted} !important;
        }
        .border-[#c4b5a5], .border-[#c4b5a5]\\/30, .border-[#c4b5a5]\\/40 {
          border-color: ${darkMode ? 'rgba(74, 63, 53, 0.4)' : activeTheme.borderColor} !important;
        }
        .text-[#a67c52], .text-[#a67c52]\\/80, .text-[#a67c52]\\/60 {
          color: ${darkMode ? '#d4b896' : activeTheme.accent} !important;
        }
        .bg-[#a67c52] {
          background-color: ${darkMode ? '#a67c52' : activeTheme.accent} !important;
        }
        .bg-[#fef9ef], .bg-[#fcf7ee], .bg-[#fdfdfb]\\/50, .bg-[#fcfcf9], .bg-[#fdfaf5], .bg-[#fdfdfc]\\/80 {
          background-color: ${darkMode ? '#181311' : activeTheme.bg} !important;
        }
        .bg-[#e8dccc], .bg-[#e8dccc]\\/10, .bg-[#e8dccc]\\/30, .bg-[#e8dccc]\\/40, .bg-[#e8dccc]\\/60 {
          background-color: ${darkMode ? '#2c221c' : activeTheme.accentLight} !important;
        }
      `}</style>

      {/* --- FLOATING BEARS DECORATION COMPONENT --- */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {FLOATING_BEARS_DATA.map(bear => (
          <div
            key={bear.id}
            className="floating-bear flex items-center justify-center"
            style={{
              left: bear.left,
              fontSize: bear.size,
              animationDelay: bear.delay,
              '--bear-duration': bear.duration,
              '--bear-sway-duration': bear.swayDuration,
              '--bear-opacity': String(darkMode ? bear.opacity * 0.75 : bear.opacity),
              color: '#a67c52',
            } as React.CSSProperties}
          >
            🧸
          </div>
        ))}
      </div>

      {/* Header element bar */}
      <header 
        className="sticky top-0 z-40 transition-colors duration-300 px-4 py-3.5 border-b flex items-center justify-between backdrop-blur-md"
        style={{
          backgroundColor: darkMode ? 'rgba(32, 26, 23, 0.85)' : 'rgba(232, 220, 204, 0.85)',
          borderColor: darkMode ? '#322722' : '#c4b5a5'
        }}
      >
        <div className="flex items-center gap-2 z-10">
          {/* Circular logo mark */}
          <div className="h-9 w-9 rounded-xl bg-[#a67c52] flex items-center justify-center text-white shrink-0 shadow-sm relative">
            <Shirt size={18} />
            <span className="absolute -top-1 -right-1 text-[8px] p-0.5 bg-yellow-500 rounded-full text-black font-bold">🧸</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight block">Clóset Soft Boy</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-[#a67c52] block leading-none">Capsule Wardrobe</span>
          </div>
        </div>

        {/* Action Toggle tools */}
        <div className="flex items-center gap-1.5 z-10">
          {/* Theme Store Boutique activator */}
          <button
            onClick={() => setShowThemeStore(true)}
            id="theme-store-trigger"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-500/10 transition-all text-[#a67c52] border border-[#c4b5a5]/35 bg-white/40 dark:bg-[#251e1a]/40 cursor-pointer text-[10.5px] font-bold"
            style={{ minHeight: '40px' }}
            title="Tienda de Temas Soft Boy"
          >
            <ShoppingBag size={14} />
            <span className="hidden xs:inline">TIENDA</span>
          </button>

          {/* Theme custom cycle toggle */}
          <button
            onClick={cycleTheme}
            id="theme-toggler"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-neutral-500/10 transition-all text-[#a67c52] border border-[#c4b5a5]/35 bg-white/40 dark:bg-[#251e1a]/40 cursor-pointer"
            style={{ minHeight: '40px' }}
            title={`Tema: ${themeMode === 'light' ? 'Claro' : themeMode === 'dark' ? 'Oscuro' : 'Auto (Sistema)'}`}
          >
            {themeMode === 'light' && <Sun size={15} />}
            {themeMode === 'dark' && <Moon size={15} />}
            {themeMode === 'auto' && <Laptop size={15} />}
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase shrink-0">
              {themeMode === 'light' ? 'CLARO' : themeMode === 'dark' ? 'OSCURO' : 'SISTEMA'}
            </span>
          </button>

          {/* Daily Notifications Bell Indicator */}
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(false);
              if (navigator.vibrate) navigator.vibrate(40);
            }}
            id="notification-bell-btn"
            className="p-2 ml-1 rounded-xl hover:bg-neutral-500/10 transition-colors text-[#a67c52] cursor-pointer inline-flex items-center justify-center relative bg-white/40 dark:bg-[#251e1a]/40 border border-[#c4b5a5]/35"
            style={{ minHeight: '40px', minWidth: '40px' }}
            title="Inspiraciones y Alertas de Moda del Día"
          >
            <Bell size={17} className={unreadNotifications ? "animate-bounce" : ""} />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* JSON File Backup Toggle */}
          <button
            onClick={() => setShowBackupManager(!showBackupManager)}
            id="backup-trigger-btn"
            className="p-2 ml-1 rounded-xl hover:bg-neutral-500/10 transition-colors text-[#a67c52] cursor-pointer inline-flex items-center justify-center search-trigger"
            style={{ minHeight: '40px', minWidth: '40px' }}
            title="Importar/Exportar Datos"
          >
            <Download size={17} />
          </button>

          {/* AI Settings Gear Panel */}
          <button
            onClick={() => {
              setShowAiSettingsPanel(true);
              if (navigator.vibrate) navigator.vibrate(30);
            }}
            id="ai-panel-trigger-btn"
            className="p-2 ml-1 rounded-xl hover:bg-neutral-500/10 transition-colors text-[#a67c52] cursor-pointer inline-flex items-center justify-center bg-white/40 dark:bg-[#251e1a]/40 border border-[#c4b5a5]/35"
            style={{ minHeight: '40px', minWidth: '40px' }}
            title="Configuración de IA y Respuestas Rápidas"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>

      {/* Main container with relative class level to stack ON TOP of bears */}
      <main className="max-w-md mx-auto px-4 pt-5 pb-28 relative z-10">

        {/* Daily Notifications panel overlay drawer */}
        {showNotifications && (
          <div 
            id="notifications-drawer-panel"
            className="mb-5 p-5 rounded-3xl border transition-all duration-300 shadow-md bg-white dark:bg-[#201a17]"
            style={{
              borderColor: darkMode ? '#3a312a' : '#c4b5a5'
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#a67c52] flex items-center gap-1">
                🧁 Alertas y Tendencias de Moda AI
              </span>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-800"
              >
                CERRAR
              </button>
            </div>
            
            <p className="text-[11.5px] text-gray-600 dark:text-gray-300 mb-3.5 leading-relaxed">
              Aiko recopila ideas de internet diariamente sobre la estética "{currentAesthetic}". Presiona una idea para consultarla o manda tu opinión.
            </p>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto mb-4 pr-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-3.5 rounded-2xl bg-[#fdfdfb] dark:bg-[#251e1a] border border-[#c4b5a5]/30 hover:border-[#a67c52]/50 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <span>{notif.date}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">★ Web Trend</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1">{notif.title}</h4>
                  <p className="text-[11px] text-gray-650 dark:text-neutral-300 leading-normal italic">
                    "{notif.text}"
                  </p>
                  {notif.lookQuery && (
                    <button
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        setAssistantPrepopText(notif.lookQuery || '');
                        setActiveTab('asistente');
                        setShowNotifications(false);
                      }}
                      className="mt-1 self-start text-[10px] font-bold text-[#a67c52] hover:underline"
                    >
                      → Consultar esto con Aiko AI
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Retro-alimentation: generate alert */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(60);
                
                const randomTitles = [
                  "🌿 Bufandas de franela retro",
                  "👟 Sneakers de lona pastel",
                  "🎒 Bolsas estructuradas vintage",
                  "🧥 Sobrecamisas terracota"
                ];
                const randomTexts = [
                  "Aiko vio en tendencias: El calzado deportivo retro con calcetines altos es la firma de la temporada actual.",
                  "En tableros de diseño recomiendan: Una bufanda tejida gruesa le quita rigidez a abrigos formales.",
                  "Consejo de styling: Lleva un bolso cruzado de cuero marrón para darle peso visual en colores pastel.",
                  "Para tus conjuntos de viaje: Una sobrecamisa de algodón abierta añade textura y volumen fantástico."
                ];
                const randomPrompts = [
                  "¿Qué opinas del calzado deportivo retro con calcetines altos?",
                  "¿Cómo puedo usar una bufanda tejida gruesa con mi abrigo?",
                  "¿Están en tendencia las bolsas cruzadas de cuero marrón?",
                  "¿Cómo combinar una sobrecamisa de algodón abierta?"
                ];
                
                const idx = Math.floor(Math.random() * randomTitles.length);
                const newAlert = {
                  id: `notif-${Date.now()}`,
                  date: 'Hace unos segundos',
                  title: randomTitles[idx],
                  text: randomTexts[idx],
                  lookQuery: randomPrompts[idx]
                };

                setNotifications(prev => [newAlert, ...prev]);
                setUnreadNotifications(true);
                alert("¡Felicidades! Aiko ha aprendido de tus preferencias, buscando nuevas tendencias en la web y generando un consejo diario para ti.");
              }}
              id="generate-daily-alert-btn"
              className="w-full py-2.5 bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              style={{ minHeight: '40px' }}
            >
              <Sparkles size={13} className="animate-spin-slow" /> Buscar tendencias web del día
            </button>
          </div>
        )}

        {/* Backup manager panel overlay drawer */}
        {showBackupManager && (
          <div 
            id="backup-manager-panel"
            className="mb-5 p-5 rounded-3xl border transition-colors duration-300"
            style={{
              backgroundColor: darkMode ? '#2c2520' : '#e8dccc',
              borderColor: darkMode ? '#3a312a' : '#c4b5a5'
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Respaldo de Datos (JSON)</span>
              <button 
                onClick={() => setShowBackupManager(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-800"
              >
                CERRAR
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
              Exporta tu clóset completo con tus favoritos, historial de outfits y calendarios a un archivo, o cárgalo en otro dispositivo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportDataJSON}
                id="btn-export-json"
                className="py-2.5 bg-[#a67c52] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                <Download size={14} /> Exportar
              </button>

              <label
                className="py-2.5 bg-white border border-[#c4b5a5] text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-50 text-center"
                style={{ minHeight: '44px' }}
              >
                <Upload size={14} /> Importar...
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDataJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* AI & Image Fallback Settings Drawer Panel */}
        {showAiSettingsPanel && (
          <div 
            id="ai-settings-drawer-panel"
            className="mb-5 p-5 rounded-3xl border transition-all duration-300 shadow-md bg-[#fdfaf5] dark:bg-[#1d1714] border-[#c4b5a5] dark:border-[#42362c]"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#a67c52] flex items-center gap-1.5">
                ⚙️ Ajustes de IA & Proveedores
              </span>
              <button 
                onClick={() => setShowAiSettingsPanel(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white shrink-0 bg-[#e8dccc]/30 px-2 py-1 rounded-md"
              >
                CERRAR
              </button>
            </div>

            <p className="text-[11.2px] text-gray-650 dark:text-neutral-350 mb-4 leading-normal">
              Configura hasta 3 proveedores AI en orden de preferencia, estrategias de velocidad ("Fast" para respuestas de 100 palabras / historial corto, o "Accurate" para contexto largo) y claves para el carrusel de respaldo de imágenes.
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              
              {/* SECTION 1: AI CHAINS */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-[#e8dccc]/15 dark:bg-[#2c221c]/30 border border-[#c4b5a5]/20">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider font-mono text-[#a67c52] dark:text-[#d4b896]">
                  ⛓️ Cadena de Prioridad de IA
                </h4>

                {/* Primary AI */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold uppercase font-mono text-gray-500 dark:text-neutral-400">1º Proveedor Principal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={aiSettings.primary.provider}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        primary: { ...prev.primary, provider: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    >
                      <option value="Gemini">Google Gemini</option>
                      <option value="DeepSeek">DeepSeek</option>
                      <option value="OpenAI">OpenAI (GPT)</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                    <input
                      type="password"
                      placeholder="API Key (Opcional)"
                      value={aiSettings.primary.apiKey}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        primary: { ...prev.primary, apiKey: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    />
                  </div>
                </div>

                {/* Secondary AI */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold uppercase font-mono text-gray-500 dark:text-neutral-400">2º Fallback Siguiente</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={aiSettings.secondary.provider}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        secondary: { ...prev.secondary, provider: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    >
                      <option value="Gemini">Google Gemini</option>
                      <option value="DeepSeek">DeepSeek</option>
                      <option value="OpenAI">OpenAI (GPT)</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                    <input
                      type="password"
                      placeholder="API Key (Opcional)"
                      value={aiSettings.secondary.apiKey}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        secondary: { ...prev.secondary, apiKey: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    />
                  </div>
                </div>

                {/* Tertiary AI */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold uppercase font-mono text-gray-500 dark:text-neutral-400">3º Failsafe Terciario</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={aiSettings.tertiary.provider}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        tertiary: { ...prev.tertiary, provider: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    >
                      <option value="Gemini">Google Gemini</option>
                      <option value="DeepSeek">DeepSeek</option>
                      <option value="OpenAI">OpenAI (GPT)</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                    <input
                      type="password"
                      placeholder="API Key (Opcional)"
                      value={aiSettings.tertiary.apiKey}
                      onChange={(e) => setAiSettings((prev: any) => ({
                        ...prev,
                        tertiary: { ...prev.tertiary, apiKey: e.target.value }
                      }))}
                      className="bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-[#f3edf2]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SPEED CONFIG */}
              <div className="space-y-3 p-3 rounded-2xl bg-[#e8dccc]/15 dark:bg-[#2c221c]/30 border border-[#c4b5a5]/20">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider font-mono text-[#a67c52] dark:text-[#d4b896]">
                  ⚡ Estrategias de Velocidad
                </h4>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-bold uppercase font-mono text-gray-500 dark:text-neutral-400 block">Modo de Respuesta</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#e8dccc]/30 dark:bg-[#241c18] p-1 rounded-xl">
                    {['Fast', 'Balanced', 'Accurate'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAiSettings((prev: any) => ({ ...prev, speedMode: mode }))}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          aiSettings.speedMode === mode
                            ? 'bg-[#a67c52] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {mode === 'Fast' ? 'FAST (⚡)' : mode === 'Balanced' ? 'BALANCED' : 'ACCURATE (🎯)'}
                      </button>
                    ))}
                  </div>
                  <span className="text-[8.5px] text-gray-500 block leading-tight mt-1">
                    * Fast: Timeout de 15s. Respuestas concisas (100 palabras) y contexto de 5 mensajes.
                    <br />
                    * Accurate: Timeout de 45s. Respuestas sumamente detalladas y contexto completo.
                  </span>
                </div>

                {/* Fallback Automatico Toggle */}
                <div className="flex items-center justify-between py-1 border-t border-[#c4b5a5]/20 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10.5px] font-bold text-gray-700 dark:text-neutral-200">Reintento Automático (Fallback)</span>
                    <span className="text-[8.5px] text-gray-500">Usa el siguiente motor si el previo falla o tarda</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSettings.fallbackAutomatico}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, fallbackAutomatico: e.target.checked }))}
                    className="h-4 w-4 rounded-md text-[#a67c52] border-gray-300 focus:ring-[#a67c52]"
                  />
                </div>

                {/* Comparar Respuestas Toggle */}
                <div className="flex items-center justify-between py-1 border-t border-[#c4b5a5]/20 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10.5px] font-bold text-gray-700 dark:text-neutral-200">Comparar Respuestas (Multi-motor)</span>
                    <span className="text-[8.5px] text-gray-500">Pregunta a los 2 primeros motores y muestra ambos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSettings.compararRespuestas}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, compararRespuestas: e.target.checked }))}
                    className="h-4 w-4 rounded-md text-[#a67c52] border-gray-300 focus:ring-[#a67c52]"
                  />
                </div>

                {/* Custom Timeout Input limit */}
                <div className="space-y-1 block border-t border-[#c4b5a5]/20 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-neutral-400">
                    <span>Timeout Límite Personalizado</span>
                    <span className="text-[#a67c52]">{aiSettings.customTimeout} Segundos</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={aiSettings.customTimeout}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, customTimeout: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#a67c52]"
                  />
                </div>
              </div>

              {/* SECTION 3: IMAGE FALLBACKS */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-[#e8dccc]/15 dark:bg-[#2c221c]/30 border border-[#c4b5a5]/20">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider font-mono text-[#a67c52] dark:text-[#d4b896]">
                  🖼️ Respaldo de Base de Fotos API
                </h4>
                <p className="text-[8.5px] text-gray-500 leading-tight">
                  Para que tus outfits siempre tengan un render visual óptimo, Aiko sigue esta cascada inteligente: <strong>Pollinations.ai → Pixabay → Pexels → Unsplash → Silueta SVG Local</strong>. Si no tienes o configuras claves, Pollinations y la Silueta local operan gratis.
                </p>

                {/* Pixabay Key */}
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold font-mono text-gray-500 dark:text-neutral-400">Pixabay API Clave</label>
                  <input
                    type="password"
                    placeholder="Escribe clave API de Pixabay (opcional)"
                    value={aiSettings.pixabayKey}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, pixabayKey: e.target.value }))}
                    className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1 text-xs text-gray-800 dark:text-neutral-200"
                  />
                </div>

                {/* Pexels Key */}
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold font-mono text-gray-500 dark:text-neutral-400">Pexels API Clave</label>
                  <input
                    type="password"
                    placeholder="Escribe clave API de Pexels (opcional)"
                    value={aiSettings.pexelsKey}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, pexelsKey: e.target.value }))}
                    className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1 text-xs text-gray-800 dark:text-neutral-200"
                  />
                </div>

                {/* Unsplash Key */}
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold font-mono text-gray-500 dark:text-neutral-400">Unsplash Access Key</label>
                  <input
                    type="password"
                    placeholder="Escribe clave API de Unsplash (opcional)"
                    value={aiSettings.unsplashKey}
                    onChange={(e) => setAiSettings((prev: any) => ({ ...prev, unsplashKey: e.target.value }))}
                    className="w-full bg-white dark:bg-[#251e1a] border border-[#c4b5a5]/50 rounded-xl px-2.5 py-1 text-xs text-gray-800 dark:text-neutral-200"
                  />
                </div>
              </div>

            </div>

            <button
              onClick={() => {
                setShowAiSettingsPanel(false);
                if (navigator.vibrate) navigator.vibrate(50);
                alert("¡Ajustes de proveedores AI y carrusel de respaldo guardados con éxito!");
              }}
              className="mt-4 w-full py-2.5 bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-bold rounded-2xl text-[11.5px] text-center shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              style={{ minHeight: '44px' }}
            >
              💾 Confirmar y Aplicar Cambios
            </button>
          </div>
        )}

        {/* Dynamic Aesthetic Adaptor Control Hub */}
        <div 
          className="mb-6 p-4 rounded-3xl border shadow-xs transition-all duration-300 bg-white/75 dark:bg-[#1f1714]/80 border-[#c4b5a5] dark:border-[#42362c] backdrop-blur-md"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#a67c52] flex items-center gap-1">
              🌐 Adaptador de Estética & Tendencias
            </span>
            <span className="text-[9px] bg-[#a67c52]/10 text-[#a67c52] dark:text-[#d4b896] dark:bg-[#a67c52]/20 font-bold px-2 py-0.5 rounded-full uppercase">
              Free • Sin límites
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-extrabold text-gray-800 dark:text-white">
              Estética Activa: <span className="text-[#a67c52] dark:text-[#e8dccc] underline decoration-wavy decoration-1 decoration-[#d4b896]">{currentAesthetic}</span>
            </h3>
            
            {/* Quick 1-tap restore to Soft Boy */}
            {currentAesthetic !== 'Soft Boy' && (
              <button
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  setCurrentAesthetic('Soft Boy');
                }}
                className="ml-auto text-[10px] font-bold text-[#a67c52] hover:text-[#a67c52]/90 flex items-center gap-1 bg-[#e8dccc]/60 dark:bg-[#2d221e]/80 py-1 px-2.5 rounded-full border border-[#c4b5a5]/30 cursor-pointer transition-all duration-200"
                title="Volver a Soft Boy"
              >
                🧸 Volver a Soft Boy
              </button>
            )}
          </div>

          {/* Preset aesthetics select buttons */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            {['Minimalista', 'Old Money', 'Grunge', 'Y2K', 'Streetwear', 'Cottagecore'].map(ast => {
              const isSelected = currentAesthetic.toLowerCase() === ast.toLowerCase();
              return (
                <button
                  key={ast}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(40);
                    setCurrentAesthetic(ast);
                  }}
                  className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-200 border cursor-pointer ${
                    isSelected 
                      ? 'bg-[#a67c52] text-[#fef9ef] border-[#a67c52]' 
                      : 'bg-[#fef9ef] dark:bg-[#251e1a] text-gray-700 dark:text-gray-300 border-[#c4b5a5] dark:border-[#4a3f35] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  style={{ minHeight: '34px' }}
                >
                  {ast}
                </button>
              );
            })}
          </div>

          {/* Simulated search Loader with dynamic delays */}
          {isSearchingAesthetic ? (
            <div className="p-3 bg-[#e8dccc]/30 dark:bg-[#2d221e]/40 rounded-2xl border border-[#c4b5a5]/30 dark:border-[#4a3f35]/30 mt-2 flex flex-col gap-2.5 items-center justify-center text-center animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-[#a67c52] border-t-transparent animate-spin"></div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-neutral-300 font-mono">
                {aestheticSearchStep}
              </span>
            </div>
          ) : (
            /* Custom Search Aesthetic bar connect to mock web trend finder */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aestheticSearchText.trim()) return;
                const query = aestheticSearchText.trim();
                setAestheticSearchText('');
                setIsSearchingAesthetic(true);

                if (navigator.vibrate) navigator.vibrate(60);

                // Phase 1 Search
                setAestheticSearchStep(`🔍 Conectando con motores de búsqueda de moda urbana para "${query}"...`);

                setTimeout(() => {
                  // Phase 2 Extraction
                  setAestheticSearchStep(`📊 Pinterest & Instagram: Descargando paleta de colores y siluetas típicas...`);
                  
                  setTimeout(() => {
                    // Phase 3 Configuration
                    setAestheticSearchStep(`🤖 Sincronizando modelo AI de la nube con las reglas de estilo de "${query}"...`);
                    
                    setTimeout(() => {
                      // Finalizing and adapting preferences
                      setIsSearchingAesthetic(false);
                      setCurrentAesthetic(query.charAt(0).toUpperCase() + query.slice(1));
                      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    }, 800);
                  }, 800);
                }, 800);
              }}
              className="flex gap-2 mt-1.5"
            >
              <input
                type="text"
                value={aestheticSearchText}
                onChange={e => setAestheticSearchText(e.target.value)}
                placeholder="Buscar otra estética en la web (ej. Gorpcore, Coquette)..."
                className="flex-1 bg-[#fef9ef] dark:bg-[#1c1714] border border-[#c4b5a5] dark:border-[#4a3f35] rounded-xl px-3 py-2 text-[11px] text-gray-800 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:border-[#a67c52]"
                style={{ minHeight: '40px' }}
              />
              <button
                type="submit"
                className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-semibold text-[11px] px-3.5 rounded-xl transition-all font-sans cursor-pointer shrink-0"
                style={{ minHeight: '40px' }}
              >
                Buscar Estilo
              </button>
            </form>
          )}
        </div>

        {/* Tab Selection Page router */}
        <div className="transition-all duration-300">
          {activeTab === 'generador' && (
            <GeneradorTab
              prendas={prendas}
              currentOutfit={currentOutfit}
              setCurrentOutfit={setCurrentOutfit}
              historial={historial}
              addToHistorial={addToHistorial}
              currentAesthetic={currentAesthetic}
              aiSettings={aiSettings}
            />
          )}

          {activeTab === 'chat_ia' && (
            <ChatIATab
              prendas={prendas}
              currentOutfit={currentOutfit}
              messages={assistantMessages}
              setMessages={setAssistantMessages}
              currentAesthetic={currentAesthetic}
              aiSettings={aiSettings}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioTab
              prendas={prendas}
              calendario={calendario}
              setCalendario={setCalendario}
              copiedOutfit={copiedOutfit}
              setCopiedOutfit={setCopiedOutfit}
            />
          )}

          {activeTab === 'armario' && (
            <ArmarioTab
              prendas={prendas}
              setPrendas={setPrendas}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'semanal' && (
            <SemanalTab
              prendas={prendas}
              semanal={semanal}
              setSemanal={setSemanal}
            />
          )}

          {activeTab === 'fuentes' && (
            <FuentesTab
              prendas={prendas}
              setPrendas={setPrendas}
              fuentes={fuentes}
              setFuentes={setFuentes}
              setActiveTab={setActiveTab}
              setAssistantPrepopText={setAssistantPrepopText}
            />
          )}
        </div>
      </main>

      {/* Persistent floating glassmorphic Footer Navigation */}
      <nav 
        className="fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto rounded-[24px] border shadow-lg backdrop-blur-lg px-2 py-1.5 flex items-center justify-between transition-colors duration-300"
        style={{
          backgroundColor: darkMode ? 'rgba(44, 37, 32, 0.9)' : 'rgba(232, 220, 204, 0.9)',
          borderColor: darkMode ? '#3a312a' : '#c4b5a5'
        }}
      >
        {[
          { key: 'generador', label: 'Generador', icon: Wand2 },
          { key: 'chat_ia', label: 'Chat IA', icon: MessageCircle },
          { key: 'calendario', label: 'Calendario', icon: Calendar },
          { key: 'armario', label: 'Armario', icon: Shirt },
          { key: 'semanal', label: 'Semanal', icon: Layers },
        ].map(tb => {
          const isActive = activeTab === tb.key;
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(25);
                setActiveTab(tb.key as any);
              }}
              id={`nav-tab-${tb.key}`}
              className={`flex flex-col items-center justify-center rounded-xl flex-1 py-1 transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'text-[#a67c52] font-semibold scale-105' 
                  : 'text-gray-500 hover:text-[#a67c52]/80'
              }`}
              style={{ minHeight: '44px' }}
            >
              <Icon size={16} className={isActive ? 'animate-pulse text-[#a67c52]' : ''} />
              <span className="text-[8px] tracking-tight font-sans mt-0.5">{tb.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Store Boutique Overlay Panel */}
      {showThemeStore && (
        <ThemeStore
          currentThemeId={currentThemeId}
          setCurrentThemeId={setCurrentThemeId}
          softBoyCoins={softBoyCoins}
          setSoftBoyCoins={setSoftBoyCoins}
          themesList={themesList}
          setThemesList={setThemesList}
          onClose={() => setShowThemeStore(false)}
        />
      )}

      {/* 🟢 FLOATING AIKO CHAT BUBBLE HELPER WIDGET */}
      <div className="fixed bottom-22 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Quick Bubble Chat Card Popover */}
        {showChatBubble && (
          <div 
            id="quick-bubble-chat-card"
            className="rounded-3xl border border-[#c4b5a5]/70 dark:border-[#42362c] shadow-2xl bg-white dark:bg-[#1a1513] flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-350 relative"
            style={{
              width: `${bubbleSize.width}px`,
              height: `${bubbleSize.height}px`,
              transform: `translate(${bubblePos.x}px, ${bubblePos.y}px)`,
              touchAction: 'none'
            }}
          >
            {/* Popover Header (Draggable) */}
            <div 
              onPointerDown={handleDragDown}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragUp}
              onPointerLeave={handleDragUp}
              className="bg-[#e8dccc] dark:bg-[#2d231e] px-4 py-3 pb-3 flex items-center justify-between border-b border-[#c4b5a5]/65 cursor-grab active:cursor-grabbing select-none shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#a67c52] flex items-center justify-center text-white font-bold relative text-sm shadow-xs">
                  🧸
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#a67c52] dark:text-white">Aiko, tu consultora</h4>
                  <span className="text-[9px] text-gray-500 dark:text-neutral-400 font-mono tracking-tight block">Asesora de Estilo Virtual (Arrastra aquí)</span>
                </div>
              </div>
              <button 
                onClick={() => setShowChatBubble(false)}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Diagnostic helper badge based on Simulator current outfit status */}
            <div className="bg-[#fdfdfb] dark:bg-[#1c1714] px-3.5 py-2 border-b border-[#c4b5a5]/40 flex flex-col shrink-0">
              <span className="text-[8.5px] font-bold font-mono text-[#a67c52] dark:text-[#d4b896] uppercase tracking-wider">PRENDAS DETECTADAS EN SIMULACIÓN</span>
              <p className="text-[10px] text-gray-700 dark:text-neutral-300 truncate leading-tight mt-0.5">
                {currentOutfit 
                  ? `Superior: ${currentOutfit.superior.name} + Pantalón: ${currentOutfit.pantalones.name}`
                  : 'Ningún outfit cargado actualmente. Genera uno en el simulador.'}
              </p>
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fcf9f4]/30 dark:bg-[#15110f]/40 flex flex-col">
              {bubbleMessages.map((msg) => {
                const isAss = msg.sender === 'assistant';
                return (
                  <div key={msg.id} className={`flex gap-2 ${isAss ? 'justify-start' : 'justify-end'}`}>
                    {isAss && (
                      <div className="w-6 h-6 rounded-full bg-[#e8dccc] dark:bg-[#342922] flex items-center justify-center text-[#a67c52] shrink-0 self-end text-xs mb-0.5">
                        🧸
                      </div>
                    )}
                    <div className="flex flex-col max-w-[80%]">
                      <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                        isAss 
                          ? 'bg-[#e8dccc]/40 dark:bg-[#2c221e]/80 text-gray-800 dark:text-neutral-100 rounded-bl-none border border-[#c4b5a5]/20'
                          : 'bg-[#a67c52] text-white rounded-br-none'
                      }`}>
                        {msg.text}
                      </div>
                      {isAss && msg.providerUsed && (
                        <span className="text-[8.5px] font-mono text-[#a67c52] dark:text-[#d4b896] mt-0.5 ml-1 flex items-center gap-1 font-semibold">
                          ⏱️ {msg.responseTime ? `${(msg.responseTime / 1000).toFixed(1)}s` : '1.1s'} · {msg.providerUsed}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {isBubbleTyping && (
                <div className="flex gap-2 justify-start animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-[#e8dccc] dark:bg-[#342922] flex items-center justify-center text-[#a67c52] shrink-0 text-xs self-end mb-0.5">
                    🧸
                  </div>
                  <div className="bg-[#e8dccc]/35 dark:bg-[#2c221e]/40 px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick stylist questions bubble chips */}
            {currentOutfit && (
              <div className="px-3.5 py-1.5 bg-[#fefdfb]/80 dark:bg-[#1d1715]/80 border-t border-[#c4b5a5]/20 overflow-x-auto flex gap-1.5 scrollbar-hide shrink-0 select-none">
                <button
                  onClick={() => sendBubbleMessage('Aiko, ¿debería agregar una bufanda con este conjunto de ropa? ¿Se vería bien?')}
                  className="shrink-0 py-1 px-2.5 bg-[#e8dccc]/50 hover:bg-[#e8dccc] dark:bg-[#2d221c] text-[10px] font-semibold text-[#a67c52] dark:text-[#e2cbb0] rounded-full border border-[#c4b5a5]/30 cursor-pointer"
                  style={{ minHeight: '26px' }}
                >
                  🧣 ¿Usar bufanda?
                </button>
                <button
                  onClick={() => sendBubbleMessage('¿Qué cosas le agregarías a mi outfit para que se vea extraordinario y Soft Boy?')}
                  className="shrink-0 py-1 px-2.5 bg-[#e8dccc]/50 hover:bg-[#e8dccc] dark:bg-[#2d221c] text-[10px] font-semibold text-[#a67c52] dark:text-[#e2cbb0] rounded-full border border-[#c4b5a5]/30 cursor-pointer"
                  style={{ minHeight: '26px' }}
                >
                  ✨ ¿Qué agregarías?
                </button>
                <button
                  onClick={() => sendBubbleMessage('Dime objetivamente tu veredicto estético de mi look actual. ¿Funciona bien o mal y por qué?')}
                  className="shrink-0 py-1 px-2.5 bg-[#e8dccc]/50 hover:bg-[#e8dccc] dark:bg-[#2d221c] text-[10px] font-semibold text-[#a67c52] dark:text-[#e2cbb0] rounded-full border border-[#c4b5a5]/30 cursor-pointer"
                  style={{ minHeight: '26px' }}
                >
                  💡 ¿Funciona bien o mal?
                </button>
              </div>
            )}

            {/* Bubble Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendBubbleMessage(bubbleInputText);
              }}
              className="p-2 border-t border-[#c4b5a5]/50 bg-white dark:bg-[#1c1714] flex gap-1.5 items-center shrink-0 relative"
            >
              <input 
                type="text"
                value={bubbleInputText}
                onChange={(e) => setBubbleInputText(e.target.value)}
                placeholder="Pregúntale a Aiko sobre tu estilo..."
                className="flex-1 bg-[#fef9ef] dark:bg-[#251e1a] border border-[#c4b5a5]/60 dark:border-[#4a3f35]/50 rounded-xl px-3 py-2 text-[11px] text-gray-800 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:border-[#a67c52] transition-colors"
                style={{ minHeight: '34px' }}
              />
              <button
                type="submit"
                className="bg-[#a67c52] text-white rounded-xl h-[34px] px-3 font-semibold text-xs hover:bg-[#a67c52]/90 cursor-pointer shrink-0"
                style={{ minHeight: '34px' }}
              >
                Enviar
              </button>
            </form>

            {/* Corner Resize grab handle (Bottom-Left coordinate change) */}
            <div
              onPointerDown={handleResizeDown}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeUp}
              onPointerLeave={handleResizeUp}
              className="absolute bottom-1.5 left-1.5 w-4 h-4 cursor-nesw-resize z-40 flex items-center justify-center select-none"
              title="Arrastra para cambiar tamaño de ventana"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#a67c52]/50 hover:text-[#a67c52] fill-current">
                <path d="M0 10 L10 0 L10 2 L2 10 Z M4 10 L10 4 L10 6 L6 10 Z M8 10 L10 8 L10 10 Z" />
              </svg>
            </div>
          </div>
        )}

        {/* Adorable pulsing floating bear face button activator */}
        <button
          onClick={() => {
            setShowChatBubble(!showChatBubble);
            if (navigator.vibrate) navigator.vibrate([30, 40]);
          }}
          id="global-floating-chat-bubble"
          className="pointer-events-auto h-14 w-14 rounded-full bg-[#a67c52] text-white font-sans font-bold flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative cursor-pointer ring-4 ring-[#e8dccc]/50 dark:ring-[#a67c52]/20 group"
          style={{ minHeight: '56px', minWidth: '56px' }}
          title="Consulta rápido tu outfit con Aiko"
        >
          {showChatBubble ? (
            <X size={22} className="animate-in rotate-in duration-200" />
          ) : (
            <>
              <span className="text-2xl group-hover:animate-bounce">🧸</span>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center text-[8px] font-bold text-white">AI</span>
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
