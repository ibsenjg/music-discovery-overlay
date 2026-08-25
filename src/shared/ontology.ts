import type { Locale, TraitCategory, TraitGroup } from './types';

export interface OntologyChip {
  id: string;
  category: TraitCategory;
  value: string;
  label: Record<Locale, string>;
}

export interface OntologySection {
  id: string;
  label: Record<Locale, string>;
  chips: OntologyChip[];
}

function chips(
  values: Array<[string, TraitCategory, string, string, string]>,
): OntologyChip[] {
  return values.map(([id, category, value, en, es]) => ({
    id,
    category,
    value,
    label: { en, es },
  }));
}

export const ONTOLOGY_SECTIONS: OntologySection[] = [
  {
    id: 'instruments',
    label: { en: 'Instruments', es: 'Instrumentos' },
    chips: chips([
      ['piano', 'instrument', 'piano', 'Piano', 'Piano'],
      ['bass', 'instrument', 'bass', 'Bass', 'Bajo'],
      ['double-bass', 'instrument', 'double bass', 'Double bass', 'Contrabajo'],
      ['trumpet', 'instrument', 'trumpet', 'Trumpet', 'Trompeta'],
      ['violin', 'instrument', 'violin', 'Violin', 'Violín'],
      ['guitar', 'instrument', 'guitar', 'Guitar', 'Guitarra'],
      ['saxophone', 'instrument', 'saxophone', 'Saxophone', 'Saxofón'],
      ['drums', 'instrument', 'drums', 'Drums', 'Batería'],
      ['percussion', 'instrument', 'percussion', 'Percussion', 'Percusión'],
      ['cello', 'instrument', 'cello', 'Cello', 'Violonchelo'],
      ['flute', 'instrument', 'flute', 'Flute', 'Flauta'],
      ['synth', 'instrument', 'synthesizer', 'Synthesizer', 'Sintetizador'],
    ]),
  },
  {
    id: 'musical-roles',
    label: { en: 'Musical roles', es: 'Funciones musicales' },
    chips: chips([
      [
        'melody-led',
        'melodic-function',
        'melody-led',
        'Melody-led',
        'Melodía protagonista',
      ],
      [
        'interlocking-melodies',
        'melodic-function',
        'interlocking melodies',
        'Interlocking melodies',
        'Melodías entrelazadas',
      ],
      [
        'counterpoint',
        'melodic-function',
        'counterpoint',
        'Counterpoint',
        'Contrapunto',
      ],
      ['minor', 'harmony', 'minor key', 'Minor key', 'Tonalidad menor'],
      ['modal', 'harmony', 'modal harmony', 'Modal', 'Armonía modal'],
      [
        'jazz-chords',
        'harmony',
        'jazz chords',
        'Jazz chords',
        'Acordes de jazz',
      ],
      ['groove', 'rhythm', 'strong groove', 'Strong groove', 'Groove marcado'],
      ['syncopated', 'rhythm', 'syncopated rhythm', 'Syncopated', 'Sincopado'],
      ['polyrhythm', 'rhythm', 'polyrhythm', 'Polyrhythm', 'Polirritmia'],
    ]),
  },
  {
    id: 'ensemble-and-voice',
    label: { en: 'Ensemble and voice', es: 'Conjunto y voz' },
    chips: chips([
      ['duo', 'ensemble', 'duo', 'Duo', 'Dúo'],
      ['trio', 'ensemble', 'trio', 'Trio', 'Trío'],
      ['quartet', 'ensemble', 'quartet', 'Quartet', 'Cuarteto'],
      ['orchestra', 'ensemble', 'orchestra', 'Orchestra', 'Orquesta'],
      [
        'instrumental',
        'vocal-style',
        'instrumental',
        'Instrumental',
        'Instrumental',
      ],
      ['choir', 'vocal-style', 'choir', 'Choir', 'Coro'],
      [
        'lead-vocal',
        'vocal-style',
        'lead vocal',
        'Lead vocal',
        'Voz principal',
      ],
      [
        'wordless-vocal',
        'vocal-style',
        'wordless vocal',
        'Wordless vocal',
        'Voz sin palabras',
      ],
    ]),
  },
  {
    id: 'sound',
    label: {
      en: 'Tuning, tones and production',
      es: 'Afinación, tonos y producción',
    },
    chips: chips([
      [
        '415hz',
        'tuning',
        'A4=415 Hz tuning',
        '415 Hz · Baroque tuning',
        '415 Hz · Afinación barroca',
      ],
      [
        '430hz',
        'tuning',
        'A4=430 Hz tuning',
        '430 Hz · Classical tuning',
        '430 Hz · Afinación clásica',
      ],
      [
        '432hz',
        'tuning',
        'A4=432 Hz tuning',
        '432 Hz · Alt tuning',
        '432 Hz · Afinación alternativa',
      ],
      [
        '440hz',
        'tuning',
        'A4=440 Hz tuning',
        '440 Hz · Standard tuning',
        '440 Hz · Afinación estándar',
      ],
      [
        '442hz',
        'tuning',
        'A4=442 Hz tuning',
        '442 Hz · Orchestral tuning',
        '442 Hz · Afinación orquestal',
      ],
      ['111hz', 'tone', '111 Hz tone', '111 Hz · Tone', '111 Hz · Tono'],
      ['174hz', 'tone', '174 Hz tone', '174 Hz · Tone', '174 Hz · Tono'],
      ['285hz', 'tone', '285 Hz tone', '285 Hz · Tone', '285 Hz · Tono'],
      ['396hz', 'tone', '396 Hz tone', '396 Hz · Tone', '396 Hz · Tono'],
      ['417hz', 'tone', '417 Hz tone', '417 Hz · Tone', '417 Hz · Tono'],
      ['432hz-tone', 'tone', '432 Hz tone', '432 Hz · Tone', '432 Hz · Tono'],
      ['528hz', 'tone', '528 Hz tone', '528 Hz · Tone', '528 Hz · Tono'],
      ['639hz', 'tone', '639 Hz tone', '639 Hz · Tone', '639 Hz · Tono'],
      ['741hz', 'tone', '741 Hz tone', '741 Hz · Tone', '741 Hz · Tono'],
      ['852hz', 'tone', '852 Hz tone', '852 Hz · Tone', '852 Hz · Tono'],
      ['963hz', 'tone', '963 Hz tone', '963 Hz · Tone', '963 Hz · Tono'],
      ['acoustic', 'production', 'acoustic production', 'Acoustic', 'Acústico'],
      [
        'analog',
        'production',
        'analog production',
        'Analog',
        'Producción analógica',
      ],
      [
        'electronic',
        'production',
        'electronic production',
        'Electronic',
        'Producción electrónica',
      ],
      ['lo-fi', 'production', 'lo-fi production', 'Lo-fi', 'Producción lo-fi'],
    ]),
  },
  {
    id: 'mood',
    label: { en: 'Mood and motion', es: 'Ánimo y movimiento' },
    chips: chips([
      ['calm', 'mood', 'calm', 'Calm', 'Calmado'],
      ['cinematic', 'mood', 'cinematic', 'Cinematic', 'Cinemático'],
      ['energetic', 'mood', 'energetic', 'Energetic', 'Enérgico'],
      ['intimate', 'mood', 'intimate', 'Intimate', 'Íntimo'],
      ['slow', 'tempo', 'slow tempo', 'Slow', 'Lento'],
      ['up-tempo', 'tempo', 'up-tempo', 'Up-tempo', 'Tempo rápido'],
      ['waltz', 'meter', '3/4 meter', '3/4 meter', 'Compás 3/4'],
    ]),
  },
  {
    id: 'context',
    label: { en: 'Era, region and language', es: 'Época, región e idioma' },
    chips: chips([
      ['contemporary', 'era', 'contemporary', 'Contemporary', 'Contemporáneo'],
      ['seventies', 'era', '1970s', '1970s', 'Años 70'],
      ['nineties', 'era', '1990s', '1990s', 'Años 90'],
      [
        'latin-america',
        'region',
        'Latin America',
        'Latin America',
        'Latinoamérica',
      ],
      ['nordic', 'region', 'Nordic', 'Nordic', 'Nórdico'],
      [
        'west-africa',
        'region',
        'West Africa',
        'West Africa',
        'África occidental',
      ],
      ['spanish', 'language', 'Spanish language', 'Spanish', 'En español'],
      ['english', 'language', 'English language', 'English', 'En inglés'],
      [
        'instrumental-language',
        'language',
        'no lyrics',
        'No lyrics',
        'Sin letra',
      ],
    ]),
  },
];

export const ALL_CHIPS = ONTOLOGY_SECTIONS.flatMap((section) => section.chips);

export function chipToTraitGroup(chip: OntologyChip): TraitGroup {
  return {
    category: chip.category,
    values: [chip.value],
    operator: 'AND',
    evidence: 'keyword-based',
  };
}

export const ONTOLOGY_PROMPT_SUMMARY = ONTOLOGY_SECTIONS.map(
  (section) =>
    `${section.id}: ${section.chips.map((chip) => chip.value).join(', ')}`,
).join('\n');
