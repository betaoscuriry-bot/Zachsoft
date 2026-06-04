import React, { useState, useRef, useEffect } from 'react';
import { Prenda, ChatMessage, Outfit } from '../types';
import { Send, Bot, User, Camera, Image as ImageIcon, X, Sparkles, AlertCircle, Smile, HelpCircle, Shield, ChevronRight } from 'lucide-react';
import { COLOR_CLASSES_MAP } from '../data';

interface ChatIATabProps {
  prendas: Prenda[];
  currentOutfit: Outfit | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentAesthetic?: string;
  aiSettings?: any;
}

export default function ChatIATab({
  prendas,
  currentOutfit,
  messages,
  setMessages,
  currentAesthetic = 'Soft Boy',
  aiSettings
}: ChatIATabProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States for attached image/photo for visual critique
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageMime, setAttachedImageMime] = useState<string | null>(null);

  // Diagnostic states from server response
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('Gemini');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [speedLevel, setSpeedLevel] = useState<'fast' | 'average' | 'slow' | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const triggerFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido para que Aiko analice tu outfit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      setAttachedImageMime(file.type);
    };
    reader.readAsDataURL(file);
    triggerFeedback();
  };

  const sendMessage = async (text: string, currentPendingImage: string | null = attachedImage, currentPendingMime: string | null = attachedImageMime) => {
    if (!text.trim() && !currentPendingImage) return;
    triggerFeedback();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `m-chat-${Date.now()}`,
      sender: 'user',
      text: text.trim() || '📸 [Fotografía de mi Outfit]',
      timestamp,
      image: currentPendingImage || undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setAttachedImage(null);
    setAttachedImageMime(null);
    setIsTyping(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text.trim() || 'Analiza mi outfit en esta foto con tu ojo de estilista experta Soft Boy. Opina sobre colores, proporciones, estilo, sugiere cambios del armario e inclúyeme una puntuación del 1 al 10 detallando los aciertos y errores de mi look.',
          history: messages.map(m => ({ sender: m.sender, text: m.text })),
          prendas,
          currentOutfit,
          currentAesthetic,
          imageData: currentPendingImage,
          imageMimeType: currentPendingMime,
          aiSettings: aiSettings
        })
      });

      const duration = Date.now() - startTime;
      setResponseTime(duration);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error de conexión con la consultora de IA. Revisa tus claves o conexión.');
      }

      const data = await response.json();
      
      if (data.logs) {
        setApiLogs(data.logs);
      }
      if (data.providerUsed) {
        setCurrentProvider(data.providerUsed);
      }
      if (data.speedQuality) {
        setSpeedLevel(data.speedQuality);
      } else {
        setSpeedLevel(duration < 3000 ? 'fast' : duration > 8000 ? 'slow' : 'average');
      }

      const assistantMsg: ChatMessage = {
        id: `m-assist-${Date.now()}`,
        sender: 'assistant',
        text: data.response || data.reply || '🧸 Mil disculpas, estoy arreglando mi bufanda. ¿Hay algo más que quieras preguntarme de tu guardarropa?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        providerUsed: data.providerUsed || currentProvider || 'Gemini Flash',
        responseTime: duration
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const errMsg: ChatMessage = {
        id: `m-assist-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error de Conexión (${currentProvider})**: ${error.message || 'El motor de IA de la nube no responde.'}\n\nRevisa tu clave API en la pestaña "Ajustes" para restablecer la comunicación con Aiko en tiempo real.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (promptText: string) => {
    sendMessage(promptText);
  };

  return (
    <div id="chatiatab-root" className="flex flex-col h-[calc(100vh-220px)] max-h-[750px] bg-white dark:bg-[#1a1412] rounded-[32px] border border-[#c4b5a5]/80 dark:border-[#4e4035] shadow-lg overflow-hidden">
      
      {/* Header Info Banner */}
      <div className="bg-[#e8dccc] dark:bg-[#2c221d] px-5 py-3.5 flex items-center justify-between border-b border-[#c4b5a5] dark:border-[#4a3f35]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a67c52] flex items-center justify-center text-xl relative shadow-inner">
            🧸
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-[#201a17]"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-extrabold text-[#4a3f35] dark:text-orange-50/90 font-sans tracking-tight">Centro Chat Aiko AI</h3>
              <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-[#a67c52]/10 dark:bg-[#a67c52]/20 font-mono text-[#a67c52] dark:text-orange-200 uppercase font-black">iMessage Style</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-neutral-400 block -mt-0.5 leading-snug">
              Analiza tus fotos, da veredictos estéticos 1-10 y responde sin límites.
            </p>
          </div>
        </div>

        {/* Speed & Provider Indicator badge */}
        <div className="flex flex-col items-end text-right font-mono">
          <span className="text-[9px] font-bold text-[#a67c52] dark:text-[#d4b896]">
            {currentProvider} {responseTime ? `(${Math.round(responseTime / 100) / 10}s)` : ''}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${
              speedLevel === 'fast' ? 'bg-emerald-500' :
              speedLevel === 'average' ? 'bg-amber-400' :
              speedLevel === 'slow' ? 'bg-rose-500': 'bg-gray-400'
            }`}></span>
            <span className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-bold">
              {speedLevel === 'fast' ? 'RÁPIDO' :
               speedLevel === 'average' ? 'MEDIO' :
               speedLevel === 'slow' ? 'LENTO' : 'CONECTADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Background Sync and Processing Banner */}
      <div className="bg-[#fef9ef] dark:bg-[#201a18] px-4 py-2 border-b border-[#c4b5a5]/30 text-[10.5px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5 shrink-0">
        <Shield size={12} className="text-[#a67c52] shrink-0" />
        <span className="leading-tight">
          <strong>Procesamiento en segundo plano activo:</strong> Si cierras la app, la IA seguirá respondiendo y te avisará al finalizar.
        </span>
      </div>

      {/* Messages Feed Area */}
      <div 
        id="chatia-messages-container"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfaf5]/40 dark:bg-[#130f0d]/30 flex flex-col scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#e8dccc] dark:bg-[#342922] text-[#a67c52] flex items-center justify-center text-3xl mb-4 shadow-sm subtle-pulse">
              💬
            </div>
            <h4 className="text-sm font-extrabold text-[#4a3f35] dark:text-white">Conversación Real con Aiko</h4>
            <p className="text-[11.5px] text-gray-500 dark:text-neutral-400 max-w-xs mt-1.5 leading-relaxed">
              Pregúntame sobre cualquier cosa: cocina, cine ("Her"), matemáticas, consejos de relaciones o salud. ¡Sube una selfie o foto de tu guardarropas para opinar!
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-xs">
              <button 
                onClick={() => handleSuggestion('¿Cuánto es el 15% de 80?')}
                className="p-2.5 text-left bg-[#e8dccc]/30 dark:bg-neutral-800/50 hover:bg-[#e8dccc]/60 text-[11px] text-[#a67c52] dark:text-neutral-300 rounded-xl border border-[#c4b5a5]/30"
                style={{ minHeight: '44px' }}
              >
                🧮 15% de 80
              </button>
              <button 
                onClick={() => handleSuggestion('Recomendaciones de películas si me gustó Her')}
                className="p-2.5 text-left bg-[#e8dccc]/30 dark:bg-neutral-800/50 hover:bg-[#e8dccc]/60 text-[11px] text-[#a67c52] dark:text-neutral-300 rounded-xl border border-[#c4b5a5]/30"
                style={{ minHeight: '44px' }}
              >
                🎬 Pelis como 'Her'
              </button>
              <button 
                onClick={() => handleSuggestion('¿Cómo pedir disculpas sinceras a un amigo?')}
                className="p-2.5 text-left bg-[#e8dccc]/30 dark:bg-neutral-800/50 hover:bg-[#e8dccc]/60 text-[11px] text-[#a67c52] dark:text-neutral-300 rounded-xl border border-[#c4b5a5]/30"
                style={{ minHeight: '44px' }}
              >
                🌱 Pedir disculpas
              </button>
              <button 
                onClick={() => handleSuggestion('Dime un chiste bueno por favor')}
                className="p-2.5 text-left bg-[#e8dccc]/30 dark:bg-neutral-800/50 hover:bg-[#e8dccc]/60 text-[11px] text-[#a67c52] dark:text-neutral-300 rounded-xl border border-[#c4b5a5]/30"
                style={{ minHeight: '44px' }}
              >
                ☕ Dime un chiste
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#e8dccc] dark:bg-[#342922] flex items-center justify-center text-sm shrink-0 self-end mb-1 shadow-xs border border-[#c4b5a5]/20">
                    🧸
                  </div>
                )}
                <div className="max-w-[78%] flex flex-col">
                  <div className={`p-3.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#a67c52] text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-[#28211e] text-gray-800 dark:text-neutral-100 rounded-bl-none border border-[#c4b5a5]/40 dark:border-[#42362c] shadow-xs'
                  }`}>
                    {/* Embedded Image Preview for critique attachments */}
                    {msg.image && (
                      <div className="mb-2 max-w-[210px] rounded-xl overflow-hidden border border-white/20 dark:border-neutral-800/50 shadow-sm">
                        <img src={msg.image} alt="Imagen de moda para opinar" className="w-full h-auto object-cover max-h-[170px]" />
                        <div className="bg-black/60 px-2 py-1 text-[9px] text-white font-mono flex items-center justify-between">
                          <span>Critique Mode Activated</span>
                          <span>1-10 Rank</span>
                        </div>
                      </div>
                    )}
                    {msg.text}
                  </div>
                  <span className={`text-[9.5px] text-gray-400 dark:text-neutral-400 mt-1 font-mono tracking-tight ${isUser ? 'text-right mr-1' : 'text-left ml-1'}`}>
                    {msg.timestamp}
                    {!isUser && msg.providerUsed && (
                      <span className="text-[#a67c52] dark:text-[#d4b896] font-semibold ml-1.5">
                        · ⏱️ {msg.responseTime ? `${(msg.responseTime / 1000).toFixed(1)}s` : '1.1s'} · {msg.providerUsed}
                      </span>
                    )}
                  </span>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#e8dccc] dark:bg-[#382d25] flex items-center justify-center text-xs shrink-0 self-end mb-1 border border-[#c4b5a5]/30">
                    👤
                  </div>
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2.5 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-[#e8dccc] dark:bg-[#342922] flex items-center justify-center text-sm shrink-0 self-end mb-1 border border-[#c4b5a5]/20">
              🧸
            </div>
            <div className="max-w-[85%] flex flex-col">
              <div className="p-3 bg-white dark:bg-[#28211e] text-gray-400 rounded-2xl rounded-bl-none border border-[#c4b5a5]/30 dark:border-[#42362c] flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating suggestion chip selector layer */}
      {currentOutfit && (
        <div className="bg-[#fefaf4] dark:bg-[#181311] border-t border-[#c4b5a5]/30 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          <button 
            onClick={() => sendMessage('Aiko, puntúa mi outfit actual del 1 al 10 y dime qué aciertos y errores tiene')}
            className="shrink-0 bg-[#e8dccc]/40 hover:bg-[#e8dccc]/75 dark:bg-[#2d221c] dark:hover:bg-[#3c2e26] border border-[#c4b5a5]/40 text-[#a67c52] dark:text-[#f3dcc0] rounded-full px-3 py-1 text-[10.5px] font-bold cursor-pointer"
            style={{ minHeight: '30px' }}
          >
            📊 Puntuar Outfit 1 al 10
          </button>
          <button 
            onClick={() => sendMessage(`Aiko, qué música me recomiendas para usar con mi look de: ${currentOutfit.superior.name} + ${currentOutfit.pantalones.name}?`)}
            className="shrink-0 bg-[#e8dccc]/40 hover:bg-[#e8dccc]/75 dark:bg-[#2d221c] dark:hover:bg-[#3c2e26] border border-[#c4b5a5]/40 text-[#a67c52] dark:text-[#f3dcc0] rounded-full px-3 py-1 text-[10.5px] font-bold cursor-pointer"
            style={{ minHeight: '30px' }}
          >
            🎵 Música para este outfit
          </button>
          <button 
            onClick={() => sendMessage('Recomiéndame un outfit minimalista cómodo o tips de estilo Soft Boy')}
            className="shrink-0 bg-[#e8dccc]/40 hover:bg-[#e8dccc]/75 dark:bg-[#2d221c] dark:hover:bg-[#3c2e26] border border-[#c4b5a5]/40 text-[#a67c52] dark:text-[#f3dcc0] rounded-full px-3 py-1 text-[10.5px] font-bold cursor-pointer"
            style={{ minHeight: '30px' }}
          >
            ✨ Recomendar look soft
          </button>
        </div>
      )}

      {/* Upload image overlay slide bar */}
      {attachedImage && (
        <div className="bg-[#fdf9f2] dark:bg-[#221a17] px-4 py-3 border-t border-[#c4b5a5]/50 flex items-center justify-between shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#a67c52] shadow-md shrink-0">
              <img src={attachedImage} alt="Pre-visualizar selfie" className="w-full h-full object-cover" />
              <button 
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedImageMime(null);
                }}
                className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-black text-white p-0.5 rounded-full cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
            <div className="flex flex-col text-[11px] leading-snug">
              <span className="font-bold text-[#a67c52] dark:text-[#f4dbbc] block">📸 Foto del Outfit Listilla</span>
              <span className="text-gray-500">Aiko realizará un análisis visual 100% real al presionar Enviar.</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Message Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputText);
        }}
        className="p-3 bg-[#e8dccc]/40 dark:bg-[#201916] border-t border-[#c4b5a5]/70 dark:border-[#4a3f35] flex items-center gap-2 shrink-0"
      >
        {/* Attachment snap button */}
        <button
          type="button"
          onClick={() => document.getElementById('chatia-file-uploader')?.click()}
          id="btn-chatia-camera-snap"
          className="bg-gray-100 hover:bg-[#e8dccc]/60 text-gray-500 dark:bg-[#302621]/80 dark:text-gray-300 h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-200 shrink-0 cursor-pointer border border-[#c4b5a5]/30"
          style={{ minHeight: '44px', minWidth: '44px' }}
          title="Adjuntar una foto de tu look"
        >
          <Camera size={20} />
        </button>
        <input 
          type="file"
          id="chatia-file-uploader"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={attachedImage ? "Explica algo sobre tu foto o pulsa enviar..." : "Dile algo de cocina, matemáticas, cine o moda a Aiko..."}
          className="flex-1 bg-white dark:bg-[#1a1412] border border-[#c4b5a5] dark:border-[#4a3f35]/80 rounded-[18px] px-4 py-3.5 text-xs text-gray-800 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:border-[#a67c52] transition-colors"
          style={{ minHeight: '44px' }}
        />

        <button
          type="submit"
          id="btn-chatia-submit"
          className="bg-[#a67c52] hover:bg-[#a67c52]/90 text-white font-semibold h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-200 shrink-0 cursor-pointer shadow-md shadow-[#a67c52]/10"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
