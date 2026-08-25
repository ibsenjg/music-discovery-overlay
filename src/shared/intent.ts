import type {
  CandidateExample,
  CandidateQuery,
  Clarification,
  DiscoveryIntent,
  DiscoveryRoute,
  EvidenceItem,
  Locale,
  MusicRecommendation,
  NativeSpotifyFilters,
  RecommendationExample,
  RecommendationType,
  TargetType,
  TraitCategory,
  TraitGroup,
} from './types';

const TARGETS = new Set<TargetType>([
  'artist',
  'track',
  'album',
  'playlist',
  'genre',
  'mixed',
]);
const RECOMMENDATION_TYPES = new Set<RecommendationType>([
  'artist',
  'track',
  'album',
  'playlist',
  'genre',
]);
const LOCALES = new Set<Locale>(['en', 'es']);
const CATEGORIES = new Set<TraitCategory>([
  'instrument',
  'ensemble',
  'melodic-function',
  'harmony',
  'rhythm',
  'vocal-style',
  'tuning',
  'tone',
  'tempo',
  'meter',
  'mood',
  'era',
  'region',
  'language',
  'texture',
  'dynamics',
  'production',
]);

const NATIVE_FILTER_NAMES = [
  'artist',
  'album',
  'track',
  'genre',
  'year',
  'label',
] as const;

const RECOMMENDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'name', 'explanation', 'evidence', 'examples'],
  properties: {
    type: { enum: [...RECOMMENDATION_TYPES] },
    name: { type: 'string' },
    artist: { type: 'string' },
    explanation: { type: 'string' },
    evidence: { enum: ['keyword-based', 'ai-suggested'] },
    examples: {
      type: 'array',
      maxItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name'],
        properties: {
          type: { enum: [...RECOMMENDATION_TYPES] },
          name: { type: 'string' },
          artist: { type: 'string' },
        },
      },
    },
  },
} as const;

export const DISCOVERY_INTENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'target',
    'locale',
    'interpretation',
    'nativeFilters',
    'freeTextTerms',
    'traitGroups',
    'routes',
  ],
  properties: {
    target: { enum: [...TARGETS] },
    locale: { enum: [...LOCALES] },
    interpretation: { type: 'string' },
    nativeFilters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        artist: { type: 'string' },
        album: { type: 'string' },
        track: { type: 'string' },
        genre: { type: 'string' },
        year: { type: 'string', pattern: '^\\d{4}(?:-\\d{4})?$' },
        label: { type: 'string' },
        tag: { const: 'new' },
      },
    },
    freeTextTerms: {
      type: 'array',
      maxItems: 12,
      items: { type: 'string' },
    },
    traitGroups: {
      type: 'array',
      maxItems: 16,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'values', 'operator', 'evidence'],
        properties: {
          category: { enum: [...CATEGORIES] },
          values: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: { type: 'string' },
          },
          operator: { enum: ['AND', 'OR'] },
          evidence: { enum: ['keyword-based', 'ai-suggested'] },
        },
      },
    },
    routes: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'rationale', 'queryTerms', 'recommendations'],
        properties: {
          title: { type: 'string' },
          rationale: { type: 'string' },
          queryTerms: {
            type: 'array',
            maxItems: 8,
            items: { type: 'string' },
          },
          recommendations: {
            type: 'array',
            maxItems: 4,
            items: RECOMMENDATION_SCHEMA,
          },
        },
      },
    },
    clarification: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'frequency', 'options'],
      properties: {
        id: { const: 'frequency-meaning' },
        frequency: { type: 'number', minimum: 1, maximum: 30000 },
        options: {
          type: 'array',
          items: { enum: ['tuning', 'tone'] },
        },
      },
    },
  },
} as const;

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (
        character !== '<' && character !== '>' && (code >= 32 || code === 10)
      );
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanStringArray(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of value) {
    const text = cleanText(item, maxLength);
    if (!text) continue;
    const key = normalize(text);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(text);
    if (cleaned.length >= maxItems) break;
  }
  return cleaned;
}

function validateNativeFilters(value: unknown): NativeSpotifyFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const filters: NativeSpotifyFilters = {};
  for (const name of NATIVE_FILTER_NAMES) {
    const cleaned = cleanText(source[name], name === 'genre' ? 50 : 80);
    if (cleaned) filters[name] = cleaned;
  }
  if (source.tag === 'new') filters.tag = 'new';
  if (filters.year && !/^\d{4}(?:-\d{4})?$/.test(filters.year)) {
    delete filters.year;
  }
  return filters;
}

function validateTraitGroups(value: unknown): TraitGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 16)
    .map((group): TraitGroup | undefined => {
      if (!group || typeof group !== 'object' || Array.isArray(group)) {
        return undefined;
      }
      const source = group as Record<string, unknown>;
      if (!CATEGORIES.has(source.category as TraitCategory)) return undefined;
      const values = cleanStringArray(source.values, 8, 60);
      if (values.length === 0) return undefined;
      return {
        category: source.category as TraitCategory,
        values,
        operator: source.operator === 'OR' ? 'OR' : 'AND',
        evidence:
          source.evidence === 'ai-suggested' ? 'ai-suggested' : 'keyword-based',
      };
    })
    .filter((group): group is TraitGroup => Boolean(group));
}

function recommendationKey(
  type: RecommendationType,
  name: string,
  artist?: string,
): string {
  return `${type}|${normalize(name)}|${normalize(artist ?? '')}`;
}

function validateRecommendationExample(
  value: unknown,
): RecommendationExample | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  if (!RECOMMENDATION_TYPES.has(source.type as RecommendationType)) {
    return undefined;
  }
  const name = cleanText(source.name, 120);
  if (!name) return undefined;
  const artist = ['track', 'album'].includes(String(source.type))
    ? cleanText(source.artist, 100)
    : undefined;
  return {
    type: source.type as RecommendationType,
    name,
    ...(artist ? { artist } : {}),
  };
}

function validateRecommendation(
  value: unknown,
): MusicRecommendation | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  if (!RECOMMENDATION_TYPES.has(source.type as RecommendationType)) {
    return undefined;
  }
  const name = cleanText(source.name, 120);
  if (!name) return undefined;
  const artist = ['track', 'album'].includes(String(source.type))
    ? cleanText(source.artist, 100)
    : undefined;
  const explanation = cleanText(source.explanation, 280);
  if (!explanation) return undefined;

  const seenExamples = new Set<string>();
  const examples = (Array.isArray(source.examples) ? source.examples : [])
    .map(validateRecommendationExample)
    .filter((example): example is RecommendationExample => Boolean(example))
    .filter((example) => {
      const key = recommendationKey(example.type, example.name, example.artist);
      if (seenExamples.has(key)) return false;
      seenExamples.add(key);
      return true;
    })
    .slice(0, 2);

  return {
    type: source.type as RecommendationType,
    name,
    ...(artist ? { artist } : {}),
    explanation,
    evidence:
      source.evidence === 'keyword-based' ? 'keyword-based' : 'ai-suggested',
    examples,
  };
}

function validateRoutes(value: unknown, target: TargetType): DiscoveryRoute[] {
  if (!Array.isArray(value)) return [];
  const seenRoutes = new Set<string>();
  const seenEntities = new Set<string>();
  let recommendationCount = 0;
  const routes: DiscoveryRoute[] = [];

  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const title = cleanText(source.title, 100);
    const rationale = cleanText(source.rationale, 280);
    if (!title || !rationale) continue;
    const routeKey = normalize(title);
    if (seenRoutes.has(routeKey)) continue;
    seenRoutes.add(routeKey);

    const recommendations = (
      Array.isArray(source.recommendations) ? source.recommendations : []
    )
      .slice(0, 4)
      .map(validateRecommendation)
      .filter((recommendation): recommendation is MusicRecommendation =>
        Boolean(recommendation),
      )
      .filter((recommendation) => {
        if (target !== 'mixed' && recommendation.type !== target) return false;
        if (recommendationCount >= 6) return false;
        const key = recommendationKey(
          recommendation.type,
          recommendation.name,
          recommendation.artist,
        );
        if (seenEntities.has(key)) return false;
        seenEntities.add(key);
        recommendationCount += 1;
        return true;
      });

    routes.push({
      title,
      rationale,
      queryTerms: cleanStringArray(source.queryTerms, 8, 80),
      recommendations,
    });
  }

  const seenExamples = new Set<string>();
  for (const route of routes) {
    for (const recommendation of route.recommendations) {
      recommendation.examples = recommendation.examples.filter((example) => {
        const exampleKey = recommendationKey(
          example.type,
          example.name,
          example.artist,
        );
        if (seenEntities.has(exampleKey) || seenExamples.has(exampleKey)) {
          return false;
        }
        seenExamples.add(exampleKey);
        return true;
      });
    }
  }
  return routes;
}

function validateClarification(value: unknown): Clarification | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  const frequency = Number(source.frequency);
  if (
    source.id !== 'frequency-meaning' ||
    !Number.isFinite(frequency) ||
    frequency < 1 ||
    frequency > 30000
  ) {
    return undefined;
  }
  return {
    id: 'frequency-meaning',
    frequency,
    options: ['tuning', 'tone'],
  };
}

export function validateDiscoveryIntent(
  value: unknown,
  fallbackLocale: Locale,
): DiscoveryIntent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Intent must be an object');
  }
  const source = value as Record<string, unknown>;
  const target = TARGETS.has(source.target as TargetType)
    ? (source.target as TargetType)
    : 'mixed';
  const locale = LOCALES.has(source.locale as Locale)
    ? (source.locale as Locale)
    : fallbackLocale;
  return {
    target,
    locale,
    mode: 'ai',
    interpretation:
      cleanText(source.interpretation, 300) ??
      (locale === 'es'
        ? 'Búsqueda musical exploratoria'
        : 'Exploratory music discovery'),
    nativeFilters: validateNativeFilters(source.nativeFilters),
    freeTextTerms: cleanStringArray(source.freeTextTerms, 12, 80),
    traitGroups: validateTraitGroups(source.traitGroups),
    routes: validateRoutes(source.routes, target),
    clarification: validateClarification(source.clarification),
  };
}

export function resolveFrequencyClarification(
  intent: DiscoveryIntent,
  choice: 'tuning' | 'tone',
): DiscoveryIntent {
  if (!intent.clarification) return intent;
  const { frequency } = intent.clarification;
  const category = choice === 'tuning' ? 'tuning' : 'tone';
  const value =
    choice === 'tuning' ? `A4=${frequency} Hz tuning` : `${frequency} Hz tone`;
  return {
    ...intent,
    clarification: undefined,
    traitGroups: [
      ...intent.traitGroups.filter(
        (group) =>
          !group.values.some((item) => item.includes(String(frequency))),
      ),
      {
        category,
        values: [value],
        operator: 'AND',
        evidence: 'keyword-based',
      },
    ],
    routes: intent.routes.map((route, index) =>
      index === 0
        ? {
            ...route,
            queryTerms: [
              ...route.queryTerms.filter(
                (term) => !term.includes(String(frequency)),
              ),
              value,
            ],
          }
        : route,
    ),
  };
}

function quote(value: string): string {
  return `"${value.replaceAll('"', '').trim()}"`;
}

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? quote(value) : value.replaceAll('"', '');
}

function nativeTokens(filters: NativeSpotifyFilters): string[] {
  const tokens: string[] = [];
  for (const name of NATIVE_FILTER_NAMES) {
    const value = filters[name];
    if (value) tokens.push(`${name}:${quoteIfNeeded(value)}`);
  }
  if (filters.tag === 'new') tokens.push('tag:new');
  return tokens;
}

function trimQuery(parts: string[], maxLength = 200): string {
  const result: string[] = [];
  for (const part of parts.map((item) => item.trim()).filter(Boolean)) {
    const candidate = [...result, part].join(' ').trim();
    if (candidate.length > maxLength) break;
    result.push(part);
  }
  return result.join(' ').trim();
}

function recommendationTitle(
  recommendation: Pick<MusicRecommendation, 'name' | 'artist'>,
): string {
  return recommendation.artist
    ? `${recommendation.name} — ${recommendation.artist}`
    : recommendation.name;
}

function compileEntityQuery(
  entity: Pick<MusicRecommendation, 'type' | 'name' | 'artist'>,
): string {
  switch (entity.type) {
    case 'artist':
      return entity.name.slice(0, 200).trim();
    case 'track':
    case 'album':
      return recommendationTitle(entity).slice(0, 200).trim();
    case 'genre':
    case 'playlist':
      return entity.name.slice(0, 200).trim();
  }
}

function compileExamples(
  examples: RecommendationExample[],
  candidateId: string,
): CandidateExample[] {
  return examples.map((example, index) => ({
    id: `${candidateId}-example-${index + 1}`,
    entityType: example.type,
    title: recommendationTitle(example),
    query: compileEntityQuery(example),
  }));
}

function routeFallbackTerms(
  intent: DiscoveryIntent,
  route: DiscoveryRoute,
): string[] {
  const terms = [
    ...route.queryTerms,
    ...intent.traitGroups.flatMap((group) => group.values),
    ...intent.freeTextTerms,
  ];
  const seen = new Set<string>();
  return terms.filter((term) => {
    const key = normalize(term);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compileContextualRouteQuery(
  intent: DiscoveryIntent,
  route: DiscoveryRoute,
): string {
  const native = nativeTokens(intent.nativeFilters);
  const terms = routeFallbackTerms(intent, route);
  if (terms.length === 1 && !/\s/.test(terms[0] ?? '')) {
    terms[0] = `${terms[0]} ${route.title}`;
  }
  return trimQuery([...native, ...terms.map(quoteIfNeeded)]);
}

function routeEvidence(
  intent: DiscoveryIntent,
  kind: 'keyword-based' | 'ai-suggested',
  nativeSupported = false,
): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  if (nativeSupported || Object.keys(intent.nativeFilters).length > 0) {
    evidence.push({ kind: 'spotify-supported', label: 'Native search filter' });
  }
  evidence.push({
    kind,
    label:
      kind === 'ai-suggested'
        ? 'Exploratory recommendation'
        : intent.mode === 'guided'
          ? 'Guided local association'
          : 'Exploratory search keyword',
  });
  return evidence;
}

export function compileCandidateQueries(
  intent: DiscoveryIntent,
): CandidateQuery[] {
  const fallbackRoute: DiscoveryRoute = {
    title:
      intent.locale === 'es'
        ? 'Interpretación contextual'
        : 'Contextual interpretation',
    rationale: intent.interpretation,
    queryTerms: [],
    recommendations: [],
  };
  const routes = intent.routes.length > 0 ? intent.routes : [fallbackRoute];
  const candidates: CandidateQuery[] = [];
  const seenQueries = new Set<string>();

  for (const [routeIndex, route] of routes.entries()) {
    const routeId = `route-${routeIndex + 1}`;
    const candidateCountBeforeRoute = candidates.length;
    for (const recommendation of route.recommendations) {
      if (candidates.length >= 6) break;
      const query = compileEntityQuery(recommendation);
      const normalizedQuery = normalize(query);
      if (!query || seenQueries.has(normalizedQuery)) continue;
      seenQueries.add(normalizedQuery);
      const id = `${routeId}-recommendation-${candidates.length + 1}`;
      const nativeSupported = ['artist', 'track', 'album', 'genre'].includes(
        recommendation.type,
      );
      candidates.push({
        id,
        routeId,
        routeTitle: route.title,
        routeRationale: route.rationale,
        entityType: recommendation.type,
        title: recommendationTitle(recommendation),
        query,
        explanation: recommendation.explanation,
        evidence: routeEvidence(
          intent,
          recommendation.evidence,
          nativeSupported,
        ),
        exploratory: true,
        examples: compileExamples(recommendation.examples, id),
      });
    }

    if (
      candidates.length === candidateCountBeforeRoute &&
      candidates.length < 6
    ) {
      const query = compileContextualRouteQuery(intent, route);
      const normalizedQuery = normalize(query);
      if (query && !seenQueries.has(normalizedQuery)) {
        seenQueries.add(normalizedQuery);
        candidates.push({
          id: `${routeId}-search`,
          routeId,
          routeTitle: route.title,
          routeRationale: route.rationale,
          entityType: 'search',
          title: route.title,
          query,
          explanation: route.rationale,
          evidence: routeEvidence(intent, 'keyword-based'),
          exploratory: true,
          examples: [],
        });
      }
    }
  }

  return candidates.slice(0, 6);
}
