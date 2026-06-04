import { Prenda } from './types';

export const INITIAL_PRENDAS: Prenda[] = [
  // --- POLERAS ---
  { id: 'polera-1', name: 'Polera lisa rosa', category: 'Poleras', color: 'rosa', season: 'Todo el año', isFavorite: false },
  { id: 'polera-2', name: 'Polera lisa azul claro', category: 'Poleras', color: 'azul claro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-3', name: 'Polera lisa verde oscuro', category: 'Poleras', color: 'verde oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-4', name: 'Polera lisa verde claro', category: 'Poleras', color: 'verde claro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-5', name: 'Polera lisa café', category: 'Poleras', color: 'café', season: 'Todo el año', isFavorite: false },
  { id: 'polera-6', name: 'Polera lisa negro', category: 'Poleras', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-7', name: 'Polera lisa café claro', category: 'Poleras', color: 'café claro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-8', name: 'Polera lisa verde', category: 'Poleras', color: 'verde', season: 'Todo el año', isFavorite: false },
  { id: 'polera-9', name: 'Polera lisa azul oscuro', category: 'Poleras', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-10', name: 'Polera lisa blanca', category: 'Poleras', color: 'blanca', season: 'Todo el año', isFavorite: false },
  { id: 'polera-11', name: 'Polera estampada beige', category: 'Poleras', color: 'beige', season: 'Todo el año', isFavorite: false },
  { id: 'polera-12', name: 'Polera estampada negro', category: 'Poleras', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-13', name: 'Polera estampada azul oscuro', category: 'Poleras', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'polera-14', name: 'Polera estampada blanco', category: 'Poleras', color: 'blanco', season: 'Todo el año', isFavorite: false },
  { id: 'polera-15', name: 'Polera estampada gris', category: 'Poleras', color: 'gris', season: 'Todo el año', isFavorite: false },
  { id: 'polera-16', name: 'Polera estampada vino', category: 'Poleras', color: 'vino', season: 'Todo el año', isFavorite: false },
  { id: 'polera-17', name: 'Polera estampada verde', category: 'Poleras', color: 'verde', season: 'Todo el año', isFavorite: false },

  // --- PANTALONES ---
  { id: 'pantalon-1', name: 'Jeans negros 1', category: 'Pantalones', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-2', name: 'Jeans negros 2', category: 'Pantalones', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-3', name: 'Jeans negros 3', category: 'Pantalones', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-4', name: 'Jeans gris claro', category: 'Pantalones', color: 'gris claro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-5', name: 'Jeans azul claro', category: 'Pantalones', color: 'azul claro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-6', name: 'Jeans azul oscuro', category: 'Pantalones', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-7', name: 'Jeans azul oscuro recto', category: 'Pantalones', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-8', name: 'Pantalón de vestir negro', category: 'Pantalones', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'pantalon-9', name: 'Pantalón de vestir beige', category: 'Pantalones', color: 'beige', season: 'Todo el año', isFavorite: false },

  // --- ZAPATOS ---
  { id: 'zapato-1', name: 'Zapatos negros', category: 'Zapatos', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'zapato-2', name: 'Zapatos negros vans', category: 'Zapatos', color: 'negro', season: 'Todo el año', isFavorite: false },
  { id: 'zapato-3', name: 'Zapatos blancos con azul', category: 'Zapatos', color: 'blancos/azul', season: 'Todo el año', isFavorite: false },
  { id: 'zapato-4', name: 'Zapatos blancos solos', category: 'Zapatos', color: 'blancos', season: 'Todo el año', isFavorite: false },
  { id: 'zapato-5', name: 'Zapatos blancos con negro', category: 'Zapatos', color: 'blancos/negro', season: 'Todo el año', isFavorite: false },
  { id: 'zapato-6', name: 'Zapatos beige', category: 'Zapatos', color: 'beige', season: 'Todo el año', isFavorite: false },

  // --- ABRIGOS Y CHAQUETAS ---
  { id: 'abrigo-1', name: 'Abrigo gris claro', category: 'Abrigos/Chaquetas', color: 'gris claro', season: 'Invierno', isFavorite: false },
  { id: 'abrigo-2', name: 'Abrigo gris oscuro', category: 'Abrigos/Chaquetas', color: 'gris oscuro', season: 'Invierno', isFavorite: false },
  { id: 'abrigo-3', name: 'Abrigo delgado azul oscuro', category: 'Abrigos/Chaquetas', color: 'azul oscuro', season: 'Otoño/Primavera', isFavorite: false },
  { id: 'abrigo-4', name: 'Abrigo delgado verde oscuro', category: 'Abrigos/Chaquetas', color: 'verde oscuro', season: 'Otoño/Primavera', isFavorite: false },
  { id: 'abrigo-5', name: 'Abrigo universitario blanco con negro', category: 'Abrigos/Chaquetas', color: 'blanco/negro', season: 'Todo el año', isFavorite: false },
  { id: 'abrigo-6', name: 'Poleron café', category: 'Abrigos/Chaquetas', color: 'café', season: 'Otoño/Invierno', isFavorite: false },
  { id: 'abrigo-7', name: 'Chaqueta de jean azul', category: 'Abrigos/Chaquetas', color: 'azul', season: 'Otoño/Primavera', isFavorite: false },
  { id: 'abrigo-8', name: 'Chaqueta cuero negro', category: 'Abrigos/Chaquetas', color: 'negro', season: 'Invierno', isFavorite: false },
  { id: 'abrigo-9', name: 'Chaqueta beige', category: 'Abrigos/Chaquetas', color: 'beige', season: 'Otoño/Primavera', isFavorite: false },
  { id: 'abrigo-10', name: 'Chaqueta genérica con algodón', category: 'Abrigos/Chaquetas', color: 'negro', season: 'Invierno', isFavorite: false },
  { id: 'abrigo-11', name: 'Poleron azul oscuro cerrado', category: 'Abrigos/Chaquetas', color: 'azul oscuro', season: 'Otoño/Invierno', isFavorite: false },
  { id: 'abrigo-12', name: 'Poleron abierto beige kaki', category: 'Abrigos/Chaquetas', color: 'beige', season: 'Otoño/Invierno', isFavorite: false },
  { id: 'abrigo-13', name: 'Buzo verde', category: 'Abrigos/Chaquetas', color: 'verde', season: 'Otoño/Invierno', isFavorite: false },

  // --- CAMISAS ---
  { id: 'camisa-1', name: 'Camisa blanca', category: 'Camisas', color: 'blanco', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-2', name: 'Camisa cuadros azul manga larga', category: 'Camisas', color: 'cuadros azul', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-3', name: 'Camisa cuadros negros manga larga', category: 'Camisas', color: 'cuadros negros', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-4', name: 'Camisa vino manga larga', category: 'Camisas', color: 'vino', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-5', name: 'Camisa azul manga larga', category: 'Camisas', color: 'azul', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-6', name: 'Camisa azul oscuro manga larga', category: 'Camisas', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },
  { id: 'camisa-7', name: 'Camisa azul oscuro manga corta', category: 'Camisas', color: 'azul oscuro', season: 'Todo el año', isFavorite: false },

  // --- ACCESORIOS ---
  { id: 'accesorio-1', name: 'Bufanda azul oscuro', category: 'Accesorios', color: 'azul oscuro', season: 'Invierno', isFavorite: false },
  { id: 'accesorio-2', name: 'Bufanda blanca', category: 'Accesorios', color: 'blanco', season: 'Invierno', isFavorite: false },
  { id: 'accesorio-3', name: 'Bufanda negra', category: 'Accesorios', color: 'negro', season: 'Invierno', isFavorite: false },
  { id: 'accesorio-4', name: 'Sin bufanda', category: 'Accesorios', color: 'N/A', season: 'Todo el año', isFavorite: false },

  // --- BOLSAS ---
  { id: 'bolsa-1', name: 'Tote Bag', category: 'Bolsas', color: 'N/A', season: 'Todo el año', isFavorite: false },
  { id: 'bolsa-2', name: 'Bandolera', category: 'Bolsas', color: 'N/A', season: 'Todo el año', isFavorite: false },
  { id: 'bolsa-3', name: 'Sin bolsa', category: 'Bolsas', color: 'N/A', season: 'Todo el año', isFavorite: false }
];

export const SOFT_BOY_PALETTE = {
  bg: '#fef9ef',         // Fondo principal
  secondary: '#e8dccc',  // Fondo secundario / Tarjetas
  accent: '#d4b896',     // Detalles táctiles/bordes elegantes
  darkAccent: '#a67c52', // Botones, acciones e iconos principales
  border: '#c4b5a5'      // Separadores finos / bordes transparentes
};

export const COLOR_CLASSES_MAP: { [key: string]: string } = {
  'rosa': '#fbcfe8',
  'azul claro': '#bae6fd',
  'verde oscuro': '#14532d',
  'verde claro': '#bbf7d0',
  'café': '#78350f',
  'negro': '#111827',
  'café claro': '#d97706',
  'verde': '#22c55e',
  'azul oscuro': '#1e3a8a',
  'blanca': '#ffffff',
  'blanco': '#ffffff',
  'beige': '#f5f5dc',
  'gris': '#9ca3af',
  'vino': '#7f1d1d',
  'gris claro': '#e5e7eb',
  'gris oscuro': '#4b5563',
  'blancos/azul': 'linear-gradient(135deg, white 50%, #1d4ed8 50%)',
  'blancos': '#f3f4f6',
  'blancos/negro': 'linear-gradient(135deg, white 50%, black 50%)',
  'cuadros azul': 'repeating-conic-gradient(#3b82f6 0% 25%, #60a5fa 0% 50%) 50% / 20px 20px',
  'cuadros negros': 'repeating-conic-gradient(#1f2937 0% 25%, #4b5563 0% 50%) 50% / 20px 20px',
  'azul': '#3b82f6',
  'blanco/negro': 'linear-gradient(135deg, white 50%, black 50%)',
  'N/A': '#e2e8f0'
};

import { SoftBoyTheme } from './types';

export const SYSTEM_THEMES: SoftBoyTheme[] = [
  {
    id: 'original',
    name: 'Vainilla y Café',
    description: 'La paleta original acogedora de cremas, vainillas, beige y marrones cálidos.',
    className: 'theme-vanilla',
    bg: '#fef9ef',
    bgCard: '#fcf7ee',
    text: '#2d221c',
    textMuted: '#7c6455',
    accent: '#a67c52',
    accentLight: '#e8dccc',
    borderColor: '#c4b5a5',
    isUnlocked: true,
    cost: 0
  },
  {
    id: 'matcha',
    name: 'Té Matcha y Kaki',
    description: 'Frescos y relajantes verdes salvia combinados con tonos tierra pastel mullidos.',
    className: 'theme-matcha',
    bg: '#f1f5f0',
    bgCard: '#e6ede4',
    text: '#22301c',
    textMuted: '#5a6e52',
    accent: '#5a6f54',
    accentLight: '#ccd9c5',
    borderColor: '#bacaba',
    isUnlocked: false,
    cost: 120
  },
  {
    id: 'lavender',
    name: 'Lavanda y Neblina',
    description: 'Estilo místico preppy retro con tonos lavanda tiernos, gris neblina y místico preppy.',
    className: 'theme-lavender',
    bg: '#f7f4f9',
    bgCard: '#efeaf3',
    text: '#251a2e',
    textMuted: '#675874',
    accent: '#8e7a9c',
    accentLight: '#d6cbd3',
    borderColor: '#bfb0c0',
    isUnlocked: false,
    cost: 200
  },
  {
    id: 'peach',
    name: 'Durazno y Arcilla',
    description: 'Calidez nostálgica bento con bases de melocotón claro y acentos de terracota retro.',
    className: 'theme-peach',
    bg: '#fdf7f2',
    bgCard: '#f9eee4',
    text: '#3c231a',
    textMuted: '#8b6555',
    accent: '#c28974',
    accentLight: '#ecd8cf',
    borderColor: '#dfbeae',
    isUnlocked: false,
    cost: 350
  },
  {
    id: 'sky',
    name: 'Azul Pastel y Arena',
    description: 'Inspiración fresca marina preppy con azul cielo suave y arena tostada.',
    className: 'theme-sky',
    bg: '#f2f6fa',
    bgCard: '#e5edf5',
    text: '#1a273c',
    textMuted: '#586b86',
    accent: '#60809a',
    accentLight: '#decbb7',
    borderColor: '#baccda',
    isUnlocked: false,
    cost: 500
  }
];

