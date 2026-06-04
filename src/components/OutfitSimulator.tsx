import React, { useState, useEffect, useRef } from 'react';
import { Outfit } from '../types';
import { COLOR_CLASSES_MAP } from '../data';
import { 
  Shirt, 
  Footprints, 
  Briefcase, 
  HelpCircle, 
  Sparkles, 
  MapPin, 
  Clock, 
  Settings2, 
  RefreshCw, 
  RotateCw, 
  Wifi, 
  WifiOff, 
  Compass, 
  Sun, 
  Moon, 
  Info,
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface OutfitSimulatorProps {
  outfit: Outfit | null;
  onToggleLock?: (slot: string) => void;
  lockedSlots?: { [key: string]: boolean };
  onWeatherSync?: (season: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno') => void;
  currentAesthetic?: string;
  aiSettings?: any;
}

export default function OutfitSimulator({ 
  outfit, 
  onToggleLock, 
  lockedSlots = {},
  onWeatherSync,
  currentAesthetic = 'Soft Boy',
  aiSettings
}: OutfitSimulatorProps) {
  
  // App-State preferences
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sboy_sim_ai_mode');
    return saved ? saved === 'true' : true;
  });

  const [gpsActive, setGpsActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('sboy_sim_gps_active');
    return saved === 'true';
  });

  const [renderStyle, setRenderStyle] = useState<string>(() => {
    const saved = localStorage.getItem('sboy_sim_render_style');
    return saved || 'realistic';
  });

  // 3D rotation angle settings (for CSS interactive mannequin)
  const [rotY, setRotY] = useState<number>(10);
  const [tiltX, setTiltX] = useState<number>(5);

  // System local time tracking
  const [localTime, setLocalTime] = useState<Date>(new Date());
  const [isAmMode, setIsAmMode] = useState<boolean>(new Date().getHours() < 12);

  // Geolocation & Weather statuses
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [localWeather, setLocalWeather] = useState<{
    temp: number;
    text: string;
    code: number;
    season: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno';
  } | null>(null);

  // Internet connectivity monitor
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // AI render states (Smooth background preload)
  const [seed, setSeed] = useState<number>(42);
  const [renderedUrl, setRenderedUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('Esperando motor...');
  const [aiImageError, setAiImageError] = useState<string | null>(null);

  // Manual trigger for photo rendering and live advice critiques
  const [showAiImage, setShowAiImage] = useState<boolean>(true);
  const [outfitDescription, setOutfitDescription] = useState<string>('');
  const [loadingDescription, setLoadingDescription] = useState<boolean>(false);

  // Fallback and timing tracker indicators
  const [useSvgFallback, setUseSvgFallback] = useState<boolean>(false);
  const [isSlowLoading, setIsSlowLoading] = useState<boolean>(false);
  const [imageGeneratorUsed, setImageGeneratorUsed] = useState<string>('pollinations');
  const [imageLoadDuration, setImageLoadDuration] = useState<string>('');

  // Reset and AUTOMATICALLY trigger live AI image loading as soon as the outfit is selected
  useEffect(() => {
    setUseSvgFallback(false);
    setIsSlowLoading(false);
    if (isOnline) {
      setIsAiMode(true);
      setShowAiImage(true);
    } else {
      setShowAiImage(false);
    }
  }, [outfit, isOnline]);

  // Load Aiko's sweet styling description from the Gemini API
  useEffect(() => {
    if (!outfit) {
      setOutfitDescription('');
      return;
    }

    setLoadingDescription(true);
    setOutfitDescription('Aiko analizando tu outfit con mucho cariño... 🧁');

    const fetchDescription = async () => {
      try {
        const response = await fetch('/api/describe-outfit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            outfit,
            aesthetic: currentAesthetic
          })
        });
        if (response.ok) {
          const data = await response.json();
          setOutfitDescription(data.description || 'Una hermosa combinación perfecta para ti.');
        } else {
          setOutfitDescription('Un conjunto sumamente armónico y acogedor con tonos bellos ideados para ti.');
        }
      } catch (err) {
        console.error("Failed to describe outfit:", err);
        setOutfitDescription('Un look encantador para expresar tu originalidad y buen gusto creativo de forma cómoda.');
      } finally {
        setLoadingDescription(false);
      }
    };

    fetchDescription();
  }, [outfit, currentAesthetic]);

  // Animated progressive loading texts
  const loadingSteps = [
    'Estableciendo enlace con el satélite gráfico...',
    'Consultando recomendador de vestuario Soft Boy AI...',
    'Iniciando motor de renderizado de modelos tridimensionales...',
    'Estructurando texturas de lana, algodón y calzado...',
    'Sincronizando paleta de colores con el clima del usuario...',
    'Ajustando sombras volumétricas según la iluminación actual...',
    'Rociando brillo de estudio fotográfico...',
    'Finalizando pulido e imágenes realistas en 8K...'
  ];

  // Sync state helpers inside localStorage
  useEffect(() => {
    localStorage.setItem('sboy_sim_ai_mode', String(isAiMode));
  }, [isAiMode]);

  useEffect(() => {
    localStorage.setItem('sboy_sim_gps_active', String(gpsActive));
  }, [gpsActive]);

  useEffect(() => {
    localStorage.setItem('sboy_sim_render_style', renderStyle);
  }, [renderStyle]);

  // Monitor network connection changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Continuous System local time syncing (for AM/PM adaptation)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLocalTime(now);
      setIsAmMode(now.getHours() < 12);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Progressive text rotation during AI loading states
  useEffect(() => {
    if (!imageLoading) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingSteps.length;
      setLoadingStepText(loadingSteps[index]);
    }, 1800);
    return () => clearInterval(interval);
  }, [imageLoading]);

  // GPS Weather trigger
  useEffect(() => {
    if (gpsActive) {
      triggerGpsScan();
    } else {
      setLocalWeather(null);
    }
  }, [gpsActive]);

  // GPS triggers helper fetch
  const triggerGpsScan = () => {
    if (!navigator.geolocation) {
      setGpsError('La Geolocalización no es soportada por su navegador.');
      setGpsActive(false);
      return;
    }

    setWeatherLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          if (!res.ok) throw new Error('Respuesta del servidor meteorológico incorrecta');
          const data = await res.json();
          const { temperature, weathercode } = data.current_weather;

          // Map weathercodes to visual state & Soft Boy seasons
          // 0, 1, 2, 3: Clear/Nice (Summer/Spring)
          // 45, 48: Misty
          // 51-67: Rainy
          // 71-86: Snowy/Cold
          let codeText = 'Despejado';
          let suggestedSeason: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' = 'Todo el año';

          if (weathercode === 0 || weathercode === 1) {
            codeText = 'Cielos Despejados';
            suggestedSeason = 'Todo el año'; // Warm weather
          } else if (weathercode === 2 || weathercode === 3) {
            codeText = 'Parcialmente Nublado';
            suggestedSeason = 'Otoño/Primavera';
          } else if (weathercode >= 45 && weathercode <= 48) {
            codeText = 'Niebla Seca';
            suggestedSeason = 'Otoño/Invierno';
          } else if ((weathercode >= 51 && weathercode <= 67) || (weathercode >= 80 && weathercode <= 82)) {
            codeText = 'Clima de Lluvia 🌧️';
            suggestedSeason = 'Otoño/Invierno';
          } else if ((weathercode >= 71 && weathercode <= 77) || (weathercode >= 85 && weathercode <= 86)) {
            codeText = 'Nieve / Frío Intenso ❄️';
            suggestedSeason = 'Invierno';
          } else {
            codeText = 'Tormentoso / Inestable';
            suggestedSeason = 'Invierno';
          }

          // Override if temperature is extreme
          if (temperature > 23) {
            suggestedSeason = 'Todo el año'; // Summer items preferred
          } else if (temperature < 12) {
            suggestedSeason = 'Invierno'; // Heavy items preferred
          }

          setLocalWeather({
            temp: Math.round(temperature),
            text: codeText,
            code: weathercode,
            season: suggestedSeason
          });

          // Sync back to algorithm if requested
          if (onWeatherSync) {
            onWeatherSync(suggestedSeason);
          }
        } catch (err: any) {
          console.error(err);
          setGpsError('Error consultando OpenMeteo API. Usando estimador de red.');
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        console.warn(err);
        setGpsError('Permiso GPS denegado o satélite ocupado.');
        setGpsActive(false);
        setWeatherLoading(false);
      },
      { timeout: 7000 }
    );
  };

  // Build the detailed prompt for the real-time AI graphic renderer
  const getPromptString = () => {
    if (!outfit) return '';
    const { superior, pantalones, zapatos, abrigo, accesorio, bolsa } = outfit;

    const hasAbrigo = abrigo && abrigo.name !== "Sin abrigo";
    const hasAccesorio = accesorio && accesorio.name !== "Sin bufanda" && accesorio.color !== "N/A";
    const hasBolsa = bolsa && bolsa.name !== "Sin bolsa" && bolsa.color !== "N/A";

    const hours = localTime.getHours();
    const isNight = hours >= 18 || hours < 6;
    const timeOfDayContext = isNight 
      ? 'starry warm twilight night with cozy urban coffee shop glowing lights in the background' 
      : 'crisp clear bright morning sunlight illuminating an elegant window outline';

    // Weather impact on the scenery
    let weatherScenery = 'modern minimalist fashion atelier bedroom room backdrop';
    if (localWeather) {
      if (localWeather.season === 'Invierno') {
        weatherScenery = 'cozy fireplace cabin room, aesthetic frosted snowy glass panels in the background';
      } else if (localWeather.text.includes('Lluvia')) {
        weatherScenery = 'modern loft bedroom, wet rainy glass window with raindrops casting dreamy drops shadow';
      }
    }

    const superiorDesc = `${superior.name} (${superior.color} color, ${currentAesthetic} loose vintage fit)`;
    const pantalonesDesc = `${pantalones.name} (${pantalones.color} color, elegant high-waisted pleats in ${currentAesthetic} style)`;
    const zapatosDesc = `${zapatos.name} (${zapatos.color} color, minimalist clean construction matching ${currentAesthetic} look)`;
    
    const coatDesc = hasAbrigo ? `, wearing a beautiful outerwear cardigan ${abrigo.name} in ${abrigo.color} color` : '';
    const accessoryDesc = hasAccesorio ? `, wearing an aesthetic matching warm ${accesorio.name} in ${accesorio.color} color` : '';
    const bagDesc = hasBolsa ? `, styling with an elegant ${bolsa.name} in ${bolsa.color} color` : '';

    // Graphics motor & artist styles parameters
    let motorStyle = 'Unreal Engine 5 render style, ultra-detailed textures of wool, cotton, and leather';
    if (renderStyle === 'retro') {
      motorStyle = 'classic polaroid analog photography style, warm soft film grain, 1990 fashion catalog';
    } else if (renderStyle === 'cartoon') {
      motorStyle = 'modern polished 3D Blender fashion avatar model, smooth soft lighting claymation, beautiful toy design';
    } else if (renderStyle === 'sketch') {
      motorStyle = 'hand-drawn artistic watercolor illustration of clothing, soft pencil fashion sketch with delicate colors';
    }

    const promptText = `A stunning realistic full body 3D photorealistic studio catalog portrait of a 22-year-old handsome male model with haircut styled to perfectly match the ${currentAesthetic} trend, displaying an outfit. He is wearing: ${superiorDesc}, ${pantalonesDesc}, and ${zapatosDesc}${coatDesc}${accessoryDesc}${bagDesc}. Framed inside ${weatherScenery}, bathed in ${timeOfDayContext}, soft volumetric warm lighting, dynamic shadows, masterfully textured, ${motorStyle}, cinematic color volume, depth of field, 8k fashion photography resolution, masterpiece, professional aesthetic presentation.`;

    return encodeURIComponent(promptText);
  };

  // Preload and cache prompt images to prevent screen flickering using Gemini prompt optimizer backend
  useEffect(() => {
    if (!outfit || !isAiMode || !isOnline || !showAiImage) return;

    let active = true;
    setImageLoading(true);
    setAiImageError(null);
    setUseSvgFallback(false);
    setIsSlowLoading(false);
    setLoadingStepText("Aiko AI diseñando siluetas y pose...");

    // Start a 7-second slow connection alert timer
    const slowTimer = setTimeout(() => {
      if (active && !useSvgFallback) {
        setIsSlowLoading(true);
      }
    }, 7000);

    const fetchAiPromptAndLoadImage = async () => {
      try {
        const response = await fetch('/api/generate-pose-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            outfit,
            aesthetic: currentAesthetic,
            renderStyle,
            timeLabel: isAmMode ? 'mañana soleada' : 'atardecer acogedor',
            weatherLabel: localWeather?.text || 'Despejado'
          })
        });

        let promptString = '';
        if (response.ok) {
          const data = await response.json();
          promptString = data.prompt || '';
        }

        // Fallback if anything fails
        if (!promptString) {
          const rawPrompt = getPromptString();
          if (!rawPrompt) {
            clearTimeout(slowTimer);
            return;
          }
          promptString = decodeURIComponent(rawPrompt);
        }

        if (!active) {
          clearTimeout(slowTimer);
          return;
        }

        setLoadingStepText("Fijando texturas y colores pasteles...");

        // Start performance speed metrics tracking
        const startLoadTime = performance.now();

        // Llamar al proxy real de generación de imágenes en el servidor
        const imgRes = await fetch('/api/generate-outfit-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ promptString, aiSettings, outfit })
        });

        if (!active) {
          clearTimeout(slowTimer);
          return;
        }

        if (!imgRes.ok) {
          const errData = await imgRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Error de conexión con la API de generación de imágenes.');
        }

        const imgData = await imgRes.json();
        
        if (imgData.useSvgFallback) {
          console.warn("[CLIENT COMPONENT] Forzando representación vectorial dinámica (SVG) por indicación del servidor.");
          if (active) {
            setUseSvgFallback(true);
            setImageLoading(false);
            clearTimeout(slowTimer);
          }
          return;
        }

        const finalUrl = imgData.imageUrl;
        const backupUrl = imgData.fallbackUrl;
        const finalProvider = imgData.fallbackProvider || 'Picsum';
        if (imgData.provider) {
          setImageGeneratorUsed(imgData.provider);
        }

        if (!finalUrl) {
          throw new Error('No se devolvió ninguna URL de imagen válida.');
        }

        const img = new Image();
        img.src = finalUrl;
        img.referrerPolicy = "no-referrer";
        
        img.onload = () => {
          if (active) {
            const elapsed = ((performance.now() - startLoadTime) / 1000).toFixed(1);
            setImageLoadDuration(elapsed);
            setRenderedUrl(finalUrl);
            setAiImageError(null);
            setImageLoading(false);
            clearTimeout(slowTimer);
          }
        };
        img.onerror = () => {
          if (active) {
            console.warn("[CLIENT COMPONENT] Error cargando Pollinations. Intentando Fallback de Respaldo...");
            const fallbackImg = new Image();
            fallbackImg.src = backupUrl || `https://picsum.photos/seed/${seed}/500/650`;
            fallbackImg.referrerPolicy = "no-referrer";
            fallbackImg.onload = () => {
              if (active) {
                const elapsed = ((performance.now() - startLoadTime) / 1000).toFixed(1);
                setImageLoadDuration(elapsed);
                setImageGeneratorUsed(finalProvider);
                setRenderedUrl(fallbackImg.src);
                setAiImageError(null);
                setImageLoading(false);
                clearTimeout(slowTimer);
              }
            };
            fallbackImg.onerror = () => {
              if (active) {
                console.warn("[CLIENT COMPONENT] Fallaron todas las opciones de imágenes. Usando maqueta vectorial.");
                setUseSvgFallback(true);
                setImageLoading(false);
                clearTimeout(slowTimer);
              }
            };
          }
        };
      } catch (err: any) {
        console.error(err);
        if (active) {
          // Si el servidor o la llamada remota de imágenes falla por completo, rebotar a SVG de respaldo
          console.warn("[CLIENT COMPONENT] Fallo total en la API remota de imágenes. Activando SVG local.");
          setUseSvgFallback(true);
          setImageLoading(false);
          clearTimeout(slowTimer);
        }
      }
    };

    fetchAiPromptAndLoadImage();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [outfit, isAiMode, renderStyle, localWeather, isAmMode, seed, isOnline, currentAesthetic, showAiImage]);

  // Color previews loader
  const getColorStyle = (colorName: string | undefined) => {
    if (!colorName) return { backgroundColor: '#e8dccc' };
    const val = COLOR_CLASSES_MAP[colorName.toLowerCase()] || '#a67c52';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return { backgroundImage: val };
    }
    return { backgroundColor: val };
  };

  const getColorHex = (colorName: string | undefined): string => {
    if (!colorName) return '#e8dccc';
    const val = COLOR_CLASSES_MAP[colorName.toLowerCase()] || '#a67c52';
    if (val.startsWith('linear') || val.startsWith('repeating')) {
      return '#a67c52';
    }
    return val;
  };

  const renderSvgIllustrator = (out: Outfit) => {
    const superiorColor = getColorHex(out?.superior?.color);
    const pantalonesColor = getColorHex(out?.pantalones?.color);
    const zapatosColor = getColorHex(out?.zapatos?.color);
    const abrigoColor = out?.abrigo && out?.abrigo.name !== 'Sin abrigo' ? getColorHex(out?.abrigo?.color) : null;
    const accesorioColor = out?.accesorio && out?.accesorio.name !== 'Sin accesorio' ? getColorHex(out?.accesorio?.color) : null;

    return (
      <svg viewBox="0 0 200 280" className="w-full h-full max-w-[200px]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="softBoyBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbf7ef" />
            <stop offset="100%" stopColor="#eedec7" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#a67c52" floodOpacity="0.15" />
          </filter>
        </defs>
        
        <rect width="200" height="280" rx="20" fill="url(#softBoyBg)" />
        <circle cx="100" cy="110" r="75" fill="#fdfcf9" fillOpacity="0.4" />
        <path d="M 30,50 Q 80,10 140,40 T 170,120 Q 180,190 120,230 T 40,160 Z" fill="#e8dccc" fillOpacity="0.25" />

        <g id="body-mannequin" opacity="0.9" filter="url(#softShadow)">
          <circle cx="100" cy="48" r="16" fill="#eed9c4" stroke="#d5b497" strokeWidth="1" />
          <path d="M96 64 h8 v14 h-8 z" fill="#eed9c4" stroke="#d5b497" strokeWidth="1" />

          <path d="M 82,78 L 118,78 L 114,142 L 86,142 Z" fill="#f7eae1" />

          <line x1="100" y1="230" x2="100" y2="265" stroke="#a67c52" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          <path d="M 80,265 L 120,265" stroke="#a67c52" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

          <path d="M 85,140 L 115,140 L 118,220 L 103,222 L 100,165 L 97,222 L 82,220 Z" fill={pantalonesColor} stroke="#6f5d4a" strokeWidth="1" strokeLinejoin="round" />
          
          <path d="M 85,148 Q 92,154 94,164" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" fill="none" opacity="0.4" />
          <path d="M 115,148 Q 108,154 106,164" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" fill="none" opacity="0.4" />

          <path d="M 80,78 L 120,78 L 116,145 L 84,145 Z" fill={superiorColor} stroke="#6f5d4a" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 90,78 L 100,90 L 110,78" fill="none" stroke="#6f5d4a" strokeWidth="1" />
          <path d="M 80,78 L 70,105 L 78,108 L 84,92 Z" fill={superiorColor} stroke="#6f5d4a" strokeWidth="1" />
          <path d="M 120,78 L 130,105 L 122,108 L 116,92 Z" fill={superiorColor} stroke="#6f5d4a" strokeWidth="1" />

          {abrigoColor && (
            <g id="outerwear-layer">
              <path d="M 78,75 L 96,75 L 94,146 L 78,144 Z" fill={abrigoColor} stroke="#544436" strokeWidth="1" />
              <path d="M 78,75 L 66,110 L 74,113 L 81,90 Z" fill={abrigoColor} stroke="#544436" strokeWidth="1" />
              <path d="M 104,75 L 122,75 L 122,146 L 104,144 Z" fill={abrigoColor} stroke="#544436" strokeWidth="1" />
              <path d="M 122,75 L 134,110 L 126,113 L 119,90 Z" fill={abrigoColor} stroke="#544436" strokeWidth="1" />
              <circle cx="92" cy="110" r="1.5" fill="#a67c52" />
              <circle cx="108" cy="110" r="1.5" fill="#a67c52" />
            </g>
          )}

          {accesorioColor && (
            <g id="accessory-layer">
              <rect x="88" y="74" width="24" height="10" rx="3" fill={accesorioColor} stroke="#544436" strokeWidth="1" />
              <path d="M 102,82 L 108,82 L 111,115 L 105,115 Z" fill={accesorioColor} stroke="#544436" strokeWidth="0.8" />
              <line x1="105" y1="115" x2="105" y2="119" stroke="#544436" strokeWidth="0.8" />
              <line x1="108" y1="115" x2="108" y2="119" stroke="#544436" strokeWidth="0.8" />
              <line x1="111" y1="115" x2="111" y2="119" stroke="#544436" strokeWidth="0.8" />
            </g>
          )}

          <g id="shoes-layer">
            <path d="M 75,220 L 92,220 L 94,232 L 72,231 Z" fill={zapatosColor} stroke="#6f5d4a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 108,220 L 125,220 L 128,231 L 106,232 Z" fill={zapatosColor} stroke="#6f5d4a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 72,229 L 94,230 L 94,232 L 72,231 Z" fill="#ffffff" />
            <path d="M 106,230 L 128,229 L 128,231 L 106,232 Z" fill="#ffffff" />
          </g>

        </g>

        <text x="100" y="258" textAnchor="middle" fill="#a67c52" fontFamily="monospace" fontSize="8" fontWeight="bold">REPRESENTACIÓN VECTORIAL</text>
        <text x="100" y="268" textAnchor="middle" fill="#8c7055" fontSize="7" opacity="0.8">Estilo: Pastel Chic • Colores Reales</text>
      </svg>
    );
  };

  const formattedLocalTime = localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white/90 dark:bg-[#201a17]/95 backdrop-blur-md rounded-3xl p-5 border border-[#c4b5a5] dark:border-[#4a3f35] shadow-xs relative overflow-hidden flex flex-col items-center w-full gap-4 transition-all duration-300">
      
      {/* 1. Header with System Time Clock & Controls */}
      <div className="w-full flex flex-col gap-3 pb-3 border-b border-[#c4b5a5]/30">
        
        {/* Core System metadata banner */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white font-sans tracking-tight">Visualizador de Maqueta 3D</h3>
            
            {/* System local Time Connector */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[#a67c52] dark:text-[#d4b896]">
              <Clock size={12} className="animate-pulse" />
              <span>Sincronización Reloj: {formattedLocalTime} ({isAmMode ? 'Módulo AM - Diurno' : 'Módulo PM - Nocturno'})</span>
              {isAmMode ? (
                <span className="bg-amber-100 dark:bg-[#43311f] text-amber-800 dark:text-amber-250 text-[9px] px-1.5 py-0.5 rounded font-bold">☀️ DE DÍA</span>
              ) : (
                <span className="bg-violet-100 dark:bg-[#251e3c] text-violet-800 dark:text-violet-200 text-[9px] px-1.5 py-0.5 rounded font-bold">🌙 DE NOCHE</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Offline indicator */}
            {!isOnline ? (
              <span className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold font-mono">
                <WifiOff size={11} /> OFFLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-350 text-[10px] font-bold font-mono">
                <Wifi size={11} className="animate-pulse" /> IA ONLINE
              </span>
            )}
          </div>
        </div>

        {/* Dynamic GPS Weather Bar layout */}
        <div className="w-full flex items-center justify-between gap-2 p-2.5 bg-[#fef9ef] dark:bg-[#181311] border border-[#c4b5a5]/40 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${gpsActive ? 'bg-[#a67c52]/10 text-[#a67c52]' : 'bg-gray-200 text-gray-400 dark:bg-[#342922]'}`}>
              <MapPin size={15} className={weatherLoading ? 'animate-bounce' : ''} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Módulo Climatológico GPS</span>
              <span className="text-[11px] text-gray-700 dark:text-neutral-100 font-medium truncate">
                {weatherLoading && 'Buscando coordenadas GPS...'}
                {!weatherLoading && localWeather && `📍 Detector: ${localWeather.temp}°C, ${localWeather.text} (${localWeather.season})`}
                {!weatherLoading && !gpsActive && 'GPS desactivado. Estación predefinida.'}
                {!weatherLoading && gpsError && `⚠️ ${gpsError}`}
              </span>
            </div>
          </div>

          {/* Location Toggle Switich */}
          <button
            onClick={() => setGpsActive(!gpsActive)}
            id="gps-weather-toggle"
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              gpsActive 
                ? 'bg-[#a67c52] text-white' 
                : 'bg-gray-200 dark:bg-[#342922] text-gray-600 dark:text-gray-300 hover:bg-[#c4b5a5]/30'
            }`}
            style={{ minHeight: '32px' }}
          >
            {gpsActive ? 'DESACTIVAR' : 'ACTIVAR GPS'}
          </button>
        </div>

        {/* AI graphics Switch Slider & Engine Options */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center pt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 font-mono">Cargar Motor:</span>
            <div className="relative inline-flex items-center h-7 rounded-sm p-0.5 bg-[#e8dccc]/60 dark:bg-[#2d221c]/80 border border-[#c4b5a5]">
              <button
                onClick={() => {
                  if (!isOnline) return;
                  setIsAiMode(true);
                }}
                disabled={!isOnline}
                id="btn-mode-ai"
                className={`py-0.5 px-2 text-[10px] font-mono font-bold tracking-tight rounded-sm transition-all duration-250 cursor-pointer ${
                  isAiMode && isOnline
                    ? 'bg-[#a67c52] text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 disabled:opacity-40'
                }`}
              >
                IA REALISTA
              </button>
              <button
                onClick={() => setIsAiMode(false)}
                id="btn-mode-css"
                className={`py-0.5 px-2 text-[10px] font-mono font-bold tracking-tight rounded-sm transition-all duration-250 cursor-pointer ${
                  !isAiMode 
                    ? 'bg-[#a67c52] text-white shadow-xs' 
                    : 'text-gray-500 hover:text-[#a67c52]'
                }`}
              >
                MAQUETA 3D CSS
              </button>
            </div>
          </div>

          {/* Engine Art style select (only visible in AI mode) */}
          {isAiMode && isOnline && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-gray-550 font-mono">Filtro Render:</span>
              <select
                value={renderStyle}
                onChange={(e) => setRenderStyle(e.target.value)}
                id="render-style-selector"
                className="bg-white dark:bg-[#1e1714] border border-[#c4b5a5] rounded-sm text-[10px] px-1.5 py-1 text-gray-700 dark:text-gray-100 font-mono outline-hidden focus:border-[#a67c52]"
              >
                <option value="realistic">Fotorrealista 8K</option>
                <option value="unreal">Unreal Engine 5</option>
                <option value="retro">Polaroid Retro 90s</option>
                <option value="cartoon">Toy Avatar 3D</option>
                <option value="sketch">Fashion Sketch</option>
              </select>
              
              {/* Force regeneration seed randomizer */}
              <button
                onClick={() => {
                  setSeed(Math.floor(Math.random() * 1000));
                }}
                id="ai-style-regenerate"
                className="p-1 text-[#a67c52] hover:bg-[#e8dccc]/40 rounded-full cursor-pointer shrink-0"
                title="Generar otra variante de pose"
              >
                <RotateCw size={12} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. Visualizer Port Canvas viewport area */}
      <div className="relative w-full max-w-[280px] aspect-[4/5] bg-[#fdfaf5] dark:bg-[#181210] rounded-2xl border border-[#c4b5a5] shadow-inner flex items-center justify-center p-3.5 overflow-hidden">
        
        {!outfit ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <HelpCircle className="text-[#a67c52]/60 animate-bounce mb-3" size={32} />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest font-mono">SIMULADOR INTELIGENTE</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 max-w-[200px]">
              Genere un outfit en el planificador superior para apreciar la visualización del maniquí interactivo o render AI.
            </p>
          </div>
        ) : (
          <>
            {/* MODE A: UNRESTRICTED REAL-TIME AI AVATAR VIEWPORT */}
            {isAiMode && isOnline && showAiImage ? (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#15110f]">
                {/* Loader screen with dynamic text overlay - stays on until new image caches */}
                {imageLoading && (
                  <div className="absolute inset-0 bg-[#181412]/95 flex flex-col items-center justify-between p-5 z-10 text-center animate-fade-in duration-200">
                    {/* Skeleton silhouette blocks */}
                    <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 py-4 opacity-75">
                      <div className="w-10 h-10 bg-[#251f1c] rounded-full animate-pulse" />
                      <div className="w-20 h-20 bg-[#251f1c] rounded-lg animate-pulse" />
                      <div className="w-16 h-24 bg-[#251f1c] rounded-lg animate-pulse" />
                      <div className="w-full max-w-[120px] h-1.5 bg-[#a67c52]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 via-[#a67c52] to-amber-600 animate-[pulse_1.5s_infinite] shadow-xs" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="mt-auto space-y-1">
                      <span className="text-[9px] tracking-widest font-mono uppercase text-[#a67c52] font-semibold animate-pulse block">
                        Generando Imagen del Outfit... (Servidor Gratuito)
                      </span>
                      <p className="text-[10px] text-gray-300 max-w-[200px] leading-relaxed mx-auto h-[30px] overflow-hidden flex items-center justify-center">
                        "{loadingStepText}"
                      </p>
                    </div>

                    {/* Slow loading warning banner */}
                    {isSlowLoading && (
                      <div className="absolute inset-x-4 bottom-12 bg-[#2d1f19] border border-amber-500/30 rounded-xl p-2.5 animate-bounce z-20 shadow-lg text-center">
                        <p className="text-[10px] text-amber-400 font-semibold leading-tight mb-1.55">
                          ⚠️ Servidor gratuito lento. ¿Deseas ver bosquejo instantáneo?
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeed(Math.floor(Math.random() * 1000));
                            }} 
                            className="bg-[#a67c52] hover:bg-[#8c6742] text-white text-[8px] font-bold py-1 px-2.5 rounded-md font-mono"
                          >
                            REINTENTAR
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setUseSvgFallback(true);
                            }} 
                            className="bg-gray-700 hover:bg-gray-650 text-white text-[8px] font-bold py-1 px-2.5 rounded-md font-mono"
                          >
                            MAQUETA CSS/SVG
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {useSvgFallback ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2 bg-[#fdfaf5]">
                    {renderSvgIllustrator(outfit)}
                    <button 
                      onClick={() => {
                        setUseSvgFallback(false);
                        setImageLoading(true);
                        setSeed(Math.floor(Math.random() * 1000));
                      }} 
                      className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white text-[8px] font-bold font-mono px-2 py-1 rounded-md"
                    >
                      FORZAR RENDER AI
                    </button>
                  </div>
                ) : aiImageError ? (
                  <div className="absolute inset-0 bg-[#251e1a]/95 flex flex-col items-center justify-center p-6 text-center z-1 w-full h-full overflow-y-auto">
                    <AlertTriangle className="text-[#a67c52] animate-bounce mb-3" size={32} />
                    <span className="text-[10px] tracking-widest font-mono uppercase text-rose-400 font-bold">
                       Fallo en Generación
                    </span>
                    <p className="text-[11.5px] text-gray-300 mt-2.5 leading-normal max-w-[220px]">
                      {aiImageError}
                    </p>
                    <button 
                      onClick={() => setUseSvgFallback(true)} 
                      className="mt-3 bg-[#a67c52] hover:bg-[#8c6742] text-white text-[8.5px] font-bold py-1 px-3 rounded-md font-mono"
                    >
                      USAR MAQUETA VECTORIAL
                    </button>
                  </div>
                ) : renderedUrl ? (
                  <img
                    src={renderedUrl}
                    alt="Soft Boy AI 3D Realist Avatar Render"
                    className="w-full h-full object-cover transition-all duration-500 border-none scale-100 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <Sparkles className="animate-pulse text-[#a67c52] mx-auto mb-2" size={24} />
                    <p className="text-[11px] font-mono">Preparando primer render...</p>
                  </div>
                )}

                {/* Aesthetic image bottom brand credit with speed telemetry */}
                {!aiImageError && !useSvgFallback && (
                  <span className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white/95 text-[8.5px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-white/10">
                    🖼️ {imageLoadDuration ? `${imageLoadDuration}s` : '1.8s'} · {imageGeneratorUsed.charAt(0).toUpperCase() + imageGeneratorUsed.slice(1)}
                  </span>
                )}
              </div>
            ) : (
              
              /* MODE B: ELEGANT 2D FASHION MANNEQUIN CARD */
              <div 
                className="w-full h-full flex flex-col items-center justify-between py-6 relative select-none"
              >
                {/* Ambient Grid light inside backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(#e8dccc_1px,transparent_1px)] dark:bg-[radial-gradient(#3a2d24_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                {/* Hanger Hook (Static Base) */}
                <div 
                  className="absolute top-1.5 w-7 h-7 rounded-full border border-[#c4b5a5] flex items-center justify-center shadow-inner"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c4b5a5]" />
                </div>

                {/* --- 2D MANNEQUIN HEIGHT PARTS --- */}
                {/* 1. SCARF & HEAD LAYERS */}
                <div 
                  className="relative flex flex-col items-center flex-none" 
                  style={{ height: '52px' }}
                >
                  {/* Mannequin sleepy softboy facial outline */}
                  <div className="w-11 h-11 rounded-full border border-[#c4b5a5]/70 bg-[#fdfdfc]/80 dark:bg-[#342922]/80 flex items-center justify-center relative shadow-sm">
                    <div className="absolute top-4.5 left-2.5 w-1.5 h-0.5 bg-gray-500 rounded" />
                    <div className="absolute top-4.5 right-2.5 w-1.5 h-0.5 bg-gray-500 rounded" />
                    <div className="absolute top-6 left-4 w-3 h-1 border-b border-gray-500 rounded-full" />
                  </div>

                  {/* Scarf Accessories */}
                  {outfit.accesorio && outfit.accesorio.name !== "Sin bufanda" && outfit.accesorio.color !== "N/A" && (
                    <div 
                      className="absolute bottom-[-10px] w-12 h-4 rounded-full border border-[#a67c52]/30 shadow-md flex items-center justify-center animate-bounce-slow"
                      style={getColorStyle(outfit.accesorio.color)}
                      title={outfit.accesorio.name}
                    >
                      <div 
                        className="absolute left-1 top-2.5 w-3 h-5.5 rounded-sm border border-[#a67c52]/10"
                        style={getColorStyle(outfit.accesorio.color)}
                      />
                      <div 
                        className="absolute right-1.5 top-2.5 w-2.5 h-4.5 rounded-sm border border-[#a67c52]/10"
                        style={getColorStyle(outfit.accesorio.color)}
                      />
                    </div>
                  )}
                </div>

                {/* 2. INNER SHIRT / OUTER CARDIGAN COAT LAYERS */}
                <div 
                  className="relative w-full flex justify-center items-center z-20 mt-1" 
                  style={{ height: '95px' }}
                >
                  {/* Torso Top Base Shape */}
                  <div 
                    className="relative w-16 h-20 rounded-b-xl rounded-t-sm border border-[#c4b5a5]/70 shadow-sm flex flex-col items-center transition-all duration-300"
                    style={getColorStyle(outfit.superior.color)}
                  >
                    <div className="w-5 h-2.5 bg-[#fdfaf5] dark:bg-[#181210] rounded-b-lg border-x border-b border-[#c4b5a5]/50" />
                    
                    {outfit.superior.category.toLowerCase().includes('camisa') ? (
                      <div className="flex flex-col gap-1.5 mt-1.5 items-center">
                        <div className="w-1 h-1 rounded-full bg-white/70 border border-gray-400" />
                        <div className="w-1 h-1 rounded-full bg-white/70 border border-gray-400" />
                        <div className="w-1 h-1 rounded-full bg-white/70 border border-gray-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-0.5 bg-black/10 rounded mt-2.5" />
                    )}

                    {/* Left/Right Sleeves */}
                    <div 
                      className="absolute top-0 left-[-11px] w-[12px] h-[30px] rounded-l-md border-y border-l border-[#c4b5a5]/60"
                      style={getColorStyle(outfit.superior.color)}
                    />
                    <div 
                      className="absolute top-0 right-[-11px] w-[12px] h-[30px] rounded-r-md border-y border-r border-[#c4b5a5]/60"
                      style={getColorStyle(outfit.superior.color)}
                    />
                  </div>

                  {/* Coat Overlapping on the model */}
                  {outfit.abrigo && outfit.abrigo.name !== "Sin abrigo" && (
                    <div 
                      className="absolute inset-0 flex justify-center pointer-events-none z-10"
                    >
                      <div 
                        className="relative w-20 h-22 rounded-xl border border-[#a67c52]/30 shadow-md flex justify-between px-0.5 animate-pulse-slow"
                        style={getColorStyle(outfit.abrigo.color)}
                      >
                        <div className="w-[6px] h-full border-r border-black/10 bg-inherit rounded-l-lg" />
                        <div className="w-[8px] h-full transparent" />
                        <div className="w-[6px] h-full border-l border-black/10 bg-inherit rounded-r-lg" />

                        {/* Outer Coat Sleeves */}
                        <div 
                          className="absolute top-0.5 left-[-10px] w-[11px] h-[65px] rounded-l-lg border-y border-l border-black/10"
                          style={getColorStyle(outfit.abrigo.color)}
                        />
                        <div 
                          className="absolute top-0.5 right-[-10px] w-[11px] h-[65px] rounded-r-lg border-y border-r border-black/10"
                          style={getColorStyle(outfit.abrigo.color)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tote Bag hanging loose */}
                  {outfit.bolsa && outfit.bolsa.name !== "Sin bolsa" && outfit.bolsa.color !== "N/A" && (
                    <div 
                      className="absolute right-[-16px] top-3 z-45 animate-pulse-slow"
                    >
                      <div className="absolute right-4.5 top-[-20px] w-6 h-10 border-l border-t border-[#a67c52]/60 rounded-tl-full rotate-[32deg]" />
                      <div 
                        className="w-10 h-10 rounded-lg bg-[#c4b5a5] border border-[#a67c52]/40 shadow-md flex flex-col items-center justify-center text-[#4a3f35] p-0.5"
                        style={getColorStyle(outfit.bolsa.color)}
                        title={outfit.bolsa.name}
                      >
                        <Briefcase size={10} />
                        <span className="text-[6px] font-bold font-mono tracking-tighter mt-0.5 truncate max-w-full">TOTE BAG</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. PANTS / BOTTOM LAYERS */}
                <div 
                  className="relative w-14 flex justify-between z-10 animate-fade-in" 
                  style={{ height: '80px' }}
                >
                  <div 
                    className="w-6 h-full rounded-b-md rounded-tl-sm border border-[#c4b5a5]/70 shadow-xs flex flex-col justify-end"
                    style={getColorStyle(outfit.pantalones.color)}
                  >
                    <div className="w-full h-2.5 bg-black/10 border-t border-black/5" />
                  </div>
                  <div 
                    className="w-6 h-full rounded-b-md rounded-tr-sm border border-[#c4b5a5]/70 shadow-xs flex flex-col justify-end"
                    style={getColorStyle(outfit.pantalones.color)}
                  >
                    <div className="w-full h-2.5 bg-black/10 border-t border-black/5" />
                  </div>
                  <div className="absolute top-0 w-full h-1.5 bg-black/15 border-b border-black/10 rounded-t-sm" />
                </div>

                {/* 4. FOOTWEAR SNEAKERS LAYERS */}
                <div 
                  className="relative w-16 flex justify-between z-10" 
                  style={{ height: '24px' }}
                >
                  <div 
                    className="w-[26px] h-4 rounded-l-full rounded-r-md border border-[#c4b5a5] shadow-xs flex items-end justify-center pb-0.5"
                    style={getColorStyle(outfit.zapatos.color)}
                  >
                    <div className="w-full h-1 bg-white dark:bg-neutral-800 rounded-b-sm border-t border-gray-200 dark:border-neutral-700" />
                  </div>
                  <div 
                    className="w-[26px] h-4 rounded-r-full rounded-l-md border border-[#c4b5a5] shadow-xs flex items-end justify-center pb-0.5"
                    style={getColorStyle(outfit.zapatos.color)}
                  >
                    <div className="w-full h-1 bg-white dark:bg-neutral-800 rounded-b-sm border-t border-gray-200 dark:border-neutral-700" />
                  </div>
                </div>

                {/* 2D Vector style label */}
                <div className="absolute bottom-1 w-full text-center pointer-events-none">
                  <span className="text-[7.5px] font-mono tracking-widest text-[#a67c52]/80 uppercase block">
                    MAQUETA VECTORIAL 2D CHIC • TENDENCIA
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2.5. AI Style Critic & On-Demand Image Generation Button */}
      {outfit && (
        <div 
          id="aiko-stylist-critique-card"
          className="w-full bg-[#fdf8f0] dark:bg-[#1c1714] border border-[#a67c52]/30 dark:border-[#4a3a2e] rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 shadow-xs"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#a67c52] dark:text-[#d4b896]">
            <Sparkles size={14} className="animate-bounce" />
            <span className="font-mono uppercase tracking-wide">Consejo del Estilista AI — Aiko</span>
            {loadingDescription && (
              <span className="ml-auto text-[9px] font-normal animate-pulse text-gray-400 font-mono">Generando...</span>
            )}
          </div>
          
          <p className="text-xs text-gray-700 dark:text-neutral-250 leading-relaxed italic pr-2 font-sans">
            "{outfitDescription}"
          </p>

          {isAiMode && isOnline && !showAiImage && (
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
                setShowAiImage(true);
              }}
              id="ai-generate-photo-btn"
              className="mt-1 w-full bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm animate-pulse"
              style={{ minHeight: '40px' }}
            >
              <Sparkles size={14} />
              Generar Imagen Foto de Catálogo IA
            </button>
          )}

          {isAiMode && isOnline && showAiImage && (
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1 border-t border-[#c4b5a5]/25 pt-2.5">
              <span className="text-emerald-600 dark:text-emerald-400">✓ Imagen renderizada por la IA</span>
              <button 
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(40);
                  setShowAiImage(false);
                }}
                className="text-[#a67c52] dark:text-[#d4b896] hover:underline font-bold cursor-pointer"
              >
                Cargar Maqueta 3D CSS
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Mini stats items summaries footnotes */}
      {outfit && (
        <div className="w-full bg-[#fef9ef]/25 dark:bg-[#181311]/30 p-2.5 rounded-xl border border-[#c4b5a5]/35 flex flex-col gap-1 text-[10.5px] text-gray-650 dark:text-neutral-400">
          <div className="flex justify-between items-center text-[9.5px] uppercase font-mono text-gray-400 border-b border-[#c4b5a5]/20 pb-1 mb-1">
            <span>Prendas Activas</span>
            <span>Estilo {currentAesthetic}</span>
          </div>
          <p className="truncate"><strong className="text-gray-700 dark:text-neutral-250">Torso:</strong> {outfit.superior.name} ({outfit.superior.color})</p>
          <p className="truncate"><strong className="text-gray-700 dark:text-neutral-250">Pierna:</strong> {outfit.pantalones.name} ({outfit.pantalones.color})</p>
          <p className="truncate"><strong className="text-gray-700 dark:text-neutral-250">Suela:</strong> {outfit.zapatos.name}</p>
        </div>
      )}

    </div>
  );
}
