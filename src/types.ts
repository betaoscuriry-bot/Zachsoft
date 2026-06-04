export interface Prenda {
  id: string;
  name: string;
  category: 'Poleras' | 'Pantalones' | 'Zapatos' | 'Abrigos/Chaquetas' | 'Camisas' | 'Accesorios' | 'Bolsas';
  color: string;
  season: 'Todo el año' | 'Invierno' | 'Otoño/Primavera' | 'Otoño/Invierno' | 'N/A';
  isFavorite?: boolean;
  customTags?: string[]; // e.g. ["favorito", "solo formal", "solo casa"]
  timesUsed?: number;    // usage count
  inLaundry?: boolean;   // laundry/dirty state
  lastUsedDate?: string; // rotation tracker (YYYY-MM-DD)
  addedDate?: string;    // date added to closet (YYYY-MM-DD)
}

export interface Outfit {
  superior: Prenda; // can be from Poleras or Camisas
  pantalones: Prenda; // from Pantalones
  zapatos: Prenda; // from Zapatos
  abrigo?: Prenda | null; // from Abrigos/Chaquetas (optional)
  accesorio?: Prenda | null; // from Accesorios (optional)
  bolsa?: Prenda | null; // from Bolsas (optional)
}

export interface SemanalPlan {
  // Key represents day of week index or name: 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  Lunes?: Outfit | null;
  Martes?: Outfit | null;
  Miércoles?: Outfit | null;
  Jueves?: Outfit | null;
  Viernes?: Outfit | null;
  Sábado?: Outfit | null;
  Domingo?: Outfit | null;
}

export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface CalendarioOutfits {
  // Key represents YYYY-MM-DD
  [key: string]: Outfit;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  image?: string;
  providerUsed?: string;
  responseTime?: number;
}

export interface AppStateExport {
  prendas: Prenda[];
  calendario: CalendarioOutfits;
  semanal: SemanalPlan;
  favoritos: string[]; // list of garment IDs
  historial: Outfit[]; // last 7 outfits generated
}

export interface FuenteCargada {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  addedDate: string;
  analysisText: string;
  styleVibe: string;
  extractedPrendas?: Omit<Prenda, 'id'>[];
  sourceUrl?: string; // base64 payload to read/display thumbnail
}

export interface SoftBoyTheme {
  id: string;
  name: string;
  description: string;
  className: string; // for root wrapper styling
  bg: string;
  bgCard: string;
  text: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  borderColor: string;
  isUnlocked: boolean;
  cost: number;
}

