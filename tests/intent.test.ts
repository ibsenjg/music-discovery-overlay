import {
  compileCandidateQueries,
  resolveFrequencyClarification,
  validateDiscoveryIntent,
} from '../src/shared/intent';
import type { DiscoveryIntent } from '../src/shared/types';

function intent(overrides: Partial<DiscoveryIntent> = {}): DiscoveryIntent {
  return {
    target: 'mixed',
    locale: 'en',
    mode: 'ai',
    interpretation: 'Find complementary music starting points.',
    nativeFilters: {},
    freeTextTerms: [],
    traitGroups: [],
    routes: [],
    ...overrides,
  };
}

describe('discovery intent validation and compilation', () => {
  it('removes unknown fields and unsafe markup from structured routes', () => {
    const validated = validateDiscoveryIntent(
      {
        target: 'artist',
        locale: 'en',
        interpretation: '<b>Artists with melodic piano</b>',
        nativeFilters: { genre: '<script>jazz</script>', secret: 'no' },
        freeTextTerms: ['<img src=x> melodic piano'],
        traitGroups: [
          {
            category: 'instrument',
            values: ['piano<script>'],
            operator: 'AND',
            evidence: 'ai-suggested',
            html: '<b>bad</b>',
          },
        ],
        routes: [
          {
            title: '<b>Piano trios</b>',
            rationale: 'Piano and bass share the melodic work.',
            queryTerms: ['piano trio', 'Piano   Trio'],
            secret: 'drop me',
            recommendations: [
              {
                type: 'artist',
                name: '<i>GoGo Penguin</i>',
                explanation: 'A piano-led contemporary trio.',
                evidence: 'ai-suggested',
                examples: [
                  { type: 'track', name: '<b>Hopopono</b>', extra: 'drop' },
                ],
                action: 'click-play',
              },
            ],
          },
        ],
        injectedAction: 'click-play',
      },
      'en',
    );

    expect(validated).toEqual({
      target: 'artist',
      locale: 'en',
      mode: 'ai',
      interpretation: 'bArtists with melodic piano/b',
      nativeFilters: { genre: 'scriptjazz/script' },
      freeTextTerms: ['img src=x melodic piano'],
      traitGroups: [
        {
          category: 'instrument',
          values: ['pianoscript'],
          operator: 'AND',
          evidence: 'ai-suggested',
        },
      ],
      routes: [
        {
          title: 'bPiano trios/b',
          rationale: 'Piano and bass share the melodic work.',
          queryTerms: ['piano trio'],
          recommendations: [
            {
              type: 'artist',
              name: 'iGoGo Penguin/i',
              explanation: 'A piano-led contemporary trio.',
              evidence: 'ai-suggested',
              examples: [{ type: 'track', name: 'bHopopono/b' }],
            },
          ],
        },
      ],
      clarification: undefined,
    });
  });

  it('rejects non-object output', () => {
    expect(() => validateDiscoveryIntent('bad', 'en')).toThrow(
      'Intent must be an object',
    );
  });

  it('deduplicates routes, entities, and examples while enforcing global limits', () => {
    const recommendations = Array.from({ length: 8 }, (_, index) => ({
      type: 'artist',
      name: index === 1 ? '  ARTIST 0 ' : `Artist ${index}`,
      explanation: `Distinct explanation ${index}`,
      evidence: 'ai-suggested',
      examples: [
        { type: 'track', name: 'Shared Track', artist: 'Artist 0' },
        { type: 'track', name: ' shared   track ', artist: 'artist 0' },
      ],
    }));
    const validated = validateDiscoveryIntent(
      {
        target: 'artist',
        locale: 'en',
        interpretation: 'Find artists.',
        nativeFilters: {},
        freeTextTerms: [],
        traitGroups: [],
        routes: [
          {
            title: 'Route one',
            rationale: 'First route.',
            queryTerms: ['piano bass'],
            recommendations: recommendations.slice(0, 4),
          },
          {
            title: ' route   one ',
            rationale: 'Duplicate route.',
            queryTerms: ['duplicate'],
            recommendations: [],
          },
          {
            title: 'Route two',
            rationale: 'Second route.',
            queryTerms: ['soul piano'],
            recommendations: recommendations.slice(4),
          },
        ],
      },
      'en',
    );

    expect(validated.routes).toHaveLength(2);
    expect(
      validated.routes.flatMap((route) => route.recommendations),
    ).toHaveLength(6);
    expect(
      validated.routes.flatMap((route) =>
        route.recommendations.flatMap(
          (recommendation) => recommendation.examples,
        ),
      ),
    ).toHaveLength(1);
  });

  it('reserves primary entities before deduplicating earlier secondary examples', () => {
    const validated = validateDiscoveryIntent(
      {
        target: 'mixed',
        locale: 'en',
        interpretation: 'Find complementary artists and tracks.',
        nativeFilters: {},
        freeTextTerms: [],
        traitGroups: [],
        routes: [
          {
            title: 'Artist route',
            rationale: 'Start with an artist.',
            queryTerms: [],
            recommendations: [
              {
                type: 'artist',
                name: 'Example Artist',
                explanation: 'A useful artist starting point.',
                evidence: 'ai-suggested',
                examples: [
                  {
                    type: 'track',
                    name: 'Shared Track',
                    artist: 'Example Artist',
                  },
                ],
              },
            ],
          },
          {
            title: 'Track route',
            rationale: 'Keep the explicitly proposed track primary.',
            queryTerms: [],
            recommendations: [
              {
                type: 'track',
                name: 'Shared Track',
                artist: 'Example Artist',
                explanation: 'The track is also an intended primary result.',
                evidence: 'ai-suggested',
                examples: [],
              },
            ],
          },
        ],
      },
      'en',
    );

    expect(validated.routes.flatMap((route) => route.recommendations)).toEqual([
      expect.objectContaining({ type: 'artist', name: 'Example Artist' }),
      expect.objectContaining({ type: 'track', name: 'Shared Track' }),
    ]);
    expect(validated.routes[0]?.recommendations[0]?.examples).toEqual([]);
  });

  it('keeps an explicitly requested entity type primary and falls back contextually when needed', () => {
    const validated = validateDiscoveryIntent(
      {
        target: 'artist',
        locale: 'en',
        interpretation: 'Find piano-led artists.',
        nativeFilters: {},
        freeTextTerms: ['piano bass melody'],
        traitGroups: [],
        routes: [
          {
            title: 'Piano-led route',
            rationale: 'Artists are the requested result.',
            queryTerms: ['piano-led melodic bass'],
            recommendations: [
              {
                type: 'track',
                name: 'Wrong primary type',
                artist: 'Example Artist',
                explanation: 'This track must not remain primary.',
                evidence: 'ai-suggested',
                examples: [],
              },
            ],
          },
        ],
      },
      'en',
    );
    expect(validated.routes[0]?.recommendations).toEqual([]);
    const candidates = compileCandidateQueries(validated);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.entityType).toBe('search');
    expect(candidates[0]?.query).toContain('piano-led melodic bass');
  });

  it('compiles named entities as human-readable Spotify searches', () => {
    const candidates = compileCandidateQueries(
      intent({
        routes: [
          {
            title: 'Typed entities',
            rationale: 'Try exact entity searches.',
            queryTerms: [],
            recommendations: [
              {
                type: 'artist',
                name: 'GoGo Penguin',
                explanation: 'Piano-led trio.',
                evidence: 'ai-suggested',
                examples: [
                  {
                    type: 'track',
                    name: 'Hopopono',
                    artist: 'GoGo Penguin',
                  },
                ],
              },
              {
                type: 'track',
                name: 'Time Moves Slow',
                artist: 'BADBADNOTGOOD',
                explanation: 'Melodic bass and keys.',
                evidence: 'ai-suggested',
                examples: [],
              },
              {
                type: 'album',
                name: 'Seven Seas',
                artist: 'Avishai Cohen',
                explanation: 'Piano and bass interplay.',
                evidence: 'ai-suggested',
                examples: [],
              },
              {
                type: 'genre',
                name: 'contemporary jazz',
                explanation: 'Useful stylistic route.',
                evidence: 'ai-suggested',
                examples: [],
              },
              {
                type: 'playlist',
                name: 'Piano and bass interplay',
                explanation: 'Exploratory playlist phrase.',
                evidence: 'ai-suggested',
                examples: [],
              },
              {
                type: 'track',
                name: 'Uncredited musical clue',
                explanation: 'Useful even without a known artist.',
                evidence: 'ai-suggested',
                examples: [],
              },
            ],
          },
        ],
      }),
    );

    expect(candidates.map((candidate) => candidate.query)).toEqual([
      'GoGo Penguin',
      'Time Moves Slow — BADBADNOTGOOD',
      'Seven Seas — Avishai Cohen',
      'contemporary jazz',
      'Piano and bass interplay',
      'Uncredited musical clue',
    ]);
    expect(candidates[0]?.examples[0]?.query).toBe('Hopopono — GoGo Penguin');
  });

  it('compiles an entity-free route as one contextual exploratory search', () => {
    const candidates = compileCandidateQueries(
      intent({
        mode: 'guided',
        freeTextTerms: ['piano bass melody'],
        routes: [
          {
            title: 'Related ensemble',
            rationale: 'Keep the roles connected.',
            queryTerms: ['piano trio melodic bass'],
            recommendations: [],
          },
        ],
      }),
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.query).toContain('piano trio melodic bass');
    expect(candidates[0]?.query).not.toBe('piano');
    expect(candidates[0]?.query).not.toBe('bass');
    expect(candidates[0]?.evidence).toContainEqual(
      expect.objectContaining({ kind: 'keyword-based' }),
    );
  });

  it('resolves an ambiguous frequency in traits and the first route', () => {
    const resolved = resolveFrequencyClarification(
      intent({
        target: 'track',
        traitGroups: [
          {
            category: 'tuning',
            values: ['432 Hz'],
            operator: 'AND',
            evidence: 'keyword-based',
          },
        ],
        routes: [
          {
            title: 'Frequency route',
            rationale: 'Clarify the intended use.',
            queryTerms: ['432 Hz piano'],
            recommendations: [],
          },
        ],
        clarification: {
          id: 'frequency-meaning',
          frequency: 432,
          options: ['tuning', 'tone'],
        },
      }),
      'tuning',
    );
    expect(resolved.clarification).toBeUndefined();
    expect(resolved.traitGroups).toEqual([
      expect.objectContaining({
        category: 'tuning',
        values: ['A4=432 Hz tuning'],
      }),
    ]);
    expect(resolved.routes[0]?.queryTerms).toContain('A4=432 Hz tuning');
  });

  it('limits generated queries to 200 characters', () => {
    const candidates = compileCandidateQueries(
      intent({
        freeTextTerms: Array.from(
          { length: 12 },
          (_, index) => `very long discovery phrase number ${index}`,
        ),
      }),
    );
    expect(candidates[0]?.query.length).toBeLessThanOrEqual(200);
  });
});
