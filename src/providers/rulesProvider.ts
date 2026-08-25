import { ALL_CHIPS } from '../shared/ontology';
import { validateDiscoveryIntent } from '../shared/intent';
import type {
  DiscoveryIntent,
  DiscoveryRoute,
  IntentProvider,
  Locale,
  ParseOptions,
  ProviderUsage,
  TargetType,
  TraitCategory,
  TraitGroup,
} from '../shared/types';

interface TraitMatcher {
  category: TraitCategory;
  value: string;
  pattern: RegExp;
}

const TRAIT_MATCHERS: TraitMatcher[] = [
  {
    category: 'instrument',
    value: 'double bass',
    pattern: /\b(?:double bass|upright bass|contrabajo)\b/i,
  },
  {
    category: 'instrument',
    value: 'bass',
    pattern: /\b(?:electric bass|bass guitar|bajo el[eé]ctrico|bass|bajo)\b/i,
  },
  { category: 'instrument', value: 'piano', pattern: /\bpiano\b/i },
  {
    category: 'instrument',
    value: 'trumpet',
    pattern: /\b(?:trumpet|trompeta)\b/i,
  },
  {
    category: 'instrument',
    value: 'violin',
    pattern: /\b(?:violin|viol[ií]n)\b/i,
  },
  {
    category: 'instrument',
    value: 'guitar',
    pattern: /\b(?:guitar|guitarra)\b/i,
  },
  {
    category: 'instrument',
    value: 'saxophone',
    pattern: /\b(?:saxophone|saxof[oó]n|saxo)\b/i,
  },
  {
    category: 'instrument',
    value: 'drums',
    pattern: /\b(?:drums?|bater[ií]a)\b/i,
  },
  {
    category: 'instrument',
    value: 'percussion',
    pattern: /\b(?:percussion|percusi[oó]n)\b/i,
  },
  {
    category: 'instrument',
    value: 'cello',
    pattern: /\b(?:cello|violonchelo)\b/i,
  },
  {
    category: 'instrument',
    value: 'flute',
    pattern: /\b(?:flute|flauta)\b/i,
  },
  {
    category: 'instrument',
    value: 'synthesizer',
    pattern: /\b(?:synth(?:esizer)?|sintetizador)\b/i,
  },
  {
    category: 'melodic-function',
    value: 'melodic',
    pattern: /\b(?:melody|melodic|melod[ií]a|mel[oó]dico|mel[oó]dica)\b/i,
  },
  {
    category: 'melodic-function',
    value: 'counterpoint',
    pattern: /\b(?:counterpoint|contrapunto)\b/i,
  },
  {
    category: 'harmony',
    value: 'harmonic',
    pattern: /\b(?:harmony|harmonic|armon[ií]a|arm[oó]nico|arm[oó]nica)\b/i,
  },
  {
    category: 'rhythm',
    value: 'rhythmic',
    pattern: /\b(?:rhythm|rhythmic|ritmo|r[ií]tmico|r[ií]tmica)\b/i,
  },
  {
    category: 'rhythm',
    value: 'groove',
    pattern: /\b(?:groove|groovy)\b/i,
  },
  {
    category: 'vocal-style',
    value: 'instrumental',
    pattern: /\b(?:instrumental|without vocals|sin voz|sin voces)\b/i,
  },
  {
    category: 'vocal-style',
    value: 'wordless vocal',
    pattern:
      /\b(?:wordless vocals?|vocals? without words?|no lyrics|vo(?:z|ces) sin palabras|sin letras?)\b/i,
  },
  {
    category: 'vocal-style',
    value: 'lead vocal',
    pattern: /\b(?:lead vocal|vocals?|singer|voz|voces|cantante)\b/i,
  },
  {
    category: 'ensemble',
    value: 'duo',
    pattern: /\b(?:duo|d[uú]o)\b/i,
  },
  {
    category: 'ensemble',
    value: 'trio',
    pattern: /\b(?:trio|tr[ií]o)\b/i,
  },
  {
    category: 'ensemble',
    value: 'quartet',
    pattern: /\b(?:quartet|cuarteto)\b/i,
  },
  {
    category: 'production',
    value: 'acoustic production',
    pattern: /\b(?:acoustic|ac[uú]stic[oa])\b/i,
  },
  {
    category: 'production',
    value: 'electronic production',
    pattern: /\b(?:electronic|electr[oó]nic[oa])\b/i,
  },
  {
    category: 'production',
    value: 'analog production',
    pattern: /\b(?:analog|anal[oó]gic[oa])\b/i,
  },
  {
    category: 'mood',
    value: 'calm',
    pattern: /\b(?:calm|calmado|calmada|tranquil[oa])\b/i,
  },
  {
    category: 'mood',
    value: 'cinematic',
    pattern: /\b(?:cinematic|cinem[aá]tic[oa])\b/i,
  },
  {
    category: 'mood',
    value: 'energetic',
    pattern: /\b(?:energetic|en[eé]rgic[oa])\b/i,
  },
  {
    category: 'mood',
    value: 'intimate',
    pattern: /\b(?:intimate|[ií]ntim[oa])\b/i,
  },
  {
    category: 'era',
    value: 'contemporary',
    pattern: /\b(?:contemporary|modern|contempor[aá]ne[oa]|moderno|moderna)\b/i,
  },
  {
    category: 'era',
    value: '1970s',
    pattern: /\b(?:1970s|70s|seventies|a[nñ]os 70)\b/i,
  },
  {
    category: 'era',
    value: '1990s',
    pattern: /\b(?:1990s|90s|nineties|a[nñ]os 90)\b/i,
  },
  {
    category: 'region',
    value: 'Latin America',
    pattern: /\b(?:latin america|latinoam[eé]rica|latinoamericana?)\b/i,
  },
  {
    category: 'region',
    value: 'Nordic',
    pattern: /\b(?:nordic|n[oó]rdic[oa])\b/i,
  },
  {
    category: 'region',
    value: 'West Africa',
    pattern: /\b(?:west afric|[aá]frica occidental)\w*\b/i,
  },
  {
    category: 'language',
    value: 'Spanish language',
    pattern: /\b(?:in spanish|spanish lyrics|en espa[nñ]ol)\b/i,
  },
  {
    category: 'language',
    value: 'English language',
    pattern: /\b(?:in english|english lyrics|en ingl[eé]s)\b/i,
  },
];

const TARGET_PATTERNS: Array<[TargetType, RegExp]> = [
  ['track', /\b(?:songs?|tracks?|canciones?|temas?)\b/i],
  ['album', /\b(?:albums?|[aá]lbumes?)\b/i],
  ['playlist', /\b(?:playlists?|listas? de reproducci[oó]n)\b/i],
  ['genre', /\b(?:genres?|g[eé]neros?|styles?|estilos?)\b/i],
  ['artist', /\b(?:artists?|artistas?|musicians?|m[uú]sicos?)\b/i],
];

const TARGET_REQUEST_PATTERNS: Array<[TargetType, RegExp]> = [
  [
    'artist',
    /\b(?:find|show|recommend|encuentr\w*|busc\w*|recomiend\w*)\b.{0,32}\b(?:artists?|artistas?|musicians?|m[uú]sicos?)\b/i,
  ],
  [
    'track',
    /\b(?:find|show|recommend|encuentr\w*|busc\w*|recomiend\w*)\b.{0,32}\b(?:songs?|tracks?|canciones?|temas?)\b/i,
  ],
  [
    'album',
    /\b(?:find|show|recommend|encuentr\w*|busc\w*|recomiend\w*)\b.{0,32}\b(?:albums?|[aá]lbumes?)\b/i,
  ],
  [
    'playlist',
    /\b(?:find|show|recommend|encuentr\w*|busc\w*|recomiend\w*)\b.{0,32}\b(?:playlists?|listas? de reproducci[oó]n)\b/i,
  ],
  [
    'genre',
    /\b(?:find|show|recommend|encuentr\w*|busc\w*|recomiend\w*)\b.{0,32}\b(?:genres?|g[eé]neros?|styles?|estilos?)\b/i,
  ],
];

const COMBINED_TARGET_PATTERN =
  /\b(?:artists?|artistas?|songs?|tracks?|canciones?|albums?|[aá]lbumes?|playlists?|genres?|g[eé]neros?)\b\s*(?:,|and|y|or|o)\s*\b(?:artists?|artistas?|songs?|tracks?|canciones?|albums?|[aá]lbumes?|playlists?|genres?|g[eé]neros?)\b/i;

const NATIVE_PATTERN =
  /\b(artist|album|track|genre|year|label):(?:"([^"]+)"|([^\s]+))/gi;

const KNOWN_FREQUENCY_PATTERN =
  /\b(111|174|285|396|415|417|430|432|440|442|528|639|741|852|963)\s*(?:hz|hercios?)\b/i;

function detectTarget(text: string): TargetType {
  if (COMBINED_TARGET_PATTERN.test(text)) return 'mixed';
  const earliestMatch = (
    patterns: Array<[TargetType, RegExp]>,
    useMatchEnd: boolean,
  ): TargetType | undefined => {
    let earliest: { target: TargetType; position: number } | undefined;
    for (const [target, pattern] of patterns) {
      const match = pattern.exec(text);
      if (!match) continue;
      const position = match.index + (useMatchEnd ? match[0].length : 0);
      if (!earliest || position < earliest.position) {
        earliest = { target, position };
      }
    }
    return earliest?.target;
  };
  return (
    earliestMatch(TARGET_REQUEST_PATTERNS, true) ??
    earliestMatch(TARGET_PATTERNS, false) ??
    'mixed'
  );
}

function detectNativeFilters(text: string): DiscoveryIntent['nativeFilters'] {
  const nativeFilters: DiscoveryIntent['nativeFilters'] = {};
  for (const match of text.matchAll(NATIVE_PATTERN)) {
    const name = match[1]?.toLowerCase() as
      'artist' | 'album' | 'track' | 'genre' | 'year' | 'label';
    nativeFilters[name] = match[2] ?? match[3] ?? '';
  }
  if (/\btag:new\b/i.test(text)) nativeFilters.tag = 'new';
  return nativeFilters;
}

function detectFrequency(text: string): {
  group?: TraitGroup;
  clarification?: DiscoveryIntent['clarification'];
} {
  const match = text.match(KNOWN_FREQUENCY_PATTERN);
  if (!match) return {};
  const frequency = Number(match[1]);
  if (/\b(?:tuning|tuned|afinaci[oó]n|afinado)\b/i.test(text)) {
    return {
      group: {
        category: 'tuning',
        values: [`A4=${frequency} Hz tuning`],
        operator: 'AND',
        evidence: 'keyword-based',
      },
    };
  }
  if (/\b(?:tone|frequency|tono|frecuencia)\b/i.test(text)) {
    return {
      group: {
        category: 'tone',
        values: [`${frequency} Hz tone`],
        operator: 'AND',
        evidence: 'keyword-based',
      },
    };
  }
  return {
    group: {
      category: 'tuning',
      values: [`${frequency} Hz`],
      operator: 'AND',
      evidence: 'keyword-based',
    },
    clarification: {
      id: 'frequency-meaning',
      frequency,
      options: ['tuning', 'tone'],
    },
  };
}

function detectMatchedTraits(text: string): TraitGroup[] {
  const textWithoutSpecificBass = text.replace(
    /\b(?:double bass|upright bass|contrabajo)\b/gi,
    '',
  );
  const textWithoutWordlessVoice = text.replace(
    /\b(?:wordless vocals?|vocals? without words?|no lyrics|vo(?:z|ces) sin palabras|sin letras?)\b/gi,
    '',
  );
  const matches = TRAIT_MATCHERS.filter((matcher) =>
    matcher.pattern.test(
      matcher.category === 'instrument' && matcher.value === 'bass'
        ? textWithoutSpecificBass
        : matcher.category === 'vocal-style' && matcher.value === 'lead vocal'
          ? textWithoutWordlessVoice
          : text,
    ),
  );
  const instrumentMatches = matches.filter(
    (matcher) => matcher.category === 'instrument',
  );
  const instrumentSpans = instrumentMatches
    .map((matcher) => {
      const match = matcher.pattern.exec(text);
      return match
        ? {
            start: match.index,
            end: match.index + match[0].length,
            value: matcher.value,
          }
        : undefined;
    })
    .filter((span) => span !== undefined)
    .sort((first, second) => first.start - second.start);
  const alternativeInstruments = new Set<string>();
  instrumentSpans.forEach((span, index) => {
    const next = instrumentSpans[index + 1];
    if (!next || !/\b(?:or|o)\b/i.test(text.slice(span.end, next.start))) {
      return;
    }
    alternativeInstruments.add(span.value);
    alternativeInstruments.add(next.value);
    for (
      let previousIndex = index - 1;
      previousIndex >= 0;
      previousIndex -= 1
    ) {
      const previous = instrumentSpans[previousIndex];
      const following = instrumentSpans[previousIndex + 1];
      if (!/^\s*,\s*$/.test(text.slice(previous.end, following.start))) break;
      alternativeInstruments.add(previous.value);
    }
  });
  const groups = matches.map((matcher): TraitGroup => ({
    category: matcher.category,
    values: [matcher.value],
    operator:
      matcher.category === 'instrument' &&
      alternativeInstruments.has(matcher.value)
        ? 'OR'
        : 'AND',
    evidence: 'keyword-based',
  }));

  const lower = text.toLocaleLowerCase();
  const lowerWithoutSpecificBass = textWithoutSpecificBass.toLocaleLowerCase();
  for (const chip of ALL_CHIPS) {
    const searchableText =
      chip.category === 'instrument' && chip.value === 'bass'
        ? lowerWithoutSpecificBass
        : lower;
    if (
      chip.category !== 'tuning' &&
      searchableText.includes(chip.value.toLocaleLowerCase()) &&
      !groups.some(
        (group) =>
          group.category === chip.category && group.values.includes(chip.value),
      )
    ) {
      groups.push({
        category: chip.category,
        values: [chip.value],
        operator: 'AND',
        evidence: 'keyword-based',
      });
    }
  }
  return groups;
}

function mergeTraitGroups(groups: TraitGroup[]): TraitGroup[] {
  const merged = new Map<string, TraitGroup>();
  for (const group of groups) {
    const key = `${group.category}:${group.operator}:${group.evidence}`;
    const existing = merged.get(key);
    if (existing) {
      existing.values = [...new Set([...existing.values, ...group.values])];
    } else {
      merged.set(key, { ...group, values: [...group.values] });
    }
  }
  return [...merged.values()];
}

function valuesFor(groups: TraitGroup[], category: TraitCategory): string[] {
  return groups
    .filter((group) => group.category === category)
    .flatMap((group) => group.values);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function phrase(values: string[]): string {
  return unique(values).join(' ').trim();
}

function guidedCopy(locale: Locale) {
  return locale === 'es'
    ? {
        literalTitle: 'Lectura literal contextualizada',
        literalRationale:
          'Mantiene juntos los instrumentos, funciones y matices pedidos en una sola búsqueda útil.',
        ensembleTitle: 'Formato de conjunto relacionado',
        ensembleRationale:
          'Explora un formato donde esos instrumentos pueden compartir función melódica y rítmica.',
        contextTitle: 'Estilo y función musical',
        contextRationale:
          'Amplía la petición hacia un contexto musical relacionado sin inventar artistas ni canciones.',
        unknownTitle: 'Búsqueda guiada contextual',
        unknownRationale:
          'Conserva la petición completa como una búsqueda exploratoria en vez de separarla en palabras aisladas.',
      }
    : {
        literalTitle: 'Contextual literal reading',
        literalRationale:
          'Keeps the requested instruments, roles, and nuances together in one useful search.',
        ensembleTitle: 'Related ensemble format',
        ensembleRationale:
          'Explores an ensemble where those instruments can share melodic and rhythmic roles.',
        contextTitle: 'Style and musical function',
        contextRationale:
          'Broadens the request into a related musical context without inventing artists or tracks.',
        unknownTitle: 'Contextual guided search',
        unknownRationale:
          'Keeps the complete request as one exploratory search instead of splitting it into isolated words.',
      };
}

function route(
  title: string,
  rationale: string,
  queryTerms: string[],
): DiscoveryRoute {
  return {
    title,
    rationale,
    queryTerms: unique(queryTerms),
    recommendations: [],
  };
}

function buildGuidedRoutes(
  text: string,
  locale: Locale,
  traitGroups: TraitGroup[],
): DiscoveryRoute[] {
  const copy = guidedCopy(locale);
  const instruments = valuesFor(traitGroups, 'instrument');
  const melodic = valuesFor(traitGroups, 'melodic-function');
  const harmony = valuesFor(traitGroups, 'harmony');
  const rhythm = valuesFor(traitGroups, 'rhythm');
  const ensembles = valuesFor(traitGroups, 'ensemble');
  const voice = valuesFor(traitGroups, 'vocal-style');
  const context = unique([
    ...valuesFor(traitGroups, 'production'),
    ...valuesFor(traitGroups, 'mood'),
    ...valuesFor(traitGroups, 'tempo'),
    ...valuesFor(traitGroups, 'meter'),
    ...valuesFor(traitGroups, 'era'),
    ...valuesFor(traitGroups, 'region'),
    ...valuesFor(traitGroups, 'language'),
    ...valuesFor(traitGroups, 'tuning'),
    ...valuesFor(traitGroups, 'tone'),
  ]);
  const roles = unique([...melodic, ...harmony, ...rhythm]);
  const meaningful = unique([
    ...instruments,
    ...roles,
    ...ensembles,
    ...voice,
    ...context,
  ]);

  if (meaningful.length === 0) {
    return [route(copy.unknownTitle, copy.unknownRationale, [text])];
  }

  const bassFamily = instruments.find((value) =>
    ['bass', 'double bass'].includes(value),
  );
  if (instruments.includes('piano') && bassFamily && melodic.length > 0) {
    return [
      route(copy.literalTitle, copy.literalRationale, [
        phrase(['piano', bassFamily, 'duo', 'melodic', ...context]),
      ]),
      route(copy.ensembleTitle, copy.ensembleRationale, [
        phrase(['piano trio', 'melodic', bassFamily, ...ensembles]),
      ]),
      route(copy.contextTitle, copy.contextRationale, [
        phrase([
          'piano-led',
          'instrumental',
          'contemporary jazz',
          'melodic bass',
          ...context,
        ]),
      ]),
    ];
  }

  const literal = phrase(meaningful);
  const routes = [route(copy.literalTitle, copy.literalRationale, [literal])];

  if (instruments.length >= 2) {
    routes.push(
      route(copy.ensembleTitle, copy.ensembleRationale, [
        phrase([
          instruments[0] ?? '',
          instruments[1] ?? '',
          ensembles[0] ?? 'duo',
          roles[0] ?? 'interplay',
          voice[0] ?? '',
        ]),
      ]),
    );
  } else if (instruments.length === 1) {
    routes.push(
      route(copy.ensembleTitle, copy.ensembleRationale, [
        phrase([
          `${instruments[0]}-led`,
          ensembles[0] ?? 'small ensemble',
          roles[0] ?? 'melodic',
          voice[0] ?? '',
        ]),
      ]),
    );
  }

  const styleAssociation = instruments.includes('synthesizer')
    ? 'electronic ambient'
    : instruments.some((value) => ['violin', 'cello'].includes(value))
      ? 'contemporary chamber'
      : instruments.some((value) => ['trumpet', 'saxophone'].includes(value))
        ? 'modern jazz ensemble'
        : instruments.includes('guitar') && voice.includes('lead vocal')
          ? 'organic singer-songwriter'
          : 'contemporary instrumental';
  routes.push(
    route(copy.contextTitle, copy.contextRationale, [
      phrase([
        instruments[0] ?? '',
        styleAssociation,
        roles[0] ?? '',
        context[0] ?? '',
      ]),
    ]),
  );

  return routes.slice(0, 3);
}

function interpretationFor(
  locale: Locale,
  target: TargetType,
  traitGroups: TraitGroup[],
): string {
  const traits = unique(traitGroups.flatMap((group) => group.values));
  const targetLabel: Record<TargetType, Record<Locale, string>> = {
    artist: { en: 'artists', es: 'artistas' },
    track: { en: 'tracks', es: 'canciones' },
    album: { en: 'albums', es: 'álbumes' },
    playlist: { en: 'playlists', es: 'playlists' },
    genre: { en: 'genres', es: 'géneros' },
    mixed: {
      en: 'a mix of music results',
      es: 'una mezcla de resultados musicales',
    },
  };
  if (locale === 'es') {
    return traits.length > 0
      ? `Buscar ${targetLabel[target].es} relacionando ${traits.join(', ')}.`
      : `Buscar ${targetLabel[target].es} conservando el contexto de la petición.`;
  }
  return traits.length > 0
    ? `Find ${targetLabel[target].en} by relating ${traits.join(', ')}.`
    : `Find ${targetLabel[target].en} while preserving the request context.`;
}

export function parseWithRules(
  text: string,
  locale: Locale,
  selectedTraits: TraitGroup[] = [],
): DiscoveryIntent {
  const frequency = detectFrequency(text);
  const nativeFilters = detectNativeFilters(text);
  const traitGroups = mergeTraitGroups([
    ...selectedTraits,
    ...detectMatchedTraits(text),
    ...(frequency.group ? [frequency.group] : []),
  ]);
  const cleaned = text
    .replace(NATIVE_PATTERN, ' ')
    .replace(/\btag:new\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const target = detectTarget(text);
  const validated = validateDiscoveryIntent(
    {
      target,
      locale,
      interpretation: interpretationFor(locale, target, traitGroups),
      nativeFilters,
      freeTextTerms: cleaned ? [cleaned] : [],
      traitGroups,
      routes: buildGuidedRoutes(cleaned, locale, traitGroups),
      clarification: frequency.clarification,
    },
    locale,
  );
  return { ...validated, mode: 'guided' };
}

export class RulesProvider implements IntentProvider {
  readonly id = 'rules' as const;
  readonly label = 'Guided discovery';

  async capabilities() {
    return { text: 'available', audio: 'unavailable' } as const;
  }

  async prepare() {
    return this.capabilities();
  }

  async parseText(text: string, options: ParseOptions) {
    return parseWithRules(text, options.locale, options.selectedTraits);
  }

  usage(): ProviderUsage {
    return { providerName: this.label };
  }

  dispose(): void {
    // No resources are retained.
  }
}
