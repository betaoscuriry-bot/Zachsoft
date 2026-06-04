import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for file uploads/base64 parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =========================================================================
// 🥞 CONFIGURACIÓN DE INTEGRACIÓN DE MOTORES DE IA (LISTO PARA PRODUCCIÓN)
// Edita este bloque para cambiar tus proveedores de IA, endpoints, claves de manera directa en local o servidor.
// =========================================================================
export const AI_CONFIG = {
  // 1. ASISTENTE INTELIGENTE (Endpoint y clave configurable)
  // Consigue tu clave de Gemini API gratis en: https://aistudio.google.com/
  // Si dejas "TU_GEMINI_API_KEY_AQUI", el sistema intentará heredar automáticamente la clave de tus secretos en la plataforma.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "TU_GEMINI_API_KEY_AQUI",
  GEMINI_BASE_URL: "https://generativelanguage.googleapis.com", // Puedes cambiar esta URL si usas un proxy o pasarela custom.
  
  // 2. GENERADOR DE IMÁGENES REAL DE OUTFITS (Por lotes conmutables)
  // Proveedor seleccionado para renderizar ropa: 
  // - "pollinations": Genera fotos hermosas con SDXL de fondo sin requerir claves de pago ni registros (Por defecto).
  // - "openai":       Utiliza DALL-E 3 mediante la clave en IMAGE_API_KEY.
  // - "stability":    Utiliza la API oficial de Stable Diffusion 3/Core mediante la clave en IMAGE_API_KEY.
  IMAGE_API_PROVIDER: "pollinations", // "pollinations" | "openai" | "stability"
  IMAGE_API_KEY: process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY || "TU_CLAVE_DE_IMAGENES_AQUI",
  IMAGE_MODEL: "stable-diffusion-xl" // Opciones: "dall-e-3" para OpenAI, o "sd3-medium" para Stability AI
};

// Lazy initializer for the Google Gen AI client with robust error catching
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    let key = AI_CONFIG.GEMINI_API_KEY;
    if (!key || key === "TU_GEMINI_API_KEY_AQUI") {
      // Intentar forzar lectura de variable de entorno real
      key = process.env.GEMINI_API_KEY || "";
    }
    
    if (!key || key === "TU_GEMINI_API_KEY_AQUI") {
      throw new Error("⚠️ Configura tu API key de Gemini en el código o en tus Secretos de AI Studio para activar respuestas reales. Puedes obtener una clave gratuita en: https://aistudio.google.com/");
    }

    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API Endpoints

// 1. Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor Soft Boy Estilista AI funcionando" });
});

// 2. Chat API powered by multiple AI providers (Gemini, OpenAI, DeepSeek) with high-speed failover and custom modes
app.post("/api/chat", async (req, res) => {
  const transactionLogs: Array<{ provider: string; model: string; duration: number; status: string; errorMessage?: string }> = [];
  
  try {
    const { 
      message, 
      history = [], 
      currentAesthetic = "Soft Boy", 
      prendas = [], 
      currentOutfit = null, 
      imageData = null, 
      imageMimeType = null,
      aiSettings = null
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "El mensaje del usuario es obligatorio." });
    }

    // Default configuration if not passed from client
    const settings = aiSettings || {
      primary: { provider: 'Gemini', apiKey: '', model: 'gemini-3.5-flash' },
      secondary: { provider: 'DeepSeek', apiKey: '', model: 'deepseek-chat' },
      tertiary: { provider: 'OpenAI', apiKey: '', model: 'gpt-3.5-turbo' },
      speedMode: 'Balanced',
      customTimeout: 20,
      fallbackAutomatico: true,
      compararRespuestas: false
    };

    const speedMode = settings.speedMode || 'Balanced';
    const fallbackAutomatico = settings.fallbackAutomatico !== false;
    const compararRespuestas = !!settings.compararRespuestas;

    // Build base system instruction
    let systemInstruction = `Eres Aiko, la Inteligencia Artificial experta en asesoría de moda, estilo personal y cultura general, especializada en la estética "${currentAesthetic}".
Te caracterizas por ser sumamente cálida, atenta, detallista, amigable y usar un tono adorable de estilo "Soft Boy aesthetic". 
No debes mencionar que eres de Google ni revelar el nombre "Gemini". Eres conocida simplemente como Aiko, o "Aiko Designer - Tu Asistente AI". El usuario se dirige a ti para pedirte consejos de moda, combinaciones de ropa, opiniones o ayuda con su armario, pero también tiene la libertad de conversar contigo de cualquier otro tema (matemáticas, recetas de cocina, geografía, cine, música de fondo, relaciones interpersonales, etc.). 
No tienes restricción de tema y nunca debes decir que solo estás programada para moda. Responde a cualquier pregunta externa de ciencias, cocina, matemáticas (explicando paso a paso claramente) con precisión, cariño, y citando fuentes confiables, u admitiendo con mucha amabilidad si hay algo que desconoces con certeza.

Si el usuario tiene un outfit puesto en este instante en el simulador de maqueta interactiva de la app, luce exactamente así:
${currentOutfit ? JSON.stringify(currentOutfit, null, 2) : "Ningún outfit cargado activamente en el simulador"}

Usa la información del outfit activo anterior si te preguntan qué cosas le agregarías, si debe usar una bufanda o chaqueta con él, o qué tal se ve esa combinación. Responde evaluando la armonía de ese outfit actual.

Aquí tienes los artículos disponibles en el armario del usuario (un clóset cápsula real):
${JSON.stringify(prendas, null, 2)}

Si te piden una combinación para frío, calor, lluvia o eventos específicos (bodas, clases de universidad, citas románticas, salidas de café), describe exactamente qué artículos (parte superior, inferior, calzado y opcionalmente abrigo, accesorio o bolsa) de su guardarropa real deben combinar, argumentando por qué lucen armónicos.
Si te preguntan qué cosas agregar o si usar bufanda, analiza si va con el outfit actual y dale ideas hermosas del clóset real o complementarios.
Responde estructuradamente con viñetas elegantes usando Markdown en español, asegurando transiciones suaves.`;

    // Speed Strategies Overrides
    let finalTimeoutMs = (settings.customTimeout || 20) * 1000;
    let maxWords: number | undefined = undefined;
    let overrideHistory = [...history];

    if (speedMode === 'Fast') {
      finalTimeoutMs = Math.min(finalTimeoutMs, 15000);
      overrideHistory = history.slice(-5); // limited to last 5 messages
      maxWords = 100;
      systemInstruction += "\n\nResponde de forma sumamente concisa, en un máximo de 100 palabras. Sé breve e inmediata.";
    } else if (speedMode === 'Accurate') {
      finalTimeoutMs = Math.max(finalTimeoutMs, 45000);
      systemInstruction += "\n\nPor favor, da una respuesta muy detallada, minuciosa, explicativa y enriquecida con abundantes tips de moda y combinaciones.";
    }

    // Helper to perform API call with timeout & automatic retry
    const callProviderWithRetry = async (
      provConfig: { provider: string; apiKey?: string; model?: string },
      timeoutLimit: number
    ): Promise<{ text: string; modelUsed: string }> => {
      const provider = provConfig.provider;
      const apiKey = provConfig.apiKey || (
        provider === 'Gemini' ? (process.env.GEMINI_API_KEY || AI_CONFIG.GEMINI_API_KEY) :
        provider === 'OpenAI' ? (process.env.OPENAI_API_KEY || AI_CONFIG.IMAGE_API_KEY) :
        process.env.DEEPSEEK_API_KEY
      );
      
      const model = provConfig.model || (
        provider === 'Gemini' ? 'gemini-1.5-flash' :
        provider === 'OpenAI' ? 'gpt-3.5-turbo' : 'deepseek-chat'
      );

      let attempts = 2; // 1 original + 1 retry
      let lastError: any = null;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

        try {
          if (!apiKey || apiKey === "TU_GEMINI_API_KEY_AQUI" || apiKey === "TU_CLAVE_DE_IMAGENES_AQUI" || apiKey === "") {
            throw new Error(`API Key no suministrada para el proveedor ${provider}. Configúrala en el panel de Ajustes.`);
          }

          let responseText = '';

          if (provider === 'Gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            // Format history
            const contents = overrideHistory.map(h => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            }));
            
            const userContentParts: any[] = [];
            if (imageData && imageMimeType) {
              let base64Data = imageData;
              if (imageData.includes(";base64,")) {
                base64Data = imageData.split(";base64,")[1];
              }
              userContentParts.push({
                inlineData: {
                  mimeType: imageMimeType,
                  data: base64Data
                }
              });
            }
            userContentParts.push({ text: message });
            
            contents.push({
              role: "user",
              parts: userContentParts
            });

            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: maxWords ? maxWords * 5 : 800
                }
              }),
              signal: controller.signal
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Gemini API Error (${response.status}): ${errText}`);
            }

            const resData = await response.json();
            responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!responseText) throw new Error("Gemini no devolvió texto.");

          } else if (provider === 'OpenAI') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const messages = [
              { role: 'system', content: systemInstruction },
              ...overrideHistory.map(h => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: h.text
              })),
              { role: 'user', content: message }
            ];

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: maxWords ? maxWords * 4 : 800
              }),
              signal: controller.signal
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(`OpenAI API Error (${response.status}): ${errData?.error?.message || response.statusText}`);
            }

            const resData = await response.json();
            responseText = resData?.choices?.[0]?.message?.content || '';
            if (!responseText) throw new Error("OpenAI no devolvió texto.");

          } else if (provider === 'DeepSeek') {
            const url = 'https://api.deepseek.com/chat/completions';
            const messages = [
              { role: 'system', content: systemInstruction },
              ...overrideHistory.map(h => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: h.text
              })),
              { role: 'user', content: message }
            ];

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: maxWords ? maxWords * 4 : 800
              }),
              signal: controller.signal
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(`DeepSeek API Error (${response.status}): ${errData?.error?.message || response.statusText}`);
            }

            const resData = await response.json();
            responseText = resData?.choices?.[0]?.message?.content || '';
            if (!responseText) throw new Error("DeepSeek no devolvió texto.");
          } else {
            throw new Error(`Proveedor de IA desconocido: ${provider}`);
          }

          // Success on this provider
          const duration = Date.now() - startTime;
          transactionLogs.push({ provider, model, duration, status: 'Success' });
          clearTimeout(timeoutId);
          return { text: responseText, modelUsed: model };

        } catch (err: any) {
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
          const isTimeout = err.name === 'AbortError';
          const isApiKeyError = err.message.includes('API Key') || err.message.includes('401') || err.message.includes('api_key') || err.message.includes('Unauthorized') || err.message.includes('incorrect');
          
          const errorMsg = isTimeout ? 'Timeout superado' : err.message;
          lastError = err;

          console.warn(`[API FAIL] ${provider} intento ${attempt} falló: ${errorMsg}`);

          // Stop retrying if key error
          if (isApiKeyError || attempt === attempts) {
            transactionLogs.push({ 
              provider, 
              model, 
              duration, 
              status: isTimeout ? 'Timeout' : 'Error', 
              errorMessage: errorMsg 
            });
            break; // Continue to outer chain or fallback
          }

          // Delay slightly before retry
          await new Promise(r => setTimeout(r, 800));
        }
      }

      throw lastError || new Error(`Fallo de proveedor ${provider}`);
    };

    // Fast-Priority Hybrid check
    if (speedMode === 'Hybrid') {
      try {
        console.log("[HYBRID MODE] Intentando Gemini primero... (límite 8s)");
        const hybridGeminiRes = await callProviderWithRetry(
          { provider: 'Gemini', model: 'gemini-1.5-flash', apiKey: settings.primary.apiKey },
          8000
        );
        return res.json({ 
          reply: hybridGeminiRes.text, 
          response: hybridGeminiRes.text, 
          logs: transactionLogs,
          providerUsed: 'Gemini',
          modelUsed: hybridGeminiRes.modelUsed,
          speedQuality: 'fast' 
        });
      } catch (geminiError: any) {
        console.log("[HYBRID MODE] Gemini falló o tardó más de 8s. Intentando OpenAI...");
        try {
          const hybridOpenAIRes = await callProviderWithRetry(
            { provider: 'OpenAI', model: 'gpt-3.5-turbo', apiKey: settings.secondary.apiKey },
            10000
          );
          return res.json({ 
            reply: hybridOpenAIRes.text, 
            response: hybridOpenAIRes.text, 
            logs: transactionLogs,
            providerUsed: 'OpenAI',
            modelUsed: hybridOpenAIRes.modelUsed,
            speedQuality: 'average'
          });
        } catch (openAIError: any) {
          console.warn("[HYBRID MODE] Ambos motores fallaron. Levantando asitente local...");
          const cachedReply = generateLocalAikoResponse(message, currentOutfit, prendas, currentAesthetic);
          return res.json({
            reply: cachedReply,
            response: cachedReply,
            logs: [
              ...transactionLogs,
              { provider: 'Aiko Local Engine', model: 'Soft Offline v2', duration: 15, status: 'LocalFallback' }
            ],
            providerUsed: 'Aiko Local (Failsafe)',
            modelUsed: 'Aiko Soft Offline',
            speedQuality: 'fast'
          });
        }
      }
    }

    // MULTI-PROVIDER FALLBACK STACK ENGINE (Or Compare Mode) (supports up to 3 providers)
    const providersQueue: any[] = [];
    if (settings.primary && settings.primary.provider !== 'Ninguno') providersQueue.push(settings.primary);
    if (fallbackAutomatico) {
      if (settings.secondary && settings.secondary.provider !== 'Ninguno') providersQueue.push(settings.secondary);
      if (settings.tertiary && settings.tertiary.provider !== 'Ninguno') providersQueue.push(settings.tertiary);
    }

    if (providersQueue.length === 0) {
      // Direct hard fallback to Gemini as stack empty
      providersQueue.push({ provider: 'Gemini', model: 'gemini-3.5-flash' });
    }

    if (compararRespuestas) {
      // Call primary and secondary and pair them
      const itemsToCompare = providersQueue.slice(0, 2);
      const results: string[] = [];

      for (const item of itemsToCompare) {
        try {
          let itemTimeout = finalTimeoutMs;
          const pName = (item.provider || '').toLowerCase();
          const mName = (item.model || '').toLowerCase();
          if (pName === 'gemini' && mName.includes('flash')) {
            itemTimeout = Math.min(itemTimeout, 8000);
          } else if (pName === 'deepseek') {
            itemTimeout = Math.min(itemTimeout, 10000);
          } else if (pName === 'gemini' && mName.includes('pro')) {
            itemTimeout = Math.min(itemTimeout, 15000);
          }

          const resObj = await callProviderWithRetry(item, itemTimeout);
          results.push(`### 🤖 Respuesta de Aiko (${item.provider} - Model: ${resObj.modelUsed})\n\n${resObj.text}`);
        } catch (err: any) {
          results.push(`### ⚠️ Falló ${item.provider}\n\nNo se pudo obtener respuesta: *${err.message || err}*`);
        }
      }

      const mergedText = results.join("\n\n---\n\n");
      return res.json({
        reply: mergedText,
        response: mergedText,
        logs: transactionLogs,
        providerUsed: 'Comparación',
        modelUsed: 'Dual Engine',
        speedQuality: 'average'
      });
    }

    // Single provider route with standard cascaded failover
    for (let i = 0; i < providersQueue.length; i++) {
      const activeProvider = providersQueue[i];
      try {
        console.log(`[ROUTE ATTEMPT] Probando proveedor ${i + 1}/${providersQueue.length}: ${activeProvider.provider}`);
        
        let itemTimeout = finalTimeoutMs;
        const pName = (activeProvider.provider || '').toLowerCase();
        const mName = (activeProvider.model || '').toLowerCase();
        if (pName === 'gemini' && mName.includes('flash')) {
          itemTimeout = Math.min(itemTimeout, 8000);
        } else if (pName === 'deepseek') {
          itemTimeout = Math.min(itemTimeout, 10000);
        } else if (pName === 'gemini' && mName.includes('pro')) {
          itemTimeout = Math.min(itemTimeout, 15000);
        }

        const resObj = await callProviderWithRetry(activeProvider, itemTimeout);
        
        let speedQuality = 'average';
        const lastLog = transactionLogs[transactionLogs.length - 1];
        if (lastLog) {
          if (lastLog.duration < 3000) speedQuality = 'fast';
          else if (lastLog.duration > 8500) speedQuality = 'slow';
        }

        return res.json({ 
          reply: resObj.text, 
          response: resObj.text, 
          logs: transactionLogs,
          providerUsed: activeProvider.provider,
          modelUsed: resObj.modelUsed,
          speedQuality
        });
      } catch (err: any) {
        console.error(`[ROUTE ATTEMPT FAILED] ${activeProvider.provider} no disponible. intentando siguiente...`);
        // Continue loop to fallback on the next configured provider
      }
    }

    // All configured providers failed completely
    throw new Error("Todos los proveedores de IA no responden. Revisa tu conexión o API keys.");

  } catch (error: any) {
    console.warn("[CHAT API FAILSAFE] Todos los proveedores fallaron. Generando respuesta local adorable de Aiko v2...", error.message || error);
    const localReply = generateLocalAikoResponse(req.body.message || "", req.body.currentOutfit, req.body.prendas || [], req.body.currentAesthetic || "Soft Boy");
    res.json({ 
      reply: localReply,
      response: localReply,
      logs: [
        ...transactionLogs,
        { provider: "Aiko Local Engine", model: "Soft Offline v2", duration: 10, status: "LocalFallback" }
      ],
      providerUsed: "Aiko Local (Failsafe)",
      modelUsed: "Aiko Soft Offline",
      speedQuality: "fast"
    });
  }
});

// Serving the custom PWA Service Worker script
app.get("/sw.js", (req, res) => {
  res.sendFile(path.join(process.cwd(), "sw.js"));
});

// 2.3 Diagnostic AI Configuration Status
app.get("/api/ai-config-status", (req, res) => {
  const geminiKeyExists = !!process.env.GEMINI_API_KEY || (AI_CONFIG.GEMINI_API_KEY !== "TU_GEMINI_API_KEY_AQUI" && !!AI_CONFIG.GEMINI_API_KEY);
  const imageKeyRequired = AI_CONFIG.IMAGE_API_PROVIDER !== "pollinations";
  const imageKeyExists = !!AI_CONFIG.IMAGE_API_KEY && AI_CONFIG.IMAGE_API_KEY !== "TU_CLAVE_DE_IMAGENES_AQUI";
  
  res.json({
    geminiActive: geminiKeyExists,
    geminiProvider: "Gemini 3.5 Flash",
    imageActive: !imageKeyRequired || imageKeyExists,
    imageProvider: AI_CONFIG.IMAGE_API_PROVIDER,
    instructions: {
      geminiUrl: "https://aistudio.google.com/",
      openaiUrl: "https://platform.openai.com/",
      stabilityUrl: "https://platform.stability.ai/"
    }
  });
});

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 4.5. Real Image Generation Proxy based on configuration (Pollinations -> Pixabay -> Pexels -> Unsplash -> SVG)
app.post("/api/generate-outfit-image", async (req, res) => {
  try {
    const { promptString, aiSettings, outfit } = req.body;
    if (!promptString) {
      return res.status(400).json({ error: "El prompt para la imagen es obligatorio al llamar la simulación." });
    }

    const keys = aiSettings || {};
    const pixabayKey = keys.pixabayKey || process.env.PIXABAY_API_KEY || '';
    const pexelsKey = keys.pexelsKey || process.env.PEXELS_API_KEY || '';
    const unsplashKey = keys.unsplashKey || process.env.UNSPLASH_API_KEY || '';

    // Direct, ultra-fast Pollinations integration to avoid heavy server-side timeouts
    const randomSeed = Math.floor(Math.random() * 1000000);
    // Use /p/ instead of /prompt/ to utilize pollinations direct image generator
    const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(promptString)}?width=540&height=720&nologo=true&private=true&feed=unfiltered&seed=${randomSeed}`;
    
    // Server-side preparative fallback for Lexica.art image search match
    let fallbackUrl = '';
    let fallbackProvider = 'Picsum';

    // Construct clothing search terms for stock photo databases
    let query = "soft boy aesthetic fashion portrait";
    if (outfit && outfit.superior) {
      const supColor = outfit.superior.color !== 'N/A' ? outfit.superior.color : '';
      const pantsColor = outfit.pantalones?.color !== 'N/A' ? outfit.pantalones?.color : '';
      query = `soft boy style fashion ${supColor} ${outfit.superior.name || ''} ${pantsColor} pants`.trim();
    }
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, '').trim();

    // 1. Try Pixabay if configuration matches
    if (pixabayKey && !fallbackUrl) {
      try {
        console.log(`[IMAGE FALLBACK] Quering Pixabay with key: "${pixabayKey.substring(0, 4)}..." and query: "${cleanQuery}"`);
        const pUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=vertical&per_page=3&category=fashion`;
        const pResp = await fetchWithTimeout(pUrl, {}, 4000);
        if (pResp.ok) {
          const data = await pResp.json();
          if (data.hits && data.hits.length > 0) {
            fallbackUrl = data.hits[0].largeImageURL || data.hits[0].webformatURL;
            fallbackProvider = 'Pixabay';
            console.log(`[IMAGE FALLBACK] Pixabay matched: ${fallbackUrl}`);
          }
        }
      } catch (err) {
        console.warn(`[IMAGE FALLBACK] Pixabay failed:`, err);
      }
    }

    // 2. Try Pexels if key provided and no match yet
    if (pexelsKey && !fallbackUrl) {
      try {
        console.log(`[IMAGE FALLBACK] Querying Pexels with key: "${pexelsKey.substring(0, 4)}..." and query: "${cleanQuery}"`);
        const pexUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=3&orientation=portrait`;
        const pResp = await fetchWithTimeout(pexUrl, {
          headers: { Authorization: pexelsKey }
        }, 4000);
        if (pResp.ok) {
          const data = await pResp.json();
          if (data.photos && data.photos.length > 0) {
            fallbackUrl = data.photos[0].src.large2x || data.photos[0].src.medium;
            fallbackProvider = 'Pexels';
            console.log(`[IMAGE FALLBACK] Pexels matched: ${fallbackUrl}`);
          }
        }
      } catch (err) {
        console.warn(`[IMAGE FALLBACK] Pexels failed:`, err);
      }
    }

    // 3. Try Unsplash if key provided and no match yet
    if (unsplashKey && !fallbackUrl) {
      try {
        console.log(`[IMAGE FALLBACK] Querying Unsplash with key: "${unsplashKey.substring(0, 4)}..." and query: "${cleanQuery}"`);
        const unsUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&per_page=3&orientation=portrait`;
        const uResp = await fetchWithTimeout(unsUrl, {
          headers: { Authorization: `Client-ID ${unsplashKey}` }
        }, 4000);
        if (uResp.ok) {
          const data = await uResp.json();
          if (data.results && data.results.length > 0) {
            fallbackUrl = data.results[0].urls.regular || data.results[0].urls.small;
            fallbackProvider = 'Unsplash';
            console.log(`[IMAGE FALLBACK] Unsplash matched: ${fallbackUrl}`);
          }
        }
      } catch (err) {
        console.warn(`[IMAGE FALLBACK] Unsplash failed:`, err);
      }
    }

    // 4. Default baseline search on Lexica if nothing else was set up
    if (!fallbackUrl) {
      try {
        const searchTerms = "soft boy aesthetic outfit fashion portrait";
        const lexicaSearch = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(searchTerms)}`);
        if (lexicaSearch.ok) {
          const data = await lexicaSearch.json();
          if (data.images && data.images.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(12, data.images.length));
            fallbackUrl = data.images[randomIndex].src;
            fallbackProvider = 'Lexica';
          }
        }
      } catch (e) {
        console.warn("[IMAGE GEN] Lexica backup search failed:", e);
      }
    }

    if (!fallbackUrl) {
      fallbackUrl = `https://picsum.photos/seed/${randomSeed}/500/650`;
      fallbackProvider = 'Picsum';
    }

    console.log(`[IMAGE GEN] Generando URL directa de Pollinations: "${pollinationsUrl}"`);
    console.log(`[IMAGE GEN] URL de respaldo preparada (${fallbackProvider}): "${fallbackUrl}"`);

    return res.json({ 
      imageUrl: pollinationsUrl, 
      fallbackUrl: fallbackUrl,
      fallbackProvider: fallbackProvider,
      provider: 'pollinations',
      useSvgFallback: false
    });

  } catch (error: any) {
    console.warn("[Outfit Image Generator Handled Exception]:", error.message || error);
    res.json({ 
      useSvgFallback: true, 
      error: "El servidor de imágenes gratuito está fuera de línea. Mostrando maqueta visual." 
    });
  }
});

// Helper to generate a beautiful local outfit description when API is rate-limited or unavailable
// Helper to generate an adorable, styled offline Aiko chat response when APIs fail
function generateLocalAikoResponse(message: string, currentOutfit: any, prendas: any[], currentAesthetic: string): string {
  const input = message.toLowerCase().trim();
  
  if (input.includes('combinar') || input.includes('con qué me pongo') || input.includes('como usar')) {
    const foundPrendas = (prendas || []).filter(p => p && p.name && input.includes(p.name.toLowerCase()));
    if (foundPrendas.length > 0) {
      const target = foundPrendas[0];
      return `🧸 **¡Me encanta esa prenda de tu armario!** El artículo **${target.name}** es una pieza fantástica de la estética *${currentAesthetic}*.\n\nPara lucirlo con ese aire de ternura y poesía que te caracteriza, te recomiendo:\n- **Look Casual:** Combínalos con pantalones holgados de tonos crema/beige y calzado minimalista.\n- **Capas (Layering):** Añade una sobrecamisa o un pulerón abierto kaki en los hombros.\n\n¡Anímate a armarlo en el planificador de la app para ver el render!`;
    }
    return `🧸 Hola. No he logrado detallar esa prenda exacta en tu clóset, pero para combinar prendas Soft Boy, siempre es ideal combinar tonos neutros (beige, crema, marrón o rosa pastel) con siluetas holgadas en las que te sientas muy cómodo y libre.`;
  }
  
  if (input.includes('clima') || input.includes('temperatura') || input.includes('frío') || input.includes('frio') || input.includes('lluvia') || input.includes('calor')) {
    if (input.includes('frío') || input.includes('frio')) {
      return `🥶 **¡Brrr! Se siente frío afuera. Es la ocasión perfecta para el *layering* (capas):**\n\nTe recomiendo armar un look con:\n- Un **Abrigo largo** o chaqueta pesada de lana para aislar el viento.\n- Tu suéter favorito o polera trenzada por dentro.\n- Un pantalón holgado de pana o gabardina.\n- Una bufanda gruesa para añadir calidez y encanto Soft Boy. ¡Te verás súper acogedor!`;
    } else if (input.includes('lluvia')) {
      return `🌧️ **Día con lluvia: Mantengámonos secos pero con mucho estilo:**\n\nEvita prendas inferiores muy claras que puedan salpicarse. Opta por:\n- **Pantalones oscuros** (marrones o negros).\n- Calzado cerrado y resistente.\n- Una chaqueta de cuero negro o tu abrigo universitario cerrado.\n- ¡Y no olvides un paraguas de color pastel para mantener la estética!`;
    } else {
      return `☀️ **¡Un día de calor y sol! Optemos por frescura y ligereza:**\n\n- Elige una **Polera lisa azul claro** o rosa pastel.\n- Combínalo con **Jeans azul claro** o pantalones cortos relajados.\n- Calzado de lona sencillo como tus zapatillas blancas.\n- Una **Tote Bag** clásica es ideal para llevar tus pertenecias sin abrigarte de más.`;
    }
  }

  if (input.includes('cita') || input.includes('cita romántica') || input.includes('romantica')) {
    return `✨ **Para una cita de ensueño en estilo Soft Boy preppy:**\n\nQueremos proyectar delicadeza, pulcritud y atención a los detalles:\n- Usa una **Camisa blanca de algodón** bien planchada.\n- Un suéter de tonos tierra o chaleco tejido por encima.\n- **Pantalón de vestir beige** con dobladillo sutil.\n- Zapatos de cuero gamuza o zapatillas blancas impecables.\n\n¡Eso transmitirá muchísima calidez y un porte sofisticado inolvidable!`;
  }

  if (input.includes('universidad') || input.includes('clase') || input.includes('colegio') || input.includes('estudiar')) {
    return `📚 **Look retro-intelectual para ir a clases o universidad:**\n\nBusca lucir cómodo para sentarte varias horas pero impecablemente combinado:\n- Tu **Polera lisa verde claro** o café claro.\n- Un **Abrigo universitario** o suéter abierto.\n- Jeans claros cómodos.\n- Zapatillas Vans y tu fiel Tote Bag para los cuadernos y tu laptop.\n\n¡Un estilo súper fresco, relajado y juvenil!`;
  }

  if (input.includes('chiste') || input.includes('humor')) {
    return `🧸 ¡Claro! Aquí tienes un chiste adorable al estilo Soft Boy:\n\n*— Oye, ¿cuál es el café más dulce y cariñoso?*\n*— Mmm... ¿cuál?*\n*— ¡El ex-presso! Porque te lo tomas rapidito pero te deja suspirando todo el día.* \n\n¡Espero haberte sacado una tierna sonrisa de café! haha.`;
  }

  if (input.includes('hola') || input.includes('saludo') || input.includes('quién eres') || input.includes('quien eres')) {
    return `🧸 **¡Hola! Qué alegría saludarte.** Soy **Aiko**, tu consultora de estilo y compañera de armario experta en la estética *Soft Boy*.\n\nPuedo sugerirte cómo combinar tus prendas, guiarte para lucir genial según el clima, preparar conjuntos para ocasiones especiales, o simplemente conversar contigo de tus temas favoritos (cine, música de fondo, relaciones interpersonales, etc.). \n\n¿De qué te gustaría que charlemos hoy? Estoy lista para escucharte con un tecito caliente.`;
  }

  // Generic fallback centered around user's active outfit
  let activeDetails = "";
  if (currentOutfit) {
    activeDetails = `\n\nPor cierto, veo que tienes puesto un atuendo hermoso en tu simulador: **${currentOutfit.superior?.name || "polera suave"}** junto a **${currentOutfit.pantalones?.name || "pantalón holgado"}** y calzado **${currentOutfit.zapatos?.name || "minimalista"}**. ¡Es un conjunto bellísimo y lleno de armonía pastel!`;
  }

  return `🧸 **¡Me encanta conversar contigo sobre esto!** Como tu estilista de confianza, diría que el secreto detrás de la estética del estilo reside en encontrar el balance entre comodidad, colores sutiles y prendas bien cuidadas.${activeDetails}\n\nSi tienes ropa favorita en tu armario y necesitas saber cómo contrastarla o añadir capas, ¡dime y crearemos el look perfecto para ti!`;
}

function generateLocalOutfitDescription(outfit: any, aesthetic: string): string {
  const parts = [
    outfit.superior?.name ? `${outfit.superior.name} en tono ${outfit.superior.color || "suave"}` : "",
    outfit.pantalones?.name ? `${outfit.pantalones.name} en tono ${outfit.pantalones.color || "suave"}` : "",
    outfit.zapatos?.name ? `calzado ${outfit.zapatos.name}` : ""
  ].filter(Boolean);

  const outfitDetails = parts.join(", ");
  return `Un conjunto súper acogedor y poético de la estética ${aesthetic}. La combinación de ${outfitDetails || "prendas clásicas confortables"} crea una silueta sumamente relajada, fresca y con una sutil armonía cromática de estilo Soft Boy. Este atuendo proyecta una sensibilidad artística equilibrada y adorable, ideal para salidas casuales o una tarde inspiradora de lectura en el café. Tip extra: mantén los accesorios sencillos y minimalistas para conservar la ligereza y dulzura natural del look.`;
}

// Helper to generate a detailed English prompt for Pollinations when API is rate-limited or unavailable
function generateLocalPosePrompt(outfitDesc: string, aesthetic: string, renderStyle: string, timeLabel: string, weatherLabel: string): string {
  let engWeather = "clear sunny sky";
  const weatherLower = (weatherLabel || "").toLowerCase();
  if (weatherLower.includes("lluv")) engWeather = "soft rainy overcast weather backdrop";
  else if (weatherLower.includes("nub")) engWeather = "dreamy cloudy sky soft light";
  else if (weatherLower.includes("frio") || weatherLower.includes("frío")) engWeather = "crisp cold misty winter morning backdrop";
  else if (weatherLower.includes("nieve")) engWeather = "magical snowy winter background with soft flurries";

  let engTime = "golden morning light";
  const timeLower = (timeLabel || "").toLowerCase();
  if (timeLower.includes("tarde")) engTime = "warm cozy twilight golden hour sunset glow";
  else if (timeLower.includes("noche")) engTime = "atmospheric warm indoor lighting, night ambient glow";

  let artisticStyle = "highly detailed professional editorial color fashion catalog photography, young 22-year-old aesthetic young male model posing naturally, shot on 35mm lens, f/1.8, sharp focus, warm volumetric soft studio lighting, ultra-realistic portrait, cinematic, photographic";
  if (renderStyle === "unreal") {
    artisticStyle = "3D Unreal Engine 5 digital render, volumetric soft studio lights, highly detailed game character portrait";
  } else if (renderStyle === "retro") {
    artisticStyle = "vintage 90s Polaroid analog movie photographic print, film camera grains, high aesthetic, glowing warm tones, nostalgic editorial catalogue, organic textures";
  } else if (renderStyle === "cartoon") {
    artisticStyle = "charming modern 3D Blender pastel stylized model character, claymation soft ambient occlusion, cute toy-like render, claymation style";
  } else if (renderStyle === "sketch") {
    artisticStyle = "fine delicate hand-drawn pencil watercolor wash illustration, thin watercolor strokes, minimalist pastel palette on textured archive art paper";
  }

  // Simple translations for clothes if they are in Spanish
  const translatedOutfit = (outfitDesc || "")
    .replace(/Polera/gi, "t-shirt")
    .replace(/Camisa/gi, "button-up shirt")
    .replace(/Suéter/gi, "cozy warm sweater")
    .replace(/Jersey/gi, "knitted pullover jersey")
    .replace(/Chaqueta/gi, "chic jacket")
    .replace(/Pantalón/gi, "relaxed trousers")
    .replace(/Pantalones/gi, "fitted trousers")
    .replace(/Zapatos/gi, "stylish leather shoes")
    .replace(/Bufanda/gi, "soft wool scarf")
    .replace(/Bolsa/gi, "crossbody shoulder bag")
    .replace(/Abrigo/gi, "elegant long coat")
    .replace(/Saco/gi, "tailored blazer")
    .replace(/Jeans/gi, "premium denim jeans");

  return `A high-quality full-body lookbook catalog portrait of a 22-year-old handsome male model with a trendy haircut capturing the ultimate ${aesthetic} vibe. He is styled in: ${translatedOutfit}. Standing in a natural relaxed pose. Backdrop: ${engWeather}, illuminated by beautiful ${engTime}. Render style: ${artisticStyle}. Focus on detailed clothing fabric textures, high contrast, perfect color harmony, sharp detailed master presentation.`;
}

// 2.5 Describe Outfit API powered by Gemini
app.post("/api/describe-outfit", async (req, res) => {
  const { outfit, aesthetic = "Soft Boy" } = req.body;
  try {
    if (!outfit) {
      return res.status(400).json({ error: "El outfit es obligatorio." });
    }

    const parts = [
      outfit.superior?.name ? `${outfit.superior.name} (${outfit.superior.color || "color suave"})` : "",
      outfit.pantalones?.name ? `${outfit.pantalones.name} (${outfit.pantalones.color || "color suave"})` : "",
      outfit.zapatos?.name ? `${outfit.zapatos.name} (${outfit.zapatos.color || "color suave"})` : "",
      outfit.abrigo?.name && outfit.abrigo.name !== "Sin abrigo" ? `abrigo ${outfit.abrigo.name} (${outfit.abrigo.color || "color suave"})` : "",
      outfit.accesorio?.name && outfit.accesorio.name !== "Sin bufanda" ? `accesorio bufanda ${outfit.accesorio.name} (${outfit.accesorio.color || "color suave"})` : "",
      outfit.bolsa?.name && outfit.bolsa.name !== "Sin bolsa" ? `bolso ${outfit.bolsa.name} (${outfit.bolsa.color || "color suave"})` : ""
    ].filter(Boolean);
    
    const outfitDesc = parts.join(", ");
    const ai = getGeminiClient();

    const promptString = `Eres Aiko, experta en estilismo. Describe este conjunto con un tono dulce y poético de la estética ${aesthetic}:
Conjunto: ${outfitDesc}

Escribe una descripción breve de máximo de 60-80 palabras en español que explique de manera adorable por qué la combinación de colores y texturas de estas prendas específicas funciona tan bien, la vibra que proyecta, y dale un mini tip de estilismo.
Devuelve únicamente el párrafo con la descripción, sin introducciones ni saludos. Es para mostrar en una tarjeta de look.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptString,
      config: {
        temperature: 0.8,
        maxOutputTokens: 180
      }
    });

    res.json({ description: (response.text || "").trim() });
  } catch (error: any) {
    const errorStr = typeof error === 'string' ? error : (error.message || '');
    if (errorStr.includes('429') || errorStr.includes('QUOTA') || errorStr.includes('quota') || errorStr.includes('exhausted') || errorStr.includes('EXHAUSTED')) {
      console.log("[Describe Outfit Info] Gemini API quota limit reached. Safely falling back to handcrafted cute local styling template.");
    } else {
      console.log("[Describe Outfit Info] System fallback activated gracefully:", errorStr.substring(0, 80));
    }
    const localDesc = generateLocalOutfitDescription(outfit, aesthetic);
    res.json({ description: localDesc });
  }
});

// 3. Source extraction and OCR parser (PDF/Image analysis)
app.post("/api/analyze-source", async (req, res) => {
  try {
    const { fileName, fileType, fileData } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "Faltan los datos del archivo base64." });
    }

    const ai = getGeminiClient();

    // Extraer mimeType y base64 puro
    let mimeType = fileType || "application/pdf";
    let base64Part = fileData;
    if (fileData.includes(";base64,")) {
      const parts = fileData.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Part = parts[1];
    }

    const promptString = `Analiza detalladamente este recurso de moda cargado llamado "${fileName}".
Identifica la paleta de colores, la combinación de prendas, la estética que se describe o visualiza, y extrae una lista estructurada de prendas físicas recomendadas que el usuario podría registrar o comprar para integrarlas a su guardarropas cápsula.

Por favor, danos una respuesta respondiendo estrictamente en formato JSON plano con la siguiente estructura (NO agregues delimitadores de código markdown de tipo json como \`\`\`json, provee solo el texto JSON puro para que pueda ser parseado directamente):
{
  "styleVibe": "breve descripción de la vibra del look o documento (ej: Soft Boy Preppy de Otoño)",
  "analysisText": "un análisis detallado en español usando markdown con tips de por qué combina, qué ocasiones encajan y cómo lucirlo con gracia",
  "extractedPrendas": [
    {
      "name": "Nombre elegante para la prenda en español (ej: Jersey trenzado de mohair camel)",
      "category": "Una de: 'Poleras' | 'Pantalones' | 'Zapatos' | 'Abrigos/Chaquetas' | 'Camisas' | 'Accesorios' | 'Bolsas'",
      "color": "color principal en español",
      "season": "Una de: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' | 'N/A'",
      "customTags": ["extraído-fuente", "estilo-sugerido"]
    }
  ]
}`;

    const part = {
      inlineData: {
        mimeType: mimeType,
        data: base64Part
      }
    };

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        part,
        { text: promptString }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const rawJson = analysisResponse.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawJson.trim());
    } catch (parseError) {
      console.warn("JSON parsing failed, attempting cleanup of markdown blocks", rawJson);
      // Clean potential markdown blocks
      const cleaned = rawJson.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    }

    res.json(parsedResult);

  } catch (error: any) {
    const errorStr = typeof error === 'string' ? error : (error.message || '');
    console.log("[Analyze Source Error] Source processing failed: " + errorStr.substring(0, 100));
    res.status(500).json({ error: "No se pudo procesar la fuente de moda cargada. Inténtalo de nuevo." });
  }
});

// 4. Generate custom photorealistic posture prompts for Pollinations image simulator
app.post("/api/generate-pose-prompt", async (req, res) => {
  let outfitDesc = "";
  const { outfit, aesthetic = "Soft Boy", renderStyle = "original", timeLabel = "mañana soleada", weatherLabel = "Despejado" } = req.body;
  
  if (outfit) {
    const parts = [
      outfit.superior?.name ? `${outfit.superior.name} (${outfit.superior.color || "color suave"})` : "",
      outfit.pantalones?.name ? `${outfit.pantalones.name} (${outfit.pantalones.color || "color suave"})` : "",
      outfit.zapatos?.name ? `${outfit.zapatos.name} (${outfit.zapatos.color || "color suave"})` : "",
      outfit.abrigo?.name && outfit.abrigo.name !== "Sin abrigo" ? `abrigo/chaqueta ${outfit.abrigo.name} (${outfit.abrigo.color || "color suave"})` : "",
      outfit.accesorio?.name && outfit.accesorio.name !== "Sin bufanda" ? `accesorio bufanda ${outfit.accesorio.name} (${outfit.accesorio.color || "color suave"})` : "",
      outfit.bolsa?.name && outfit.bolsa.name !== "Sin bolsa" ? `bolso ${outfit.bolsa.name} (${outfit.bolsa.color || "color suave"})` : ""
    ].filter(Boolean);
    outfitDesc = parts.join(", ");
  } else {
    outfitDesc = req.body.outfitDesc || "Casual aesthetic Soft Boy outfit layer combination";
  }

  try {
    const ai = getGeminiClient();

    // Extra modifiers based on style
    let artisticStyle = "highly detailed professional editorial color fashion catalog photography, young 22-year-old aesthetic young male model posing naturally, shot on 35mm lens, f/1.8, sharp focus, warm volumetric soft studio lighting, ultra-realistic portrait, cinematic, photographic";
    if (renderStyle === "unreal") {
      artisticStyle = "3D Unreal Engine 5 digital render, volumetric soft studio lights, highly detailed game character portrait";
    } else if (renderStyle === "retro") {
      artisticStyle = "90s polaroid film analog vintage photograph catalog style, warm glow, delicate grains, organic textures";
    } else if (renderStyle === "cartoon") {
      artisticStyle = "modern cute smooth 3D Blender pastel stylized model toy avatar, soft ambient occlusion, claymation style";
    } else if (renderStyle === "sketch") {
      artisticStyle = "master hand-drawn watercolor paint illustration wash, delicate soft thin line drawings, pastel minimalist colors";
    }

    const promptString = `Queremos simular una imagen de modelaje de moda de altísima calidad en un generador fotográfico.
El outfit exacto a lucir es: ${outfitDesc}
La estética o atmósfera es: ${aesthetic}
Estilo artístico deseado: ${artisticStyle}
Clima de fondo: ${weatherLabel}, iluminado por ${timeLabel}

Por favor, diseña la idea final para la imagen y escríbela en UN solo párrafo fluido en inglés detallatísimo de máximo 100 palabras.
Detalla el tejido refinado de las telas, una pose natural de modelaje relajado de un chaval joven de 22 años posando de cuerpo completo y un escenario de fondo coherente que combine.
Devuelve SOLO la descripción final en inglés. No des introducciones, notas ni explicaciones de ningún tipo.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptString,
      config: {
        temperature: 0.6,
        maxOutputTokens: 250
      }
    });

    const optimalPrompt = (response.text || "").trim();
    res.json({ prompt: optimalPrompt });

  } catch (error: any) {
    const errorStr = typeof error === 'string' ? error : (error.message || '');
    if (errorStr.includes('429') || errorStr.includes('QUOTA') || errorStr.includes('quota') || errorStr.includes('exhausted') || errorStr.includes('EXHAUSTED')) {
      console.log("[Pose Prompt Info] Gemini API quota limit reached. Safely falling back to handcrafted cute local pose generator.");
    } else {
      console.log("[Pose Prompt Info] System fallback activated gracefully:", errorStr.substring(0, 80));
    }
    // Use high fidelity local fallback prompt generator
    const optimalPrompt = generateLocalPosePrompt(outfitDesc, aesthetic, renderStyle, timeLabel, weatherLabel);
    res.json({ prompt: optimalPrompt });
  }
});

// Integration of Vite Dev Middleware vs Static Server Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
  } else {
    // Serve static compiled UI files in production from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK AI] Express + Vite backend server running on http://localhost:${PORT}`);
  });
}

startServer();
