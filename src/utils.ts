import { Prenda, Outfit } from './types';
import { COLOR_CLASSES_MAP } from './data';

// Detect climate/season from month
export function getAutomaticSeason(): 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' {
  const month = new Date().getMonth(); // 0-11
  // June is Month 5 - typical Winter (Southern) or Summer (Northern)
  // Let's assume a generic cycle
  if (month >= 11 || month <= 1) {
    return 'Invierno';
  } else if (month >= 2 && month <= 4) {
    return 'Otoño/Primavera';
  } else if (month >= 5 && month <= 7) {
    return 'Todo el año'; // Summer / warm
  } else {
    return 'Otoño/Invierno';
  }
}

// Generate smart Pick outfit
export function generateSmartPick(
  allPrendas: Prenda[],
  lockedCategoryOutfit: Partial<Outfit>,
  currentSeasonFilter: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' | 'Todas',
  historialIds: string[][], // Array of [superiorId, pantalonesId, zapatosId...] to prevent collision
  dislikedIds: string[] = [] // ID of garments disliked to avoid suggesting them
): Outfit | null {
  // Helpers to select candidates
  const getCandidates = (
    categories: ('Poleras' | 'Camisas' | 'Pantalones' | 'Zapatos' | 'Abrigos/Chaquetas' | 'Accesorios' | 'Bolsas')[]
  ) => {
    let list = allPrendas.filter(p => categories.includes(p.category) && !p.inLaundry && !dislikedIds.includes(p.id));
    
    // Filter by season unless 'Todas' is selected
    if (currentSeasonFilter !== 'Todas') {
      list = list.filter(p => 
        p.season === 'Todo el año' || 
        p.season === 'N/A' ||
        p.season === currentSeasonFilter ||
        (currentSeasonFilter === 'Invierno' && p.season === 'Otoño/Invierno') ||
        (currentSeasonFilter === 'Otoño/Invierno' && p.season === 'Invierno')
      );
    }
    return list;
  };

  // Categories lists
  const superiors = getCandidates(['Poleras', 'Camisas']);
  const pants = getCandidates(['Pantalones']);
  const shoes = getCandidates(['Zapatos']);
  const abrigos = getCandidates(['Abrigos/Chaquetas']);
  const accesorios = getCandidates(['Accesorios']); // Has "Sin bufanda"
  const bolsas = getCandidates(['Bolsas']); // Has "Sin bolsa"

  if (superiors.length === 0 || pants.length === 0 || shoes.length === 0) {
    return null; // Essential components missing
  }

  // Weight random choice function prioritizing favorites
  const pickWeighted = (candidates: Prenda[]): Prenda => {
    const weights = candidates.map(c => (c.isFavorite ? 4 : 1));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[0];
  };

  // We should try multiple random combinations to find one not in last 7 outfits
  let attempts = 50;
  let companion: Outfit | null = null;

  while (attempts > 0) {
    const selectedSuperior = lockedCategoryOutfit.superior || pickWeighted(superiors);
    const selectedPants = lockedCategoryOutfit.pantalones || pickWeighted(pants);
    const selectedShoes = lockedCategoryOutfit.zapatos || pickWeighted(shoes);

    // Abrigo is optional. Choose one or none.
    let selectedAbrigo = lockedCategoryOutfit.hasOwnProperty('abrigo') 
      ? lockedCategoryOutfit.abrigo 
      : (Math.random() > 0.3 && abrigos.length > 0 ? pickWeighted(abrigos) : null);

    // Accesorios/Bolsas are selected from list. List already contains "Sin bufanda"/"Sin bolsa"
    const selectedAccesorio = lockedCategoryOutfit.hasOwnProperty('accesorio')
      ? lockedCategoryOutfit.accesorio
      : (accesorios.length > 0 ? pickWeighted(accesorios) : null);

    const selectedBolsa = lockedCategoryOutfit.hasOwnProperty('bolsa')
      ? lockedCategoryOutfit.bolsa
      : (bolsas.length > 0 ? pickWeighted(bolsas) : null);

    const matchTuple = [
      selectedSuperior.id,
      selectedPants.id,
      selectedShoes.id,
      selectedAbrigo?.id || 'none',
      selectedAccesorio?.id || 'none',
      selectedBolsa?.id || 'none',
    ];

    // Check if duplicate of recent combos
    const isDuplicate = historialIds.some(hist => {
      return (
        hist[0] === matchTuple[0] &&
        hist[1] === matchTuple[1] &&
        hist[2] === matchTuple[2] &&
        hist[3] === matchTuple[3]
      );
    });

    if (!isDuplicate || attempts === 1) {
      companion = {
        superior: selectedSuperior,
        pantalones: selectedPants,
        zapatos: selectedShoes,
        abrigo: selectedAbrigo,
        accesorio: selectedAccesorio,
        bolsa: selectedBolsa
      };
      break;
    }
    attempts--;
  }

  return companion;
}

// Smart AI Assistant rules engine (in spanish, responsive and very complete)
export function runAssistantOffline(
  text: string,
  prendas: Prenda[],
  currentAesthetic: string = 'Soft Boy'
): { response: string, suggestedPrendas?: Prenda[] } {
  const input = text.toLowerCase().trim();

  // Helper search garment Fuzzy
  const searchGarment = (query: string): Prenda | null => {
    return prendas.find(p => p.name.toLowerCase().includes(query) || query.includes(p.name.toLowerCase())) || null;
  };

  // Find all matches sorted by length
  const findPrendasInQuery = (): Prenda[] => {
    return prendas.filter(p => input.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(' ').some(w => w.length > 3 && input.includes(w)));
  };

  // 1. Combinar prenda specific question
  if (input.includes('combinar') || input.includes('con qué me pongo') || input.includes('que me pongo con') || input.includes('como usar')) {
    const found = findPrendasInQuery();
    if (found.length > 0) {
      const target = found[0];
      // Generate combination suggestions
      let complementos: Prenda[] = [];
      if (target.category === 'Pantalones') {
        // combine with superior and shoes and coat
        const superiors = prendas.filter(p => (p.category === 'Poleras' || p.category === 'Camisas') && (p.isFavorite || Math.random() > 0.5)).slice(0, 2);
        const shoes = prendas.filter(p => p.category === 'Zapatos').slice(0, 1);
        const abrigos = prendas.filter(p => p.category === 'Abrigos/Chaquetas' && p.season === 'Todo el año').slice(0, 1);
        complementos = [...superiors, ...shoes, ...abrigos];
        
        return {
          response: `El pantalón **${target.name}** (${target.color}) queda increíble para el estilo Soft Boy si lo combinas con tonos tierra o pastel. Te recomiendo llevarlo con una prenda superior relajada como **${superiors.map(s => s.name).join('** o **')}**, unas zapatillas **${shoes[0]?.name || 'blancas'}**, y si hace fresco, puedes agregar la chaqueta **${abrigos[0]?.name || 'Beige'}**. ¡Así lograrás una vibra minimalista muy limpia!`,
          suggestedPrendas: [target, ...complementos]
        };
      } else if (target.category === 'Poleras' || target.category === 'Camisas') {
        const pants = prendas.filter(p => p.category === 'Pantalones' && (p.color === 'beige' || p.color === 'negro' || p.color === 'azul claro')).slice(0, 2);
        const shoes = prendas.filter(p => p.category === 'Zapatos').slice(0, 1);
        const bags = prendas.filter(p => p.category === 'Bolsas' && p.id !== 'bolsa-3').slice(0, 1);
        complementos = [...pants, ...shoes, ...bags];

        return {
          response: `La parte superior **${target.name}** tiene un tono genial. En la estética Soft Boy, las capas son de vital importancia. Puedes usarla debajo de una sobrecamisa o un polerón abierto kaki. Para combinarla, te sugiero excelente contraste con **${pants.map(p => p.name).join('** o **')}**, calzado minimalista como **${shoes[0]?.name || 'Zapatos beige'}**, y llevar una **${bags[0]?.name || 'Tote Bag'}** para cerrar el conjunto ideal. El balance es clave.`,
          suggestedPrendas: [target, ...complementos]
        };
      } else if (target.category === 'Zapatos') {
        const pants = prendas.filter(p => p.category === 'Pantalones').slice(0, 2);
        const superiors = prendas.filter(p => p.category === 'Poleras').slice(0, 1);
        complementos = [...pants, ...superiors];

        return {
          response: `Tus **${target.name}** son una base limpia y estética. Para dar ese look casual 'soft', combínalos con **${pants[0]?.name || 'Pantalón de vestir beige'}** (dobladillo sutil arriba del tobillo) y una polera neutra como **${superiors[0]?.name || 'Polera estampada beige'}**. ¡Queda muy cómodo y sofisticado!`,
          suggestedPrendas: [target, ...complementos]
        };
      } else {
        const superiors = prendas.filter(p => p.category === 'Poleras').slice(0, 1);
        const pants = prendas.filter(p => p.category === 'Pantalones').slice(0, 1);
        complementos = [...superiors, ...pants];

        return {
          response: `El complemento **${target.name}** es excelente para añadir textura. Úsalo como capa final sobre una combinación limpia: **${superiors[0]?.name || 'Polera blanca'}** y **${pants[0]?.name || 'Jeans azul claro'}**. Te verás estructurado pero muy cómodo.`,
          suggestedPrendas: [target, ...complementos]
        };
      }
    } else {
      return {
        response: `No he encontrado esa prenda en tu armario. ¡Asegúrate de escribir bien el nombre! Puedes buscar prendas del armario como 'Polera lisa rosa', 'Pantalón de vestir beige' o 'Zapatos blancos solos' para decirte cómo combinarlos en el look Soft Boy.`
      };
    }
  }

  // 2. Clima / Tiempo
  if (input.includes('clima') || input.includes('tiempo') || input.includes('temperatura') || input.includes('frío') || input.includes('frio') || input.includes('lluvia') || input.includes('llueva') || input.includes('calor') || input.includes('templado')) {
    if (input.includes('frío') || input.includes('frio')) {
      const invPrendas = prendas.filter(p => p.season === 'Invierno' || p.season === 'Otoño/Invierno').slice(0, 3);
      const superiors = prendas.filter(p => p.category === 'Poleras' && p.color === 'negro');
      return {
        response: `🥶 **Recomendación para Clima Frío (Vibe Soft Boy Cómodo):**\n\nEl secreto está en las múltiples capas (*layering*). Usa prendas tejidas, abrigos neutrales y bufandas.\n\n**Propuesta:**\n- Base acolchada: **Polera lisa negro** o una camisa manga larga.\n- Capa térmica: **${invPrendas.find(p => p.name.includes('Poleron'))?.name || 'Poleron café'}** para aislar.\n- Capa exterior: Un majestuoso **${invPrendas.find(p => p.name.includes('Abrigo'))?.name || 'Abrigo gris oscuro'}**.\n- Accesorios: **Bufanda negra o azul oscuro**.\n\nEsto te mantendrá calientito sin perder el estilo sofisticado y acogedor de la subcultura Soft Boy.`,
        suggestedPrendas: prendas.filter(p => ['polera-6', 'abrigo-6', 'abrigo-2', 'accesorio-3'].includes(p.id))
      };
    } else if (input.includes('lluvia') || input.includes('llueva')) {
      return {
        response: `🌧️ **Recomendación para Clima de Lluvia:**\n\nEn días lluviosos debes protegerte pero lucir minimalista. Prioriza abrigos oscuros estructurados y calzado seguro.\n\n**Opciones de tu armario:**\n- Superior: **Camisa cuadros negros manga larga** (abrigadora y rústica).\n- Pierna: **Jeans negros 1** (disimulan cualquier salpicadura).\n- Encima: **Chaqueta genérica con algodón** o **Chaqueta cuero negro**.\n- Pies: **Zapatos negros**. Evitemos colores claros para no mancharlos.`,
        suggestedPrendas: prendas.filter(p => ['camisa-3', 'pantalon-1', 'abrigo-10', 'zapato-1'].includes(p.id))
      };
    } else if (input.includes('calor')) {
      return {
        response: `☀️ **Recomendación para Calor Extremo:**\n\n¡Menos es más! Opta por telas ligeras, colores pasteles y prendas de siluetas amplias para mantener la frescura de la estética.\n\n**Selección fresca del clóset:**\n- Parte superior: **Polera lisa azul claro** o **Polera lisa verde claro** (colores que rebotan el sol).\n- Pantalones: **Jeans azul claro** o **Pantalón de vestir beige**.\n- Calzado: **Zapatos blancos solos** o **Zapatos beige**.\n- Evita chaquetas y bufandas. ¡Una simple **Tote Bag** es perfecta para refrescar el look!`,
        suggestedPrendas: prendas.filter(p => ['polera-2', 'pantalon-9', 'zapato-4', 'bolsa-1'].includes(p.id))
      };
    } else { // templado / primavera
      return {
        response: `🍂 **Recomendación para Clima Templado:**\n\nIdeal para explotar al máximo el estilo Soft Boy con una chaqueta o camisa abierta sobre una polera ligera básica.\n\n**Look equilibrado:**\n- Base: **Polera estampada beige**.\n- Encima: **Chaqueta de jean azul** o un polerón ligero.\n- Pantalón: **Pantalón de vestir beige** para ese porte preppy relajado.\n- Calzado: **Zapatos blancos con azul** o **Zapatos de lona**.\n\nSe siente ligero pero excelentemente peinado.`,
        suggestedPrendas: prendas.filter(p => ['polera-11', 'abrigo-7', 'pantalon-9', 'zapato-3'].includes(p.id))
      };
    }
  }

  // 3. Ocasiones
  if (input.includes('cita') || input.includes('cita romántica') || input.includes('romantica')) {
    return {
      response: `✨ **Outift ideal para una Cita Romántica:**\n\nQuieres verte bien estructurado, detallista y educado. El estilo preppy-soft funciona de maravilla.\n\n**Tu propuesta estrella:**\n- **Camisa blanca** metida por dentro, de manera holgada.\n- **Pantalón de vestir beige o negro** con un bonito cinturón beige.\n- **Chaqueta beige** para dar textura.\n- **Zapatos beige** para un look monocromático suave de ensueño, o **Zapatos negros** para marcar contraste.\n\n¡Un look que transmite calidez, confianza y pulcritud!`,
      suggestedPrendas: prendas.filter(p => ['camisa-1', 'pantalon-9', 'abrigo-9', 'zapato-6'].includes(p.id))
    };
  }

  if (input.includes('universidad') || input.includes('clase') || input.includes('estudiar') || input.includes('colegio')) {
    return {
      response: `📚 **Outfit académico para Universidad/Clases:**\n\nEstilo cómodo para largas horas de estudio pero con una vibra retro-intelectual muy Soft Boy.\n\n**Tu combinación universitaria:**\n- **Polera lisa verde claro** o **Polera lisa café claro**.\n- **Abrigo universitario blanco con negro** (¡la prenda perfecta para el campus!).\n- **Jeans gris claro** o **Jeans azul claro**.\n- **Zapatos negros vans** (súper cómodos) y una **Tote Bag** para cargar tus cuadernos.`,
      suggestedPrendas: prendas.filter(p => ['polera-7', 'abrigo-5', 'pantalon-4', 'zapato-2', 'bolsa-1'].includes(p.id))
    };
  }

  if (input.includes('trabajo') || input.includes('oficina') || input.includes('reunión') || input.includes('entrevista')) {
    return {
      response: `💼 **Outfit Casual-Smart para Trabajo/Oficina:**\n\nPara el ámbito profesional, rebajamos la holgura exagerada y aumentamos la estructura formal manteniendo la calidez cromática.\n\n**Selección:**\n- **Camisa azul manga larga** o **Camisa blanca**.\n- **Pantalón de vestir negro**.\n- **Abrigo gris claro** de corte limpio y estilizado.\n- **Zapatos negros** de cuero.\n- **Bandolera** de cuero o lona.\n\nProfesional, estético e impecable.`,
      suggestedPrendas: prendas.filter(p => ['camisa-5', 'pantalon-8', 'abrigo-1', 'zapato-1', 'bolsa-2'].includes(p.id))
    };
  }

  if (input.includes('noche') || input.includes('fiesta') || input.includes('salir con amigos') || input.includes('bar')) {
    return {
      response: `🌙 **Estilo Soft Boy Nocturno:**\n\nDe noche buscamos un poco más de misterio. Los colores como el negro, vino, gris oscuro y el cuero son perfectos.\n\n**Combinación nocturna:**\n- **Camisa vino manga larga** para una chispa de color elegante.\n- **Chaqueta cuero negro** (aporta masculinidad y textura urbana).\n- **Jeans negros 1**.\n- **Zapatos negros** o botas negras.\n\nMuy atractivo y a la moda.`,
      suggestedPrendas: prendas.filter(p => ['camisa-4', 'abrigo-8', 'pantalon-1', 'zapato-1'].includes(p.id))
    };
  }

  if (input.includes('casual') || input.includes('diario') || input.includes('domingo')) {
    return {
      response: `☕ **Outfit Diario / Casual:**\n\nCómodo y relajado, ideal para ir a una cafetería, un paseo por el parque o simplemente descansar.\n\n**Opción recomendada:**\n- **Polera estampada beige** (estética retro).\n- **Jeans azul oscuro recto**.\n- **Poleron abierto beige kaki** como abrigo acogedor.\n- **Zapatos blancos con negro** y una **Tote Bag** clásica.\n\nSimple pero sumamente armónico.`,
      suggestedPrendas: prendas.filter(p => ['polera-11', 'pantalon-7', 'abrigo-12', 'zapato-5', 'bolsa-1'].includes(p.id))
    };
  }

  // 4. Consejos estilomax genéricos
  if (input.includes('consejo') || input.includes('tip') || input.includes('truco') || input.includes('estilo') || input.includes('soft boy') || input.includes('softboy') || input.includes(currentAesthetic.toLowerCase())) {
    return {
      response: `🌻 **Los pilares esenciales del estilo "${currentAesthetic}":**\n\n1. **Paletas e Identidad:** Refleja la vibra de la estética **${currentAesthetic}** con cortes coordinados y siluetas características de este estilo en tendencia mundial.\n\n2. **Capas y Texturas:** Las sobrecamisas, abrigos sueltos y combinaciones de texturas son clave para dar profundidad a este corte.\n\n3. **Uso de Accesorios:** Completa el conjunto con calzado que mantenga el balance visual de la estética.\n\n¿Quieres que arme un outfit especial basados en estos consejos? Pídemelo.`
    };
  }

  // Fallback simpático
  return {
    response: `👋 ¡Hola! Soy tu asistente de moda **${currentAesthetic}**. Puedo ayudarte con consejos especializados, sugerencias según el clima o combinaciones de tu armario real adaptados a esta estética.\n\n*Prueba preguntándome:*\n- *"¿Qué combina con Jeans azul claro?"*\n- *"¿Qué me pongo para salir?"*\n- *"Outfit perfecto en estilo ${currentAesthetic}"*`
  };
}
