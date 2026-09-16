import type { LevelDefinition } from '../../../types/gameplay';

/*** Define the ordered Palabichos level catalog. */
export const GAME_LEVELS = [
  {
    id: 'animals-1',
    number: 1,
    title: 'ANIMALES',
    targetCategory: 'animals',
    targetCount: 20,
    initialCreatures: [
      creature('creature-gato', 'gato', 'gato', 'animals', 18, 25, 'mint', 'bob', -1.2, 5.8),
      creature('creature-mesa', 'mesa', 'mesa', 'home', 57, 19, 'berry', 'sway', -2.1, 7.2),
      creature('creature-perro', 'perro', 'perro', 'animals', 79, 34, 'sun', 'drift', -0.8, 6.7),
      creature(
        'creature-caballo',
        'caballo',
        'caballo',
        'animals',
        31,
        49,
        'lavender',
        'drift',
        -3.4,
        7.6,
      ),
      creature('creature-coche', 'coche', 'coche', 'transport', 68, 55, 'mint', 'bob', -2.8, 6.1),
      creature(
        'creature-pajaro',
        'pajaro',
        'pájaro',
        'animals',
        43,
        67,
        'berry',
        'sway',
        -1.7,
        7.9,
      ),
    ],
    respawnCreatures: [
      creature('spawn-conejo', 'conejo', 'conejo', 'animals', 22, 31, 'lavender', 'bob', -1.1, 6.8),
      creature('spawn-silla', 'silla', 'silla', 'home', 72, 24, 'sun', 'sway', -2.2, 7.4),
      creature('spawn-pez', 'pez', 'pez', 'animals', 48, 42, 'mint', 'drift', -0.7, 6.2),
      creature('spawn-pan', 'pan', 'pan', 'food', 81, 52, 'berry', 'bob', -1.8, 5.9),
      creature('spawn-tortuga', 'tortuga', 'tortuga', 'animals', 29, 58, 'sun', 'sway', -3, 8.1),
      creature('spawn-tren', 'tren', 'tren', 'transport', 59, 63, 'lavender', 'drift', -2.5, 7),
      creature('spawn-vaca', 'vaca', 'vaca', 'animals', 16, 47, 'berry', 'sway', -1.4, 7.7),
      creature('spawn-queso', 'queso', 'queso', 'food', 77, 38, 'mint', 'bob', -2.6, 6.4),
      creature('spawn-pato', 'pato', 'pato', 'animals', 39, 27, 'sun', 'drift', -0.9, 6.9),
      creature(
        'spawn-ventana',
        'ventana',
        'ventana',
        'home',
        64,
        48,
        'lavender',
        'sway',
        -1.9,
        7.5,
      ),
    ],
  },
  {
    id: 'food-1',
    number: 2,
    title: 'COMIDA',
    targetCategory: 'food',
    targetCount: 20,
    initialCreatures: [
      creature('creature-pan', 'pan', 'pan', 'food', 20, 26, 'sun', 'bob', -1.1, 6.1),
      creature('creature-perro-2', 'perro', 'perro', 'animals', 58, 20, 'mint', 'sway', -2.2, 7.2),
      creature('creature-queso', 'queso', 'queso', 'food', 78, 35, 'berry', 'drift', -0.7, 6.8),
      creature(
        'creature-manzana',
        'manzana',
        'manzana',
        'food',
        32,
        50,
        'lavender',
        'drift',
        -3.1,
        7.5,
      ),
      creature('creature-silla-2', 'silla', 'silla', 'home', 68, 56, 'sun', 'bob', -2.6, 6.2),
      creature('creature-arroz', 'arroz', 'arroz', 'food', 43, 67, 'mint', 'sway', -1.5, 7.8),
    ],
    respawnCreatures: [
      creature('spawn-sopa', 'sopa', 'sopa', 'food', 22, 31, 'berry', 'bob', -1, 6.6),
      creature(
        'spawn-coche-2',
        'coche',
        'coche',
        'transport',
        73,
        24,
        'lavender',
        'sway',
        -2.2,
        7.2,
      ),
      creature('spawn-huevo', 'huevo', 'huevo', 'food', 48, 42, 'sun', 'drift', -0.8, 6.3),
      creature('spawn-gato-2', 'gato', 'gato', 'animals', 81, 52, 'mint', 'bob', -1.7, 6),
      creature('spawn-leche', 'leche', 'leche', 'food', 29, 58, 'lavender', 'sway', -2.8, 7.9),
      creature('spawn-mesa-2', 'mesa', 'mesa', 'home', 59, 63, 'berry', 'drift', -2.4, 7),
      creature('spawn-pasta', 'pasta', 'pasta', 'food', 16, 47, 'mint', 'sway', -1.3, 7.4),
      creature('spawn-tren-2', 'tren', 'tren', 'transport', 77, 38, 'sun', 'bob', -2.5, 6.5),
      creature('spawn-fruta', 'fruta', 'fruta', 'food', 39, 27, 'berry', 'drift', -0.9, 6.7),
      creature('spawn-puerta', 'puerta', 'puerta', 'home', 64, 48, 'lavender', 'sway', -1.8, 7.3),
    ],
  },
] as const satisfies readonly LevelDefinition[];

/*** Build one immutable creature seed for compact level content declarations. */
function creature(
  id: string,
  wordId: string,
  text: string,
  category: 'animals' | 'food' | 'home' | 'transport',
  xPercent: number,
  yPercent: number,
  variant: 'berry' | 'mint' | 'sun' | 'lavender',
  motion: 'bob' | 'drift' | 'sway',
  animationDelaySeconds: number,
  animationDurationSeconds: number,
) {
  return {
    id,
    word: {
      id: wordId,
      text,
      translation: translationForWord(wordId),
      categories: [category],
    },
    xPercent,
    yPercent,
    variant,
    motion,
    animationDelaySeconds,
    animationDurationSeconds,
  } as const;
}

/*** Resolve the first half of German learning translations in the current level catalog. */
function translationForWord(wordId: string) {
  switch (wordId) {
    case 'gato':
      return 'Katze';
    case 'mesa':
      return 'Tisch';
    case 'perro':
      return 'Hund';
    case 'caballo':
      return 'Pferd';
    case 'coche':
      return 'Auto';
    case 'pajaro':
      return 'Vogel';
    case 'conejo':
      return 'Kaninchen';
    case 'silla':
      return 'Stuhl';
    case 'pez':
      return 'Fisch';
    case 'pan':
      return 'Brot';
    case 'tortuga':
      return 'Schildkröte';
    case 'tren':
      return 'Zug';
    default:
      return translationForWordFallback(wordId);
  }
}

/*** Resolve the remaining German learning translations in the current level catalog. */
function translationForWordFallback(wordId: string) {
  switch (wordId) {
    case 'vaca':
      return 'Kuh';
    case 'queso':
      return 'Käse';
    case 'pato':
      return 'Ente';
    case 'ventana':
      return 'Fenster';
    case 'manzana':
      return 'Apfel';
    case 'arroz':
      return 'Reis';
    case 'sopa':
      return 'Suppe';
    case 'huevo':
      return 'Ei';
    case 'leche':
      return 'Milch';
    case 'pasta':
      return 'Nudeln';
    case 'fruta':
      return 'Obst';
    case 'puerta':
      return 'Tür';
    default:
      throw new Error(`Missing German translation for ${wordId}.`);
  }
}
